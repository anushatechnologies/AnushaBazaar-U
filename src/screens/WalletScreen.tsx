import React, { useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  TextInput,
  ScrollView,
  Dimensions,
  Alert,
  ActivityIndicator,
} from "react-native";
import { useNavigation } from "@react-navigation/native";
import { Ionicons, MaterialCommunityIcons, FontAwesome } from "@expo/vector-icons";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { LinearGradient } from "expo-linear-gradient";

import { useWallet } from "../context/WalletContext";

const { width } = Dimensions.get("window");

const WalletScreen = () => {
  const navigation = useNavigation<any>();
  const insets = useSafeAreaInsets();
  const { balance, points, addMoney } = useWallet();
  const [amount, setAmount] = useState("");
  const [loading, setLoading] = useState(false);

  const getTier = (pts: number) => {
    if (pts >= 2000) return { name: "Gold", color: "#EAB308", icon: "crown" };
    if (pts >= 500) return { name: "Silver", color: "#94A3B8", icon: "shield" };
    return { name: "Bronze", color: "#B45309", icon: "medal" };
  };

  const tier = getTier(points);

  const quickAmounts = [100, 200, 500, 1000];

  const transactions = [
    { id: "1", type: "Order", title: "Order #AB-1024", date: "Today, 02:30 PM", amount: -450, status: "Success" },
    { id: "2", type: "Topup", title: "Added to Wallet", date: "Yesterday", amount: 1000, status: "Success" },
    { id: "3", type: "Order", title: "Order #AB-0988", date: "10 Mar 2024", amount: -120, status: "Success" },
  ];

  const upiApps = [
    { id: "gpay", name: "Google Pay", icon: "google", color: "#4285F4" },
    { id: "phonepe", name: "PhonePe", icon: "alpha-p-box", color: "#5f259f" },
    { id: "paytm", name: "Paytm", icon: "alpha-p-circle", color: "#00baf2" },
  ];

  const handleAddMoney = (method: string) => {
    if (!amount || isNaN(Number(amount)) || Number(amount) <= 0) {
      Alert.alert("Invalid Amount", "Please enter a valid amount to add.");
      return;
    }

    setLoading(true);

    // Simulate Payment Processing
    setTimeout(async () => {
      await addMoney(Number(amount));
      setLoading(false);
      Alert.alert("Success! 🎉", `₹${amount} added successfully via ${method}.`);
      setAmount("");
    }, 2000);
  };

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity style={styles.backBtn} onPress={() => navigation.goBack()}>
          <Ionicons name="arrow-back" size={24} color="#333" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>My Wallet</Text>
        <TouchableOpacity style={styles.helpBtn}>
          <Text style={styles.helpText}>Help</Text>
        </TouchableOpacity>
      </View>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 40 }}>

        {/* New Enhanced Balance Card */}
        <LinearGradient
          colors={["#0A8754", "#06613C"]}
          style={styles.balanceCard}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
        >
          <View style={styles.cardMain}>
            <View>
              <Text style={styles.balanceLabel}>Total Balance</Text>
              <Text style={styles.balanceAmount}>₹{balance.toLocaleString()}</Text>
            </View>
            <View style={styles.tierBadge}>
              <MaterialCommunityIcons name={tier.icon as any} size={16} color={tier.color} />
              <Text style={[styles.tierText, { color: tier.color }]}>{tier.name} Club</Text>
            </View>
          </View>

          <View style={styles.cardDivider} />

          <View style={styles.pointsRow}>
            <View style={styles.pointsLeft}>
              <View style={styles.coinIconSmall}>
                <Ionicons name="logo-bitcoin" size={14} color="#EAB308" />
              </View>
              <View>
                <Text style={styles.pointsLabel}>Anusha Coins</Text>
                <Text style={styles.pointsValue}>{points} Coins</Text>
              </View>
            </View>
            <TouchableOpacity style={styles.redeemInfoBtn}>
              <Text style={styles.redeemInfoText}>How to use?</Text>
            </TouchableOpacity>
          </View>
        </LinearGradient>

        {/* Add Money Section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Add Money to Wallet</Text>
          <View style={styles.inputContainer}>
            <Text style={styles.currencyPrefix}>₹</Text>
            <TextInput
              placeholder="Enter Amount"
              placeholderTextColor="#999"
              keyboardType="numeric"
              value={amount}
              onChangeText={setAmount}
              style={styles.amountInput}
            />
          </View>

          <View style={styles.quickAmountRow}>
            {quickAmounts.map((val) => (
              <TouchableOpacity
                key={val}
                style={[styles.quickChip, amount === String(val) && styles.activeChip]}
                onPress={() => setAmount(String(val))}
              >
                <Text style={[styles.quickChipText, amount === String(val) && styles.activeChipText]}>
                  +₹{val}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* Payment Methods */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Recommended UPI Apps</Text>
          <View style={styles.upiContainer}>
            {upiApps.map((app) => (
              <TouchableOpacity
                key={app.id}
                style={styles.upiItem}
                onPress={() => handleAddMoney(app.name)}
                disabled={loading}
              >
                <View style={[styles.upiIconBox, { backgroundColor: app.color + "15" }]}>
                  <MaterialCommunityIcons name={app.icon as any} size={28} color={app.color} />
                </View>
                <Text style={styles.upiName}>{app.name}</Text>
                <Ionicons name="chevron-forward" size={16} color="#ccc" />
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* Card Payments */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Debit & Credit Cards</Text>
          <TouchableOpacity
            style={styles.cardItem}
            onPress={() => handleAddMoney("Card")}
            disabled={loading}
          >
            <View style={styles.cardInfo}>
              <View style={styles.cardIconBox}>
                <FontAwesome name="credit-card" size={20} color="#555" />
              </View>
              <View>
                <Text style={styles.cardLabel}>Add New Card</Text>
                <Text style={styles.cardSub}>Visa, Mastercard, RuPay</Text>
              </View>
            </View>
            <Ionicons name="add-circle" size={24} color="#0A8754" />
          </TouchableOpacity>
        </View>

        {loading && (
          <View style={styles.loadingOverlay}>
            <ActivityIndicator size="large" color="#0A8754" />
            <Text style={styles.loadingText}>Processing Payment...</Text>
          </View>
        )}

        {/* Transactions */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Recent Transactions</Text>
            <TouchableOpacity onPress={() => navigation.navigate("Orders")}>
              <Text style={styles.viewAllText}>View All</Text>
            </TouchableOpacity>
          </View>

          <View style={styles.transactionList}>
            {transactions.map((tx) => (
              <View key={tx.id} style={styles.txRow}>
                <View style={[styles.txIconBox, { backgroundColor: tx.amount < 0 ? "#FFF0F0" : "#EAF7F1" }]}>
                  <Ionicons
                    name={tx.amount < 0 ? "cart-outline" : "add-circle-outline"}
                    size={20}
                    color={tx.amount < 0 ? "#FF3B30" : "#0A8754"}
                  />
                </View>
                <View style={styles.txDetails}>
                  <Text style={styles.txTitle}>{tx.title}</Text>
                  <Text style={styles.txDate}>{tx.date}</Text>
                </View>
                <Text style={[styles.txAmount, { color: tx.amount < 0 ? "#333" : "#0A8754" }]}>
                  {tx.amount < 0 ? "-" : "+"} ₹{Math.abs(tx.amount)}
                </Text>
              </View>
            ))}
          </View>
        </View>

      </ScrollView>
    </View>
  );
};

export default WalletScreen;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#fff",
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    height: 56,
  },
  backBtn: {
    padding: 4,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: "800",
    color: "#111",
  },
  helpBtn: {
    backgroundColor: "#f2f2f2",
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 20,
  },
  helpText: {
    fontSize: 12,
    fontWeight: "700",
    color: "#555",
  },
  balanceCard: {
    margin: 16,
    borderRadius: 24,
    padding: 24,
    elevation: 8,
    shadowColor: "#0A8754",
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.3,
    shadowRadius: 15,
  },
  balanceHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 8,
  },
  balanceLabel: {
    color: "rgba(255,255,255,0.8)",
    fontSize: 12,
    fontWeight: "600",
    textTransform: "uppercase",
    letterSpacing: 0.5,
  },
  balanceAmount: {
    color: "#fff",
    fontSize: 32,
    fontWeight: "900",
    marginTop: 4,
  },
  cardMain: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
  },
  tierBadge: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "rgba(255,255,255,1)",
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 12,
    gap: 4,
  },
  tierText: {
    fontSize: 12,
    fontWeight: "800",
  },
  cardDivider: {
    height: 1,
    backgroundColor: "rgba(255,255,255,0.1)",
    marginVertical: 18,
  },
  pointsRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  pointsLeft: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
  },
  coinIconSmall: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: "rgba(255,255,255,0.15)",
    justifyContent: "center",
    alignItems: "center",
  },
  pointsLabel: {
    fontSize: 11,
    color: "rgba(255,255,255,0.7)",
    fontWeight: "600",
  },
  pointsValue: {
    fontSize: 15,
    color: "#fff",
    fontWeight: "800",
  },
  redeemInfoBtn: {
    paddingVertical: 4,
    paddingHorizontal: 10,
    backgroundColor: "rgba(255,255,255,0.1)",
    borderRadius: 8,
  },
  redeemInfoText: {
    fontSize: 11,
    color: "#fff",
    fontWeight: "600",
  },
  section: {
    marginTop: 24,
    paddingHorizontal: 16,
  },
  sectionHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: "800",
    color: "#111",
    marginBottom: 16,
  },
  inputContainer: {
    flexDirection: "row",
    alignItems: "center",
    borderWidth: 1.5,
    borderColor: "#eee",
    borderRadius: 16,
    paddingHorizontal: 16,
    height: 60,
  },
  currencyPrefix: {
    fontSize: 20,
    fontWeight: "700",
    color: "#111",
    marginRight: 8,
  },
  amountInput: {
    flex: 1,
    fontSize: 18,
    fontWeight: "700",
    color: "#111",
  },
  quickAmountRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginTop: 12,
  },
  quickChip: {
    flex: 1,
    height: 40,
    borderWidth: 1.5,
    borderColor: "#eee",
    borderRadius: 20,
    justifyContent: "center",
    alignItems: "center",
    marginHorizontal: 4,
  },
  activeChip: {
    borderColor: "#0A8754",
    backgroundColor: "#EAF7F1",
  },
  quickChipText: {
    fontSize: 13,
    fontWeight: "700",
    color: "#555",
  },
  activeChipText: {
    color: "#0A8754",
  },
  upiContainer: {
    backgroundColor: "#fff",
    borderWidth: 1,
    borderColor: "#f2f2f2",
    borderRadius: 20,
    padding: 4,
  },
  upiItem: {
    flexDirection: "row",
    alignItems: "center",
    padding: 12,
  },
  upiIconBox: {
    width: 48,
    height: 48,
    borderRadius: 14,
    justifyContent: "center",
    alignItems: "center",
    marginRight: 15,
  },
  upiName: {
    flex: 1,
    fontSize: 15,
    fontWeight: "700",
    color: "#333",
  },
  transactionList: {
    marginTop: 4,
  },
  txRow: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 16,
  },
  txIconBox: {
    width: 44,
    height: 44,
    borderRadius: 22,
    justifyContent: "center",
    alignItems: "center",
    marginRight: 15,
  },
  txDetails: {
    flex: 1,
  },
  txTitle: {
    fontSize: 15,
    fontWeight: "700",
    color: "#111",
  },
  txDate: {
    fontSize: 12,
    color: "#888",
    marginTop: 2,
  },
  txAmount: {
    fontSize: 16,
    fontWeight: "800",
  },
  viewAllText: {
    fontSize: 13,
    fontWeight: "700",
    color: "#0A8754",
    marginBottom: 16,
  },
  cardItem: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    backgroundColor: "#fff",
    borderWidth: 1.5,
    borderColor: "#f2f2f2",
    borderRadius: 18,
    padding: 16,
  },
  cardInfo: {
    flexDirection: "row",
    alignItems: "center",
  },
  cardIconBox: {
    width: 40,
    height: 40,
    borderRadius: 10,
    backgroundColor: "#f9f9f9",
    justifyContent: "center",
    alignItems: "center",
    marginRight: 12,
  },
  cardLabel: {
    fontSize: 15,
    fontWeight: "700",
    color: "#111",
  },
  cardSub: {
    fontSize: 12,
    color: "#888",
    marginTop: 2,
  },
  loadingOverlay: {
    position: "absolute",
    top: -100, // covering the header too
    left: 0,
    right: 0,
    bottom: -100,
    backgroundColor: "rgba(255,255,255,0.9)",
    justifyContent: "center",
    alignItems: "center",
    zIndex: 10000,
  },
  loadingText: {
    marginTop: 15,
    fontSize: 16,
    fontWeight: "700",
    color: "#333",
  },
});