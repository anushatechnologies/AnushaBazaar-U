import React, { useState, useRef, useEffect } from "react";
import {
  StyleSheet,
  View,
  Text,
  StatusBar,
  RefreshControl,
  FlatList,
  TouchableOpacity,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";

import DeliveryHeader from "../components/DeliveryHeader";
import SearchOverlay from "../components/SearchOverlay";
import AnimatedSearchTrigger from "../components/AnimatedSearchTrigger";
import CategoryTabs from "../components/CategoryTabs";
import CategoryGrid from "../components/CategoryGrid";
import TrendingList from "../components/TrendingList";
import BannerCarousel from "../components/BannerCarousel";
import ProductCard from "../components/ProductCard";
import BestSellerSection from "../components/BestSellerSection";
import FloatingCart from "../components/FloatingCart";
import AllProductsFeed from "../components/AllProductsFeed";
import { useAuth } from "../context/AuthContext";
import { useLocation } from "../context/LocationContext";
import { useAppPermissions } from "../hooks/useAppPermissions";
import * as ExpoLocation from "expo-location";
import { useNavigation, CompositeNavigationProp } from "@react-navigation/native";
import { BottomTabNavigationProp } from "@react-navigation/bottom-tabs";
import { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { RootTabParamList } from "../navigation/BottomTabs";
import { RootStackParamList } from "../navigation/RootStack";
import { useSafeAreaInsets } from "react-native-safe-area-context";

type HomeScreenNavigationProp = CompositeNavigationProp<
  BottomTabNavigationProp<RootTabParamList, "Home">,
  NativeStackNavigationProp<RootStackParamList>
>;

const HomeScreen = () => {
  const navigation = useNavigation<HomeScreenNavigationProp>();
  const { user } = useAuth();
  const { setLocation, hasPermission, checkPermission } = useLocation();
  const { requestLocationPermission } = useAppPermissions();
  const insets = useSafeAreaInsets();
  
  const [refreshing, setRefreshing] = useState(false);
  const [filter, setFilter] = useState("All");
  const lastScrollY = useRef(0);
  
  const [showSearch, setShowSearch] = useState(false);

  useEffect(() => {
    handleInitialPermission();
  }, []);

  const handleInitialPermission = async () => {
    try {
      const currentStatus = await checkPermission();
      if (!currentStatus) {
        const status = await requestLocationPermission();
        if (status === 'granted') {
          await checkPermission();
          const currentLocation = await ExpoLocation.getCurrentPositionAsync({
            accuracy: ExpoLocation.Accuracy.Balanced,
          });
          
          if (currentLocation) {
            const [addressResult] = await ExpoLocation.reverseGeocodeAsync({
              latitude: currentLocation.coords.latitude,
              longitude: currentLocation.coords.longitude,
            });

            const formattedAddress = addressResult 
              ? `${addressResult.name || ''}, ${addressResult.district || ''}, ${addressResult.city || ''}`
              : "Current Location";

            setLocation({
              latitude: currentLocation.coords.latitude,
              longitude: currentLocation.coords.longitude,
              address: formattedAddress,
            });
          }
        }
      }
    } catch (error) {
      console.error("Error in handleInitialPermission:", error);
    }
  };

  const onRefresh = () => {
    setRefreshing(true);
    setTimeout(() => setRefreshing(false), 1500);
  };

  const handleScroll = (e: any) => {
    lastScrollY.current = e.nativeEvent.contentOffset.y;
  };

  const sections = [
    { key: "sticky_header" }, 
    { key: "banner" },
    { key: "categories" },
    { key: "trending" },
    { key: "bestSeller" },
    { key: "orderAgain" },
    { key: "allProducts" },
  ];

  const renderSection = ({ item }: any) => {
    switch (item.key) {
      case "sticky_header":
        return (
          <View style={styles.stickyHeaderWrapper}>
            <AnimatedSearchTrigger onPress={() => setShowSearch(true)} />
            <CategoryTabs onChange={setFilter} />
          </View>
        );
      case "banner":
        return <BannerCarousel />;
      case "categories":
        return (
          <>
            <SectionTitle
              title="Shop by Category"
              onPress={() => navigation.navigate("Categories")}
            />
            <CategoryGrid />
          </>
        );
      case "trending":
        return (
          <>
            <SectionTitle
              title="Trending Now 🔥"
              onPress={() => navigation.navigate("Trending")}
            />
            <TrendingList filter={filter} />
          </>
        );
      case "orderAgain":
        if (!user) return null;
        return (
          <>
            <SectionTitle
              title="Order Again"
              onPress={() => navigation.navigate("Order Again")}
            />
            <FlatList
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={{ paddingLeft: 16, paddingRight: 8 }}
              data={[
                { id: "1", name: "Fortune Soya Health Oil", price: 135, oldPrice: 155, icon: "https://www.jiomart.com/images/product/original/490000072/fortune-soya-health-refined-soyabean-oil-1-l-pouch-product-images-o490000072-p490000072-0-202203151213.jpg", unit: "1 L" },
                { id: "2", name: "Aashirvaad Atta", price: 210, oldPrice: 240, icon: "https://www.bigbasket.com/media/uploads/p/l/126906_8-aashirvaad-atta-whole-wheat.jpg", unit: "5 kg" }
              ]}
              keyExtractor={(item) => item.id}
              renderItem={({ item }) => (
                <View style={{ width: 140, marginRight: 12 }}>
                  <ProductCard product={item} />
                </View>
              )}
            />
          </>
        );
      case "bestSeller":
        return (
          <>
            <SectionTitle
              title="Best Sellers ⭐"
              onPress={() => navigation.navigate("Trending")}
            />
            <BestSellerSection />
          </>
        );
      case "allProducts":
        return <AllProductsFeed categoryFilter={filter} />;
      default:
        return null;
    }
  };

  return (
    <View style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor="transparent" translucent />
      
      <FlatList
        data={sections}
        keyExtractor={(item) => item.key}
        renderItem={renderSection}
        showsVerticalScrollIndicator={false}
        stickyHeaderIndices={[0]} 
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            progressViewOffset={insets.top + 60}
          />
        }
        ListHeaderComponent={
          <View style={styles.headerWrapper}>
            <DeliveryHeader />
          </View>
        }
        contentContainerStyle={{ paddingBottom: 120 }}
        onScroll={handleScroll}
        scrollEventThrottle={16}
      />

      <SearchOverlay isVisible={showSearch} onClose={() => setShowSearch(false)} />
      <FloatingCart currentRoute="Home" />
    </View>
  );
};

const SectionTitle = ({ title, onPress }: any) => (
  <TouchableOpacity 
    style={styles.sectionHeader} 
    onPress={onPress}
    activeOpacity={0.7}
  >
    <Text style={styles.sectionTitle}>{title}</Text>
    <Text style={styles.viewAll}>View All</Text>
  </TouchableOpacity>
);

export default HomeScreen;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#f9fdfb",
  },
  headerWrapper: {
    backgroundColor: "#F8D66D",
  },
  stickyHeaderWrapper: {
    backgroundColor: "#FFF",
    paddingTop: 8,
    borderBottomWidth: 1,
    borderBottomColor: "#F1F5F9",
    elevation: 3,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 5,
  },
  sectionHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginHorizontal: 18,
    marginTop: 25,
    marginBottom: 12,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: "700",
    color: "#111",
  },
  viewAll: {
    color: "#0A8754",
    fontWeight: "600",
  },
});