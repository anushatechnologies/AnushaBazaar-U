import React from "react";
import {
  View,
  Text,
  StyleSheet,
  Pressable,
  Animated,
} from "react-native";
import { createBottomTabNavigator } from "@react-navigation/bottom-tabs";
import { BottomTabBarProps } from "@react-navigation/bottom-tabs";
import { Ionicons } from "@expo/vector-icons";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import HomeScreen from "../screens/home/HomeScreen";
import CategoriesScreen from "../screens/categories/CategoriesScreen";
import TrendingScreen from "../screens/home/TrendingScreen";
import OrderAgainScreen from "../screens/orders/OrderAgainScreen";
import { useTabBar } from "../context/TabBarContext";

export type RootTabParamList = {
  Home: undefined;
  Categories: undefined;
  Trending: undefined;
  "Order Again": undefined;
};

const Tab = createBottomTabNavigator<RootTabParamList>();

/* ─── Tab Item Config ─── */
const TAB_CONFIG: Record<string, { icon: keyof typeof Ionicons.glyphMap; iconActive: keyof typeof Ionicons.glyphMap; label: string }> = {
  Home:          { icon: "home-outline",    iconActive: "home",     label: "Home" },
  Categories:    { icon: "grid-outline",    iconActive: "grid",     label: "Categories" },
  Trending:      { icon: "flame-outline",   iconActive: "flame",    label: "Trending" },
  "Order Again": { icon: "repeat-outline",  iconActive: "repeat",   label: "Reorder" },
};

/* ─── Custom Tab Bar ─── */
const CustomTabBar = ({ state, descriptors, navigation }: BottomTabBarProps) => {
  const insets = useSafeAreaInsets();
  const { tabBarTranslateY } = useTabBar();

  return (
    <Animated.View
      pointerEvents="box-none"
      style={[
        styles.outerContainer,
        {
          paddingBottom: Math.max(insets.bottom, 10),
          transform: [{ translateY: tabBarTranslateY }],
        },
      ]}
    >
      <View style={styles.bar}>
        {state.routes.map((route, index) => {
          const isFocused = state.index === index;
          const config = TAB_CONFIG[route.name];

          const onPress = () => {
            const event = navigation.emit({
              type: "tabPress",
              target: route.key,
              canPreventDefault: true,
            });
            if (!isFocused && !event.defaultPrevented) {
              navigation.navigate(route.name);
            }
          };

          return (
            <Pressable
              key={route.key}
              onPress={onPress}
              style={styles.tab}
              android_ripple={{ color: 'rgba(10, 135, 84, 0.12)', borderless: true, radius: 35 }}
            >
              {/* Active background pill */}
              {isFocused && <View style={styles.activePill} />}

              <Ionicons
                name={isFocused ? config.iconActive : config.icon}
                size={21}
                color={isFocused ? "#0A8754" : "#9CA3AF"}
              />
              <Text style={[styles.label, isFocused && styles.labelActive]}>
                {config.label}
              </Text>

              {/* Active bottom dot */}
              {isFocused && <View style={styles.activeDot} />}
            </Pressable>
          );
        })}
      </View>
    </Animated.View>
  );
};

/* ─── Navigator ─── */
const BottomTabs = () => {
  const { onScrollDown } = useTabBar();

  return (
    <Tab.Navigator
      tabBar={(props) => <CustomTabBar {...props} />}
      screenOptions={{ headerShown: false }}
      screenListeners={{
        // Reset tab bar to visible every time ANY tab gains focus
        focus: () => onScrollDown(),
      }}
    >
      <Tab.Screen name="Home" component={HomeScreen} />
      <Tab.Screen name="Categories" component={CategoriesScreen} />
      <Tab.Screen name="Trending" component={TrendingScreen} />
      <Tab.Screen name="Order Again" component={OrderAgainScreen} />
    </Tab.Navigator>
  );
};

export default BottomTabs;

/* ─── Styles ─── */
const styles = StyleSheet.create({
  outerContainer: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    paddingHorizontal: 14,
    paddingTop: 6,
    backgroundColor: "transparent",
  },
  bar: {
    flexDirection: "row",
    backgroundColor: "#fff",
    borderRadius: 28,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: -4 },
    shadowOpacity: 0.1,
    shadowRadius: 20,
    elevation: 20,
    paddingVertical: 6,
    paddingHorizontal: 6,
    borderWidth: 1,
    borderColor: "rgba(0,0,0,0.05)",
  },
  tab: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 8,
    position: "relative",
    gap: 3,
  },
  activePill: {
    position: "absolute",
    top: 0,
    left: 6,
    right: 6,
    bottom: 0,
    backgroundColor: "#E8F5EE",
    borderRadius: 20,
  },
  label: {
    fontSize: 10,
    fontWeight: "600",
    color: "#9CA3AF",
    letterSpacing: 0.1,
  },
  labelActive: {
    color: "#0A8754",
    fontWeight: "800",
  },
  activeDot: {
    position: "absolute",
    bottom: 2,
    width: 4,
    height: 4,
    borderRadius: 2,
    backgroundColor: "#0A8754",
  },
});
