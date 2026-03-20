import React, { useState, useRef, useEffect } from "react";
import {
  View,
  Text,
  TextInput,
  StyleSheet,
  TouchableOpacity,
  Animated,
  ToastAndroid,
  Platform,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { ActivityIndicator } from "react-native";
import { searchProducts } from "../services/api/products";

interface SearchBarProps {
  onSearch?: (text: string) => void;
  onSuggestions?: (data: any[]) => void;
  onLoading?: (loading: boolean) => void;
  value?: string;
  onChangeText?: (text: string) => void;
  placeholder?: string;
}

const placeholders = [
  "Search 'milk'",
  "Search 'chicken'",
  "Search 'relish'",
  "Search 'eggs'",
  "Search 'fresh fish'",
  "Search 'meat'",
];

const SearchBar = ({
  onSearch,
  onSuggestions,
  onLoading,
  value,
  onChangeText,
}: SearchBarProps) => {
  const [internalText, setInternalText] = useState(value || "");
  const [placeholderIndex, setPlaceholderIndex] = useState(0);
  const [loading, setLoading] = useState(false);
  const inputRef = useRef<TextInput>(null);
  const scaleAnim = useRef(new Animated.Value(1)).current;
  const scrollAnim = useRef(new Animated.Value(0)).current;
  const debounceTimer = useRef<NodeJS.Timeout | null>(null);

  const isControlled = value !== undefined && onChangeText !== undefined;
  const displayText = isControlled ? value! : internalText;

  useEffect(() => {
    const timer = setInterval(() => {
      // Animate out
      Animated.timing(scrollAnim, {
        toValue: -20,
        duration: 300,
        useNativeDriver: true,
      }).start(() => {
        setPlaceholderIndex((prev: number) => (prev + 1) % placeholders.length);
        // Reset position to bottom
        scrollAnim.setValue(20);
        // Animate in
        Animated.timing(scrollAnim, {
          toValue: 0,
          duration: 300,
          useNativeDriver: true,
        }).start();
      });
    }, 3000);

    return () => clearInterval(timer);
  }, []);

  const performSearch = async (text: string) => {
    if (!text.trim()) {
      onSuggestions?.([]);
      onLoading?.(false);
      setLoading(false);
      return;
    }

    setLoading(true);
    onLoading?.(true);
    
    try {
      const results = await searchProducts(text);
      onSuggestions?.(results);
    } catch (error) {
      console.error("Search error:", error);
      onSuggestions?.([]);
    } finally {
      setLoading(false);
      onLoading?.(false);
    }
  };

  const handleTextChange = (text: string) => {
    if (isControlled) {
      onChangeText!(text);
    } else {
      setInternalText(text);
    }
    
    // Debounce search for suggestions only
    if (debounceTimer.current) clearTimeout(debounceTimer.current);
    debounceTimer.current = setTimeout(() => {
      performSearch(text);
    }, 400);
  };

  const handleSubmit = () => {
    // Only navigate to results on explicit submit (keyboard Enter)
    onSearch?.(displayText);
  };

  const handleMicPress = () => {
    Animated.sequence([
      Animated.timing(scaleAnim, { toValue: 0.8, duration: 100, useNativeDriver: true }),
      Animated.timing(scaleAnim, { toValue: 1, duration: 100, useNativeDriver: true }),
    ]).start();

    inputRef.current?.focus();

    if (Platform.OS === "android") {
      ToastAndroid.show("Tap 🎤 on your keyboard to speak", ToastAndroid.SHORT);
    }
  };

  return (
    <View style={styles.wrapper}>
      <View style={styles.container}>
        <Ionicons name="search" size={18} color="#888" style={styles.searchIcon} />

        <View style={styles.inputWrapper}>
          {displayText.length === 0 && (
            <Animated.View style={[styles.placeholderContainer, { transform: [{ translateY: scrollAnim }] }]}>
              <Text style={styles.placeholderText}>{placeholders[placeholderIndex]}</Text>
            </Animated.View>
          )}
          <TextInput
            ref={inputRef}
            placeholder=""
            placeholderTextColor="transparent"
            style={styles.input}
            value={displayText}
            onChangeText={handleTextChange}
            returnKeyType="search"
            onSubmitEditing={handleSubmit}
          />
        </View>

        {loading ? (
          <ActivityIndicator size="small" color="#0A8754" style={{ marginRight: 8 }} />
        ) : displayText.length > 0 && (
          <TouchableOpacity
            onPress={() => handleTextChange("")}
            activeOpacity={0.7}
            style={styles.clearBtn}
          >
            <Ionicons name="close-circle" size={18} color="#bbb" />
          </TouchableOpacity>
        )}

        <TouchableOpacity onPress={handleMicPress} activeOpacity={0.7}>
          <Animated.View
            style={[styles.micBtn, { transform: [{ scale: scaleAnim }] }]}
          >
            <Ionicons name="mic-outline" size={18} color="#555" />
          </Animated.View>
        </TouchableOpacity>
      </View>
    </View>
  );
};

export default SearchBar;

const styles = StyleSheet.create({
  wrapper: {
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: "#FFFFFF",
  },
  container: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#F1F5F9",
    borderRadius: 24,
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderWidth: 1,
    borderColor: "#E2E8F0",
  },
  searchIcon: {
    marginRight: 10,
    color: "#64748B",
  },
  inputWrapper: {
    flex: 1,
    height: 38,
    justifyContent: "center",
  },
  placeholderContainer: {
    position: "absolute",
    left: 0,
    right: 0,
  },
  placeholderText: {
    fontSize: 15,
    color: "#94A3B8",
    fontWeight: "500",
  },
  input: {
    flex: 1,
    fontSize: 15,
    color: "#1E293B",
    fontWeight: "500",
    backgroundColor: "transparent",
  },
  clearBtn: {
    marginRight: 4,
  },
  micBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: "#FFFFFF",
    justifyContent: "center",
    alignItems: "center",
    marginLeft: 8,
    elevation: 3,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
});