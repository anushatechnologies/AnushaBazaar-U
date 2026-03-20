import React from "react";
import {
  View,
  Text,
  StyleSheet,
  Image,
  Pressable,
} from "react-native";

const RiceSection = () => {
  return (
    <View style={styles.container}>
      <Image
        source={require("../../assets/images/products/rice.png")} 
        style={styles.image}
      />

      <Text style={styles.title}>Premium Basmati Rice Bags</Text>
      <Text style={styles.subtitle}>
        5kg | 10kg | 25kg Available
      </Text>

      <Text style={styles.price}>Starting from ₹499</Text>

      <Pressable style={styles.button}>
        <Text style={styles.buttonText}>Shop Now</Text>
      </Pressable>
    </View>
  );
};

export default RiceSection;

const styles = StyleSheet.create({
  container: {
    marginHorizontal: 18,
    marginTop: 25,
    backgroundColor: "#fff",
    borderRadius: 22,
    padding: 20,
    elevation: 6,
    shadowColor: "#000",
    shadowOpacity: 0.08,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 5 },
  },

  image: {
    width: "100%",
    height: 170,
    resizeMode: "contain",
  },

  title: {
    fontSize: 17,
    fontWeight: "700",
    marginTop: 15,
  },

  subtitle: {
    fontSize: 13,
    color: "#777",
    marginTop: 4,
  },

  price: {
    color: "#0A8754",
    marginTop: 10,
    fontWeight: "700",
    fontSize: 16,
  },

  button: {
    backgroundColor: "#0A8754",
    marginTop: 15,
    paddingVertical: 12,
    borderRadius: 12,
    alignItems: "center",
  },

  buttonText: {
    color: "#fff",
    fontWeight: "700",
    fontSize: 14,
  },
});