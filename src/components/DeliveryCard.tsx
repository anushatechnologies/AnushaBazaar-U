import React from "react";
import { View, Text, StyleSheet } from "react-native";
import { Ionicons } from "@expo/vector-icons";

const DeliveryCard = ({ count }: any) => {
  return (
    <View style={styles.card}>
      <Ionicons name="time-outline" size={22} color="#0A8754" />

      <View style={{ marginLeft: 10 }}>
        <Text style={styles.title}>Delivery in 8 minutes</Text>
        <Text style={styles.sub}>
          Shipment of {count} items
        </Text>
      </View>
    </View>
  );
};

export default DeliveryCard;

const styles = StyleSheet.create({
  card: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#fff",
    margin: 15,
    padding: 15,
    borderRadius: 16,
    elevation: 3,
  },

  title: {
    fontWeight: "700",
    fontSize: 16,
  },

  sub: {
    color: "#777",
    fontSize: 13,
  },
});