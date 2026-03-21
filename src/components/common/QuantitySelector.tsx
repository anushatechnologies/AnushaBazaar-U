import React from "react";
import { View, Text, Pressable, StyleSheet } from "react-native";

interface QuantitySelectorProps {
  quantity: number;
  onIncrease: () => void;
  onDecrease: () => void;
  containerStyle?: any;
}

const QuantitySelector: React.FC<QuantitySelectorProps> = ({ quantity, onIncrease, onDecrease, containerStyle }) => {
  return (
    <View style={[styles.qtyContainer, containerStyle]}>
      <Pressable style={styles.qtyBtnBox} onPress={onDecrease}>
        <Text style={styles.qtyBtn}>-</Text>
      </Pressable>
      <Text style={styles.qty}>{quantity}</Text>
      <Pressable style={styles.qtyBtnBox} onPress={onIncrease}>
        <Text style={styles.qtyBtn}>+</Text>
      </Pressable>
    </View>
  );
};

export default QuantitySelector;

const styles = StyleSheet.create({
  qtyContainer: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    backgroundColor: "#0C831F",
    borderRadius: 8,
    paddingVertical: 8,
    paddingHorizontal: 8,
    elevation: 4,
    shadowColor: "#0C831F",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
  },
  qtyBtnBox: {
    paddingHorizontal: 8,
  },
  qtyBtn: {
    fontSize: 20,
    fontWeight: "900",
    color: "#fff",
  },
  qty: {
    fontWeight: "900",
    fontSize: 16,
    color: "#fff",
  },
});
