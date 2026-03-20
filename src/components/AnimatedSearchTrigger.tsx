import React, { useState, useEffect, useRef } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Animated,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";

interface AnimatedSearchTriggerProps {
  onPress: () => void;
}

const placeholders = [
  "Search 'milk'",
  "Search 'chicken'",
  "Search 'relish'",
  "Search 'eggs'",
  "Search 'fresh fish'",
  "Search 'meat'",
];

const AnimatedSearchTrigger = ({ onPress }: AnimatedSearchTriggerProps) => {
  const [placeholderIndex, setPlaceholderIndex] = useState(0);
  const scrollAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    const timer = setInterval(() => {
      // Animate out (slide up and fade)
      Animated.timing(scrollAnim, {
        toValue: -20,
        duration: 300,
        useNativeDriver: true,
      }).start(() => {
        setPlaceholderIndex((prev: number) => (prev + 1) % placeholders.length);
        // Reset position to bottom
        scrollAnim.setValue(20);
        // Animate in (slide up to center)
        Animated.timing(scrollAnim, {
          toValue: 0,
          duration: 300,
          useNativeDriver: true,
        }).start();
      });
    }, 3000);

    return () => clearInterval(timer);
  }, []);

  return (
    <TouchableOpacity
      style={styles.searchTrigger}
      onPress={onPress}
      activeOpacity={0.8}
    >
      <Ionicons name="search" size={17} color="#9CA3AF" style={styles.icon} />
      
      <View style={styles.textContainer}>
        <Animated.View style={{ transform: [{ translateY: scrollAnim }] }}>
          <Text style={styles.placeholderText}>
            {placeholders[placeholderIndex]}
          </Text>
        </Animated.View>
      </View>

      <View style={styles.divider} />
      <Ionicons name="mic-outline" size={18} color="#EF4444" />
    </TouchableOpacity>
  );
};

export default AnimatedSearchTrigger;

const styles = StyleSheet.create({
  searchTrigger: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#F1F5F9",
    borderRadius: 14,
    paddingHorizontal: 16,
    paddingVertical: 12,
    marginHorizontal: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: "#E2E8F0",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 2,
  },
  icon: {
    marginRight: 8,
  },
  textContainer: {
    flex: 1,
    height: 20, // fixed height to clip animation
    overflow: "hidden",
    justifyContent: "center",
  },
  placeholderText: {
    fontSize: 15,
    color: "#64748B",
    fontWeight: "500",
  },
  divider: {
    width: 1,
    height: 18,
    backgroundColor: "#CBD5E1",
    marginHorizontal: 10,
  },
});
