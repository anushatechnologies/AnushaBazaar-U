import { API_CONFIG, fetchWithTimeout } from "@/config/api.config";

const API_BASE = API_CONFIG.ENDPOINTS.CART;

const authHeaders = (token: string) => ({
  "Content-Type": "application/json",
  Authorization: `Bearer ${token}`,
});

/** 5.1 GET /api/cart – fetch the current user's cart
 *  Returns: { items: [CartItem] }
 */
export const getCart = async (token: string) => {
  try {
    const response = await fetchWithTimeout(API_BASE, {
      headers: authHeaders(token),
    });
    if (!response.ok) {
      console.error(`[getCart] FAILED ${response.status}: ${API_BASE}`);
      throw new Error(`HTTP ${response.status}`);
    }
    return await response.json(); // { items: [...] }
  } catch (error) {
    console.error("Error fetching cart:", error);
    return { items: [] };
  }
};

/** 5.2 POST /api/cart/items – add an item to cart
 *  Body: { variantId, quantity }
 *  Returns: Updated cart or CartItem
 */
export const addCartItem = async (
  token: string,
  variantId: number | string,
  quantity: number = 1,
  productId?: number | string
) => {
  try {
    const body: any = { variantId: Number(variantId), quantity };
    if (productId) body.productId = Number(productId);

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

/** 5.3 PUT /api/cart/items/{cartItemId}?quantity={qty} – update quantity
 *  Returns: Updated CartItem
 */
export const updateCartItemQty = async (
  token: string,
  cartItemId: number | string,
  quantity: number
) => {
  try {
    const response = await fetchWithTimeout(
      `${API_BASE}/items/${cartItemId}?quantity=${quantity}`,
      {
        method: "PUT",
        headers: authHeaders(token),
      }
    );
    if (!response.ok) {
      console.error(`[updateCartItemQty] FAILED ${response.status}: ${API_BASE}/items/${cartItemId}`);
      throw new Error(`HTTP ${response.status}`);
    }
    return await response.json();
  } catch (error) {
    console.error("Error updating cart item:", error);
    return null;
  }
};

/** 5.4 DELETE /api/cart/items/{cartItemId} – remove single item
 *  Returns: 204 No Content
 */
export const removeCartItem = async (
  token: string,
  cartItemId: number | string
) => {
  try {
    const response = await fetchWithTimeout(`${API_BASE}/items/${cartItemId}`, {
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

/** 5.5 DELETE /api/cart – clear entire cart
 *  Returns: 204 No Content
 */
export const clearServerCart = async (token: string) => {
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
