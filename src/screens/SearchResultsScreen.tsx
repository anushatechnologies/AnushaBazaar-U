import React, { useState, useEffect, useCallback, useRef } from "react";
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TextInput,
  TouchableOpacity,
  SafeAreaView,
  Keyboard,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useNavigation, useRoute } from "@react-navigation/native";
import { searchProducts } from "../services/api/products";
import ProductCard from "../components/ProductCard";
import ProductFilterBar, { SortOption, PRICE_RANGES } from "../components/ProductFilterBar";
import SkeletonCard from "../components/SkeletonCard";
import FloatingCart from "../components/FloatingCart";

const SearchResultsScreen = () => {
  const navigation = useNavigation<any>();
  const route = useRoute<any>();
  const initialQuery = route.params?.query || "";

  const [searchText, setSearchText] = useState(initialQuery);
  const [activeQuery, setActiveQuery] = useState(initialQuery);
  const [allProducts, setAllProducts] = useState<any[]>([]);
  const [displayed, setDisplayed] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [sortBy, setSort] = useState<SortOption>("default");
  const [priceRange, setPrice] = useState(PRICE_RANGES[0]);
  const inputRef = useRef<TextInput>(null);

  useEffect(() => {
    if (activeQuery.trim()) {
      fetchResults(activeQuery);
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
        const price = p.price ?? p.sellingPrice ?? 0;
        return price >= range.min && price <= range.max;
      });
    } else if (range.min > 0) {
      result = result.filter(p => (p.price ?? p.sellingPrice ?? 0) >= range.min);
    }

    if (sort === "price_asc") result.sort((a, b) => (a.price ?? 0) - (b.price ?? 0));
    if (sort === "price_desc") result.sort((a, b) => (b.price ?? 0) - (a.price ?? 0));
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
    <SafeAreaView style={styles.safe}>
      {/* ─── Search Header (like Blinkit) ─── */}
      <View style={styles.searchHeader}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
          <Ionicons name="arrow-back" size={22} color="#111" />
        </TouchableOpacity>

        <View style={styles.searchInputBox}>
          <Ionicons name="search" size={18} color="#9CA3AF" />
          <TextInput
            ref={inputRef}
            style={styles.searchInput}
            placeholder="Search for products..."
            placeholderTextColor="#9CA3AF"
            value={searchText}
            onChangeText={setSearchText}
            returnKeyType="search"
            onSubmitEditing={handleSubmit}
            autoFocus={!initialQuery}
          />
          {searchText.length > 0 && (
            <TouchableOpacity onPress={() => { setSearchText(""); inputRef.current?.focus(); }}>
              <Ionicons name="close-circle" size={18} color="#D1D5DB" />
            </TouchableOpacity>
          )}
        </View>
      </View>

      {/* ─── Result Count & Filters ─── */}
      {!loading && displayed.length > 0 && (
        <View style={styles.resultInfo}>
          <Text style={styles.resultCount}>
            Showing <Text style={{ fontWeight: "800", color: "#111" }}>{displayed.length}</Text> results
            {activeQuery ? ` for "${activeQuery}"` : ""}
          </Text>
        </View>
      )}

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
            <Ionicons name="search-outline" size={48} color="#D1D5DB" />
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
        />
      )}

      <FloatingCart currentRoute="SearchResults" />
    </SafeAreaView>
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
    paddingHorizontal: 12,
    paddingVertical: 10,
    backgroundColor: "#fff",
    borderBottomWidth: 1,
    borderBottomColor: "#F3F4F6",
  },
  backBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: "#F3F4F6",
    justifyContent: "center",
    alignItems: "center",
    marginRight: 10,
  },
  searchInputBox: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#F3F4F6",
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 10,
    gap: 8,
  },
  searchInput: {
    flex: 1,
    fontSize: 15,
    fontWeight: "500",
    color: "#111827",
    padding: 0,
  },

  /* Result info */
  resultInfo: {
    paddingHorizontal: 16,
    paddingVertical: 10,
    backgroundColor: "#fff",
  },
  resultCount: {
    fontSize: 13,
    color: "#6B7280",
    fontWeight: "500",
  },

  /* Grid */
  grid: {
    padding: 12,
    paddingBottom: 100,
  },
  row: {
    justifyContent: "space-between",
    marginBottom: 10,
  },
  cardWrapper: {
    width: "31%",
  },

  /* Empty State */
  emptyContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: 40,
  },
  emptyIconBox: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: "#F3F4F6",
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 16,
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: "700",
    color: "#111827",
    marginBottom: 8,
  },
  emptySub: {
    fontSize: 14,
    color: "#6B7280",
    textAlign: "center",
    lineHeight: 20,
  },
  clearFiltersBtn: {
    marginTop: 16,
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#0A8754",
    backgroundColor: "#ECFDF5",
  },
  clearFiltersText: {
    color: "#0A8754",
    fontSize: 14,
    fontWeight: "700",
  },
});
