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
 * GET /api/customer/coupons/active
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
 * POST /api/customer/coupons/validate
 * Body: { code, cartAmount, customerId }
 * Validates if a coupon is applicable and returns the discount amount.
 */
export const validateCoupon = async (
  token: string,
  code: string,
  cartAmount: number,
  _customerId?: number | string
): Promise<CouponValidationResult> => {
  try {
    const body = {
      code: code.toUpperCase().trim(),
      cartAmount,
    };

    const response = await fetchWithTimeout(`${API_BASE}/validate`, {
      method: "POST",
      headers: authHeaders(token),
      body: JSON.stringify(body),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error(`[validateCoupon] FAILED ${response.status}: ${errorText}`);

      // Common failure cases
      if (response.status === 400) {
        return { valid: false, discount: 0, message: "Invalid coupon code." };
      }
      if (response.status === 404) {
        return { valid: false, discount: 0, message: "Coupon not found." };
      }
      if (response.status === 410) {
        return { valid: false, discount: 0, message: "This coupon has expired." };
      }

      return { valid: false, discount: 0, message: errorText || "Could not validate coupon." };
    }

    const data = await response.json();

    return {
      valid: data?.valid ?? data?.applicable ?? true,
      discount: data?.discount ?? data?.discountAmount ?? data?.amount ?? 0,
      message: data?.message || "Coupon applied successfully!",
      coupon: data?.coupon || data,
    };
  } catch (error) {
    console.error("Error validating coupon:", error);
    return { valid: false, discount: 0, message: "Could not validate coupon. Please try again." };
  }
};
