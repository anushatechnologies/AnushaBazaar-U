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
 * PUT /api/cart/items/{itemId}?quantity=X – update item quantity
 */
export const updateCartItemQty = async (
  token: string,
  itemId: number | string,
  quantity: number,
  _customerId?: number | string
) => {
  try {
    const response = await fetchWithTimeout(`${API_BASE}/items/${itemId}?quantity=${quantity}`, {
      method: "PUT",
      headers: authHeaders(token),
    });
    if (!response.ok) {
      console.error(`[updateCartItemQty] FAILED ${response.status}: ${API_BASE}/items/${itemId}`);
      throw new Error(`HTTP ${response.status}`);
    }
    return await response.json();
  } catch (error) {
    console.error("Error updating cart item:", error);
    return null;
  }
};

/**
 * DELETE /api/cart/items/{itemId} – remove single item
 */
export const removeCartItem = async (
  token: string,
  itemId: number | string,
  _customerId?: number | string
) => {
  try {
    const response = await fetchWithTimeout(`${API_BASE}/items/${itemId}`, {
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
    console.log(`[mergeCart] Sending ${guestCart.length} items:`, JSON.stringify(guestCart));
    const response = await fetchWithTimeout(`${API_BASE}/merge`, {
      method: "POST",
      headers: authHeaders(token),
      body: JSON.stringify(guestCart),
    });
    if (!response.ok) {
      const errorText = await response.text().catch(() => "");
      console.error(`[mergeCart] FAILED ${response.status}: ${errorText}`);
      return false;
    }
    console.log(`[mergeCart] SUCCESS - merged ${guestCart.length} items`);
    return true;
  } catch (error) {
    console.error("Error merging cart:", error);
    return false;
  }
};

/**
 * Sync the local cart to the server before placing an order.
 * 
 * Strategy:
 *   1. First, try POST /api/cart/merge with all local items — this is atomic
 *      and the backend will create/update the cart in one transaction.
 *   2. If merge fails, fall back to clearing the cart + adding items one-by-one.
 * 
 * We intentionally do NOT clear the server cart before merging, because delete
 * can destroy the cart entity itself, making subsequent adds/merges fail with
 * "Cart is empty" on order placement.
 */
export const syncCartToServer = async (
  token: string,
  localCart: { variantId: number | string; quantity: number }[]
): Promise<boolean> => {
  if (localCart.length === 0) {
    console.log("[syncCartToServer] Local cart is empty, nothing to sync.");
    return true;
  }

  console.log(`[syncCartToServer] Syncing ${localCart.length} item(s) to server...`,
    JSON.stringify(localCart));

  try {
    // ── Strategy 1: Merge (atomic, preferred) ──────────────────────────
    // Clear first, then merge so server has exactly what the user sees
    await clearServerCart(token);

    // Small delay to let the backend process the delete
    await new Promise(resolve => setTimeout(resolve, 200));

    const merged = await mergeCart(token, localCart);
    if (merged) {
      // Verify the merge actually persisted by reading back
      const verifyCart = await getCart(token);
      const verifyItems = Array.isArray(verifyCart)
        ? verifyCart
        : Array.isArray(verifyCart?.items)
          ? verifyCart.items
          : Array.isArray(verifyCart?.data?.items)
            ? verifyCart.data.items
            : Array.isArray(verifyCart?.data)
              ? verifyCart.data
              : [];

      if (verifyItems.length > 0) {
        console.log(`[syncCartToServer] ✅ Verified: server has ${verifyItems.length} item(s) after merge.`);
        return true;
      }

      console.warn(`[syncCartToServer] Merge returned success but server cart is still empty! Falling back...`);
    }

    // ── Strategy 2: Sequential add (fallback) ──────────────────────────
    console.log(`[syncCartToServer] Merge failed or empty after merge. Trying sequential add...`);

    // Re-clear to avoid duplicates from partial merge
    await clearServerCart(token);
    await new Promise(resolve => setTimeout(resolve, 200));

    // Add items one at a time, sequentially to avoid race conditions
    let successCount = 0;
    for (const item of localCart) {
      const vid = Number(item.variantId);
      const qty = Number(item.quantity || 1);
      if (!Number.isFinite(vid) || vid <= 0) continue;

      const res = await addCartItem(token, vid, qty);
      if (res !== null) {
        successCount++;
      } else {
        console.error(`[syncCartToServer] Failed to add variantId=${vid}, qty=${qty}`);
      }
    }

    if (successCount === 0) {
      console.error(`[syncCartToServer] ❌ All ${localCart.length} items failed to sync!`);
      return false;
    }

    // Final verification
    const finalCart = await getCart(token);
    const finalItems = Array.isArray(finalCart)
      ? finalCart
      : Array.isArray(finalCart?.items)
        ? finalCart.items
        : Array.isArray(finalCart?.data?.items)
          ? finalCart.data.items
          : Array.isArray(finalCart?.data)
            ? finalCart.data
            : [];

    if (finalItems.length > 0) {
      console.log(`[syncCartToServer] ✅ Verified: server has ${finalItems.length} item(s) after sequential add.`);
      return true;
    }

    console.error(`[syncCartToServer] ❌ Server cart still empty after sequential add!`);
    return false;
  } catch (error) {
    console.error("[syncCartToServer] Fatal error:", error);
    return false;
  }
};
