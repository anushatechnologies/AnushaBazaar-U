import { API_CONFIG, fetchWithTimeout } from "@/config/api.config";

const API_BASE = API_CONFIG.ENDPOINTS.ORDERS;
const TRACKING_BASE = API_CONFIG.ENDPOINTS.TRACKING;

const authHeaders = (token: string) => ({
  "Content-Type": "application/json",
  Authorization: `Bearer ${token}`,
});

const normalizeOrderList = (payload: any) => {
  if (Array.isArray(payload)) return payload;
  if (Array.isArray(payload?.data)) return payload.data;
  if (Array.isArray(payload?.orders)) return payload.orders;
  if (Array.isArray(payload?.content)) return payload.content;
  if (Array.isArray(payload?.value)) return payload.value;
  if (Array.isArray(payload?.result)) return payload.result;
  if (Array.isArray(payload?.data?.content)) return payload.data.content;
  if (Array.isArray(payload?.data?.orders)) return payload.data.orders;
  return [];
};

export interface OrderCartItem {
  variantId: number | string;
  productId: number | string;
  quantity: number;
  unitPrice: number;
}

/**
 * POST /api/orders – create a new order
 * Body includes customerId, addressId, paymentMethod (COD/ONLINE), and items
 */
export const placeOrder = async (
  token: string,
  addressId: number | string,
  paymentMethod: string,
  couponCode?: string,
  discountAmount?: number
) => {
  const body: any = {
    addressId: Number(addressId),
    paymentMethod,
  };

  if (couponCode) {
    body.couponCode = couponCode;
    body.discountAmount = discountAmount || 0;
  }

  const response = await fetchWithTimeout(API_BASE, {
    method: "POST",
    headers: authHeaders(token),
    body: JSON.stringify(body),
  });
  if (!response.ok) {
    const errorText = await response.text();
    console.error(`[placeOrder] FAILED ${response.status}: ${API_BASE} - ${errorText}`);

    if (response.status === 401) {
      throw new Error("Your session has expired or is unauthorized. Please log out and log in again.");
    }

    throw new Error(errorText || `Request failed with error code ${response.status}`);
  }
  return await response.json();
};

/**
 * GET /api/orders/customer/{customerId} – get customer's order history
 * Falls back to GET /api/orders if customerId is not available
 */
export const getOrders = async (token: string, _customerId?: number | string) => {
  try {
    const response = await fetchWithTimeout(API_BASE, {
      headers: authHeaders(token),
    });
    if (!response.ok) {
      const errorText = await response.text();
      console.error(`[getOrders] FAILED ${response.status}: ${API_BASE} - ${errorText}`);
      throw new Error(errorText || `HTTP ${response.status}`);
    }
    const json = await response.json();
    return normalizeOrderList(json);
  } catch (error) {
    console.error("Error fetching orders:", error);
    return [];
  }
};

/** GET /api/orders/{orderId} – get single order details */
export const getOrderById = async (
  token: string,
  orderId: number | string
) => {
  try {
    const response = await fetchWithTimeout(`${API_BASE}/${orderId}`, {
      headers: authHeaders(token),
    });
    if (!response.ok) {
      const errorText = await response.text();
      console.error(`[getOrderById] FAILED ${response.status}: ${API_BASE}/${orderId} - ${errorText}`);
      throw new Error(errorText || `HTTP ${response.status}`);
    }
    return await response.json();
  } catch (error) {
    console.error(`Error fetching order ${orderId}:`, error);
    return null;
  }
};

/** PATCH /api/orders/{orderId}/cancel – cancel an order */
export const cancelOrder = async (
  token: string,
  orderId: number | string,
  reason?: string
) => {
  try {
    const response = await fetchWithTimeout(`${API_BASE}/${orderId}/cancel`, {
      method: "PATCH",
      headers: authHeaders(token),
      body: reason ? JSON.stringify({ reason }) : undefined,
    });
    if (!response.ok) {
      const errorText = await response.text().catch(() => "");
      console.error(`[cancelOrder] FAILED ${response.status}: ${errorText}`);
      throw new Error(errorText || `HTTP ${response.status}`);
    }
    
    if (response.status === 204) return true;
    const text = await response.text().catch(() => "");
    if (!text || text.trim().length === 0) return true;
    try {
      return JSON.parse(text);
    } catch {
      return true;
    }
  } catch (error) {
    console.error(`Error cancelling order ${orderId}:`, error);
    throw error;
  }
};

/**
 * GET /api/tracking/{orderNumber} – get real-time delivery tracking
 */
export const getOrderTracking = async (token: string, orderNumber: string) => {
  try {
    const response = await fetchWithTimeout(`${TRACKING_BASE}/${orderNumber}`, {
      headers: authHeaders(token),
    });
    if (!response.ok) {
      console.error(`[getOrderTracking] FAILED ${response.status}: ${TRACKING_BASE}/${orderNumber}`);
      throw new Error(`HTTP ${response.status}`);
    }
    return await response.json();
  } catch (error) {
    console.error(`Error fetching tracking for ${orderNumber}:`, error);
    return null;
  }
};

/** GET /api/orders/recent-products – get recent products from past orders */
export const getRecentProducts = async (token: string) => {
  try {
    const response = await fetchWithTimeout(`${API_BASE}/recent-products`, {
      headers: authHeaders(token),
    });
    if (!response.ok) {
      const errorText = await response.text();
      console.error(`[getRecentProducts] FAILED ${response.status}: ${errorText}`);
      throw new Error(errorText || `HTTP ${response.status}`);
    }
    return await response.json();
  } catch (error) {
    console.error("Error fetching recent products:", error);
    return [];
  }
};
