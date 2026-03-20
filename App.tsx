import React, { useState, useEffect } from "react";
import { NavigationContainer } from "@react-navigation/native";
import AppLoader from "./src/components/AppLoader";
import RootStack from "./src/navigation/RootStack";
import { LocationProvider } from "./src/context/LocationContext";
import { AuthProvider } from "./src/context/AuthContext";
import { CartProvider } from "./src/context/CartContext";
import { AddressProvider } from "./src/context/AddressContext";
import { WalletProvider } from "./src/context/WalletContext";
import { TabBarProvider } from "./src/context/TabBarContext";
import { NotificationsProvider } from "./src/context/NotificationsContext";
import * as Linking from "expo-linking";

const prefix = Linking.createURL("/");

const linking = {
  prefixes: [prefix, "https://anushabazaar.com", "anushabazaar://", "http://13.49.18.149"],
  config: {
    screens: {
      MainTabs: {
        path: "",
        screens: {
          Home: "home",
          Categories: "categories",
          Trending: "trending",
          "Order Again": "reorder",
        },
      },
      ProductDetail: "product/:id",
      Profile: "profile",
      Cart: "cart",
    },
  },
} as any;

export default function App() {
  const [appIsReady, setAppIsReady] = useState(false);

  useEffect(() => {
    // Show splash animation for 2 seconds
    const timer = setTimeout(() => {
      setAppIsReady(true);
    }, 2000);
    return () => clearTimeout(timer);
  }, []);

  if (!appIsReady) {
    return <AppLoader />;
  }

  return (
    <AuthProvider>
      <WalletProvider>
        <CartProvider>
          <LocationProvider>
            <AddressProvider>
              <TabBarProvider>
                <NotificationsProvider>
                  <NavigationContainer linking={linking}>
                    <RootStack />
                  </NavigationContainer>
                </NotificationsProvider>
              </TabBarProvider>
            </AddressProvider>
          </LocationProvider>
        </CartProvider>
      </WalletProvider>
    </AuthProvider>
  );
}