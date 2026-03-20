
import React from "react";
import { View, Text, StyleSheet } from "react-native";
import { useCart } from "../context/CartContext";

const FreeDeliveryBar = () => {

  const { total } = useCart();

  const goal = 199;
  const remaining = goal - total;
  const progress = Math.min(total / goal, 1);

  return (

    <View style={styles.container}>

      <Text style={styles.text}>
        {remaining > 0
          ? `Add ₹${remaining} more for FREE DELIVERY`
          : "You unlocked FREE delivery"}
      </Text>

      <View style={styles.bar}>
        <View
          style={[
            styles.fill,
            { width: `${progress * 100}%` },
          ]}
        />
      </View>

    </View>
  );
};

export default FreeDeliveryBar;

const styles = StyleSheet.create({

  container: {
    backgroundColor: "#fff3cd",
    padding: 12,
    marginHorizontal: 15,
    marginTop: 10,
    borderRadius: 10,
  },

  text: {
    fontSize: 12,
    fontWeight: "600",
  },

  bar: {
    height: 6,
    backgroundColor: "#eee",
    borderRadius: 5,
    marginTop: 6,
  },

  fill: {
    height: 6,
    backgroundColor: "#0A8754",
    borderRadius: 5,
  },
});

