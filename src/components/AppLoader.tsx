import React, { useEffect, useRef } from "react";
import { 
  View, 
  StyleSheet, 
  Animated, 
  Dimensions, 
  Text,
  Platform 
} from "react-native";
import { LinearGradient } from "expo-linear-gradient";

const { width, height } = Dimensions.get("window");

const AppLoader = () => {
  const scale = useRef(new Animated.Value(0.3)).current;
  const opacity = useRef(new Animated.Value(0)).current;
  const rotate = useRef(new Animated.Value(0)).current;
  const progressAnim = useRef(new Animated.Value(0)).current;
  const pulseAnim = useRef(new Animated.Value(1)).current;
  const textOpacity = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    // 1. Entrance animation
    Animated.parallel([
      Animated.spring(scale, {
        toValue: 1,
        friction: 8,
        tension: 40,
        useNativeDriver: true,
      }),
      Animated.timing(opacity, {
        toValue: 1,
        duration: 1000,
        useNativeDriver: true,
      }),
    ]).start();

    // 2. Continuous rotations & pulses
    Animated.loop(
      Animated.parallel([
        Animated.timing(rotate, {
          toValue: 1,
          duration: 4000,
          useNativeDriver: true,
        }),
        Animated.sequence([
          Animated.timing(pulseAnim, {
            toValue: 1.1,
            duration: 1000,
            useNativeDriver: true,
          }),
          Animated.timing(pulseAnim, {
            toValue: 1,
            duration: 1000,
            useNativeDriver: true,
          }),
        ])
      ])
    ).start();

    // 3. Text fade in
    Animated.timing(textOpacity, {
      toValue: 1,
      duration: 1000,
      delay: 600,
      useNativeDriver: true,
    }).start();

    // 4. Progress bar (fake but looks good)
    Animated.timing(progressAnim, {
      toValue: 1,
      duration: 2500,
      useNativeDriver: false,
    }).start();
  }, []);

  const spin = rotate.interpolate({
    inputRange: [0, 1],
    outputRange: ["0deg", "360deg"],
  });

  const barWidth = progressAnim.interpolate({
    inputRange: [0, 1],
    outputRange: ["0%", "100%"],
  });

  return (
    <LinearGradient
      colors={["#f6d365", "#fda085", "#ffffff"]}
      style={styles.container}
      start={{ x: 0, y: 0 }}
      end={{ x: 1, y: 1 }}
    >
      <View style={styles.content}>
        <Animated.View style={{
          transform: [
            { scale: Animated.multiply(scale, pulseAnim) },
            { rotate: spin }
          ],
          opacity,
          shadowColor: "#000",
          shadowOffset: { width: 0, height: 10 },
          shadowOpacity: 0.2,
          shadowRadius: 15,
          elevation: 10,
        }}>
          <View style={styles.logoWrapper}>
            <Animated.Image
              source={require("../../assets/company-logo.jpeg")}
              style={styles.logo}
              resizeMode="cover"
            />
          </View>
        </Animated.View>

        <Animated.View style={[styles.textContainer, { opacity: textOpacity }]}>
          <Text style={styles.brandName}>Anusha Bazaar</Text>
          <View style={styles.taglineWrapper}>
            <View style={styles.line} />
            <Text style={styles.tagline}>Freshness at your Doorstep</Text>
            <View style={styles.line} />
          </View>
        </Animated.View>
      </View>

      <View style={styles.footer}>
        <View style={styles.loadingInfo}>
          <Text style={styles.loadingText}>Initializing Experience...</Text>
        </View>
        <View style={styles.progressContainer}>
          <Animated.View style={[styles.progressBar, { width: barWidth }]}>
            <LinearGradient
              colors={["#0A8754", "#34D399"]}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
              style={StyleSheet.absoluteFill}
            />
          </Animated.View>
        </View>
        <Text style={styles.poweredBy}>Powered by Anusha Tech</Text>
      </View>
    </LinearGradient>
  );
};

export default AppLoader;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  content: {
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 50,
  },
  logoWrapper: {
    width: 220,
    height: 220,
    borderRadius: 110,
    backgroundColor: "#fff",
    padding: 10,
    justifyContent: "center",
    alignItems: "center",
  },
  logo: {
    width: "100%",
    height: "100%",
    borderRadius: 100,
  },
  textContainer: {
    alignItems: "center",
    marginTop: 40,
  },
  brandName: {
    fontSize: 34,
    fontWeight: "900",
    color: "#1a1a1a",
    letterSpacing: 1.5,
    textShadowColor: "rgba(0, 0, 0, 0.1)",
    textShadowOffset: { width: 0, height: 2 },
    textShadowRadius: 4,
  },
  taglineWrapper: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: 12,
    gap: 12,
  },
  line: {
    width: 20,
    height: 2,
    backgroundColor: "#0A8754",
    borderRadius: 1,
    opacity: 0.5,
  },
  tagline: {
    fontSize: 16,
    color: "#444",
    fontWeight: "600",
    letterSpacing: 0.5,
  },
  footer: {
    position: "absolute",
    bottom: height * 0.08,
    width: "100%",
    alignItems: "center",
    paddingHorizontal: 40,
  },
  loadingInfo: {
    marginBottom: 20,
    alignItems: "center",
  },
  loadingText: {
    fontSize: 13,
    color: "#555",
    fontWeight: "700",
    letterSpacing: 1,
    textTransform: "uppercase",
  },
  progressContainer: {
    width: "100%",
    height: 8,
    backgroundColor: "rgba(255, 255, 255, 0.5)",
    borderRadius: 4,
    overflow: "hidden",
    marginBottom: 20,
    borderWidth: 1,
    borderColor: "rgba(255, 255, 255, 0.8)",
  },
  progressBar: {
    height: "100%",
    borderRadius: 4,
  },
  poweredBy: {
    fontSize: 11,
    color: "#444",
    fontWeight: "800",
    textTransform: "uppercase",
    letterSpacing: 3,
    opacity: 0.8,
  },
});
;