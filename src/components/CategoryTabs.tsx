import React, { useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Pressable,
  Animated,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";

const tabs = [
  { name: "All", icon: "apps-outline" },
  { name: "Fresh", icon: "leaf-outline" },
  { name: "Electronics", icon: "phone-portrait-outline" },
  { name: "Organic", icon: "nutrition-outline" },
  { name: "Deals", icon: "pricetag-outline" },
  { name: "Beauty", icon: "sparkles-outline" },
];

const CategoryTabs = ({ onChange }: any) => {
  const [activeTab, setActiveTab] = useState("All");

  const handlePress = (tab: string) => {
    setActiveTab(tab);
    onChange(tab);
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
  };

  return (
    <View style={styles.wrapper}>
      <ScrollView horizontal showsHorizontalScrollIndicator={false}>
        {tabs.map((tab) => {
          const active = tab.name === activeTab;

          return (
            <Pressable
              key={tab.name}
              onPress={() => handlePress(tab.name)}
              style={[styles.tab, active && styles.activeTab]}
            >
              <Ionicons
                name={tab.icon as any}
                size={18}
                color={active ? "#0A8754" : "#64748B"}
              />
              <Text style={[styles.text, active && styles.activeText]}>
                {tab.name}
              </Text>
            </Pressable>
          );
        })}
      </ScrollView>
    </View>
  );
};

export default CategoryTabs;

const styles = StyleSheet.create({
  wrapper: {
    paddingVertical: 10,
    paddingLeft: 15,
    backgroundColor: "#f3f5f7",
  },

  tab: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#fff",
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 24,
    marginRight: 10,
    borderWidth: 1.5,
    borderColor: "#E2E8F0",
    elevation: 2,
    shadowColor: "#000",
    shadowOpacity: 0.05,
    shadowRadius: 5,
    shadowOffset: { width: 0, height: 2 },
  },

  activeTab: {
    backgroundColor: "#ECFDF5",
    borderColor: "#0A8754",
  },

  text: {
    marginLeft: 6,
    fontSize: 14,
    fontWeight: "700",
    color: "#64748B",
  },

  activeText: {
    color: "#0A8754",
  },
});