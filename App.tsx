import React, { useState, useEffect } from "react";
import { Platform, PermissionsAndroid } from "react-native";
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
import * as Location from "expo-location";
import * as Notifications from "expo-notifications";
import messaging from '@react-native-firebase/messaging';

const prefix = Linking.createURL("/");

const linking = {
  prefixes: [prefix, "https://anushabazaar.com", "anushabazaar://", "https://api.anushatechnologies.com"],
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

const requestAllPermissions = async () => {
  try {
    // 1. Location
    await Location.requestForegroundPermissionsAsync();

    // 2. Notifications
    await Notifications.requestPermissionsAsync();

    // 3. Microphone & Phone (Android only)
    if (Platform.OS === "android") {
      await PermissionsAndroid.requestMultiple([
        PermissionsAndroid.PERMISSIONS.RECORD_AUDIO,
        PermissionsAndroid.PERMISSIONS.READ_PHONE_STATE,
      ]);
    }
  } catch (e) {
    console.log("Permission request error:", e);
  }
};

export default function App() {
  const [appIsReady, setAppIsReady] = useState(false);

  useEffect(() => {
    const getToken = async () => {
      try {
        const token = await messaging().getToken();
        console.log('🔥 YOUR FCM TOKEN:', token);
      } catch (e) {
        console.error('Failed to get token', e);
      }
    };
    getToken();
  }, []);

  useEffect(() => {
    // Request all permissions on app launch
    requestAllPermissions();

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