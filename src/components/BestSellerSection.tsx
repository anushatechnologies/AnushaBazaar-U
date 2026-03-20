import React, { useEffect, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  ActivityIndicator,
} from "react-native";
import { getBestSellerProducts } from "../services/api/products";
import ProductCard from "./ProductCard";

const BestSellerSection = () => {
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

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="small" color="#0A8754" />
      </View>
    );
  }

  if (error) return null; // Silent fail for section

  if (products.length === 0) return null;

  return (
    <View style={styles.container}>
      <FlatList
        data={products}
        horizontal
        showsHorizontalScrollIndicator={false}
        keyExtractor={(item, index) => item.id?.toString() || index.toString()}
        renderItem={({ item }) => (
          <View style={{ width: 150, marginRight: 14 }}>
            <ProductCard product={item} />
          </View>
        )}
        contentContainerStyle={{ paddingLeft: 16, paddingRight: 8 }}
      />
    </View>
  );
};

export default BestSellerSection;

const styles = StyleSheet.create({
  container: {
    minHeight: 260,
  },
  center: {
    height: 150,
    justifyContent: "center",
    alignItems: "center",
  },
});