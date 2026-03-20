import React, { useEffect, useState } from "react";
import { View, Text, StyleSheet, FlatList, ActivityIndicator } from "react-native";
import { getTrendingProducts } from "../services/api/products";
import ProductCard from "./ProductCard";

const TrendingList = ({ filter }: any) => {
  const [products, setProducts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  useEffect(() => {
    loadTrending();
  }, [filter]); // Reload if filter changes just in case

  const loadTrending = async () => {
    setLoading(true);
    setError(false);
    try {
      const data = await getTrendingProducts();
      setProducts(data);
    } catch (e) {
      console.error("Error loading trending list:", e);
      setError(true);
    } finally {
      setLoading(false);
    }
  };

  const filtered =
    filter === "All"
      ? products
      : products.filter((p) => {
        const catName = (p.categoryName || "").toLowerCase();
        const subName = (p.subCategoryName || "").toLowerCase();
        const f = filter.toLowerCase();
        return catName.includes(f) || subName.includes(f);
      });

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="small" color="#0A8754" />
      </View>
    );
  }

  if (error) {
    return (
      <View style={styles.center}>
        <Text style={styles.errorText}>Unable to load products</Text>
      </View>
    );
  }

  if (filtered.length === 0) {
    return (
      <View style={styles.center}>
        <Text style={styles.emptyText}>
          {filter === "All" ? "No trending products yet" : `No products in "${filter}"`}
        </Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <FlatList
        data={filtered}
        horizontal
        showsHorizontalScrollIndicator={false}
        keyExtractor={(item, index) => item.id?.toString() || index.toString()}
        renderItem={({ item }) => (
          <View style={{ width: 175, marginRight: 12 }}>
            <ProductCard product={item} />
          </View>
        )}
        contentContainerStyle={{ paddingLeft: 16, paddingRight: 8, paddingBottom: 10 }}
      />
    </View>
  );
};

export default TrendingList;

const styles = StyleSheet.create({
  container: {
    minHeight: 240,
  },
  center: {
    height: 150,
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: 20,
  },
  errorText: {
    color: "#E8294A",
    fontSize: 13,
    fontWeight: "600",
  },
  emptyText: {
    color: "#999",
    fontSize: 13,
    fontStyle: "italic",
    textAlign: "center",
  },
});
