import React, { useEffect } from "react";
import { View, Text, StyleSheet, TouchableOpacity, Dimensions, Animated, ScrollView, Image } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useNavigation, useRoute } from "@react-navigation/native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

const { width } = Dimensions.get("window");

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
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 40 }}>
      <View style={styles.content}>
        <Animated.View style={[styles.successIconBox, { transform: [{ scale: scaleAnim }], opacity: opacityAnim }]}>
          <View style={styles.whiteCircle}>
            <Ionicons name="checkmark" size={60} color="#0A8754" />
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
            <Text style={styles.detailValue}>45 mins</Text>
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
                <View style={{ flex: 1, marginLeft: 12 }}>
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

      <View style={[styles.footer, { paddingBottom: Math.max(insets.bottom, 20) }]}>
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
    paddingHorizontal: 25,
  },
  content: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  successIconBox: {
    width: 140,
    height: 140,
    borderRadius: 70,
    backgroundColor: "#F2FCEE",
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 40,
  },
  whiteCircle: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: "#fff",
    justifyContent: "center",
    alignItems: "center",
    shadowColor: "#0A8754",
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.15,
    shadowRadius: 15,
    elevation: 8,
  },
  textBox: {
    alignItems: "center",
    marginBottom: 40,
  },
  title: {
    fontSize: 24,
    fontWeight: "900",
    color: "#111",
    textAlign: "center",
    marginBottom: 12,
  },
  subtitle: {
    fontSize: 15,
    color: "#6B7280",
    textAlign: "center",
    lineHeight: 22,
    paddingHorizontal: 20,
  },
  orderCard: {
    width: "100%",
    backgroundColor: "#F9FAFB",
    borderRadius: 20,
    padding: 20,
    borderWidth: 1,
    borderColor: "#F3F4F6",
  },
  orderDetail: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: 12,
  },
  detailLabel: {
    fontSize: 14,
    color: "#6B7280",
    fontWeight: "600",
  },
  detailValue: {
    fontSize: 15,
    color: "#111827",
    fontWeight: "700",
  },
  divider: {
    height: 1,
    backgroundColor: "#E5E7EB",
  },
  footer: {
    width: "100%",
  },
  trackBtn: {
    backgroundColor: "#0A8754",
    paddingVertical: 18,
    borderRadius: 16,
    alignItems: "center",
    marginBottom: 12,
    shadowColor: "#0A8754",
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.2,
    shadowRadius: 12,
    elevation: 6,
  },
  trackBtnText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "800",
  },
  continueBtn: {
    backgroundColor: "#fff",
    paddingVertical: 16,
    borderRadius: 16,
    alignItems: "center",
    borderWidth: 1,
    borderColor: "#E5E7EB",
  },
  continueBtnText: {
    color: "#4B5563",
    fontSize: 15,
    fontWeight: "700",
  },
  itemsBox: {
    width: "100%",
    backgroundColor: "#fff",
    marginTop: 20,
    borderRadius: 20,
    padding: 20,
    borderWidth: 1,
    borderColor: "#F3F4F6",
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: "800",
    color: "#111",
    marginBottom: 15,
  },
  itemRow: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 12,
  },
  itemImg: {
    width: 44,
    height: 44,
    borderRadius: 8,
    backgroundColor: "#F9FAFB",
  },
  itemName: {
    fontSize: 14,
    fontWeight: "700",
    color: "#333",
  },
  itemQty: {
    fontSize: 12,
    color: "#999",
    marginTop: 2,
    fontWeight: "600",
  },
  itemPrice: {
    fontSize: 14,
    fontWeight: "800",
    color: "#111",
  },
});
