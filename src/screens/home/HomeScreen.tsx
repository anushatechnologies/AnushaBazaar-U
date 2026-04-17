import React, { useState, useRef, useEffect, useCallback } from "react";
import {
  StyleSheet,
  View,
  Text,
  StatusBar,
  RefreshControl,
  FlatList,
  Animated,
  Pressable,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";

import DeliveryHeader from "../../components/DeliveryHeader";
import SearchOverlay from "../../components/SearchOverlay";
import AnimatedSearchTrigger from "../../components/AnimatedSearchTrigger";
import CategoryTabs from "../../components/CategoryTabs";
import CategoryGrid from "../../components/CategoryGrid";
import TrendingList from "../../components/TrendingList";
import BannerCarousel from "../../components/BannerCarousel";
import ProductCard from "../../components/ProductCard";
import BestSellerSection from "../../components/BestSellerSection";
import FloatingCart from "../../components/FloatingCart";
import AllProductsFeed, { AllProductsFeedHandle } from "../../components/AllProductsFeed";
import { useAuth } from "../../context/AuthContext";
import { useLocation } from "../../context/LocationContext";
import { useAppPermissions } from "../../hooks/useAppPermissions";
import * as ExpoLocation from "expo-location";
import { useNavigation, CompositeNavigationProp, useFocusEffect } from "@react-navigation/native";
import { BottomTabNavigationProp } from "@react-navigation/bottom-tabs";
import { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { RootTabParamList } from "../../navigation/BottomTabs";
import { RootStackParamList } from "../../navigation/RootStack";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useTabBar } from "../../context/TabBarContext";
import { scale } from "../../utils/responsive";

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
  const { onScrollDown } = useTabBar();
  
  // Reset tab bar to visible every time Home gains focus
  useFocusEffect(
    useCallback(() => {
      onScrollDown();
    }, [onScrollDown])
  );

  // Scroll to top when Home tab is pressed while already on Home
  useEffect(() => {
    const unsubscribe = navigation.addListener('tabPress', (e: any) => {
      // Only scroll if we're already focused on Home
      if (navigation.isFocused()) {
        flatListRef.current?.scrollToOffset({ offset: 0, animated: true });
      }
    });
    return unsubscribe;
  }, [navigation]);
  
  const [refreshing, setRefreshing] = useState(false);
  const [filter, setFilter] = useState("All");
  const [headerHeight, setHeaderHeight] = useState(150);
  const scrollY = useRef(new Animated.Value(0)).current;
  const flatListRef = useRef<FlatList>(null);
  const feedRef = useRef<AllProductsFeedHandle>(null);
  
  const [showSearch, setShowSearch] = useState(false);
  const [showSearchVoice, setShowSearchVoice] = useState(false);
  const [refreshKey, setRefreshKey] = useState(0);
  const [floatingSearchVisible, setFloatingSearchVisible] = useState(false);

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
    setRefreshKey(prev => prev + 1);
    setTimeout(() => setRefreshing(false), 1500);
  };

  const handleScroll = Animated.event(
    [{ nativeEvent: { contentOffset: { y: scrollY } } }],
    {
      useNativeDriver: true,
      listener: (event: any) => {
        const y = event.nativeEvent.contentOffset.y;
        const threshold = headerHeight + 10;
        setFloatingSearchVisible(y > threshold);
      },
    }
  );

  const sections = [
    { key: "sticky_header" }, 
    { key: `banner_${refreshKey}` },
    { key: `categories_${refreshKey}` },
    { key: `trending_${refreshKey}_${filter}` },
    { key: `bestSeller_${refreshKey}_${filter}` },
    { key: `allProducts_${refreshKey}_${filter}` },
  ];

  const renderSection = ({ item }: any) => {
    // Break off the raw key prefix ignoring the suffix
    const baseKey = item.key.split('_')[0];
    
    // For sticky header we don't apply the prefix trick
    if (item.key === "sticky_header") {
      return (
        <View style={styles.stickyHeaderWrapper}>
          <AnimatedSearchTrigger 
            onPress={() => { setShowSearch(true); setShowSearchVoice(false); }} 
            onMicPress={() => { setShowSearch(true); setShowSearchVoice(true); }}
          />
          <CategoryTabs onChange={setFilter} />
        </View>
      );
    }
    
    switch (baseKey) {
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
      case "bestSeller":
        return (
          <>
            <SectionTitle
              title="Best Sellers ⭐"
              onPress={() => navigation.navigate("Trending")}
            />
            <BestSellerSection filter={filter} />
          </>
        );
      case "allProducts":
        return <AllProductsFeed ref={feedRef} categoryFilter={filter} />;
      default:
        return null;
    }
  };

  return (
    <View style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor="transparent" translucent />
      
      <Animated.FlatList
        ref={flatListRef}
        data={sections}
        keyExtractor={(item) => item.key}
        renderItem={renderSection}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            progressViewOffset={insets.top + 60}
          />
        }
        ListHeaderComponent={
          <View 
            style={styles.headerWrapper}
            onLayout={(e) => setHeaderHeight(e.nativeEvent.layout.height)}
          >
            <View style={{ position: "absolute", top: -scale(1000), left: 0, right: 0, height: scale(1000), backgroundColor: "#F8D66D" }} />
            <DeliveryHeader />
          </View>
        }
        contentContainerStyle={{ paddingBottom: 120 }}
        onScroll={handleScroll}
        scrollEventThrottle={16}
        onEndReached={() => {
          if (feedRef.current?.hasMore() && !feedRef.current?.isLoadingMore()) {
            feedRef.current.loadMore();
          }
        }}
        onEndReachedThreshold={0.3}
      />

      <Animated.View 
        pointerEvents={floatingSearchVisible ? "auto" : "none"}
        style={[
          styles.floatingSearch, 
          { 
            transform: [{
              translateY: scrollY.interpolate({
                inputRange: [Math.max(0, headerHeight + 10), headerHeight + 60],
                outputRange: [-100, 0],
                extrapolate: 'clamp'
              })
            }],
            opacity: scrollY.interpolate({
              inputRange: [Math.max(0, headerHeight + 10), headerHeight + 60],
              outputRange: [0, 1],
              extrapolate: 'clamp'
            })
          }
        ]}
      >
        <View style={[styles.stickyHeaderWrapper, { paddingTop: insets.top + 8 }]}>
          <AnimatedSearchTrigger 
            onPress={() => { setShowSearch(true); setShowSearchVoice(false); }} 
            onMicPress={() => { setShowSearch(true); setShowSearchVoice(true); }}
          />
          <CategoryTabs onChange={setFilter} />
        </View>
      </Animated.View>

      <SearchOverlay 
        isVisible={showSearch} 
        onClose={() => { setShowSearch(false); setShowSearchVoice(false); }} 
        initialVoiceMode={showSearchVoice}
      />
      <FloatingCart currentRoute="Home" />
    </View>
  );
};

const SectionTitle = React.memo(({ title, onPress }: any) => (
  <Pressable 
    style={styles.sectionHeader} 
    onPress={onPress}
  >
    <Text style={styles.sectionTitle}>{title}</Text>
    <Text style={styles.viewAll}>View All</Text>
  </Pressable>
));

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
    paddingTop: scale(8),
    borderBottomWidth: 1,
    borderBottomColor: "#F1F5F9",
    elevation: 3,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: scale(2) },
    shadowOpacity: 0.05,
    shadowRadius: scale(5),
  },
  floatingSearch: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    zIndex: 999,
  },
  sectionHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginHorizontal: scale(18),
    marginTop: scale(25),
    marginBottom: scale(12),
  },
  sectionTitle: {
    fontSize: scale(18),
    fontWeight: "700",
    color: "#111",
  },
  viewAll: {
    color: "#0A8754",
    fontWeight: "600",
    fontSize: scale(14),
  },
});
