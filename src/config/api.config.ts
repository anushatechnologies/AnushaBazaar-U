/**
 * Global API Configuration
 * 
 * We use EXPO_PUBLIC_ prefix so that these variables are available 
 * in the application bundle during development and production.
 */

const API_ROOT = process.env.EXPO_PUBLIC_API_URL || "https://api.anushatechnologies.com/api";
const SHARE_URL = process.env.EXPO_PUBLIC_SHARE_URL || "https://anushabazaar.com";

export const API_CONFIG = {
  BASE_URL: API_ROOT,
  SHARE_URL: SHARE_URL,
  ENDPOINTS: {
    PRODUCTS: `${API_ROOT}/products`,
    CATEGORIES: `${API_ROOT}/categories`,
    SUBCATEGORIES: `${API_ROOT}/subcategories`,
    AUTH: `${API_ROOT}/auth/app`,
    CART: `${API_ROOT}/cart`,
    ORDERS: `${API_ROOT}/orders`,
    ADDRESSES: `${API_ROOT}/addresses`,
    PROFILE: `${API_ROOT}/customer/profile`,
    NOTIFICATIONS: `${API_ROOT}/notifications`,
    STORES: `${API_ROOT}/stores`,
    BANNERS: `${API_ROOT}/customer/banners`,
    CUSTOMER: `${API_ROOT}/customer`,
  },
  TIMEOUT: 10000,
};

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
