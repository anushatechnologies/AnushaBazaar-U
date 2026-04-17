import React from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useNavigation } from "@react-navigation/native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useCart } from "../context/CartContext";
import { useNotifications } from "../context/NotificationsContext";
import { useLocation } from "../context/LocationContext";

const Header = () => {
  const navigation = useNavigation<any>();
  const { cart } = useCart();
  const { unreadCount } = useNotifications();
  const { location } = useLocation();

  const cartCount = cart.reduce((sum, item) => sum + item.quantity, 0);

  return (
    <SafeAreaView style={styles.safe}>
      <View style={styles.container}>
        {/* Left Section */}
        <View style={{ flex: 1 }}>
          <Text style={styles.eta}>⚡ 45 mins</Text>

          <TouchableOpacity
            onPress={() => navigation.navigate("SelectLocation")}
            activeOpacity={0.7}
          >
            <Text style={styles.location} numberOfLines={1}>
              {location?.address || "Select Location ▼"}
            </Text>
          </TouchableOpacity>
        </View>

        {/* Right Section */}
        <View style={styles.right}>
          {/* Wallet */}
          <TouchableOpacity
            style={styles.iconBtn}
            onPress={() => navigation.navigate("Wallet")}
            activeOpacity={0.7}
          >
            <Ionicons name="wallet-outline" size={24} color="#000" />
          </TouchableOpacity>

          {/* Notifications */}
          <TouchableOpacity
          style={styles.iconBtn}
          onPress={() => navigation.navigate("Notifications")}
          hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
        >
          <Ionicons name="notifications-outline" size={24} color="#1E293B" />
          {unreadCount > 0 && <View style={styles.notifDot} />}
        </TouchableOpacity>

          {/* Cart with badge */}
          <TouchableOpacity
            style={styles.iconBtn}
            onPress={() => navigation.navigate("Cart")}
            activeOpacity={0.7}
          >
            <Ionicons name="cart-outline" size={26} color="#000" />
            {cartCount > 0 && (
              <View style={styles.badge}>
                <Text style={styles.badgeText}>
                  {cartCount > 99 ? "99+" : cartCount}
                </Text>
              </View>
            )}
          </TouchableOpacity>

          {/* Profile */}
          <TouchableOpacity
            style={styles.iconBtn}
            onPress={() => navigation.navigate("Profile")}
            activeOpacity={0.7}
          >
            <Ionicons name="person-circle-outline" size={28} color="#000" />
          </TouchableOpacity>
        </View>
      </View>
    </SafeAreaView>
  );
};

export default Header;

const styles = StyleSheet.create({
  safe: {
    backgroundColor: "#F5E6C5",
  },

  container: {
    paddingHorizontal: 16,
    paddingBottom: 12,
    backgroundColor: "#F5E6C5",
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },

  eta: {
    fontSize: 16,
    fontWeight: "bold",
  },

  location: {
    fontSize: 14,
    color: "#0A8754",
    marginTop: 4,
    fontWeight: "600",
  },

  right: {
    flexDirection: "row",
    alignItems: "center",
  },

  iconBtn: {
    marginLeft: 15,
    position: "relative",
  },

  badge: {
    position: "absolute",
    top: -5,
    right: -6,
    backgroundColor: "#FF3B30",
    minWidth: 17,
    height: 17,
    borderRadius: 9,
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: 3,
    borderWidth: 1.5,
    borderColor: "#F5E6C5",
  },

  badgeText: {
    color: "#fff",
    fontSize: 9,
    fontWeight: "900",
  },

  notifDot: {
    position: "absolute",
    top: -2,
    right: -2,
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: "#E8294A",
    borderWidth: 1.5,
    borderColor: "#F5E6C5",
  },
});
