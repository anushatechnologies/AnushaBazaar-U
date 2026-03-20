import React, { useState, useRef } from "react";
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
import { useNavigation, CompositeNavigationProp } from "@react-navigation/native";
import { BottomTabNavigationProp } from "@react-navigation/bottom-tabs";
import { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { RootTabParamList } from "../navigation/BottomTabs";
import { RootStackParamList } from "../navigation/RootStack";
// import { useTabBar } from "../context/TabBarContext";

type HomeScreenNavigationProp = CompositeNavigationProp<
  BottomTabNavigationProp<RootTabParamList, "Home">,
  NativeStackNavigationProp<RootStackParamList>
>;

const HomeScreen = () => {
  const navigation = useNavigation<HomeScreenNavigationProp>();
  const { user } = useAuth();
  // const { onScrollUp, onScrollDown } = useTabBar();
  const [refreshing, setRefreshing] = useState(false);
  const [filter, setFilter] = useState("All");
  const lastScrollY = useRef(0);
  
  // Search overlay state
  const [showSearch, setShowSearch] = useState(false);

  const onRefresh = () => {
    setRefreshing(true);
    setTimeout(() => setRefreshing(false), 1500);
  };

  const handleScroll = (e: any) => {
    const currentY = e.nativeEvent.contentOffset.y;
    /* if (currentY > lastScrollY.current + 5) {
      // Scrolling down (content moving up)
      onScrollUp();
    } else if (currentY < lastScrollY.current - 5) {
      // Scrolling up (content moving down)
      onScrollDown();
    } */
    lastScrollY.current = currentY;
  };

  const sections = [
    { key: "banner" },
    { key: "categories" },
    { key: "trending" },
    { key: "bestSeller" },
    { key: "orderAgain" },
    { key: "allProducts" },
  ];

  const renderSection = ({ item }: any) => {
    switch (item.key) {
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
        if (!user) return null; // Only show if logged in
        return (
          <>
            <SectionTitle
              title="Order Again"
              onPress={() => navigation.navigate("Order Again")}
            />
            {/* Simple horizontal list for recent items */}
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
      <FlatList
        data={sections}
        keyExtractor={(item) => item.key}
        renderItem={renderSection}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
          />
        }
        ListHeaderComponent={
          <View style={styles.headerWrapper}>
            <DeliveryHeader />
      {/* Tappable search bar — opens SearchOverlay */}
          <AnimatedSearchTrigger onPress={() => setShowSearch(true)} />
            <CategoryTabs onChange={setFilter} />
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