import React, { useEffect, useRef } from "react";
import {
  View,
  StyleSheet,
  Animated,
  Dimensions,
  Text,
  StatusBar,
  Image,
} from "react-native";

const { width, height } = Dimensions.get("window");

const AppLoader = () => {
  // Logo animations
  const logoScale = useRef(new Animated.Value(0)).current;
  const logoOpacity = useRef(new Animated.Value(0)).current;

  // Ripple circles
  const ripple1 = useRef(new Animated.Value(0)).current;
  const ripple2 = useRef(new Animated.Value(0)).current;
  const ripple1Opacity = useRef(new Animated.Value(0.6)).current;
  const ripple2Opacity = useRef(new Animated.Value(0.6)).current;

  // Text
  const brandSlide = useRef(new Animated.Value(30)).current;
  const brandOpacity = useRef(new Animated.Value(0)).current;
  const taglineSlide = useRef(new Animated.Value(20)).current;
  const taglineOpacity = useRef(new Animated.Value(0)).current;

  // Bouncing dots
  const dot1 = useRef(new Animated.Value(0)).current;
  const dot2 = useRef(new Animated.Value(0)).current;
  const dot3 = useRef(new Animated.Value(0)).current;

  // Footer
  const footerOpacity = useRef(new Animated.Value(0)).current;

  // Glow pulse
  const glowScale = useRef(new Animated.Value(0.8)).current;
  const glowOpacity = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    // Phase 1: Glow appears
    Animated.timing(glowOpacity, {
      toValue: 0.3,
      duration: 400,
      useNativeDriver: true,
    }).start();

    // Phase 1: Logo bounces in
    Animated.sequence([
      Animated.delay(200),
      Animated.parallel([
        Animated.spring(logoScale, {
          toValue: 1,
          friction: 6,
          tension: 80,
          useNativeDriver: true,
        }),
        Animated.timing(logoOpacity, {
          toValue: 1,
          duration: 500,
          useNativeDriver: true,
        }),
      ]),
    ]).start();

    // Phase 2: Brand name slides up
    Animated.sequence([
      Animated.delay(500),
      Animated.parallel([
        Animated.spring(brandSlide, {
          toValue: 0,
          friction: 8,
          tension: 60,
          useNativeDriver: true,
        }),
        Animated.timing(brandOpacity, {
          toValue: 1,
          duration: 400,
          useNativeDriver: true,
        }),
      ]),
    ]).start();

    // Phase 3: Tagline slides up
    Animated.sequence([
      Animated.delay(800),
      Animated.parallel([
        Animated.spring(taglineSlide, {
          toValue: 0,
          friction: 8,
          tension: 60,
          useNativeDriver: true,
        }),
        Animated.timing(taglineOpacity, {
          toValue: 1,
          duration: 400,
          useNativeDriver: true,
        }),
      ]),
    ]).start();

    // Phase 4: Footer fades in
    Animated.sequence([
      Animated.delay(1000),
      Animated.timing(footerOpacity, {
        toValue: 1,
        duration: 400,
        useNativeDriver: true,
      }),
    ]).start();

    // Continuous: Ripple rings
    const createRipple = (rippleScale: Animated.Value, rippleOpacity: Animated.Value, delay: number) => {
      return Animated.loop(
        Animated.sequence([
          Animated.delay(delay),
          Animated.parallel([
            Animated.timing(rippleScale, {
              toValue: 1,
              duration: 1800,
              useNativeDriver: true,
            }),
            Animated.timing(rippleOpacity, {
              toValue: 0,
              duration: 1800,
              useNativeDriver: true,
            }),
          ]),
          Animated.parallel([
            Animated.timing(rippleScale, {
              toValue: 0,
              duration: 0,
              useNativeDriver: true,
            }),
            Animated.timing(rippleOpacity, {
              toValue: 0.6,
              duration: 0,
              useNativeDriver: true,
            }),
          ]),
        ])
      );
    };

    createRipple(ripple1, ripple1Opacity, 0).start();
    createRipple(ripple2, ripple2Opacity, 900).start();

    // Continuous: Glow pulse
    Animated.loop(
      Animated.sequence([
        Animated.timing(glowScale, {
          toValue: 1.3,
          duration: 1200,
          useNativeDriver: true,
        }),
        Animated.timing(glowScale, {
          toValue: 0.8,
          duration: 1200,
          useNativeDriver: true,
        }),
      ])
    ).start();

    // Continuous: Bouncing dots
    const bounceDot = (dot: Animated.Value, delay: number) => {
      return Animated.loop(
        Animated.sequence([
          Animated.delay(delay),
          Animated.timing(dot, {
            toValue: -10,
            duration: 300,
            useNativeDriver: true,
          }),
          Animated.timing(dot, {
            toValue: 0,
            duration: 300,
            useNativeDriver: true,
          }),
          Animated.delay(600),
        ])
      );
    };

    Animated.sequence([
      Animated.delay(1000),
      Animated.parallel([
        bounceDot(dot1, 0),
        bounceDot(dot2, 150),
        bounceDot(dot3, 300),
      ]),
    ]).start();
  }, []);

  const ripple1Scale = ripple1.interpolate({
    inputRange: [0, 1],
    outputRange: [1, 2.5],
  });

  const ripple2Scale = ripple2.interpolate({
    inputRange: [0, 1],
    outputRange: [1, 2.5],
  });

  return (
    <View style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor="#F8D66D" />

      {/* Background gradient effect with colored circles */}
      <View style={styles.bgCircle1} />
      <View style={styles.bgCircle2} />
      <View style={styles.bgCircle3} />

      {/* Center Content */}
      <View style={styles.centerContent}>
        {/* Glow behind logo */}
        <Animated.View
          style={[
            styles.glow,
            {
              opacity: glowOpacity,
              transform: [{ scale: glowScale }],
            },
          ]}
        />

        {/* Ripple rings */}
        <Animated.View
          style={[
            styles.ripple,
            {
              opacity: ripple1Opacity,
              transform: [{ scale: ripple1Scale }],
            },
          ]}
        />
        <Animated.View
          style={[
            styles.ripple,
            {
              opacity: ripple2Opacity,
              transform: [{ scale: ripple2Scale }],
            },
          ]}
        />

        {/* Logo */}
        <Animated.View
          style={[
            styles.logoContainer,
            {
              opacity: logoOpacity,
              transform: [{ scale: logoScale }],
            },
          ]}
        >
          <Image
            source={require("../../assets/company-logo.png")}
            style={styles.logo}
            resizeMode="cover"
          />
        </Animated.View>

        {/* Brand Name */}
        <Animated.View
          style={{
            opacity: brandOpacity,
            transform: [{ translateY: brandSlide }],
            marginTop: 28,
          }}
        >
          <Text style={styles.brandName}>Anusha Bazaar</Text>
        </Animated.View>

        {/* Tagline */}
        <Animated.View
          style={{
            opacity: taglineOpacity,
            transform: [{ translateY: taglineSlide }],
            marginTop: 8,
          }}
        >
          <Text style={styles.tagline}>Freshness at your Doorstep</Text>
        </Animated.View>
      </View>

      {/* Footer with bouncing dots */}
      <Animated.View style={[styles.footer, { opacity: footerOpacity }]}>
        <View style={styles.dotsContainer}>
          <Animated.View
            style={[
              styles.dot,
              styles.dot1,
              { transform: [{ translateY: dot1 }] },
            ]}
          />
          <Animated.View
            style={[
              styles.dot,
              styles.dot2,
              { transform: [{ translateY: dot2 }] },
            ]}
          />
          <Animated.View
            style={[
              styles.dot,
              styles.dot3,
              { transform: [{ translateY: dot3 }] },
            ]}
          />
        </View>
        <Text style={styles.poweredBy}>ANUSHA TECHNOLOGIES</Text>
      </Animated.View>
    </View>
  );
};

export default AppLoader;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#F8D66D",
    justifyContent: "center",
    alignItems: "center",
  },

  // Decorative background circles
  bgCircle1: {
    position: "absolute",
    top: -height * 0.15,
    right: -width * 0.3,
    width: width * 0.9,
    height: width * 0.9,
    borderRadius: width * 0.45,
    backgroundColor: "rgba(255, 220, 100, 0.5)",
  },
  bgCircle2: {
    position: "absolute",
    bottom: -height * 0.1,
    left: -width * 0.25,
    width: width * 0.7,
    height: width * 0.7,
    borderRadius: width * 0.35,
    backgroundColor: "rgba(255, 195, 50, 0.3)",
  },
  bgCircle3: {
    position: "absolute",
    top: height * 0.3,
    left: -width * 0.15,
    width: width * 0.5,
    height: width * 0.5,
    borderRadius: width * 0.25,
    backgroundColor: "rgba(10, 135, 84, 0.06)",
  },

  centerContent: {
    alignItems: "center",
    justifyContent: "center",
  },

  // Glow behind the logo
  glow: {
    position: "absolute",
    width: 200,
    height: 200,
    borderRadius: 100,
    backgroundColor: "#0A8754",
  },

  // Ripple rings
  ripple: {
    position: "absolute",
    width: 120,
    height: 120,
    borderRadius: 60,
    borderWidth: 2,
    borderColor: "#0A8754",
  },

  // Logo
  logoContainer: {
    width: 120,
    height: 120,
    borderRadius: 35,
    backgroundColor: "#fff",
    justifyContent: "center",
    alignItems: "center",
    elevation: 15,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.15,
    shadowRadius: 20,
    overflow: "hidden",
  },
  logo: {
    width: "100%",
    height: "100%",
  },

  brandName: {
    fontSize: 30,
    fontWeight: "900",
    color: "#1a1a1a",
    letterSpacing: -0.5,
  },
  tagline: {
    fontSize: 14,
    color: "#555",
    fontWeight: "600",
    letterSpacing: 1,
    textTransform: "uppercase",
  },

  footer: {
    position: "absolute",
    bottom: height * 0.08,
    alignItems: "center",
  },

  dotsContainer: {
    flexDirection: "row",
    gap: 8,
    marginBottom: 20,
  },
  dot: {
    width: 10,
    height: 10,
    borderRadius: 5,
  },
  dot1: {
    backgroundColor: "#0A8754",
  },
  dot2: {
    backgroundColor: "#1a1a1a",
  },
  dot3: {
    backgroundColor: "#0A8754",
  },

  poweredBy: {
    fontSize: 10,
    color: "#777",
    fontWeight: "800",
    letterSpacing: 3,
  },
});