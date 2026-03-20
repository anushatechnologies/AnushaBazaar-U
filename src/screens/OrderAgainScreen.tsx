import React, { useState, useEffect, useRef } from "react";
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  Image,
  ActivityIndicator,
  TextInput,
  TouchableOpacity,
  Animated,
  ToastAndroid,
  Platform,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useNavigation } from "@react-navigation/native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { getProducts, getTrendingProducts } from "../services/api/products";
import { getOrders, getRecentProducts } from "../services/api/orders";
import { useAuth } from "../context/AuthContext";
import FloatingCart from "../components/FloatingCart";

/* ─── Past order mock (replace with real order API when available) ─── */
const MOCK_PAST_ORDERS = [
  { id: "p1", name: "Amul Taaza Homogenised Toned Milk", unit: "1 L", price: 74, image: "https://m.media-amazon.com/images/I/61NlUoQz+DL._AC_UF1000,1000_QL80_.jpg" },
  { id: "p2", name: "Harvest Gold Brown Bread", unit: "400 g", price: 45, image: null },
  { id: "p3", name: "Farm Fresh Eggs (12 pc)", unit: "12 pcs", price: 90, image: null },
  { id: "p4", name: "Fresh Tomatoes", unit: "1 kg", price: 35, image: null },
  { id: "p5", name: "Head & Shoulders Anti Dandruff Shampoo", unit: "340 ml", price: 280, image: null },
];

/* ─── Shared Add Button ──────────────────────────────────── */
import { useCart } from "../context/CartContext";

const AddButton = ({ item }: { item: any }) => {
  const navigation = useNavigation<any>();
  const { cart, addToCart, increaseQty, decreaseQty } = useCart();
  const cartItem = cart.find((i) => i.id === item.id);

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
          <Text style={{ fontSize: 9, color: "#888", marginTop: 2 }}>Options</Text>
        )}
      </View>
    );
  }

  return (
    <View style={styles.qtyContainer}>
      <TouchableOpacity 
        style={styles.qtyBtnBox}
        onPress={() => decreaseQty(item.id)}
      >
        <Ionicons name="remove" size={16} color="#0A8754" />
      </TouchableOpacity>
      <Text style={styles.qtyText}>{cartItem.quantity}</Text>
      <TouchableOpacity 
        style={styles.qtyBtnBox}
        onPress={() => increaseQty(item.id)}
      >
        <Ionicons name="add" size={16} color="#0A8754" />
      </TouchableOpacity>
    </View>
  );
};

/* ─── Re-order horizontal card ──────────────────────────── */
const ReorderCard = ({ item }: { item: any }) => {
  const imageUrl = item.image || item.imageUrl || item.image_url || item.thumbnail || item.productImage || item.product_image || item.thumb;
  const price = item.price ?? item.sellingPrice ?? 0;

  return (
    <View style={styles.card}>
      <View style={styles.cardImgBox}>
        {imageUrl ? (
          <Image source={{ uri: imageUrl }} style={styles.cardImg} resizeMode="contain" />
        ) : (
          <Ionicons name="cart-outline" size={36} color="#E5E7EB" />
        )}
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
    </View>
  );
};

/* ─── Trending / bestseller vertical card ───────────────── */
const TrendCard = ({ item, badge }: { item: any; badge?: string }) => {
  const imageUrl = item.image || item.imageUrl || item.image_url || item.thumbnail || item.productImage || item.product_image || item.thumb;
  const price = item.price ?? item.sellingPrice ?? 0;
  const mrp = item.mrp ?? item.originalPrice ?? 0;
  const discount = mrp > price ? Math.round(((mrp - price) / mrp) * 100) : 0;

  return (
    <View style={styles.card}>
      <View style={styles.cardImgBox}>
        {imageUrl ? (
          <Image source={{ uri: imageUrl }} style={styles.cardImg} resizeMode="contain" />
        ) : (
          <Ionicons name="image-outline" size={36} color="#E5E7EB" />
        )}
        {badge && (
          <View style={[styles.badge, badge === "Trending" ? styles.badgeTrend : styles.badgeBest]}>
            <Text style={styles.badgeText}>{badge}</Text>
          </View>
        )}
        {discount > 0 && (
          <View style={[styles.discBadge, { top: badge ? 32 : 8, bottom: undefined }]}>
            <Text style={styles.discText}>{discount}% OFF</Text>
          </View>
        )}
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
    </View>
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
  const [search, setSearch] = useState("");
  const [pastItems, setPastItems] = useState<any[]>([]);
  const [filteredPast, setFiltered] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const insets = useSafeAreaInsets();
  const inputRef = useRef<TextInput>(null);
  const scaleAnim = useRef(new Animated.Value(1)).current;

  useEffect(() => { 
    loadRecommendations(); 
    if (jwtToken) {
      loadPastOrders();
    } else {
      setFiltered([]); // No login, no past orders
    }
  }, [jwtToken]);

  const loadPastOrders = async () => {
    if (!jwtToken) return;
    try {
      const recentProducts = await getRecentProducts(jwtToken);
      
      const mappedItems = recentProducts.map((p: any) => ({
        ...p,
        id: p.id,
        // If the API returns variants, use the first one or a default
        variantId: p.variants?.[0]?.id || p.variantId || p.id,
        name: p.name || p.productName || "Product",
        price: p.variants?.[0]?.price || p.price || 0,
        unit: p.variants?.[0]?.unitName || p.unit || "",
        image: p.imageUrl || p.image || "https://via.placeholder.com/150"
      }));

      setPastItems(mappedItems);
      setFiltered(mappedItems);
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

  const handleSearch = (text: string) => {
    setSearch(text);
    if (!text.trim()) {
      setFiltered(pastItems);
    } else {
      const lower = text.toLowerCase();
      setFiltered(pastItems.filter(p => (p.name || "").toLowerCase().includes(lower)));
    }
  };

  const handleMic = () => {
    Animated.sequence([
      Animated.timing(scaleAnim, { toValue: 0.8, duration: 100, useNativeDriver: true }),
      Animated.timing(scaleAnim, { toValue: 1, duration: 100, useNativeDriver: true }),
    ]).start();
    inputRef.current?.focus();
    if (Platform.OS === "android")
      ToastAndroid.show("Tap mic on your keyboard to speak", ToastAndroid.SHORT);
  };

  return (
    <View style={styles.root}>
      {/* ── Top bar ── */}
      <View style={[styles.topBar, { paddingTop: Math.max(insets.top, 16) }]}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
          <Ionicons name="arrow-back" size={24} color="#1A1A1A" />
        </TouchableOpacity>
        <View style={{ flex: 1 }}>
          <Text style={styles.screenTitle}>Order Again</Text>
          <Text style={styles.screenSub}>Re-order your favourites</Text>
        </View>
      </View>

      {/* ── Search + mic ── */}
      <View style={styles.searchRow}>
        <View style={styles.searchBox}>
          <Ionicons name="search" size={20} color="#9CA3AF" style={{ marginRight: 8 }} />
          <TextInput
            ref={inputRef}
            style={styles.searchInput}
            placeholder="Search past orders..."
            placeholderTextColor="#9CA3AF"
            value={search}
            onChangeText={handleSearch}
            returnKeyType="search"
          />
          {search.length > 0 && (
            <TouchableOpacity onPress={() => handleSearch("")}>
              <Ionicons name="close-circle" size={20} color="#D1D5DB" />
            </TouchableOpacity>
          )}
          <View style={styles.searchDivider} />
          <TouchableOpacity onPress={handleMic} style={styles.micBtn}>
            <Animated.View style={{ transform: [{ scale: scaleAnim }] }}>
              <Ionicons name="mic-outline" size={20} color="#0A8754" />
            </Animated.View>
          </TouchableOpacity>
        </View>
      </View>

      <FlatList
        data={[{ key: "content" }]}
        keyExtractor={item => item.key}
        renderItem={() => null}
        showsVerticalScrollIndicator={false}
        ListHeaderComponent={() => (
          <View style={{ paddingBottom: 120 }}>
            {/* ══ Past Orders ══ */}
            <SectionHead title="Past Orders" />
            {filteredPast.length === 0 ? (
              <View style={styles.emptyPast}>
                <Text style={styles.emptyPastText}>
                  {user ? "No past orders found" : "Log in to see your past orders"}
                </Text>
              </View>
            ) : (
              <FlatList
                data={filteredPast}
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
    gap: 16,
    paddingHorizontal: 16,
    paddingBottom: 16,
    backgroundColor: "#fff",
  },
  backBtn: {
    width: 40, height: 40,
    borderRadius: 20,
    backgroundColor: "#F3F4F6",
    justifyContent: "center",
    alignItems: "center",
  },
  screenTitle: { fontSize: 20, fontWeight: "700", color: "#111827" },
  screenSub: { fontSize: 13, color: "#6B7280", marginTop: 2 },

  /* Search */
  searchRow: {
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: "#fff",
    borderBottomWidth: 1,
    borderBottomColor: "#F3F4F6",
  },
  searchBox: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#fff",
    borderWidth: 1,
    borderColor: "#E5E7EB",
    borderRadius: 12,
    paddingHorizontal: 12,
    height: 48,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.03,
    shadowRadius: 4,
    elevation: 2,
  },
  searchInput: { flex: 1, fontSize: 15, color: "#111827" },
  searchDivider: {
    width: 1,
    height: 24,
    backgroundColor: "#E5E7EB",
    marginHorizontal: 12,
  },
  micBtn: {
    padding: 4,
  },

  /* Section heads */
  sectionHead: {
    paddingHorizontal: 16,
    paddingTop: 24,
    paddingBottom: 12,
  },
  sectionTitle: { fontSize: 18, fontWeight: "700", color: "#111827" },
  sectionLoader: { paddingVertical: 40, alignItems: "center" },
  noDataText: { paddingHorizontal: 16, color: "#9CA3AF", fontSize: 14, marginBottom: 12 },
  hPad: { paddingHorizontal: 16, paddingBottom: 16 },

  /* Past order empty */
  emptyPast: { paddingHorizontal: 16, paddingBottom: 16 },
  emptyPastText: { color: "#9CA3AF", fontSize: 14 },

  /* ── Add Button ── */
  addBtn: {
    borderWidth: 1,
    borderColor: "#0A8754",
    backgroundColor: "#F2FCEE",
    borderRadius: 6,
    paddingVertical: 6,
    paddingHorizontal: 16,
    alignItems: "center",
    justifyContent: "center",
  },
  addBtnText: {
    color: "#0A8754",
    fontSize: 12,
    fontWeight: "700",
  },
  qtyContainer: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#F2FCEE",
    borderWidth: 1,
    borderColor: "#0A8754",
    borderRadius: 6,
    paddingHorizontal: 6,
    paddingVertical: 4,
    gap: 8,
  },
  qtyBtnBox: {
    padding: 2,
  },
  qtyText: {
    fontSize: 13,
    fontWeight: "700",
    color: "#0A8754",
    minWidth: 16,
    textAlign: "center",
  },

  /* ── Shared Card Styles (150px width) ── */
  card: {
    width: 150,
    backgroundColor: "#fff",
    borderRadius: 12,
    marginRight: 16,
    borderWidth: 1,
    borderColor: "#E5E7EB",
    overflow: "hidden",
  },
  cardImgBox: {
    height: 110,
    backgroundColor: "#fff",
    justifyContent: "center",
    alignItems: "center",
    borderBottomWidth: 1,
    borderBottomColor: "#F3F4F6",
    position: "relative",
  },
  cardImg: { width: "80%", height: "80%" },
  
  badge: {
    position: "absolute",
    top: 8, left: 8,
    paddingHorizontal: 6,
    paddingVertical: 3,
    borderRadius: 4,
  },
  badgeTrend: { backgroundColor: "#FF6B00" },
  badgeBest: { backgroundColor: "#7B2FBE" },
  badgeText: { color: "#fff", fontSize: 9, fontWeight: "700", textTransform: "uppercase" },
  discBadge: {
    position: "absolute",
    bottom: -10, left: 8,
    backgroundColor: "#E8294A",
    paddingHorizontal: 6,
    paddingVertical: 3,
    borderRadius: 4,
  },
  discText: { color: "#fff", fontSize: 10, fontWeight: "700" },

  cardInfo: {
    padding: 12,
  },
  cardName: { fontSize: 13, fontWeight: "600", color: "#111827", lineHeight: 18, height: 36 },
  cardUnit: { fontSize: 11, color: "#6B7280", marginTop: 4 },
  cardBottomRow: {
    marginTop: 12,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  cardPrice: { fontSize: 14, fontWeight: "700", color: "#111827" },
  cardMrp: { fontSize: 11, color: "#9CA3AF", textDecorationLine: "line-through", marginTop: 2 },
});