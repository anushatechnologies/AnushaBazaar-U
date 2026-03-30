import React, { useState, useEffect, useRef } from "react";
import {
  View,
  StyleSheet,
  FlatList,
  Pressable,
  Image,
  Text,
  TextInput,
  ActivityIndicator,
  TouchableOpacity,
  Keyboard,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useNavigation } from "@react-navigation/native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import ProductFilterBar, { SortOption, PRICE_RANGES } from "../components/ProductFilterBar";
import SkeletonCard from "../components/SkeletonCard";
import ProductCard from "../components/ProductCard";
import { getSubcategoriesByCategory } from "../services/api/subcategories";
import { filterProducts } from "../services/api/products";
import FloatingCart from "../components/FloatingCart";
import { scale } from "../utils/responsive";

const CategoryProductsScreen = ({ route }: any) => {
  const navigation = useNavigation<any>();
  const insets = useSafeAreaInsets();
  const { category } = route.params;
  const categoryId = category?.id || category?._id;

  const [subcategories, setSubCategories] = useState<any[]>([]);
  const [selectedSubId, setSelectedSubId] = useState<string | number>("all");

  const [products, setProducts] = useState<any[]>([]);
  const [displayed, setDisplayed] = useState<any[]>([]);
  const [loadingSubcategories, setLoadingSubcategories] = useState(true);
  const [loadingProducts, setLoadingProducts] = useState(false);
  const [sortBy, setSort] = useState<SortOption>("default");
  const [priceRange, setPrice] = useState(PRICE_RANGES[0]);

  // Search state
  const [isSearching, setIsSearching] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const searchInputRef = useRef<TextInput>(null);

  useEffect(() => {
    loadSubcategories();
  }, [categoryId]);

  useEffect(() => {
    loadProducts(selectedSubId);
  }, [selectedSubId, categoryId]);

  // Re-apply filters whenever search query changes
  useEffect(() => {
    applyFilters(sortBy, priceRange, products);
  }, [searchQuery]);

  const loadSubcategories = async () => {
    setLoadingSubcategories(true);
    try {
      const data = await getSubcategoriesByCategory(categoryId);
      const items = Array.isArray(data) ? data : data?.data || [];
      const allOption = { id: "all", name: "All", icon: null };
      setSubCategories([allOption, ...items]);
    } catch (error) {
      console.error("Error loading subcategories:", error);
    } finally {
      setLoadingSubcategories(false);
    }
  };

  const loadProducts = async (subId: string | number) => {
    setLoadingProducts(true);
    try {
      const productList = await filterProducts(subId === "all" ? { categoryId } : { subCategoryId: subId });
      setProducts(productList);
      applyFilters(sortBy, priceRange, productList);
    } catch (error) {
      console.error("Error loading products:", error);
    } finally {
      setLoadingProducts(false);
    }
  };

  const applyFilters = (sort: SortOption, range: typeof PRICE_RANGES[0], base: any[]) => {
    let result = [...base];

    // Apply search filter
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase().trim();
      result = result.filter(p =>
        (p.name || p.title || "").toLowerCase().includes(q)
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

    setDisplayed(result);
  };

  const handleSort = (s: SortOption) => {
    setSort(s);
    applyFilters(s, priceRange, products);
  };

  const handlePrice = (r: typeof PRICE_RANGES[0]) => {
    setPrice(r);
    applyFilters(sortBy, r, products);
  };

  const toggleSearch = () => {
    if (isSearching) {
      setSearchQuery("");
      setIsSearching(false);
      Keyboard.dismiss();
    } else {
      setIsSearching(true);
      setTimeout(() => searchInputRef.current?.focus(), 100);
    }
  };

  const renderProductItem = ({ item }: any) => {
    const mappedProduct = {
      ...item,
      id: item.id || item._id,
      name: item.name || item.title,
      image: item.image || item.imageUrl || (item.imageUrls && item.imageUrls[0]),
    };

    return (
      <View style={{ width: "48%", marginBottom: scale(12) }}>
        <ProductCard product={mappedProduct} />
      </View>
    );
  };

  return (
    <View style={{ flex: 1, backgroundColor: "#f9fdfb" }}>
      {/* ─── Custom TopBar with Inline Search ─── */}
      <View style={[styles.topBar, { paddingTop: Math.max(insets.top, scale(12)) }]}>
        <TouchableOpacity
          onPress={() => navigation.goBack()}
          style={styles.backBtn}
          activeOpacity={0.7}
        >
          <Ionicons name="arrow-back" size={scale(24)} color="#111" />
        </TouchableOpacity>

        {isSearching ? (
          <View style={styles.searchInputBox}>
            <Ionicons name="search" size={scale(18)} color="#9CA3AF" />
            <TextInput
              ref={searchInputRef}
              style={styles.searchInput}
              placeholder="Search in this category..."
              placeholderTextColor="#9CA3AF"
              value={searchQuery}
              onChangeText={setSearchQuery}
              returnKeyType="search"
              onSubmitEditing={() => Keyboard.dismiss()}
            />
            {searchQuery.length > 0 && (
              <TouchableOpacity onPress={() => setSearchQuery("")}>
                <Ionicons name="close-circle" size={scale(18)} color="#D1D5DB" />
              </TouchableOpacity>
            )}
          </View>
        ) : (
          <Text style={styles.topBarTitle} numberOfLines={1}>
            {category?.name || "Category"}
          </Text>
        )}

        <TouchableOpacity onPress={toggleSearch} style={styles.searchIconBtn} activeOpacity={0.7}>
          <Ionicons name={isSearching ? "close" : "search-outline"} size={scale(22)} color="#111" />
        </TouchableOpacity>
      </View>

      <ProductFilterBar
        activeSort={sortBy}
        activePriceRange={priceRange}
        onSortChange={handleSort}
        onPriceChange={handlePrice}
        itemCount={displayed.length}
      />

      <View style={styles.container}>
        {/* LEFT SIDEBAR */}
        <View style={styles.sidebar}>
          {loadingSubcategories ? (
            <ActivityIndicator size="small" color="#0A8754" style={{ marginTop: scale(20) }} />
          ) : (
            <FlatList
              data={subcategories}
              keyExtractor={(item, index) => (item.id || item._id || index).toString()}
              showsVerticalScrollIndicator={false}
              renderItem={({ item }) => {
                const isSelected = selectedSubId === (item.id || item._id);
                const imageUrl = item.image || item.imageUrl || item.icon;
                const isLocalImage = typeof imageUrl === "number";

                return (
                  <Pressable
                    style={[
                      styles.sideItem,
                      isSelected && styles.active,
                    ]}
                    onPress={() => setSelectedSubId(item.id || item._id)}
                  >
                    {item.id === "all" ? (
                      <View style={styles.allIconContainer}>
                        <Ionicons name="grid-outline" size={scale(20)} color={isSelected ? "#0A8754" : "#555"} />
                      </View>
                    ) : imageUrl ? (
                      <Image
                        source={isLocalImage ? imageUrl : { uri: imageUrl }}
                        style={styles.icon}
                      />
                    ) : (
                      <View style={[styles.icon, { backgroundColor: "#e9f7f1", borderRadius: scale(20) }]} />
                    )}

                    <Text
                      style={[styles.text, isSelected && { fontWeight: "bold", color: "#0A8754" }]}
                      numberOfLines={2}
                    >
                      {item.name || item.title || "Subcategory"}
                    </Text>
                  </Pressable>
                );
              }}
            />
          )}
        </View>

        {/* PRODUCTS */}
        <View style={styles.productsContainer}>
          {loadingProducts ? (
            <FlatList
              data={[1, 2, 3, 4, 5, 6]}
              numColumns={2}
              renderItem={() => <SkeletonCard />}
              contentContainerStyle={{ padding: scale(10) }}
              columnWrapperStyle={{ justifyContent: "space-between" }}
            />
          ) : displayed.length === 0 ? (
            <View style={styles.emptyContainer}>
              <Ionicons name="search-outline" size={scale(50)} color="#ccc" />
              <Text style={styles.emptyText}>
                {searchQuery.trim()
                  ? `No products found for "${searchQuery}"`
                  : "No products match filters."}
              </Text>
              <TouchableOpacity onPress={() => { handleSort("default"); handlePrice(PRICE_RANGES[0]); setSearchQuery(""); }}>
                <Text style={{ color: "#0A8754", fontWeight: "700", marginTop: scale(10) }}>Clear Filters</Text>
              </TouchableOpacity>
            </View>
          ) : (
            <FlatList
              data={displayed}
              numColumns={2}
              keyExtractor={(item, index) => (item.id || item._id || index).toString()}
              renderItem={renderProductItem}
              contentContainerStyle={{ padding: scale(10), paddingBottom: scale(100) }}
              showsVerticalScrollIndicator={false}
              columnWrapperStyle={{ justifyContent: "space-between" }}
            />
          )}
        </View>
      </View>
      <FloatingCart currentRoute="CategoryProducts" />
    </View>
  );
};

export default CategoryProductsScreen;

const styles = StyleSheet.create({
  topBar: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#fff",
    paddingHorizontal: scale(12),
    paddingBottom: scale(14),
    borderBottomWidth: 1,
    borderBottomColor: "#F3F4F6",
    elevation: 2,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: scale(2) },
    shadowOpacity: 0.05,
    shadowRadius: scale(10),
  },
  backBtn: {
    padding: scale(4),
    marginRight: scale(10),
  },
  topBarTitle: {
    flex: 1,
    fontSize: scale(18),
    fontWeight: "700",
    color: "#111",
    letterSpacing: scale(-0.5),
  },
  searchInputBox: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#F3F4F6",
    borderRadius: scale(12),
    paddingHorizontal: scale(12),
    paddingVertical: scale(8),
    gap: scale(8),
  },
  searchInput: {
    flex: 1,
    fontSize: scale(15),
    fontWeight: "500",
    color: "#111827",
    padding: 0,
  },
  searchIconBtn: {
    width: scale(40),
    height: scale(40),
    justifyContent: "center",
    alignItems: "center",
    borderRadius: scale(20),
    backgroundColor: "#F9FAFB",
    marginLeft: scale(8),
  },

  container: {
    flex: 1,
    flexDirection: "row",
  },

  sidebar: {
    width: scale(85),
    backgroundColor: "#fff",
    borderRightWidth: 1,
    borderRightColor: "#eee",
  },

  sideItem: {
    alignItems: "center",
    padding: scale(12),
    borderBottomWidth: 1,
    borderBottomColor: "#f5f5f5",
  },

  active: {
    borderLeftWidth: scale(4),
    borderLeftColor: "#0A8754",
    backgroundColor: "#f1faf5",
  },

  icon: {
    width: scale(40),
    height: scale(40),
    resizeMode: "contain",
    marginBottom: scale(6),
  },

  allIconContainer: {
    width: scale(40),
    height: scale(40),
    justifyContent: "center",
    alignItems: "center",
    marginBottom: scale(6),
    backgroundColor: "#f5f5f5",
    borderRadius: scale(20),
  },

  text: {
    fontSize: scale(10),
    textAlign: "center",
    color: "#555",
  },

  productsContainer: {
    flex: 1,
    backgroundColor: "#f9fdfb",
  },

  emptyContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingTop: scale(50),
  },

  emptyText: {
    marginTop: scale(10),
    color: "#888",
    fontSize: scale(16),
    textAlign: "center",
    paddingHorizontal: scale(20),
  }
});