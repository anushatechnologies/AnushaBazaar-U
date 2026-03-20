import { API_CONFIG, fetchWithTimeout } from "@/config/api.config";

const API_BASE = API_CONFIG.ENDPOINTS.ORDERS;

const authHeaders = (token: string) => ({
  "Content-Type": "application/json",
  Authorization: `Bearer ${token}`,
});

export interface OrderCartItem {
  variantId: number | string;
  productId: number | string;
  quantity: number;
  unitPrice: number;
}

export const placeOrder = async (
  token: string,
  addressId: number | string,
  paymentMethod: string
) => {
  const body = { 
    addressId: Number(addressId), 
    paymentMethod 
  };
  
  const response = await fetchWithTimeout(API_BASE, {
    method: "POST",
    headers: authHeaders(token),
    body: JSON.stringify(body),
  });
  if (!response.ok) {
    const errorText = await response.text();
    console.error(`[placeOrder] FAILED ${response.status}: ${API_BASE} - ${errorText}`);
    throw new Error(errorText || `HTTP ${response.status}`);
  }
  return await response.json();
};

/** GET /api/orders – get all orders */
export const getOrders = async (token: string) => {
  try {
    const response = await fetchWithTimeout(API_BASE, {
      headers: authHeaders(token),
    });
    if (!response.ok) {
      const errorText = await response.text();
      console.error(`[getOrders] FAILED ${response.status}: ${API_BASE} - ${errorText}`);
      throw new Error(errorText || `HTTP ${response.status}`);
    }
    return await response.json();
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
      const errorText = await response.text();
      console.error(`[cancelOrder] FAILED ${response.status}: ${errorText}`);
      throw new Error(errorText || `HTTP ${response.status}`);
    }
    return await response.json();
  } catch (error) {
    console.error(`Error cancelling order ${orderId}:`, error);
    throw error;
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
