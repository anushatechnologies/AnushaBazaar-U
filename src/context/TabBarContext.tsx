import React, { createContext, useContext, useRef, useCallback } from "react";
import { Animated } from "react-native";

interface TabBarContextType {
  tabBarTranslateY: Animated.Value;
  onScrollUp: () => void;
  onScrollDown: () => void;
}

const TabBarContext = createContext<TabBarContextType | null>(null);

export const TabBarProvider = ({ children }: { children: React.ReactNode }) => {
  const tabBarTranslateY = useRef(new Animated.Value(0)).current;

  const onScrollUp = useCallback(() => {
    Animated.spring(tabBarTranslateY, {
      toValue: 120,
      useNativeDriver: true,
      tension: 60,
      friction: 12,
    }).start();
  }, [tabBarTranslateY]);

  const onScrollDown = useCallback(() => {
    Animated.spring(tabBarTranslateY, {
      toValue: 0,
      useNativeDriver: true,
      tension: 60,
      friction: 12,
    }).start();
  }, [tabBarTranslateY]);

  return (
    <TabBarContext.Provider value={{ tabBarTranslateY, onScrollUp, onScrollDown }}>
      {children}
    </TabBarContext.Provider>
  );
};

export const useTabBar = () => {
  const ctx = useContext(TabBarContext);
  if (!ctx) throw new Error("useTabBar must be used inside TabBarProvider");
  return ctx;
};
