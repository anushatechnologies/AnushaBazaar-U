import { API_CONFIG, fetchWithTimeout } from "@/config/api.config";
import messaging from "@react-native-firebase/messaging";

const API_BASE = API_CONFIG.ENDPOINTS.AUTH;

/**
 * Get the FCM token for push notifications.
 * Returns empty string if unavailable (non-blocking).
 */
const getFcmToken = async (): Promise<string> => {
  try {
    const token = await messaging().getToken();
    return token || "";
  } catch (error) {
    console.warn("[getFcmToken] Could not get FCM token:", error);
    return "";
  }
};

/**
 * Login an existing user with Firebase ID token.
 * POST /api/auth/login
 * Body: { firebaseIdToken, fcmToken }
 * Returns { jwtToken, customerId, phoneNumber, name, email } on success.
 * Throws with status 404 if user is new (not registered).
 */
export const loginWithFirebaseToken = async (firebaseIdToken: string) => {
  const fcmToken = await getFcmToken();

  const response = await fetchWithTimeout(`${API_BASE}/login`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ firebaseIdToken, fcmToken }),
  });

  if (!response.ok) {
    console.error(`[loginWithFirebaseToken] FAILED ${response.status}: ${API_BASE}/login`);
    const error: any = new Error(`Login failed: ${response.status}`);
    error.status = response.status;
    throw error;
  }

  return await response.json();
};

/**
 * Signup a new user with Firebase ID token + name.
 * POST /api/auth/signup
 * Body: { firebaseIdToken, name, fcmToken }
 * Returns { jwtToken, customerId, phoneNumber, name, email } on success.
 * Throws with status 409 if user already exists.
 */
export const signupWithFirebaseToken = async (
  firebaseIdToken: string,
  name: string,
  email?: string
) => {
  const fcmToken = await getFcmToken();

  // Build body: always include fcmToken, only include email if provided
  const body: any = { firebaseIdToken, name, fcmToken };
  if (email) body.email = email;

  const response = await fetchWithTimeout(`${API_BASE}/signup`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });

  if (!response.ok) {
    console.error(`[signupWithFirebaseToken] FAILED ${response.status}: ${API_BASE}/signup`);
    const error: any = new Error(`Signup failed: ${response.status}`);
    error.status = response.status;
    throw error;
  }

  return await response.json();
};

/**
 * Check if a phone number exists in the database.
 * GET /api/auth/check-phone/{phoneNumber}
 * Returns { exists: boolean } on success.
 */
export const checkPhoneExists = async (phone: string): Promise<{ exists: boolean }> => {
  const cleanPhone = phone.replace(/\D/g, "").replace(/^91/, "");
  const fullPhone = `+91${cleanPhone}`;

  try {
    const response = await fetchWithTimeout(`${API_BASE}/check-phone/${encodeURIComponent(fullPhone)}`, {
      method: "GET",
    });

    // 404 typically means user not found
    if (response.status === 404) {
      return { exists: false };
    }

    if (!response.ok) {
      console.error(`[checkPhoneExists] FAILED ${response.status}: ${API_BASE}/check-phone/${cleanPhone}`);
      // Don't throw — degrade gracefully so the user can still proceed
      return { exists: false };
    }

    const data = await response.json();
    console.log("[checkPhoneExists] raw response:", JSON.stringify(data));

    // Handle various response shapes
    if (typeof data === "boolean") return { exists: data };
    if (data?.exists !== undefined) return { exists: Boolean(data.exists) };
    if (data?.registered !== undefined) return { exists: Boolean(data.registered) };
    if (data?.found !== undefined) return { exists: Boolean(data.found) };
    if (data?.status === "found" || data?.status === "exists") return { exists: true };
    if (data?.status === "not_found" || data?.status === "not_exists") return { exists: false };

    // If the response was 200 OK with any body, the user likely exists
    return { exists: true };
  } catch (error: any) {
    // For all errors — assume user doesn't exist so they can proceed to signup.
    // If they actually exist, the signup backend call will return 409 and the
    // OtpScreen gracefully handles it by retrying as login.
    console.warn("[checkPhoneExists] Error checking phone, defaulting to not found:", error?.message);
    return { exists: false };
  }
};
