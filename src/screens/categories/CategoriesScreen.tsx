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
import DeliveryHeader from "../../components/DeliveryHeader";
import SearchBar from "../../components/SearchBar";
import ProductCard from "../../components/ProductCard";
import { getCategories } from "../../services/api/categories";
import { useTabBar } from "../../context/TabBarContext";
import FloatingCart from "../../components/FloatingCart";
import { scale } from "../../utils/responsive";
import { Ionicons } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";

const { width: screenWidth } = Dimensions.get("window");
const HORIZONTAL_PADDING = scale(16);
const CARD_GAP = scale(12);
const CARDS_PER_ROW = 4; // Modern 4-column grid (Blinkit/Zepto style)
const CARD_WIDTH =
  (screenWidth - HORIZONTAL_PADDING * 2 - CARD_GAP * (CARDS_PER_ROW - 1)) /
  CARDS_PER_ROW;

const PASTEL_COLORS = [
  "#F4EBFF", // light lilac
  "#E8F4FF", // soft blue
  "#FFF2E5", // very light peach
  "#E6F7ED", // mint green
  "#FFF0F5", // blush pink
  "#FFF9E5", // butter yellow
  "#EBF9FF", // sky cyan
  "#F5F5F5", // soft gray
];

// ─── Section grouping rules ──────────────────────────────────────
// Map category names (lowercased) to section labels.
// Categories that don't match any keyword fall into "Others".
const SECTION_RULES: { section: string; keywords: string[] }[] = [
  {
    section: "Grocery & Kitchen",
    keywords: [
      "fruit",
      "vegetable",
      "dairy",
      "atta",
      "oil",
      "dal",
      "meat",
      "fish",
      "egg",
      "masala",
      "rice",
      "toor",
      "cooking",
      "bread",
      "spice",
      "flour",
      "ghee",
      "paneer",
      "butter",
      "curd",
      "milk",
      "pulse",
      "grain",
      "sugar",
      "salt",
      "vinegar",
    ],
  },
  {
    section: "Snacks & Drinks",
    keywords: [
      "snack",
      "drink",
      "juice",
      "cold drink",
      "ice cream",
      "frozen",
      "biscuit",
      "cookie",
      "chips",
      "munchies",
      "chocolate",
      "sweet",
      "candy",
      "soda",
      "tea",
      "coffee",
      "water",
      "beverage",
      "shake",
      "dessert",
    ],
  },
  {
    section: "Beauty & Personal Care",
    keywords: [
      "beauty",
      "personal care",
      "skin",
      "hair",
      "hygiene",
      "cosmetic",
      "shampoo",
      "soap",
      "cream",
      "lotion",
      "perfume",
      "makeup",
      "deodorant",
      "face",
      "body",
    ],
  },
  {
    section: "Household",
    keywords: [
      "household",
      "cleaning",
      "detergent",
      "mop",
      "broom",
      "tissue",
      "paper",
      "freshener",
      "insect",
      "garbage",
    ],
  },
];

const groupCategories = (
  allCats: any[]
): { section: string; items: any[] }[] => {
  const assigned = new Set<number | string>();
  const groups: { section: string; items: any[] }[] = [];

  for (const rule of SECTION_RULES) {
    const matched = allCats.filter((c) => {
      if (assigned.has(c.id)) return false;
      const name = (c.name || "").toLowerCase();
      return rule.keywords.some((kw) => name.includes(kw));
    });
    if (matched.length > 0) {
      matched.forEach((c) => assigned.add(c.id));
      groups.push({ section: rule.section, items: matched });
    }
  }

  const rest = allCats.filter((c) => !assigned.has(c.id));
  if (rest.length > 0) {
    groups.push({ section: "Others", items: rest });
  }

  return groups;
};

const CategoriesScreen = () => {
  const navigation = useNavigation<any>();
  const insets = useSafeAreaInsets();
  const { onScrollUp, onScrollDown } = useTabBar();
  const lastScrollY = useRef(0);

  const [categories, setCategories] = useState<any[]>([]);
  const [sections, setSections] = useState<
    { section: string; items: any[] }[]
  >([]);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);
  const [productResults, setProductResults] = useState<any[]>([]);
  const [isSearching, setIsSearching] = useState(false);

  // Stagger animation for cards
  const cardAnims = useRef<Animated.Value[]>([]).current;

  useFocusEffect(
    useCallback(() => {
      lastScrollY.current = 0;
      onScrollDown();
    }, [onScrollDown])
  );

  const handleScroll = (e: any) => {
    const currentY = e.nativeEvent.contentOffset.y;
    if (currentY > 10 && currentY > lastScrollY.current + 5) onScrollUp();
    else if (currentY < lastScrollY.current - 5 || currentY <= 0)
      onScrollDown();
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
      setSections(groupCategories(flatCats));

      // Create staggered animations for each card
      const anims = flatCats.map(() => new Animated.Value(0));
      cardAnims.length = 0;
      cardAnims.push(...anims);

      // Stagger entrance
      Animated.stagger(
        50,
        anims.map((anim) =>
          Animated.spring(anim, {
            toValue: 1,
            tension: 60,
            friction: 9,
            useNativeDriver: true,
          })
        )
      ).start();
    } catch (e) {
      console.error("Error loading categories:", e);
    } finally {
      setLoading(false);
    }
  };

  const handleCategoryPress = (item: any) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    navigation.navigate("CategoryProducts", {
      category: item,
      initialSubCategoryId: "all",
    });
  };

  // Track a global card index across all sections for matching animation values
  let globalCardIndex = 0;

  const renderCategoryCard = (item: any) => {
    const imageUrl = item.image || item.imageUrl || item.icon;
    const isLocalImage = typeof imageUrl === "number";
    // Find the animation for this item based on its position in the flat categories list
    const flatIdx = categories.findIndex((c) => c.id === item.id);
    const anim = flatIdx >= 0 ? cardAnims[flatIdx] : undefined;

    const animStyle = anim
      ? {
          opacity: anim,
          transform: [
            {
              translateY: anim.interpolate({
                inputRange: [0, 1],
                outputRange: [24, 0],
              }),
            },
            {
              scale: anim.interpolate({
                inputRange: [0, 1],
                outputRange: [0.92, 1],
              }),
            },
          ],
        }
      : {};

    return (
      <Animated.View
        key={(item.id || item._id || globalCardIndex++).toString()}
        style={[styles.cardWrapper, animStyle]}
      >
        <Pressable
          style={({ pressed }) => [
            styles.categoryCard,
            pressed && styles.cardPressed,
          ]}
          onPress={() => handleCategoryPress(item)}
        >
          {/* Image Container */}
          <View style={[styles.imageContainer, { backgroundColor: PASTEL_COLORS[Math.max(0, flatIdx) % PASTEL_COLORS.length] }]}>
            {imageUrl ? (
              <Image
                source={isLocalImage ? imageUrl : { uri: imageUrl }}
                style={styles.categoryImage}
              />
            ) : (
              <View style={styles.placeholderIcon}>
                <Ionicons
                  name="grid-outline"
                  size={scale(30)}
                  color="#bbb"
                />
              </View>
            )}
          </View>

          {/* Category Name */}
          <Text style={styles.categoryName} numberOfLines={2}>
            {item.name || item.title || "Category"}
          </Text>
        </Pressable>
      </Animated.View>
    );
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
          <View style={styles.loaderPulse}>
            <ActivityIndicator size="large" color="#0A8754" />
          </View>
          <Text style={styles.loaderText}>Discovering categories…</Text>
        </View>
      ) : search.trim() ? (
        /* ─── SEARCH RESULTS ─── */
        <ScrollView
          showsVerticalScrollIndicator={false}
          contentContainerStyle={{
            padding: scale(14),
            paddingBottom: scale(100),
          }}
          onScroll={handleScroll}
          scrollEventThrottle={16}
        >
          <Text style={styles.searchSubTitle}>
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
              <Ionicons
                name="search-outline"
                size={scale(48)}
                color="#ccc"
              />
              <Text style={styles.emptyTitle}>No results found</Text>
            </View>
          )}
        </ScrollView>
      ) : (
        /* ─── PREMIUM CATEGORY GRID ─── */
        <ScrollView
          showsVerticalScrollIndicator={false}
          contentContainerStyle={{ paddingBottom: scale(100) }}
          onScroll={handleScroll}
          scrollEventThrottle={16}
        >
          {/* Page Title */}
          <View style={styles.pageTitleRow}>
            <Text style={styles.pageTitle}>All Categories</Text>
          </View>

          {/* Thin accent divider */}
          <View style={styles.accentDivider} />

          {/* Sections */}
          {sections.map((group, gIdx) => (
            <View key={group.section} style={styles.sectionBlock}>
              {/* Section Header */}
              <Text style={styles.sectionTitle}>{group.section}</Text>

              {/* Category Cards Grid */}
              <View style={styles.categoryGrid}>
                {group.items.map((item) => renderCategoryCard(item))}
              </View>
            </View>
          ))}

        </ScrollView>
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
    backgroundColor: "#FFFFFF",
  },
  loader: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    gap: scale(16),
  },
  loaderPulse: {
    width: scale(70),
    height: scale(70),
    borderRadius: scale(35),
    backgroundColor: "#F0FDF4",
    justifyContent: "center",
    alignItems: "center",
  },
  loaderText: {
    color: "#6B7280",
    fontSize: scale(14),
    fontWeight: "500",
  },

  /* ─── Page Title ─── */
  pageTitleRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: HORIZONTAL_PADDING,
    paddingTop: scale(16),
    paddingBottom: scale(10),
  },
  pageTitle: {
    fontSize: scale(22),
    fontWeight: "800",
    color: "#111",
    letterSpacing: -0.5,
  },
  pageTitleIcons: {
    flexDirection: "row",
    alignItems: "center",
    gap: scale(14),
  },
  iconBtn: {
    width: scale(36),
    height: scale(36),
    borderRadius: scale(18),
    justifyContent: "center",
    alignItems: "center",
  },

  /* ─── Accent Divider ─── */
  accentDivider: {
    height: scale(3),
    backgroundColor: "#0A8754",
    marginHorizontal: HORIZONTAL_PADDING,
    borderRadius: scale(2),
    marginBottom: scale(8),
  },

  /* ─── Section ─── */
  sectionBlock: {
    marginTop: scale(16),
    paddingHorizontal: HORIZONTAL_PADDING,
  },
  sectionTitle: {
    fontSize: scale(18),
    fontWeight: "800",
    color: "#1A1A1A",
    marginBottom: scale(14),
    letterSpacing: -0.3,
  },

  /* ─── Category Grid ─── */
  categoryGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "flex-start",
    gap: CARD_GAP,
    paddingTop: scale(4),
  },
  cardWrapper: {
    width: CARD_WIDTH,
    marginBottom: scale(16),
  },
  categoryCard: {
    alignItems: "center",
  },
  cardPressed: {
    opacity: 0.8,
    transform: [{ scale: 0.95 }],
  },
  imageContainer: {
    width: CARD_WIDTH,
    height: CARD_WIDTH, // Uniform square size
    borderRadius: scale(14), // Soft rounded corners
    backgroundColor: "#F4F6F8", // Fallback color
    justifyContent: "center",
    alignItems: "center",
    overflow: "hidden",
    marginBottom: scale(8),
    borderWidth: 1,
    borderColor: "rgba(0,0,0,0.02)", // Extremely subtle border
    // Minimal modern flat look (no heavy shadow)
  },
  categoryImage: {
    width: "70%",
    height: "70%",
    resizeMode: "contain",
  },
  placeholderIcon: {
    justifyContent: "center",
    alignItems: "center",
  },
  categoryName: {
    fontSize: scale(11.5), // Optimized size for 4 column grid
    fontWeight: "600", // Medium-SemiBold weight
    color: "#374151",
    textAlign: "center",
    lineHeight: scale(14),
    paddingHorizontal: scale(2),
    minHeight: scale(28),
  },

  /* ─── Bottom CTA ─── */
  bottomCta: {
    flexDirection: "row",
    alignItems: "center",
    marginHorizontal: HORIZONTAL_PADDING,
    marginTop: scale(24),
    marginBottom: scale(10),
    backgroundColor: "#F0FDF4",
    paddingHorizontal: scale(16),
    paddingVertical: scale(14),
    borderRadius: scale(16),
    borderWidth: 1,
    borderColor: "#D1FAE5",
    gap: scale(10),
  },
  ctaIconCircle: {
    width: scale(34),
    height: scale(34),
    borderRadius: scale(17),
    backgroundColor: "#D1FAE5",
    justifyContent: "center",
    alignItems: "center",
  },
  ctaText: {
    flex: 1,
    fontSize: scale(12),
    fontWeight: "600",
    color: "#065F46",
    lineHeight: scale(17),
  },

  /* ─── Search ─── */
  searchSubTitle: {
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
