import React, { useEffect, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  Pressable,
  Alert,
  ActivityIndicator,
  Image,
  ScrollView,
  TextInput,
  KeyboardAvoidingView,
  Platform,
  ToastAndroid,
} from "react-native";
import { useCart } from "../../context/CartContext";
import { useAuth } from "../../context/AuthContext";
import { useWallet } from "../../context/WalletContext";
import { useSafeAreaInsets } from "react-native-safe-area-context";
// @ts-ignore
import { Ionicons } from "@expo/vector-icons";
import * as Location from "expo-location";
import { getAddresses, addAddress } from "../../services/api/addresses";
import { placeOrder as placeOrderAPI } from "../../services/api/orders";
import { initiateRazorpayPayment, verifyRazorpayPayment } from "../../services/api/payments";
import { syncCartToServer } from "../../services/api/cart";
import { getAppSettings } from "../../services/api/settings";
import {
  isRazorpayAvailable,
  buildRazorpayOptions,
  startRazorpayCheckout,
  getRazorpayErrorMessage,
} from "../../services/razorpay";
import LoginPromptModal from "../../components/LoginPromptModal";
import PaymentResultModal from "../../components/PaymentResultModal";
import { scale } from "../../utils/responsive";

const CheckoutScreen = ({ navigation }: any) => {
<<<<<<< HEAD:src/screens/CheckoutScreen.tsx
  const { cart, subtotal, deliveryCharge, total, discount, appliedCoupon, clearCart, usePoints, pointsDiscount } = useCart();
=======
  const { 
    cart, total, discount, appliedCoupon, clearCart, 
    usePoints, pointsDiscount, setUsePoints,
    useWalletBalance, walletDiscount, setUseWalletBalance,
    walletBalance 
  } = useCart();
>>>>>>> 8f07c6e (hello):src/screens/cart/CheckoutScreen.tsx
  const { user, jwtToken } = useAuth();
  const { addPoints, spendPoints, spendMoney } = useWallet();
  const insets = useSafeAreaInsets();
  const [loading, setLoading] = useState(false);

  // Saved addresses from server
  const [savedAddresses, setSavedAddresses] = useState<any[]>([]);
  const [selectedAddressId, setSelectedAddressId] = useState<number | string | null>(null);
  const [loadingAddresses, setLoadingAddresses] = useState(true);
  const [useManualAddress, setUseManualAddress] = useState(false);

  // Manual Address State (fallback)
  const [address, setAddress] = useState({
    name: "",
    phone: "",
    addressLine1: "",
    addressLine2: "",
    landmark: "",
    city: "",
    state: "",
    pincode: "",
    type: "Home",
  });

  // "Ordering for someone else" state
  const [orderingForOther, setOrderingForOther] = useState(false);
  const [receiverName, setReceiverName] = useState("");
  const [receiverPhone, setReceiverPhone] = useState("+91");

  const [locating, setLocating] = useState(false);
  const [selectedPayment, setSelectedPayment] = useState<string>("COD");
  const [showLoginPrompt, setShowLoginPrompt] = useState(false);
  const onlinePaymentAvailable = isRazorpayAvailable();

  // Payment result modal state
  const [paymentResult, setPaymentResult] = useState<{
    visible: boolean;
    success: boolean;
    amount?: string;
    orderId?: string | number;
    orderNumber?: string;
    message?: string;
    failedOrderId?: string | number;
  }>({ visible: false, success: false });

  // Settings for fees and instructions
  const [deliveryInstructions, setDeliveryInstructions] = useState("");
  const [handlingCharge, setHandlingCharge] = useState(0);
  const [smallCartFee, setSmallCartFee] = useState(0);
  const [smallCartThreshold, setSmallCartThreshold] = useState(0);
  const [deliveryCharge, setDeliveryCharge] = useState(0);
  const [platformFee, setPlatformFee] = useState(0);
  const [onlinePaymentEnabled, setOnlinePaymentEnabled] = useState(true);
  const [codEnabled, setCodEnabled] = useState(true);

  useEffect(() => {
    const fetchSettings = async () => {
      const data = await getAppSettings(jwtToken || undefined);
      if (data) {
        setHandlingCharge(Number(data.handlingCharge) || 0);
        setSmallCartFee(Number(data.smallCartFee) || 0);
        setSmallCartThreshold(Number(data.smallCartThreshold) || 0);
        setDeliveryCharge(Number(data.deliveryCharge) || 0);
        setPlatformFee(Number(data.platformFee) || 0);
        if (data.onlinePaymentEnabled !== undefined) setOnlinePaymentEnabled(Boolean(data.onlinePaymentEnabled));
        if (data.cashOnDeliveryEnabled !== undefined) setCodEnabled(Boolean(data.cashOnDeliveryEnabled));
      }
    };
    fetchSettings();
  }, [jwtToken]);

  // Fetch saved addresses on mount
  useEffect(() => {
    const fetchAddresses = async () => {
      if (!jwtToken) {
        setLoadingAddresses(false);
        setUseManualAddress(true);
        return;
      }
      try {
        const data = await getAddresses(jwtToken);
        if (Array.isArray(data) && data.length > 0) {
          setSavedAddresses(data);
          // Auto-select default or first address
          const defaultAddr = data.find((a: any) => a.isDefault) || data[0];
          setSelectedAddressId(defaultAddr.id);
        } else {
          setUseManualAddress(true);
        }
      } catch (error) {
        console.error("Error fetching addresses:", error);
        setUseManualAddress(true);
      } finally {
        setLoadingAddresses(false);
      }
    };
    fetchAddresses();
  }, [jwtToken]);

  // Auto-fill user details from profile
  useEffect(() => {
    if (user) {
      let formattedPhone = user.phone || "";
      if (formattedPhone && !formattedPhone.startsWith("+91")) {
        formattedPhone = `+91${formattedPhone}`;
      } else if (!formattedPhone) {
        formattedPhone = "+91";
      }

      setAddress(prev => ({
        ...prev,
        name: user.name || "",
        phone: formattedPhone
      }));
    } else {
      setAddress((prev) => ({ ...prev, phone: "+91" }));
    }
  }, [user]);

  const updateAddress = (key: string, value: string) => {
    setAddress(prev => ({ ...prev, [key]: value }));
  };

  const handleCurrentLocation = async () => {
    setLocating(true);
    try {
      let { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== "granted") {
        Alert.alert("Permission Denied", "Allow location access to auto-fill address.");
        return;
      }

      let location = await Location.getCurrentPositionAsync({
        accuracy: Location.Accuracy.High
      });

      let reverseGeo = await Location.reverseGeocodeAsync({
        latitude: location.coords.latitude,
        longitude: location.coords.longitude,
      });

      if (reverseGeo.length > 0) {
        const addr = reverseGeo[0];
        setAddress(prev => ({
          ...prev,
          city: addr.city || addr.subregion || "",
          state: addr.region || "",
          pincode: addr.postalCode || "",
          addressLine1: [addr.name, addr.street].filter(Boolean).join(", "),
          addressLine2: addr.district || "",
          landmark: "",
        }));
        Alert.alert("Location Found", "Address fields updated.");
      }
    } catch (error) {
      console.error(error);
      Alert.alert("Error", "Could not fetch location.");
    } finally {
      setLocating(false);
    }
  };

  const calculatePointsEarned = () => Math.floor(total / 100);

  const applyWalletChanges = async (orderNumber?: string) => {
    try {
      if (useWalletBalance && walletDiscount > 0) {
        const success = await spendMoney(walletDiscount, `Payment for Order #${orderNumber || ""}`);
        if (success) {
           if (Platform.OS === 'android') {
               ToastAndroid.show(`₹${walletDiscount.toFixed(2)} has been debited from your wallet.`, ToastAndroid.LONG);
           } else {
               Alert.alert("Wallet Debited", `₹${walletDiscount.toFixed(2)} has been debited from your wallet.`);
           }
        }
      }
    } catch (walletError) {
      console.error("Wallet sync warning:", walletError);
    }

    return 0; // Points disabled
  };

  const finalizeSuccessfulOrder = async (
    orderId: number | string,
    orderedItems: any[],
<<<<<<< HEAD:src/screens/CheckoutScreen.tsx
    orderNumber?: string,
    totalPaid?: number | string
=======
    isOnline: boolean = false,
    orderNumber?: string
>>>>>>> 8f07c6e (hello):src/screens/cart/CheckoutScreen.tsx
  ) => {
    const pointsEarned = await applyWalletChanges(orderNumber);

    clearCart();
    setLoading(false);

<<<<<<< HEAD:src/screens/CheckoutScreen.tsx
    navigation.replace("OrderSuccess", {
      orderId,
      orderNumber,
      totalPaid: totalPaid != null ? String(totalPaid) : total.toFixed(2),
      pointsEarned,
      items: orderedItems,
    });
=======
    if (isOnline) {
      // Show animated success modal for online payments
      setPaymentResult({
        visible: true,
        success: true,
        amount: finalTotal.toFixed(2),
        orderId,
        orderNumber,
        message: "Your payment has been processed successfully. Your order is being prepared!",
      });
    } else {
      navigation.replace("OrderSuccess", {
        orderId,
        orderNumber,
        totalPaid: finalTotal.toFixed(2),
        pointsEarned,
        items: orderedItems,
      });
    }
>>>>>>> 8f07c6e (hello):src/screens/cart/CheckoutScreen.tsx
  };

  const handlePaymentFailure = (
    orderId: number | string,
<<<<<<< HEAD:src/screens/CheckoutScreen.tsx
    orderNumber: string | undefined,
    title: string,
    message: string
=======
    errorMsg: string
>>>>>>> 8f07c6e (hello):src/screens/cart/CheckoutScreen.tsx
  ) => {
    setLoading(false);
<<<<<<< HEAD:src/screens/CheckoutScreen.tsx

    Alert.alert(title, message, [
      {
        text: "Track Order",
        onPress: () => navigation.replace("OrderTracking", { orderId, orderNumber }),
      },
      {
        text: "OK",
        style: "cancel",
      },
    ]);
=======
    setPaymentResult({
      visible: true,
      success: false,
      amount: finalTotal.toFixed(2),
      orderId,
      message: errorMsg || "Payment could not be completed. Your order was created — please check My Orders before trying again.",
      failedOrderId: orderId,
    });
>>>>>>> 8f07c6e (hello):src/screens/cart/CheckoutScreen.tsx
  };

  const placeOrder = async () => {
    // 1. Auth Guard
    if (!user || !jwtToken) {
      setShowLoginPrompt(true);
      return;
    }

    // 2. Address Validation
    if (!useManualAddress && !selectedAddressId) {
      Alert.alert("Select Address", "Please select a delivery address.");
      return;
    }

    if (useManualAddress) {
      const requiredFields = ["name", "phone", "addressLine1", "city", "pincode"];
      const missing = requiredFields.filter(f => !address[f as keyof typeof address]);

      if (missing.length > 0) {
        Alert.alert("Missing Details", "Please fill all required address fields.");
        return;
      }

      if (address.phone.length < 13) {
        Alert.alert("Invalid Phone", "Please enter a valid 10-digit mobile number starting with +91.");
        return;
      }

      // Validate receiver details if ordering for someone else
      if (orderingForOther) {
        if (!receiverName.trim()) {
          Alert.alert("Missing Details", "Please enter the receiver's name.");
          return;
        }
        if (receiverPhone.length < 13) {
          Alert.alert("Invalid Phone", "Please enter a valid 10-digit receiver phone number starting with +91.");
          return;
        }
      }
    }

    // 3. Payment Validation
    if (!selectedPayment) {
      Alert.alert("Payment Method", "Please select a payment method to continue.");
      return;
    }

    if (selectedPayment === "ONLINE" && !onlinePaymentAvailable) {
      Alert.alert(
        "Online payment not available",
        "Razorpay is not available. Please rebuild the app or use Cash on Delivery."
      );
      return;
    }

    setLoading(true);

    try {
      let finalAddressId = selectedAddressId;
      const orderedItems = cart.map((item: any) => ({ ...item }));

      // If manual address, save it to server first and get the real ID
      if (useManualAddress) {
        const addressPayload: any = {
          addressType: address.type ? String(address.type).toUpperCase() : "HOME",
          addressLine1: address.addressLine1.trim(),
          addressLine2: address.addressLine2.trim(),
          landmark: address.landmark.trim(),
          city: address.city.trim(),
          state: address.state.trim(),
          postalCode: address.pincode.trim(),
          isDefault: savedAddresses.length === 0,
          contactName: address.name.trim(),
          contactPhone: address.phone.trim(),
        };

        // Attach receiver details if ordering for someone else
        if (orderingForOther && receiverName.trim()) {
          addressPayload.receiverName = receiverName.trim();
          addressPayload.receiverPhone = receiverPhone.trim();
        }

        let newAddress = await addAddress(jwtToken, addressPayload);

        if (newAddress === true) {
          const updatedAddrs = await getAddresses(jwtToken);
          if (updatedAddrs && updatedAddrs.length > 0) {
            newAddress = updatedAddrs.find((a: any) => 
               a.addressLine1 === address.addressLine1.trim() && 
               a.postalCode === address.pincode.trim()
            ) || updatedAddrs[updatedAddrs.length - 1];
          }
        }

        if (!newAddress || !newAddress.id) {
          setLoading(false);
          Alert.alert("Error", "Could not save your address. Please try again.");
          return;
        }
        finalAddressId = newAddress.id;
      }

      // ────────────────────────────────────────────────────────────────────
      // PERMANENT FIX: The backend reads cart_items from DB to create order_items.
      // addCartItem can silently fail, so we force-sync the entire local cart
      // to the server right before placing the order.
      // ────────────────────────────────────────────────────────────────────
      const cartPayload = cart
        .map((item: any) => {
          // variantId is the variant's actual ID — this is what the backend expects
          const vid = Number(item.variantId || item.id);
          const qty = Number(item.quantity || 1);
          console.log(`[Checkout] Cart item: name="${item.name}", variantId=${item.variantId}, id=${item.id}, resolved=${vid}, qty=${qty}`);
          return { variantId: vid, quantity: qty };
        })
        .filter((item: any) => Number.isFinite(item.variantId) && item.variantId > 0 && item.quantity > 0);

      console.log(`[Checkout] Cart payload (${cartPayload.length} items):`, JSON.stringify(cartPayload));

      if (cartPayload.length === 0) {
        setLoading(false);
        Alert.alert("Cart Error", "Your cart appears to be empty or contains invalid items. Please go back and add items again.");
        return;
      }

      const synced = await syncCartToServer(jwtToken, cartPayload);
      if (!synced) {
        setLoading(false);
        Alert.alert(
          "Sync Error",
          "Could not sync your cart with the server. Please check your internet connection and try again."
        );
        return;
      }

      const itemsTotal = total + discount;
      const applicableSmallCartFee = (smallCartThreshold > 0 && itemsTotal < smallCartThreshold) ? smallCartFee : 0;
      const finalTotalAmount = total + handlingCharge + applicableSmallCartFee + deliveryCharge + platformFee;

      // If fully paid by wallet, we force the payment method to WALLET 
      // or ensure it bypasses online payment.
      const resolvedPaymentMethodStatus = finalTotal <= 0 ? "WALLET" : selectedPayment;

      // POST /api/orders
      const orderResult = await placeOrderAPI(
        jwtToken,
        finalAddressId!,
        resolvedPaymentMethodStatus,
        appliedCoupon || undefined,
        appliedCoupon ? discount : undefined,
        deliveryInstructions.trim() || undefined,
        {
          deliveryCharge: deliveryCharge,
          handlingCharge: handlingCharge,
          smallCartFee: applicableSmallCartFee,
          totalAmount: finalTotalAmount
        }
      );
      const orderId = orderResult?.id || orderResult?.orderId;

      if (!orderId) {
        throw new Error(JSON.stringify(orderResult) || "Order response did not include an order ID.");
      }

      if (resolvedPaymentMethodStatus === "WALLET") {
        // Fully paid by wallet money
        await finalizeSuccessfulOrder(orderId, orderedItems, false, orderResult?.orderNumber);
        return;
      }

      if (selectedPayment === "ONLINE") {
        if (finalTotal === 0) {
          // Fallback check
          await finalizeSuccessfulOrder(orderId, orderedItems, false, orderResult?.orderNumber);
          return;
        }

        try {
          // Step 1: Initiate Razorpay order on backend
          const paymentInit = await initiateRazorpayPayment(jwtToken, orderId);

<<<<<<< HEAD:src/screens/CheckoutScreen.tsx
          if (isEasebuzzSuccess(paymentResult.result)) {
            await finalizeSuccessfulOrder(orderId, orderedItems, orderResult?.orderNumber, orderResult?.grandTotal);
            return;
          }

          handleExistingOnlineOrder(
            orderId,
            orderResult?.orderNumber,
            "Payment not completed",
            `${getEasebuzzResultMessage(paymentResult.result)} Your order was created, so please check My Orders before trying again.`
          );
          return;
        } catch (paymentError: any) {
          console.error("Online payment flow error:", paymentError);
          handleExistingOnlineOrder(
            orderId,
            orderResult?.orderNumber,
            "Payment pending",
            `${paymentError?.message || "We could not complete the Easebuzz payment flow."} Your order was created, so please verify its latest status in My Orders.`
          );
=======
          // Step 2: Build options and open Razorpay checkout
          const options = buildRazorpayOptions({
            razorpayOrderId: paymentInit.razorpayOrderId,
            amount: paymentInit.amount,
            currency: paymentInit.currency || "INR",
            receipt: paymentInit.receipt,
            userEmail: user?.email,
            userPhone: user?.phone,
            userName: user?.name,
            key: paymentInit.keyId,
          });

          const paymentResult = await startRazorpayCheckout(options);

          // Step 3: Verify payment on backend
          await verifyRazorpayPayment(jwtToken, {
            razorpayOrderId: paymentResult.razorpay_order_id,
            razorpayPaymentId: paymentResult.razorpay_payment_id,
            razorpaySignature: paymentResult.razorpay_signature,
            receipt: paymentInit.receipt,
          });

          // Payment successful - show animated success modal
          await finalizeSuccessfulOrder(orderId, orderedItems, true, orderResult?.orderNumber);
          return;
        } catch (paymentError: any) {
          console.error("Online payment flow error:", paymentError);
          const errorMsg = getRazorpayErrorMessage(paymentError);
          handlePaymentFailure(orderId, `${errorMsg} Your order was created, so please check My Orders before trying again.`);
>>>>>>> 8f07c6e (hello):src/screens/cart/CheckoutScreen.tsx
          return;
        }
      }

<<<<<<< HEAD:src/screens/CheckoutScreen.tsx
      await finalizeSuccessfulOrder(orderId, orderedItems, orderResult?.orderNumber, orderResult?.grandTotal);
=======
      await finalizeSuccessfulOrder(orderId, orderedItems, false, orderResult?.orderNumber);
>>>>>>> 8f07c6e (hello):src/screens/cart/CheckoutScreen.tsx
      return;

    } catch (error: any) {
      setLoading(false);
      console.error("Place order error:", error);
      Alert.alert("Order Failed", error.message || "Something went wrong. Please try again.");
    }
  };

  const itemsTotal = total + discount;
  const applicableSmallCartFee = (smallCartThreshold > 0 && itemsTotal < smallCartThreshold) ? smallCartFee : 0;
  const finalTotal = total + handlingCharge + applicableSmallCartFee + deliveryCharge + platformFee;

  return (
    <KeyboardAvoidingView 
      style={{ flex: 1 }} 
      behavior={Platform.OS === "ios" ? "padding" : "height"}
      keyboardVerticalOffset={Platform.OS === "ios" ? 0 : scale(20)}
    >
      <View style={[styles.container, { paddingTop: insets.top }]}>
      <ScrollView 
        keyboardShouldPersistTaps="handled" 
        showsVerticalScrollIndicator={false} 
        contentContainerStyle={{ paddingBottom: scale(120) }}
      >
        {/* Header with Back Navigation */}
        <View style={styles.header}>
          <Pressable onPress={() => navigation.goBack()} style={styles.backBtnHeader}>
            <Ionicons name="arrow-back" size={scale(24)} color="#111" />
          </Pressable>
          <Text style={styles.title}>Final Step</Text>
          <View style={{ width: scale(44) }} />
        </View>

        {/* Delivery Address Section */}
        <View style={styles.sectionContainer}>
          <Text style={styles.sectionTitle}>Delivery Address</Text>

          {loadingAddresses ? (
            <ActivityIndicator size="small" color="#0A8754" style={{ marginVertical: scale(20) }} />
          ) : savedAddresses.length > 0 && !useManualAddress ? (
            <>
              {savedAddresses.map((addr: any) => {
                const isSelected = selectedAddressId === addr.id;
                const fullAddr = [addr.addressLine1, addr.addressLine2, addr.landmark, addr.city, addr.state, addr.postalCode].filter(Boolean).join(", ");
                return (
                  <Pressable
                    key={addr.id}
                    style={[
                      styles.paymentOption,
                      isSelected && styles.paymentOptionActive,
                      { marginBottom: scale(10) },
                    ]}
                    onPress={() => setSelectedAddressId(addr.id)}
                  >
                    <View style={styles.paymentLeft}>
                      <Ionicons
                        name={String(addr.addressType || "Home").toLowerCase() === "home" ? "home-outline" : String(addr.addressType || "").toLowerCase() === "work" ? "briefcase-outline" : "location-outline"}
                        size={scale(20)}
                        color={isSelected ? "#0A8754" : "#666"}
                      />
                      <View style={{ marginLeft: scale(12), flex: 1 }}>
                        <Text style={[styles.paymentName, isSelected && styles.paymentNameActive]}>
                          {String(addr.addressType || "Home").charAt(0).toUpperCase() + String(addr.addressType || "Home").slice(1).toLowerCase()}
                        </Text>
                        <Text style={styles.paymentSub} numberOfLines={2}>{fullAddr}</Text>
                      </View>
                    </View>
                    <Ionicons
                      name={isSelected ? "radio-button-on" : "radio-button-off"}
                      size={scale(22)}
                      color={isSelected ? "#0A8754" : "#ccc"}
                    />
                  </Pressable>
                );
              })}
              <Pressable
                style={{ alignSelf: "center", marginTop: scale(4) }}
                onPress={() => setUseManualAddress(true)}
              >
                <Text style={{ color: "#0A8754", fontWeight: "700", fontSize: scale(13) }}>+ Enter address manually</Text>
              </Pressable>
            </>
          ) : (
            <>
              <View style={styles.sectionHeaderRow}>
                <View />
                <Pressable
                  style={styles.locationBtn}
                  onPress={handleCurrentLocation}
                  disabled={locating}
                >
                  <Ionicons name="location" size={scale(14)} color="#0A8754" />
                  <Text style={styles.locationBtnText}>
                    {locating ? "Locating..." : "Use Current Location"}
                  </Text>
                </Pressable>
              </View>

              <View style={styles.inputGrid}>
                <View style={[styles.inputBox, { flex: 1 }]}>
                  <Text style={styles.label}>Full Name *</Text>
                  <TextInput
                    style={styles.input}
                    placeholder="Receiver's name"
                    value={address.name}
                    onChangeText={(t) => updateAddress("name", t)}
                  />
                </View>
                <View style={[styles.inputBox, { flex: 1 }]}>
                  <Text style={styles.label}>Mobile Number *</Text>
                  <TextInput
                    style={styles.input}
                    placeholder="+91 Mobile number"
                    keyboardType="phone-pad"
                    maxLength={13}
                    value={address.phone}
                    onChangeText={(t) => {
                      if (!t.startsWith("+91")) {
                        updateAddress("phone", "+91" + t.replace(/^\+?9?1?/, ""));
                      } else {
                        updateAddress("phone", t);
                      }
                    }}
                  />
                </View>
              </View>

              {/* Ordering for someone else toggle */}
              <Pressable
                style={[styles.toggleRow, orderingForOther && styles.toggleRowActive, { marginTop: scale(4), marginBottom: scale(8) }]}
                onPress={() => setOrderingForOther(!orderingForOther)}
              >
                <View style={styles.toggleLeft}>
                  <Ionicons name="people-outline" size={scale(20)} color={orderingForOther ? "#0A8754" : "#666"} />
                  <View style={styles.toggleTextContainer}>
                    <Text style={styles.toggleTitle}>Ordering for someone else?</Text>
                    <Text style={styles.toggleSub}>Add receiver's details for delivery</Text>
                  </View>
                </View>
                <Ionicons
                  name={orderingForOther ? "checkbox" : "square-outline"}
                  size={scale(24)}
                  color={orderingForOther ? "#0A8754" : "#ccc"}
                />
              </Pressable>

              {orderingForOther && (
                <View style={{ backgroundColor: "#F0FDF4", borderRadius: scale(12), padding: scale(14), marginBottom: scale(8), borderWidth: 1, borderColor: "#D1FAE5" }}>
                  <Text style={[styles.label, { color: "#0A8754", marginBottom: scale(6) }]}>Receiver Details</Text>
                  <View style={styles.inputBox}>
                    <Text style={styles.label}>Receiver Name *</Text>
                    <TextInput
                      style={styles.input}
                      placeholder="Full name of receiver"
                      placeholderTextColor="#9CA3AF"
                      value={receiverName}
                      onChangeText={setReceiverName}
                    />
                  </View>
                  <View style={styles.inputBox}>
                    <Text style={styles.label}>Receiver Phone *</Text>
                    <View style={styles.phoneRow}>
                      <Ionicons name="call-outline" size={scale(16)} color="#6B7280" style={{ marginRight: scale(8) }} />
                      <TextInput
                        style={[styles.input, { flex: 1 }]}
                        placeholder="+91 Receiver mobile"
                        keyboardType="phone-pad"
                        maxLength={13}
                        value={receiverPhone}
                        onChangeText={(t) => {
                          if (!t.startsWith("+91")) {
                            setReceiverPhone("+91" + t.replace(/^\+?9?1?/, ""));
                          } else {
                            setReceiverPhone(t);
                          }
                        }}
                      />
                    </View>
                  </View>
                </View>
              )}

              <View style={styles.inputBox}>
                <Text style={styles.label}>Address Line 1 *</Text>
                <TextInput
                  style={styles.input}
                  placeholder="House No, Building, Street"
                  placeholderTextColor="#9CA3AF"
                  value={address.addressLine1}
                  onChangeText={(t) => updateAddress("addressLine1", t)}
                />
              </View>

              <View style={styles.inputBox}>
                <Text style={styles.label}>Address Line 2</Text>
                <TextInput
                  style={styles.input}
                  placeholder="Area, Colony (optional)"
                  placeholderTextColor="#9CA3AF"
                  value={address.addressLine2}
                  onChangeText={(t) => updateAddress("addressLine2", t)}
                />
              </View>

              <View style={styles.inputBox}>
                <Text style={styles.label}>Landmark (Optional)</Text>
                <TextInput
                  style={styles.input}
                  placeholder="Near Temple, Mall etc."
                  placeholderTextColor="#9CA3AF"
                  value={address.landmark}
                  onChangeText={(t) => updateAddress("landmark", t)}
                />
              </View>

              <View style={styles.inputGrid}>
                <View style={[styles.inputBox, { flex: 1 }]}>
                  <Text style={styles.label}>City *</Text>
                  <TextInput
                    style={styles.input}
                    placeholder="City"
                    placeholderTextColor="#9CA3AF"
                    value={address.city}
                    onChangeText={(t) => updateAddress("city", t)}
                  />
                </View>
                <View style={[styles.inputBox, { flex: 1 }]}>
                  <Text style={styles.label}>State</Text>
                  <TextInput
                    style={styles.input}
                    placeholder="State"
                    placeholderTextColor="#9CA3AF"
                    value={address.state}
                    onChangeText={(t) => updateAddress("state", t)}
                  />
                </View>
              </View>

              <View style={styles.inputBox}>
                <Text style={styles.label}>Pincode *</Text>
                <TextInput
                  style={styles.input}
                  placeholder="6-digit Pincode"
                  placeholderTextColor="#9CA3AF"
                  keyboardType="number-pad"
                  maxLength={6}
                  value={address.pincode}
                  onChangeText={(t) => updateAddress("pincode", t)}
                />
              </View>

              {savedAddresses.length > 0 && (
                <Pressable
                  style={{ alignSelf: "center", marginTop: scale(4) }}
                  onPress={() => setUseManualAddress(false)}
                >
                  <Text style={{ color: "#0A8754", fontWeight: "700", fontSize: scale(13) }}>Use saved address</Text>
                </Pressable>
              )}
            </>
          )}
        </View>

        {/* Payment Methods Section */}
        <View style={styles.sectionContainer}>
          <Text style={styles.sectionTitle}>Payment Method</Text>

          <View style={styles.paymentOptionsStack}>
            <Pressable
              style={[
                styles.paymentOption,
                selectedPayment === "COD" && styles.paymentOptionActive,
              ]}
              onPress={() => setSelectedPayment("COD")}
            >
              <View style={styles.paymentLeft}>
                <Ionicons
                  name="cash-outline"
                  size={scale(20)}
                  color={selectedPayment === "COD" ? "#0A8754" : "#666"}
                />
                <View style={{ marginLeft: scale(12) }}>
                  <Text style={[styles.paymentName, selectedPayment === "COD" && styles.paymentNameActive]}>
                    Cash on Delivery
                  </Text>
                  <Text style={styles.paymentSub}>Pay at your doorstep</Text>
                </View>
              </View>
              <Ionicons
                name={selectedPayment === "COD" ? "radio-button-on" : "radio-button-off"}
                size={scale(22)}
                color={selectedPayment === "COD" ? "#0A8754" : "#ccc"}
              />
            </Pressable>

            <Pressable
              style={[
                styles.paymentOption,
                selectedPayment === "ONLINE" && styles.paymentOptionActive,
              ]}
              onPress={() => setSelectedPayment("ONLINE")}
            >
              <View style={styles.paymentLeft}>
                <Ionicons
                  name="card-outline"
                  size={scale(20)}
                  color={selectedPayment === "ONLINE" ? "#0A8754" : "#666"}
                />
                <View style={{ marginLeft: scale(12), flex: 1 }}>
                  <Text style={[styles.paymentName, selectedPayment === "ONLINE" && styles.paymentNameActive]}>
                    Online Payment
                  </Text>
                  <Text style={styles.paymentSub}>
                    UPI, cards, and net banking via Razorpay
                  </Text>
                </View>
              </View>
              <Ionicons
                name={selectedPayment === "ONLINE" ? "radio-button-on" : "radio-button-off"}
                size={scale(22)}
                color={selectedPayment === "ONLINE" ? "#0A8754" : "#ccc"}
              />
            </Pressable>

            <View style={styles.infoAlert}>
              <Ionicons name="information-circle-outline" size={scale(16)} color="#0A8754" />
              <Text style={styles.infoText}>
                Online orders are placed first, then Razorpay opens securely for payment.
              </Text>
            </View>
          </View>
        </View>

        {/* Wallet & Points Toggles */}
        <View style={styles.sectionContainer}>
          <Text style={styles.sectionTitle}>Offers & Wallet</Text>
          
          <Pressable 
            style={[styles.toggleRow, useWalletBalance && styles.toggleRowActive]}
            onPress={() => setUseWalletBalance(!useWalletBalance)}
          >
            <View style={styles.toggleLeft}>
              <Ionicons name="wallet-outline" size={scale(20)} color={useWalletBalance ? "#0A8754" : "#666"} />
              <View style={styles.toggleTextContainer}>
                <Text style={styles.toggleTitle}>Use Wallet Balance</Text>
                <Text style={styles.toggleSub}>Available: ₹{walletBalance.toFixed(2)}</Text>
              </View>
            </View>
            <Ionicons 
              name={useWalletBalance ? "checkbox" : "square-outline"} 
              size={scale(24)} 
              color={useWalletBalance ? "#0A8754" : "#ccc"} 
            />
          </Pressable>

          {/* Remove divider if there's nothing below it */}
        </View>

        <View style={styles.summaryContainer}>
          <Text style={styles.sectionTitle}>Order Summary</Text>
          {cart.map((item: any) => (
            <View key={item.id} style={styles.itemRow}>
              <Image
                source={
                  typeof item.image === "string" ? { uri: item.image } :
                    item.image ? item.image :
                      item.imageUrl ? { uri: item.imageUrl } :
                        item.icon ? { uri: item.icon } :
                          { uri: "https://via.placeholder.com/150" }
                }
                style={styles.itemImage}
              />
              <View style={styles.itemDetails}>
                <Text style={styles.itemName} numberOfLines={1}>{item.name}</Text>
                <Text style={styles.itemQty}>Qty: {item.quantity}</Text>
              </View>
              <Text style={styles.itemPrice}>₹{item.price * item.quantity}</Text>
            </View>
          ))}
        </View>

        <View style={styles.paymentCard}>
          <Text style={styles.paymentTitle}>Payment Summary</Text>
          <View style={styles.priceRow}>
            <Text style={styles.priceLabel}>Items Total</Text>
            <Text style={styles.priceValue}>₹{(total + discount).toFixed(2)}</Text>
          </View>
          {appliedCoupon ? (
            <View style={styles.priceRow}>
              <Text style={[styles.priceLabel, { color: "#0A8754" }]}>Coupon: {appliedCoupon}</Text>
              <Text style={[styles.priceValue, { color: "#0A8754" }]}>-₹{discount.toFixed(2)}</Text>
            </View>
          ) : (
            <View style={styles.priceRow}>
              <Text style={[styles.priceLabel, { color: "#0A8754" }]}>Total Savings</Text>
              <Text style={[styles.priceValue, { color: "#0A8754" }]}>
                {discount > 0 ? `-₹${discount.toFixed(2)}` : "₹0.00"}
              </Text>
            </View>
          )}

          {handlingCharge > 0 && (
            <View style={styles.priceRow}>
              <Text style={styles.priceLabel}>Handling Charges</Text>
              <Text style={styles.priceValue}>₹{handlingCharge.toFixed(2)}</Text>
            </View>
          )}

          <View style={styles.priceRow}>
            <Text style={styles.priceLabel}>Delivery Charge</Text>
<<<<<<< HEAD:src/screens/CheckoutScreen.tsx
            <Text style={styles.priceValue}>{deliveryCharge.toFixed(2)}</Text>
=======
            {deliveryCharge > 0 ? (
              <Text style={styles.priceValue}>₹{deliveryCharge.toFixed(2)}</Text>
            ) : (
              <Text style={styles.freeText}>FREE</Text>
            )}
>>>>>>> 8f07c6e (hello):src/screens/cart/CheckoutScreen.tsx
          </View>

          {platformFee > 0 && (
            <View style={styles.priceRow}>
              <Text style={styles.priceLabel}>Platform Fee</Text>
              <Text style={styles.priceValue}>₹{platformFee.toFixed(2)}</Text>
            </View>
          )}

          {applicableSmallCartFee > 0 && (
            <View style={styles.priceRow}>
              <Text style={styles.priceLabel}>Small Cart Fee</Text>
              <Text style={styles.priceValue}>₹{applicableSmallCartFee.toFixed(2)}</Text>
            </View>
          )}

          {walletDiscount > 0 && (
            <View style={styles.priceRow}>
              <Text style={[styles.priceLabel, { color: "#0A8754" }]}>Wallet Money Used</Text>
              <Text style={[styles.priceValue, { color: "#0A8754" }]}>-₹{walletDiscount.toFixed(2)}</Text>
            </View>
          )}

          <View style={[styles.priceRow, styles.grandTotalRow]}>
            <Text style={styles.grandTotalLabel}>Grand Total</Text>
            <Text style={styles.grandTotalValue}>₹{finalTotal.toFixed(2)}</Text>
          </View>
        </View>

        <View style={styles.sectionContainer}>
          <Text style={styles.sectionTitle}>Delivery Instructions</Text>
          <TextInput
            style={[styles.input, { height: scale(80), textAlignVertical: "top", marginTop: scale(10) }]}
            placeholder="E.g., Leave package at door, don't ring bell..."
            placeholderTextColor="#9CA3AF"
            multiline
            value={deliveryInstructions}
            onChangeText={setDeliveryInstructions}
          />
        </View>
      </ScrollView>

      <View style={[styles.footer, { paddingBottom: Math.max(insets.bottom, scale(20)) }]}>
        <Pressable
          style={styles.btn}
          onPress={placeOrder}
          disabled={loading}
        >
          {loading ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <Text style={styles.btnText}>
              {finalTotal <= 0 
                ? "Place Order (Paid by Wallet)" 
                : selectedPayment === "ONLINE" 
                  ? `Pay Online \u2022 \u20B9${finalTotal.toFixed(2)}` 
                  : `Place Order \u2022 \u20B9${finalTotal.toFixed(2)}`}
            </Text>
          )}
        </Pressable>
      </View>

      <LoginPromptModal
        isVisible={showLoginPrompt}
        onClose={() => setShowLoginPrompt(false)}
        onLogin={() => {
          setShowLoginPrompt(false);
          navigation.navigate("Login");
        }}
        message="Please login to place your order and track it effortlessly."
      />

      <PaymentResultModal
        visible={paymentResult.visible}
        success={paymentResult.success}
        amount={paymentResult.amount}
        orderId={paymentResult.orderId}
        message={paymentResult.message}
        onDone={() => {
          setPaymentResult({ visible: false, success: false });
          if (paymentResult.success) {
            navigation.replace("OrderSuccess", {
              orderId: paymentResult.orderId,
              orderNumber: paymentResult.orderNumber,
              totalPaid: paymentResult.amount,
            });
          } else {
            clearCart();
            navigation.replace("OrderTracking", { orderId: paymentResult.orderId, orderNumber: paymentResult.orderNumber });
          }
        }}
        onRetry={!paymentResult.success ? () => {
          setPaymentResult({ visible: false, success: false });
          // Order already exists, redirect to orders
          clearCart();
          navigation.replace("Orders");
        } : undefined}
      />
      </View>
    </KeyboardAvoidingView>
  );
};

export default CheckoutScreen;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#F6F7FB",
  },
  title: {
    fontSize: scale(22),
    fontWeight: "900",
    color: "#111",
    textAlign: "center",
    letterSpacing: scale(-0.5),
    paddingTop: 0,
    paddingBottom: 0,
    flex: 1,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: scale(16),
    paddingVertical: scale(15),
  },
  backBtnHeader: {
    width: scale(44),
    height: scale(44),
    borderRadius: scale(22),
    backgroundColor: "#fff",
    justifyContent: "center",
    alignItems: "center",
    elevation: 2,
    shadowColor: "#000",
    shadowOpacity: 0.1,
    shadowOffset: { width: 0, height: scale(2) },
    shadowRadius: scale(4),
  },
  infoAlert: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#E9F7F1",
    padding: scale(12),
    borderRadius: scale(12),
    marginTop: scale(10),
    gap: scale(8),
  },
  infoText: {
    color: "#0A8754",
    fontSize: scale(12),
    fontWeight: "600",
  },
  sectionContainer: {
    backgroundColor: "#fff",
    marginHorizontal: scale(16),
    borderRadius: scale(20),
    padding: scale(20),
    marginBottom: scale(16),
    elevation: 4,
    shadowColor: "#000",
    shadowOpacity: 0.06,
    shadowOffset: { width: 0, height: scale(4) },
    shadowRadius: scale(10),
  },
  sectionHeaderRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: scale(20),
  },
  locationBtn: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#E9F7F1",
    paddingVertical: scale(6),
    paddingHorizontal: scale(10),
    borderRadius: scale(8),
    gap: scale(4),
  },
  locationBtnText: {
    color: "#0A8754",
    fontSize: scale(12),
    fontWeight: "700",
  },
  inputGrid: {
    flexDirection: "row",
    gap: scale(12),
  },
  inputBox: {
    marginBottom: scale(16),
  },
  label: {
    fontSize: scale(12),
    fontWeight: "700",
    color: "#888",
    marginBottom: scale(6),
    textTransform: "uppercase",
  },
  input: {
    backgroundColor: "#F4F7F6",
    borderRadius: scale(12),
    paddingHorizontal: scale(15),
    paddingVertical: scale(12),
    fontSize: scale(14),
    color: "#333",
    fontWeight: "600",
    borderWidth: 1,
    borderColor: "#EAEAEA",
  },
  phoneRow: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#F4F7F6",
    borderRadius: scale(12),
    paddingHorizontal: scale(12),
    borderWidth: 1,
    borderColor: "#EAEAEA",
  },
  typeRow: {
    flexDirection: "row",
    gap: scale(10),
    marginTop: scale(8),
  },
  typeChip: {
    flexDirection: "row",
    alignItems: "center",
    gap: scale(6),
    backgroundColor: "#F4F7F6",
    paddingVertical: scale(8),
    paddingHorizontal: scale(16),
    borderRadius: scale(12),
    borderWidth: 1,
    borderColor: "#EAEAEA",
  },
  typeChipActive: {
    backgroundColor: "#0A8754",
    borderColor: "#0A8754",
  },
  typeText: {
    fontSize: scale(13),
    fontWeight: "700",
    color: "#666",
  },
  typeTextActive: {
    color: "#fff",
  },
  sectionTitle: {
    fontSize: scale(17),
    fontWeight: "800",
    color: "#111",
    marginBottom: scale(15),
  },
  paymentOptionsStack: {
    marginTop: scale(5),
  },
  paymentOption: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    padding: scale(14),
    borderRadius: scale(14),
    borderWidth: 1,
    borderColor: "#F0F0F0",
    marginBottom: scale(10),
    backgroundColor: "#FCFCFC",
  },
  paymentOptionActive: {
    borderColor: "#0A8754",
    backgroundColor: "#F4FAF8",
  },
  paymentOptionDisabled: {
    opacity: 0.7,
  },
  paymentLeft: {
    flexDirection: "row",
    alignItems: "center",
  },
  paymentName: {
    fontSize: scale(15),
    fontWeight: "700",
    color: "#444",
  },
  paymentNameActive: {
    color: "#111",
  },
  paymentSub: {
    fontSize: scale(11),
    color: "#888",
    marginTop: scale(1),
    fontWeight: "500",
  },
  toggleRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingVertical: scale(12),
  },
  toggleRowActive: {
    // optional active styling
  },
  toggleLeft: {
    flexDirection: "row",
    alignItems: "center",
    gap: scale(12),
  },
  toggleTextContainer: {
    flexDirection: "column",
  },
  toggleTitle: {
    fontSize: scale(14),
    fontWeight: "700",
    color: "#333",
  },
  toggleSub: {
    fontSize: scale(11),
    color: "#888",
    fontWeight: "600",
  },
  toggleDivider: {
    height: 1,
    backgroundColor: "#F0F0F0",
    marginVertical: scale(4),
  },
  summaryContainer: {
    backgroundColor: "#fff",
    marginHorizontal: scale(16),
    borderRadius: scale(20),
    padding: scale(20),
    marginBottom: scale(16),
    elevation: 4,
    shadowColor: "#000",
    shadowOpacity: 0.06,
    shadowOffset: { width: 0, height: scale(4) },
    shadowRadius: scale(10),
  },
  itemRow: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: scale(16),
  },
  itemImage: {
    width: scale(50),
    height: scale(50),
    borderRadius: scale(12),
    backgroundColor: "#f9f9f9",
  },
  itemDetails: {
    flex: 1,
    marginLeft: scale(14),
  },
  itemName: {
    fontSize: scale(14),
    fontWeight: "700",
    color: "#333",
  },
  itemQty: {
    fontSize: scale(12),
    color: "#999",
    marginTop: scale(2),
    fontWeight: "600",
  },
  itemPrice: {
    fontSize: scale(15),
    fontWeight: "800",
    color: "#111",
  },
  paymentCard: {
    backgroundColor: "#fff",
    marginHorizontal: scale(16),
    borderRadius: scale(20),
    padding: scale(20),
    marginBottom: scale(20),
    elevation: 4,
    shadowColor: "#000",
    shadowOpacity: 0.06,
    shadowOffset: { width: 0, height: scale(4) },
    shadowRadius: scale(10),
  },
  paymentTitle: {
    fontSize: scale(17),
    fontWeight: "800",
    color: "#111",
    marginBottom: scale(15),
  },
  priceRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: scale(12),
  },
  priceLabel: {
    color: "#777",
    fontSize: scale(14),
    fontWeight: "600",
  },
  priceValue: {
    fontWeight: "700",
    color: "#333",
    fontSize: scale(14),
  },
  freeText: {
    color: "#0A8754",
    fontWeight: "800",
    fontSize: scale(13),
  },
  grandTotalRow: {
    marginTop: scale(8),
    paddingTop: scale(16),
    borderTopWidth: 1.5,
    borderTopColor: "#F4F7F6",
  },
  grandTotalLabel: {
    fontSize: scale(17),
    fontWeight: "900",
    color: "#111",
  },
  grandTotalValue: {
    fontSize: scale(20),
    fontWeight: "900",
    color: "#0A8754",
  },
  footer: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: "#fff",
    padding: scale(20),
    paddingTop: scale(15),
    borderTopLeftRadius: scale(24),
    borderTopRightRadius: scale(24),
    elevation: 25,
    shadowColor: "#000",
    shadowOpacity: 0.12,
    shadowOffset: { width: 0, height: scale(-6) },
    shadowRadius: scale(12),
  },
  btn: {
    backgroundColor: "#0A8754",
    paddingVertical: scale(18),
    borderRadius: scale(16),
    alignItems: "center",
    shadowColor: "#0A8754",
    shadowOpacity: 0.3,
    shadowOffset: { width: 0, height: scale(6) },
    shadowRadius: scale(10),
  },
  btnText: {
    color: "#fff",
    fontWeight: "800",
    fontSize: scale(17),
    letterSpacing: scale(0.5),
  },
});


