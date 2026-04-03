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
import AppLoader from "../components/AppLoader";
import FloatingCart from "../components/FloatingCart";
import { scale } from "../utils/responsive";
import { resolveImageSource } from "../utils/image";

const OrdersScreen = () => {
  const navigation = useNavigation<any>();
  const insets = useSafeAreaInsets();
  const { jwtToken, user } = useAuth();
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
      const data = await getOrders(jwtToken, user?.customerId);
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

  const handleReorder = (items: any[]) => {
    if (!items || items.length === 0) return;
    
    items.forEach(item => {
      // Map order item to cart item format
      // variantId is critical — addToCart uses it to call the backend API
      const resolvedVariantId = item.variantId || item.productVariantId || item.variant?.id;
      const cartItem = {
        id: String(item.productId || item.id),
        variantId: resolvedVariantId,
        productId: item.productId || item.id,
        name: item.productName || item.name || "Product",
        price: item.unitPrice || item.price || 0,
        image: item.productImage || item.image || "",
        unit: item.unit || "",
      };
      addToCart(cartItem);
    });

    navigation.navigate("Cart");
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
              const source = resolveImageSource(imgUrl, { width: 100, height: 100 });
              return (
                <View key={idx} style={styles.productImgBox}>
                  {source ? (
                    <Image source={source as any} style={styles.productImg} resizeMode="contain" />
                  ) : (
                    <Ionicons name="basket-outline" size={scale(24)} color="#D1D5DB" />
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
              <Ionicons name="chevron-forward" size={scale(16)} color="#0A8754" />
            </TouchableOpacity>
          )}
        </View>
      </View>
    );
  };

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      {/* Header Setup */}
      <View style={styles.header}>
        <TouchableOpacity style={styles.backBtn} onPress={() => navigation.goBack()}>
          <Ionicons name="arrow-back" size={scale(24)} color="#111827" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>My Orders</Text>
        <View style={{ width: scale(40) }} />
      </View>

      {loading ? (
        <View style={styles.emptyContainer}>
          <AppLoader size="large" />
        </View>
      ) : (
        <FlatList
          data={orders}
          keyExtractor={(item, idx) => String(item.id || item.orderId || idx)}
          renderItem={renderOrder}
          contentContainerStyle={styles.listContent}
          showsVerticalScrollIndicator={false}
          initialNumToRender={5}
          maxToRenderPerBatch={5}
          windowSize={5}
          removeClippedSubviews={true}
          ListEmptyComponent={
            <View style={styles.emptyContainer}>
              <View style={styles.emptyIconBox}>
                <Ionicons name={errorMsg ? "alert-circle-outline" : "receipt-outline"} size={scale(48)} color={errorMsg ? "#EF4444" : "#9CA3AF"} />
              </View>
              <Text style={styles.emptyTitle}>{errorMsg ? "Oops!" : "No Orders Yet"}</Text>
              <Text style={styles.emptySub}>{errorMsg || "You haven't placed any orders. Start browsing now!"}</Text>
              {errorMsg && (
                <TouchableOpacity style={[styles.reorderBtn, { marginTop: scale(20) }]} onPress={fetchOrders}>
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
    paddingHorizontal: scale(16),
    paddingVertical: scale(12),
    backgroundColor: "#fff",
    borderBottomWidth: 1,
    borderBottomColor: "#F3F4F6",
  },
  backBtn: {
    width: scale(40), height: scale(40),
    borderRadius: scale(20),
    backgroundColor: "#F3F4F6",
    justifyContent: "center",
    alignItems: "center",
  },
  headerTitle: {
    fontSize: scale(18),
    fontWeight: "700",
    color: "#111827",
  },
  listContent: {
    padding: scale(16),
    paddingBottom: scale(40),
  },
  orderCard: {
    backgroundColor: "#fff",
    borderRadius: scale(16),
    padding: scale(16),
    marginBottom: scale(16),
    shadowColor: "#000",
    shadowOffset: { width: 0, height: scale(2) },
    shadowOpacity: 0.03,
    shadowRadius: scale(6),
    elevation: 2,
    borderWidth: 1,
    borderColor: "#F3F4F6",
  },
  orderHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    marginBottom: scale(16),
  },
  orderId: {
    fontSize: scale(16),
    fontWeight: "700",
    color: "#111827",
  },
  orderDate: {
    fontSize: scale(13),
    color: "#6B7280",
    marginTop: scale(4),
    fontWeight: "500",
  },
  statusBadge: {
    paddingHorizontal: scale(10),
    paddingVertical: scale(4),
    borderRadius: scale(8),
  },
  statusText: {
    fontSize: scale(11),
    fontWeight: "800",
    textTransform: "uppercase",
  },
  itemsSummary: {
    paddingVertical: scale(14),
  },
  sectionLabel: {
    fontSize: scale(12),
    fontWeight: "800",
    color: "#9CA3AF",
    textTransform: "uppercase",
    marginBottom: scale(10),
    letterSpacing: scale(0.5),
  },
  imagesRow: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: scale(12),
  },
  productImgBox: {
    width: scale(48), height: scale(48),
    borderRadius: scale(8),
    backgroundColor: "#F9FAFB",
    borderWidth: 1,
    borderColor: "#F3F4F6",
    marginRight: scale(8),
    justifyContent: "center",
    alignItems: "center",
    overflow: "hidden",
  },
  productImg: {
    width: "80%", height: "80%",
  },
  moreImgBox: {
    width: scale(48), height: scale(48),
    borderRadius: scale(8),
    backgroundColor: "#F3F4F6",
    justifyContent: "center",
    alignItems: "center",
  },
  moreImgText: {
    fontSize: scale(14),
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
    fontSize: scale(14),
    color: "#4B5563",
    marginRight: scale(16),
    lineHeight: scale(20),
  },
  amountText: {
    fontSize: scale(16),
    fontWeight: "800",
    color: "#111827",
  },
  footer: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginTop: scale(16),
    alignItems: "center",
  },
  reorderBtn: {
    paddingHorizontal: scale(20),
    paddingVertical: scale(10),
    borderRadius: scale(10),
    borderWidth: 1,
    borderColor: "#E5E7EB",
    backgroundColor: "#F9FAFB",
  },
  reorderText: {
    fontSize: scale(14),
    fontWeight: "600",
    color: "#374151",
  },
  trackBtn: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#ECFDF5",
    paddingHorizontal: scale(16),
    paddingVertical: scale(10),
    borderRadius: scale(10),
    borderWidth: 1,
    borderColor: "#D1FAE5"
  },
  trackDot: {
    width: scale(6), height: scale(6),
    borderRadius: scale(3),
    backgroundColor: "#0A8754",
    marginRight: scale(8),
  },
  trackText: {
    fontSize: scale(14),
    fontWeight: "700",
    color: "#0A8754",
    marginRight: scale(4),
  },
  emptyContainer: {
    marginTop: scale(80),
    alignItems: "center",
  },
  emptyIconBox: {
    width: scale(80), height: scale(80),
    borderRadius: scale(40),
    backgroundColor: "#F3F4F6",
    justifyContent: "center",
    alignItems: "center",
    marginBottom: scale(20),
  },
  emptyTitle: {
    fontSize: scale(18),
    fontWeight: "700",
    color: "#111827",
    marginBottom: scale(8),
  },
  emptySub: {
    fontSize: scale(14),
    color: "#6B7280",
    textAlign: "center",
    paddingHorizontal: scale(40),
  },
});
