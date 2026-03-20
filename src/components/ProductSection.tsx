import React, { useEffect, useState } from "react";
import { View, Text, StyleSheet, FlatList, ActivityIndicator } from "react-native";
import { getProducts } from "../services/api/products";
import ProductCard from "./ProductCard";

const ProductSection = () => {
  const [products, setProducts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadProducts();
  }, []);

  const loadProducts = async () => {
    setLoading(true);
    try {
      const data = await getProducts();
      setProducts(data.slice(0, 10)); // Just a sample
    } catch (e) {
      console.error("Error loading product section:", e);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="small" color="#0A8754" />
      </View>
    );
  }

  if (products.length === 0) return null;

  return (
    <View style={styles.container}>
      <Text style={styles.heading}>Trending</Text>

      <FlatList
        data={products}
        horizontal
        showsHorizontalScrollIndicator={false}
        keyExtractor={(item, index) => item.id?.toString() || index.toString()}
        renderItem={({ item }) => (
          <View style={{ width: 140, marginRight: 15 }}>
            <ProductCard product={item} />
          </View>
        )}
      />
    </View>
  );
};

export default ProductSection;

const styles = StyleSheet.create({
  container: {
    marginTop: 25,
    paddingLeft: 16,
  },
  heading: {
    fontSize: 18,
    fontWeight: "700",
    marginBottom: 15,
    color: "#111",
  },
  center: {
    height: 150,
    justifyContent: "center",
    alignItems: "center",
  },
});