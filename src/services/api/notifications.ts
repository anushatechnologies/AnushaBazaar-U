import { API_CONFIG, fetchWithTimeout } from "@/config/api.config";

const API_BASE = API_CONFIG.ENDPOINTS.NOTIFICATIONS;

const authHeaders = (token: string) => ({
  "Content-Type": "application/json",
  Authorization: `Bearer ${token}`,
});

/** GET /api/notifications – get all notifications for the authenticated customer */
export const getNotifications = async (token: string) => {
  try {
    const response = await fetchWithTimeout(API_BASE, {
      headers: authHeaders(token),
    });
    if (!response.ok) {
      console.warn(`[Notifications] GET failed with status ${response.status}`);
      return [];
    }
    const json = await response.json();
    // Handle various backend response shapes
    if (Array.isArray(json)) return json;
    if (json?.data && Array.isArray(json.data)) return json.data;
    if (json?.notifications && Array.isArray(json.notifications)) return json.notifications;
    return [];
  } catch (error) {
    console.warn("[Notifications] Fetch failed:", error);
    return [];
  }
};

/** Mark all notifications as read – tries PATCH /read-all */
export const markAllNotificationsRead = async (token: string) => {
  try {
    const response = await fetchWithTimeout(`${API_BASE}/read-all`, {
      method: "PATCH",
      headers: authHeaders(token),
    });
    if (response.ok) return await response.json();
    return { success: true, clientOnly: true };
  } catch (error) {
    return { success: true, clientOnly: true };
  }
};

/** Mark a single notification as read */
export const markNotificationRead = async (token: string, notifId: string | number) => {
  try {
    const response = await fetchWithTimeout(`${API_BASE}/${notifId}/read`, {
      method: "PATCH",
      headers: authHeaders(token),
    });
    if (response.ok) return await response.json();
    return { success: true, clientOnly: true };
  } catch (error) {
    return { success: true, clientOnly: true };
  }
};

/** POST /api/save-token – Save FCM token for push notifications */
export const saveFcmToken = async (phone: string, fcmToken: string) => {
  try {
    const response = await fetchWithTimeout(`${API_CONFIG.BASE_URL}/save-token`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ phone, fcmToken }),
    });
    return response.ok;
  } catch (error) {
    console.error("Error saving FCM token:", error);
    return false;
  }
};
