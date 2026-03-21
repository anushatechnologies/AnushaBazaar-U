import React, {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
} from "react";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useWallet } from "./WalletContext";
import { useAuth } from "./AuthContext";
import * as CartAPI from "../services/api/cart";
import { addToWishlistApi, getWishlistApi } from "../services/api/products";

export type Product = {
  id: string;
  name: string;
  price: number;
  image?: any;
  imageUrl?: string;
  icon?: string;
  unit?: string;
  variantId?: string | number;
  variantName?: string;
};

export type CartItem = Product & {
  quantity: number;
  cartItemId?: number | string; // server-side cart item ID
  productId?: number | string;  // parent product ID
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

  applyCoupon: (code: string) => { success: boolean; message: string };
  removeCoupon: () => void;

  addToWishlist: (product: Product) => void;
  removeFromWishlist: (id: string) => void;
};

const CartContext = createContext<CartContextType>(
  {} as CartContextType
);

export const CartProvider = ({ children }: any) => {
  const [cart, setCart] = useState<CartItem[]>([]);
  const [wishlist, setWishlist] = useState<Product[]>([]);
  const [appliedCoupon, setAppliedCoupon] = useState<string | null>(null);
  const [discount, setDiscount] = useState<number>(0);
  const [usePoints, setUsePoints] = useState(false);
  
  const { points } = useWallet();
  const { user, jwtToken } = useAuth();

  /* ================= LOAD STORAGE ================= */

  useEffect(() => {
    loadData();
  }, []);

  // Sync cart and wishlist from server when user logs in
  useEffect(() => {
    if (jwtToken && user?.customerId) {
      refreshCart();
      refreshWishlist();
    }
  }, [jwtToken, user?.customerId]);

  const loadData = async () => {
    try {
      const cartData = await AsyncStorage.getItem("CART");
      const wishlistData = await AsyncStorage.getItem("WISHLIST");
      const couponCode = await AsyncStorage.getItem("APPLIED_COUPON");
      const savedUsePoints = await AsyncStorage.getItem("USE_POINTS");

      if (cartData) setCart(JSON.parse(cartData));
      if (wishlistData) setWishlist(JSON.parse(wishlistData));
      if (couponCode) setAppliedCoupon(couponCode);
      if (savedUsePoints) setUsePoints(JSON.parse(savedUsePoints));
    } catch (error) {
      console.log("Storage Load Error:", error);
    }
  };

  /** Fetch cart from server and sync local state */
  const refreshCart = useCallback(async () => {
    if (!jwtToken) return;
    try {
      const serverCart = await CartAPI.getCart(jwtToken);
      console.log("[CartSync] Raw Server Cart:", JSON.stringify(serverCart, null, 2));
      if (serverCart && serverCart.items) {
        const mapped: CartItem[] = serverCart.items.map((item: any) => ({
          // We use variantId as the local unique key for UI consistency,
          // as each variant is a unique line item in the basket.
          id: String(item.variantId || item.productId),
          name: item.productName || "Product",
          variantName: item.variantName,
          price: item.unitPrice || item.price || 0,
          image: item.productImage || null,
          imageUrl: item.productImage || undefined,
          quantity: item.quantity || 1,
          variantId: item.variantId,
          productId: item.productId, // Preserve productId for order consistency
          cartItemId: item.id, // This is the ID used for PUT/DELETE
        }));
        setCart(mapped);
      }
    } catch (error) {
      console.log("Cart refresh error:", error);
    }
  }, [jwtToken]);

  const refreshWishlist = useCallback(async () => {
    if (!jwtToken || !user?.customerId) return;
    try {
      const serverWishlist = await getWishlistApi(user.customerId);
      if (serverWishlist) {
        setWishlist(serverWishlist);
      }
    } catch (error) {
      console.log("Wishlist refresh error:", error);
    }
  }, [jwtToken, user?.customerId]);

  /* ================= SAVE STORAGE ================= */

  useEffect(() => {
    const saveData = async () => {
      try {
        await AsyncStorage.setItem("CART", JSON.stringify(cart));
        await AsyncStorage.setItem("USE_POINTS", JSON.stringify(usePoints));
        if (appliedCoupon) {
          await AsyncStorage.setItem("APPLIED_COUPON", appliedCoupon);
        } else {
          await AsyncStorage.removeItem("APPLIED_COUPON");
        }
      } catch (error) {
        console.log("Save Error:", error);
      }
    };
    saveData();
  }, [cart, appliedCoupon, usePoints]);

  useEffect(() => {
    const saveWishlist = async () => {
      try {
        await AsyncStorage.setItem(
          "WISHLIST",
          JSON.stringify(wishlist)
        );
      } catch (error) {
        console.log("Wishlist Save Error:", error);
      }
    };
    saveWishlist();
  }, [wishlist]);

  /* ================= COUPON LOGIC ================= */

  const calculateDiscount = (code: string, currentTotal: number) => {
    switch (code.toUpperCase()) {
      case "WELCOME100":
        return currentTotal >= 500 ? 100 : 0;
      case "SAVE20":
        return currentTotal >= 1000 ? Math.min(currentTotal * 0.2, 200) : 0;
      case "FREESHIP":
        return 0; // Handled separately if there were shipping charges
      default:
        return 0;
    }
  };

  useEffect(() => {
    const rawTotal = cart.reduce((sum, item) => sum + item.price * item.quantity, 0);
    if (appliedCoupon) {
      const d = calculateDiscount(appliedCoupon, rawTotal);
      if (d === 0 && rawTotal > 0) {
        // Condition not met anymore
        setAppliedCoupon(null);
        setDiscount(0);
      } else {
        setDiscount(d);
      }
    } else {
      setDiscount(0);
    }
  }, [cart, appliedCoupon]);

  const applyCoupon = (code: string) => {
    const rawTotal = cart.reduce((sum, item) => sum + item.price * item.quantity, 0);
    const d = calculateDiscount(code, rawTotal);

    if (d > 0 || code.toUpperCase() === "FREESHIP") {
      setAppliedCoupon(code.toUpperCase());
      setDiscount(d);
      return { success: true, message: "Coupon applied successfully! 🎉" };
    }

    if (code.toUpperCase() === "WELCOME100" && rawTotal < 500) {
      return { success: false, message: "Add items worth ₹500 or more to use this coupon." };
    }
    if (code.toUpperCase() === "SAVE20" && rawTotal < 1000) {
      return { success: false, message: "Add items worth ₹1000 or more to use this coupon." };
    }

    return { success: false, message: "Invalid or expired coupon code." };
  };

  const removeCoupon = () => {
    setAppliedCoupon(null);
    setDiscount(0);
  };

  /* ================= POINTS LOGIC ================= */

  const rawTotal = cart.reduce((sum, item) => sum + item.price * item.quantity, 0);
  const totalAfterCoupon = rawTotal - discount;
  const pointsDiscount = usePoints ? Math.min(points, totalAfterCoupon) : 0;

  const total = totalAfterCoupon - pointsDiscount;

  /* ================= CART LOGIC ================= */
  
  const addToCart = async (product: Product & { productVariants?: any[] }, selectedVariant?: any) => {
    // Resolve which variant to use
    const variant = selectedVariant
      || (product.productVariants && product.productVariants.length > 0 ? product.productVariants[0] : null);

    // variantId is required by the API — fall back to product.id for products without variants
    const vId = variant?.id ?? product.variantId ?? product.id;
    const vName = variant?.variantName ?? variant?.name ?? product.variantName ?? "";
    const vPrice = variant?.sellingPrice ?? variant?.price ?? product.price ?? 0;
    const pId = Number(product.id || (product as any).productId);

    if (!vId) {
      console.warn("[Cart] Cannot add to cart: No id found for product", product.name);
      return;
    }

    const cartKey = String(vId);

    // 1. Optimistic local update
    setCart((prev) => {
      const exists = prev.find((i) => String(i.variantId || i.id) === cartKey);
      if (exists) return prev;
      return [
        ...prev,
        {
          ...product,
          id: cartKey,
          variantId: Number(vId),
          name: product.name,
          variantName: vName,
          price: vPrice,
          quantity: 1,
          cartItemId: undefined,
          productId: pId,
        } as CartItem,
      ];
    });

    // 2. Sync to server — API only needs { variantId, quantity }
    if (jwtToken) {
      try {
        const addedItem = await CartAPI.addCartItem(jwtToken, Number(vId), 1, pId);
        if (addedItem?.id) {
          setCart((prev) =>
            prev.map((item) =>
              String(item.variantId || item.id) === cartKey
                ? { ...item, cartItemId: addedItem.id }
                : item
            )
          );
        }
      } catch (err: any) {
        const errMsg = err?.message || "";
        if (errMsg.includes("Duplicate") || errMsg.includes("duplicate") || errMsg.includes("constraint")) {
          console.log("[Cart] Item already on server, syncing...");
          await refreshCart();
        } else {
          console.log("Server add cart error:", err);
        }
      }
    }
  };

  const removeFromCart = (vId: string) => {
    const item = cart.find((i) => i.id === vId);
    setCart((prev) => prev.filter((item) => item.id !== vId));

    // Sync to server
    if (jwtToken && item?.cartItemId) {
      CartAPI.removeCartItem(jwtToken, item.cartItemId).catch((err) =>
        console.log("Server remove cart error:", err)
      );
    }
  };

  const increaseQty = (id: string) => {
    const item = cart.find((i) => i.id === id);
    if (!item) return;

    const newQty = item.quantity + 1;

    // 1. Optimistic Update
    setCart((prev) =>
      prev.map((i) => (i.id === id ? { ...i, quantity: newQty } : i))
    );

    // 2. Server Sync
    if (jwtToken && item.cartItemId) {
      CartAPI.updateCartItemQty(jwtToken, item.cartItemId, newQty).catch((err) =>
        console.log("Server update qty error:", err)
      );
    }
  };

  const decreaseQty = (id: string) => {
    const item = cart.find((i) => i.id === id);
    if (!item) return;

    if (item.quantity <= 1) {
      // Remove item
      setCart((prev) => prev.filter((i) => i.id !== id));
      if (jwtToken && item.cartItemId) {
        CartAPI.removeCartItem(jwtToken, item.cartItemId).catch((err) =>
          console.log("Server remove cart error:", err)
        );
      }
    } else {
      const newQty = item.quantity - 1;
      // 1. Optimistic Update
      setCart((prev) =>
        prev.map((i) => (i.id === id ? { ...i, quantity: newQty } : i))
      );
      // 2. Server Sync
      if (jwtToken && item.cartItemId) {
        CartAPI.updateCartItemQty(jwtToken, item.cartItemId, newQty).catch((err) =>
          console.log("Server update qty error:", err)
        );
      }
    }
  };

  const clearCart = () => {
    setCart([]);
    setUsePoints(false);
    setAppliedCoupon(null);

    // Sync to server
    if (jwtToken) {
      CartAPI.clearServerCart(jwtToken).catch((err) =>
        console.log("Server clear cart error:", err)
      );
    }
  };

  /* ================= WISHLIST ================= */

  const addToWishlist = async (product: Product) => {
    setWishlist((prev) => {
      const exists = prev.find((i) => i.id === product.id);
      if (exists) return prev;
      return [...prev, product];
    });

    if (jwtToken && user?.customerId) {
      try {
        await addToWishlistApi(user.customerId, product.id);
      } catch (err) {
        console.log("Server add wishlist error:", err);
      }
    }
  };

  const removeFromWishlist = (id: string) => {
    setWishlist((prev) =>
      prev.filter((item) => item.id !== id)
    );
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