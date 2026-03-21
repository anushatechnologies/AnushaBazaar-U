import React from "react";
import { View, Text, StyleSheet, TouchableOpacity } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useNavigation } from "@react-navigation/native";
import { Ionicons } from "@expo/vector-icons";

/*
  ====================================================================
  ONLINE PAYMENT METHODS - COMMENTED OUT
  Uncomment when payment gateway (Razorpay / Stripe / PhonePe) is integrated
  ====================================================================

  const PAYMENT_METHODS = [
    { id: "p1", title: "Amazon Pay", icon: "logo-amazon", type: "wallet" },
    { id: "p2", title: "Paytm", icon: "wallet-outline", type: "wallet" },
    { id: "p3", title: "Credit / Debit Card", icon: "card-outline", type: "card" },
    { id: "p4", title: "Net Banking", icon: "business-outline", type: "netbanking" },
    { id: "p5", title: "Add New UPI ID", icon: "add-circle-outline", type: "upi" },
  ];
*/

const PaymentScreen = () => {
  const insets = useSafeAreaInsets();
  const navigation = useNavigation();

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity style={styles.backBtn} onPress={() => navigation.goBack()}>
          <Ionicons name="arrow-back" size={24} color="#111827" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Payments</Text>
        <View style={{ width: 40 }} />
      </View>

      {/* COD Only Info */}
      <View style={styles.content}>
        <View style={styles.codCard}>
          <View style={styles.codIconBox}>
            <Ionicons name="cash-outline" size={40} color="#0A8754" />
          </View>
          <Text style={styles.codTitle}>Cash on Delivery</Text>
          <Text style={styles.codDesc}>
            Currently, we only accept Cash on Delivery for all orders. Pay the delivery person when your order arrives.
          </Text>
          <View style={styles.codBadge}>
            <Ionicons name="checkmark-circle" size={18} color="#0A8754" />
            <Text style={styles.codBadgeText}>Active Payment Method</Text>
          </View>
        </View>

        <View style={styles.comingSoonCard}>
          <Ionicons name="card-outline" size={24} color="#9CA3AF" />
          <View style={{ flex: 1, marginLeft: 12 }}>
            <Text style={styles.comingSoonTitle}>Online Payments</Text>
            <Text style={styles.comingSoonDesc}>UPI, Cards, Net Banking — Coming Soon!</Text>
          </View>
          <View style={styles.soonBadge}>
            <Text style={styles.soonBadgeText}>SOON</Text>
          </View>
        </View>
      </View>
    </View>
  );
};

export default PaymentScreen;

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#F9FAFB" },
  
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

  content: {
    padding: 16,
  },

  codCard: {
    backgroundColor: "#fff",
    borderRadius: 20,
    padding: 28,
    alignItems: "center",
    elevation: 4,
    shadowColor: "#000",
    shadowOpacity: 0.06,
    shadowOffset: { width: 0, height: 4 },
    shadowRadius: 10,
    marginBottom: 16,
  },
  codIconBox: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: "#E9F7F1",
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 16,
  },
  codTitle: {
    fontSize: 20,
    fontWeight: "800",
    color: "#111",
    marginBottom: 8,
  },
  codDesc: {
    fontSize: 14,
    color: "#666",
    textAlign: "center",
    lineHeight: 20,
    fontWeight: "500",
    marginBottom: 20,
  },
  codBadge: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#F0FDF4",
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 12,
    gap: 6,
    borderWidth: 1,
    borderColor: "#BBF7D0",
  },
  codBadgeText: {
    fontSize: 14,
    fontWeight: "700",
    color: "#0A8754",
  },

  comingSoonCard: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#fff",
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: "#F3F4F6",
  },
  comingSoonTitle: {
    fontSize: 15,
    fontWeight: "700",
    color: "#374151",
  },
  comingSoonDesc: {
    fontSize: 12,
    color: "#9CA3AF",
    marginTop: 2,
    fontWeight: "500",
  },
  soonBadge: {
    backgroundColor: "#FEF3C7",
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
  },
  soonBadgeText: {
    fontSize: 10,
    fontWeight: "800",
    color: "#D97706",
    letterSpacing: 1,
  },
});