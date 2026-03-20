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
                size={16}
                color={active ? "#fff" : "#444"}
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
    paddingVertical: 8,
    paddingHorizontal: 14,
    borderRadius: 20,
    marginRight: 10,
    elevation: 2,
    shadowColor: "#000",
    shadowOpacity: 0.06,
    shadowRadius: 4,
    shadowOffset: { width: 0, height: 1 },
  },

  activeTab: {
    backgroundColor: "#0A8754",
  },

  text: {
    marginLeft: 5,
    fontSize: 13,
    fontWeight: "600",
    color: "#444",
  },

  activeText: {
    color: "#fff",
  },
});