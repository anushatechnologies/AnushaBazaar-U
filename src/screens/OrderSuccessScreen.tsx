import React, { useEffect } from "react";
import { View, Text, StyleSheet, TouchableOpacity, Animated, ScrollView, Image } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useNavigation, useRoute } from "@react-navigation/native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { scale } from "../utils/responsive";

const OrderSuccessScreen = () => {
  const navigation = useNavigation<any>();
  const route = useRoute<any>();
  const insets = useSafeAreaInsets();
  const scaleAnim = new Animated.Value(0);
  const opacityAnim = new Animated.Value(0);

  const orderId = route.params?.orderId || "AB-" + Math.floor(1000 + Math.random() * 9000);
  const totalPaid = route.params?.totalPaid || "0";
  const items = route.params?.items || [];

  useEffect(() => {
    Animated.parallel([
      Animated.spring(scaleAnim, {
        toValue: 1,
        tension: 50,
        friction: 7,
        useNativeDriver: true,
      }),
      Animated.timing(opacityAnim, {
        toValue: 1,
        duration: 800,
        useNativeDriver: true,
      }),
    ]).start();
  }, []);

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: scale(40) }}>
      <View style={styles.content}>
        <Animated.View style={[styles.successIconBox, { transform: [{ scale: scaleAnim }], opacity: opacityAnim }]}>
          <View style={styles.whiteCircle}>
            <Ionicons name="checkmark" size={scale(60)} color="#0A8754" />
          </View>
        </Animated.View>

        <Animated.View style={[styles.textBox, { opacity: opacityAnim }]}>
          <Text style={styles.title}>Order Placed Successfully!</Text>
          <Text style={styles.subtitle}>
            Hang tight! Our delivery partner will be at your doorstep shortly.
          </Text>
        </Animated.View>

        <Animated.View style={[styles.orderCard, { opacity: opacityAnim }]}>
          <View style={styles.orderDetail}>
            <Text style={styles.detailLabel}>Order ID</Text>
            <Text style={styles.detailValue}>#{orderId}</Text>
          </View>
          <View style={styles.divider} />
          <View style={styles.orderDetail}>
            <Text style={styles.detailLabel}>Amount Paid</Text>
            <Text style={[styles.detailValue, { color: "#0A8754" }]}>₹{totalPaid}</Text>
          </View>
          <View style={styles.divider} />
          <View style={styles.orderDetail}>
            <Text style={styles.detailLabel}>Estimated Delivery</Text>
            <Text style={styles.detailValue}>15 mins</Text>
          </View>
        </Animated.View>

        {/* --- ITEMS SECTION --- */}
        {items.length > 0 && (
          <Animated.View style={[styles.itemsBox, { opacity: opacityAnim }]}>
            <Text style={styles.sectionTitle}>Items Ordered</Text>
            {items.map((item: any, idx: number) => (
              <View key={idx} style={styles.itemRow}>
                <Image 
                  source={{ uri: item.productImage || item.image || item.imageUrl || "https://via.placeholder.com/150" }} 
                  style={styles.itemImg} 
                />
                <View style={{ flex: 1, marginLeft: scale(12) }}>
                  <Text style={styles.itemName} numberOfLines={1}>{item.productName || item.name || "Product"}</Text>
                  <Text style={styles.itemQty}>Qty: {item.quantity}</Text>
                </View>
                <Text style={styles.itemPrice}>₹{((item.unitPrice || item.price || 0) * item.quantity).toFixed(2)}</Text>
              </View>
            ))}
          </Animated.View>
        )}
      </View>
      </ScrollView>

      <View style={[styles.footer, { paddingBottom: Math.max(insets.bottom, scale(20)) }]}>
        <TouchableOpacity 
          style={styles.trackBtn} 
          onPress={() => navigation.navigate("OrderTracking", { orderId })}
        >
          <Text style={styles.trackBtnText}>Track Your Order</Text>
        </TouchableOpacity>

        <TouchableOpacity 
          style={styles.continueBtn} 
          onPress={() => navigation.navigate("MainTabs")}
        >
          <Text style={styles.continueBtnText}>Continue Shopping</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
};

export default OrderSuccessScreen;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#fff",
    paddingHorizontal: scale(25),
  },
  content: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  successIconBox: {
    width: scale(140),
    height: scale(140),
    borderRadius: scale(70),
    backgroundColor: "#F2FCEE",
    justifyContent: "center",
    alignItems: "center",
    marginBottom: scale(40),
  },
  whiteCircle: {
    width: scale(100),
    height: scale(100),
    borderRadius: scale(50),
    backgroundColor: "#fff",
    justifyContent: "center",
    alignItems: "center",
    shadowColor: "#0A8754",
    shadowOffset: { width: 0, height: scale(10) },
    shadowOpacity: 0.15,
    shadowRadius: scale(15),
    elevation: 8,
  },
  textBox: {
    alignItems: "center",
    marginBottom: scale(40),
  },
  title: {
    fontSize: scale(24),
    fontWeight: "900",
    color: "#111",
    textAlign: "center",
    marginBottom: scale(12),
  },
  subtitle: {
    fontSize: scale(15),
    color: "#6B7280",
    textAlign: "center",
    lineHeight: scale(22),
    paddingHorizontal: scale(20),
  },
  orderCard: {
    width: "100%",
    backgroundColor: "#F9FAFB",
    borderRadius: scale(20),
    padding: scale(20),
    borderWidth: 1,
    borderColor: "#F3F4F6",
  },
  orderDetail: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: scale(12),
  },
  detailLabel: {
    fontSize: scale(14),
    color: "#6B7280",
    fontWeight: "600",
  },
  detailValue: {
    fontSize: scale(15),
    color: "#111827",
    fontWeight: "700",
  },
  divider: {
    height: 1,
    backgroundColor: "#E5E7EB",
  },
  footer: {
    width: "100%",
    paddingHorizontal: scale(25),
  },
  trackBtn: {
    backgroundColor: "#0A8754",
    paddingVertical: scale(18),
    borderRadius: scale(16),
    alignItems: "center",
    marginBottom: scale(12),
    shadowColor: "#0A8754",
    shadowOffset: { width: 0, height: scale(8) },
    shadowOpacity: 0.2,
    shadowRadius: scale(12),
    elevation: 6,
  },
  trackBtnText: {
    color: "#fff",
    fontSize: scale(16),
    fontWeight: "800",
  },
  continueBtn: {
    backgroundColor: "#fff",
    paddingVertical: scale(16),
    borderRadius: scale(16),
    alignItems: "center",
    borderWidth: 1,
    borderColor: "#E5E7EB",
  },
  continueBtnText: {
    color: "#4B5563",
    fontSize: scale(15),
    fontWeight: "700",
  },
  itemsBox: {
    width: "100%",
    backgroundColor: "#fff",
    marginTop: scale(20),
    borderRadius: scale(20),
    padding: scale(20),
    borderWidth: 1,
    borderColor: "#F3F4F6",
  },
  sectionTitle: {
    fontSize: scale(16),
    fontWeight: "800",
    color: "#111",
    marginBottom: scale(15),
  },
  itemRow: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: scale(12),
  },
  itemImg: {
    width: scale(44),
    height: scale(44),
    borderRadius: scale(8),
    backgroundColor: "#F9FAFB",
  },
  itemName: {
    fontSize: scale(14),
    fontWeight: "700",
    color: "#333",
  },
  itemQty: {
    fontSize: scale(12),
    color: "#999",
    marginTop: scale(2),
    fontWeight: "600",
  },
  itemPrice: {
    fontSize: scale(15),
    fontWeight: "800",
    color: "#111",
  },
});
