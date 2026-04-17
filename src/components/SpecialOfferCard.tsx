import React from "react";
import {
  View,
  Text,
  StyleSheet,
} from "react-native";

const SpecialOfferCard = () => {
  return (
    <View style={styles.card}>
      <Text style={styles.title}>
        Special deal for you!
      </Text>

      <Text style={styles.text}>
        Add this item to unlock offer
      </Text>
    </View>
  );
};

export default SpecialOfferCard;

const styles = StyleSheet.create({
  card: {
    margin: 15,
    padding: 15,
    borderRadius: 16,
    backgroundColor: "#F3F0FF",
  },

  title: {
    fontWeight: "700",
    fontSize: 16,
  },

  text: {
    marginTop: 4,
    color: "#555",
  },
});
