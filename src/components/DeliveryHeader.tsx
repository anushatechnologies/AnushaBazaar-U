import React, { useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  Pressable,
  TouchableOpacity,
} from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { Ionicons } from "@expo/vector-icons";
import { useNavigation } from "@react-navigation/native";
import { useLocation } from "../context/LocationContext";
import { useWallet } from "../context/WalletContext";
import { useAuth } from "../context/AuthContext";
import { useNotifications } from "../context/NotificationsContext";
import { useSafeAreaInsets } from "react-native-safe-area-context";

const DeliveryHeader = () => {
  const navigation = useNavigation<any>();

  const { user } = useAuth();
  const { location } = useLocation();
  const { points } = useWallet();
  const { unreadCount } = useNotifications();
  const insets = useSafeAreaInsets();

  return (
    <LinearGradient
      colors={["#F8D66D", "#FFF"]}
      style={[styles.container, { paddingTop: Math.max(insets.top, 20) }]}
    >
      {/* TOP ROW */}
      <View style={styles.topRow}>
        <View>
          <Text style={styles.brand}>AnushaBazaar</Text>
          <Text style={styles.storeName}>Manjeera Corporate Store</Text>
        </View>

        <View style={styles.icons}>
          {/* WALLET - COMING SOON */}
          <Pressable
            style={styles.walletPill}
            onPress={() => navigation.navigate("Wallet")}
          >
            <View style={styles.walletIconBox}>
              <Ionicons name="wallet-outline" size={14} color="#0A8754" />
            </View>
            <Text style={styles.walletText}>
              Wallet
            </Text>
          </Pressable>

          {/* NOTIFICATIONS */}
          <TouchableOpacity
            style={styles.iconBtn}
            onPress={() => navigation.navigate("Notifications")}
          >
            <Ionicons name="notifications-outline" size={22} color="#333" />
            {unreadCount > 0 && <View style={styles.notifBadge} />}
          </TouchableOpacity>

          {/* PROFILE */}
          <Pressable onPress={() => navigation.navigate("Profile")}>
            <Ionicons name="person-circle" size={38} color="#333" />
          </Pressable>
        </View>
      </View>

      {/* DELIVERY TIME */}
      <View style={styles.deliveryRow}>
        <Text style={styles.time}>15 minutes</Text>
      </View>

      {/* LOCATION SELECT */}
      <Pressable
        style={styles.locationRow}
        onPress={() => navigation.navigate("SelectLocation")}
      >
        <Ionicons name="location-outline" size={16} color="#555" />
        <Text numberOfLines={1} style={styles.location}>
          {location?.address || "Select delivery location"}
        </Text>
        <Ionicons name="chevron-down" size={16} color="#555" />
      </Pressable>
    </LinearGradient>
  );
};

export default DeliveryHeader;

const styles = StyleSheet.create({
  container: {
    paddingBottom: 20,
    paddingHorizontal: 16,
  },

  topRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },

  brand: {
    fontSize: 22,
    fontWeight: "800",
    color: "#111",
  },

  storeName: {
    fontSize: 10,
    fontWeight: "700",
    color: "#0A8754",
    textTransform: "uppercase",
    letterSpacing: 0.5,
    marginTop: -2,
  },

  icons: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },

  walletPill: {
    backgroundColor: "#fff",
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 20,
    elevation: 4,
    shadowColor: "#000",
    shadowOpacity: 0.08,
    shadowOffset: { width: 0, height: 2 },
    shadowRadius: 5,
    gap: 6,
  },

  walletIconBox: {
    backgroundColor: "#E9F7F1",
    padding: 2,
    borderRadius: 10,
  },

  iconBtn: {
    position: "relative",
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: "rgba(255,255,255,0.85)",
    justifyContent: "center",
    alignItems: "center",
    elevation: 3,
    shadowColor: "#000",
    shadowOpacity: 0.06,
    shadowOffset: { width: 0, height: 1 },
    shadowRadius: 4,
  },

  notifBadge: {
    position: "absolute",
    top: 6,
    right: 7,
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: "#E8294A",
    borderWidth: 1.5,
    borderColor: "#fff",
  },

  walletText: {
    fontWeight: "800",
    fontSize: 13,
    color: "#333",
  },

  deliveryRow: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: 6,
  },

  time: {
    fontSize: 30,
    fontWeight: "700",
  },

  distance: {
    marginLeft: 10,
    backgroundColor: "#D6ECF2",
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 8,
    fontSize: 13,
    fontWeight: "600",
    color: "#1a6e8a",
  },

  locationRow: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: 5,
    gap: 4,
  },

  location: {
    flex: 1,
    color: "#555",
    fontSize: 13,
  },
});