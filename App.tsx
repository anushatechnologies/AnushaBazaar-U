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
import messaging from '@react-native-firebase/messaging';

// ─── FCM: Background message handler (runs when app is in background/quit) ───
// This MUST be registered at the top level, outside of any component
messaging().setBackgroundMessageHandler(async (remoteMessage) => {
  console.log('[FCM] Background message received:', JSON.stringify(remoteMessage));
  // The system notification tray handles display automatically.
  // When the user taps, onNotificationOpenedApp or getInitialNotification handles it.
});

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

    // 2. Android 13+ POST_NOTIFICATIONS permission
    if (Platform.OS === "android" && Platform.Version >= 33) {
      await PermissionsAndroid.request(
        PermissionsAndroid.PERMISSIONS.POST_NOTIFICATIONS
      );
    }

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
    const initFCM = async () => {
      try {
        // Request FCM permission
        const authStatus = await messaging().requestPermission();
        const enabled =
          authStatus === messaging.AuthorizationStatus.AUTHORIZED ||
          authStatus === messaging.AuthorizationStatus.PROVISIONAL;
        console.log('[FCM] Authorization status:', enabled ? 'enabled' : 'disabled');

        // Get & log token for testing
        const token = await messaging().getToken();
        console.log('🔥 FCM TOKEN:', token);

        // Listen for token refresh
        const unsubscribeTokenRefresh = messaging().onTokenRefresh((newToken) => {
          console.log('🔥 FCM TOKEN REFRESHED:', newToken);
          // TODO: Send newToken to your backend to update the stored token
        });

        return unsubscribeTokenRefresh;
      } catch (e) {
        console.error('FCM init failed:', e);
      }
    };

    const unsubPromise = initFCM();

    return () => {
      unsubPromise.then((unsub) => unsub && unsub());
    };
  }, []);

  useEffect(() => {
    // Request all permissions on app launch
    requestAllPermissions();

    // Show splash animation for 3.5 seconds so grocery items orbit fully
    const timer = setTimeout(() => {
      setAppIsReady(true);
    }, 3500);
    return () => clearTimeout(timer);
  }, []);

  if (!appIsReady) {
    return (
      <AppLoader
        fullScreen
        title="Anusha Bazaar"
        subtitle="Fresh groceries, rice, fruits & daily essentials – handpicked just for you."
      />
    );
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
