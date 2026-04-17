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
  Alert,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { ActivityIndicator, Modal } from "react-native";
import { searchProducts } from "../services/api/products";
import { useVoiceSearch } from "../hooks/useVoiceSearch";
import * as Speech from "expo-speech";
import { scale } from "../utils/responsive";

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
  "Search 'fresh vegetables'",
  "Search 'electronics'",
  "Search 'snacks'",
  "Search 'fruits'",
  "Search 'atta & dal'",
];

const SearchBar: React.FC<SearchBarProps> = ({
  onSearch,
  onSuggestions,
  onLoading,
  value,
  onChangeText,
}) => {
  const [internalText, setInternalText] = useState(value || "");
  const [currentIndex, setCurrentIndex] = useState(0);
  const [loading, setLoading] = useState(false);
  const inputRef = useRef<TextInput>(null);
  const scaleAnim = useRef(new Animated.Value(1)).current;
  const scrollAnim = useRef(new Animated.Value(0)).current;
  const debounceTimer = useRef<NodeJS.Timeout | null>(null);

  const isControlled = value !== undefined && onChangeText !== undefined;
  const displayText = isControlled ? value! : internalText;

  useEffect(() => {
    const timer = setInterval(() => {
      Animated.timing(scrollAnim, {
        toValue: scale(-20),
        duration: 500,
        useNativeDriver: true,
      }).start(() => {
        setCurrentIndex((prev: number) => (prev + 1) % placeholders.length);
        scrollAnim.setValue(0);
      });
    }, 2500);

    return () => clearInterval(timer);
  }, []);

  const current = placeholders[currentIndex];
  const next = placeholders[(currentIndex + 1) % placeholders.length];

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

  const handleVoiceResult = (text: string) => {
    if (isControlled) {
      onChangeText!(text);
    } else {
      setInternalText(text);
    }
    if (debounceTimer.current) clearTimeout(debounceTimer.current);
    performSearch(text);
    stopListening();
    
    Speech.speak(`Showing results for ${text}`, {
      language: "en-IN",
      pitch: 1.0,
      rate: 0.95,
    });

    // Explicitly call onSearch if present
    if (onSearch) {
      onSearch(text);
    }
  };

  const { isListening, startListening, stopListening, error: voiceError } = useVoiceSearch(handleVoiceResult);

  useEffect(() => {
    if (voiceError) {
      if (Platform.OS === "android") {
        ToastAndroid.show(voiceError, ToastAndroid.SHORT);
      } else {
        Alert.alert("Error", voiceError);
      }
    }
  }, [voiceError]);

  const handleMicPress = () => {
    Animated.sequence([
      Animated.timing(scaleAnim, { toValue: 0.8, duration: 100, useNativeDriver: true }),
      Animated.timing(scaleAnim, { toValue: 1, duration: 100, useNativeDriver: true }),
    ]).start();

    startListening();
  };

  return (
    <View style={styles.wrapper}>
      <View style={styles.container}>
        <Ionicons name="search" size={scale(18)} color="#888" style={styles.searchIcon} />

        <View style={styles.inputWrapper}>
          {displayText.length === 0 && (
            <View style={styles.placeholderContainer}>
              <Animated.View style={{ transform: [{ translateY: scrollAnim }] }}>
                <Text style={[styles.placeholderText, { height: scale(20) }]} numberOfLines={1}>{current}</Text>
                <Text style={[styles.placeholderText, { height: scale(20) }]} numberOfLines={1}>{next}</Text>
              </Animated.View>
            </View>
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
          <ActivityIndicator size="small" color="#0A8754" style={{ marginRight: scale(8) }} />
        ) : displayText.length > 0 && (
          <TouchableOpacity
            onPress={() => handleTextChange("")}
            activeOpacity={0.7}
            style={styles.clearBtn}
          >
            <Ionicons name="close-circle" size={scale(18)} color="#bbb" />
          </TouchableOpacity>
        )}

        <View style={styles.divider} />

        <TouchableOpacity onPress={handleMicPress} activeOpacity={0.7}>
          <Animated.View
            style={[styles.micBtn, isListening && styles.micBtnActive, { transform: [{ scale: scaleAnim }] }]}
          >
            <Ionicons name={isListening ? "mic" : "mic-outline"} size={scale(18)} color={isListening ? "#fff" : "#EF4444"} />
          </Animated.View>
        </TouchableOpacity>
      </View>

      <Modal visible={isListening} transparent animationType="fade" onRequestClose={() => stopListening(true)}>
        <View style={styles.listeningOverlay}>
          <View style={styles.pulseCircle}>
            <Ionicons name="mic" size={scale(40)} color="#fff" />
          </View>
          <Text style={styles.listeningText}>Listening...</Text>
          <TouchableOpacity style={styles.cancelVoice} onPress={() => stopListening(true)}>
            <Text style={styles.cancelVoiceText}>Tap to cancel</Text>
          </TouchableOpacity>
        </View>
      </Modal>
    </View>
  );
};

export default SearchBar;

const styles = StyleSheet.create({
  wrapper: {
    paddingHorizontal: scale(16),
    paddingVertical: scale(6),
    backgroundColor: "#FFFFFF",
  },
  container: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#F1F5F9",
    borderRadius: scale(14),
    paddingHorizontal: scale(16),
    paddingVertical: scale(12),
    marginBottom: scale(4),
    borderWidth: 1,
    borderColor: "#E2E8F0",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: scale(1) },
    shadowOpacity: 0.05,
    shadowRadius: scale(2),
    elevation: 2,
  },
  searchIcon: {
    marginRight: scale(8),
    color: "#9CA3AF",
  },
  inputWrapper: {
    flex: 1,
    height: scale(20),
    justifyContent: "center",
  },
  placeholderContainer: {
    position: "absolute",
    left: 0,
    right: 0,
    height: scale(20),
    overflow: "hidden",
    justifyContent: "flex-start",
  },
  placeholderText: {
    fontSize: scale(15),
    color: "#64748B",
    fontWeight: "500",
    lineHeight: scale(20),
  },
  input: {
    flex: 1,
    fontSize: scale(15),
    color: "#1E293B",
    fontWeight: "500",
    backgroundColor: "transparent",
    padding: 0,
    margin: 0,
  },
  clearBtn: {
    marginRight: scale(4),
  },
  divider: {
    width: 1,
    height: scale(18),
    backgroundColor: "#CBD5E1",
    marginHorizontal: scale(10),
  },
  micBtn: {
    padding: scale(4),
  },
  micBtnActive: {
    backgroundColor: "#EF4444",
    borderRadius: scale(12),
  },
  listeningOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "rgba(255,255,255,0.95)",
    zIndex: 6000,
    justifyContent: "center",
    alignItems: "center",
  },
  pulseCircle: {
    width: scale(80),
    height: scale(80),
    borderRadius: scale(40),
    backgroundColor: "#EF4444",
    justifyContent: "center",
    alignItems: "center",
    elevation: 8,
    shadowColor: "#EF4444",
    shadowOffset: { width: 0, height: scale(4) },
    shadowOpacity: 0.3,
    shadowRadius: scale(8),
  },
  listeningText: {
    marginTop: scale(20),
    fontSize: scale(18),
    fontWeight: "700",
    color: "#111",
  },
  cancelVoice: {
    marginTop: scale(40),
    paddingHorizontal: scale(20),
    paddingVertical: scale(10),
    borderRadius: scale(20),
    backgroundColor: "#F3F4F6",
  },
  cancelVoiceText: {
    color: "#6B7280",
    fontWeight: "600",
  },
});
