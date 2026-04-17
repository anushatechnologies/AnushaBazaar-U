import React, { useEffect, useRef } from "react";
import {
  View,
  Text,
  StyleSheet,
  Animated,
  Easing,
  Dimensions,
  Image,
  StatusBar,
} from "react-native";
import { scale } from "../utils/responsive";

const { width } = Dimensions.get("window");

const AppLoadingScreen = () => {
  const logoScale = useRef(new Animated.Value(0.3)).current;
  const logoOpacity = useRef(new Animated.Value(0)).current;
  const titleOpacity = useRef(new Animated.Value(0)).current;
  const titleTranslateY = useRef(new Animated.Value(20)).current;
  const subtitleOpacity = useRef(new Animated.Value(0)).current;
  const dotScale1 = useRef(new Animated.Value(0.3)).current;
  const dotScale2 = useRef(new Animated.Value(0.3)).current;
  const dotScale3 = useRef(new Animated.Value(0.3)).current;
  const shimmerAnim = useRef(new Animated.Value(0)).current;
  const pulseAnim = useRef(new Animated.Value(1)).current;

  // Floating circles
  const float1 = useRef(new Animated.Value(0)).current;
  const float2 = useRef(new Animated.Value(0)).current;
  const float3 = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    // Logo entrance
    Animated.parallel([
      Animated.spring(logoScale, {
        toValue: 1,
        tension: 40,
        friction: 6,
        useNativeDriver: true,
      }),
      Animated.timing(logoOpacity, {
        toValue: 1,
        duration: 600,
        useNativeDriver: true,
      }),
    ]).start();

    // Title entrance
    Animated.sequence([
      Animated.delay(300),
      Animated.parallel([
        Animated.timing(titleOpacity, {
          toValue: 1,
          duration: 500,
          useNativeDriver: true,
        }),
        Animated.spring(titleTranslateY, {
          toValue: 0,
          tension: 50,
          friction: 8,
          useNativeDriver: true,
        }),
      ]),
    ]).start();

    // Subtitle
    Animated.sequence([
      Animated.delay(600),
      Animated.timing(subtitleOpacity, {
        toValue: 1,
        duration: 400,
        useNativeDriver: true,
      }),
    ]).start();

    // Loading dots
    const animateDot = (dot: Animated.Value, delay: number) => {
      Animated.loop(
        Animated.sequence([
          Animated.delay(delay),
          Animated.timing(dot, {
            toValue: 1,
            duration: 400,
            easing: Easing.out(Easing.cubic),
            useNativeDriver: true,
          }),
          Animated.timing(dot, {
            toValue: 0.3,
            duration: 400,
            easing: Easing.in(Easing.cubic),
            useNativeDriver: true,
          }),
        ])
      ).start();
    };

    animateDot(dotScale1, 0);
    animateDot(dotScale2, 150);
    animateDot(dotScale3, 300);

    // Logo pulse
    Animated.loop(
      Animated.sequence([
        Animated.delay(800),
        Animated.timing(pulseAnim, {
          toValue: 1.05,
          duration: 1200,
          easing: Easing.inOut(Easing.sin),
          useNativeDriver: true,
        }),
        Animated.timing(pulseAnim, {
          toValue: 1,
          duration: 1200,
          easing: Easing.inOut(Easing.sin),
          useNativeDriver: true,
        }),
      ])
    ).start();

    // Floating decorative circles
    const floatAnimation = (anim: Animated.Value, duration: number) => {
      Animated.loop(
        Animated.sequence([
          Animated.timing(anim, {
            toValue: 1,
            duration,
            easing: Easing.inOut(Easing.sin),
            useNativeDriver: true,
          }),
          Animated.timing(anim, {
            toValue: 0,
            duration,
            easing: Easing.inOut(Easing.sin),
            useNativeDriver: true,
          }),
        ])
      ).start();
    };

    floatAnimation(float1, 3000);
    floatAnimation(float2, 2500);
    floatAnimation(float3, 3500);

    // Shimmer
    Animated.loop(
      Animated.timing(shimmerAnim, {
        toValue: 1,
        duration: 2000,
        easing: Easing.linear,
        useNativeDriver: true,
      })
    ).start();
  }, []);

  const shimmerTranslate = shimmerAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [-width, width],
  });

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor="#062A1C" />

      {/* Background gradient circles */}
      <Animated.View
        style={[
          styles.bgCircle,
          styles.bgCircle1,
          {
            transform: [
              {
                translateY: float1.interpolate({
                  inputRange: [0, 1],
                  outputRange: [0, -20],
                }),
              },
            ],
          },
        ]}
      />
      <Animated.View
        style={[
          styles.bgCircle,
          styles.bgCircle2,
          {
            transform: [
              {
                translateY: float2.interpolate({
                  inputRange: [0, 1],
                  outputRange: [0, 15],
                }),
              },
            ],
          },
        ]}
      />
      <Animated.View
        style={[
          styles.bgCircle,
          styles.bgCircle3,
          {
            transform: [
              {
                translateX: float3.interpolate({
                  inputRange: [0, 1],
                  outputRange: [0, 20],
                }),
              },
            ],
          },
        ]}
      />

      {/* Logo */}
      <Animated.View
        style={[
          styles.logoContainer,
          {
            transform: [
              { scale: Animated.multiply(logoScale, pulseAnim) },
            ],
            opacity: logoOpacity,
          },
        ]}
      >
        <View style={styles.logoGlow} />
        <View style={styles.logoCircle}>
          <Image
            source={require("../../assets/splash.png")}
            style={styles.logoImage}
            resizeMode="contain"
          />
        </View>
      </Animated.View>

      {/* Title */}
      <Animated.View
        style={{
          opacity: titleOpacity,
          transform: [{ translateY: titleTranslateY }],
        }}
      >
        <Text style={styles.title}>Anusha Bazaar</Text>
      </Animated.View>

      {/* Subtitle */}
      <Animated.View style={{ opacity: subtitleOpacity }}>
        <Text style={styles.subtitle}>
          Fresh groceries delivered to your door
        </Text>
      </Animated.View>

      {/* Loading dots */}
      <Animated.View style={[styles.dotsContainer, { opacity: subtitleOpacity }]}>
        <Animated.View
          style={[styles.dot, { transform: [{ scale: dotScale1 }] }]}
        />
        <Animated.View
          style={[styles.dot, { transform: [{ scale: dotScale2 }] }]}
        />
        <Animated.View
          style={[styles.dot, { transform: [{ scale: dotScale3 }] }]}
        />
      </Animated.View>

      {/* Bottom shimmer line */}
      <View style={styles.shimmerContainer}>
        <Animated.View
          style={[
            styles.shimmerLine,
            { transform: [{ translateX: shimmerTranslate }] },
          ]}
        />
      </View>

      {/* Footer */}
      <View style={styles.footer}>
        <Text style={styles.footerText}>Anusha Bazaar Technologies Private Limited</Text>
      </View>
    </View>
  );
};

export default AppLoadingScreen;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#062A1C",
    justifyContent: "center",
    alignItems: "center",
  },
  bgCircle: {
    position: "absolute",
    borderRadius: 999,
  },
  bgCircle1: {
    width: scale(300),
    height: scale(300),
    backgroundColor: "rgba(10, 135, 84, 0.08)",
    top: -scale(60),
    right: -scale(80),
  },
  bgCircle2: {
    width: scale(200),
    height: scale(200),
    backgroundColor: "rgba(10, 135, 84, 0.06)",
    bottom: scale(80),
    left: -scale(60),
  },
  bgCircle3: {
    width: scale(150),
    height: scale(150),
    backgroundColor: "rgba(10, 135, 84, 0.05)",
    top: scale(200),
    left: scale(50),
  },
  logoContainer: {
    marginBottom: scale(32),
    alignItems: "center",
    justifyContent: "center",
  },
  logoGlow: {
    position: "absolute",
    width: scale(160),
    height: scale(160),
    borderRadius: scale(80),
    backgroundColor: "rgba(10, 135, 84, 0.15)",
  },
  logoCircle: {
    width: scale(120),
    height: scale(120),
    borderRadius: scale(60),
    backgroundColor: "#fff",
    justifyContent: "center",
    alignItems: "center",
    shadowColor: "#0A8754",
    shadowOffset: { width: 0, height: scale(15) },
    shadowOpacity: 0.3,
    shadowRadius: scale(25),
    elevation: 20,
  },
  logoImage: {
    width: scale(90),
    height: scale(90),
    borderRadius: scale(45),
  },
  title: {
    fontSize: scale(30),
    fontWeight: "900",
    color: "#fff",
    letterSpacing: scale(-0.5),
    textAlign: "center",
    marginBottom: scale(8),
  },
  subtitle: {
    fontSize: scale(14),
    fontWeight: "500",
    color: "rgba(255, 255, 255, 0.5)",
    textAlign: "center",
    letterSpacing: scale(0.5),
  },
  dotsContainer: {
    flexDirection: "row",
    marginTop: scale(40),
    gap: scale(8),
  },
  dot: {
    width: scale(10),
    height: scale(10),
    borderRadius: scale(5),
    backgroundColor: "#0A8754",
  },
  shimmerContainer: {
    position: "absolute",
    bottom: scale(80),
    width: scale(200),
    height: scale(3),
    backgroundColor: "rgba(255,255,255,0.05)",
    borderRadius: scale(2),
    overflow: "hidden",
  },
  shimmerLine: {
    width: scale(60),
    height: "100%",
    backgroundColor: "rgba(10, 135, 84, 0.4)",
    borderRadius: scale(2),
  },
  footer: {
    position: "absolute",
    bottom: scale(40),
    alignItems: "center",
  },
  footerText: {
    fontSize: scale(12),
    color: "rgba(255, 255, 255, 0.25)",
    fontWeight: "600",
    letterSpacing: scale(1),
  },
});
