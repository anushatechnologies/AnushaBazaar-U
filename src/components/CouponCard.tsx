
import React from "react";
import { View, Text, StyleSheet, Pressable } from "react-native";
import { useCart } from "../context/CartContext";

const CouponCard = () => {

  const { applyCoupon } = useCart();

  const handleApply = () => {
    applyCoupon("SAVE50");
  };

  return (

    <View style={styles.container}>

      <Text style={styles.title}>
        Save ₹50 on this order
      </Text>

      <Pressable style={styles.btn} onPress={handleApply}>
        <Text style={styles.btnText}>
          Apply Coupon
        </Text>
      </Pressable>

    </View>

  );
};

export default CouponCard;

const styles = StyleSheet.create({

  container: {
    backgroundColor: "#eef7ff",
    marginHorizontal: 15,
    marginTop: 10,
    padding: 15,
    borderRadius: 12,
  },

  title: {
    fontWeight: "600",
  },

  btn: {
    marginTop: 10,
    backgroundColor: "#0A8754",
    padding: 10,
    borderRadius: 8,
    alignItems: "center",
  },

  btnText: {
    color: "#fff",
    fontWeight: "600",
  },
});
