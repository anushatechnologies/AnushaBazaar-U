import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  TextInput,
  FlatList,
  StatusBar,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
} from "react-native";
import { useNavigation } from "@react-navigation/native";
import { Ionicons, MaterialCommunityIcons } from "@expo/vector-icons";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { LinearGradient } from "expo-linear-gradient";
import { useWallet } from "../../context/WalletContext";
import { useAuth } from "../../context/AuthContext";
import { getWalletHistory, WalletTransaction } from "../../services/api/wallet";

const WalletScreen = () => {
  const navigation = useNavigation<any>();
  const insets = useSafeAreaInsets();
  const { balance, addMoney } = useWallet();
  const { jwtToken, user } = useAuth();

  const [amount, setAmount] = useState<string>("");
  const [history, setHistory] = useState<WalletTransaction[]>([]);
  const [loadingHistory, setLoadingHistory] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);

  useEffect(() => {
    fetchHistory();
  }, [balance, jwtToken]); // Refetch history if balance changes

  const fetchHistory = async () => {
    if (!jwtToken || !user?.customerId) return;
    setLoadingHistory(true);
    try {
      const data = await getWalletHistory(jwtToken, user.customerId);
      // Sort by newest first assuming createdAt exists
      const sorted = data.sort((a, b) => new Date(b.createdAt || 0).getTime() - new Date(a.createdAt || 0).getTime());
      setHistory(sorted);
    } catch (error) {
      console.error(error);
    } finally {
      setLoadingHistory(false);
    }
  };

  const handleAddMoney = async () => {
    const val = Number(amount);
    if (!val || val <= 0) return;
    
    setIsProcessing(true);
    try {
      await addMoney(val);
      setAmount("");
    } finally {
      setIsProcessing(false);
    }
  };

  const renderTransaction = ({ item }: { item: WalletTransaction }) => {
    const isCredit = item.type === "CREDIT";
    const dateStr = item.createdAt 
      ? new Date(item.createdAt).toLocaleDateString("en-IN", { month: "short", day: "numeric", year: "numeric" }) 
      : "Recent";

    return (
      <View style={styles.txnCard}>
        <View style={[styles.txnIconBox, { backgroundColor: isCredit ? "#DCFCE7" : "#FEE2E2" }]}>
          <Ionicons 
            name={isCredit ? "arrow-down" : "arrow-up"} 
            size={20} 
            color={isCredit ? "#0A8754" : "#EF4444"} 
          />
        </View>
        <View style={styles.txnInfo}>
          <Text style={styles.txnTitle} numberOfLines={1}>{item.description || (isCredit ? "Added to Wallet" : "Paid for Order")}</Text>
          <Text style={styles.txnDate}>{dateStr}</Text>
        </View>
        <Text style={[styles.txnAmount, { color: isCredit ? "#0A8754" : "#111" }]}>
          {isCredit ? "+" : "-"}₹{item.amount.toFixed(2)}
        </Text>
      </View>
    );
  };

  return (
    <KeyboardAvoidingView 
      style={[styles.container, { paddingTop: insets.top }]}
      behavior={Platform.OS === "ios" ? "padding" : undefined}
    >
      <StatusBar barStyle="dark-content" backgroundColor="#fff" />
      
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity style={styles.backBtn} onPress={() => navigation.goBack()}>
          <Ionicons name="arrow-back" size={24} color="#333" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>My Wallet</Text>
        <View style={{ width: 40 }} />
      </View>

      <FlatList
        data={history}
        keyExtractor={(item, index) => item.id ? String(item.id) : String(index)}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: 100 }}
        ListHeaderComponent={
          <View style={styles.content}>
            {/* Balance Card */}
            <LinearGradient
              colors={["#0A8754", "#08663F"]}
              style={styles.balanceCard}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
            >
              <View style={styles.balanceHeader}>
                <View>
                  <Text style={styles.balanceLabel}>Available Balance</Text>
                  <Text style={styles.balanceValue}>₹{balance.toFixed(2)}</Text>
                </View>
                <View style={styles.walletIconCircle}>
                  <MaterialCommunityIcons name="wallet" size={32} color="#0A8754" />
                </View>
              </View>
            </LinearGradient>

            {/* Add Money Section */}
            <View style={styles.addMoneySection}>
              <Text style={styles.sectionTitle}>Add Money to Wallet</Text>
              
              <View style={styles.inputWrapper}>
                <Text style={styles.currencySymbol}>₹</Text>
                <TextInput
                  style={styles.amountInput}
                  value={amount}
                  onChangeText={setAmount}
                  keyboardType="numeric"
                  placeholder="0.00"
                  placeholderTextColor="#9CA3AF"
                  editable={!isProcessing}
                />
              </View>

              <View style={styles.quickAddRow}>
                {[100, 500, 1000].map((val) => (
                  <TouchableOpacity 
                    key={val} 
                    style={styles.quickAddChip}
                    onPress={() => setAmount(String(val))}
                    disabled={isProcessing}
                  >
                    <Text style={styles.quickAddText}>+ ₹{val}</Text>
                  </TouchableOpacity>
                ))}
              </View>

              <TouchableOpacity 
                style={[styles.primaryBtn, (!amount || Number(amount) <= 0 || isProcessing) && styles.primaryBtnDisabled]}
                onPress={handleAddMoney}
                disabled={!amount || Number(amount) <= 0 || isProcessing}
              >
                {isProcessing ? (
                  <ActivityIndicator color="#fff" />
                ) : (
                  <Text style={styles.primaryBtnText}>Proceed to Add ₹{amount || "0"}</Text>
                )}
              </TouchableOpacity>
            </View>

            <View style={styles.historyHeader}>
              <Text style={styles.sectionTitle}>Recent Transactions</Text>
            </View>
          </View>
        }
        ListEmptyComponent={
          <View style={styles.emptyState}>
            {loadingHistory ? (
              <ActivityIndicator color="#0A8754" style={{ marginTop: 40 }} />
            ) : (
              <>
                <MaterialCommunityIcons name="text-box-search-outline" size={48} color="#D1D5DB" />
                <Text style={styles.emptyTitle}>No Transactions Yet</Text>
                <Text style={styles.emptySub}>Your wallet activity will appear here once you add or spend money.</Text>
              </>
            )}
          </View>
        }
        renderItem={renderTransaction}
      />
    </KeyboardAvoidingView>
  );
};

export default WalletScreen;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#F9FBFC",
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    height: 56,
    backgroundColor: "#fff",
  },
  backBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: "#f5f5f5",
    justifyContent: "center",
    alignItems: "center",
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: "800",
    color: "#111",
  },
  content: {
    padding: 16,
  },
  balanceCard: {
    width: "100%",
    borderRadius: 24,
    padding: 24,
    elevation: 8,
    shadowColor: "#0A8754",
    shadowOpacity: 0.3,
    shadowOffset: { width: 0, height: 6 },
    shadowRadius: 12,
    marginBottom: 24,
  },
  balanceHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  balanceLabel: {
    fontSize: 14,
    color: "rgba(255,255,255,0.8)",
    fontWeight: "600",
    marginBottom: 6,
  },
  balanceValue: {
    fontSize: 34,
    fontWeight: "900",
    color: "#fff",
    letterSpacing: 1,
  },
  walletIconCircle: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: "#fff",
    justifyContent: "center",
    alignItems: "center",
  },
  addMoneySection: {
    backgroundColor: "#fff",
    borderRadius: 24,
    padding: 20,
    marginBottom: 24,
    borderWidth: 1,
    borderColor: "#F0F0F0",
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: "800",
    color: "#111",
    marginBottom: 16,
  },
  inputWrapper: {
    flexDirection: "row",
    alignItems: "center",
    borderWidth: 1.5,
    borderColor: "#E5E7EB",
    borderRadius: 16,
    paddingHorizontal: 16,
    height: 64,
    marginBottom: 16,
    backgroundColor: "#F9FAFB",
  },
  currencySymbol: {
    fontSize: 24,
    fontWeight: "700",
    color: "#374151",
    marginRight: 8,
  },
  amountInput: {
    flex: 1,
    fontSize: 28,
    fontWeight: "800",
    color: "#111",
  },
  quickAddRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 20,
  },
  quickAddChip: {
    flex: 1,
    marginHorizontal: 4,
    height: 40,
    borderRadius: 20,
    backgroundColor: "#F0FDF4",
    justifyContent: "center",
    alignItems: "center",
    borderWidth: 1,
    borderColor: "#DCFCE7",
  },
  quickAddText: {
    fontSize: 14,
    fontWeight: "700",
    color: "#0A8754",
  },
  primaryBtn: {
    height: 56,
    backgroundColor: "#0A8754",
    borderRadius: 16,
    justifyContent: "center",
    alignItems: "center",
    elevation: 2,
    shadowColor: "#0A8754",
    shadowOpacity: 0.2,
    shadowOffset: { width: 0, height: 4 },
    shadowRadius: 8,
  },
  primaryBtnDisabled: {
    backgroundColor: "#A7F3D0",
    elevation: 0,
    shadowOpacity: 0,
  },
  primaryBtnText: {
    fontSize: 16,
    fontWeight: "800",
    color: "#fff",
  },
  historyHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginTop: 8,
    marginBottom: 8,
  },
  txnCard: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#fff",
    marginHorizontal: 16,
    marginBottom: 12,
    padding: 16,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: "#F0F0F0",
  },
  txnIconBox: {
    width: 44,
    height: 44,
    borderRadius: 22,
    justifyContent: "center",
    alignItems: "center",
  },
  txnInfo: {
    flex: 1,
    marginLeft: 12,
  },
  txnTitle: {
    fontSize: 15,
    fontWeight: "700",
    color: "#111",
    marginBottom: 4,
  },
  txnDate: {
    fontSize: 12,
    color: "#6B7280",
    fontWeight: "500",
  },
  txnAmount: {
    fontSize: 16,
    fontWeight: "800",
  },
  emptyState: {
    alignItems: "center",
    paddingVertical: 32,
    paddingHorizontal: 24,
  },
  emptyTitle: {
    fontSize: 16,
    fontWeight: "700",
    color: "#374151",
    marginTop: 12,
  },
  emptySub: {
    fontSize: 13,
    color: "#9CA3AF",
    textAlign: "center",
    marginTop: 8,
    lineHeight: 20,
  },
});
