import React from "react";
import { View, Text, StyleSheet, FlatList, TouchableOpacity } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useNavigation } from "@react-navigation/native";
import { Ionicons } from "@expo/vector-icons";

const PAYMENT_METHODS = [
  { id: "p1", title: "Amazon Pay", icon: "logo-amazon", type: "wallet" },
  { id: "p2", title: "Paytm", icon: "wallet-outline", type: "wallet" },
  { id: "p3", title: "Credit / Debit Card", icon: "card-outline", type: "card" },
  { id: "p4", title: "Net Banking", icon: "business-outline", type: "netbanking" },
  { id: "p5", title: "Add New UPI ID", icon: "add-circle-outline", type: "upi" },
];

const PaymentScreen = () => {
  const insets = useSafeAreaInsets();
  const navigation = useNavigation();

  const renderMethod = ({ item }: { item: any }) => (
    <TouchableOpacity style={styles.methodCard}>
      <View style={styles.methodLeft}>
        <View style={styles.iconBox}>
          <Ionicons name={item.icon} size={22} color="#111827" />
        </View>
        <Text style={styles.methodTitle}>{item.title}</Text>
      </View>
      <Ionicons name="chevron-forward" size={18} color="#9CA3AF" />
    </TouchableOpacity>
  );

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity style={styles.backBtn} onPress={() => navigation.goBack()}>
          <Ionicons name="arrow-back" size={24} color="#111827" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Payments & Wallets</Text>
        <View style={{ width: 40 }} />
      </View>

      <FlatList
        data={[{ key: "content" }]}
        keyExtractor={(item) => item.key}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ padding: 16 }}
        renderItem={() => (
          <View>
            {/* Wallet Balance Banner */}
            <View style={styles.walletBanner}>
              <View style={styles.walletHeader}>
                <Ionicons name="wallet" size={20} color="#fff" />
                <Text style={styles.walletTitle}>Anusha Wallet</Text>
              </View>
              <Text style={styles.walletBalance}>₹ 1,250.00</Text>
              <Text style={styles.walletSub}>Available Balance</Text>
              <TouchableOpacity style={styles.addMoneyBtn}>
                <Text style={styles.addMoneyText}>+ Add Money</Text>
              </TouchableOpacity>
            </View>

            <Text style={styles.sectionTitle}>Saved Payment Methods</Text>
            
            <FlatList
              data={PAYMENT_METHODS}
              keyExtractor={(item) => item.id}
              scrollEnabled={false}
              renderItem={renderMethod}
            />
          </View>
        )}
      />
    </View>
  );
};

export default PaymentScreen;

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#F9FAFB" },
  
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
  headerTitle: {
    fontSize: 18,
    fontWeight: "700",
    color: "#111827",
  },

  /* Wallet Banner */
  walletBanner: {
    backgroundColor: "#0A8754",
    borderRadius: 16,
    padding: 24,
    marginBottom: 24,
    shadowColor: "#0A8754",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 10,
    elevation: 4,
  },
  walletHeader: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 16,
  },
  walletTitle: {
    fontSize: 15,
    fontWeight: "600",
    color: "#D1FAE5",
    marginLeft: 8,
  },
  walletBalance: {
    fontSize: 32,
    fontWeight: "800",
    color: "#fff",
    marginBottom: 4,
  },
  walletSub: {
    fontSize: 14,
    color: "#A7F3D0",
    marginBottom: 20,
  },
  addMoneyBtn: {
    alignSelf: "flex-start",
    backgroundColor: "#fff",
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 8,
  },
  addMoneyText: {
    color: "#0A8754",
    fontSize: 13,
    fontWeight: "700",
  },

  /* Payment Methods */
  sectionTitle: {
    fontSize: 18,
    fontWeight: "700",
    color: "#111827",
    marginBottom: 16,
  },
  methodCard: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    backgroundColor: "#fff",
    padding: 16,
    borderRadius: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: "#F3F4F6",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.02,
    shadowRadius: 4,
    elevation: 2,
  },
  methodLeft: {
    flexDirection: "row",
    alignItems: "center",
  },
  iconBox: {
    width: 44, height: 44,
    borderRadius: 22,
    backgroundColor: "#F3F4F6",
    justifyContent: "center",
    alignItems: "center",
    marginRight: 16,
  },
  methodTitle: {
    fontSize: 15,
    fontWeight: "600",
    color: "#374151",
  },
});