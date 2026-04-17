import React, { useState, useEffect, useCallback, useRef } from "react";
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TextInput,
  TouchableOpacity,
  Keyboard,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useNavigation, useRoute } from "@react-navigation/native";
import { searchProducts } from "../../services/api/products";
import ProductCard from "../../components/ProductCard";
import ProductFilterBar, { SortOption, PRICE_RANGES } from "../../components/ProductFilterBar";
import SkeletonCard from "../../components/SkeletonCard";
import FloatingCart from "../../components/FloatingCart";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { scale } from "../../utils/responsive";

const SearchResultsScreen = () => {
  const navigation = useNavigation<any>();
  const route = useRoute<any>();
  const insets = useSafeAreaInsets();
  const initialQuery = route.params?.query || "";

  const [searchText, setSearchText] = useState(initialQuery);
  const [activeQuery, setActiveQuery] = useState(initialQuery);
  const [allProducts, setAllProducts] = useState<any[]>([]);
  const [displayed, setDisplayed] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [sortBy, setSort] = useState<SortOption>("default");
  const [priceRange, setPrice] = useState(PRICE_RANGES[0]);
  const inputRef = useRef<TextInput>(null);

  // Debounce typing to instantly fetch products
  useEffect(() => {
    const handler = setTimeout(() => {
      setActiveQuery(searchText.trim());
    }, 500);
    return () => clearTimeout(handler);
  }, [searchText]);

  useEffect(() => {
    if (activeQuery) {
      fetchResults(activeQuery);
    } else {
      setAllProducts([]);
      setDisplayed([]);
      setLoading(false);
    }
  }, [activeQuery]);

  useEffect(() => {
    applyFilters(sortBy, priceRange, allProducts);
  }, [sortBy, priceRange, allProducts]);

  const fetchResults = async (q: string) => {
    setLoading(true);
    try {
      const results = await searchProducts(q);
      setAllProducts(results);
    } catch (error) {
      console.error("Search fetch error:", error);
    } finally {
      setLoading(false);
    }
  };

  const applyFilters = useCallback((
    sort: SortOption,
    range: typeof PRICE_RANGES[0],
    base: any[]
  ) => {
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

    setDisplayed(result);
  }, []);

  const handleSubmit = () => {
    Keyboard.dismiss();
    if (searchText.trim()) {
      setActiveQuery(searchText.trim());
    }
  };

  const renderProduct = ({ item }: any) => (
    <View style={styles.cardWrapper}>
      <ProductCard product={item} />
    </View>
  );

  return (
    <View style={styles.safe}>
      {/* ─── Fixed Search Header ─── */}
      <View style={[styles.searchHeader, { paddingTop: Math.max(insets.top, scale(12)) }]}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
          <Ionicons name="arrow-back" size={scale(22)} color="#111" />
        </TouchableOpacity>

        <View style={styles.searchInputBox}>
          <Ionicons name="search" size={scale(17)} color="#9CA3AF" />
          <TextInput
            ref={inputRef}
            style={styles.searchInput}
            placeholder="Search for products..."
            placeholderTextColor="#64748B"
            value={searchText}
            onChangeText={setSearchText}
            returnKeyType="search"
            onSubmitEditing={handleSubmit}
            autoFocus={!initialQuery}
          />
          {searchText.length > 0 && (
            <TouchableOpacity onPress={() => { setSearchText(""); inputRef.current?.focus(); }}>
              <Ionicons name="close-circle" size={scale(18)} color="#D1D5DB" />
            </TouchableOpacity>
          )}
          <View style={styles.divider} />
          <Ionicons name="mic-outline" size={scale(18)} color="#EF4444" />
        </View>
      </View>

      {/* ─── Result Count (always rendered for stable layout) ─── */}
      <View style={styles.resultInfo}>
        {!loading && activeQuery ? (
          <Text style={styles.resultCount}>
            Showing <Text style={{ fontWeight: "800", color: "#111" }}>{displayed.length}</Text> result{displayed.length !== 1 ? 's' : ''}
            {` for "${activeQuery}"`}
          </Text>
        ) : !loading && !activeQuery ? (
          <Text style={styles.resultCount}>Start typing to search products</Text>
        ) : (
          <Text style={styles.resultCount}>Searching...</Text>
        )}
      </View>

      <ProductFilterBar
        activeSort={sortBy}
        activePriceRange={priceRange}
        onSortChange={setSort}
        onPriceChange={setPrice}
        itemCount={displayed.length}
      />

      {/* ─── Products Grid ─── */}
      {loading ? (
        <FlatList
          data={[1, 2, 3, 4, 5, 6]}
          numColumns={2}
          renderItem={() => <SkeletonCard />}
          contentContainerStyle={styles.grid}
          columnWrapperStyle={styles.row}
        />
      ) : displayed.length === 0 ? (
        <View style={styles.emptyContainer}>
          <View style={styles.emptyIconBox}>
            <Ionicons name="search-outline" size={scale(48)} color="#D1D5DB" />
          </View>
          <Text style={styles.emptyTitle}>No results found</Text>
          <Text style={styles.emptySub}>
            {activeQuery
              ? `We couldn't find anything for "${activeQuery}"`
              : "Try searching for a product"}
          </Text>
          {(sortBy !== "default" || priceRange !== PRICE_RANGES[0]) && (
            <TouchableOpacity
              onPress={() => { setSort("default"); setPrice(PRICE_RANGES[0]); }}
              style={styles.clearFiltersBtn}
            >
              <Text style={styles.clearFiltersText}>Clear all filters</Text>
            </TouchableOpacity>
          )}
        </View>
      ) : (
        <FlatList
          data={displayed}
          keyExtractor={(item, index) => (item.id || index).toString()}
          renderItem={renderProduct}
          numColumns={2}
          columnWrapperStyle={styles.row}
          contentContainerStyle={styles.grid}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
          keyboardDismissMode="on-drag"
        />
      )}

      <FloatingCart currentRoute="SearchResults" />
    </View>
  );
};

export default SearchResultsScreen;

const styles = StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: "#F9FAFB",
  },

  /* Search Header */
  searchHeader: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: scale(12),
    paddingBottom: scale(10),
    backgroundColor: "#fff",
    borderBottomWidth: 1,
    borderBottomColor: "#F3F4F6",
    elevation: 2,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: scale(1) },
    shadowOpacity: 0.05,
    shadowRadius: scale(2),
  },
  backBtn: {
    width: scale(40),
    height: scale(40),
    borderRadius: scale(20),
    backgroundColor: "#F3F4F6",
    justifyContent: "center",
    alignItems: "center",
    marginRight: scale(10),
  },
  searchInputBox: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#F1F5F9",
    borderRadius: scale(14),
    paddingHorizontal: scale(16),
    paddingVertical: scale(12),
    borderWidth: 1,
    borderColor: "#E2E8F0",
  },
  searchInput: {
    flex: 1,
    fontSize: scale(15),
    fontWeight: "500",
    color: "#1E293B",
    padding: 0,
    marginLeft: scale(8),
  },
  divider: {
    width: 1,
    height: scale(18),
    backgroundColor: "#CBD5E1",
    marginHorizontal: scale(10),
  },

  /* Result info — always rendered for stable layout */
  resultInfo: {
    paddingHorizontal: scale(16),
    paddingVertical: scale(10),
    backgroundColor: "#fff",
    minHeight: scale(38),
    justifyContent: "center",
  },
  resultCount: {
    fontSize: scale(13),
    color: "#6B7280",
    fontWeight: "500",
  },

  /* Grid */
  grid: {
    padding: scale(12),
    paddingBottom: scale(100),
  },
  row: {
    justifyContent: "space-between",
    marginBottom: scale(10),
  },
  cardWrapper: {
    width: "48%",
  },

  /* Empty State */
  emptyContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: scale(40),
  },
  emptyIconBox: {
    width: scale(80),
    height: scale(80),
    borderRadius: scale(40),
    backgroundColor: "#F3F4F6",
    justifyContent: "center",
    alignItems: "center",
    marginBottom: scale(16),
  },
  emptyTitle: {
    fontSize: scale(18),
    fontWeight: "700",
    color: "#111827",
    marginBottom: scale(8),
  },
  emptySub: {
    fontSize: scale(14),
    color: "#6B7280",
    textAlign: "center",
    lineHeight: scale(20),
  },
  clearFiltersBtn: {
    marginTop: scale(16),
    paddingVertical: scale(10),
    paddingHorizontal: scale(20),
    borderRadius: scale(12),
    borderWidth: 1,
    borderColor: "#0A8754",
    backgroundColor: "#ECFDF5",
  },
  clearFiltersText: {
    color: "#0A8754",
    fontSize: scale(14),
    fontWeight: "700",
  },
});
