import React, { useState, useEffect, useRef, useCallback } from "react";
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  Image,
  ActivityIndicator,
  TextInput,
  TouchableOpacity,
  Pressable,
  Animated,
  ToastAndroid,
  Platform,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useNavigation, useFocusEffect } from "@react-navigation/native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { getProducts, getTrendingProducts } from "../../services/api/products";
import { getOrders, getRecentProducts } from "../../services/api/orders";
import { useAuth } from "../../context/AuthContext";
import FloatingCart from "../../components/FloatingCart";
import SearchOverlay from "../../components/SearchOverlay";
import AnimatedSearchTrigger from "../../components/AnimatedSearchTrigger";
import { useTabBar } from "../../context/TabBarContext";
import { scale } from "../../utils/responsive";

/* ─── Shared Add Button ──────────────────────────────────── */
import { useCart } from "../../context/CartContext";

const AddButton = ({ item }: { item: any }) => {
  const navigation = useNavigation<any>();
  const { cart, addToCart, increaseQty, decreaseQty } = useCart();
  
  const cartLookupId = item?.productVariants?.[0]?.id
    ? String(item.productVariants[0].id)
    : String(item?.variantId || item?.id || "");

  const cartItem = cart.find(
    (i) => i.id === cartLookupId || String(i.variantId) === cartLookupId
  );

  if (!cartItem) {
    return (
      <View style={{ alignItems: "center" }}>
        <TouchableOpacity 
          style={styles.addBtn} 
          activeOpacity={0.8}
          onPress={() => {
            if (item.productVariants && item.productVariants.length > 1) {
              navigation.navigate("ProductDetail", { product: item });
            } else {
              addToCart(item);
            }
          }}
        >
          <Text style={styles.addBtnText}>ADD</Text>
        </TouchableOpacity>
        {item.productVariants && item.productVariants.length > 1 && (
          <Text style={{ fontSize: scale(9), color: "#888", marginTop: scale(2) }}>Options</Text>
        )}
      </View>
    );
  }

  return (
    <View style={styles.qtyContainer}>
      <TouchableOpacity 
        style={styles.qtyBtnBox}
        onPress={() => decreaseQty(cartItem.id)}
      >
        <Ionicons name="remove" size={scale(16)} color="#0A8754" />
      </TouchableOpacity>
      <Text style={styles.qtyText}>{cartItem.quantity}</Text>
      <TouchableOpacity 
        style={styles.qtyBtnBox}
        onPress={() => increaseQty(cartItem.id)}
      >
        <Ionicons name="add" size={scale(16)} color="#0A8754" />
      </TouchableOpacity>
    </View>
  );
};

/* ─── Re-order horizontal card ──────────────────────────── */
const ReorderCard = ({ item }: { item: any }) => {
  const navigation = useNavigation<any>();
  const { wishlist, addToWishlist, removeFromWishlist } = useCart();
  const imageUrl = item.image || item.imageUrl || item.image_url || item.thumbnail || item.productImage || item.product_image || item.thumb;
  const price = item.sellingPrice ?? item.price ?? 0;
  const mrp = item.mrp ?? item.originalPrice ?? price;
  const wishItem = wishlist?.find((w: any) => String(w.id) === String(item?.id));

  const toggleWishlist = () => {
    if (wishItem) {
      removeFromWishlist(String(item.id));
    } else {
      addToWishlist(item);
    }
  };

  return (
    <TouchableOpacity
      activeOpacity={0.95}
      style={styles.card}
      onPress={() => navigation.navigate("ProductDetail", { product: item })}
    >
      <View style={styles.cardImgBox}>
        {imageUrl ? (
          <Image source={{ uri: imageUrl }} style={styles.cardImg} resizeMode="contain" />
        ) : (
          <Ionicons name="cart-outline" size={scale(36)} color="#E5E7EB" />
        )}
        <Pressable style={styles.wishlistIcon} onPress={toggleWishlist}>
          <Ionicons
            name={wishItem ? "heart" : "heart-outline"}
            size={scale(14)}
            color={wishItem ? "#E82A4B" : "#A0A0A0"}
          />
        </Pressable>
      </View>
      <View style={styles.cardInfo}>
        <Text style={styles.cardName} numberOfLines={2}>{item.name || "Product"}</Text>
        {item.unit && <Text style={styles.cardUnit}>{item.unit}</Text>}
        <View style={styles.cardBottomRow}>
          <View>
            <Text style={styles.cardPrice}>₹{price}</Text>
            {item.mrp > price && <Text style={styles.cardMrp}>₹{item.mrp}</Text>}
          </View>
          <AddButton item={item} />
        </View>
      </View>
    </TouchableOpacity>
  );
};

/* ─── Trending / bestseller vertical card ───────────────── */
const TrendCard = ({ item, badge }: { item: any; badge?: string }) => {
  const navigation = useNavigation<any>();
  const { wishlist, addToWishlist, removeFromWishlist } = useCart();
  const imageUrl = item.image || item.imageUrl || item.image_url || item.thumbnail || item.productImage || item.product_image || item.thumb;
  const price = item.sellingPrice ?? item.price ?? 0;
  const mrp = item.mrp ?? item.originalPrice ?? price;
  const discount = mrp > price ? Math.round(((mrp - price) / mrp) * 100) : 0;
  const wishItem = wishlist?.find((w: any) => String(w.id) === String(item?.id));

  const toggleWishlist = () => {
    if (wishItem) {
      removeFromWishlist(String(item.id));
    } else {
      addToWishlist(item);
    }
  };

  return (
    <TouchableOpacity
      activeOpacity={0.95}
      style={styles.card}
      onPress={() => navigation.navigate("ProductDetail", { product: item })}
    >
      <View style={styles.cardImgBox}>
        {imageUrl ? (
          <Image source={{ uri: imageUrl }} style={styles.cardImg} resizeMode="contain" />
        ) : (
          <Ionicons name="image-outline" size={scale(36)} color="#E5E7EB" />
        )}
        {badge && (
          <View style={[styles.badge, badge === "Trending" ? styles.badgeTrend : styles.badgeBest]}>
            <Text style={styles.badgeText}>{badge}</Text>
          </View>
        )}
        {discount > 0 && (
          <View style={[styles.discBadge, { top: badge ? scale(32) : scale(8), bottom: undefined }]}>
            <Text style={styles.discText}>{discount}% OFF</Text>
          </View>
        )}
        <Pressable style={styles.wishlistIcon} onPress={toggleWishlist}>
          <Ionicons
            name={wishItem ? "heart" : "heart-outline"}
            size={scale(14)}
            color={wishItem ? "#E82A4B" : "#A0A0A0"}
          />
        </Pressable>
      </View>
      <View style={styles.cardInfo}>
        <Text style={styles.cardName} numberOfLines={2}>{item.name || item.title || "Product"}</Text>
        {(item.unit || item.quantity) && (
          <Text style={styles.cardUnit}>{item.unit || item.quantity}</Text>
        )}
        <View style={styles.cardBottomRow}>
          <View>
             <Text style={styles.cardPrice}>₹{price}</Text>
             {mrp > price && <Text style={styles.cardMrp}>₹{mrp}</Text>}
          </View>
          <AddButton item={item} />
        </View>
      </View>
    </TouchableOpacity>
  );
};

/* ─── Section header ─────────────────────────────────────── */
const SectionHead = ({ title }: { title: string }) => (
  <View style={styles.sectionHead}>
    <Text style={styles.sectionTitle}>{title}</Text>
  </View>
);

/* ─── Main screen ────────────────────────────────────────── */
const OrderAgainScreen = () => {
  const navigation = useNavigation<any>();
  const { jwtToken, user } = useAuth();
  const [trending, setTrending] = useState<any[]>([]);
  const [bestsellers, setBest] = useState<any[]>([]);
  const [pastItems, setPastItems] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showSearch, setShowSearch] = useState(false);
  const [showSearchVoice, setShowSearchVoice] = useState(false);
  const insets = useSafeAreaInsets();
  const lastScrollY = useRef(0);
  const { onScrollUp, onScrollDown } = useTabBar();

  // Reset tab bar to visible every time this screen gains focus
  useFocusEffect(
    useCallback(() => {
      lastScrollY.current = 0;
      onScrollDown();
    }, [onScrollDown])
  );

  const handleScroll = (e: any) => {
    const currentY = e.nativeEvent.contentOffset.y;
    if (currentY > 10 && currentY > lastScrollY.current + 5) onScrollUp();
    else if (currentY < lastScrollY.current - 5 || currentY <= 0) onScrollDown();
    lastScrollY.current = currentY;
  };

  useEffect(() => { 
    loadRecommendations(); 
    if (jwtToken) {
      loadPastOrders();
    }
  }, [jwtToken]);

  const loadPastOrders = async () => {
    if (!jwtToken) return;
    try {
      const recentProducts = await getRecentProducts(jwtToken);
      
      const mappedItems = recentProducts.map((p: any) => {
        // Normalize variants so addToCart and ProductDetail work correctly
        const rawVariants = p.variants || p.productVariants || [];
        const normalizedVariants = rawVariants.map((v: any) => {
          const vMrp = v.mrp ?? v.price ?? 0;
          const hasDiscount = v.discountPrice != null && v.discountPrice > 0;
          const vSelling = v.sellingPrice ?? (hasDiscount ? v.discountPrice : vMrp);
          return {
            ...v,
            variantName: v.name || v.variantName,
            sellingPrice: vSelling,
            mrp: vMrp,
          };
        });
        const firstVariant = normalizedVariants[0];

        return {
          ...p,
          id: String(p.id),
          variantId: firstVariant?.id || p.variantId || p.id,
          name: p.name || p.productName || "Product",
          price: firstVariant?.sellingPrice || p.sellingPrice || p.price || 0,
          sellingPrice: firstVariant?.sellingPrice || p.sellingPrice || undefined,
          mrp: firstVariant?.mrp || p.mrp || undefined,
          unit: firstVariant?.variantName || p.unit || "",
          image: p.imageUrl || p.image || "",
          imageUrl: p.imageUrl || p.image || "",
          productVariants: normalizedVariants,
        };
      });

      setPastItems(mappedItems);
    } catch (e) {
      console.error("Error loading past orders:", e);
    }
  };

  const loadRecommendations = async () => {
    setLoading(true);
    try {
      const [trendData, allData] = await Promise.all([
        getTrendingProducts(),
        getProducts(),
      ]);

      setTrending(trendData.slice(0, 6));
      setBest(allData.slice(0, 6));
    } catch (e) {
      console.error("Error loading recommendations:", e);
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={styles.root}>
      {/* ── Top bar ── */}
      <View style={[styles.topBar, { paddingTop: Math.max(insets.top, scale(16)) }]}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
          <Ionicons name="arrow-back" size={scale(24)} color="#1A1A1A" />
        </TouchableOpacity>
        <View style={{ flex: 1 }}>
          <Text style={styles.screenTitle}>Order Again</Text>
          <Text style={styles.screenSub}>Re-order your favourites</Text>
        </View>
      </View>

      {/* ── Search + mic ── */}
      <View style={{ backgroundColor: "#fff", borderBottomWidth: 1, borderBottomColor: "#F3F4F6", paddingBottom: scale(4) }}>
        <AnimatedSearchTrigger 
          onPress={() => { setShowSearch(true); setShowSearchVoice(false); }} 
          onMicPress={() => { setShowSearch(true); setShowSearchVoice(true); }}
        />
      </View>

      <FlatList
        data={[{ key: "content" }]}
        keyExtractor={item => item.key}
        renderItem={() => null}
        showsVerticalScrollIndicator={false}
        onScroll={handleScroll}
        scrollEventThrottle={16}
        ListHeaderComponent={() => (
          <View style={{ paddingBottom: scale(120) }}>
            {/* ══ Past Orders ══ */}
            <SectionHead title="Past Orders" />
            {pastItems.length === 0 ? (
              <View style={styles.emptyPast}>
                <Text style={styles.emptyPastText}>
                  {user ? "No past orders found" : "Log in to see your past orders"}
                </Text>
              </View>
            ) : (
              <FlatList
                data={pastItems}
                keyExtractor={(item, index) => item.id?.toString() || index.toString()}
                renderItem={({ item }) => <ReorderCard item={item} />}
                horizontal
                showsHorizontalScrollIndicator={false}
                contentContainerStyle={styles.hPad}
              />
            )}

            {/* ══ Trending ══ */}
            {loading ? (
              <View style={styles.sectionLoader}>
                <ActivityIndicator size="small" color="#0A8754" />
              </View>
            ) : (
              <>
                <SectionHead title="Trending Now" />
                {trending.length === 0 ? (
                  <Text style={styles.noDataText}>No trending products right now</Text>
                ) : (
                  <FlatList
                    data={trending}
                    keyExtractor={(item, i) => item.id?.toString() || String(i)}
                    renderItem={({ item }) => <TrendCard item={item} badge="Trending" />}
                    horizontal
                    showsHorizontalScrollIndicator={false}
                    contentContainerStyle={styles.hPad}
                  />
                )}

                {/* ══ Bestsellers ══ */}
                <SectionHead title="Bestsellers" />
                {bestsellers.length === 0 ? (
                  <Text style={styles.noDataText}>No data available</Text>
                ) : (
                  <FlatList
                    data={bestsellers}
                    keyExtractor={(item, i) => item.id?.toString() || "b" + String(i)}
                    renderItem={({ item }) => <TrendCard item={item} badge="Bestseller" />}
                    horizontal
                    showsHorizontalScrollIndicator={false}
                    contentContainerStyle={styles.hPad}
                  />
                )}
              </>
            )}
          </View>
        )}
      />
      <FloatingCart currentRoute="Order Again" />
      
      <SearchOverlay 
        isVisible={showSearch} 
        onClose={() => { setShowSearch(false); setShowSearchVoice(false); }} 
        initialVoiceMode={showSearchVoice}
      />
    </View>
  );
};

export default OrderAgainScreen;

/* ─── Styles ─────────────────────────────────────────────── */
const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: "#F9FAFB" },

  /* Top bar */
  topBar: {
    flexDirection: "row",
    alignItems: "center",
    gap: scale(16),
    paddingHorizontal: scale(16),
    paddingBottom: scale(16),
    backgroundColor: "#fff",
  },
  backBtn: {
    width: scale(40), height: scale(40),
    borderRadius: scale(20),
    backgroundColor: "#F3F4F6",
    justifyContent: "center",
    alignItems: "center",
  },
  screenTitle: { fontSize: scale(20), fontWeight: "700", color: "#111827" },
  screenSub: { fontSize: scale(13), color: "#6B7280", marginTop: scale(2) },

  /* ─── Shared Card Styles ─── */

  /* Section heads */
  sectionHead: {
    paddingHorizontal: scale(16),
    paddingTop: scale(24),
    paddingBottom: scale(12),
  },
  sectionTitle: { fontSize: scale(18), fontWeight: "700", color: "#111827" },
  sectionLoader: { paddingVertical: scale(40), alignItems: "center" },
  noDataText: { paddingHorizontal: scale(16), color: "#9CA3AF", fontSize: scale(14), marginBottom: scale(12) },
  hPad: { paddingHorizontal: scale(16), paddingBottom: scale(16), gap: scale(12) },

  /* Past order empty */
  emptyPast: { paddingHorizontal: scale(16), paddingBottom: scale(16) },
  emptyPastText: { color: "#9CA3AF", fontSize: scale(14) },

  /* ── Add Button ── */
  addBtn: {
    borderWidth: 1,
    borderColor: "#0A8754",
    backgroundColor: "#F2FCEE",
    borderRadius: scale(6),
    paddingVertical: scale(6),
    paddingHorizontal: scale(16),
    alignItems: "center",
    justifyContent: "center",
  },
  addBtnText: {
    color: "#0A8754",
    fontSize: scale(12),
    fontWeight: "700",
  },
  qtyContainer: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#F2FCEE",
    borderWidth: 1,
    borderColor: "#0A8754",
    borderRadius: scale(6),
    paddingHorizontal: scale(6),
    paddingVertical: scale(4),
    gap: scale(8),
  },
  qtyBtnBox: {
    padding: scale(2),
  },
  qtyText: {
    fontSize: scale(13),
    fontWeight: "700",
    color: "#0A8754",
    minWidth: scale(16),
    textAlign: "center",
  },

  /* ── Shared Card Styles (150px width) ── */
  card: {
    width: scale(150),
    backgroundColor: "#fff",
    borderRadius: scale(12),
    marginRight: scale(16),
    borderWidth: 1,
    borderColor: "#E5E7EB",
    overflow: "hidden",
  },
  cardImgBox: {
    height: scale(120), // Increased height
    backgroundColor: "#fff",
    justifyContent: "center",
    alignItems: "center",
    borderBottomWidth: 1,
    borderBottomColor: "#F3F4F6",
    position: "relative",
    padding: scale(4),
  },
  cardImg: { width: "100%", height: "100%" },
  
  badge: {
    position: "absolute",
    top: scale(8), left: scale(8),
    paddingHorizontal: scale(6),
    paddingVertical: scale(3),
    borderRadius: scale(4),
  },
  badgeTrend: { backgroundColor: "#FF6B00" },
  badgeBest: { backgroundColor: "#7B2FBE" },
  badgeText: { color: "#fff", fontSize: scale(9), fontWeight: "700", textTransform: "uppercase" },
  discBadge: {
    position: "absolute",
    bottom: scale(-10), left: scale(8),
    backgroundColor: "#E8294A",
    paddingHorizontal: scale(6),
    paddingVertical: scale(3),
    borderRadius: scale(4),
  },
  discText: { color: "#fff", fontSize: scale(10), fontWeight: "700" },

  cardInfo: {
    padding: scale(12),
  },
  cardName: { fontSize: scale(13), fontWeight: "600", color: "#111827", lineHeight: scale(18), height: scale(36) },
  cardUnit: { fontSize: scale(11), color: "#6B7280", marginTop: scale(4) },
  cardBottomRow: {
    marginTop: scale(12),
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  cardPrice: { fontSize: scale(14), fontWeight: "700", color: "#111827" },
  cardMrp: { fontSize: scale(11), color: "#9CA3AF", textDecorationLine: "line-through", marginTop: scale(2) },

  /* Wishlist heart icon */
  wishlistIcon: {
    position: "absolute",
    top: scale(6),
    right: scale(6),
    width: scale(28),
    height: scale(28),
    borderRadius: scale(14),
    backgroundColor: "#fff",
    justifyContent: "center",
    alignItems: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: scale(1) },
    shadowOpacity: 0.1,
    shadowRadius: scale(2),
    elevation: 3,
    zIndex: 10,
  },
});
