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
      <View style={{ width: "31%", marginBottom: 12 }}>
        <ProductCard product={mappedProduct} />
      </View>
    );
  };

  return (
    <View style={{ flex: 1, backgroundColor: "#f9fdfb" }}>
      {/* ─── Custom TopBar with Inline Search ─── */}
      <View style={[styles.topBar, { paddingTop: Math.max(insets.top, 12) }]}>
        <TouchableOpacity
          onPress={() => navigation.goBack()}
          style={styles.backBtn}
          activeOpacity={0.7}
        >
          <Ionicons name="arrow-back" size={24} color="#111" />
        </TouchableOpacity>

        {isSearching ? (
          <View style={styles.searchInputBox}>
            <Ionicons name="search" size={18} color="#9CA3AF" />
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
                <Ionicons name="close-circle" size={18} color="#D1D5DB" />
              </TouchableOpacity>
            )}
          </View>
        ) : (
          <Text style={styles.topBarTitle} numberOfLines={1}>
            {category?.name || "Category"}
          </Text>
        )}

        <TouchableOpacity onPress={toggleSearch} style={styles.searchIconBtn} activeOpacity={0.7}>
          <Ionicons name={isSearching ? "close" : "search-outline"} size={22} color="#111" />
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
            <ActivityIndicator size="small" color="#0A8754" style={{ marginTop: 20 }} />
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
                        <Ionicons name="grid-outline" size={20} color={isSelected ? "#0A8754" : "#555"} />
                      </View>
                    ) : imageUrl ? (
                      <Image
                        source={isLocalImage ? imageUrl : { uri: imageUrl }}
                        style={styles.icon}
                      />
                    ) : (
                      <View style={[styles.icon, { backgroundColor: "#e9f7f1", borderRadius: 20 }]} />
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
              contentContainerStyle={{ padding: 10 }}
              columnWrapperStyle={{ justifyContent: "space-between" }}
            />
          ) : displayed.length === 0 ? (
            <View style={styles.emptyContainer}>
              <Ionicons name="search-outline" size={50} color="#ccc" />
              <Text style={styles.emptyText}>
                {searchQuery.trim()
                  ? `No products found for "${searchQuery}"`
                  : "No products match filters."}
              </Text>
              <TouchableOpacity onPress={() => { handleSort("default"); handlePrice(PRICE_RANGES[0]); setSearchQuery(""); }}>
                <Text style={{ color: "#0A8754", fontWeight: "700", marginTop: 10 }}>Clear Filters</Text>
              </TouchableOpacity>
            </View>
          ) : (
            <FlatList
              data={displayed}
              numColumns={2}
              keyExtractor={(item, index) => (item.id || item._id || index).toString()}
              renderItem={renderProductItem}
              contentContainerStyle={{ padding: 10, paddingBottom: 100 }}
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
    paddingHorizontal: 12,
    paddingBottom: 14,
    borderBottomWidth: 1,
    borderBottomColor: "#F3F4F6",
    elevation: 2,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 10,
  },
  backBtn: {
    padding: 4,
    marginRight: 10,
  },
  topBarTitle: {
    flex: 1,
    fontSize: 18,
    fontWeight: "700",
    color: "#111",
    letterSpacing: -0.5,
  },
  searchInputBox: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#F3F4F6",
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 8,
    gap: 8,
  },
  searchInput: {
    flex: 1,
    fontSize: 15,
    fontWeight: "500",
    color: "#111827",
    padding: 0,
  },
  searchIconBtn: {
    width: 40,
    height: 40,
    justifyContent: "center",
    alignItems: "center",
    borderRadius: 20,
    backgroundColor: "#F9FAFB",
    marginLeft: 8,
  },

  container: {
    flex: 1,
    flexDirection: "row",
  },

  sidebar: {
    width: 85,
    backgroundColor: "#fff",
    borderRightWidth: 1,
    borderRightColor: "#eee",
  },

  sideItem: {
    alignItems: "center",
    padding: 12,
    borderBottomWidth: 1,
    borderBottomColor: "#f5f5f5",
  },

  active: {
    borderLeftWidth: 4,
    borderLeftColor: "#0A8754",
    backgroundColor: "#f1faf5",
  },

  icon: {
    width: 40,
    height: 40,
    resizeMode: "contain",
    marginBottom: 6,
  },

  allIconContainer: {
    width: 40,
    height: 40,
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 6,
    backgroundColor: "#f5f5f5",
    borderRadius: 20,
  },

  text: {
    fontSize: 10,
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
    paddingTop: 50,
  },

  emptyText: {
    marginTop: 10,
    color: "#888",
    fontSize: 16,
    textAlign: "center",
    paddingHorizontal: 20,
  }
});