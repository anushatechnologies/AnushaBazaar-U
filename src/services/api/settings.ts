import { API_CONFIG, fetchWithTimeout } from "@/config/api.config";

export interface AppSettings {
  // Legacy settings endpoint fields
  handlingCharge?: number;
  smallCartFee?: number;
  smallCartThreshold?: number;

  // Checkout settings from /api/checkout-settings
  deliveryCharge?: number;
  platformFee?: number;
  onlinePaymentEnabled?: boolean;
  cashOnDeliveryEnabled?: boolean;

  [key: string]: any;
}

/**
 * Fetch checkout settings from /api/checkout-settings (Admin-configured)
 * Returns deliveryCharge, platformFee, payment method toggles, etc.
 */
export const getAppSettings = async (token?: string): Promise<AppSettings | null> => {
  try {
    const headers: any = { "Content-Type": "application/json" };
    if (token) headers["Authorization"] = `Bearer ${token}`;

    // Fetch both endpoints in parallel
    const [checkoutRes, legacyRes] = await Promise.allSettled([
      fetchWithTimeout(API_CONFIG.ENDPOINTS.CHECKOUT_SETTINGS, { headers }),
      fetchWithTimeout(API_CONFIG.ENDPOINTS.SETTINGS, { headers }),
    ]);

    const merged: AppSettings = {};

    // Parse /api/checkout-settings → { success: true, settings: { deliveryCharge, platformFee, ... } }
    if (checkoutRes.status === "fulfilled" && checkoutRes.value.ok) {
      const json = await checkoutRes.value.json();
      const s = json?.settings || json;
      if (s) {
        if (s.deliveryCharge !== undefined) merged.deliveryCharge = Number(s.deliveryCharge) || 0;
        if (s.platformFee !== undefined) merged.platformFee = Number(s.platformFee) || 0;
        if (s.onlinePaymentEnabled !== undefined) merged.onlinePaymentEnabled = Boolean(s.onlinePaymentEnabled);
        if (s.cashOnDeliveryEnabled !== undefined) merged.cashOnDeliveryEnabled = Boolean(s.cashOnDeliveryEnabled);
      }
    } else {
      console.warn("[getAppSettings] checkout-settings fetch failed");
    }

    // Parse /api/settings → handlingCharge, smallCartFee, smallCartThreshold
    if (legacyRes.status === "fulfilled" && legacyRes.value.ok) {
      const json = await legacyRes.value.json();
      if (json) {
        if (json.handlingCharge !== undefined) merged.handlingCharge = Number(json.handlingCharge) || 0;
        if (json.smallCartFee !== undefined) merged.smallCartFee = Number(json.smallCartFee) || 0;
        if (json.smallCartThreshold !== undefined) merged.smallCartThreshold = Number(json.smallCartThreshold) || 0;
      }
    } else {
      console.warn("[getAppSettings] legacy settings fetch failed");
    }

    return merged;
  } catch (error) {
    console.error("Error fetching app settings:", error);
    return null;
  }
};
