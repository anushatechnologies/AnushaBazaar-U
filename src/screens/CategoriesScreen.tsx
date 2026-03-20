import React, { useState, useEffect, useRef } from "react";
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  Image,
  Pressable,
  ActivityIndicator,
  RefreshControl,
  ScrollView,
} from "react-native";
import { useNavigation } from "@react-navigation/native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import DeliveryHeader from "../components/DeliveryHeader";
import SearchBar from "../components/SearchBar";
import ProductCard from "../components/ProductCard";
import { getCategories } from "../services/api/categories";
import { useTabBar } from "../context/TabBarContext";
import FloatingCart from "../components/FloatingCart";

/* ─── Blinkit-inspired colour palette ─── */
const PALETTE = [
  { bg: "#FFF8EC", icon: "#FF9F00", strip: "#FF9F00" },
  { bg: "#EAF4FF", icon: "#1A73E8", strip: "#1A73E8" },
  { bg: "#EDFBF3", icon: "#00A65A", strip: "#00A65A" },
  { bg: "#FFF0F3", icon: "#E8294A", strip: "#E8294A" },
  { bg: "#F4EEFF", icon: "#7C3AED", strip: "#7C3AED" },
  { bg: "#E6FBF8", icon: "#00897B", strip: "#00897B" },
  { bg: "#FFFBEA", icon: "#D97706", strip: "#D97706" },
  { bg: "#FFE8F5", icon: "#DB2777", strip: "#DB2777" },
  { bg: "#EFF6FF", icon: "#2563EB", strip: "#2563EB" },
  { bg: "#FFF1EC", icon: "#EA580C", strip: "#EA580C" },
  { bg: "#ECFDF5", icon: "#059669", strip: "#059669" },
  { bg: "#F5F3FF", icon: "#6D28D9", strip: "#6D28D9" },
];

const NUM_COLUMNS = 3;

/* ─── Single category card ─── */
const CategoryCard = ({
  item,
  index,
  onPress,
}: {
  item: any;
  index: number;
  onPress: () => void;
}) => {
  const imageUrl = item.image || item.imageUrl || item.icon;
  const isLocalImage = typeof imageUrl === "number";
  const { bg, icon: accent, strip } = PALETTE[index % PALETTE.length];

  return (
    <Pressable
      style={({ pressed }) => [
        styles.card,
        { backgroundColor: bg },
        pressed && styles.cardPressed,
      ]}
      onPress={onPress}
    >
      {/* ── Icon bubble ── */}
      <View style={[styles.bubble, { backgroundColor: accent + "11" }]}>
        {imageUrl ? (
          <Image
            source={isLocalImage ? imageUrl : { uri: imageUrl }}
            style={styles.img}
            resizeMode="cover"
          />
        ) : (
          <Text style={[styles.fallbackEmoji, { color: accent }]}>🛒</Text>
        )}
      </View>

      {/* ── Name ── */}
      <Text style={styles.cardName} numberOfLines={2}>
        {item.name || item.title || "Category"}
      </Text>

      {/* ── Blinkit-style coloured bottom strip ── */}
      <View style={[styles.bottomStrip, { backgroundColor: strip }]} />
    </Pressable>
  );
};

/* ─── Main screen ─── */
const CategoriesScreen = () => {
  const navigation = useNavigation<any>();
  const insets = useSafeAreaInsets();
  const { onScrollUp, onScrollDown } = useTabBar();
  const lastScrollY = useRef(0);
  const [categories, setCategories] = useState<any[]>([]);
  const [filtered, setFiltered] = useState<any[]>([]);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [productResults, setProductResults] = useState<any[]>([]);
  const [isSearching, setIsSearching] = useState(false);

  const handleScroll = (e: any) => {
    const currentY = e.nativeEvent.contentOffset.y;
    if (currentY > lastScrollY.current + 5) onScrollUp();
    else if (currentY < lastScrollY.current - 5) onScrollDown();
    lastScrollY.current = currentY;
  };

  useEffect(() => { loadCategories(); }, []);

  useEffect(() => {
    const q = search.trim().toLowerCase();
    setFiltered(
      q
        ? categories.filter(c =>
          (c.name || c.title || "").toLowerCase().includes(q)
        )
        : categories
    );
    if (!q) {
      setProductResults([]);
      setIsSearching(false);
    }
  }, [search, categories]);

  const loadCategories = async () => {
    setLoading(true);
    try {
      const data = await getCategories();
      const items = Array.isArray(data) ? data : data?.data || [];
      let flat: any[] = [];
      if (items.length > 0 && items[0].items && Array.isArray(items[0].items)) {
        items.forEach((s: any) => { flat = flat.concat(s.items); });
      } else {
        flat = items;
      }
      setCategories(flat);
      setFiltered(flat);
    } catch (e) {
      console.error("Error loading categories:", e);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const onRefresh = () => {
    setRefreshing(true);
    loadCategories();
  };

  const renderCategoryItem = ({ item, index }: { item: any; index: number }) => (
    <CategoryCard
      item={item}
      index={index}
      onPress={() => navigation.navigate("CategoryProducts", { category: item })}
    />
  );

  const renderProductItem = ({ item }: { item: any }) => (
    <View style={{ width: "48%", marginBottom: 12 }}>
      <ProductCard product={item} />
    </View>
  );

  const ListHeader = () => {
    if (search.trim() && (filtered.length > 0 || productResults.length > 0)) {
      return (
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Search Results</Text>
        </View>
      );
    }
    return (
      <View style={styles.sectionHeader}>
        <View style={styles.sectionTitleRow}>
          <View style={styles.titleAccentBar} />
          <Text style={styles.sectionTitle}>All Categories</Text>
        </View>
        {categories.length > 0 && (
          <Text style={styles.countBadge}>{filtered.length} items</Text>
        )}
      </View>
    );
  };

  const ListEmpty = () => (
    <View style={styles.empty}>
      <Text style={styles.emptyIcon}>📦</Text>
      <Text style={styles.emptyTitle}>
        {search ? "No results" : "No categories"}
      </Text>
      <Text style={styles.emptyHint}>
        {search ? `Nothing matched "${search}"` : "Check back soon"}
      </Text>
    </View>
  );

  return (
    <View style={styles.root}>
      {/* ── Original top bar ── */}
      <DeliveryHeader />

      {/* ── Search bar with working mic ── */}
      <SearchBar
        value={search}
        onChangeText={setSearch}
        onSuggestions={(data) => {
          setProductResults(data);
          if (search.trim()) setIsSearching(true);
        }}
        onLoading={setIsSearching}
        onSearch={(q) => {
          if (q.trim()) {
            navigation.navigate("SearchResults", { query: q });
          }
        }}
        placeholder="Search for categories or products..."
      />

      {loading ? (
        <View style={styles.loader}>
          <ActivityIndicator size="large" color="#0A8754" />
          <Text style={styles.loaderText}>Loading…</Text>
        </View>
      ) : (
        <ScrollView
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.listPad}
          onScroll={handleScroll}
          scrollEventThrottle={16}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={onRefresh}
              colors={["#0A8754"]}
              tintColor="#0A8754"
            />
          }
        >
          <ListHeader />

          {/* ── Categories Section ── */}
          {filtered.length > 0 && (
            <>
              {search.trim() && (
                <Text style={styles.subTitle}>Categories ({filtered.length})</Text>
              )}
              <View style={styles.grid}>
                {filtered.map((item, idx) => (
                  <View key={item.id || idx} style={styles.cardContainer}>
                    {renderCategoryItem({ item, index: idx })}
                  </View>
                ))}
              </View>
            </>
          )}

          {/* ── Products Section ── */}
          {search.trim() && (
            <>
              <View style={styles.divider} />
              <Text style={styles.subTitle}>
                Products {productResults.length > 0 ? `(${productResults.length})` : ""}
              </Text>
              {isSearching && productResults.length === 0 ? (
                <View style={{ padding: 20, alignItems: "center" }}>
                  <ActivityIndicator size="small" color="#0A8754" />
                </View>
              ) : productResults.length > 0 ? (
                <View style={styles.productGrid}>
                  {productResults.map((item, idx) => (
                    <View key={item.id || idx} style={{ width: "48%", marginBottom: 12 }}>
                      <ProductCard product={item} />
                    </View>
                  ))}
                </View>
              ) : (
                <Text style={styles.emptyResultsText}>No products found matching "{search}"</Text>
              )}
            </>
          )}

          {filtered.length === 0 && (!search.trim() || productResults.length === 0) && (
            <ListEmpty />
          )}
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
    backgroundColor: "#F0F2F5",
  },
  loader: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    gap: 10,
  },
  loaderText: {
    color: "#888",
    fontSize: 14,
    fontWeight: "500",
  },

  /* Section header */
  sectionHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 4,
    paddingTop: 16,
    paddingBottom: 10,
  },
  subTitle: {
    fontSize: 15,
    fontWeight: "700",
    color: "#444",
    marginBottom: 12,
    marginTop: 8,
    paddingHorizontal: 4,
  },
  divider: {
    height: 1,
    backgroundColor: "#E2E8F0",
    marginVertical: 16,
    marginHorizontal: 4,
  },
  emptyResultsText: {
    fontSize: 13,
    color: "#888",
    textAlign: "center",
    marginTop: 10,
    fontStyle: "italic",
  },
  sectionTitleRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  titleAccentBar: {
    width: 4,
    height: 20,
    borderRadius: 4,
    backgroundColor: "#0A8754",
  },
  sectionTitle: {
    fontSize: 17,
    fontWeight: "800",
    color: "#111",
    letterSpacing: -0.2,
  },
  countBadge: {
    fontSize: 12,
    fontWeight: "600",
    color: "#0A8754",
    backgroundColor: "#E6F5EE",
    paddingHorizontal: 10,
    paddingVertical: 3,
    borderRadius: 20,
    overflow: "hidden",
  },

  /* Grid */
  listPad: {
    paddingHorizontal: 14,
    paddingBottom: 100,
  },
  grid: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "space-between",
  },
  cardContainer: {
    width: "31.5%",
    marginBottom: 12,
  },
  productGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "space-between",
  },
  row: {
    justifyContent: "space-between",
    marginBottom: 12,
  },

  /* ── Blinkit-style card ── */
  card: {
    width: "100%",
    borderRadius: 18,
    paddingTop: 18,
    paddingHorizontal: 6,
    paddingBottom: 0,
    alignItems: "center",
    overflow: "hidden",
    /* Shadow */
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 4,
  },
  cardPressed: {
    opacity: 0.82,
    transform: [{ scale: 0.955 }],
  },

  /* Icon bubble */
  bubble: {
    width: "100%",
    height: 120, // Adjusted for 316x414 proportions in mobile grid
    borderRadius: 12,
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 8,
    overflow: "hidden",
  },
  img: {
    width: "100%",
    height: "100%",
  },
  fallbackEmoji: {
    fontSize: 28,
  },

  /* Name label */
  cardName: {
    fontSize: 11.5,
    fontWeight: "700",
    color: "#1a1a1a",
    textAlign: "center",
    lineHeight: 16,
    paddingHorizontal: 4,
    marginBottom: 10,
    letterSpacing: 0.1,
  },

  /* Blinkit bottom colour strip */
  bottomStrip: {
    width: "100%",
    height: 5,
    borderBottomLeftRadius: 18,
    borderBottomRightRadius: 18,
  },

  /* Empty state */
  empty: {
    alignItems: "center",
    paddingTop: 60,
    paddingBottom: 30,
  },
  emptyIcon: { fontSize: 48, marginBottom: 12 },
  emptyTitle: {
    fontSize: 17,
    fontWeight: "700",
    color: "#333",
    marginBottom: 6,
  },
  emptyHint: {
    fontSize: 13,
    color: "#999",
  },
});