import React, { useState, useEffect, useRef } from "react";
import {
  View,
  Text,
  StyleSheet,
  Pressable,
  Animated,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { scale } from "../utils/responsive";

interface AnimatedSearchTriggerProps {
  onPress: () => void;
  onMicPress?: () => void;
}

const placeholders = [
  "Search 'milk'",
  "Search 'fresh vegetables'",
  "Search 'electronics'",
  "Search 'snacks'",
  "Search 'fruits'",
  "Search 'atta & dal'",
];

const AnimatedSearchTrigger = ({ onPress, onMicPress }: AnimatedSearchTriggerProps) => {
  const [currentIndex, setCurrentIndex] = useState(0);
  const scrollAnim = useRef(new Animated.Value(0)).current;

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

  return (
    <Pressable
      style={styles.searchTrigger}
      onPress={onPress}
    >
      <Ionicons name="search" size={scale(17)} color="#9CA3AF" style={styles.icon} />
      
      <View style={styles.textContainer}>
        <Animated.View style={{ transform: [{ translateY: scrollAnim }] }}>
          <Text style={[styles.placeholderText, { height: scale(20) }]} numberOfLines={1}>
            {current}
          </Text>
          <Text style={[styles.placeholderText, { height: scale(20) }]} numberOfLines={1}>
            {next}
          </Text>
        </Animated.View>
      </View>

      <View style={styles.divider} />
      <Pressable
        onPress={onMicPress || onPress}
        hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
      >
        <Ionicons name="mic-outline" size={scale(18)} color="#EF4444" />
      </Pressable>
    </Pressable>
  );
};

export default React.memo(AnimatedSearchTrigger);

const styles = StyleSheet.create({
  searchTrigger: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#F1F5F9",
    borderRadius: scale(14),
    paddingHorizontal: scale(16),
    paddingVertical: scale(12),
    marginHorizontal: scale(16),
    marginBottom: scale(12),
    borderWidth: 1,
    borderColor: "#E2E8F0",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: scale(1) },
    shadowOpacity: 0.05,
    shadowRadius: scale(2),
    elevation: 2,
  },
  icon: {
    marginRight: scale(8),
  },
  textContainer: {
    flex: 1,
    height: scale(20), // fixed height to clip animation
    overflow: "hidden",
    justifyContent: "flex-start",
  },
  placeholderText: {
    fontSize: scale(15),
    color: "#64748B",
    fontWeight: "500",
    lineHeight: scale(20),
  },
  divider: {
    width: 1,
    height: scale(18),
    backgroundColor: "#CBD5E1",
    marginHorizontal: scale(10),
  },
});
