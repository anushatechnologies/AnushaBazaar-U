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
import { scale } from "../utils/responsive";

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
            <Ionicons name={item.quantity > 1 ? "remove" : "trash-outline"} size={scale(16)} color="#0A8754" />
          </TouchableOpacity>
          <Text style={styles.qtyValue}>{item.quantity}</Text>
          <TouchableOpacity 
            style={styles.qtyAction} 
            onPress={() => increaseQty(item.id)}
            activeOpacity={0.7}
          >
            <Ionicons name="add" size={scale(16)} color="#0A8754" />
          </TouchableOpacity>
        </View>
      </View>
    </View>
  );

  return (
    <View style={styles.root}>
      {/* --- HEADER --- */}
      <View style={[styles.navBar, { paddingTop: Math.max(insets.top, scale(10)) }]}>
        <TouchableOpacity
          onPress={() => navigation.goBack()}
          style={styles.roundBtn}
        >
          <Ionicons name="chevron-back" size={scale(22)} color="#111" />
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
          <Ionicons name="trash-outline" size={scale(20)} color={cart.length > 0 ? "#EF4444" : "#ccc"} />
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
            ListFooterComponent={<View style={{ height: scale(350) }} />}
          />

          {/* --- PREMIUM STICKY FOOTER --- */}
          <View style={[styles.stickyFooter, { paddingBottom: Math.max(insets.bottom, scale(20)) }]}>
            {/* Coupon Bar */}
            <View style={styles.couponBar}>
              <Ionicons name="ticket-outline" size={scale(20)} color="#0A8754" style={{ marginRight: scale(10) }} />
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
                  <Ionicons name="arrow-forward" size={scale(20)} color="#fff" style={{ marginLeft: scale(6) }} />
                </View>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      ) : (
        <View style={styles.emptyView}>
          <View style={styles.emptyIllustration}>
            <View style={styles.emptyCircle}>
              <Ionicons name="cart" size={scale(70)} color="#0A8754" />
            </View>
            <View style={[styles.decorDot, { top: scale(10), right: scale(10), width: scale(12), height: scale(12), backgroundColor: "#FBBF24" }]} />
            <View style={[styles.decorDot, { bottom: scale(20), left: scale(-10), width: scale(8), height: scale(8), backgroundColor: "#3B82F6" }]} />
            <View style={[styles.decorDot, { top: scale(40), left: scale(-20), width: scale(6), height: scale(6), backgroundColor: "#F87171" }]} />
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
            <Ionicons name="arrow-forward" size={scale(18)} color="#fff" style={{ marginLeft: scale(8) }} />
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
    paddingHorizontal: scale(16),
    paddingBottom: scale(12),
    backgroundColor: "#fff",
    borderBottomWidth: 1,
    borderBottomColor: "#F0F0F0",
  },
  roundBtn: {
    width: scale(44),
    height: scale(44),
    borderRadius: scale(22),
    backgroundColor: "#F3F4F6",
    justifyContent: "center",
    alignItems: "center",
  },
  navTitle: {
    fontSize: scale(18),
    fontWeight: "800",
    color: "#111",
    letterSpacing: scale(-0.5),
  },
  listContainer: {
    paddingBottom: scale(40),
  },
  sectionHeader: {
    fontSize: scale(15),
    fontWeight: "900",
    color: "#4B5563",
    marginHorizontal: scale(16),
    marginTop: scale(20),
    marginBottom: scale(12),
    textTransform: "uppercase",
    letterSpacing: scale(1.2),
  },
  offersSection: {
    backgroundColor: "#fff",
    paddingVertical: scale(15),
    borderBottomWidth: 1,
    borderBottomColor: "#F0F0F0",
  },
  offersRow: {
    paddingLeft: scale(16),
    paddingRight: scale(8),
    gap: scale(12),
  },
  offerTab: {
    backgroundColor: "#F9FBFC",
    paddingHorizontal: scale(14),
    paddingVertical: scale(12),
    borderRadius: scale(14),
    flexDirection: "row",
    alignItems: "center",
    gap: scale(10),
    borderLeftWidth: scale(4),
    minWidth: scale(160),
    borderWidth: 1,
    borderColor: "#F0F0F0",
  },
  tabCode: {
    fontSize: scale(13),
    fontWeight: "800",
    color: "#111",
  },
  tabSubText: {
    fontSize: scale(11),
    color: "#6B7280",
    fontWeight: "500",
  },
  cartCard: {
    backgroundColor: "#fff",
    marginHorizontal: scale(16),
    marginBottom: scale(12),
    borderRadius: scale(20),
    padding: scale(12),
    borderWidth: 1,
    borderColor: "#F0F0F0",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: scale(4) },
    shadowOpacity: 0.04,
    shadowRadius: scale(10),
    elevation: 3,
  },
  cardContent: {
    flexDirection: "row",
    alignItems: "center",
  },
  productImg: {
    width: scale(76),
    height: scale(76),
    borderRadius: scale(14),
    backgroundColor: "#F9FBFC",
  },
  productInfo: {
    flex: 1,
    marginLeft: scale(14),
  },
  productName: {
    fontSize: scale(15),
    fontWeight: "700",
    color: "#111",
  },
  variantTag: {
    fontSize: scale(11),
    color: "#6B7280",
    backgroundColor: "#F3F4F6",
    alignSelf: "flex-start",
    paddingHorizontal: scale(8),
    paddingVertical: scale(2),
    borderRadius: scale(6),
    marginTop: scale(4),
  },
  itemPrice: {
    fontSize: scale(17),
    fontWeight: "800",
    color: "#0A8754",
    marginTop: scale(6),
  },
  qtyControl: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#F0FDF4",
    borderRadius: scale(12),
    padding: scale(4),
    borderWidth: 1,
    borderColor: "#DCFCE7",
  },
  qtyAction: {
    width: scale(32),
    height: scale(32),
    justifyContent: "center",
    alignItems: "center",
    borderRadius: scale(8),
    backgroundColor: "#fff",
  },
  qtyValue: {
    fontSize: scale(14),
    fontWeight: "900",
    color: "#0A8754",
    paddingHorizontal: scale(12),
  },
  stickyFooter: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: "rgba(255,255,255,0.98)",
    paddingHorizontal: scale(20),
    paddingTop: scale(16),
    borderTopLeftRadius: scale(28),
    borderTopRightRadius: scale(28),
    shadowColor: "#000",
    shadowOffset: { width: 0, height: scale(-12) },
    shadowOpacity: 0.12,
    shadowRadius: scale(24),
    elevation: 20,
    borderWidth: 1,
    borderColor: "#F0F0F0",
  },
  couponBar: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#F9FBFC",
    borderRadius: scale(16),
    paddingHorizontal: scale(14),
    height: scale(54),
    borderWidth: 1,
    borderColor: "#F0F0F0",
    marginBottom: scale(14),
  },
  couponInputBox: {
    flex: 1,
    fontSize: scale(13),
    fontWeight: "800",
    color: "#111",
    letterSpacing: scale(1),
  },
  promoAction: {
    paddingHorizontal: scale(10),
  },
  promoActionText: {
    fontSize: scale(13),
    fontWeight: "900",
    color: "#0A8754",
    textTransform: "uppercase",
  },
  summaryBox: {
    marginTop: scale(4),
  },
  billLine: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: scale(6),
  },
  billKey: {
    fontSize: scale(13),
    color: "#6B7280",
    fontWeight: "500",
  },
  billValue: {
    fontSize: scale(13),
    color: "#1F2937",
    fontWeight: "700",
  },
  primaryCheckoutBtn: {
    backgroundColor: "#0A8754",
    height: scale(64),
    borderRadius: scale(18),
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: scale(20),
    marginTop: scale(14),
    shadowColor: "#0A8754",
    shadowOffset: { width: 0, height: scale(8) },
    shadowOpacity: 0.3,
    shadowRadius: scale(16),
    elevation: 8,
  },
  checkoutLabelStack: {
    justifyContent: "center",
  },
  checkoutPrice: {
    fontSize: scale(19),
    fontWeight: "900",
    color: "#fff",
  },
  checkoutSub: {
    fontSize: scale(10),
    color: "rgba(255,255,255,0.7)",
    fontWeight: "600",
    textTransform: "uppercase",
    letterSpacing: scale(0.5),
  },
  checkoutBtnTextRow: {
    flexDirection: "row",
    alignItems: "center",
  },
  checkoutMainText: {
    fontSize: scale(17),
    fontWeight: "900",
    color: "#fff",
  },
  emptyView: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: scale(40),
    backgroundColor: "#fff",
  },
  emptyIllustration: {
    position: "relative",
    marginBottom: scale(30),
  },
  emptyCircle: {
    width: scale(150),
    height: scale(150),
    borderRadius: scale(75),
    backgroundColor: "#F0FDF4",
    justifyContent: "center",
    alignItems: "center",
    borderWidth: 2,
    borderColor: "#DCFCE7",
  },
  decorDot: {
    position: "absolute",
    borderRadius: scale(10),
  },
  emptyHeading: {
    fontSize: scale(24),
    fontWeight: "900",
    color: "#111827",
    marginBottom: scale(12),
    textAlign: "center",
    letterSpacing: scale(-0.5),
  },
  emptySubtext: {
    fontSize: scale(15),
    color: "#6B7280",
    textAlign: "center",
    lineHeight: scale(22),
    marginBottom: scale(40),
    paddingHorizontal: scale(10),
  },
  shopNowBtn: {
    backgroundColor: "#0A8754",
    paddingVertical: scale(18),
    paddingHorizontal: scale(40),
    borderRadius: scale(20),
    flexDirection: "row",
    alignItems: "center",
    shadowColor: "#0A8754",
    shadowOffset: { width: 0, height: scale(10) },
    shadowOpacity: 0.3,
    shadowRadius: scale(20),
    elevation: 8,
  },
  shopNowText: {
    color: "#fff",
    fontSize: scale(16),
    fontWeight: "800",
  },
});