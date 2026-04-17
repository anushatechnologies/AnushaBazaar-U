import React, { useEffect, useState } from "react";
import {
  View,
  StyleSheet,
  FlatList,
  ActivityIndicator,
} from "react-native";
import { getBestSellerProducts } from "../services/api/products";
import ProductCard from "./ProductCard";
import { scale } from "../utils/responsive";

const BestSellerSection = ({ filter }: { filter?: string }) => {
  const [products, setProducts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  useEffect(() => {
    loadBestSellers();
  }, []);

  const loadBestSellers = async () => {
    setLoading(true);
    setError(false);
    try {
      const data = await getBestSellerProducts();
      setProducts(data);
    } catch (e) {
      console.error("Error loading best sellers:", e);
      setError(true);
    } finally {
      setLoading(false);
    }
  };

  const filtered = (!filter || filter === "All")
    ? products
    : products.filter((p: any) => {
        const catName = (p.categoryName || "").toLowerCase();
        const subName = (p.subCategoryName || "").toLowerCase();
        const name = (p.name || "").toLowerCase();
        const f = filter.toLowerCase();
        return catName.includes(f) || subName.includes(f) || name.includes(f);
      });

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="small" color="#0A8754" />
      </View>
    );
  }

  if (error) return null;

  if (filtered.length === 0) return null;

  return (
    <View style={styles.container}>
      <FlatList
        data={filtered}
        horizontal
        showsHorizontalScrollIndicator={false}
        keyExtractor={(item, index) => item.id?.toString() || index.toString()}
        renderItem={({ item }) => (
          <View style={{ width: scale(150), marginRight: scale(14) }}>
            <ProductCard product={item} />
          </View>
        )}
        contentContainerStyle={{ paddingLeft: scale(16), paddingRight: scale(8) }}
      />
    </View>
  );
};

export default BestSellerSection;

const styles = StyleSheet.create({
  container: {
    minHeight: scale(260),
  },
  center: {
    height: scale(150),
    justifyContent: "center",
    alignItems: "center",
  },
});
