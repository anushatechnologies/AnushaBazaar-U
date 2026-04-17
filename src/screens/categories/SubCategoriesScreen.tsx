import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  Image,
  Pressable,
  ActivityIndicator,
  TouchableOpacity,
} from "react-native";
import { useNavigation } from "@react-navigation/native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { getSubcategoriesByCategory } from "../../services/api/subcategories";
import { scale } from "../../utils/responsive";
import FloatingCart from "../../components/FloatingCart";
import SearchBar from "../../components/SearchBar";

// Blinkit inspired pastel backgrounds for subcategories
const PASTEL_COLORS = [
  "#F4F6F9", "#FDF5E6", "#F0F8FF", "#F5FFFA", "#FFF0F5", "#F8F8FF", "#FFFFF0", "#E6E6FA"
];

const SubCategoriesScreen = ({ route }: any) => {
  const navigation = useNavigation<any>();
  const insets = useSafeAreaInsets();
  const { category } = route.params;
  const categoryId = category?.id || category?._id;

  const [subcategories, setSubCategories] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");

  useEffect(() => {
    loadSubcategories();
  }, [categoryId]);

  const loadSubcategories = async () => {
    setLoading(true);
    try {
      const data = await getSubcategoriesByCategory(categoryId);
      const items = Array.isArray(data) ? data : data?.data || [];
      setSubCategories(items);
    } catch (error) {
      console.error("Error loading subcategories:", error);
    } finally {
      setLoading(false);
    }
  };

  const renderSubcategoryItem = ({ item, index }: { item: any; index: number }) => {
    const imageUrl = item.image || item.imageUrl || item.icon;
    const isLocalImage = typeof imageUrl === "number";
    const bgPattern = PASTEL_COLORS[index % PASTEL_COLORS.length];

    return (
      <Pressable
        style={({ pressed }) => [
          styles.subCatCard,
          pressed && { opacity: 0.8, transform: [{ scale: 0.96 }] }
        ]}
        onPress={() => {
          navigation.navigate("CategoryProducts", { 
            category: category, 
            initialSubCategoryId: item.id || item._id 
          });
        }}
      >
        <View style={[styles.subCatImgContainer, { backgroundColor: bgPattern }]}>
          {imageUrl ? (
            <Image
              source={isLocalImage ? imageUrl : { uri: imageUrl }}
              style={styles.subCatImage}
              resizeMode="cover"
            />
          ) : (
            <Ionicons name="pricetag-outline" size={30} color="#bbb" />
          )}
        </View>
        <Text style={styles.subCatTitle} numberOfLines={2}>
          {item.name || item.title}
        </Text>
      </Pressable>
    );
  };

  const filteredSubcategories = search.trim() 
    ? subcategories.filter(s => (s.name || s.title || "").toLowerCase().includes(search.toLowerCase()))
    : subcategories;

  return (
    <View style={styles.root}>
      {/* HEADER */}
      <View style={[styles.topBar, { paddingTop: Math.max(insets.top, scale(12)) }]}>
        <TouchableOpacity
          onPress={() => navigation.goBack()}
          style={styles.backBtn}
          activeOpacity={0.7}
        >
          <Ionicons name="arrow-back" size={scale(24)} color="#111" />
        </TouchableOpacity>

        <Text style={styles.topBarTitle} numberOfLines={1}>
          {category?.name || "Explore Category"}
        </Text>
      </View>

      <SearchBar
        value={search}
        onChangeText={setSearch}
        placeholder={`Search in ${category?.name || 'category'}...`}
      />

      {loading ? (
        <View style={styles.loader}>
          <ActivityIndicator size="large" color="#0A8754" />
          <Text style={styles.loaderText}>Loading subcategories…</Text>
        </View>
      ) : subcategories.length === 0 ? (
        <View style={styles.emptyContainer}>
          <View style={styles.emptyIcon}>
            <Ionicons name="cart-outline" size={scale(56)} color="#9CA3AF" />
          </View>
          <Text style={styles.emptyText}>No subcategories found</Text>
          <Pressable 
             style={styles.browseAllBtn}
             onPress={() => {
                navigation.navigate("CategoryProducts", { 
                   category: category, 
                   initialSubCategoryId: "all" 
                });
             }}
          >
             <Text style={styles.browseAllBtnText}>Browse All Products</Text>
          </Pressable>
        </View>
      ) : (
        <FlatList
          data={filteredSubcategories}
          keyExtractor={(item, index) => (item.id || item._id || index).toString()}
          numColumns={3}
          showsVerticalScrollIndicator={false}
          contentContainerStyle={{ padding: scale(16), paddingBottom: scale(100) }}
          renderItem={renderSubcategoryItem}
          ListHeaderComponent={
            <View style={styles.listHeader}>
                <Text style={styles.listTitle}>All Subcategories</Text>
            </View>
          }
        />
      )}
      
      <FloatingCart currentRoute="SubCategories" />
    </View>
  );
};

export default SubCategoriesScreen;

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: "#fff",
  },
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
  listHeader: {
    marginBottom: scale(16),
  },
  listTitle: {
    fontSize: scale(16),
    fontWeight: "800",
    color: "#111827",
    letterSpacing: -0.3,
  },
  subCatCard: {
    width: "31%",
    marginRight: "3.5%", // Slightly larger gap to fit exactly 1/3
    marginBottom: scale(24),
    alignItems: "center",
  },
  subCatImgContainer: {
    width: "100%",
    aspectRatio: 0.9,
    borderRadius: scale(16),
    justifyContent: "center",
    alignItems: "center",
    marginBottom: scale(10),
    overflow: "hidden",
    backgroundColor: "#f8f8f8",
    padding: scale(8),
    borderWidth: 1,
    borderColor: "rgba(0,0,0,0.04)",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: scale(2) },
    shadowOpacity: 0.03,
    shadowRadius: scale(4),
    elevation: 1,
  },
  subCatImage: {
    width: "85%",
    height: "85%",
    resizeMode: "contain",
  },
  subCatTitle: {
    fontSize: scale(11.5),
    fontWeight: "600",
    color: "#374151",
    textAlign: "center",
    lineHeight: scale(15),
  },
  emptyContainer: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingTop: scale(40),
  },
  emptyIcon: {
    width: scale(120),
    height: scale(120),
    borderRadius: scale(60),
    backgroundColor: "#F3F4F6",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: scale(16),
  },
  emptyText: {
    fontSize: scale(15),
    color: "#6B7280",
    fontWeight: "500",
    marginBottom: scale(24),
  },
  browseAllBtn: {
    backgroundColor: "#0A8754",
    paddingHorizontal: scale(24),
    paddingVertical: scale(12),
    borderRadius: scale(24),
    elevation: 2,
    shadowColor: "#0A8754",
    shadowOpacity: 0.3,
    shadowRadius: scale(6),
    shadowOffset: { width: 0, height: scale(3) },
  },
  browseAllBtnText: {
    color: "#fff",
    fontWeight: "700",
    fontSize: scale(14),
  },
});
