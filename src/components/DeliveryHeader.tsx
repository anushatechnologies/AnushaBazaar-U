import React, { useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  Pressable,
  ActivityIndicator,
} from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { Ionicons } from "@expo/vector-icons";
import { useNavigation } from "@react-navigation/native";
import { useLocation } from "../context/LocationContext";
import { useWallet } from "../context/WalletContext";
import { useAuth } from "../context/AuthContext";
import { useNotifications } from "../context/NotificationsContext";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { scale } from "../utils/responsive";
import { getStores } from "../services/api/stores";

const DeliveryHeader = () => {
  const navigation = useNavigation<any>();

  const { location, isDetecting } = useLocation();
  const { balance, loading: walletLoading } = useWallet();
  const { unreadCount } = useNotifications();
  const insets = useSafeAreaInsets();
  
  const [currentStore, setCurrentStore] = useState<any>(null);
  const [loadingStore, setLoadingStore] = useState(true);

  React.useEffect(() => {
    const fetchStore = async () => {
      try {
        const storeData = await getStores();
        const stores = Array.isArray(storeData) ? storeData : storeData?.content || storeData?.data || [];
        if (stores.length > 0) {
          // Use the first available store or find the nearest based on distance if coordinate support is added
          setCurrentStore(stores[0]);
        }
      } catch (error) {
        console.log("Error fetching nearby stores:", error);
      } finally {
        setLoadingStore(false);
      }
    };
    fetchStore();
  }, [location?.latitude, location?.longitude]);

  return (
    <LinearGradient
      colors={["#F8D66D", "#FFF"]}
      style={[styles.container, { paddingTop: Math.max(insets.top, scale(20)) }]}
    >
      {/* TOP ROW */}
      <View style={styles.topRow}>
        <View style={{ flex: 1 }}>
          <Text style={styles.brand}>AnushaBazaar</Text>
          <Text style={styles.storeName} numberOfLines={1}>
            {loadingStore ? "Finding nearby stores..." : (currentStore?.name || "Serving you nearby")}
          </Text>
        </View>

        <View style={styles.icons}>
          <Pressable
            style={styles.walletPill}
            onPress={() => navigation.navigate("Wallet")}
            hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
            android_ripple={{ color: 'rgba(10, 135, 84, 0.15)', borderless: true }}
          >
            <View style={styles.walletIconBox}>
              <Ionicons name="wallet-outline" size={scale(14)} color="#0A8754" />
            </View>
            {walletLoading && balance === 0 ? (
              <ActivityIndicator size="small" color="#0A8754" style={{ height: scale(16), transform: [{scale: 0.8}] }} />
            ) : (
              <Text style={styles.walletText}>
                ₹{balance}
              </Text>
            )}
          </Pressable>

          {/* NOTIFICATIONS */}
          <Pressable
            style={styles.iconBtn}
            onPress={() => navigation.navigate("Notifications")}
            hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
            android_ripple={{ color: 'rgba(0,0,0,0.1)', borderless: true, radius: scale(18) }}
          >
            <Ionicons name="notifications-outline" size={scale(22)} color="#333" />
            {unreadCount > 0 && <View style={styles.notifBadge} />}
          </Pressable>

          {/* PROFILE */}
          <Pressable
            onPress={() => navigation.navigate("Profile")}
            hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
            android_ripple={{ color: 'rgba(0,0,0,0.1)', borderless: true, radius: scale(20) }}
          >
            <Ionicons name="person-circle" size={scale(38)} color="#333" />
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
        <Ionicons name="location-outline" size={scale(16)} color="#555" />
        <Text numberOfLines={1} style={styles.location}>
          {isDetecting ? "Detecting your location..." : (location?.address || "Select delivery location")}
        </Text>
        <Ionicons name="chevron-down" size={scale(16)} color="#555" />
      </Pressable>
    </LinearGradient>
  );
};

export default React.memo(DeliveryHeader);

const styles = StyleSheet.create({
  container: {
    paddingBottom: scale(20),
    paddingHorizontal: scale(16),
  },

  topRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },

  brand: {
    fontSize: scale(22),
    fontWeight: "800",
    color: "#111",
  },

  storeName: {
    fontSize: scale(10),
    fontWeight: "700",
    color: "#0A8754",
    textTransform: "uppercase",
    letterSpacing: 0.5,
    marginTop: scale(-2),
  },

  icons: {
    flexDirection: "row",
    alignItems: "center",
    gap: scale(12),
  },

  walletPill: {
    backgroundColor: "#fff",
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: scale(6),
    paddingHorizontal: scale(12),
    borderRadius: scale(20),
    elevation: 4,
    shadowColor: "#000",
    shadowOpacity: 0.08,
    shadowOffset: { width: 0, height: scale(2) },
    shadowRadius: scale(5),
    gap: scale(6),
  },

  walletIconBox: {
    backgroundColor: "#E9F7F1",
    padding: scale(2),
    borderRadius: scale(10),
  },

  iconBtn: {
    position: "relative",
    width: scale(36),
    height: scale(36),
    borderRadius: scale(18),
    backgroundColor: "rgba(255,255,255,0.85)",
    justifyContent: "center",
    alignItems: "center",
    elevation: 3,
    shadowColor: "#000",
    shadowOpacity: 0.06,
    shadowOffset: { width: 0, height: scale(1) },
    shadowRadius: scale(4),
  },

  notifBadge: {
    position: "absolute",
    top: scale(6),
    right: scale(7),
    width: scale(8),
    height: scale(8),
    borderRadius: scale(4),
    backgroundColor: "#E8294A",
    borderWidth: 1.5,
    borderColor: "#fff",
  },

  walletText: {
    fontWeight: "800",
    fontSize: scale(13),
    color: "#333",
  },

  deliveryRow: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: scale(6),
  },

  time: {
    fontSize: scale(30),
    fontWeight: "700",
  },

  distance: {
    marginLeft: scale(10),
    backgroundColor: "#D6ECF2",
    paddingHorizontal: scale(10),
    paddingVertical: scale(4),
    borderRadius: scale(8),
    fontSize: scale(13),
    fontWeight: "600",
    color: "#1a6e8a",
  },

  locationRow: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: scale(5),
    gap: scale(4),
  },

  location: {
    flex: 1,
    color: "#555",
    fontSize: scale(13),
  },
});
