import React, { useState, useEffect, useRef, useCallback } from "react";
import {
  View,
  Text,
  TextInput,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Animated,
  Alert,
  Keyboard,
  BackHandler,
  ToastAndroid,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useNavigation } from "@react-navigation/native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { searchProducts } from "../services/api/products";
import { useCart } from "../context/CartContext";
import { useVoiceSearch } from "../hooks/useVoiceSearch";
import ProductCard from "./ProductCard";
import * as Speech from "expo-speech";

const RECENT_KEY = "anusha_recent_searches";
const MAX_RECENT = 8;

const TRENDING_TERMS = [
  "milk", "eggs", "bread", "atta", "dal", "rice", "chicken",
  "vegetables", "curd", "butter",
];

interface SearchOverlayProps {
  isVisible: boolean;
  onClose: () => void;
  initialVoiceMode?: boolean;
}

const SearchOverlay = ({ isVisible, onClose, initialVoiceMode }: SearchOverlayProps) => {
  const navigation = useNavigation<any>();
  const inputRef = useRef<TextInput>(null);
  const fadeAnim = useRef(new Animated.Value(0)).current;

  const [searchText, setSearchText] = useState("");
  const [recentSearches, setRecentSearches] = useState<string[]>([]);
  const [suggestions, setSuggestions] = useState<any[]>([]);
  const [loadingSuggestions, setLoadingSuggestions] = useState(false);
  const debounceTimer = useRef<NodeJS.Timeout | null>(null);
  const insets = useSafeAreaInsets();

  const handleVoiceResult = useCallback((text: string) => {
    setSearchText(text);
    Speech.speak(`Showing results for ${text}`, {
      language: "en-IN",
      pitch: 1.0,
      rate: 0.95,
    });
    submitSearch(text);
  }, [setRecentSearches, onClose, navigation]);

  const { isListening, startListening, stopListening, error: voiceError } = useVoiceSearch(handleVoiceResult);

  // Handle Voice Search Errors (Permissions, etc.)
  useEffect(() => {
    if (voiceError) {
      if (voiceError.toLowerCase().includes('permission') || voiceError.toLowerCase().includes('denied')) {
        Alert.alert(
          "Microphone Permission",
          "Anusha Bazaar needs microphone access to search by voice. Please enable it in device settings."
        );
      } else if (voiceError.toLowerCase().includes('not available') || voiceError.toLowerCase().includes('rebuild')) {
        Alert.alert(
          "Voice Search Unavailable",
          "Voice search is not available on this device at the moment. Please try again later or restart the app."
        );
      } else {
        ToastAndroid.show(voiceError, ToastAndroid.SHORT);
      }
    }
  }, [voiceError]);

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
      if (initialVoiceMode) {
        setTimeout(() => startListening(), 400);
      }
    } else {
      setSearchText("");
      setSuggestions([]);
      stopListening(true);
    }
  }, [isVisible, initialVoiceMode]);

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
        // Only show products whose name matches the search text as suggestions
        const kw = text.toLowerCase().trim();
        const filtered = results.filter((p: any) => {
          const name = (p.name || '').toLowerCase();
          return name.includes(kw) || kw.split(/\s+/).some((w: string) => w.length > 1 && name.includes(w));
        });
        setSuggestions(filtered.slice(0, 6));
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

  const _goToProduct = (item: any) => {
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
            <TouchableOpacity 
              onPress={isListening ? stopListening : startListening}
              style={[styles.micBtn, isListening && styles.micBtnActive]}
            >
              <Ionicons 
                name={isListening ? "mic" : "mic-outline"} 
                size={20} 
                color={isListening ? "#fff" : "#EF4444"} 
              />
            </TouchableOpacity>
          )}
        </View>
      </View>

      {/* ── Listening Overlay ── */}
      {isListening && (
        <View style={styles.listeningOverlay}>
          <View style={styles.pulseCircle}>
            <Ionicons name="mic" size={40} color="#fff" />
          </View>
          <Text style={styles.listeningText}>Listening...</Text>
          <TouchableOpacity style={styles.cancelVoice} onPress={() => stopListening(true)}>
            <Text style={styles.cancelVoiceText}>Tap to cancel</Text>
          </TouchableOpacity>
        </View>
      )}

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

                <View style={styles.searchGrid}>
                  {suggestions.map((item) => (
                    <View key={item.id} style={styles.cardWrapper}>
                      <ProductCard product={item} />
                    </View>
                  ))}
                </View>

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

  /* Product rows replacing with Grid */
  searchGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "space-between",
    paddingHorizontal: 12,
    marginTop: 10,
  },
  cardWrapper: {
    width: "48%",
    marginBottom: 10,
  },
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

  micBtn: {
    padding: 4,
  },
  micBtnActive: {
    backgroundColor: "#EF4444",
    borderRadius: 12,
  },
  listeningOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "rgba(255,255,255,0.96)",
    zIndex: 6000,
    justifyContent: "center",
    alignItems: "center",
  },
  pulseCircle: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: "#EF4444",
    justifyContent: "center",
    alignItems: "center",
    elevation: 8,
    shadowColor: "#EF4444",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
  },
  listeningText: {
    marginTop: 20,
    fontSize: 18,
    fontWeight: "700",
    color: "#111",
  },
  cancelVoice: {
    marginTop: 40,
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 20,
    backgroundColor: "#F3F4F6",
  },
  cancelVoiceText: {
    color: "#6B7280",
    fontWeight: "600",
  },
});
