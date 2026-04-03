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
  Animated,
} from "react-native";
import { useNavigation, useFocusEffect } from "@react-navigation/native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import DeliveryHeader from "../components/DeliveryHeader";
import SearchBar from "../components/SearchBar";
import ProductCard from "../components/ProductCard";
import AppLoader from "../components/AppLoader";
import { getCategories } from "../services/api/categories";
import { useTabBar } from "../context/TabBarContext";
import FloatingCart from "../components/FloatingCart";
import { scale } from "../utils/responsive";
import { Ionicons } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";

const { width: screenWidth } = Dimensions.get("window");
const CARD_WIDTH = (screenWidth - scale(14) * 2 - scale(12) * 3) / 4;

// Curated pastel palette for category cards
const CARD_COLORS = [
  "#EEF8F0", "#FFF3E6", "#EDF2FF", "#FFF0F3",
  "#F0EDFF", "#E6F7F5", "#FFF8E6", "#F5E6FF",
  "#E6FFF0", "#FFE6EE", "#E6EEFF", "#FFFBE6",
];

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

  // Animate cards on load
  const fadeAnim = useRef(new Animated.Value(0)).current;

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

  useEffect(() => {
    loadData();
  }, []);

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
        cats.forEach((s: any) => {
          flatCats = flatCats.concat(s.items);
        });
      } else {
        flatCats = cats;
      }

      setCategories(flatCats);

      // Animate in
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 400,
        useNativeDriver: true,
      }).start();
    } catch (e) {
      console.error("Error loading categories:", e);
    } finally {
      setLoading(false);
    }
  };

  const handleCategoryPress = (item: any) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    // Navigate directly to CategoryProducts — skip SubCategories
    navigation.navigate("CategoryProducts", {
      category: item,
      initialSubCategoryId: "all",
    });
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
        /* ─── SEARCH RESULTS ─── */
        <ScrollView
          showsVerticalScrollIndicator={false}
          contentContainerStyle={{ padding: scale(14), paddingBottom: scale(100) }}
          onScroll={handleScroll}
          scrollEventThrottle={16}
        >
          <Text style={styles.subTitle}>
            Search Results{" "}
            {productResults.length > 0 ? `(${productResults.length})` : ""}
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
                  style={{
                    width: "48%",
                    marginBottom: scale(12),
                    marginLeft: idx % 2 !== 0 ? "4%" : 0,
                  }}
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
        /* ─── ALL CATEGORIES GRID ─── */
        <Animated.ScrollView
          showsVerticalScrollIndicator={false}
          contentContainerStyle={{ paddingBottom: scale(100) }}
          onScroll={handleScroll}
          scrollEventThrottle={16}
          style={{ opacity: fadeAnim }}
        >
          {/* Section Header */}
          <View style={styles.sectionHeader}>
            <View style={styles.sectionHeaderRow}>
              <View style={styles.sectionDot} />
              <Text style={styles.sectionTitle}>Shop by Category</Text>
            </View>
            <Text style={styles.sectionSubtitle}>
              {categories.length} categories available
            </Text>
          </View>

          {/* Category Grid */}
          <View style={styles.categoryGrid}>
            {categories.map((item, index) => {
              const imageUrl = item.image || item.imageUrl || item.icon;
              const isLocalImage = typeof imageUrl === "number";
              const bgColor = CARD_COLORS[index % CARD_COLORS.length];

              return (
                <Pressable
                  key={(item.id || item._id || index).toString()}
                  style={({ pressed }) => [
                    styles.categoryCard,
                    pressed && {
                      opacity: 0.85,
                      transform: [{ scale: 0.95 }],
                    },
                  ]}
                  onPress={() => handleCategoryPress(item)}
                >
                  <View
                    style={[
                      styles.categoryImageBox,
                      { backgroundColor: bgColor },
                    ]}
                  >
                    {imageUrl ? (
                      <Image
                        source={isLocalImage ? imageUrl : { uri: imageUrl }}
                        style={styles.categoryImage}
                      />
                    ) : (
                      <View style={styles.placeholderIcon}>
                        <Ionicons
                          name="grid-outline"
                          size={scale(24)}
                          color="#9CA3AF"
                        />
                      </View>
                    )}
                  </View>
                  <Text style={styles.categoryName} numberOfLines={2}>
                    {item.name || item.title || "Category"}
                  </Text>
                </Pressable>
              );
            })}
          </View>
        </Animated.ScrollView>
      )}

      <FloatingCart currentRoute="Categories" />
    </View>
  );
};

export default CategoriesScreen;

/* ─── STYLES ─── */
const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: "#FAFBFC",
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

  /* ─── Section Header ─── */
  sectionHeader: {
    paddingHorizontal: scale(18),
    paddingTop: scale(22),
    paddingBottom: scale(14),
  },
  sectionHeaderRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: scale(8),
  },
  sectionDot: {
    width: scale(4),
    height: scale(20),
    borderRadius: scale(2),
    backgroundColor: "#0A8754",
  },
  sectionTitle: {
    fontSize: scale(20),
    fontWeight: "900",
    color: "#111827",
    letterSpacing: -0.5,
  },
  sectionSubtitle: {
    fontSize: scale(12),
    fontWeight: "500",
    color: "#9CA3AF",
    marginTop: scale(4),
    marginLeft: scale(12),
  },

  /* ─── Category Grid ─── */
  categoryGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    paddingHorizontal: scale(14),
  },
  categoryCard: {
    width: "25%",
    alignItems: "center",
    marginBottom: scale(20),
    paddingHorizontal: scale(3),
  },
  categoryImageBox: {
    width: CARD_WIDTH,
    height: CARD_WIDTH,
    borderRadius: scale(18),
    justifyContent: "center",
    alignItems: "center",
    padding: scale(8),
    marginBottom: scale(8),
    // Soft elevated look
    shadowColor: "#000",
    shadowOpacity: 0.06,
    shadowOffset: { width: 0, height: scale(4) },
    shadowRadius: scale(10),
    elevation: 3,
    borderWidth: 1,
    borderColor: "rgba(0,0,0,0.03)",
  },
  categoryImage: {
    width: "88%",
    height: "88%",
    resizeMode: "contain",
  },
  placeholderIcon: {
    width: "100%",
    height: "100%",
    justifyContent: "center",
    alignItems: "center",
  },
  categoryName: {
    fontSize: scale(10.5),
    fontWeight: "700",
    color: "#374151",
    textAlign: "center",
    lineHeight: scale(14),
    width: "100%",
  },

  /* ─── Search ─── */
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
