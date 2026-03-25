import React from "react";
import { View, Text, Pressable, StyleSheet } from "react-native";

interface QuantitySelectorProps {
  quantity: number;
  onIncrease: () => void;
  onDecrease: () => void;
  containerStyle?: any;
  mini?: boolean;
}

const QuantitySelector: React.FC<QuantitySelectorProps> = ({ quantity, onIncrease, onDecrease, containerStyle, mini }) => {
  return (
    <View style={[
      styles.qtyContainer, 
      mini && { paddingVertical: 4, paddingHorizontal: 4, borderRadius: 6 },
      containerStyle
    ]}>
      <Pressable style={styles.qtyBtnBox} onPress={onDecrease}>
        <Text style={[styles.qtyBtn, mini && { fontSize: 16 }]}>-</Text>
      </Pressable>
      <Text style={[styles.qty, mini && { fontSize: 13 }]}>{quantity}</Text>
      <Pressable style={styles.qtyBtnBox} onPress={onIncrease}>
        <Text style={[styles.qtyBtn, mini && { fontSize: 16 }]}>+</Text>
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
