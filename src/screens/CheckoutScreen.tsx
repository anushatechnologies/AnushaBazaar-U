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
} from "react-native";
import { useCart } from "../context/CartContext";
import { useAuth } from "../context/AuthContext";
import { useWallet } from "../context/WalletContext";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import * as Location from "expo-location";
import { getAddresses, addAddress } from "../services/api/addresses";
import { placeOrder as placeOrderAPI } from "../services/api/orders";
import { initiateOnlinePayment } from "../services/api/payments";
import {
  getEasebuzzResultMessage,
  isEasebuzzAvailable,
  isEasebuzzSuccess,
  startEasebuzzCheckout,
} from "../services/easebuzz";
import LoginPromptModal from "../components/LoginPromptModal";
import { scale } from "../utils/responsive";

const CheckoutScreen = ({ navigation }: any) => {
  const { cart, subtotal, deliveryCharge, total, discount, appliedCoupon, clearCart, usePoints, pointsDiscount } = useCart();
  const { user, jwtToken } = useAuth();
  const { addPoints, spendPoints } = useWallet();
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

  const [locating, setLocating] = useState(false);
  const [selectedPayment, setSelectedPayment] = useState<string>("COD");
  const [showLoginPrompt, setShowLoginPrompt] = useState(false);
  const onlinePaymentAvailable = isEasebuzzAvailable();

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

  const applyWalletChanges = async () => {
    const pointsEarned = calculatePointsEarned();

    try {
      if (usePoints && pointsDiscount > 0) {
        await spendPoints(pointsDiscount);
      }

      if (pointsEarned > 0) {
        await addPoints(pointsEarned);
      }
    } catch (walletError) {
      console.error("Wallet sync warning:", walletError);
    }

    return pointsEarned;
  };

  const finalizeSuccessfulOrder = async (
    orderId: number | string,
    orderedItems: any[],
    orderNumber?: string,
    totalPaid?: number | string
  ) => {
    const pointsEarned = await applyWalletChanges();

    clearCart();
    setLoading(false);

    navigation.replace("OrderSuccess", {
      orderId,
      orderNumber,
      totalPaid: totalPaid != null ? String(totalPaid) : total.toFixed(2),
      pointsEarned,
      items: orderedItems,
    });
  };

  const handleExistingOnlineOrder = (
    orderId: number | string,
    orderNumber: string | undefined,
    title: string,
    message: string
  ) => {
    clearCart();
    setLoading(false);

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
    }

    // 3. Payment Validation
    if (!selectedPayment) {
      Alert.alert("Payment Method", "Please select a payment method to continue.");
      return;
    }

    if (selectedPayment === "ONLINE" && !onlinePaymentAvailable) {
      Alert.alert(
        "Online payment setup required",
        "Install the latest Android build with the Easebuzz SDK to use UPI, cards, and net banking."
      );
      return;
    }

    setLoading(true);

    try {
      let finalAddressId = selectedAddressId;
      const orderedItems = cart.map((item: any) => ({ ...item }));

      // If manual address, save it to server first and get the real ID
      if (useManualAddress) {
        const newAddress = await addAddress(jwtToken, {
          addressType: address.type,
          addressLine1: address.addressLine1.trim(),
          addressLine2: address.addressLine2.trim(),
          landmark: address.landmark.trim(),
          city: address.city.trim(),
          state: address.state.trim(),
          postalCode: address.pincode.trim(),
          isDefault: savedAddresses.length === 0,
        });

        if (!newAddress || !newAddress.id) {
          setLoading(false);
          Alert.alert("Error", "Could not save your address. Please try again.");
          return;
        }
        finalAddressId = newAddress.id;
      }

      // ────────────────────────────────────────────────────────────────────
      // PERMANENT FIX: The backend reads cart_items from DB to create order_items.
      // The DB column 'product_id' cannot be null. We re-upload every cart item
      // with productId right before placing the order to guarantee the DB has it.
      // ────────────────────────────────────────────────────────────────────
      // ────────────────────────────────────────────────────────────────────

      // POST /api/orders – body is ONLY addressId + paymentMethod per API spec
      // We also pass coupon details so backend can record usage
      const orderResult = await placeOrderAPI(
        jwtToken, 
        finalAddressId!, 
        selectedPayment,
        appliedCoupon || undefined,
        appliedCoupon ? discount : undefined
      );
      const orderId = orderResult?.id || orderResult?.orderId;

      if (!orderId) {
        throw new Error("Order response did not include an order ID.");
      }

      if (selectedPayment === "ONLINE") {
        if (total === 0) {
          Alert.alert("Invalid Amount", "Your total order amount is zero. Online payments cannot be processed without a valid amount.");
          setLoading(false);
          return;
        }

        try {
          const paymentInit = await initiateOnlinePayment(jwtToken, orderId);
          const paymentResult = await startEasebuzzCheckout(paymentInit.access_key);

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
          return;
        }
      }

      await finalizeSuccessfulOrder(orderId, orderedItems, orderResult?.orderNumber, orderResult?.grandTotal);
      return;

    } catch (error: any) {
      setLoading(false);
      console.error("Place order error:", error);
      Alert.alert("Order Failed", error.message || "Something went wrong. Please try again.");
    }
  };

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: scale(100) }}>
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
                !onlinePaymentAvailable && styles.paymentOptionDisabled,
              ]}
              onPress={() => {
                if (!onlinePaymentAvailable) {
                  Alert.alert(
                    "Online payment setup required",
                    "Install the latest Android build with the Easebuzz SDK to use UPI, cards, and net banking."
                  );
                  return;
                }

                setSelectedPayment("ONLINE");
              }}
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
                    {onlinePaymentAvailable
                      ? "UPI, cards, and net banking via Easebuzz"
                      : "Requires the latest Android build with native SDK"}
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
                {onlinePaymentAvailable
                  ? "Online orders are placed first, then Easebuzz opens securely for payment."
                  : "Rebuild the Android app after installing these changes to enable Easebuzz online payments."}
              </Text>
            </View>
          </View>
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
          {appliedCoupon && discount > 0 && (
            <View style={styles.priceRow}>
              <Text style={[styles.priceLabel, { color: "#0A8754" }]}>Coupon: {appliedCoupon}</Text>
              <Text style={[styles.priceValue, { color: "#0A8754" }]}>-₹{discount.toFixed(2)}</Text>
            </View>
          )}

          <View style={styles.priceRow}>
            <Text style={styles.priceLabel}>Delivery Charge</Text>
            <Text style={styles.priceValue}>{deliveryCharge.toFixed(2)}</Text>
          </View>
          <View style={[styles.priceRow, styles.grandTotalRow]}>
            <Text style={styles.grandTotalLabel}>Grand Total</Text>
            <Text style={styles.grandTotalValue}>₹{total.toFixed(2)}</Text>
          </View>
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
              {selectedPayment === "ONLINE" ? `Pay Online \u2022 \u20B9${total}` : `Place Order \u2022 \u20B9${total}`}
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
    </View>
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
