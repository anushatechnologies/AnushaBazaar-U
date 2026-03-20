import React, { useState, useCallback } from "react";
import { View, Text, StyleSheet, FlatList, TouchableOpacity, ActivityIndicator, RefreshControl } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useNavigation, useFocusEffect } from "@react-navigation/native";
import { Ionicons } from "@expo/vector-icons";
import { useAuth } from "../context/AuthContext";
import { getNotifications, markAllNotificationsRead, markNotificationRead } from "../services/api/notifications";

// Fallback mock if API returns empty or fails
const FALLBACK_NOTIFS = [
  {
    id: "n1",
    type: "promo",
    title: "Flat 20% OFF on Groceries 🎉",
    message: "Use code GROCERY20 to get instant discount on orders above ₹999. Valid till midnight!",
    time: "2 hours ago",
    unread: true,
  },
  {
    id: "n2",
    type: "order",
    title: "Order Delivered!",
    message: "Your order #AB-1024 has been successfully delivered. Rate your experience now.",
    time: "Yesterday",
    unread: true,
  },
  {
    id: "n3",
    type: "wallet",
    title: "Wallet Refund Successful",
    message: "₹120 has been added to your Anusha Wallet for your returning request.",
    time: "12 Mar, 4:30 PM",
    unread: false,
  },
  {
    id: "n4",
    type: "system",
    title: "Welcome to Anusha Bazaar",
    message: "Get ready to experience the fastest grocery delivery. Explore bestsellers today!",
    time: "01 Mar, 9:00 AM",
    unread: false,
  },
];

const NotificationsScreen = () => {
  const insets = useSafeAreaInsets();
  const navigation = useNavigation<any>();
  const { jwtToken } = useAuth();
  const [notifs, setNotifs] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const fetchNotifications = useCallback(async () => {
    try {
      if (jwtToken) {
        const data = await getNotifications(jwtToken);
        const items = Array.isArray(data) ? data : data?.data || data?.notifications || [];
        if (items.length > 0) {
          setNotifs(items.map((n: any) => ({
            id: n.id || n._id,
            type: n.type || "system",
            title: n.title,
            message: n.message || n.body || n.description || "",
            time: n.createdAt
              ? new Date(n.createdAt).toLocaleDateString("en-IN", {
                  day: "2-digit", month: "short", hour: "2-digit", minute: "2-digit"
                })
              : n.time || "",
            unread: n.unread !== undefined ? n.unread : (n.isRead ? false : true),
          })));
        } else {
          setNotifs(FALLBACK_NOTIFS);
        }
      } else {
        setNotifs(FALLBACK_NOTIFS);
      }
    } catch (err) {
      console.error("Failed to fetch notifications:", err);
      setNotifs(FALLBACK_NOTIFS);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [jwtToken]);

  useFocusEffect(
    useCallback(() => {
      setLoading(true);
      fetchNotifications();
    }, [fetchNotifications])
  );

  const onRefresh = () => {
    setRefreshing(true);
    fetchNotifications();
  };

  const unreadCount = notifs.filter((n) => n.unread).length;

  const markAllRead = async () => {
    setNotifs((prev) => prev.map((n) => ({ ...n, unread: false })));
    try {
      if (jwtToken) await markAllNotificationsRead(jwtToken);
    } catch (err) {
      console.error("Failed to mark all read:", err);
    }
  };

  const handleNotifPress = async (item: any) => {
    // Mark as read locally
    setNotifs((prev) => prev.map((n) => n.id === item.id ? { ...n, unread: false } : n));
    try {
      if (jwtToken) await markNotificationRead(jwtToken, item.id);
    } catch (err) {
      // Silently fail
    }

    // Navigate based on type
    if (item.type === "order" && item.orderId) {
      navigation.navigate("OrderTracking", { orderId: item.orderId });
    }
  };

  const getIcon = (type: string) => {
    switch (type) {
      case "promo": return { name: "gift-outline", color: "#E8294A", bg: "#FEF2F2" };
      case "order": return { name: "cube-outline", color: "#0A8754", bg: "#ECFDF5" };
      case "wallet": return { name: "wallet-outline", color: "#0ea5e9", bg: "#e0f2fe" };
      default: return { name: "notifications-outline", color: "#6B7280", bg: "#F3F4F6" };
    }
  };

  const renderNotif = ({ item }: { item: any }) => {
    const iconConfig = getIcon(item.type);
    return (
      <TouchableOpacity
        style={[styles.card, item.unread && styles.cardUnread]}
        onPress={() => handleNotifPress(item)}
        activeOpacity={0.7}
      >
        <View style={styles.cardHeader}>
          <View style={[styles.iconBox, { backgroundColor: iconConfig.bg }]}>
            {/* @ts-ignore */}
            <Ionicons name={iconConfig.name} size={20} color={iconConfig.color} />
          </View>
          <Text style={styles.timeText}>{item.time}</Text>
        </View>

        <View style={styles.cardBody}>
          <Text style={styles.titleText}>{item.title}</Text>
          <Text style={styles.msgText}>{item.message}</Text>
        </View>

        {item.unread && <View style={styles.unreadDot} />}
      </TouchableOpacity>
    );
  };

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity style={styles.backBtn} onPress={() => navigation.goBack()}>
          <Ionicons name="arrow-back" size={24} color="#111827" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Notifications</Text>
        <TouchableOpacity onPress={markAllRead} disabled={unreadCount === 0}>
          <Text style={[styles.readAllTxt, unreadCount === 0 && { color: "#bbb" }]}>
            {unreadCount > 0 ? `Mark all read (${unreadCount})` : "All read ✓"}
          </Text>
        </TouchableOpacity>
      </View>

      {loading ? (
        <View style={styles.loaderContainer}>
          <ActivityIndicator size="large" color="#0A8754" />
        </View>
      ) : (
        <FlatList
          data={notifs}
          keyExtractor={(item) => String(item.id)}
          renderItem={renderNotif}
          contentContainerStyle={{ padding: 16, paddingBottom: 40 }}
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={onRefresh}
              colors={["#0A8754"]}
              tintColor="#0A8754"
            />
          }
          ListEmptyComponent={
            <View style={styles.emptyBox}>
              <Ionicons name="notifications-off-outline" size={48} color="#D1D5DB" />
              <Text style={styles.emptyTitle}>No notifications</Text>
              <Text style={styles.emptySub}>You're all caught up! 🎉</Text>
            </View>
          }
        />
      )}
    </View>
  );
};

export default NotificationsScreen;

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#F9FAFB" },
  loaderContainer: { flex: 1, justifyContent: "center", alignItems: "center" },

  /* Header */
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
  readAllTxt: {
    color: "#0A8754",
    fontSize: 13,
    fontWeight: "600",
  },

  /* Card */
  card: {
    backgroundColor: "#fff",
    borderRadius: 16,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: "#F3F4F6",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.02,
    shadowRadius: 4,
    elevation: 2,
    position: "relative",
  },
  cardUnread: {
    backgroundColor: "#FAFFFC",
    borderColor: "#D1FAE5",
  },
  cardHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 12,
  },
  iconBox: {
    width: 40, height: 40,
    borderRadius: 20,
    justifyContent: "center",
    alignItems: "center",
  },
  timeText: {
    fontSize: 12,
    color: "#9CA3AF",
    fontWeight: "500",
  },
  cardBody: {
    paddingRight: 10,
  },
  titleText: {
    fontSize: 16,
    fontWeight: "700",
    color: "#111827",
    marginBottom: 6,
  },
  msgText: {
    fontSize: 14,
    color: "#6B7280",
    lineHeight: 22,
  },
  unreadDot: {
    position: "absolute",
    top: 16,
    right: 16,
    width: 8, height: 8,
    borderRadius: 4,
    backgroundColor: "#0A8754",
  },

  /* Empty */
  emptyBox: {
    alignItems: "center",
    paddingTop: 80,
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: "700",
    color: "#374151",
    marginTop: 16,
  },
  emptySub: {
    fontSize: 14,
    color: "#9CA3AF",
    marginTop: 6,
  },
});