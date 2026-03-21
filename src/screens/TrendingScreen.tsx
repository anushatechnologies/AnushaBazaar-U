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
import { useNavigation } from "@react-navigation/native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { getProducts, filterProducts, getTrendingProducts } from "../services/api/products";
import ProductCard from "../components/ProductCard";
import FloatingCart from "../components/FloatingCart";
import ProductFilterBar, { SortOption, PRICE_RANGES } from "../components/ProductFilterBar";
import SkeletonCard from "../components/SkeletonCard";
import { useTabBar } from "../context/TabBarContext";

/* ─── Main screen ────────────────────────────────────────── */
const TrendingScreen = () => {
  const navigation = useNavigation<any>();
  const [allProducts, setAll] = useState<any[]>([]);
  const [displayed, setDisplay] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [sortBy, setSort] = useState<SortOption>("default");
  const [priceRange, setPrice] = useState(PRICE_RANGES[0]);
  const [refreshing, setRefreshing] = useState(false);
  const insets = useSafeAreaInsets();
  const inputRef = useRef<TextInput>(null);
  const scaleAnim = useRef(new Animated.Value(1)).current;
  const lastScrollY = useRef(0);
  const { onScrollUp, onScrollDown } = useTabBar();

  const handleScroll = (e: any) => {
    const currentY = e.nativeEvent.contentOffset.y;
    if (currentY > lastScrollY.current + 5) onScrollUp();
    else if (currentY < lastScrollY.current - 5) onScrollDown();
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

  /* Apply search + sort + price filter */
  const applyFilters = useCallback((
    q: string,
    sort: SortOption,
    range: typeof PRICE_RANGES[0],
    base: any[]
  ) => {
    let result = [...base];

    if (q.trim()) {
      const lower = q.toLowerCase();
      result = result.filter(p =>
        (p.name || p.title || "").toLowerCase().includes(lower)
      );
    }

    if (range.max > 0) {
      result = result.filter(p => {
        const price = p.price ?? p.sellingPrice ?? 0;
        return price >= range.min && price <= range.max;
      });
    } else if (range.min > 0) {
      result = result.filter(p => (p.price ?? p.sellingPrice ?? 0) >= range.min);
    }

    if (sort === "price_asc") result.sort((a, b) => (a.price ?? 0) - (b.price ?? 0));
    if (sort === "price_desc") result.sort((a, b) => (b.price ?? 0) - (a.price ?? 0));
    if (sort === "name_asc") result.sort((a, b) => (a.name || "").localeCompare(b.name || ""));

    setDisplay(result);
  }, []);

  const handleSearch = (text: string) => {
    setSearch(text);
    applyFilters(text, sortBy, priceRange, allProducts);
  };

  const handleSort = (s: SortOption) => {
    setSort(s);
    applyFilters(search, s, priceRange, allProducts);
  };

  const handlePrice = (r: typeof PRICE_RANGES[0]) => {
    setPrice(r);
    applyFilters(search, sortBy, r, allProducts);
  };

  const handleMic = () => {
    Animated.sequence([
      Animated.timing(scaleAnim, { toValue: 0.8, duration: 100, useNativeDriver: true }),
      Animated.timing(scaleAnim, { toValue: 1, duration: 100, useNativeDriver: true }),
    ]).start();
    inputRef.current?.focus();
    if (Platform.OS === "android")
      ToastAndroid.show("Tap 🎤 on your keyboard to speak", ToastAndroid.SHORT);
  };

  /* ─── Components ─── */
  const ListHeader = () => (
    <View>
      {/* ── Top bar ── */}
      <View style={[styles.topBar, { paddingTop: Math.max(insets.top, 20) }]}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
          <Ionicons name="arrow-back" size={22} color="#111" />
        </TouchableOpacity>
        <View>
          <Text style={styles.screenTitle}>Trending 🔥</Text>
          <Text style={styles.screenSub}>{displayed.length} products</Text>
        </View>
      </View>

      {/* ── Search + mic ── */}
      <View style={styles.searchRow}>
        <View style={styles.searchBox}>
          <Ionicons name="search" size={17} color="#888" style={{ marginRight: 6 }} />
          <TextInput
            ref={inputRef}
            style={styles.searchInput}
            placeholder="Search trending..."
            placeholderTextColor="#aaa"
            value={search}
            onChangeText={handleSearch}
            returnKeyType="search"
          />
          {search.length > 0 && (
            <TouchableOpacity onPress={() => handleSearch("")}>
              <Ionicons name="close-circle" size={18} color="#bbb" />
            </TouchableOpacity>
          )}
          {/* Mic */}
          <TouchableOpacity onPress={handleMic} style={styles.micInner}>
            <Animated.View style={{ transform: [{ scale: scaleAnim }] }}>
              <Ionicons name="mic-outline" size={17} color="#555" />
            </Animated.View>
          </TouchableOpacity>
        </View>
      </View>

      <ProductFilterBar
        activeSort={sortBy}
        activePriceRange={priceRange}
        onSortChange={handleSort}
        onPriceChange={handlePrice}
        itemCount={displayed.length}
      />
    </View>
  );

  const ListEmpty = () => (
    <View style={styles.empty}>
      <Text style={{ fontSize: 44 }}>🔍</Text>
      <Text style={styles.emptyTitle}>No products found</Text>
      <Text style={styles.emptySub}>Try changing your filters</Text>
    </View>
  );

  return (
    <View style={styles.root}>
      <ListHeader />
      {loading ? (
        <View style={styles.gridOverlay}>
          <FlatList
            data={[1,2,3,4,5,6]}
            numColumns={2}
            renderItem={() => <SkeletonCard />}
            columnWrapperStyle={styles.columnWrapper}
            contentContainerStyle={styles.listPad}
          />
        </View>
      ) : (
        <FlatList
          data={displayed}
          keyExtractor={(item, i) => item.id?.toString() || String(i)}
          renderItem={({ item }) => (
            <View style={{ width: "48%" }}>
              <ProductCard product={item} />
            </View>
          )}
          numColumns={2}
          ListEmptyComponent={ListEmpty}
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
  loader: { flex: 1, justifyContent: "center", alignItems: "center", gap: 10 },
  gridOverlay: { flex: 1, backgroundColor: "#F9FDFB" },
  loaderText: { color: "#888", fontSize: 14 },

  /* Top bar */
  topBar: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    paddingHorizontal: 14,
    paddingBottom: 10,
    backgroundColor: "#fff",
  },
  backBtn: {
    width: 38, height: 38,
    borderRadius: 12,
    backgroundColor: "#F4F4F4",
    justifyContent: "center",
    alignItems: "center",
  },
  screenTitle: { fontSize: 20, fontWeight: "800", color: "#111" },
  screenSub: { fontSize: 12, color: "#888", marginTop: 1 },

  /* Search row */
  searchRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    paddingHorizontal: 14,
    paddingVertical: 10,
    backgroundColor: "#fff",
  },
  searchBox: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#F4F4F4",
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 10,
  },
  searchInput: { flex: 1, fontSize: 14, color: "#222" },
  micInner: {
    width: 30, height: 30,
    borderRadius: 15,
    backgroundColor: "#EAEAEA",
    justifyContent: "center",
    alignItems: "center",
    marginLeft: 6,
  },
  filterBtn: {
    width: 44, height: 44,
    borderRadius: 12,
    backgroundColor: "#F0F0F0",
    justifyContent: "center",
    alignItems: "center",
  },
  filterBtnActive: { backgroundColor: "#0A8754" },

  /* Chips */
  chipsRow: { backgroundColor: "#fff", paddingHorizontal: 14, paddingBottom: 10 },
  chip: {
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
    backgroundColor: "#E6F5EE",
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 20,
  },
  chipText: { fontSize: 12, color: "#0A8754", fontWeight: "600" },

  /* Product cards grid styles */
  listPad: { paddingHorizontal: 16, paddingTop: 12, paddingBottom: 90 },
  columnWrapper: { justifyContent: "space-between", marginBottom: 16 },

  /* Empty */
  empty: { alignItems: "center", paddingTop: 60 },
  emptyTitle: { fontSize: 17, fontWeight: "700", color: "#333", marginTop: 12 },
  emptySub: { fontSize: 13, color: "#999", marginTop: 4 },

  /* Filter modal */
  overlay: { flex: 1, backgroundColor: "rgba(0,0,0,0.35)" },
  sheet: {
    backgroundColor: "#fff",
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    paddingHorizontal: 20,
    paddingBottom: 30,
    paddingTop: 12,
    maxHeight: "80%",
  },
  sheetHandle: {
    width: 40, height: 4,
    borderRadius: 2,
    backgroundColor: "#E0E0E0",
    alignSelf: "center",
    marginBottom: 16,
  },
  sheetTitle: { fontSize: 18, fontWeight: "800", color: "#111", marginBottom: 16 },
  sheetSection: { fontSize: 13, fontWeight: "700", color: "#777", marginTop: 14, marginBottom: 6, textTransform: "uppercase", letterSpacing: 0.5 },
  optionRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: 12,
    paddingHorizontal: 14,
    borderRadius: 12,
    marginBottom: 4,
    backgroundColor: "#F8F8F8",
  },
  optionRowActive: { backgroundColor: "#E6F5EE" },
  optionText: { fontSize: 14, color: "#444" },
  optionTextActive: { color: "#0A8754", fontWeight: "700" },
  applyBtn: {
    backgroundColor: "#0A8754",
    borderRadius: 14,
    paddingVertical: 14,
    alignItems: "center",
    marginTop: 20,
  },
  applyBtnText: { color: "#fff", fontSize: 15, fontWeight: "800" },
});