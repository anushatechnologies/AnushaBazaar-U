import React from "react";
import { View, Text, StyleSheet } from "react-native";

interface PriceRowProps {
  sellingPrice: number;
  mrp: number;
  containerStyle?: any;
  priceStyle?: any;
  mrpStyle?: any;
}

const PriceRow: React.FC<PriceRowProps> = ({ sellingPrice, mrp, containerStyle, priceStyle, mrpStyle }) => {
  return (
    <View style={[styles.priceRow, containerStyle]}>
      <Text style={[styles.price, priceStyle]}>₹{sellingPrice}</Text>
      {mrp > sellingPrice && <Text style={[styles.originalPrice, mrpStyle]}>₹{mrp}</Text>}
    </View>
  );
};

export default PriceRow;

const styles = StyleSheet.create({
  priceRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    marginTop: 4,
    marginBottom: 2,
  },
  price: {
    color: "#0A8754",
    fontWeight: "800",
    fontSize: 15,
  },
  originalPrice: {
    color: "#aaa",
    fontSize: 12,
    textDecorationLine: "line-through",
    fontWeight: "500",
  },
});
