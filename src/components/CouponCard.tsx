import React from "react";
import { View, Text, StyleSheet, TouchableOpacity, Alert } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { scale } from "../utils/responsive";
import { useCart } from "../context/CartContext";
import { Coupon } from "../services/api/coupons";

interface CouponCardProps {
  coupon: Coupon;
}

const CouponCard: React.FC<CouponCardProps> = ({ coupon }) => {
  const { applyCoupon, appliedCoupon } = useCart();
  const isApplied = appliedCoupon?.toUpperCase() === coupon.code.toUpperCase();

  const handleApply = async () => {
    if (!isApplied) {
      const result = await applyCoupon(coupon.code);
      if (result.success) {
        Alert.alert("Success", result.message);
      } else {
        Alert.alert("Sorry", result.message);
      }
    }
  };

  return (
    <View style={[styles.container, isApplied && styles.containerApplied]}>
      <View style={styles.leftEdge} />
      <View style={styles.rightEdge} />
      
      <View style={styles.content}>
        <View style={styles.iconBox}>
          <Ionicons name="pricetag" size={scale(18)} color={isApplied ? "#fff" : "#0A8754"} />
        </View>
        <View style={styles.details}>
          <Text style={[styles.code, isApplied && styles.textApplied]}>{coupon.code}</Text>
          <Text style={[styles.desc, isApplied && styles.textApplied]} numberOfLines={2}>
            {coupon.description || `Save flat ₹${coupon.discountValue || ''}`}
          </Text>
        </View>
        <TouchableOpacity 
          style={[styles.applyBtn, isApplied && styles.applyBtnActive]} 
          onPress={handleApply}
          disabled={isApplied}
        >
          <Text style={[styles.applyBtnText, isApplied && styles.applyBtnTextActive]}>
            {isApplied ? "APPLIED" : "APPLY"}
          </Text>
        </TouchableOpacity>
      </View>
    </View>
  );
};

export default CouponCard;

const styles = StyleSheet.create({
  container: {
    backgroundColor: "#EAF7F1",
    borderRadius: scale(12),
    borderWidth: 1,
    borderColor: "#DCFCE7",
    padding: scale(12),
    width: scale(260),
    marginRight: scale(12),
    overflow: "hidden",
    position: "relative",
  },
  containerApplied: {
    backgroundColor: "#0A8754",
    borderColor: "#0A8754",
  },
  leftEdge: {
    position: "absolute",
    left: scale(-10),
    top: "50%",
    width: scale(20),
    height: scale(20),
    borderRadius: scale(10),
    backgroundColor: "#fff",
    transform: [{ translateY: scale(-10) }],
    zIndex: 2,
    borderRightWidth: 1,
    borderColor: "#DCFCE7",
  },
  rightEdge: {
    position: "absolute",
    right: scale(-10),
    top: "50%",
    width: scale(20),
    height: scale(20),
    borderRadius: scale(10),
    backgroundColor: "#fff",
    transform: [{ translateY: scale(-10) }],
    zIndex: 2,
    borderLeftWidth: 1,
    borderColor: "#DCFCE7",
  },
  content: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: scale(8),
  },
  iconBox: {
    width: scale(36),
    height: scale(36),
    borderRadius: scale(18),
    backgroundColor: "rgba(255,255,255,0.6)",
    justifyContent: "center",
    alignItems: "center",
  },
  details: {
    flex: 1,
    marginLeft: scale(12),
    marginRight: scale(8),
  },
  code: {
    fontSize: scale(14),
    fontWeight: "900",
    color: "#0A8754",
    textTransform: "uppercase",
    letterSpacing: 1,
    marginBottom: scale(2),
  },
  desc: {
    fontSize: scale(11),
    color: "#6B7280",
    fontWeight: "500",
  },
  textApplied: {
    color: "#fff",
  },
  applyBtn: {
    backgroundColor: "#fff",
    paddingHorizontal: scale(12),
    paddingVertical: scale(6),
    borderRadius: scale(8),
    borderWidth: 1,
    borderColor: "#0A8754",
  },
  applyBtnActive: {
    backgroundColor: "#DCFCE7",
    borderColor: "#DCFCE7",
  },
  applyBtnText: {
    fontSize: scale(11),
    fontWeight: "800",
    color: "#0A8754",
  },
  applyBtnTextActive: {
    color: "#065F3A",
  },
});
