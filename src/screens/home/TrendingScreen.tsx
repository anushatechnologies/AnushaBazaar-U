import React, { useState, useEffect, useRef, useCallback } from "react";
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  Image,
  Pressable,
  ActivityIndicator,
  TextInput,
  TouchableOpacity,
  Animated,
  Modal,
  ScrollView,
  ToastAndroid,
  Platform,
  RefreshControl,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useNavigation, useFocusEffect } from "@react-navigation/native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { getProducts, filterProducts, getTrendingProducts } from "../../services/api/products";
import ProductCard from "../../components/ProductCard";
import FloatingCart from "../../components/FloatingCart";
import ProductFilterBar, { SortOption, PRICE_RANGES } from "../../components/ProductFilterBar";
import SkeletonCard from "../../components/SkeletonCard";
import SearchBar from "../../components/SearchBar";
import { useTabBar } from "../../context/TabBarContext";
import { scale } from "../../utils/responsive";

/* ─── Main screen ────────────────────────────────────────── */
const TrendingScreen = () => {
  const navigation = useNavigation<any>();
  const [allProducts, setAll] = useState<any[]>([]);
  const [displayed, setDisplay] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [searchResults, setSearchResults] = useState<any[] | null>(null);
  const [isSearching, setIsSearching] = useState(false);
  const [sortBy, setSort] = useState<SortOption>("default");
  const [priceRange, setPrice] = useState(PRICE_RANGES[0]);
  const [refreshing, setRefreshing] = useState(false);
  const insets = useSafeAreaInsets();
  const lastScrollY = useRef(0);
  const { onScrollUp, onScrollDown } = useTabBar();

  // Reset tab bar to visible every time this screen gains focus
  useFocusEffect(
    useCallback(() => {
      lastScrollY.current = 0;
      onScrollDown();
    }, [onScrollDown])
  );

  const handleScroll = (e: any) => {
    const currentY = e.nativeEvent.contentOffset.y;
    if (currentY > 10 && currentY > lastScrollY.current + scale(5)) onScrollUp();
    else if (currentY < lastScrollY.current - scale(5) || currentY <= 0) onScrollDown();
    lastScrollY.current = currentY;
  };

  useEffect(() => { load(); }, []);

  const load = async () => {
    setLoading(true);
    try {
      const data = await getTrendingProducts();
      setAll(data);
      setDisplay(data);
    } catch (e) {
      console.error("Error loading trending products:", e);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const onRefresh = () => {
    setRefreshing(true);
    load();
  };

  // The `base` array will either be `allProducts` or `searchResults`.
  const applyFilters = useCallback((
    sort: SortOption,
    range: typeof PRICE_RANGES[0],
    base: any[]
  ) => {
    if (!base) return;
    let result = [...base];

    if (range.max > 0) {
      result = result.filter(p => {
        const price = p.sellingPrice ?? p.price ?? 0;
        return price >= range.min && price <= range.max;
      });
    } else if (range.min > 0) {
      result = result.filter(p => (p.sellingPrice ?? p.price ?? 0) >= range.min);
    }

    if (sort === "price_asc") result.sort((a, b) => (a.sellingPrice ?? a.price ?? 0) - (b.sellingPrice ?? b.price ?? 0));
    if (sort === "price_desc") result.sort((a, b) => (b.sellingPrice ?? b.price ?? 0) - (a.sellingPrice ?? a.price ?? 0));
    if (sort === "name_asc") result.sort((a, b) => (a.name || "").localeCompare(b.name || ""));

    setDisplay(result);
  }, []);

  // Update whenever active array or filters change
  useEffect(() => {
    const activeBase = (search && search.trim().length > 0 && searchResults !== null) ? searchResults : allProducts;
    applyFilters(sortBy, priceRange, activeBase);
  }, [search, searchResults, allProducts, sortBy, priceRange, applyFilters]);

  // Handlers for interactions
  const handleSearchTextChange = (text: string) => {
    setSearch(text);
    if (!text.trim()) {
      setSearchResults(null);
    }
  };

  const handleSearchResults = (results: any[]) => {
    setSearchResults(results);
  };

  const handleSort = (s: SortOption) => {
    setSort(s);
  };

  const handlePrice = (r: typeof PRICE_RANGES[0]) => {
    setPrice(r);
  };

  /* ─── Components ─── */
  const ListHeader = () => (
    <View>
      {/* ── Top bar ── */}
      <View style={[styles.topBar, { paddingTop: Math.max(insets.top, scale(20)) }]}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
          <Ionicons name="arrow-back" size={scale(22)} color="#111" />
        </TouchableOpacity>
        <View>
          <Text style={styles.screenTitle}>Trending 🔥</Text>
          <Text style={styles.screenSub}>{displayed.length} products</Text>
        </View>
      </View>

      {/* ── Search + mic ── */}
      <SearchBar
        value={search}
        onChangeText={handleSearchTextChange}
        onSuggestions={handleSearchResults}
        onLoading={setIsSearching}
      />

      <ProductFilterBar
        activeSort={sortBy}
        activePriceRange={priceRange}
        onSortChange={handleSort}
        onPriceChange={handlePrice}
        itemCount={displayed.length}
      />
    </View>
  );

  const ListEmptyComponent = useCallback(() => (
    <View style={styles.empty}>
      <Text style={{ fontSize: scale(44) }}>🔍</Text>
      <Text style={styles.emptyTitle}>No products found</Text>
      <Text style={styles.emptySub}>Try changing your filters</Text>
    </View>
  ), []);

  return (
    <View style={styles.root}>
      {ListHeader()}
      {(loading || isSearching) ? (
        <View style={styles.gridOverlay}>
          <FlatList
            data={[1,2,3,4,5,6,7,8,9]}
            numColumns={3}
            renderItem={() => (
              <View style={styles.gridItem}>
                <SkeletonCard />
              </View>
            )}
            columnWrapperStyle={styles.columnWrapper}
            contentContainerStyle={styles.listPad}
          />
        </View>
      ) : (
        <FlatList
          data={displayed}
          keyExtractor={(item, i) => item.id?.toString() || String(i)}
          renderItem={({ item, index }) => (
            <View style={styles.gridItem}>
              <ProductCard product={item} />
            </View>
          )}
          numColumns={3}
          ListEmptyComponent={ListEmptyComponent}
          columnWrapperStyle={styles.columnWrapper}
          contentContainerStyle={styles.listPad}
          showsVerticalScrollIndicator={false}
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
        />
      )}
      <FloatingCart currentRoute="Trending" />
    </View>
  );
};

export default TrendingScreen;

/* ─── Styles ─────────────────────────────────────────────── */
const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: "#F9FDFB" },
  loader: { flex: 1, justifyContent: "center", alignItems: "center", gap: scale(10) },
  gridOverlay: { flex: 1, backgroundColor: "#F9FDFB" },
  loaderText: { color: "#888", fontSize: scale(14) },

  /* Top bar */
  topBar: {
    flexDirection: "row",
    alignItems: "center",
    gap: scale(12),
    paddingHorizontal: scale(14),
    paddingBottom: scale(10),
    backgroundColor: "#fff",
  },
  backBtn: {
    width: scale(38), height: scale(38),
    borderRadius: scale(12),
    backgroundColor: "#F4F4F4",
    justifyContent: "center",
    alignItems: "center",
  },
  screenTitle: { fontSize: scale(20), fontWeight: "800", color: "#111" },
  screenSub: { fontSize: scale(12), color: "#888", marginTop: scale(1) },

  filterBtn: {
    width: scale(44), height: scale(44),
    borderRadius: scale(12),
    backgroundColor: "#F0F0F0",
    justifyContent: "center",
    alignItems: "center",
  },
  filterBtnActive: { backgroundColor: "#0A8754" },

  /* Chips */
  chipsRow: { backgroundColor: "#fff", paddingHorizontal: scale(14), paddingBottom: scale(10) },
  chip: {
    flexDirection: "row",
    alignItems: "center",
    gap: scale(5),
    backgroundColor: "#E6F5EE",
    paddingHorizontal: scale(10),
    paddingVertical: scale(5),
    borderRadius: scale(20),
  },
  chipText: { fontSize: scale(12), color: "#0A8754", fontWeight: "600" },

  /* Product cards grid styles */
  listPad: { paddingHorizontal: scale(12), paddingTop: scale(12), paddingBottom: scale(90) },
  columnWrapper: { gap: scale(6) },
  gridItem: { width: "31.5%" },

  /* Empty */
  empty: { alignItems: "center", paddingTop: scale(60) },
  emptyTitle: { fontSize: scale(17), fontWeight: "700", color: "#333", marginTop: scale(12) },
  emptySub: { fontSize: scale(13), color: "#999", marginTop: scale(4) },

  /* Filter modal */
  overlay: { flex: 1, backgroundColor: "rgba(0,0,0,0.35)" },
  sheet: {
    backgroundColor: "#fff",
    borderTopLeftRadius: scale(24),
    borderTopRightRadius: scale(24),
    paddingHorizontal: scale(20),
    paddingBottom: scale(30),
    paddingTop: scale(12),
    maxHeight: "80%",
  },
  sheetHandle: {
    width: scale(40), height: scale(4),
    borderRadius: scale(2),
    backgroundColor: "#E0E0E0",
    alignSelf: "center",
    marginBottom: scale(16),
  },
  sheetTitle: { fontSize: scale(18), fontWeight: "800", color: "#111", marginBottom: scale(16) },
  sheetSection: { fontSize: scale(13), fontWeight: "700", color: "#777", marginTop: scale(14), marginBottom: scale(6), textTransform: "uppercase", letterSpacing: scale(0.5) },
  optionRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: scale(12),
    paddingHorizontal: scale(14),
    borderRadius: scale(12),
    marginBottom: scale(4),
    backgroundColor: "#F8F8F8",
  },
  optionRowActive: { backgroundColor: "#E6F5EE" },
  optionText: { fontSize: scale(14), color: "#444" },
  optionTextActive: { color: "#0A8754", fontWeight: "700" },
  applyBtn: {
    backgroundColor: "#0A8754",
    borderRadius: scale(14),
    paddingVertical: scale(14),
    alignItems: "center",
    marginTop: scale(20),
  },
  applyBtnText: { color: "#fff", fontSize: scale(15), fontWeight: "800" },
});
