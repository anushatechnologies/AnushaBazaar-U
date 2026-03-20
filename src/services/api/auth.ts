import { API_CONFIG, fetchWithTimeout } from "@/config/api.config";

const API_BASE = API_CONFIG.ENDPOINTS.AUTH;

/**
 * Login an existing user with Firebase ID token.
 * Returns { jwtToken, customerId, phoneNumber, name, email } on success.
 * Throws with status 404 if user is new (not registered).
 */
export const loginWithFirebaseToken = async (firebaseIdToken: string) => {
  const response = await fetchWithTimeout(`${API_BASE}/login`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ firebaseIdToken }),
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
 * Returns { jwtToken, customerId, phoneNumber, name, email } on success.
 * Throws with status 409 if user already exists.
 */
export const signupWithFirebaseToken = async (
  firebaseIdToken: string,
  name: string,
  email?: string
) => {
  const response = await fetchWithTimeout(`${API_BASE}/signup`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ firebaseIdToken, name, email }),
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
 * Returns { exists: boolean } on success.
 */
export const checkPhoneExists = async (phone: string) => {
  const response = await fetchWithTimeout(`${API_BASE}/check-phone/${phone}`, {
    method: "GET",
  });

  if (!response.ok) {
    console.error(`[checkPhoneExists] FAILED ${response.status}: ${API_BASE}/check-phone/${phone}`);
    const error: any = new Error(`Check phone failed: ${response.status}`);
    error.status = response.status;
    throw error;
  }

  return await response.json();
};
