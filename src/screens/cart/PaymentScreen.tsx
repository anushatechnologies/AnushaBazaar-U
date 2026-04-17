import React from "react";
import { View, Text, StyleSheet, TouchableOpacity } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useNavigation } from "@react-navigation/native";
import { Ionicons } from "@expo/vector-icons";

const PaymentScreen = () => {
  const insets = useSafeAreaInsets();
  const navigation = useNavigation<any>();

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      <View style={styles.header}>
        <TouchableOpacity style={styles.backBtn} onPress={() => navigation.goBack()}>
          <Ionicons name="arrow-back" size={24} color="#111827" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Payments</Text>
        <View style={{ width: 40 }} />
      </View>

      <View style={styles.content}>
        <View style={styles.methodCard}>
          <View style={styles.iconBox}>
            <Ionicons name="cash-outline" size={36} color="#0A8754" />
          </View>
          <Text style={styles.cardTitle}>Cash on Delivery</Text>
          <Text style={styles.cardDesc}>
            Pay the delivery partner when your order arrives.
          </Text>
          <View style={styles.activeBadge}>
            <Ionicons name="checkmark-circle" size={18} color="#0A8754" />
            <Text style={styles.activeBadgeText}>Available now</Text>
          </View>
        </View>

        <View style={styles.methodCard}>
          <View style={[styles.iconBox, { backgroundColor: "#EEF4FF" }]}>
            <Ionicons name="card-outline" size={36} color="#1D4ED8" />
          </View>
          <Text style={styles.cardTitle}>Online Payment</Text>
          <Text style={styles.cardDesc}>
            UPI, cards, and net banking powered by Razorpay. Payment is processed securely after your order is created.
          </Text>
          <View style={[styles.statusBadge, styles.statusBadgeReady]}>
            <Text style={[styles.statusBadgeText, styles.statusBadgeTextReady]}>
              Ready in checkout
            </Text>
          </View>
        </View>

        <View style={styles.infoCard}>
          <Ionicons name="information-circle-outline" size={22} color="#0A8754" />
          <Text style={styles.infoText}>
            Checkout flow: place the order with ONLINE, then Razorpay opens securely for UPI, card, or net banking payment.
          </Text>
        </View>
      </View>
    </View>
  );
};

export default PaymentScreen;

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
    width: 40,
    height: 40,
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
    gap: 16,
  },
  methodCard: {
    backgroundColor: "#fff",
    borderRadius: 20,
    padding: 24,
    elevation: 4,
    shadowColor: "#000",
    shadowOpacity: 0.06,
    shadowOffset: { width: 0, height: 4 },
    shadowRadius: 10,
  },
  iconBox: {
    width: 72,
    height: 72,
    borderRadius: 36,
    backgroundColor: "#E9F7F1",
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 16,
  },
  cardTitle: {
    fontSize: 20,
    fontWeight: "800",
    color: "#111",
    marginBottom: 8,
  },
  cardDesc: {
    fontSize: 14,
    color: "#666",
    lineHeight: 20,
    fontWeight: "500",
  },
  activeBadge: {
    marginTop: 20,
    flexDirection: "row",
    alignItems: "center",
    alignSelf: "flex-start",
    backgroundColor: "#F0FDF4",
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 12,
    gap: 6,
    borderWidth: 1,
    borderColor: "#BBF7D0",
  },
  activeBadgeText: {
    fontSize: 14,
    fontWeight: "700",
    color: "#0A8754",
  },
  statusBadge: {
    marginTop: 20,
    alignSelf: "flex-start",
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 999,
    borderWidth: 1,
  },
  statusBadgeReady: {
    backgroundColor: "#EEF6FF",
    borderColor: "#BFDBFE",
  },
  statusBadgeText: {
    fontSize: 12,
    fontWeight: "800",
  },
  statusBadgeTextReady: {
    color: "#1D4ED8",
  },
  infoCard: {
    flexDirection: "row",
    gap: 10,
    backgroundColor: "#FFFFFF",
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: "#DCFCE7",
  },
  infoText: {
    flex: 1,
    fontSize: 13,
    lineHeight: 19,
    color: "#166534",
    fontWeight: "600",
  },
});
