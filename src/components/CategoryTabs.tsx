import React, { useState, useRef, useCallback, useEffect } from "react";
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  Pressable,
  Animated,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import { scale } from "../utils/responsive";

const tabs = [
  { name: "All", iconOutline: "apps-outline", iconFilled: "apps" },
  { name: "Fresh", iconOutline: "leaf-outline", iconFilled: "leaf" },
  { name: "Electronics", iconOutline: "phone-portrait-outline", iconFilled: "phone-portrait" },
  { name: "Organic", iconOutline: "nutrition-outline", iconFilled: "nutrition" },
  { name: "Deals", iconOutline: "pricetag-outline", iconFilled: "pricetag", badge: "🔥" },
  { name: "Beauty", iconOutline: "sparkles-outline", iconFilled: "sparkles" },
];

const TabItem = React.memo(({ item, isActive, onPress }: any) => {
  const scaleValue = useRef(new Animated.Value(isActive ? 1.05 : 1)).current;

  // Animate on active state change
  useEffect(() => {
    Animated.spring(scaleValue, {
      toValue: isActive ? 1.05 : 1,
      useNativeDriver: true,
      friction: 5,
      tension: 100,
    }).start();
  }, [isActive]);

  return (
    <Animated.View style={{ transform: [{ scale: scaleValue }], marginRight: scale(10) }}>
      <Pressable
        onPress={() => onPress(item.name)}
        style={[styles.tab, isActive && styles.activeTab]}
        android_ripple={{ color: 'rgba(0,0,0,0.05)', radius: 24 }}
      >
        <Ionicons
          name={isActive ? item.iconFilled : item.iconOutline}
          size={scale(16)}
          color={isActive ? "#16A34A" : "#555555"}
        />
        <Text style={[styles.text, isActive && styles.activeText]}>
          {item.name}
        </Text>
        {item.badge && (
          <View style={styles.badge}>
            <Text style={styles.badgeText}>{item.badge}</Text>
          </View>
        )}
      </Pressable>
    </Animated.View>
  );
});

const CategoryTabs = ({ onChange, defaultTab = "All" }: any) => {
  const [activeTab, setActiveTab] = useState(defaultTab);

  const handlePress = useCallback((tabName: string) => {
    if (activeTab === tabName) return;
    setActiveTab(tabName);
    onChange(tabName);
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
  }, [activeTab, onChange]);

  const renderItem = useCallback(({ item }: any) => (
    <TabItem 
      item={item} 
      isActive={item.name === activeTab} 
      onPress={handlePress} 
    />
  ), [activeTab, handlePress]);

  return (
    <View style={styles.wrapper}>
      <FlatList
        data={tabs}
        keyExtractor={(item) => item.name}
        renderItem={renderItem}
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.listContent}
        initialNumToRender={6}
        windowSize={5}
        // Improve scrolling performance
        removeClippedSubviews={false}
      />
    </View>
  );
};

export default CategoryTabs;

const styles = StyleSheet.create({
  wrapper: {
    paddingVertical: scale(12),
    backgroundColor: "#FFFFFF",
    borderBottomWidth: 1,
    borderBottomColor: "#F3F4F6",
  },
  listContent: {
    paddingHorizontal: scale(16),
  },
  tab: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#F3F4F6",
    paddingVertical: scale(8),
    paddingHorizontal: scale(16),
    borderRadius: scale(24),
    borderWidth: 1,
    borderColor: "transparent",
  },
  activeTab: {
    backgroundColor: "#E6F4EA",
    borderColor: "#22C55E",
    elevation: 2, // Slight elevation
    shadowColor: "#22C55E",
    shadowOpacity: 0.1,
    shadowRadius: 4,
    shadowOffset: { width: 0, height: 2 },
  },
  text: {
    marginLeft: scale(6),
    fontSize: scale(13),
    fontWeight: "500",
    color: "#555",
  },
  activeText: {
    color: "#16A34A",
    fontWeight: "700",
  },
  badge: {
    position: 'absolute',
    top: -scale(4),
    right: -scale(4),
    backgroundColor: '#FFE4E6',
    borderRadius: scale(10),
    paddingHorizontal: scale(4),
    paddingVertical: scale(2),
    borderWidth: 1,
    borderColor: '#FFF',
    elevation: 3,
  },
  badgeText: {
    fontSize: scale(8),
    lineHeight: scale(10),
  }
});
