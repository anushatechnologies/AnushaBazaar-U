import { API_CONFIG, fetchWithTimeout } from "@/config/api.config";

const API_BASE = API_CONFIG.ENDPOINTS.COUPONS;

const authHeaders = (token: string) => ({
  "Content-Type": "application/json",
  Authorization: `Bearer ${token}`,
});

export interface Coupon {
  id?: number | string;
  code: string;
  description?: string;
  discountType?: string;   // "PERCENTAGE" | "FLAT"
  discountValue?: number;
  minOrderAmount?: number;
  maxDiscount?: number;
  isActive?: boolean;
  expiresAt?: string;
}

export interface CouponValidationResult {
  valid: boolean;
  discount: number;
  message?: string;
  coupon?: Coupon;
}

/**
 * GET /api/coupons/active
 * Returns all currently active coupons available to customers.
 */
export const getActiveCoupons = async (token: string): Promise<Coupon[]> => {
  try {
    const response = await fetchWithTimeout(`${API_BASE}/active`, {
      headers: authHeaders(token),
    });
    if (!response.ok) {
      console.error(`[getActiveCoupons] FAILED ${response.status}: ${API_BASE}/active`);
      return [];
    }
    const json = await response.json();

    // Handle various response shapes
    if (Array.isArray(json)) return json;
    if (json?.data && Array.isArray(json.data)) return json.data;
    if (json?.coupons && Array.isArray(json.coupons)) return json.coupons;
    if (json?.content && Array.isArray(json.content)) return json.content;
    return [];
  } catch (error) {
    console.error("Error fetching active coupons:", error);
    return [];
  }
};

/**
 * GET /api/coupons/apply?code=...&customerId=...&cartValue=...
 * Validates if a coupon is applicable and returns the discount amount.
 */
export const validateCoupon = async (
  token: string,
  code: string,
  cartAmount: number,
  customerId?: number | string
): Promise<CouponValidationResult> => {
  try {
    const queryParams = new URLSearchParams({
      code: code.toUpperCase().trim(),
      cartValue: cartAmount.toString(),
    });

    if (customerId) {
      queryParams.append("customerId", customerId.toString());
    }

    // Correct endpoint: GET /api/coupons/apply
    const url = `${API_BASE}/apply?${queryParams.toString()}`;

    const response = await fetchWithTimeout(url, {
      method: "GET",
      headers: authHeaders(token),
    });

    // Backend always returns 200 — check response body for success/failure
    const data = await response.json();

    if (!response.ok || data?.success === false) {
      // Backend error shape: { success: false, error: "Coupon has expired" }
      const errMsg = data?.error || data?.message || "Coupon is invalid or expired.";
      console.error(`[validateCoupon] FAILED ${response.status}: ${errMsg}`);
      return { valid: false, discount: 0, message: errMsg };
    }

    // Success shape: { success: true, code: "WELCOME20", discount: 100, finalValue: 400 }
    return {
      valid: true,
      discount: data?.discount ?? 0,
      message: "Coupon applied successfully!",
      coupon: { code: data?.code || code } as Coupon,
    };
  } catch (error) {
    console.error("Error validating coupon:", error);
    return { valid: false, discount: 0, message: "Could not validate coupon. Please try again." };
  }
};
