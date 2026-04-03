import React from "react";
import {
  View,
  Text,
  FlatList,
  StyleSheet,
  TouchableOpacity,
  Image,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useNavigation } from "@react-navigation/native";
import { useCart, Product } from "../context/CartContext";
import { Ionicons } from "@expo/vector-icons";
import { getProductPackLabel } from "../utils/product";

const WishlistItem = ({ item, onMoveToCart, onRemove }: any) => {
  const imageUrl = item.image || item.imageUrl || item.thumbnail || "https://via.placeholder.com/150";
  const packLabel = getProductPackLabel(item) || "1 unit";
  return (
    <View style={styles.wishlistItem}>
      <Image source={{ uri: imageUrl }} style={styles.wishlistImg} resizeMode="contain" />
      <View style={styles.wishlistInfo}>
        <Text style={styles.itemName} numberOfLines={2}>{item.name}</Text>
        <Text style={styles.itemUnit}>{packLabel}</Text>
        <Text style={styles.itemPrice}>₹{item.price}</Text>
        <View style={styles.actionRow}>
          <TouchableOpacity style={styles.moveToCartBtn} onPress={() => onMoveToCart(item)}>
            <Text style={styles.moveToCartText}>Move to Cart</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.removeBtn} onPress={() => onRemove(item.id)}>
            <Ionicons name="trash-outline" size={20} color="#EF4444" />
          </TouchableOpacity>
        </View>
      </View>
    </View>
  );
};

const WishlistScreen = () => {
  const { wishlist, removeFromWishlist, addToCart } = useCart();
  const insets = useSafeAreaInsets();
  const navigation = useNavigation<any>();

  const handleMoveToCart = (item: Product) => {
    addToCart(item);
    removeFromWishlist(item.id);
  };

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity style={styles.backBtn} onPress={() => navigation.goBack()}>
          <Ionicons name="arrow-back" size={24} color="#111827" />
        </TouchableOpacity>
        <Text style={styles.title}>My Wishlist</Text>
        <View style={{ width: 40 }} /> {/* balance layout */}
      </View>

      <FlatList
        data={wishlist}
        keyExtractor={(item) => item.id}
        contentContainerStyle={{ padding: 16 }}
        renderItem={({ item }) => (
          <WishlistItem 
            item={item} 
            onMoveToCart={handleMoveToCart} 
            onRemove={removeFromWishlist} 
          />
        )}
        showsVerticalScrollIndicator={false}
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <View style={styles.emptyIconBox}>
              <Ionicons name="heart-half-outline" size={48} color="#9CA3AF" />
            </View>
            <Text style={styles.emptyTitle}>Your Wishlist is Empty</Text>
            <Text style={styles.emptySub}>Save your favorite items to quickly find them later.</Text>
            <TouchableOpacity style={styles.shopBtn} onPress={() => navigation.goBack()}>
              <Text style={styles.shopBtnText}>Start Shopping</Text>
            </TouchableOpacity>
          </View>
        }
      />
    </View>
  );
};

export default WishlistScreen;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#F9FAFB",
  },
  
  /* Header Setup */
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: "#fff",
    borderBottomWidth: 1,
    borderBottomColor: "#F3F4F6",
  },
  backBtn: {
    width: 40, height: 40,
    borderRadius: 20,
    backgroundColor: "#F3F4F6",
    justifyContent: "center",
    alignItems: "center",
  },
  title: {
    fontSize: 18,
    fontWeight: "700",
    color: "#111827",
  },

  /* Empty State */
  emptyContainer: {
    alignItems: "center",
    justifyContent: "center",
    marginTop: 80,
    paddingHorizontal: 24,
  },
  emptyIconBox: {
    width: 96,
    height: 96,
    borderRadius: 48,
    backgroundColor: "#F3F4F6",
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 20,
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
    marginBottom: 24,
    lineHeight: 20,
  },
  shopBtn: {
    backgroundColor: "#0A8754",
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 12,
  },
  shopBtnText: {
    color: "#fff",
    fontSize: 15,
    fontWeight: "700",
  },
  
  /* Wishlist Item */
  wishlistItem: {
    flexDirection: "row",
    backgroundColor: "#fff",
    padding: 12,
    marginBottom: 12,
    borderRadius: 12,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 2,
    alignItems: "center",
  },
  wishlistImg: {
    width: 80,
    height: 80,
    marginRight: 12,
  },
  wishlistInfo: {
    flex: 1,
  },
  itemName: {
    fontSize: 14,
    fontWeight: "600",
    color: "#111827",
    marginBottom: 2,
  },
  itemUnit: {
    fontSize: 12,
    color: "#6B7280",
    marginBottom: 4,
  },
  itemPrice: {
    fontSize: 15,
    fontWeight: "700",
    color: "#0A8754",
    marginBottom: 8,
  },
  actionRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  moveToCartBtn: {
    flex: 1,
    backgroundColor: "#FCE7F3",
    borderWidth: 1,
    borderColor: "#F9A8D4",
    paddingVertical: 6,
    borderRadius: 6,
    alignItems: "center",
    marginRight: 12,
  },
  moveToCartText: {
    color: "#DB2777",
    fontWeight: "600",
    fontSize: 13,
  },
  removeBtn: {
    padding: 6,
    backgroundColor: "#FEE2E2",
    borderRadius: 6,
  },
});
