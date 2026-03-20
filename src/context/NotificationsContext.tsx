import React, { createContext, useContext, useState, useEffect, useCallback } from "react";
import { getNotifications } from "../services/api/notifications";
import { useAuth } from "./AuthContext";

type NotificationsContextType = {
  unreadCount: number;
  fetchNotifications: () => Promise<void>;
};

export const NotificationsContext = createContext<NotificationsContextType | undefined>(undefined);

export const NotificationsProvider = ({ children }: any) => {
  const { jwtToken } = useAuth();
  const [unreadCount, setUnreadCount] = useState(0);
  const [isBroken, setIsBroken] = useState(false); // Circuit breaker for 500 errors

  const fetchNotifications = useCallback(async () => {
    if (!jwtToken || isBroken) {
      if (!jwtToken) setUnreadCount(0);
      return;
    }
    
    try {
      const data = await getNotifications(jwtToken);
      if (data && Array.isArray(data)) {
        const unread = data.filter((n: any) => !n.read && !n.isRead).length;
        setUnreadCount(unread);
      }
    } catch (e: any) {
      // If we get a failure consistently, stop polling to avoid log spam
      setIsBroken(true);
    }
  }, [jwtToken, isBroken]);

  // Initial fetch and starting the 15-second poller
  useEffect(() => {
    fetchNotifications();
    const interval = setInterval(fetchNotifications, 15000);
    return () => clearInterval(interval);
  }, [fetchNotifications]);

  return (
    <NotificationsContext.Provider value={{ unreadCount, fetchNotifications }}>
      {children}
    </NotificationsContext.Provider>
  );
};

export const useNotifications = () => {
  const context = useContext(NotificationsContext);
  if (!context) throw new Error("useNotifications must be used within a NotificationsProvider");
  return context;
};
