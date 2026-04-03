import React, { useState, useCallback } from "react";
import { View, Text, StyleSheet, FlatList, TouchableOpacity, RefreshControl } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useNavigation, useFocusEffect } from "@react-navigation/native";
import { Ionicons } from "@expo/vector-icons";
import { useAuth } from "../context/AuthContext";
import { getNotifications, markAllNotificationsRead, markNotificationRead } from "../services/api/notifications";
import { useNotifications } from "../context/NotificationsContext";
import AppLoader from "../components/AppLoader";

const NotificationsScreen = () => {
  const insets = useSafeAreaInsets();
  const navigation = useNavigation<any>();
  const { jwtToken } = useAuth();
  const { localNotifications, clearLocalNotifications, fetchNotifications: refreshBadge } = useNotifications();
  const [notifs, setNotifs] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const fetchNotifications = useCallback(async () => {
    try {
      let serverNotifs: any[] = [];

      if (jwtToken) {
        const data = await getNotifications(jwtToken);
        const items = Array.isArray(data) ? data : data?.data || data?.notifications || [];
        serverNotifs = items.map((n: any) => ({
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
          orderId: n.orderId || n.order_id,
          source: "server",
        }));
      }

      // Merge local FCM notifications (received via push) with server notifications
      const fcmNotifs = localNotifications.map((n: any) => ({
        ...n,
        source: "local",
      }));

      // Combine: local (push) first, then server — deduplicate by id
      const seenIds = new Set<string>();
      const merged: any[] = [];

      for (const n of [...fcmNotifs, ...serverNotifs]) {
        const key = String(n.id);
        if (!seenIds.has(key)) {
          seenIds.add(key);
          merged.push(n);
        }
      }

      setNotifs(merged);
    } catch (err) {
      console.error("Failed to fetch notifications:", err);
      // Show only local push notifications on error — no fake defaults
      setNotifs(localNotifications.map((n: any) => ({ ...n, source: "local" })));
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [jwtToken, localNotifications]);

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
    clearLocalNotifications();
    try {
      if (jwtToken) await markAllNotificationsRead(jwtToken);
    } catch (err) {
      console.error("Failed to mark all read:", err);
    }
    refreshBadge();
  };

  const handleNotifPress = async (item: any) => {
    // Mark as read locally
    setNotifs((prev) => prev.map((n) => n.id === item.id ? { ...n, unread: false } : n));
    try {
      if (jwtToken && item.source === "server") {
        await markNotificationRead(jwtToken, item.id);
      }
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
      case "delivery": return { name: "bicycle-outline", color: "#F59E0B", bg: "#FFFBEB" };
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
          <AppLoader size="large" />
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
              <Text style={styles.emptyTitle}>No notifications yet</Text>
              <Text style={styles.emptySub}>
                When you receive order updates, offers, or alerts they'll appear here.
              </Text>
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
    paddingHorizontal: 32,
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
    textAlign: "center",
    lineHeight: 22,
  },
});