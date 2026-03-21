import React from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Dimensions,
  StatusBar,
} from "react-native";
import { useNavigation } from "@react-navigation/native";
import { Ionicons, MaterialCommunityIcons } from "@expo/vector-icons";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { LinearGradient } from "expo-linear-gradient";

const { height } = Dimensions.get("window");

const WalletScreen = () => {
  const navigation = useNavigation<any>();
  const insets = useSafeAreaInsets();

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      <StatusBar barStyle="dark-content" />
      
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity style={styles.backBtn} onPress={() => navigation.goBack()}>
          <Ionicons name="arrow-back" size={24} color="#333" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>My Wallet</Text>
        <View style={{ width: 40 }} />
      </View>

      <View style={styles.content}>
        <LinearGradient
          colors={["#F0FDF4", "#DCFCE7"]}
          style={styles.comingSoonCard}
        >
          <View style={styles.iconContainer}>
            <MaterialCommunityIcons name="wallet-plus-outline" size={60} color="#0A8754" />
          </View>
          
          <Text style={styles.title}>Wallet Coming Soon!</Text>
          <Text style={styles.description}>
            We are working hard to bring you a seamless digital payment experience. 
            Soon, you'll be able to:
          </Text>

          <View style={styles.featureList}>
            <FeatureItem icon="flash" text="Instant UPI & Card Payments" />
            <FeatureItem icon="cash-back" text="One-click Wallet Checkout" />
            <FeatureItem icon="gift" text="Exclusive Cashback Rewards" />
          </View>

          <View style={styles.codNotice}>
            <Ionicons name="information-circle" size={20} color="#0A8754" />
            <Text style={styles.codText}>
              Currently, we only accept Cash on Delivery.
            </Text>
          </View>
        </LinearGradient>

        <TouchableOpacity 
          style={styles.dismissBtn}
          onPress={() => navigation.goBack()}
        >
          <Text style={styles.dismissText}>Back to Shopping</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
};

const FeatureItem = ({ icon, text }: { icon: any, text: string }) => (
  <View style={styles.featureItem}>
    <View style={styles.featureIcon}>
      <MaterialCommunityIcons name={icon} size={20} color="#0A8754" />
    </View>
    <Text style={styles.featureText}>{text}</Text>
  </View>
);

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
    flex: 1,
    padding: 20,
    justifyContent: "center",
    alignItems: "center",
  },
  comingSoonCard: {
    width: "100%",
    borderRadius: 32,
    padding: 32,
    alignItems: "center",
    borderWidth: 1,
    borderColor: "#BBF7D0",
  },
  iconContainer: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: "#fff",
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 24,
    elevation: 4,
    shadowColor: "#0A8754",
    shadowOpacity: 0.1,
    shadowOffset: { width: 0, height: 4 },
    shadowRadius: 10,
  },
  title: {
    fontSize: 24,
    fontWeight: "900",
    color: "#111",
    marginBottom: 12,
    textAlign: "center",
  },
  description: {
    fontSize: 15,
    color: "#4B5563",
    textAlign: "center",
    lineHeight: 22,
    fontWeight: "500",
    marginBottom: 32,
  },
  featureList: {
    width: "100%",
    gap: 16,
    marginBottom: 32,
  },
  featureItem: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    backgroundColor: "rgba(255,255,255,0.6)",
    padding: 12,
    borderRadius: 16,
  },
  featureIcon: {
    width: 36,
    height: 36,
    borderRadius: 10,
    backgroundColor: "#fff",
    justifyContent: "center",
    alignItems: "center",
  },
  featureText: {
    fontSize: 14,
    fontWeight: "700",
    color: "#374151",
  },
  codNotice: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    borderTopWidth: 1,
    borderTopColor: "rgba(10, 135, 84, 0.1)",
    paddingTop: 20,
    width: "100%",
    justifyContent: "center",
  },
  codText: {
    fontSize: 13,
    color: "#0A8754",
    fontWeight: "800",
  },
  dismissBtn: {
    marginTop: 32,
    width: "100%",
    height: 56,
    backgroundColor: "#0A8754",
    borderRadius: 18,
    justifyContent: "center",
    alignItems: "center",
    elevation: 4,
    shadowColor: "#0A8754",
    shadowOpacity: 0.3,
    shadowOffset: { width: 0, height: 4 },
    shadowRadius: 8,
  },
  dismissText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "800",
  },
});