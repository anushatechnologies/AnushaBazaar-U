import React, { useEffect, useRef } from "react";
import { View, StyleSheet, Animated } from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { scale, screenWidth } from "../utils/responsive";

const CARD_WIDTH = (screenWidth - scale(48)) / 2;

const SkeletonCard = () => {
  const shimmerValue = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    const startShimmer = () => {
      shimmerValue.setValue(0);
      Animated.timing(shimmerValue, {
        toValue: 1,
        duration: 1200,
        useNativeDriver: true,
      }).start(() => startShimmer());
    };
    startShimmer();
  }, []);

  const translateX = shimmerValue.interpolate({
    inputRange: [0, 1],
    outputRange: [-CARD_WIDTH, CARD_WIDTH],
  });

  return (
    <View style={styles.card}>
      {/* Image Skeleton */}
      <View style={styles.imageContainer}>
        <Animated.View style={[styles.shimmer, { transform: [{ translateX }] }]}>
          <LinearGradient
            colors={["transparent", "rgba(255,255,255,0.4)", "transparent"]}
            start={{ x: 0, y: 0.5 }}
            end={{ x: 1, y: 0.5 }}
            style={StyleSheet.absoluteFill}
          />
        </Animated.View>
      </View>

      {/* Title Skeleton */}
      <View style={styles.textLong}>
        <Animated.View style={[styles.shimmer, { transform: [{ translateX }] }]}>
          <LinearGradient
             colors={["transparent", "rgba(255,255,255,0.4)", "transparent"]}
             start={{ x: 0, y: 0.5 }}
             end={{ x: 1, y: 0.5 }}
             style={StyleSheet.absoluteFill}
           />
        </Animated.View>
      </View>

      {/* Subtext Skeleton */}
      <View style={styles.textShort}>
        <Animated.View style={[styles.shimmer, { transform: [{ translateX }] }]}>
          <LinearGradient
             colors={["transparent", "rgba(255,255,255,0.4)", "transparent"]}
             start={{ x: 0, y: 0.5 }}
             end={{ x: 1, y: 0.5 }}
             style={StyleSheet.absoluteFill}
           />
        </Animated.View>
      </View>

      {/* Bottom row (Price + Add) */}
      <View style={styles.bottomRow}>
        <View style={styles.priceSec}>
           <Animated.View style={[styles.shimmer, { transform: [{ translateX }] }]}>
             <LinearGradient
               colors={["transparent", "rgba(255,255,255,0.4)", "transparent"]}
               start={{ x: 0, y: 0.5 }}
               end={{ x: 1, y: 0.5 }}
               style={StyleSheet.absoluteFill}
             />
           </Animated.View>
        </View>
        <View style={styles.addBtn}>
           <Animated.View style={[styles.shimmer, { transform: [{ translateX }] }]}>
             <LinearGradient
               colors={["transparent", "rgba(255,255,255,0.4)", "transparent"]}
               start={{ x: 0, y: 0.5 }}
               end={{ x: 1, y: 0.5 }}
               style={StyleSheet.absoluteFill}
             />
           </Animated.View>
        </View>
      </View>
    </View>
  );
};

export default SkeletonCard;

const styles = StyleSheet.create({
  card: {
    width: CARD_WIDTH,
    backgroundColor: "#fff",
    borderRadius: scale(20),
    padding: scale(10),
    marginBottom: scale(16),
    borderWidth: 1,
    borderColor: "#F0F0F0",
    overflow: "hidden",
  },
  imageContainer: {
    width: "100%",
    aspectRatio: 1,
    backgroundColor: "#F3F4F6",
    borderRadius: scale(15),
    overflow: "hidden",
  },
  textLong: {
    height: scale(14),
    width: "80%",
    backgroundColor: "#F3F4F6",
    borderRadius: scale(7),
    marginTop: scale(12),
    overflow: "hidden",
  },
  textShort: {
    height: scale(10),
    width: "50%",
    backgroundColor: "#F3F4F6",
    borderRadius: scale(5),
    marginTop: scale(8),
    overflow: "hidden",
  },
  bottomRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginTop: scale(15),
    marginBottom: scale(5),
  },
  priceSec: {
    height: scale(18),
    width: scale(60),
    backgroundColor: "#F3F4F6",
    borderRadius: scale(9),
    overflow: "hidden",
  },
  addBtn: {
    height: scale(32),
    width: scale(32),
    backgroundColor: "#F3F4F6",
    borderRadius: scale(10),
    overflow: "hidden",
  },
  shimmer: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "transparent",
  },
});