import React from "react";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import { useLocation } from "../context/LocationContext";

import BottomTabs from "./BottomTabs";

/* Core Screens */
import WalletScreen from "../screens/WalletScreen";
import SelectLocationScreen from "../screens/SelectLocationScreen";
import ProfileScreen from "../screens/ProfileScreen";

/* Auth */
import LoginScreen from "../screens/LoginScreen";
import SignupScreen from "../screens/SignupScreen";
import OtpScreen from "../screens/OtpScreen";

/* Profile */
import OrdersScreen from "../screens/OrdersScreen";
import SavedAddressScreen from "../screens/SavedAddressScreen";
import PaymentScreen from "../screens/PaymentScreen";
import NotificationsScreen from "../screens/NotificationsScreen";
import EditProfileScreen from "../screens/EditProfileScreen";

/* Product Flow */
import ProductDetailScreen from "../screens/ProductDetailScreen";
import CheckoutScreen from "../screens/CheckoutScreen";
import CategoryProductsScreen from "../screens/CategoryProductsScreen";


/* Address Flow */
import AddressScreen from "../screens/AddressScreen";
import AddAddressScreen from "../screens/AddAddressScreen";
import OrderSuccessScreen from "../screens/OrderSuccessScreen";

/* Info */
import PrivacyScreen from "../screens/PrivacyScreen";
import TermsScreen from "../screens/TermsScreen";
import GeneralInfoScreen from "../screens/GeneralInfoScreen";
import AboutScreen from "../screens/AboutScreen";
import HelpScreen from "../screens/HelpScreen";
import PermissionScreen from "../screens/PermissionScreen";

/* ================= TYPES ================= */

export type RootStackParamList = {
  MainTabs: undefined;

  /* Product Flow */
  ProductDetail: { product: any };
  Checkout: undefined;

  CategoryProducts: { category: any; initialSubCategoryId?: string | number };
  Cart: undefined;

  /* Address Flow */
  Address: undefined;
  AddAddress: undefined;
  OrderSuccess: undefined;

  /* Core */
  Wallet: undefined;
  SelectLocation: undefined;
  Profile: undefined;
  SearchResults: { query: string };

  /* Auth */
  Login: undefined;
  Signup: { phone?: string };
  Otp: {
    name: string;
    phone: string;
    verificationId: string;
  };

  /* Profile */
  Orders: undefined;
  SavedAddress: undefined;
  Wishlist: undefined;
  Payment: undefined;
  Notifications: undefined;
  EditProfile: undefined;

  /* Info */
  GeneralInfo: undefined;
  About: undefined;
  Privacy: undefined;
  Terms: undefined;
  Help: undefined;

  /* Tracking */
  OrderTracking: { orderId: string | number };
  Permission: undefined;
};

const Stack = createNativeStackNavigator<RootStackParamList>();

/* ================= NAVIGATION ================= */

const RootStack = () => {
  const { location, hasPermission } = useLocation();

  return (
    <Stack.Navigator
      initialRouteName="MainTabs"
      screenOptions={{
        headerShown: false,
        animation: "slide_from_right",
      }}
    >
      {/* MAIN APP */}
      <Stack.Screen name="MainTabs" component={BottomTabs} />

      {/* PRODUCT FLOW */}
      <Stack.Screen
        name="ProductDetail"
        component={ProductDetailScreen}
      />

      <Stack.Screen
        name="Checkout"
        component={CheckoutScreen}
      />


      <Stack.Screen
        name="CategoryProducts"
        component={CategoryProductsScreen}
      />

      <Stack.Screen
        name="Cart"
        getComponent={() => require("../screens/CartScreen").default}
      />

      {/* ADDRESS FLOW */}
      <Stack.Screen
        name="Address"
        component={AddressScreen}
      />

      <Stack.Screen
        name="AddAddress"
        component={AddAddressScreen}
      />

      <Stack.Screen
        name="OrderSuccess"
        component={OrderSuccessScreen}
      />

      {/* CORE */}
      <Stack.Screen name="Wallet" component={WalletScreen} />

      <Stack.Screen
        name="SelectLocation"
        component={SelectLocationScreen}
      />

      <Stack.Screen
        name="Profile"
        component={ProfileScreen}
      />

      {/* AUTH */}
      <Stack.Screen name="Login" component={LoginScreen} />

      <Stack.Screen name="Signup" component={SignupScreen} />

      <Stack.Screen name="Otp" component={OtpScreen} />

      {/* PROFILE */}
      <Stack.Screen name="Orders" component={OrdersScreen} />

      <Stack.Screen
        name="SavedAddress"
        component={SavedAddressScreen}
      />

      <Stack.Screen
        name="Wishlist"
        getComponent={() => require("../screens/WishlistScreen").default}
      />

      <Stack.Screen
        name="Payment"
        component={PaymentScreen}
      />

      <Stack.Screen
        name="Notifications"
        component={NotificationsScreen}
      />

      <Stack.Screen
        name="EditProfile"
        component={EditProfileScreen}
      />

      {/* INFO */}
      <Stack.Screen
        name="GeneralInfo"
        component={GeneralInfoScreen}
      />

      <Stack.Screen
        name="About"
        component={AboutScreen}
      />

      <Stack.Screen
        name="Privacy"
        component={PrivacyScreen}
      />

      <Stack.Screen
        name="Terms"
        component={TermsScreen}
      />

      <Stack.Screen
        name="Help"
        component={HelpScreen}
      />

      <Stack.Screen
        name="SearchResults"
        getComponent={() => require("../screens/SearchResultsScreen").default}
      />

      <Stack.Screen
        name="OrderTracking"
        getComponent={() => require("../screens/OrderTrackingScreen").default}
      />
      
      <Stack.Screen name="Permission" component={PermissionScreen} />
    </Stack.Navigator>
  );
};

export default RootStack;
