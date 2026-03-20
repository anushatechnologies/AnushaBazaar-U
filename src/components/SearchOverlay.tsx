import React, { useState, useEffect, useRef, useCallback } from "react";
import {
  View,
  Text,
  TextInput,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  FlatList,
  Image,
  Animated,
  Keyboard,
  BackHandler,
  Platform,
  ToastAndroid,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useNavigation } from "@react-navigation/native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { searchProducts } from "../services/api/products";
import { useCart } from "../context/CartContext";

const RECENT_KEY = "anusha_recent_searches";
const MAX_RECENT = 8;

const TRENDING_TERMS = [
  "milk", "eggs", "bread", "atta", "dal", "rice", "chicken",
  "vegetables", "curd", "butter",
];

interface SearchOverlayProps {
  isVisible: boolean;
  onClose: () => void;
}

const SearchOverlay = ({ isVisible, onClose }: SearchOverlayProps) => {
  const navigation = useNavigation<any>();
  const inputRef = useRef<TextInput>(null);
  const fadeAnim = useRef(new Animated.Value(0)).current;

  const [searchText, setSearchText] = useState("");
  const [recentSearches, setRecentSearches] = useState<string[]>([]);
  const [suggestions, setSuggestions] = useState<any[]>([]);
  const [loadingSuggestions, setLoadingSuggestions] = useState(false);
  const debounceTimer = useRef<NodeJS.Timeout | null>(null);
  const insets = useSafeAreaInsets();

  const { cart, addToCart, increaseQty, decreaseQty } = useCart();

  // Animate in/out
  useEffect(() => {
    Animated.timing(fadeAnim, {
      toValue: isVisible ? 1 : 0,
      duration: 200,
      useNativeDriver: true,
    }).start();

    if (isVisible) {
      loadRecent();
      setTimeout(() => inputRef.current?.focus(), 150);
    } else {
      setSearchText("");
      setSuggestions([]);
    }
  }, [isVisible]);

  // Android back button
  useEffect(() => {
    if (!isVisible) return;
    const sub = BackHandler.addEventListener("hardwareBackPress", () => {
      onClose();
      return true;
    });
    return () => sub.remove();
  }, [isVisible]);

  const loadRecent = async () => {
    try {
      const raw = await AsyncStorage.getItem(RECENT_KEY);
      setRecentSearches(raw ? JSON.parse(raw) : []);
    } catch {}
  };

  const saveRecent = async (term: string) => {
    const trimmed = term.trim();
    if (!trimmed) return;
    const updated = [trimmed, ...recentSearches.filter(r => r !== trimmed)].slice(0, MAX_RECENT);
    setRecentSearches(updated);
    try {
      await AsyncStorage.setItem(RECENT_KEY, JSON.stringify(updated));
    } catch {}
  };

  const clearAllRecent = async () => {
    setRecentSearches([]);
    try {
      await AsyncStorage.removeItem(RECENT_KEY);
    } catch {}
  };

  const removeOneRecent = async (term: string) => {
    const updated = recentSearches.filter(r => r !== term);
    setRecentSearches(updated);
    try {
      await AsyncStorage.setItem(RECENT_KEY, JSON.stringify(updated));
    } catch {}
  };

  const handleTextChange = (text: string) => {
    setSearchText(text);
    if (!text.trim()) {
      setSuggestions([]);
      setLoadingSuggestions(false);
      return;
    }
    setLoadingSuggestions(true);
    if (debounceTimer.current) clearTimeout(debounceTimer.current);
    debounceTimer.current = setTimeout(async () => {
      try {
        const results = await searchProducts(text);
        setSuggestions(results.slice(0, 6));
      } catch {
        setSuggestions([]);
      } finally {
        setLoadingSuggestions(false);
      }
    }, 350);
  };

  const submitSearch = (term: string) => {
    const q = term.trim();
    if (!q) return;
    saveRecent(q);
    Keyboard.dismiss();
    onClose();
    navigation.navigate("SearchResults", { query: q });
  };

  const goToProduct = (item: any) => {
    saveRecent(item.name);
    onClose();
    navigation.navigate("ProductDetail", { product: item });
  };

  if (!isVisible) return null;

  return (
    <Animated.View style={[styles.root, { opacity: fadeAnim }]}>
      {/* ── Top search bar ── */}
      <View style={[styles.topBar, { paddingTop: insets.top + 8 }]}>
        <TouchableOpacity onPress={onClose} style={styles.backBtn} activeOpacity={0.7}>
          <Ionicons name="arrow-back" size={24} color="#111" />
        </TouchableOpacity>

        <View style={styles.inputBox}>
          <Ionicons name="search" size={17} color="#9CA3AF" />
          <TextInput
            ref={inputRef}
            style={styles.input}
            placeholder="Search for atta, dal, coke and more"
            placeholderTextColor="#9CA3AF"
            value={searchText}
            onChangeText={handleTextChange}
            returnKeyType="search"
            onSubmitEditing={() => submitSearch(searchText)}
          />
          {searchText.length > 0 ? (
            <TouchableOpacity onPress={() => { setSearchText(""); setSuggestions([]); inputRef.current?.focus(); }}>
              <Ionicons name="close-circle" size={18} color="#D1D5DB" />
            </TouchableOpacity>
          ) : (
            <Ionicons name="mic-outline" size={18} color="#9CA3AF" />
          )}
        </View>
      </View>

      {/* ── Body ── */}
      <ScrollView
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.body}
      >
        {/* ── Live suggestions (while typing) ── */}
        {searchText.length > 0 && (
          <View>
            {loadingSuggestions ? (
              <View style={styles.suggRow}>
                <Ionicons name="search" size={15} color="#D1D5DB" />
                <Text style={styles.suggText}>Searching...</Text>
              </View>
            ) : suggestions.length > 0 ? (
              <>
                {/* Text-based "search for X" row first */}
                <TouchableOpacity style={styles.suggRow} onPress={() => submitSearch(searchText)} activeOpacity={0.6}>
                  <View style={styles.suggIcon}><Ionicons name="search" size={15} color="#6B7280" /></View>
                  <Text style={styles.suggText}>Search for "<Text style={{ fontWeight: "700", color: "#111" }}>{searchText}</Text>"</Text>
                </TouchableOpacity>

                {suggestions.map((item) => {
                  const img = item.imageUrl ? { uri: item.imageUrl }
                    : typeof item.image === "string" ? { uri: item.image } : item.image;

                  const cartLookupId = item?.productVariants?.[0]?.id ? String(item.productVariants[0].id) : String(item?.id || "");
                  const cartItem = cart?.find((i: any) => i.id === cartLookupId || String(i.variantId) === cartLookupId);

                  return (
                    <TouchableOpacity key={item.id} style={styles.productRow} onPress={() => goToProduct(item)} activeOpacity={0.7}>
                      <View style={styles.productImgBox}>
                        {img ? (
                          <Image source={img} style={styles.productImg} />
                        ) : (
                          <Ionicons name="cube-outline" size={18} color="#D1D5DB" />
                        )}
                      </View>
                      <View style={styles.productInfo}>
                        <Text style={styles.productName} numberOfLines={1}>{item.name}</Text>
                        <Text style={styles.productUnit}>{item.unit || ""}</Text>
                      </View>
                      <View style={styles.productRight}>
                        <Text style={styles.productPrice}>₹{item.price ?? item.sellingPrice}</Text>
                        {!cartItem ? (
                          <TouchableOpacity
                            style={styles.addBtn}
                            onPress={() => {
                              addToCart(item);
                              if (Platform.OS === "android") {
                                ToastAndroid.show(`${item?.name?.substring(0, 15)} added ✅`, ToastAndroid.SHORT);
                              }
                            }}
                          >
                            <Text style={styles.addText}>ADD</Text>
                          </TouchableOpacity>
                        ) : (
                          <View style={styles.qtyBox}>
                            <TouchableOpacity style={styles.qtyBtn} onPress={() => decreaseQty(cartItem.id)}>
                              <Text style={styles.qtyBtnText}>-</Text>
                            </TouchableOpacity>
                            <Text style={styles.qtyValue}>{cartItem.quantity}</Text>
                            <TouchableOpacity style={styles.qtyBtn} onPress={() => increaseQty(cartItem.id)}>
                              <Text style={styles.qtyBtnText}>+</Text>
                            </TouchableOpacity>
                          </View>
                        )}
                      </View>
                    </TouchableOpacity>
                  );
                })}

                {/* See all */}
                <TouchableOpacity style={styles.seeAllBtn} onPress={() => submitSearch(searchText)} activeOpacity={0.7}>
                  <Text style={styles.seeAllText}>See all results for "{searchText}"</Text>
                  <Ionicons name="chevron-forward" size={15} color="#0A8754" />
                </TouchableOpacity>
              </>
            ) : (
              <View style={styles.noResultRow}>
                <Text style={styles.noResultText}>No results for "{searchText}"</Text>
              </View>
            )}
          </View>
        )}

        {/* ── Recent searches (shown when not typing) ── */}
        {searchText.length === 0 && recentSearches.length > 0 && (
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionTitle}>Recent Searches</Text>
              <TouchableOpacity onPress={clearAllRecent}>
                <Text style={styles.clearAll}>Clear all</Text>
              </TouchableOpacity>
            </View>
            {recentSearches.map((term) => (
              <TouchableOpacity
                key={term}
                style={styles.recentRow}
                onPress={() => submitSearch(term)}
                activeOpacity={0.6}
              >
                <View style={styles.recentLeft}>
                  <Ionicons name="time-outline" size={16} color="#9CA3AF" />
                  <Text style={styles.recentText}>{term}</Text>
                </View>
                <TouchableOpacity onPress={() => removeOneRecent(term)} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
                  <Ionicons name="close" size={16} color="#D1D5DB" />
                </TouchableOpacity>
              </TouchableOpacity>
            ))}
          </View>
        )}

        {/* ── Trending searches (always shown when not typing) ── */}
        {searchText.length === 0 && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Trending in your city</Text>
            <View style={styles.trendingChips}>
              {TRENDING_TERMS.map((term) => (
                <TouchableOpacity
                  key={term}
                  style={styles.chip}
                  onPress={() => submitSearch(term)}
                  activeOpacity={0.7}
                >
                  <Ionicons name="trending-up-outline" size={13} color="#0A8754" />
                  <Text style={styles.chipText}>{term}</Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>
        )}
      </ScrollView>
    </Animated.View>
  );
};

export default SearchOverlay;

const styles = StyleSheet.create({
  root: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "#fff",
    zIndex: 5000,
  },

  /* Top bar */
  topBar: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 12,
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: "#F3F4F6",
    backgroundColor: "#fff",
  },
  backBtn: {
    width: 40, height: 40,
    borderRadius: 20,
    justifyContent: "center",
    alignItems: "center",
    marginRight: 8,
  },
  inputBox: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#F3F4F6",
    borderRadius: 14,
    paddingHorizontal: 12,
    paddingVertical: 10,
    gap: 8,
  },
  input: {
    flex: 1,
    fontSize: 15,
    color: "#111",
    fontWeight: "500",
    padding: 0,
  },

  body: {
    paddingBottom: 40,
  },

  /* Live suggestions */
  suggRow: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: "#F9FAFB",
    gap: 12,
  },
  suggIcon: {
    width: 32, height: 32,
    borderRadius: 16,
    backgroundColor: "#F3F4F6",
    justifyContent: "center",
    alignItems: "center",
  },
  suggText: {
    fontSize: 14,
    color: "#374151",
    fontWeight: "500",
    flex: 1,
  },

  /* Product rows */
  productRow: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: "#F9FAFB",
  },
  productImgBox: {
    width: 44, height: 44,
    borderRadius: 10,
    backgroundColor: "#F9FAFB",
    justifyContent: "center",
    alignItems: "center",
    borderWidth: 1,
    borderColor: "#F3F4F6",
    marginRight: 12,
  },
  productImg: { width: 36, height: 36, resizeMode: "contain" },
  productInfo: { flex: 1, paddingRight: 10 },
  productName: { fontSize: 14, fontWeight: "600", color: "#111827" },
  productUnit: { fontSize: 12, color: "#9CA3AF", marginTop: 1 },
  
  productRight: { alignItems: "flex-end" },
  productPrice: { fontSize: 14, fontWeight: "700", color: "#111" },
  addBtn: {
    paddingHorizontal: 16,
    paddingVertical: 6,
    backgroundColor: "#F0FDF4",
    borderWidth: 1,
    borderColor: "#16A34A",
    borderRadius: 8,
    marginTop: 6,
  },
  addText: { color: "#16A34A", fontWeight: "700", fontSize: 13 },
  qtyBox: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#16A34A",
    borderRadius: 8,
    paddingHorizontal: 8,
    paddingVertical: 4,
    marginTop: 6,
  },
  qtyBtn: { paddingHorizontal: 8, paddingVertical: 2 },
  qtyBtnText: { color: "#fff", fontWeight: "700", fontSize: 16 },
  qtyValue: { color: "#fff", fontWeight: "700", fontSize: 14, marginHorizontal: 8 },

  /* See all */
  seeAllBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    marginHorizontal: 16,
    marginTop: 8,
    marginBottom: 4,
    paddingVertical: 13,
    borderRadius: 12,
    backgroundColor: "#ECFDF5",
    borderWidth: 1,
    borderColor: "#D1FAE5",
    gap: 6,
  },
  seeAllText: { fontSize: 14, fontWeight: "700", color: "#0A8754" },

  noResultRow: { padding: 32, alignItems: "center" },
  noResultText: { fontSize: 14, color: "#9CA3AF", textAlign: "center" },

  /* Sections */
  section: { paddingTop: 20, paddingHorizontal: 16 },
  sectionHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 12,
  },
  sectionTitle: { fontSize: 16, fontWeight: "800", color: "#111827" },
  clearAll: { fontSize: 13, fontWeight: "600", color: "#0A8754" },

  /* Recent */
  recentRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: "#F9FAFB",
  },
  recentLeft: { flexDirection: "row", alignItems: "center", gap: 12, flex: 1 },
  recentText: { fontSize: 14, color: "#374151", fontWeight: "500" },

  /* Trending chips */
  trendingChips: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 10,
    marginTop: 4,
  },
  chip: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 30,
    backgroundColor: "#F0FDF4",
    borderWidth: 1,
    borderColor: "#BBF7D0",
  },
  chipText: { fontSize: 13, fontWeight: "600", color: "#065F46" },
});
