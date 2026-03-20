import React, { useState, useCallback } from "react";
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  Image,
  ActivityIndicator,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useNavigation, useFocusEffect } from "@react-navigation/native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useAuth } from "../context/AuthContext";
import { getOrders } from "../services/api/orders";
import { useCart } from "../context/CartContext";
import FloatingCart from "../components/FloatingCart";

const OrdersScreen = () => {
  const navigation = useNavigation<any>();
  const insets = useSafeAreaInsets();
  const { jwtToken } = useAuth();
  const { addToCart } = useCart();

  const [orders, setOrders] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const fetchOrders = useCallback(async () => {
    if (!jwtToken) {
      setOrders([]);
      setLoading(false);
      return;
    }
    setLoading(true);
    setErrorMsg(null);
    try {
      const data = await getOrders(jwtToken);
      setOrders(Array.isArray(data) ? data : []);
    } catch (error: any) {
      console.error("Error loading orders:", error);
      setErrorMsg(error.message || "Failed to load orders");
    } finally {
      setLoading(false);
    }
  }, [jwtToken]);

  // Refresh orders every time the screen comes into focus
  useFocusEffect(
    useCallback(() => {
      fetchOrders();
    }, [fetchOrders])
  );

  const getStatusStyle = (status: string) => {
    const s = (status || "").toLowerCase();
    if (s === "delivered") return { color: "#4B5563", bg: "#F3F4F6" };
    if (s === "cancelled") return { color: "#EF4444", bg: "#FEF2F2" };
    return { color: "#0A8754", bg: "#ECFDF5" }; // In Progress, Pending, etc.
  };

  const renderOrder = ({ item }: { item: any }) => {
    const { color, bg } = getStatusStyle(item.orderStatus || item.status);
    const orderItems = item.items || item.orderItems || [];
    const orderId = item.id || item.orderId;
    const orderNumber = item.orderNumber || `#${orderId}`;
    const orderDate = item.placedAt || item.createdAt || item.orderDate || item.date;
    const formattedDate = orderDate
      ? new Date(orderDate).toLocaleDateString("en-IN", {
          day: "2-digit",
          month: "short",
          year: "numeric",
          hour: "2-digit",
          minute: "2-digit",
        })
      : "";

    return (
      <View style={styles.orderCard}>
        <View style={styles.orderHeader}>
          <View>
            <Text style={styles.orderId}>{orderNumber}</Text>
            <Text style={styles.orderDate}>{formattedDate}</Text>
          </View>
          <View style={[styles.statusBadge, { backgroundColor: bg, borderWidth: 1, borderColor: bg }]}>
            <Text style={[styles.statusText, { color }]}>{item.orderStatus || item.status || "Pending"}</Text>
          </View>
        </View>

        <View style={styles.itemsSummary}>
          <Text style={styles.sectionLabel}>Items</Text>
          {/* Product Images Row */}
          <View style={styles.imagesRow}>
            {orderItems.slice(0, 4).map((prod: any, idx: number) => {
              const imgUrl = prod.productImage || prod.image || prod.imageUrl || prod.thumb || prod.product?.image || prod.product?.imageUrl || prod.product?.icon;
              return (
                <View key={idx} style={styles.productImgBox}>
                  {imgUrl ? (
                    <Image source={{ uri: imgUrl }} style={styles.productImg} resizeMode="contain" />
                  ) : (
                    <Ionicons name="basket-outline" size={24} color="#D1D5DB" />
                  )}
                </View>
              );
            })}
            {orderItems.length > 4 && (
              <View style={styles.moreImgBox}>
                <Text style={styles.moreImgText}>+{orderItems.length - 4}</Text>
              </View>
            )}
          </View>

          {/* Product Names & Total Price */}
          <View style={styles.priceRow}>
            <Text style={styles.itemsText} numberOfLines={2}>
              {orderItems.map((i: any) => i.productName || i.name || i.title || i.product?.name || i.product?.productName || "Unknown Item").join(", ")}
            </Text>
            <Text style={styles.amountText}>₹{(item.grandTotal || item.totalAmount || item.totalPrice || item.amount || 0).toLocaleString()}</Text>
          </View>
        </View>

        <View style={styles.footer}>
          <TouchableOpacity 
            style={styles.reorderBtn} 
            onPress={() => handleReorder(orderItems)}
          >
            <Text style={styles.reorderText}>Reorder</Text>
          </TouchableOpacity>
          {(item.orderStatus || item.status || "").toLowerCase() !== "delivered" && (item.orderStatus || item.status || "").toLowerCase() !== "cancelled" && (
            <TouchableOpacity
              style={styles.trackBtn}
              onPress={() => navigation.navigate("OrderTracking", { orderId })}
            >
              <View style={styles.trackDot} />
              <Text style={styles.trackText}>Track Order</Text>
              <Ionicons name="chevron-forward" size={16} color="#0A8754" />
            </TouchableOpacity>
          )}
        </View>
      </View>
    );
  };

  const handleReorder = (items: any[]) => {
    if (!items || items.length === 0) return;
    
    items.forEach(item => {
      // Map order item to cart item format
      const cartItem = {
        id: item.productId || item.id,
        name: item.productName || item.name || "Product",
        price: item.unitPrice || item.price || 0,
        image: item.productImage || item.image || "",
        unit: item.unit || "",
      };
      addToCart(cartItem);
    });

    navigation.navigate("Cart");
  };

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      {/* Header Setup */}
      <View style={styles.header}>
        <TouchableOpacity style={styles.backBtn} onPress={() => navigation.goBack()}>
          <Ionicons name="arrow-back" size={24} color="#111827" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>My Orders</Text>
        <View style={{ width: 40 }} />
      </View>

      {loading ? (
        <View style={styles.emptyContainer}>
          <ActivityIndicator size="large" color="#0A8754" />
        </View>
      ) : (
        <FlatList
          data={orders}
          keyExtractor={(item, idx) => String(item.id || item.orderId || idx)}
          renderItem={renderOrder}
          contentContainerStyle={styles.listContent}
          showsVerticalScrollIndicator={false}
          ListEmptyComponent={
            <View style={styles.emptyContainer}>
              <View style={styles.emptyIconBox}>
                <Ionicons name={errorMsg ? "alert-circle-outline" : "receipt-outline"} size={48} color={errorMsg ? "#EF4444" : "#9CA3AF"} />
              </View>
              <Text style={styles.emptyTitle}>{errorMsg ? "Oops!" : "No Orders Yet"}</Text>
              <Text style={styles.emptySub}>{errorMsg || "You haven't placed any orders. Start browsing now!"}</Text>
              {errorMsg && (
                <TouchableOpacity style={[styles.reorderBtn, { marginTop: 20 }]} onPress={fetchOrders}>
                  <Text style={styles.reorderText}>Try Again</Text>
                </TouchableOpacity>
              )}
            </View>
          }
        />
      )}
      <FloatingCart currentRoute="Orders" />
    </View>
  );
};

export default OrdersScreen;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#F9FAFB",
  },
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
  headerTitle: {
    fontSize: 18,
    fontWeight: "700",
    color: "#111827",
  },
  listContent: {
    padding: 16,
    paddingBottom: 40,
  },
  orderCard: {
    backgroundColor: "#fff",
    borderRadius: 16,
    padding: 16,
    marginBottom: 16,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.03,
    shadowRadius: 6,
    elevation: 2,
    borderWidth: 1,
    borderColor: "#F3F4F6",
  },
  orderHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    marginBottom: 16,
  },
  orderId: {
    fontSize: 16,
    fontWeight: "700",
    color: "#111827",
  },
  orderDate: {
    fontSize: 13,
    color: "#6B7280",
    marginTop: 4,
    fontWeight: "500",
  },
  statusBadge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 8,
  },
  statusText: {
    fontSize: 11,
    fontWeight: "800",
    textTransform: "uppercase",
  },
  itemsSummary: {
    paddingVertical: 14,
  },
  sectionLabel: {
    fontSize: 12,
    fontWeight: "800",
    color: "#9CA3AF",
    textTransform: "uppercase",
    marginBottom: 10,
    letterSpacing: 0.5,
  },
  imagesRow: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 12,
  },
  productImgBox: {
    width: 48, height: 48,
    borderRadius: 8,
    backgroundColor: "#F9FAFB",
    borderWidth: 1,
    borderColor: "#F3F4F6",
    marginRight: 8,
    justifyContent: "center",
    alignItems: "center",
    overflow: "hidden",
  },
  productImg: {
    width: "80%", height: "80%",
  },
  moreImgBox: {
    width: 48, height: 48,
    borderRadius: 8,
    backgroundColor: "#F3F4F6",
    justifyContent: "center",
    alignItems: "center",
  },
  moreImgText: {
    fontSize: 14,
    fontWeight: "700",
    color: "#4B5563",
  },
  priceRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  itemsText: {
    flex: 1,
    fontSize: 14,
    color: "#4B5563",
    marginRight: 16,
    lineHeight: 20,
  },
  amountText: {
    fontSize: 16,
    fontWeight: "800",
    color: "#111827",
  },
  footer: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginTop: 16,
    alignItems: "center",
  },
  reorderBtn: {
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: "#E5E7EB",
    backgroundColor: "#F9FAFB",
  },
  reorderText: {
    fontSize: 14,
    fontWeight: "600",
    color: "#374151",
  },
  trackBtn: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#ECFDF5",
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: "#D1FAE5"
  },
  trackDot: {
    width: 6, height: 6,
    borderRadius: 3,
    backgroundColor: "#0A8754",
    marginRight: 8,
  },
  trackText: {
    fontSize: 14,
    fontWeight: "700",
    color: "#0A8754",
    marginRight: 4,
  },
  emptyContainer: {
    marginTop: 80,
    alignItems: "center",
  },
  emptyIconBox: {
    width: 80, height: 80,
    borderRadius: 40,
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
    paddingHorizontal: 40,
  },
});