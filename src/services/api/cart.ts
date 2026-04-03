import { API_CONFIG, fetchWithTimeout } from "@/config/api.config";

const API_BASE = API_CONFIG.ENDPOINTS.CART;

const authHeaders = (token: string) => ({
  "Content-Type": "application/json",
  Authorization: `Bearer ${token}`,
});

/**
 * GET /api/cart/{customerId} – fetch a customer's cart
 */
export const getCart = async (token: string, _customerId?: number | string) => {
  try {
    const response = await fetchWithTimeout(API_BASE, {
      headers: authHeaders(token),
    });
    if (!response.ok) {
      console.error(`[getCart] FAILED ${response.status}: ${API_BASE}`);
      throw new Error(`HTTP ${response.status}`);
    }
    return await response.json();
  } catch (error) {
    console.error("Error fetching cart:", error);
    return null;
  }
};

/**
 * POST /api/cart/add – add an item to cart
 * Body: { customerId, productVariationId, quantity }
 */
export const addCartItem = async (
  token: string,
  variantId: number | string,
  quantity: number = 1,
  _customerId?: number | string
) => {
  try {
    const body = {
      variantId: Number(variantId),
      quantity,
    };

    const response = await fetchWithTimeout(`${API_BASE}/items`, {
      method: "POST",
      headers: authHeaders(token),
      body: JSON.stringify(body),
    });

    if (!response.ok) {
      const text = await response.text();
      console.error(`[addCartItem] FAILED ${response.status}: ${API_BASE}/items - ${text}`);
      throw new Error(`HTTP ${response.status} - ${text}`);
    }
    return await response.json();
  } catch (error) {
    console.error("Error adding cart item:", error);
    return null;
  }
};

/**
 * PUT /api/cart/update-quantity – update item quantity
 * Body: { customerId, productVariationId, quantity }
 */
export const updateCartItemQty = async (
  token: string,
  productVariationId: number | string,
  quantity: number,
  customerId?: number | string
) => {
  try {
    const body: any = {
      productVariationId: Number(productVariationId),
      quantity,
    };
    if (customerId) body.customerId = Number(customerId);

    const response = await fetchWithTimeout(`${API_BASE}/update-quantity`, {
      method: "PUT",
      headers: authHeaders(token),
      body: JSON.stringify(body),
    });
    if (!response.ok) {
      console.error(`[updateCartItemQty] FAILED ${response.status}: ${API_BASE}/update-quantity`);
      throw new Error(`HTTP ${response.status}`);
    }
    return await response.json();
  } catch (error) {
    console.error("Error updating cart item:", error);
    return null;
  }
};

/**
 * DELETE /api/cart/remove?customerId=X&productVariationId=Y – remove single item
 */
export const removeCartItem = async (
  token: string,
  productVariationId: number | string,
  customerId?: number | string
) => {
  try {
    let url = `${API_BASE}/remove?productVariationId=${productVariationId}`;
    if (customerId) url += `&customerId=${customerId}`;

    const response = await fetchWithTimeout(url, {
      method: "DELETE",
      headers: authHeaders(token),
    });
    if (response.status === 204) return true;
    if (!response.ok) throw new Error(`HTTP ${response.status}`);
    return true;
  } catch (error) {
    console.error("Error removing cart item:", error);
    return false;
  }
};

/**
 * DELETE /api/cart/clear/{customerId} – clear entire cart
 */
export const clearServerCart = async (token: string, _customerId?: number | string) => {
  try {
    const response = await fetchWithTimeout(API_BASE, {
      method: "DELETE",
      headers: authHeaders(token),
    });
    if (response.status === 204) return true;
    if (!response.ok) throw new Error(`HTTP ${response.status}`);
    return true;
  } catch (error) {
    console.error("Error clearing cart:", error);
    return false;
  }
};

/** POST /api/cart/merge - Merge guest cart */
export const mergeCart = async (token: string, guestCart: any[]) => {
  try {
    const response = await fetchWithTimeout(`${API_BASE}/merge`, {
      method: "POST",
      headers: authHeaders(token),
      body: JSON.stringify(guestCart),
    });
    if (!response.ok) {
      console.error(`[mergeCart] FAILED ${response.status}`);
      return false;
    }
    return true;
  } catch (error) {
    console.error("Error merging cart:", error);
    return false;
  }
};
