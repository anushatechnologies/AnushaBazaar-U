import React from "react";
import { View, StyleSheet, Animated } from "react-native";
import { Ionicons } from "@expo/vector-icons";

const MapPin = ({ pinAnim }: { pinAnim: Animated.Value }) => {
  return (
    <View style={styles.pinContainer} pointerEvents="none">
      <Animated.View style={[styles.pinWrapper, { transform: [{ translateY: pinAnim }] }]}>
        <Ionicons name="location" size={40} color="#EF4444" />
        <View style={styles.pinDot} />
      </Animated.View>
      <View style={styles.shadow} />
    </View>
  );
};

export default MapPin;

const styles = StyleSheet.create({
  pinContainer: {
    position: "absolute",
    top: "50%",
    left: "50%",
    marginTop: -40,
    marginLeft: -20,
    alignItems: "center",
  },
  pinWrapper: {
    alignItems: "center",
  },
  pinDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: "rgba(0,0,0,0.5)",
    marginTop: -5,
  },
  shadow: {
    width: 10,
    height: 4,
    borderRadius: 2,
    backgroundColor: "rgba(0,0,0,0.2)",
    marginTop: 2,
  },
});
