import React from "react";
import {
  View,
  Text,
  StyleSheet,
  Image,
  Pressable,
} from "react-native";
import { useCart } from "../context/CartContext";

const CartItem = ({ item }: any) => {
  const { increaseQty, decreaseQty } = useCart();

  return (
    <View style={styles.container}>
      <Image source={item.image} style={styles.image} />

      <View style={{ flex: 1 }}>
        <Text style={styles.name}>{item.name}</Text>

        <Text style={styles.weight}>100 g</Text>

        <Text style={styles.move}>
          Move to wishlist
        </Text>
      </View>

      <View style={styles.qtyBox}>
        <Pressable
          onPress={() => decreaseQty(item.id)}
        >
          <Text style={styles.qtyBtn}>-</Text>
        </Pressable>

        <Text style={styles.qty}>
          {item.quantity}
        </Text>

        <Pressable
          onPress={() => increaseQty(item.id)}
        >
          <Text style={styles.qtyBtn}>+</Text>
        </Pressable>
      </View>
    </View>
  );
};

export default CartItem;

const styles = StyleSheet.create({
  container: {
    flexDirection: "row",
    alignItems: "center",
    marginHorizontal: 15,
    marginVertical: 10,
    backgroundColor: "#fff",
    padding: 10,
    borderRadius: 16,
    elevation: 3,
  },

  image: {
    width: 70,
    height: 70,
    resizeMode: "contain",
  },

  name: {
    fontWeight: "600",
    fontSize: 15,
  },

  weight: {
    fontSize: 12,
    color: "#777",
  },

  move: {
    marginTop: 4,
    color: "#0A8754",
    fontSize: 12,
  },

  qtyBox: {
    flexDirection: "row",
    backgroundColor: "#0A8754",
    borderRadius: 10,
    paddingHorizontal: 10,
    alignItems: "center",
  },

  qtyBtn: {
    color: "#fff",
    fontSize: 18,
    paddingHorizontal: 6,
  },

  qty: {
    color: "#fff",
    fontWeight: "700",
  },
});