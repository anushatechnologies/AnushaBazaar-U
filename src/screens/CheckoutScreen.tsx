import React, { useState, useEffect, useCallback } from "react";
import {
  View,
  Text,
  StyleSheet,
  Pressable,
  Alert,
  ActivityIndicator,
  Image,
  ScrollView,
} from "react-native";
import { useCart } from "../context/CartContext";
import { useAuth } from "../context/AuthContext";
import { useWallet } from "../context/WalletContext";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Ionicons, MaterialCommunityIcons, FontAwesome } from "@expo/vector-icons";
import * as Location from "expo-location";
import { TextInput } from "react-native";
import { getAddresses, addAddress } from "../services/api/addresses";
import { placeOrder as placeOrderAPI } from "../services/api/orders";
import * as CartAPI from "../services/api/cart";
import LoginPromptModal from "../components/LoginPromptModal";

const CheckoutScreen = ({ navigation }: any) => {
  const { cart, total, discount, appliedCoupon, clearCart, usePoints, pointsDiscount } = useCart();
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
    houseNo: "",
    area: "",
    landmark: "",
    city: "",
    pincode: "",
    type: "Home",
  });

  const [locating, setLocating] = useState(false);
  const [selectedPayment, setSelectedPayment] = useState<string>("COD");
  const [showLoginPrompt, setShowLoginPrompt] = useState(false);

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
      setAddress(prev => ({
        ...prev,
        name: user.name || "",
        phone: user.phone || ""
      }));
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
          pincode: addr.postalCode || "",
          area: [addr.name, addr.street].filter(Boolean).join(", "),
          landmark: addr.district || "",
        }));
        Alert.alert("Location Found 📍", "Address fields updated!");
      }
    } catch (error) {
      console.error(error);
      Alert.alert("Error", "Could not fetch location.");
    } finally {
      setLocating(false);
    }
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
      const requiredFields = ["name", "phone", "houseNo", "area", "city", "pincode"];
      const missing = requiredFields.filter(f => !address[f as keyof typeof address]);

      if (missing.length > 0) {
        Alert.alert("Missing Details", "Please fill all required address fields.");
        return;
      }

      if (address.phone.length < 10) {
        Alert.alert("Invalid Phone", "Please enter a valid 10-digit mobile number.");
        return;
      }
    }

    // 3. Payment Validation
    if (!selectedPayment) {
      Alert.alert("Payment Method", "Please select a payment method to continue.");
      return;
    }

    setLoading(true);

    try {
      let finalAddressId = selectedAddressId;

      // If manual address, save it to server first and get the real ID
      if (useManualAddress) {
        const newAddress = await addAddress(jwtToken, {
          addressType: address.type.toLowerCase(),
          addressLine1: `${address.houseNo}, ${address.area}`,
          addressLine2: "",
          landmark: address.landmark,
          city: address.city,
          state: "",
          postalCode: address.pincode,
          isDefault: savedAddresses.length === 0, // Make default if first address
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
      try {
        await CartAPI.clearServerCart(jwtToken);
      } catch (_) { /* ignore clear errors */ }

      for (const item of cart) {
        const variantId = Number(item.variantId || item.id);
        const productId = Number(item.productId || item.id);
        if (!variantId || !productId) {
          console.warn("[Checkout] Skipping item missing variantId/productId:", item.name);
          continue;
        }
        try {
          await CartAPI.addCartItem(jwtToken, variantId, item.quantity, productId);
        } catch (syncErr) {
          console.warn("[Checkout] Re-sync item failed:", item.name, syncErr);
        }
      }
      // ────────────────────────────────────────────────────────────────────

      // POST /api/orders – body is ONLY addressId + paymentMethod per API spec
      const orderResult = await placeOrderAPI(jwtToken, finalAddressId!, selectedPayment);

      // Handle Points Redemption
      if (usePoints && pointsDiscount > 0) {
        await spendPoints(pointsDiscount);
      }

      // Handle Points Earning (1 coin per ₹100)
      const pointsEarned = Math.floor(total / 100);
      if (pointsEarned > 0) {
        await addPoints(pointsEarned);
      }

      clearCart();
      setLoading(false);
      
      // Navigate to OrderSuccess
      const orderId = orderResult?.id || orderResult?.orderId || ("AB-" + Math.floor(1000 + Math.random() * 9000));
      navigation.replace("OrderSuccess", { 
        orderId, 
        totalPaid: total.toFixed(2),
        pointsEarned,
        items: [...cart]
      });
    } catch (error: any) {
      setLoading(false);
      console.error("Place order error:", error);
      Alert.alert("Order Failed", error.message || "Something went wrong. Please try again.");
    }
  };

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 100 }}>
        {/* Header with Back Navigation */}
        <View style={styles.header}>
          <Pressable onPress={() => navigation.goBack()} style={styles.backBtnHeader}>
            <Ionicons name="arrow-back" size={24} color="#111" />
          </Pressable>
          <Text style={styles.title}>Final Step</Text>
          <View style={{ width: 44 }} />
        </View>

        {/* Delivery Address Section */}
        <View style={styles.sectionContainer}>
          <Text style={styles.sectionTitle}>Delivery Address</Text>

          {loadingAddresses ? (
            <ActivityIndicator size="small" color="#0A8754" style={{ marginVertical: 20 }} />
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
                      { marginBottom: 10 },
                    ]}
                    onPress={() => setSelectedAddressId(addr.id)}
                  >
                    <View style={styles.paymentLeft}>
                      <Ionicons
                        name={(addr.addressType || "home") === "home" ? "home-outline" : (addr.addressType || "") === "work" ? "briefcase-outline" : "location-outline"}
                        size={20}
                        color={isSelected ? "#0A8754" : "#666"}
                      />
                      <View style={{ marginLeft: 12, flex: 1 }}>
                        <Text style={[styles.paymentName, isSelected && styles.paymentNameActive]}>
                          {(addr.addressType || "Home").charAt(0).toUpperCase() + (addr.addressType || "Home").slice(1)}
                        </Text>
                        <Text style={styles.paymentSub} numberOfLines={2}>{fullAddr}</Text>
                      </View>
                    </View>
                    <Ionicons
                      name={isSelected ? "radio-button-on" : "radio-button-off"}
                      size={22}
                      color={isSelected ? "#0A8754" : "#ccc"}
                    />
                  </Pressable>
                );
              })}
              <Pressable
                style={{ alignSelf: "center", marginTop: 4 }}
                onPress={() => setUseManualAddress(true)}
              >
                <Text style={{ color: "#0A8754", fontWeight: "700", fontSize: 13 }}>+ Enter address manually</Text>
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
                  <Ionicons name="location" size={14} color="#0A8754" />
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
                    placeholder="10-digit number"
                    keyboardType="phone-pad"
                    maxLength={10}
                    value={address.phone}
                    onChangeText={(t) => updateAddress("phone", t)}
                  />
                </View>
              </View>

              <View style={styles.inputBox}>
                <Text style={styles.label}>House No. / Flat / Floor *</Text>
                <TextInput
                  style={styles.input}
                  placeholder="e.g. Flat 101, Blue Plaza"
                  value={address.houseNo}
                  onChangeText={(t) => updateAddress("houseNo", t)}
                />
              </View>

              <View style={styles.inputBox}>
                <Text style={styles.label}>Area / Colony / Street *</Text>
                <TextInput
                  style={styles.input}
                  placeholder="e.g. Shanti Nagar"
                  value={address.area}
                  onChangeText={(t) => updateAddress("area", t)}
                />
              </View>

              <View style={styles.inputBox}>
                <Text style={styles.label}>Landmark (Optional)</Text>
                <TextInput
                  style={styles.input}
                  placeholder="e.g. Near City Mall"
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
                    value={address.city}
                    onChangeText={(t) => updateAddress("city", t)}
                  />
                </View>
                <View style={[styles.inputBox, { flex: 1 }]}>
                  <Text style={styles.label}>Pincode *</Text>
                  <TextInput
                    style={styles.input}
                    placeholder="Pincode"
                    keyboardType="number-pad"
                    maxLength={6}
                    value={address.pincode}
                    onChangeText={(t) => updateAddress("pincode", t)}
                  />
                </View>
              </View>

              {savedAddresses.length > 0 && (
                <Pressable
                  style={{ alignSelf: "center", marginTop: 4 }}
                  onPress={() => setUseManualAddress(false)}
                >
                  <Text style={{ color: "#0A8754", fontWeight: "700", fontSize: 13 }}>← Use saved address</Text>
                </Pressable>
              )}
            </>
          )}
        </View>

        {/* Payment Methods Section */}
        <View style={styles.sectionContainer}>
          <Text style={styles.sectionTitle}>Payment Method</Text>

          <View style={styles.paymentOptionsStack}>
            {/* COD Option - Now the Only Option */}
            <Pressable
              style={[styles.paymentOption, styles.paymentOptionActive]}
              onPress={() => setSelectedPayment("COD")}
            >
              <View style={styles.paymentLeft}>
                <Ionicons name="cash-outline" size={20} color="#0A8754" />
                <View style={{ marginLeft: 12 }}>
                  <Text style={[styles.paymentName, styles.paymentNameActive]}>Cash on Delivery</Text>
                  <Text style={styles.paymentSub}>Pay at your doorstep</Text>
                </View>
              </View>
              <Ionicons
                name="radio-button-on"
                size={22}
                color="#0A8754"
              />
            </Pressable>
            
            <View style={styles.infoAlert}>
              <Ionicons name="information-circle-outline" size={16} color="#0A8754" />
              <Text style={styles.infoText}>Online payments are currently disabled</Text>
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
          {/* DISABLED: Reward coins hidden 
          {usePoints && pointsDiscount > 0 && (
            <View style={styles.priceRow}>
              <Text style={styles.priceLabel}>Anusha Coins</Text>
              <Text style={[styles.priceValue, { color: "#0A8754" }]}>-₹{pointsDiscount.toFixed(2)}</Text>
            </View>
          )} 
          */}

          <View style={styles.priceRow}>
            <Text style={styles.priceLabel}>Delivery Charge</Text>
            <Text style={styles.freeText}>FREE</Text>
          </View>
          <View style={[styles.priceRow, styles.grandTotalRow]}>
            <Text style={styles.grandTotalLabel}>Grand Total</Text>
            <Text style={styles.grandTotalValue}>₹{total.toFixed(2)}</Text>
          </View>
        </View>
      </ScrollView>

      <View style={[styles.footer, { paddingBottom: Math.max(insets.bottom, 20) }]}>
        <Pressable
          style={styles.btn}
          onPress={placeOrder}
          disabled={loading}
        >
          {loading ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <Text style={styles.btnText}>
              Place Order • ₹{total}
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
    fontSize: 22,
    fontWeight: "900",
    color: "#111",
    textAlign: "center",
    letterSpacing: -0.5,
    paddingTop: 0,
    paddingBottom: 0,
    flex: 1,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    paddingVertical: 15,
  },
  backBtnHeader: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: "#fff",
    justifyContent: "center",
    alignItems: "center",
    elevation: 2,
    shadowColor: "#000",
    shadowOpacity: 0.1,
    shadowOffset: { width: 0, height: 2 },
    shadowRadius: 4,
  },
  infoAlert: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#E9F7F1",
    padding: 12,
    borderRadius: 12,
    marginTop: 10,
    gap: 8,
  },
  infoText: {
    color: "#0A8754",
    fontSize: 12,
    fontWeight: "600",
  },
  sectionContainer: {
    backgroundColor: "#fff",
    marginHorizontal: 16,
    borderRadius: 20,
    padding: 20,
    marginBottom: 16,
    elevation: 4,
    shadowColor: "#000",
    shadowOpacity: 0.06,
    shadowOffset: { width: 0, height: 4 },
    shadowRadius: 10,
  },
  sectionHeaderRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 20,
  },
  locationBtn: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#E9F7F1",
    paddingVertical: 6,
    paddingHorizontal: 10,
    borderRadius: 8,
    gap: 4,
  },
  locationBtnText: {
    color: "#0A8754",
    fontSize: 12,
    fontWeight: "700",
  },
  inputGrid: {
    flexDirection: "row",
    gap: 12,
  },
  inputBox: {
    marginBottom: 16,
  },
  label: {
    fontSize: 12,
    fontWeight: "700",
    color: "#888",
    marginBottom: 6,
    textTransform: "uppercase",
  },
  input: {
    backgroundColor: "#F4F7F6",
    borderRadius: 12,
    paddingHorizontal: 15,
    paddingVertical: 12,
    fontSize: 14,
    color: "#333",
    fontWeight: "600",
    borderWidth: 1,
    borderColor: "#EAEAEA",
  },
  typeRow: {
    flexDirection: "row",
    gap: 10,
    marginTop: 8,
  },
  typeChip: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    backgroundColor: "#F4F7F6",
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#EAEAEA",
  },
  typeChipActive: {
    backgroundColor: "#0A8754",
    borderColor: "#0A8754",
  },
  typeText: {
    fontSize: 13,
    fontWeight: "700",
    color: "#666",
  },
  typeTextActive: {
    color: "#fff",
  },
  sectionTitle: {
    fontSize: 17,
    fontWeight: "800",
    color: "#111",
    marginBottom: 15,
  },
  paymentOptionsStack: {
    marginTop: 5,
  },
  paymentOption: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    padding: 14,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: "#F0F0F0",
    marginBottom: 10,
    backgroundColor: "#FCFCFC",
  },
  paymentOptionActive: {
    borderColor: "#0A8754",
    backgroundColor: "#F4FAF8",
  },
  paymentLeft: {
    flexDirection: "row",
    alignItems: "center",
  },
  paymentName: {
    fontSize: 15,
    fontWeight: "700",
    color: "#444",
  },
  paymentNameActive: {
    color: "#111",
  },
  paymentSub: {
    fontSize: 11,
    color: "#888",
    marginTop: 1,
    fontWeight: "500",
  },
  summaryContainer: {
    backgroundColor: "#fff",
    marginHorizontal: 16,
    borderRadius: 20,
    padding: 20,
    marginBottom: 16,
    elevation: 4,
    shadowColor: "#000",
    shadowOpacity: 0.06,
    shadowOffset: { width: 0, height: 4 },
    shadowRadius: 10,
  },
  itemRow: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 16,
  },
  itemImage: {
    width: 50,
    height: 50,
    borderRadius: 12,
    backgroundColor: "#f9f9f9",
  },
  itemDetails: {
    flex: 1,
    marginLeft: 14,
  },
  itemName: {
    fontSize: 14,
    fontWeight: "700",
    color: "#333",
  },
  itemQty: {
    fontSize: 12,
    color: "#999",
    marginTop: 2,
    fontWeight: "600",
  },
  itemPrice: {
    fontSize: 15,
    fontWeight: "800",
    color: "#111",
  },
  paymentCard: {
    backgroundColor: "#fff",
    marginHorizontal: 16,
    borderRadius: 20,
    padding: 20,
    marginBottom: 20,
    elevation: 4,
    shadowColor: "#000",
    shadowOpacity: 0.06,
    shadowOffset: { width: 0, height: 4 },
    shadowRadius: 10,
  },
  paymentTitle: {
    fontSize: 17,
    fontWeight: "800",
    color: "#111",
    marginBottom: 15,
  },
  priceRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 12,
  },
  priceLabel: {
    color: "#777",
    fontSize: 14,
    fontWeight: "600",
  },
  priceValue: {
    fontWeight: "700",
    color: "#333",
    fontSize: 14,
  },
  freeText: {
    color: "#0A8754",
    fontWeight: "800",
    fontSize: 13,
  },
  grandTotalRow: {
    marginTop: 8,
    paddingTop: 16,
    borderTopWidth: 1.5,
    borderTopColor: "#F4F7F6",
  },
  grandTotalLabel: {
    fontSize: 17,
    fontWeight: "900",
    color: "#111",
  },
  grandTotalValue: {
    fontSize: 20,
    fontWeight: "900",
    color: "#0A8754",
  },
  footer: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: "#fff",
    padding: 20,
    paddingTop: 15,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    elevation: 25,
    shadowColor: "#000",
    shadowOpacity: 0.12,
    shadowOffset: { width: 0, height: -6 },
    shadowRadius: 12,
  },
  btn: {
    backgroundColor: "#0A8754",
    paddingVertical: 18,
    borderRadius: 16,
    alignItems: "center",
    shadowColor: "#0A8754",
    shadowOpacity: 0.3,
    shadowOffset: { width: 0, height: 6 },
    shadowRadius: 10,
  },
  btnText: {
    color: "#fff",
    fontWeight: "800",
    fontSize: 17,
    letterSpacing: 0.5,
  },
});