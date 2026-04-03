import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useRef,
  useState,
} from "react";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useWallet } from "./WalletContext";
import { useAuth } from "./AuthContext";
import * as CartAPI from "../services/api/cart";
import {
  addToWishlistApi,
  getWishlistApi,
  mergeWishlistApi,
  removeFromWishlistApi,
} from "../services/api/products";
import { validateCoupon } from "../services/api/coupons";
import { normalizeImageUrl } from "../utils/image";

const AUTH_CART_STORAGE_KEY = "CART";
const AUTH_WISHLIST_STORAGE_KEY = "WISHLIST";
const GUEST_CART_STORAGE_KEY = "GUEST_CART";
const GUEST_WISHLIST_STORAGE_KEY = "GUEST_WISHLIST";
const APPLIED_COUPON_STORAGE_KEY = "APPLIED_COUPON";
const USE_POINTS_STORAGE_KEY = "USE_POINTS";
const PENDING_GUEST_SYNC_KEY = "PENDING_GUEST_SYNC";

export type Product = {
  id: string;
  name: string;
  price: number;
  image?: any;
  imageUrl?: string;
  icon?: string;
  unit?: string;
  quantity?: string | number;
  variantId?: string | number;
  variantName?: string;
  productVariants?: any[];
  productId?: number | string;
  sellingPrice?: number;
  originalPrice?: number;
  mrp?: number;
};

export type CartItem = Product & {
  quantity: number;
  cartItemId?: number | string;
  productId?: number | string;
};

type CartContextType = {
  cart: CartItem[];
  wishlist: Product[];
  total: number;
  appliedCoupon: string | null;
  discount: number;
  usePoints: boolean;
  setUsePoints: (value: boolean) => void;
  pointsDiscount: number;
  addToCart: (product: Product, selectedVariant?: any) => void;
  removeFromCart: (id: string) => void;
  increaseQty: (id: string) => void;
  decreaseQty: (id: string) => void;
  clearCart: () => void;
  refreshCart: () => Promise<void>;
  applyCoupon: (code: string) => Promise<{ success: boolean; message: string }>;
  removeCoupon: () => void;
  addToWishlist: (product: Product) => void;
  removeFromWishlist: (id: string) => void;
};

const CartContext = createContext<CartContextType>({} as CartContextType);

const safeJsonParse = <T,>(value: string | null, fallback: T): T => {
  if (!value) return fallback;

  try {
    return JSON.parse(value) as T;
  } catch {
    return fallback;
  }
};

const getNormalizedProductImage = (
  product?: Record<string, any>,
  variant?: Record<string, any>
) =>
  normalizeImageUrl(
    variant?.imageUrl ||
      variant?.image ||
      product?.imageUrl ||
      product?.image ||
      product?.thumbnail ||
      product?.icon ||
      product?.imageUri
  ) || undefined;

const readFirstAvailable = async (keys: string[]) => {
  for (const key of keys) {
    const value = await AsyncStorage.getItem(key);
    if (value) return value;
  }

  return null;
};

const buildWishlistProduct = (product: any): Product => {
  const primaryVariant =
    Array.isArray(product?.productVariants) && product.productVariants.length > 0
      ? product.productVariants[0]
      : null;

  const imageUrl =
    getNormalizedProductImage(product, primaryVariant) ||
    normalizeImageUrl(product?.thumbnail) ||
    undefined;

  return {
    ...product,
    id: String(product?.id || product?.productId || ""),
    name: product?.name || product?.productName || "Product",
    price:
      primaryVariant?.sellingPrice ??
      primaryVariant?.price ??
      product?.price ??
      0,
    image: imageUrl || product?.image || null,
    imageUrl,
    unit: product?.unit || primaryVariant?.unit,
    quantity: product?.quantity ?? primaryVariant?.quantity,
    variantId: product?.variantId ?? primaryVariant?.id,
    variantName:
      product?.variantName ??
      primaryVariant?.variantName ??
      primaryVariant?.name,
    productId: product?.productId ?? product?.id,
  };
};

/**
 * Picks the first valid price (> 0, finite number) from a list of candidates.
 * Unlike ||, this does NOT skip 0 by accident — it explicitly checks each value.
 */
const pickValidPrice = (...candidates: any[]): number => {
  for (const val of candidates) {
    const num = Number(val);
    if (num > 0 && Number.isFinite(num)) return num;
  }
  return 0;
};

const mapServerCartItem = (item: any): CartItem => {
  const normalizedImage =
    normalizeImageUrl(
      item?.productImage ||
        item?.imageUrl ||
        item?.image ||
        item?.thumbnail ||
        item?.product?.imageUrl ||
        item?.product?.image ||
        item?.product?.thumbnail ||
        item?.productVariant?.imageUrl ||
        item?.productVariant?.image
    ) || "";

  // ── Normalize variant pricing (same logic as mapProducts in products.ts) ──
  // Backend model: variant.price = MRP, variant.discountPrice = selling price after discount
  const variant = item?.productVariant;
  const product = item?.product;

  const vMrp = pickValidPrice(variant?.mrp, variant?.price);
  const vDiscountPrice = variant?.discountPrice;
  const vHasValidDiscount =
    vDiscountPrice != null && Number(vDiscountPrice) > 0;
  // Mirror mapProducts: sellingPrice ?? (hasValidDiscount ? discountPrice : mrp)
  const vNormalizedSelling = pickValidPrice(
    variant?.sellingPrice,
    vHasValidDiscount ? vDiscountPrice : undefined,
    vMrp
  );

  // ── Normalize product pricing (same logic) ──
  const pMrp = pickValidPrice(product?.mrp, product?.price);
  const pDiscountPrice = product?.discountPrice;
  const pHasValidDiscount =
    pDiscountPrice != null && Number(pDiscountPrice) > 0;
  const pNormalizedSelling = pickValidPrice(
    product?.sellingPrice,
    pHasValidDiscount ? pDiscountPrice : undefined,
    pMrp
  );

  // ── Resolve selling price ──
  // Prioritize the normalized variant/product selling price (consistent with
  // how product cards compute their price via mapProducts).  Server-level
  // unitPrice / price are lower priority because they can be the raw
  // discountPrice value from the backend, which may differ from the correctly
  // normalized selling price.
  const resolvedPrice = pickValidPrice(
    vNormalizedSelling,
    pNormalizedSelling,
    item?.unitPrice,
    item?.sellingPrice,
    item?.price
  );

  // ── Resolve MRP ──
  const resolvedMrp = pickValidPrice(
    vMrp,
    pMrp,
    item?.mrp,
    variant?.price,
    product?.price
  );

  console.log(
    `[mapServerCartItem] ${item?.productName || item?.name}: ` +
      `unitPrice=${item?.unitPrice}, sellingPrice=${item?.sellingPrice}, ` +
      `variant.sellingPrice=${variant?.sellingPrice}, variant.discountPrice=${vDiscountPrice}, ` +
      `variant.price=${variant?.price}, price=${item?.price} ` +
      `→ resolved=${resolvedPrice}, mrp=${resolvedMrp}`
  );

  return {
    id: String(item?.variantId || item?.productId || item?.id),
    name: item?.productName || item?.name || "Product",
    variantName: item?.variantName,
    price: resolvedPrice,
    sellingPrice: resolvedPrice,
    originalPrice: resolvedMrp > resolvedPrice ? resolvedMrp : undefined,
    mrp: resolvedMrp > resolvedPrice ? resolvedMrp : undefined,
    image: normalizedImage || null,
    imageUrl: normalizedImage || undefined,
    quantity: item?.quantity || 1,
    variantId: item?.variantId,
    productId: item?.productId,
    cartItemId: item?.id,
    unit: item?.unit,
  };
};

export const CartProvider = ({ children }: any) => {
  const [cart, setCart] = useState<CartItem[]>([]);
  const [wishlist, setWishlist] = useState<Product[]>([]);
  const [appliedCoupon, setAppliedCoupon] = useState<string | null>(null);
  const [discount, setDiscount] = useState<number>(0);
  const [usePoints, setUsePoints] = useState(false);
  const [storageReady, setStorageReady] = useState(false);

  const { points } = useWallet();
  const { jwtToken, loading: authLoading, user } = useAuth();

  const hasResolvedAuthRef = useRef(false);
  const previousTokenRef = useRef<string | null | undefined>(undefined);

  const clearGuestState = useCallback(async () => {
    await AsyncStorage.multiRemove([
      GUEST_CART_STORAGE_KEY,
      GUEST_WISHLIST_STORAGE_KEY,
      PENDING_GUEST_SYNC_KEY,
    ]);
  }, []);

  const clearAuthCache = useCallback(async () => {
    await AsyncStorage.multiRemove([
      AUTH_CART_STORAGE_KEY,
      AUTH_WISHLIST_STORAGE_KEY,
    ]);
  }, []);

  const loadLocalState = useCallback(async (isAuthenticated: boolean) => {
    setStorageReady(false);

    try {
      const [cartData, wishlistData, couponCode, savedUsePoints] =
        await Promise.all([
          readFirstAvailable(
            isAuthenticated
              ? [AUTH_CART_STORAGE_KEY]
              : [GUEST_CART_STORAGE_KEY, AUTH_CART_STORAGE_KEY]
          ),
          readFirstAvailable(
            isAuthenticated
              ? [AUTH_WISHLIST_STORAGE_KEY]
              : [GUEST_WISHLIST_STORAGE_KEY, AUTH_WISHLIST_STORAGE_KEY]
          ),
          AsyncStorage.getItem(APPLIED_COUPON_STORAGE_KEY),
          AsyncStorage.getItem(USE_POINTS_STORAGE_KEY),
        ]);

      setCart(safeJsonParse<CartItem[]>(cartData, []));
      setWishlist(safeJsonParse<Product[]>(wishlistData, []));
      setAppliedCoupon(couponCode || null);
      setUsePoints(safeJsonParse<boolean>(savedUsePoints, false));
    } catch (error) {
      console.log("Storage load error:", error);
      setCart([]);
      setWishlist([]);
      setAppliedCoupon(null);
      setUsePoints(false);
    } finally {
      setStorageReady(true);
    }
  }, []);

  const refreshCart = useCallback(async () => {
    if (!jwtToken) return;

    try {
      const serverCart = await CartAPI.getCart(jwtToken, user?.customerId);
      if (!serverCart) return;

      const serverItems = Array.isArray(serverCart)
        ? serverCart
        : Array.isArray(serverCart?.items)
          ? serverCart.items
          : Array.isArray(serverCart?.data?.items)
            ? serverCart.data.items
            : Array.isArray(serverCart?.data)
              ? serverCart.data
              : [];

      console.log("[refreshCart] Raw server items:", JSON.stringify(serverItems.slice(0, 2), null, 2));

      setCart(serverItems.map(mapServerCartItem));
    } catch (error) {
      console.log("Cart refresh error:", error);
    }
  }, [jwtToken, user?.customerId]);

  const refreshWishlist = useCallback(async () => {
    if (!jwtToken) return;

    try {
      const serverWishlist = await getWishlistApi(jwtToken, user?.customerId);
      setWishlist(serverWishlist.map(buildWishlistProduct));
    } catch (error) {
      console.log("Wishlist refresh error:", error);
    }
  }, [jwtToken]);

  const mergeGuestData = useCallback(
    async (token: string) => {
      try {
        const [guestCartRaw, guestWishlistRaw] = await Promise.all([
          AsyncStorage.getItem(GUEST_CART_STORAGE_KEY),
          AsyncStorage.getItem(GUEST_WISHLIST_STORAGE_KEY),
        ]);

        const guestCart = safeJsonParse<CartItem[]>(guestCartRaw, []);
        const guestWishlist = safeJsonParse<Product[]>(guestWishlistRaw, []);

        const cartPayload = guestCart
          .map((item) => ({
            variantId: Number(item.variantId || item.id),
            quantity: Number(item.quantity || 1),
          }))
          .filter((item) => Number.isFinite(item.variantId) && item.quantity > 0);

        const wishlistIds = guestWishlist
          .map((item) => Number(item.id))
          .filter((id) => Number.isFinite(id));

        const cartMerged =
          cartPayload.length === 0
            ? true
            : await CartAPI.mergeCart(token, cartPayload);
        const wishlistMerged =
          wishlistIds.length === 0
            ? true
            : await mergeWishlistApi(token, wishlistIds);

        if (cartMerged && wishlistMerged) {
          await clearGuestState();
        }
      } catch (error) {
        console.error("Guest merge error:", error);
      } finally {
        await Promise.all([refreshCart(), refreshWishlist()]);
      }
    },
    [clearGuestState, refreshCart, refreshWishlist]
  );

  useEffect(() => {
    if (authLoading) return;

    let cancelled = false;

    const syncForAuthState = async () => {
      const previousToken = previousTokenRef.current;
      const isFirstResolution = !hasResolvedAuthRef.current;
      const isAuthenticated = Boolean(jwtToken);

      if (!isFirstResolution && previousToken && !jwtToken) {
        await clearAuthCache();
      }

      await loadLocalState(isAuthenticated);
      if (cancelled) return;

      hasResolvedAuthRef.current = true;

      if (!jwtToken) {
        previousTokenRef.current = null;
        return;
      }

      const pendingGuestSync =
        (await AsyncStorage.getItem(PENDING_GUEST_SYNC_KEY)) === "true";
      const didJustLogin = !previousToken && Boolean(jwtToken);

      previousTokenRef.current = jwtToken;

      if (didJustLogin || pendingGuestSync) {
        await mergeGuestData(jwtToken);
        return;
      }

      await Promise.all([refreshCart(), refreshWishlist()]);
    };

    syncForAuthState();

    return () => {
      cancelled = true;
    };
  }, [
    authLoading,
    clearAuthCache,
    jwtToken,
    loadLocalState,
    mergeGuestData,
    refreshCart,
    refreshWishlist,
  ]);

  useEffect(() => {
    if (authLoading || !storageReady) return;

    const persistCart = async () => {
      try {
        await AsyncStorage.setItem(
          jwtToken ? AUTH_CART_STORAGE_KEY : GUEST_CART_STORAGE_KEY,
          JSON.stringify(cart)
        );
        await AsyncStorage.setItem(
          USE_POINTS_STORAGE_KEY,
          JSON.stringify(usePoints)
        );

        if (appliedCoupon) {
          await AsyncStorage.setItem(APPLIED_COUPON_STORAGE_KEY, appliedCoupon);
        } else {
          await AsyncStorage.removeItem(APPLIED_COUPON_STORAGE_KEY);
        }
      } catch (error) {
        console.log("Cart save error:", error);
      }
    };

    persistCart();
  }, [appliedCoupon, authLoading, cart, jwtToken, storageReady, usePoints]);

  useEffect(() => {
    if (authLoading || !storageReady) return;

    const persistWishlist = async () => {
      try {
        await AsyncStorage.setItem(
          jwtToken ? AUTH_WISHLIST_STORAGE_KEY : GUEST_WISHLIST_STORAGE_KEY,
          JSON.stringify(wishlist)
        );
      } catch (error) {
        console.log("Wishlist save error:", error);
      }
    };

    persistWishlist();
  }, [authLoading, jwtToken, storageReady, wishlist]);

  useEffect(() => {
    if (authLoading || !storageReady || jwtToken) return;

    const updatePendingGuestSync = async () => {
      try {
        if (cart.length > 0 || wishlist.length > 0) {
          await AsyncStorage.setItem(PENDING_GUEST_SYNC_KEY, "true");
        } else {
          await AsyncStorage.removeItem(PENDING_GUEST_SYNC_KEY);
        }
      } catch (error) {
        console.log("Guest sync flag error:", error);
      }
    };

    updatePendingGuestSync();
  }, [authLoading, cart.length, jwtToken, storageReady, wishlist.length]);

  useEffect(() => {
    const rawTotal = cart.reduce(
      (sum, item) => sum + item.price * item.quantity,
      0
    );

    if (appliedCoupon && jwtToken) {
      validateCoupon(jwtToken, appliedCoupon, rawTotal, user?.customerId).then(result => {
        if (result.valid) {
          setDiscount(result.discount);
        } else {
          setAppliedCoupon(null);
          setDiscount(0);
        }
      }).catch(() => {
        setAppliedCoupon(null);
        setDiscount(0);
      });
      return;
    }

    setDiscount(0);
  }, [appliedCoupon, cart, jwtToken, user?.customerId]);

  const applyCoupon = async (code: string): Promise<{ success: boolean; message: string }> => {
    const rawTotal = cart.reduce(
      (sum, item) => sum + item.price * item.quantity,
      0
    );

    if (!jwtToken) {
      return { success: false, message: "Please login to apply coupons." };
    }

    try {
      const result = await validateCoupon(jwtToken, code, rawTotal, user?.customerId);
      if (result.valid) {
        setAppliedCoupon(code.toUpperCase());
        setDiscount(result.discount);
        return { success: true, message: result.message || "Coupon applied successfully" };
      } else {
        return { success: false, message: result.message || "Invalid coupon" };
      }
    } catch (error) {
      return { success: false, message: "Could not apply coupon at this time." };
    }
  };

  const removeCoupon = () => {
    setAppliedCoupon(null);
    setDiscount(0);
  };

  const rawTotal = cart.reduce(
    (sum, item) => sum + item.price * item.quantity,
    0
  );
  const totalAfterCoupon = rawTotal - discount;
  const pointsDiscount = usePoints ? Math.min(points, totalAfterCoupon) : 0;
  const total = totalAfterCoupon - pointsDiscount;

  const addToCart = async (
    product: Product & { productVariants?: any[] },
    selectedVariant?: any
  ) => {
    const variant =
      selectedVariant ||
      (product.productVariants && product.productVariants.length > 0
        ? product.productVariants[0]
        : null);

    // Always prefer the variant's own id; product.variantId is the first variant id
    // set during normalization; product.id is the PRODUCT id and must NOT be sent
    // to the backend as a variantId.
    const variantId = variant?.id ?? product.variantId;
    const variantName =
      variant?.variantName ?? variant?.name ?? product.variantName ?? "";
    const variantPrice = pickValidPrice(
      variant?.sellingPrice, variant?.price, product?.sellingPrice, product?.price
    );
    const variantMrp = pickValidPrice(
      variant?.mrp, variant?.price, product?.mrp, product?.originalPrice
    );
    const productId = Number(product.productId || product.id);
    const imageUrl = getNormalizedProductImage(product as any, variant);

    if (!variantId) {
      console.warn("[Cart] Cannot add to cart: missing variant id for", product.name);
      return;
    }

    const cartKey = String(variantId);

    setCart((previousCart) => {
      const existingItem = previousCart.find(
        (item) => String(item.variantId || item.id) === cartKey
      );

      if (existingItem) {
        return previousCart;
      }

      return [
        ...previousCart,
        {
          ...product,
          id: cartKey,
          variantId: Number(variantId),
          variantName,
          price: variantPrice,
          sellingPrice: variantPrice,
          originalPrice: variantMrp > variantPrice ? variantMrp : undefined,
          mrp: variantMrp > variantPrice ? variantMrp : undefined,
          image: imageUrl || null,
          imageUrl,
          quantity: 1,
          cartItemId: undefined,
          productId,
        } as CartItem,
      ];
    });

    if (!jwtToken) return;

    try {
      const addedItem = await CartAPI.addCartItem(jwtToken, Number(variantId), 1, user?.customerId);

      // If server returns an ID, attach it
      if (addedItem && (addedItem.id || addedItem.cartItemId)) {
        const serverId = addedItem.id || addedItem.cartItemId;
        setCart((previousCart) =>
          previousCart.map((item) =>
            String(item.variantId || item.id) === cartKey
              ? { ...item, cartItemId: serverId }
              : item
          )
        );
      }
      
      // DO NOT call refreshCart() here. It will forcibly wipe the multi-adds
      // that the user pressed rapidly. We rely completely on the optimistic state.

    } catch (error) {
      console.log("Server add cart error:", error);
      // Don't wipe optimistic state for network errors — keep the local item
    }
  };

  const removeFromCart = (id: string) => {
    const item = cart.find((cartItem) => cartItem.id === id);

    setCart((previousCart) =>
      previousCart.filter((cartItem) => cartItem.id !== id)
    );

    if (!jwtToken) return;

    if (!item?.cartItemId) {
      refreshCart().catch(() => undefined);
      return;
    }

    CartAPI.removeCartItem(jwtToken, item.cartItemId, user?.customerId).catch((error) => {
      console.log("Server remove cart error:", error);
      refreshCart().catch(() => undefined);
    });
  };

  const increaseQty = (id: string) => {
    const item = cart.find((cartItem) => cartItem.id === id);
    if (!item) return;

    const nextQuantity = item.quantity + 1;

    setCart((previousCart) =>
      previousCart.map((cartItem) =>
        cartItem.id === id ? { ...cartItem, quantity: nextQuantity } : cartItem
      )
    );

    if (!jwtToken) return;

    if (!item.cartItemId) {
      refreshCart().catch(() => undefined);
      return;
    }

    CartAPI.updateCartItemQty(jwtToken, item.cartItemId, nextQuantity, user?.customerId).catch(
      (error) => {
        console.log("Server update qty error:", error);
        refreshCart().catch(() => undefined);
      }
    );
  };

  const decreaseQty = (id: string) => {
    const item = cart.find((cartItem) => cartItem.id === id);
    if (!item) return;

    if (item.quantity <= 1) {
      setCart((previousCart) =>
        previousCart.filter((cartItem) => cartItem.id !== id)
      );

      if (!jwtToken) return;

      if (!item.cartItemId) {
        refreshCart().catch(() => undefined);
        return;
      }

      CartAPI.removeCartItem(jwtToken, item.cartItemId, user?.customerId).catch((error) => {
        console.log("Server remove cart error:", error);
        refreshCart().catch(() => undefined);
      });

      return;
    }

    const nextQuantity = item.quantity - 1;

    setCart((previousCart) =>
      previousCart.map((cartItem) =>
        cartItem.id === id ? { ...cartItem, quantity: nextQuantity } : cartItem
      )
    );

    if (!jwtToken) return;

    if (!item.cartItemId) {
      refreshCart().catch(() => undefined);
      return;
    }

    CartAPI.updateCartItemQty(jwtToken, item.cartItemId, nextQuantity, user?.customerId).catch(
      (error) => {
        console.log("Server update qty error:", error);
        refreshCart().catch(() => undefined);
      }
    );
  };

  const clearCart = () => {
    setCart([]);
    setUsePoints(false);
    setAppliedCoupon(null);

    if (!jwtToken) return;

    CartAPI.clearServerCart(jwtToken, user?.customerId).catch((error) => {
      console.log("Server clear cart error:", error);
      refreshCart().catch(() => undefined);
    });
  };

  const addToWishlist = async (product: Product) => {
    const normalizedProduct = buildWishlistProduct(product);

    setWishlist((previousWishlist) => {
      const alreadyExists = previousWishlist.find(
        (item) => String(item.id) === String(normalizedProduct.id)
      );

      if (alreadyExists) {
        return previousWishlist;
      }

      return [...previousWishlist, normalizedProduct];
    });

    if (!jwtToken) return;

    try {
      const success = await addToWishlistApi(jwtToken, normalizedProduct.id, user?.customerId);
      if (!success) {
        await refreshWishlist();
      }
    } catch (error) {
      console.log("Server add wishlist error:", error);
      await refreshWishlist();
    }
  };

  const removeFromWishlist = (id: string) => {
    setWishlist((previousWishlist) =>
      previousWishlist.filter((item) => String(item.id) !== String(id))
    );

    if (!jwtToken) return;

    removeFromWishlistApi(jwtToken, id, user?.customerId).catch((error) => {
      console.log("Server remove wishlist error:", error);
      refreshWishlist().catch(() => undefined);
    });
  };

  return (
    <CartContext.Provider
      value={{
        cart,
        wishlist,
        total,
        appliedCoupon,
        discount,
        usePoints,
        setUsePoints,
        pointsDiscount,
        addToCart,
        removeFromCart,
        increaseQty,
        decreaseQty,
        clearCart,
        refreshCart,
        applyCoupon,
        removeCoupon,
        addToWishlist,
        removeFromWishlist,
      }}
    >
      {children}
    </CartContext.Provider>
  );
};

export const useCart = () => useContext(CartContext);
