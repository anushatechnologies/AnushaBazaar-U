/**
 * Global API Configuration
 * 
 * We use EXPO_PUBLIC_ prefix so that these variables are available 
 * in the application bundle during development and production.
 */
import { refreshCustomerSession } from "@/services/authSession";

const API_ROOT = process.env.EXPO_PUBLIC_API_URL || "https://api.anushatechnologies.com/api";
const SHARE_URL = process.env.EXPO_PUBLIC_SHARE_URL || "https://api.anushatechnologies.com/api";

export const API_CONFIG = {
  BASE_URL: API_ROOT,
  SHARE_URL: SHARE_URL,
  ENDPOINTS: {
    PRODUCTS: `${API_ROOT}/products`,
    CATEGORIES: `${API_ROOT}/categories`,
    SUBCATEGORIES: `${API_ROOT}/subcategories`,
    AUTH: `${API_ROOT}/auth`,
    CART: `${API_ROOT}/cart`,
    ORDERS: `${API_ROOT}/orders`,
    PAYMENT: `${API_ROOT}/payment`,
    ADDRESSES: `${API_ROOT}/addresses`,
    PROFILE: `${API_ROOT}/customer/profile`,
    NOTIFICATIONS: `${API_ROOT}/notifications`,
    STORES: `${API_ROOT}/stores`,
    BANNERS: `${API_ROOT}/customer/banners`,
    CUSTOMER: `${API_ROOT}/customer`,
    COUPONS: `${API_ROOT}/coupons`,
    WALLET: `${API_ROOT}/wallet`,
    TRACKING: `${API_ROOT}/tracking`,
    POLICIES: `${API_ROOT}/policies`,
    SAVE_TOKEN: `${API_ROOT}/save-token`,
    SETTINGS: `${API_ROOT}/settings`,
    CHECKOUT_SETTINGS: `${API_ROOT}/checkout-settings`,
  },
  TIMEOUT: 10000,
};

/**
 * Fetch with timeout, and automatic 401 → refresh → retry.
 *
 * If a request returns 401 and the original request had a Bearer token,
 * we call refreshCustomerSession() to get a new accessToken, then retry
 * the original request exactly once with the new token.
 */
export const fetchWithTimeout = async (url: string, options: any = {}, timeout: number = API_CONFIG.TIMEOUT) => {
  const controller = new AbortController();
  const id = setTimeout(() => controller.abort(), timeout);

  try {
    console.log(`[Fetch] Navigating to: ${url}`);
    const response = await fetch(url, {
      ...options,
      signal: controller.signal,
    });
    console.log(`[Fetch] RESPONSE ${response.status}: ${url}`);

    // ─── Auto-refresh on 401 ─────────────────────────────────────────
    // Only attempt refresh if the request had a Bearer token (authenticated)
    // and the URL is NOT the refresh endpoint itself (avoid infinite loop)
    if (
      response.status === 401 &&
      options?.headers?.Authorization?.startsWith("Bearer ") &&
      !url.includes("/auth/refresh") &&
      !url.includes("/auth/login") &&
      !url.includes("/auth/signup")
    ) {
      console.warn(`[Fetch] 401 on ${url} — attempting token refresh...`);

      const newToken = await refreshCustomerSession();
      if (newToken) {
        // Retry the original request with the new token
        console.log(`[Fetch] Retrying ${url} with refreshed token...`);
        const retryController = new AbortController();
        const retryId = setTimeout(() => retryController.abort(), timeout);

        try {
          const retryResponse = await fetch(url, {
            ...options,
            headers: {
              ...options.headers,
              Authorization: `Bearer ${newToken}`,
            },
            signal: retryController.signal,
          });
          console.log(`[Fetch] RETRY RESPONSE ${retryResponse.status}: ${url}`);
          return retryResponse;
        } finally {
          clearTimeout(retryId);
        }
      }
      // If refresh failed, return the original 401 response
    }

    return response;
  } catch (error: any) {
    if (error.name === 'AbortError') {
      console.error(`[Fetch] TIMEOUT after ${timeout}ms: ${url}`);
      throw new Error(`Connection timeout - The server is not responding at ${url}`);
    }
    console.error(`[Fetch] ERROR: ${url}`, error);
    throw error;
  } finally {
    clearTimeout(id);
  }
};

export default API_CONFIG;
