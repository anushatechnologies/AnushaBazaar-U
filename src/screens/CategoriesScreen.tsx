import React, { useState, useEffect, useRef, useCallback } from "react";
import {
  View,
  Text,
  StyleSheet,
  Image,
  Pressable,
  ActivityIndicator,
  ScrollView,
  Dimensions,
} from "react-native";
import { useNavigation, useFocusEffect } from "@react-navigation/native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import DeliveryHeader from "../components/DeliveryHeader";
import SearchBar from "../components/SearchBar";
import ProductCard from "../components/ProductCard";
import AppLoader from "../components/AppLoader";
import BannerCarousel from "../components/BannerCarousel";
import { getCategories } from "../services/api/categories";
import { useTabBar } from "../context/TabBarContext";
import FloatingCart from "../components/FloatingCart";
import { scale } from "../utils/responsive";
import { Ionicons } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";

const { width: screenWidth } = Dimensions.get("window");

const CategoriesScreen = () => {
  const navigation = useNavigation<any>();
  const insets = useSafeAreaInsets();
  const { onScrollUp, onScrollDown } = useTabBar();
  const lastScrollY = useRef(0);
  
  const [categories, setCategories] = useState<any[]>([]);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);
  const [productResults, setProductResults] = useState<any[]>([]);
  const [isSearching, setIsSearching] = useState(false);

  // Reset tab bar to visible every time this screen gains focus
  useFocusEffect(
    useCallback(() => {
      lastScrollY.current = 0;
      onScrollDown();
    }, [onScrollDown])
  );

  const handleScroll = (e: any) => {
    const currentY = e.nativeEvent.contentOffset.y;
    if (currentY > 10 && currentY > lastScrollY.current + 5) onScrollUp();
    else if (currentY < lastScrollY.current - 5 || currentY <= 0) onScrollDown();
    lastScrollY.current = currentY;
  };

  useEffect(() => { loadData(); }, []);

  useEffect(() => {
    if (!search.trim()) {
      setProductResults([]);
      setIsSearching(false);
    }
  }, [search]);

  const loadData = async () => {
    setLoading(true);
    try {
      const catData = await getCategories();
      const cats = Array.isArray(catData) ? catData : catData?.data || [];
      
      let flatCats: any[] = [];
      if (cats.length > 0 && cats[0].items && Array.isArray(cats[0].items)) {
        cats.forEach((s: any) => { flatCats = flatCats.concat(s.items); });
      } else {
        flatCats = cats;
      }
      
      setCategories(flatCats);
    } catch (e) {
      console.error("Error loading categories:", e);
    } finally {
      setLoading(false);
    }
  };

  const handleCategoryPress = (item: any) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    navigation.navigate("SubCategories", { category: item });
  };

  return (
    <View style={styles.root}>
      <DeliveryHeader />
      
      <SearchBar
        value={search}
        onChangeText={setSearch}
        onSuggestions={(data) => {
          setProductResults(data);
          if (search.trim()) setIsSearching(true);
        }}
        onLoading={setIsSearching}
        onSearch={(q) => {
          if (q.trim()) navigation.navigate("SearchResults", { query: q });
        }}
        placeholder="Search for categories or products..."
      />

      {loading ? (
        <View style={styles.loader}>
          <AppLoader size="large" />
          <Text style={styles.loaderText}>Loading categories…</Text>
        </View>
      ) : search.trim() ? (
        // ----- SEARCH RESULTS VIEW ----- //
        <ScrollView
          showsVerticalScrollIndicator={false}
          contentContainerStyle={{ padding: scale(14), paddingBottom: scale(100) }}
          onScroll={handleScroll}
          scrollEventThrottle={16}
        >
          <Text style={styles.subTitle}>
            Search Results {productResults.length > 0 ? `(${productResults.length})` : ""}
          </Text>
          {isSearching && productResults.length === 0 ? (
            <View style={{ padding: scale(20), alignItems: "center" }}>
              <ActivityIndicator size="small" color="#0A8754" />
            </View>
          ) : productResults.length > 0 ? (
            <View style={styles.productGrid}>
              {productResults.map((item, idx) => (
                 <View 
                   key={item.id || idx} 
                   style={{ width: "48%", marginBottom: scale(12), marginLeft: idx % 2 !== 0 ? "4%" : 0 }}
                 >
                   <ProductCard product={item} />
                 </View>
              ))}
            </View>
          ) : (
            <View style={styles.empty}>
              <Ionicons name="search-outline" size={scale(48)} color="#ccc" />
              <Text style={styles.emptyTitle}>No results found</Text>
            </View>
          )}
        </ScrollView>
      ) : (
        // ----- ZEPTO STYLE ALL CATEGORIES VIEW ----- //
        <ScrollView
          showsVerticalScrollIndicator={false}
          contentContainerStyle={{ paddingBottom: scale(100) }}
          onScroll={handleScroll}
          scrollEventThrottle={16}
        >
          <View style={{ marginTop: scale(10) }}>
            <BannerCarousel />
          </View>

          <View style={styles.sectionContainer}>
            <Text style={styles.sectionTitle}>Explore Categories</Text>
            
            <View style={styles.categoryGrid}>
              {categories.map((item, index) => {
                const imageUrl = item.image || item.imageUrl || item.icon;
                const isLocalImage = typeof imageUrl === "number";

                return (
                  <Pressable
                    key={(item.id || item._id || index).toString()}
                    style={({ pressed }) => [
                      styles.categoryCardWrapper,
                      pressed && { opacity: 0.8, transform: [{ scale: 0.98 }] }
                    ]}
                    onPress={() => handleCategoryPress(item)}
                  >
                    <View style={styles.categoryImageContainer}>
                      {imageUrl ? (
                        <Image
                          source={isLocalImage ? imageUrl : { uri: imageUrl }}
                          style={styles.categoryImage}
                        />
                      ) : (
                        <Text style={{ fontSize: scale(22) }}>🛒</Text>
                      )}
                    </View>
                    <Text style={styles.categoryText} numberOfLines={2}>
                      {item.name || item.title || "Category"}
                    </Text>
                  </Pressable>
                );
              })}
            </View>
          </View>
          
        </ScrollView>
      )}
      <FloatingCart currentRoute="Categories" />
    </View>
  );
};

export default CategoriesScreen;

/* ─── Styles ─── */
const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: "#fff",
  },
  loader: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    gap: scale(10),
  },
  loaderText: {
    color: "#888",
    fontSize: scale(14),
    fontWeight: "500",
  },
  
  /* --- ZEPTO STYLE ALL CATEGORIES --- */
  sectionContainer: {
    paddingHorizontal: scale(14),
    marginTop: scale(24),
    paddingBottom: scale(20),
    backgroundColor: "#fff",
  },
  sectionTitle: {
    fontSize: scale(18),
    fontWeight: "800",
    color: "#111827",
    marginBottom: scale(16),
    letterSpacing: -0.3,
  },
  categoryGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "flex-start",
  },
  categoryCardWrapper: {
    width: "25%", // EXACTLY 4 COLUMN GRID just like Zepto
    alignItems: "center",
    marginBottom: scale(20),
  },
  categoryImageContainer: {
    width: screenWidth * 0.20,
    height: screenWidth * 0.20,
    borderRadius: scale(18),
    backgroundColor: "#F3F5F7",
    justifyContent: "center",
    alignItems: "center",
    padding: scale(6),
    marginBottom: scale(6),
    // Soft shadow for premium feel
    shadowColor: "#000",
    shadowOpacity: 0.04,
    shadowOffset: { width: 0, height: scale(4) },
    shadowRadius: scale(8),
    elevation: 2,
  },
  categoryImage: {
    width: "90%",
    height: "90%",
    resizeMode: "contain",
  },
  categoryText: {
    fontSize: scale(10),
    fontWeight: "600",
    color: "#374151",
    textAlign: "center",
    lineHeight: scale(13),
    width: "95%",
  },

  /* search styles */
  subTitle: {
    fontSize: scale(15),
    fontWeight: "700",
    color: "#444",
    marginBottom: scale(12),
  },
  productGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "flex-start",
  },
  empty: {
    alignItems: "center",
    paddingTop: scale(60),
    paddingBottom: scale(30),
  },
  emptyTitle: {
    fontSize: scale(17),
    fontWeight: "700",
    color: "#333",
    marginTop: scale(12),
  },
});
