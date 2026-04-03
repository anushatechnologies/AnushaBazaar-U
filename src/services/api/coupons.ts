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

    const url = `${API_CONFIG.BASE_URL}/coupons/apply?${queryParams.toString()}`;

    const response = await fetchWithTimeout(url, {
      method: "GET",
      headers: authHeaders(token),
    });

    const isJson = response.headers.get("content-type")?.includes("application/json");
    
    // In failure cases, backend returns error text or generic 400s
    if (!response.ok) {
      const errorText = isJson ? (await response.json()).message || (await response.text()) : await response.text();
      console.error(`[validateCoupon] FAILED ${response.status}: ${errorText}`);

      return { valid: false, discount: 0, message: typeof errorText === "string" ? errorText.replace(/["]/g, '') : "Could not validate coupon." };
    }

    const data = await response.json();

    return {
      valid: data?.success ?? true,
      discount: data?.discount ?? 0,
      message: "Coupon applied successfully!",
      coupon: { code: data?.code || code } as Coupon,
    };
  } catch (error) {
    console.error("Error validating coupon:", error);
    return { valid: false, discount: 0, message: "Could not validate coupon. Please try again." };
  }
};
