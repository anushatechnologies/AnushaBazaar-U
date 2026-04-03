import React, { useEffect, useRef } from "react";
import {
  Animated,
  Easing,
  Image,
  StyleProp,
  StyleSheet,
  Text,
  View,
  ViewStyle,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { moderateScale, scale, screenWidth, verticalScale } from "../utils/responsive";

const BRAND_GREEN = "#0A8754";
const BRAND_GREEN_DARK = "#06683F";
const WARM_YELLOW = "#FFC94A";
const SOFT_GREEN = "#EAF8F1";
const SOFT_MINT = "#F4FFF8";
const BRAND_LOGO = require("../../assets/company-logo.png");

interface Props {
  size?: "small" | "large";
  color?: string;
  style?: StyleProp<ViewStyle>;
  fullScreen?: boolean;
  title?: string;
  subtitle?: string;
}

const QUICK_FACTS = [
  { label: "Fresh Picks", icon: "leaf-outline" as const },
  { label: "Daily Needs", icon: "basket-outline" as const },
  { label: "Fast Delivery", icon: "flash-outline" as const },
];

const AppLoader = ({
  size = "large",
  color = BRAND_GREEN,
  style,
  fullScreen = false,
  title = "Anusha Bazaar",
  subtitle = "Packing fresh groceries, fruits, and daily essentials for your doorstep.",
}: Props) => {
  const isSmall = size === "small";

  const pulseAnim = useRef(new Animated.Value(0)).current;
  const floatAnim = useRef(new Animated.Value(0)).current;
  const progressAnim = useRef(new Animated.Value(0)).current;
  const spinAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    const pulseLoop = Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnim, {
          toValue: 1,
          duration: 1150,
          easing: Easing.inOut(Easing.cubic),
          useNativeDriver: true,
        }),
        Animated.timing(pulseAnim, {
          toValue: 0,
          duration: 1150,
          easing: Easing.inOut(Easing.cubic),
          useNativeDriver: true,
        }),
      ])
    );

    const floatLoop = Animated.loop(
      Animated.sequence([
        Animated.timing(floatAnim, {
          toValue: 1,
          duration: 1800,
          easing: Easing.inOut(Easing.sin),
          useNativeDriver: true,
        }),
        Animated.timing(floatAnim, {
          toValue: 0,
          duration: 1800,
          easing: Easing.inOut(Easing.sin),
          useNativeDriver: true,
        }),
      ])
    );

    const progressLoop = Animated.loop(
      Animated.sequence([
        Animated.timing(progressAnim, {
          toValue: 1,
          duration: 1400,
          easing: Easing.inOut(Easing.cubic),
          useNativeDriver: false,
        }),
        Animated.timing(progressAnim, {
          toValue: 0,
          duration: 1400,
          easing: Easing.inOut(Easing.cubic),
          useNativeDriver: false,
        }),
      ])
    );

    const spinLoop = Animated.loop(
      Animated.timing(spinAnim, {
        toValue: 1,
        duration: 850,
        easing: Easing.linear,
        useNativeDriver: true,
      })
    );

    pulseLoop.start();
    floatLoop.start();
    progressLoop.start();
    spinLoop.start();

    return () => {
      pulseLoop.stop();
      floatLoop.stop();
      progressLoop.stop();
      spinLoop.stop();
    };
  }, [floatAnim, progressAnim, pulseAnim, spinAnim]);

  const rippleScale = pulseAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [1, 1.58],
  });

  const rippleOpacity = pulseAnim.interpolate({
    inputRange: [0, 0.55, 1],
    outputRange: [0.24, 0.12, 0],
  });

  const coreScale = pulseAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [0.98, 1.05],
  });

  const floatY = floatAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [0, -scale(10)],
  });

  const orbitY = floatAnim.interpolate({
    inputRange: [0, 0.5, 1],
    outputRange: [scale(3), -scale(5), scale(3)],
  });

  const orbitYInverse = floatAnim.interpolate({
    inputRange: [0, 0.5, 1],
    outputRange: [-scale(3), scale(5), -scale(3)],
  });

  const progressWidth = progressAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [scale(48), Math.min(screenWidth * 0.44, scale(176))],
  });

  const dotOneOpacity = progressAnim.interpolate({
    inputRange: [0, 0.33, 0.66, 1],
    outputRange: [1, 0.42, 0.42, 1],
  });

  const dotTwoOpacity = progressAnim.interpolate({
    inputRange: [0, 0.33, 0.66, 1],
    outputRange: [0.42, 1, 0.42, 0.42],
  });

  const dotThreeOpacity = progressAnim.interpolate({
    inputRange: [0, 0.33, 0.66, 1],
    outputRange: [0.42, 0.42, 1, 0.42],
  });

  const spin = spinAnim.interpolate({
    inputRange: [0, 1],
    outputRange: ["0deg", "360deg"],
  });

  if (isSmall) {
    return (
      <Animated.View style={[styles.smallLoader, { transform: [{ rotate: spin }] }, style]}>
        <Ionicons name="refresh-outline" size={scale(18)} color={color} />
      </Animated.View>
    );
  }

  if (fullScreen) {
    return (
      <View style={[styles.screen, style]}>
        <LinearGradient
          colors={["#FFF7E8", SOFT_MINT, "#FFFFFF"]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={StyleSheet.absoluteFillObject}
        />

        <View style={styles.bgOrbTop} />
        <View style={styles.bgOrbBottom} />
        <View style={styles.bgBubbleOne} />
        <View style={styles.bgBubbleTwo} />

        <View style={styles.screenContent}>
          <View style={styles.quickFactsRow}>
            {QUICK_FACTS.map((fact) => (
              <View key={fact.label} style={styles.quickFactChip}>
                <Ionicons name={fact.icon} size={scale(14)} color={BRAND_GREEN} />
                <Text style={styles.quickFactText}>{fact.label}</Text>
              </View>
            ))}
          </View>

          <Animated.View style={[styles.heroCard, { transform: [{ translateY: floatY }] }]}>
            <View style={styles.heroBadgeStage}>
              <Animated.View
                style={[
                  styles.heroRipple,
                  {
                    transform: [{ scale: rippleScale }],
                    opacity: rippleOpacity,
                  },
                ]}
              />

              <Animated.View
                style={[
                  styles.heroFloatingChip,
                  styles.heroChipLeft,
                  { transform: [{ translateY: orbitY }] },
                ]}
              >
                <Ionicons name="leaf-outline" size={scale(16)} color={BRAND_GREEN} />
              </Animated.View>

              <Animated.View
                style={[
                  styles.heroFloatingChip,
                  styles.heroChipRight,
                  { transform: [{ translateY: orbitYInverse }] },
                ]}
              >
                <Ionicons name="flash-outline" size={scale(16)} color="#B7791F" />
              </Animated.View>

              <Animated.View style={{ transform: [{ scale: coreScale }] }}>
                <LinearGradient
                  colors={[BRAND_GREEN, "#10B26C"]}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 1 }}
                  style={styles.heroBadge}
                >
                  <View style={styles.heroLogoPlate}>
                    <Image source={BRAND_LOGO} style={styles.heroLogo} resizeMode="contain" />
                  </View>
                </LinearGradient>
              </Animated.View>
            </View>

            <Text style={styles.heroTitle}>{title}</Text>
            <Text style={styles.heroSubtitle}>{subtitle}</Text>

            <View style={styles.statusPill}>
              <Ionicons name="storefront-outline" size={scale(16)} color={BRAND_GREEN} />
              <Text style={styles.statusText}>Checking nearby stores and fresh stock</Text>
            </View>

            <View style={styles.progressTrack}>
              <Animated.View style={[styles.progressFill, { width: progressWidth }]} />
            </View>

            <View style={styles.loadingDotsRow}>
              <Animated.View style={[styles.loadingDot, { opacity: dotOneOpacity }]} />
              <Animated.View style={[styles.loadingDot, { opacity: dotTwoOpacity }]} />
              <Animated.View style={[styles.loadingDot, { opacity: dotThreeOpacity }]} />
            </View>
          </Animated.View>

          <Text style={styles.footerText}>Fresh groceries. Better prices. Faster doorstep delivery.</Text>
        </View>
      </View>
    );
  }

  return (
    <View style={[styles.compactWrap, style]}>
      <Animated.View
        style={[
          styles.compactRipple,
          {
            backgroundColor: color,
            transform: [{ scale: rippleScale }],
            opacity: rippleOpacity,
          },
        ]}
      />

      <Animated.View
        style={[
          styles.compactChip,
          styles.compactChipLeft,
          { transform: [{ translateY: orbitY }] },
        ]}
      >
        <Ionicons name="leaf-outline" size={scale(14)} color={color} />
      </Animated.View>

      <Animated.View
        style={[
          styles.compactChip,
          styles.compactChipRight,
          { transform: [{ translateY: orbitYInverse }] },
        ]}
      >
        <Ionicons name="flash-outline" size={scale(14)} color="#B7791F" />
      </Animated.View>

      <Animated.View style={{ transform: [{ translateY: floatY }, { scale: coreScale }] }}>
        <LinearGradient
          colors={[color, BRAND_GREEN_DARK]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={styles.compactCore}
        >
          <View style={styles.compactCoreInner}>
            <Ionicons name="cart-outline" size={scale(28)} color="#fff" />
          </View>
        </LinearGradient>
      </Animated.View>
    </View>
  );
};

export default AppLoader;

const styles = StyleSheet.create({
  smallLoader: {
    width: scale(20),
    height: scale(20),
    justifyContent: "center",
    alignItems: "center",
  },
  screen: {
    flex: 1,
    backgroundColor: "#FFFFFF",
  },
  bgOrbTop: {
    position: "absolute",
    top: verticalScale(-95),
    right: scale(-70),
    width: scale(250),
    height: scale(250),
    borderRadius: scale(125),
    backgroundColor: "#FFF0C8",
    opacity: 0.75,
  },
  bgOrbBottom: {
    position: "absolute",
    bottom: verticalScale(-110),
    left: scale(-85),
    width: scale(300),
    height: scale(300),
    borderRadius: scale(150),
    backgroundColor: "#DFF5E7",
    opacity: 0.8,
  },
  bgBubbleOne: {
    position: "absolute",
    top: verticalScale(160),
    left: scale(28),
    width: scale(16),
    height: scale(16),
    borderRadius: scale(8),
    backgroundColor: "#FFE39B",
    opacity: 0.9,
  },
  bgBubbleTwo: {
    position: "absolute",
    top: verticalScale(220),
    right: scale(34),
    width: scale(22),
    height: scale(22),
    borderRadius: scale(11),
    backgroundColor: "#D6F3E2",
    opacity: 0.9,
  },
  screenContent: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: scale(22),
  },
  quickFactsRow: {
    width: "100%",
    flexDirection: "row",
    justifyContent: "center",
    flexWrap: "wrap",
    gap: scale(8),
    marginBottom: verticalScale(30),
  },
  quickFactChip: {
    flexDirection: "row",
    alignItems: "center",
    gap: scale(6),
    backgroundColor: "rgba(255,255,255,0.88)",
    borderRadius: scale(999),
    paddingHorizontal: scale(12),
    paddingVertical: scale(8),
    borderWidth: 1,
    borderColor: "#E2F2E9",
  },
  quickFactText: {
    fontSize: moderateScale(12),
    fontWeight: "700",
    color: "#1F2937",
  },
  heroCard: {
    width: "100%",
    maxWidth: scale(320),
    alignItems: "center",
    backgroundColor: "rgba(255,255,255,0.9)",
    borderRadius: scale(30),
    paddingHorizontal: scale(24),
    paddingTop: verticalScale(28),
    paddingBottom: verticalScale(24),
    borderWidth: 1,
    borderColor: "#ECF4EE",
    shadowColor: "#0A8754",
    shadowOffset: { width: 0, height: verticalScale(12) },
    shadowOpacity: 0.1,
    shadowRadius: scale(18),
    elevation: 8,
  },
  heroBadgeStage: {
    justifyContent: "center",
    alignItems: "center",
    marginBottom: verticalScale(20),
  },
  heroRipple: {
    position: "absolute",
    width: scale(132),
    height: scale(132),
    borderRadius: scale(66),
    backgroundColor: BRAND_GREEN,
  },
  heroFloatingChip: {
    position: "absolute",
    width: scale(38),
    height: scale(38),
    borderRadius: scale(19),
    backgroundColor: "#fff",
    justifyContent: "center",
    alignItems: "center",
    borderWidth: 1,
    borderColor: "#E6F4EC",
    shadowColor: "#0F172A",
    shadowOffset: { width: 0, height: scale(4) },
    shadowOpacity: 0.08,
    shadowRadius: scale(10),
    elevation: 4,
  },
  heroChipLeft: {
    left: scale(-10),
    top: scale(18),
  },
  heroChipRight: {
    right: scale(-10),
    bottom: scale(18),
  },
  heroBadge: {
    width: scale(118),
    height: scale(118),
    borderRadius: scale(59),
    justifyContent: "center",
    alignItems: "center",
    shadowColor: BRAND_GREEN,
    shadowOffset: { width: 0, height: scale(10) },
    shadowOpacity: 0.22,
    shadowRadius: scale(18),
    elevation: 10,
  },
  heroLogoPlate: {
    width: scale(90),
    height: scale(90),
    borderRadius: scale(28),
    backgroundColor: "#FFFFFF",
    justifyContent: "center",
    alignItems: "center",
  },
  heroLogo: {
    width: "76%",
    height: "76%",
  },
  heroTitle: {
    fontSize: moderateScale(28),
    fontWeight: "900",
    color: "#0F172A",
    letterSpacing: scale(-0.6),
    textAlign: "center",
  },
  heroSubtitle: {
    fontSize: moderateScale(14),
    lineHeight: moderateScale(21),
    color: "#64748B",
    textAlign: "center",
    marginTop: verticalScale(8),
    marginBottom: verticalScale(18),
  },
  statusPill: {
    width: "100%",
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: scale(8),
    backgroundColor: SOFT_GREEN,
    borderRadius: scale(16),
    paddingHorizontal: scale(12),
    paddingVertical: scale(10),
  },
  statusText: {
    fontSize: moderateScale(12),
    fontWeight: "700",
    color: "#1F2937",
  },
  progressTrack: {
    width: "100%",
    height: scale(10),
    backgroundColor: "#E8F3EC",
    borderRadius: scale(999),
    overflow: "hidden",
    marginTop: verticalScale(18),
  },
  progressFill: {
    height: "100%",
    borderRadius: scale(999),
    backgroundColor: BRAND_GREEN,
  },
  loadingDotsRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: scale(8),
    marginTop: verticalScale(16),
  },
  loadingDot: {
    width: scale(8),
    height: scale(8),
    borderRadius: scale(4),
    backgroundColor: WARM_YELLOW,
  },
  footerText: {
    marginTop: verticalScale(26),
    fontSize: moderateScale(12),
    fontWeight: "600",
    color: "#7C8B9A",
    textAlign: "center",
  },
  compactWrap: {
    width: scale(124),
    height: scale(124),
    justifyContent: "center",
    alignItems: "center",
  },
  compactRipple: {
    position: "absolute",
    width: scale(88),
    height: scale(88),
    borderRadius: scale(44),
  },
  compactChip: {
    position: "absolute",
    width: scale(28),
    height: scale(28),
    borderRadius: scale(14),
    backgroundColor: "#fff",
    justifyContent: "center",
    alignItems: "center",
    borderWidth: 1,
    borderColor: "#E6F4EC",
  },
  compactChipLeft: {
    left: scale(16),
    top: scale(26),
  },
  compactChipRight: {
    right: scale(16),
    bottom: scale(26),
  },
  compactCore: {
    width: scale(88),
    height: scale(88),
    borderRadius: scale(44),
    justifyContent: "center",
    alignItems: "center",
    shadowColor: BRAND_GREEN,
    shadowOffset: { width: 0, height: scale(8) },
    shadowOpacity: 0.18,
    shadowRadius: scale(14),
    elevation: 8,
  },
  compactCoreInner: {
    width: scale(62),
    height: scale(62),
    borderRadius: scale(31),
    backgroundColor: "rgba(255,255,255,0.14)",
    justifyContent: "center",
    alignItems: "center",
  },
});
