import React, { createContext, useContext, useState, useEffect, useCallback, useRef } from "react";
import { AppState, Platform } from "react-native";
import messaging, { FirebaseMessagingTypes } from "@react-native-firebase/messaging";
import * as Notifications from "expo-notifications";
import { getNotifications } from "../services/api/notifications";
import { useAuth } from "./AuthContext";

import AsyncStorage from "@react-native-async-storage/async-storage";

// Configure how notifications appear when app is in foreground
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: true,
    shouldShowBanner: true,
    shouldShowList: true,
  }),
});

type LocalNotification = {
  id: string;
  type: string;
  title: string;
  message: string;
  time: string;
  unread: boolean;
  orderId?: string;
  timestamp?: number;
};

type NotificationsContextType = {
  unreadCount: number;
  localNotifications: LocalNotification[];
  fetchNotifications: () => Promise<void>;
  clearLocalNotifications: () => void;
};

export const NotificationsContext = createContext<NotificationsContextType | undefined>(undefined);

const LOCAL_NOTIFS_KEY = "@local_notifications";
const MAX_NOTIFS = 50;

const formatTime = (date: Date) => {
  return date.toLocaleDateString("en-IN", {
    day: "2-digit",
    month: "short",
    hour: "2-digit",
    minute: "2-digit",
  });
};

const parseRemoteMessage = (remoteMessage: FirebaseMessagingTypes.RemoteMessage): LocalNotification => {
  const data = remoteMessage.data || {};
  return {
    id: remoteMessage.messageId || `fcm_${Date.now()}_${Math.random().toString(36).substring(2, 8)}`,
    type: (data.type as string) || "system",
    title: remoteMessage.notification?.title || (data.title as string) || "Notification",
    message: remoteMessage.notification?.body || (data.body as string) || (data.message as string) || "",
    time: formatTime(new Date()),
    unread: true,
    orderId: (data.orderId as string) || (data.order_id as string) || undefined,
    timestamp: Date.now(),
  };
};

export const NotificationsProvider = ({ children }: any) => {
  const { jwtToken, user } = useAuth();
  const [serverUnreadCount, setServerUnreadCount] = useState(0);
  const [localNotifications, setLocalNotificationsState] = useState<LocalNotification[]>([]);
  const [isBroken, setIsBroken] = useState(false);
  const appState = useRef(AppState.currentState);

  // Safely write to state and AsyncStorage
  const setLocalNotifications = useCallback((updater: (prev: LocalNotification[]) => LocalNotification[]) => {
    setLocalNotificationsState((prev) => {
      const nextRaw = updater(prev);
      const nextFiltered = nextRaw
        .sort((a, b) => (b.timestamp || 0) - (a.timestamp || 0))
        .slice(0, MAX_NOTIFS);
      
      AsyncStorage.setItem(LOCAL_NOTIFS_KEY, JSON.stringify(nextFiltered)).catch((e) =>
        console.error("AsyncStorage error saving notifications:", e)
      );
      return nextFiltered;
    });
  }, []);

  // Load from AsyncStorage explicitly on mount
  useEffect(() => {
    const loadCache = async () => {
      try {
        const cached = await AsyncStorage.getItem(LOCAL_NOTIFS_KEY);
        if (cached) {
          const parsed = JSON.parse(cached);
          if (Array.isArray(parsed)) {
             setLocalNotificationsState(parsed);
          }
        }
      } catch (e) {
        console.error("AsyncStorage error loading local notifications:", e);
      }
    };
    loadCache();
  }, []);


  // ─── Fetch server notifications for badge count ───
  const fetchNotifications = useCallback(async () => {
    if (!jwtToken || isBroken) {
      if (!jwtToken) setServerUnreadCount(0);
      return;
    }

    try {
      const data = await getNotifications(jwtToken);
      if (data && Array.isArray(data)) {
        const unread = data.filter((n: any) => !n.read && !n.isRead).length;
        setServerUnreadCount(unread);
      }
    } catch (e: any) {
      setIsBroken(true);
    }
  }, [jwtToken, isBroken]);

  // ─── FCM: Foreground message listener ───
  useEffect(() => {
    const unsubscribe = messaging().onMessage(async (remoteMessage) => {
      console.log("[FCM] Foreground message received:", JSON.stringify(remoteMessage));

      const notif = parseRemoteMessage(remoteMessage);
      setLocalNotifications((prev) => [notif, ...prev]);

      // Show a local notification banner via expo-notifications
      await Notifications.scheduleNotificationAsync({
        content: {
          title: notif.title,
          body: notif.message,
          data: remoteMessage.data || {},
          sound: "default",
        },
        trigger: null, // Show immediately
      });
    });

    return unsubscribe;
  }, []);

  // ─── FCM: Background/Quit message handler (opens notification tray) ───
  useEffect(() => {
    // When user taps a notification that woke the app from quit state
    messaging()
      .getInitialNotification()
      .then((remoteMessage) => {
        if (remoteMessage) {
          console.log("[FCM] App opened from quit via notification:", JSON.stringify(remoteMessage));
          const notif = parseRemoteMessage(remoteMessage);
          setLocalNotifications((prev) => [notif, ...prev]);
        }
      });

    // When user taps a notification while app is in background
    const unsubscribe = messaging().onNotificationOpenedApp((remoteMessage) => {
      console.log("[FCM] App opened from background via notification:", JSON.stringify(remoteMessage));
      const notif = parseRemoteMessage(remoteMessage);
      setLocalNotifications((prev) => [notif, ...prev]);
    });

    return unsubscribe;
  }, []);

  // ─── FCM: Request permission (iOS + Android 13+) ───
  useEffect(() => {
    const requestPermission = async () => {
      try {
        const authStatus = await messaging().requestPermission();
        const enabled =
          authStatus === messaging.AuthorizationStatus.AUTHORIZED ||
          authStatus === messaging.AuthorizationStatus.PROVISIONAL;
        console.log("[FCM] Permission status:", enabled ? "granted" : "denied");
      } catch (err) {
        console.warn("[FCM] Permission request failed:", err);
      }
    };
    requestPermission();
  }, []);

  // ─── Refresh on app foreground ───
  useEffect(() => {
    const subscription = AppState.addEventListener("change", (nextAppState) => {
      if (appState.current.match(/inactive|background/) && nextAppState === "active") {
        // App came to foreground — refresh server count
        fetchNotifications();
      }
      appState.current = nextAppState;
    });

    return () => subscription.remove();
  }, [fetchNotifications]);

  // ─── Initial fetch + polling (every 30s instead of 15s to reduce load) ───
  useEffect(() => {
    fetchNotifications();
    const interval = setInterval(fetchNotifications, 30000);
    return () => clearInterval(interval);
  }, [fetchNotifications]);

  const clearLocalNotifications = () => {
    setLocalNotifications(() => []);
  };

  // Total unread = server unread + local push unread
  const localUnread = localNotifications.filter((n) => n.unread).length;
  const unreadCount = serverUnreadCount + localUnread;

  return (
    <NotificationsContext.Provider
      value={{
        unreadCount,
        localNotifications,
        fetchNotifications,
        clearLocalNotifications,
      }}
    >
      {children}
    </NotificationsContext.Provider>
  );
};

export const useNotifications = () => {
  const context = useContext(NotificationsContext);
  if (!context) throw new Error("useNotifications must be used within a NotificationsProvider");
  return context;
};
