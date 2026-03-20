import React, { useState } from "react";
import {
  View,
  Text,
  FlatList,
  StyleSheet,
  Pressable,
  Image,
  TextInput,
  TouchableOpacity,
  Alert,
  ScrollView,
} from "react-native";
import { useNavigation } from "@react-navigation/native";
import { useAuth } from "../context/AuthContext";
import { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { RootStackParamList } from "../navigation/RootStack";
import { useWallet } from "../context/WalletContext";
import { useCart } from "../context/CartContext";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import LoginPromptModal from "../components/LoginPromptModal";

type NavigationProp = NativeStackNavigationProp<
  RootStackParamList,
  "Checkout"
>;

const CartScreen = () => {
  const navigation = useNavigation<NavigationProp>();
  const { user } = useAuth();
  const { 
    cart, 
    increaseQty, 
    decreaseQty, 
    clearCart,
    total, 
    discount, 
    appliedCoupon, 
    applyCoupon, 
    removeCoupon,
  } = useCart();
  const insets = useSafeAreaInsets();
  const [couponInput, setCouponInput] = useState("");
  const [showLoginPrompt, setShowLoginPrompt] = useState(false);

  const handleApplyCoupon = () => {
    if (!couponInput.trim()) {
      Alert.alert("Error", "Please enter a coupon code.");
      return;
    }
    const result = applyCoupon(couponInput);
    if (result.success) {
      setCouponInput("");
      Alert.alert("Success", result.message);
    } else {
      Alert.alert("Sorry", result.message);
    }
  };

  const handleApplyCouponCode = (code: string) => {
    const result = applyCoupon(code);
    if (result.success) {
      Alert.alert("Success", result.message);
    } else {
      Alert.alert("Sorry", result.message);
    }
  };

  const renderCartItem = ({ item }: { item: any }) => (
    <View style={styles.cartCard}>
      <View style={styles.cardContent}>
        <Image
          source={
            typeof item.image === "string" ? { uri: item.image } :
              (item.imageUrl ? { uri: item.imageUrl } : 
                (item.image ? item.image : { uri: "https://via.placeholder.com/150" }))
          }
          style={styles.productImg}
        />
        <View style={styles.productInfo}>
          <Text style={styles.productName} numberOfLines={1}>{item.name}</Text>
          {item.variantName && <Text style={styles.variantTag}>{item.variantName}</Text>}
          <Text style={styles.itemPrice}>₹{item.price}</Text>
        </View>
        <View style={styles.qtyControl}>
          <TouchableOpacity 
            style={styles.qtyAction} 
            onPress={() => decreaseQty(item.id)}
            activeOpacity={0.7}
          >
            <Ionicons name={item.quantity > 1 ? "remove" : "trash-outline"} size={16} color="#0A8754" />
          </TouchableOpacity>
          <Text style={styles.qtyValue}>{item.quantity}</Text>
          <TouchableOpacity 
            style={styles.qtyAction} 
            onPress={() => increaseQty(item.id)}
            activeOpacity={0.7}
          >
            <Ionicons name="add" size={16} color="#0A8754" />
          </TouchableOpacity>
        </View>
      </View>
    </View>
  );

  return (
    <View style={styles.root}>
      {/* --- HEADER --- */}
      <View style={[styles.navBar, { paddingTop: Math.max(insets.top, 10) }]}>
        <TouchableOpacity
          onPress={() => navigation.goBack()}
          style={styles.roundBtn}
        >
          <Ionicons name="chevron-back" size={22} color="#111" />
        </TouchableOpacity>
        <Text style={styles.navTitle}>Review Cart</Text>
        <TouchableOpacity 
          onPress={() => {
            Alert.alert("Clear Cart?", "Are you sure you want to remove all items?", [
              { text: "Cancel", style: "cancel" },
              { text: "Clear", style: "destructive", onPress: clearCart }
            ]);
          }}
          disabled={cart.length === 0}
        >
          <Ionicons name="trash-outline" size={20} color={cart.length > 0 ? "#EF4444" : "#ccc"} />
        </TouchableOpacity>
      </View>

      {cart.length > 0 ? (
        <View style={{ flex: 1 }}>
          <FlatList
            data={cart}
            keyExtractor={(item) => item.id}
            showsVerticalScrollIndicator={false}
            contentContainerStyle={styles.listContainer}
            ListHeaderComponent={
              <Text style={styles.sectionHeader}>Your Items ({cart.length})</Text>
            }
            renderItem={renderCartItem}
            ListFooterComponent={<View style={{ height: 350 }} />}
          />

          {/* --- PREMIUM STICKY FOOTER --- */}
          <View style={[styles.stickyFooter, { paddingBottom: Math.max(insets.bottom, 20) }]}>
            {/* Coupon Bar */}
            <View style={styles.couponBar}>
              <Ionicons name="ticket-outline" size={20} color="#0A8754" style={{ marginRight: 10 }} />
              <TextInput
                style={styles.couponInputBox}
                placeholder="PROMO CODE"
                placeholderTextColor="#999"
                value={couponInput}
                onChangeText={setCouponInput}
                autoCapitalize="characters"
              />
              {appliedCoupon ? (
                <TouchableOpacity onPress={removeCoupon} style={styles.promoAction}>
                  <Text style={[styles.promoActionText, { color: "#EF4444" }]}>Remove</Text>
                </TouchableOpacity>
              ) : (
                <TouchableOpacity onPress={handleApplyCoupon} style={styles.promoAction}>
                  <Text style={styles.promoActionText}>Apply</Text>
                </TouchableOpacity>
              )}
            </View>


            {/* Summary & Checkout */}
            <View style={styles.summaryBox}>
              <View style={styles.billLine}>
                <Text style={styles.billKey}>Basket Total</Text>
                <Text style={styles.billValue}>₹{(total + discount).toFixed(2)}</Text>
              </View>
              {discount > 0 && (
                <View style={styles.billLine}>
                  <Text style={styles.billKey}>Total Savings</Text>
                  <Text style={[styles.billValue, { color: "#0A8754" }]}>-₹{discount.toFixed(2)}</Text>
                </View>
              )}
              
              <TouchableOpacity
                style={styles.primaryCheckoutBtn}
                activeOpacity={0.9}
                onPress={() => {
                  if (!user) {
                    setShowLoginPrompt(true);
                  } else {
                    navigation.navigate("Checkout");
                  }
                }}
              >
                <View style={styles.checkoutLabelStack}>
                  <Text style={styles.checkoutPrice}>₹{total.toFixed(2)}</Text>
                  <Text style={styles.checkoutSub}>Total Payable</Text>
                </View>
                <View style={styles.checkoutBtnTextRow}>
                  <Text style={styles.checkoutMainText}>Checkout</Text>
                  <Ionicons name="arrow-forward" size={20} color="#fff" style={{ marginLeft: 6 }} />
                </View>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      ) : (
        <View style={styles.emptyView}>
          <View style={styles.emptyIllustration}>
            <View style={styles.emptyCircle}>
              <Ionicons name="cart" size={70} color="#0A8754" />
            </View>
            <View style={[styles.decorDot, { top: 10, right: 10, width: 12, height: 12, backgroundColor: "#FBBF24" }]} />
            <View style={[styles.decorDot, { bottom: 20, left: -10, width: 8, height: 8, backgroundColor: "#3B82F6" }]} />
            <View style={[styles.decorDot, { top: 40, left: -20, width: 6, height: 6, backgroundColor: "#F87171" }]} />
          </View>
          
          <Text style={styles.emptyHeading}>Your basket is feeling lonely</Text>
          <Text style={styles.emptySubtext}>
            Fill it with the best groceries, snacks, and more from Anusha Bazaar!
          </Text>
          
          <TouchableOpacity 
            style={styles.shopNowBtn}
            onPress={() => navigation.navigate("MainTabs")}
            activeOpacity={0.8}
          >
            <Text style={styles.shopNowText}>Start Shopping</Text>
            <Ionicons name="arrow-forward" size={18} color="#fff" style={{ marginLeft: 8 }} />
          </TouchableOpacity>
        </View>
      )}

      <LoginPromptModal
        isVisible={showLoginPrompt}
        onClose={() => setShowLoginPrompt(false)}
        onLogin={() => {
          setShowLoginPrompt(false);
          navigation.navigate("Login");
        }}
      />
    </View>
  );
};

export default CartScreen;

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: "#F9FBFC",
  },
  navBar: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    paddingBottom: 12,
    backgroundColor: "#fff",
    borderBottomWidth: 1,
    borderBottomColor: "#F0F0F0",
  },
  roundBtn: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: "#F3F4F6",
    justifyContent: "center",
    alignItems: "center",
  },
  navTitle: {
    fontSize: 18,
    fontWeight: "800",
    color: "#111",
    letterSpacing: -0.5,
  },
  listContainer: {
    paddingBottom: 40,
  },
  sectionHeader: {
    fontSize: 15,
    fontWeight: "900",
    color: "#4B5563",
    marginHorizontal: 16,
    marginTop: 20,
    marginBottom: 12,
    textTransform: "uppercase",
    letterSpacing: 1.2,
  },
  offersSection: {
    backgroundColor: "#fff",
    paddingVertical: 15,
    borderBottomWidth: 1,
    borderBottomColor: "#F0F0F0",
  },
  offersRow: {
    paddingLeft: 16,
    paddingRight: 8,
    gap: 12,
  },
  offerTab: {
    backgroundColor: "#F9FBFC",
    paddingHorizontal: 14,
    paddingVertical: 12,
    borderRadius: 14,
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    borderLeftWidth: 4,
    minWidth: 160,
    borderWidth: 1,
    borderColor: "#F0F0F0",
  },
  tabCode: {
    fontSize: 13,
    fontWeight: "800",
    color: "#111",
  },
  tabSubText: {
    fontSize: 11,
    color: "#6B7280",
    fontWeight: "500",
  },
  cartCard: {
    backgroundColor: "#fff",
    marginHorizontal: 16,
    marginBottom: 12,
    borderRadius: 20,
    padding: 12,
    borderWidth: 1,
    borderColor: "#F0F0F0",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.04,
    shadowRadius: 10,
    elevation: 3,
  },
  cardContent: {
    flexDirection: "row",
    alignItems: "center",
  },
  productImg: {
    width: 76,
    height: 76,
    borderRadius: 14,
    backgroundColor: "#F9FBFC",
  },
  productInfo: {
    flex: 1,
    marginLeft: 14,
  },
  productName: {
    fontSize: 15,
    fontWeight: "700",
    color: "#111",
  },
  variantTag: {
    fontSize: 11,
    color: "#6B7280",
    backgroundColor: "#F3F4F6",
    alignSelf: "flex-start",
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 6,
    marginTop: 4,
  },
  itemPrice: {
    fontSize: 17,
    fontWeight: "800",
    color: "#0A8754",
    marginTop: 6,
  },
  qtyControl: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#F0FDF4",
    borderRadius: 12,
    padding: 4,
    borderWidth: 1,
    borderColor: "#DCFCE7",
  },
  qtyAction: {
    width: 32,
    height: 32,
    justifyContent: "center",
    alignItems: "center",
    borderRadius: 8,
    backgroundColor: "#fff",
  },
  qtyValue: {
    fontSize: 14,
    fontWeight: "900",
    color: "#0A8754",
    paddingHorizontal: 12,
  },
  stickyFooter: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: "rgba(255,255,255,0.98)",
    paddingHorizontal: 20,
    paddingTop: 16,
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: -12 },
    shadowOpacity: 0.12,
    shadowRadius: 24,
    elevation: 20,
    borderWidth: 1,
    borderColor: "#F0F0F0",
  },
  couponBar: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#F9FBFC",
    borderRadius: 16,
    paddingHorizontal: 14,
    height: 54,
    borderWidth: 1,
    borderColor: "#F0F0F0",
    marginBottom: 14,
  },
  couponInputBox: {
    flex: 1,
    fontSize: 13,
    fontWeight: "800",
    color: "#111",
    letterSpacing: 1,
  },
  promoAction: {
    paddingHorizontal: 10,
  },
  promoActionText: {
    fontSize: 13,
    fontWeight: "900",
    color: "#0A8754",
    textTransform: "uppercase",
  },
  pointsWrapper: {
    marginBottom: 16,
  },
  pointsBadge: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#FFFBEB",
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 8,
    alignSelf: "flex-start",
    marginBottom: 8,
    gap: 4,
  },
  pointsBadgeText: {
    fontSize: 10,
    fontWeight: "800",
    color: "#D97706",
    textTransform: "uppercase",
  },
  switchRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  pointsLabel: {
    fontSize: 14,
    fontWeight: "600",
    color: "#374151",
  },
  customSwitch: {
    width: 48,
    height: 26,
    borderRadius: 13,
    backgroundColor: "#E5E7EB",
    padding: 2,
    justifyContent: "center",
  },
  customSwitchOn: {
    backgroundColor: "#0A8754",
  },
  switchPointer: {
    width: 22,
    height: 22,
    borderRadius: 11,
    backgroundColor: "#fff",
    shadowColor: "#000",
    shadowOpacity: 0.2,
    shadowRadius: 2,
    elevation: 2,
  },
  switchPointerOn: {
    marginLeft: 22,
  },
  summaryBox: {
    marginTop: 4,
  },
  billLine: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 6,
  },
  billKey: {
    fontSize: 13,
    color: "#6B7280",
    fontWeight: "500",
  },
  billValue: {
    fontSize: 13,
    color: "#1F2937",
    fontWeight: "700",
  },
  primaryCheckoutBtn: {
    backgroundColor: "#0A8754",
    height: 64,
    borderRadius: 18,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 20,
    marginTop: 14,
    shadowColor: "#0A8754",
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.3,
    shadowRadius: 16,
    elevation: 8,
  },
  checkoutLabelStack: {
    justifyContent: "center",
  },
  checkoutPrice: {
    fontSize: 19,
    fontWeight: "900",
    color: "#fff",
  },
  checkoutSub: {
    fontSize: 10,
    color: "rgba(255,255,255,0.7)",
    fontWeight: "600",
    textTransform: "uppercase",
    letterSpacing: 0.5,
  },
  checkoutBtnTextRow: {
    flexDirection: "row",
    alignItems: "center",
  },
  checkoutMainText: {
    fontSize: 17,
    fontWeight: "900",
    color: "#fff",
  },
  emptyView: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 40,
    backgroundColor: "#fff",
  },
  emptyIllustration: {
    position: "relative",
    marginBottom: 30,
  },
  emptyCircle: {
    width: 150,
    height: 150,
    borderRadius: 75,
    backgroundColor: "#F0FDF4",
    justifyContent: "center",
    alignItems: "center",
    borderWidth: 2,
    borderColor: "#DCFCE7",
  },
  decorDot: {
    position: "absolute",
    borderRadius: 10,
  },
  emptyHeading: {
    fontSize: 24,
    fontWeight: "900",
    color: "#111827",
    marginBottom: 12,
    textAlign: "center",
    letterSpacing: -0.5,
  },
  emptySubtext: {
    fontSize: 15,
    color: "#6B7280",
    textAlign: "center",
    lineHeight: 22,
    marginBottom: 40,
    paddingHorizontal: 10,
  },
  shopNowBtn: {
    backgroundColor: "#0A8754",
    paddingVertical: 18,
    paddingHorizontal: 40,
    borderRadius: 20,
    flexDirection: "row",
    alignItems: "center",
    shadowColor: "#0A8754",
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.3,
    shadowRadius: 20,
    elevation: 8,
  },
  shopNowText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "800",
  },
});