import React, { useEffect, useRef, useState } from "react";
import {
  Animated,
  Easing,
  Image,
  ImageSourcePropType,
  StyleProp,
  StyleSheet,
  Text,
  View,
  ViewStyle,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import {
  moderateScale,
  scale,
  screenWidth,
  verticalScale,
} from "../utils/responsive";

const BRAND_GREEN = "#0A8754";
const BRAND_GREEN_DARK = "#06683F";
const WARM_YELLOW = "#FFC94A";
const SOFT_MINT = "#F4FFF8";
const BRAND_LOGO = require("../../assets/company-logo.png");

// ─── Grocery item images ───────────────────────────────────────────
const GROCERY_IMAGES = {
  rice: require("../../assets/images/loader/rice_bag.png"),
  banana: require("../../assets/images/loader/banana.png"),
  tomato: require("../../assets/images/loader/tomato.png"),
  milk: require("../../assets/images/loader/milk.png"),
  carrot: require("../../assets/images/loader/carrot.png"),
  apple: require("../../assets/images/loader/apple.png"),
};

interface GroceryDef {
  id: string;
  image: ImageSourcePropType;
  label: string;
  size: number;
  angle: number; // degrees from 12‑o'clock
}

const GROCERY_ITEMS: GroceryDef[] = [
  { id: "rice", image: GROCERY_IMAGES.rice, label: "Rice", size: 52, angle: 0 },
  { id: "banana", image: GROCERY_IMAGES.banana, label: "Banana", size: 44, angle: 60 },
  { id: "tomato", image: GROCERY_IMAGES.tomato, label: "Tomato", size: 40, angle: 120 },
  { id: "milk", image: GROCERY_IMAGES.milk, label: "Milk", size: 46, angle: 180 },
  { id: "carrot", image: GROCERY_IMAGES.carrot, label: "Carrot", size: 42, angle: 240 },
  { id: "apple", image: GROCERY_IMAGES.apple, label: "Apple", size: 38, angle: 300 },
];

const LOADING_TEXTS = [
  "🛒  Filling your cart with goodness…",
  "🍚  Packing premium rice bags…",
  "🍌  Picking the freshest fruits…",
  "🥕  Selecting farm-fresh veggies…",
  "🥛  Adding daily essentials…",
  "📦  Almost ready for you…",
];

interface Props {
  size?: "small" | "large";
  color?: string;
  style?: StyleProp<ViewStyle>;
  fullScreen?: boolean;
  title?: string;
  subtitle?: string;
}

/* ================================================================
   Single orbiting grocery bubble – self‑contained animations
   ================================================================ */
const OrbitBubble = ({
  item,
  index,
}: {
  item: GroceryDef;
  index: number;
}) => {
  const entry = useRef(new Animated.Value(0)).current;
  const bounce = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    // staggered pop‑in
    const t = setTimeout(() => {
      Animated.spring(entry, {
        toValue: 1,
        friction: 5,
        tension: 80,
        useNativeDriver: true,
      }).start();
    }, index * 150);

    // continuous gentle bounce
    Animated.loop(
      Animated.sequence([
        Animated.timing(bounce, {
          toValue: 1,
          duration: 1300 + index * 200,
          easing: Easing.inOut(Easing.sin),
          useNativeDriver: true,
        }),
        Animated.timing(bounce, {
          toValue: 0,
          duration: 1300 + index * 200,
          easing: Easing.inOut(Easing.sin),
          useNativeDriver: true,
        }),
      ])
    ).start();

    return () => clearTimeout(t);
  }, [bounce, entry, index]);

  const sz = scale(item.size);

  const bounceY = bounce.interpolate({
    inputRange: [0, 1],
    outputRange: [0, -scale(7)],
  });

  return (
    <Animated.View
      style={{
        width: sz,
        height: sz,
        transform: [{ translateY: bounceY }, { scale: entry }],
        opacity: entry,
      }}
    >
      <View
        style={{
          width: sz,
          height: sz,
          borderRadius: sz / 2,
          backgroundColor: "rgba(255,255,255,0.96)",
          justifyContent: "center",
          alignItems: "center",
          shadowColor: "#000",
          shadowOffset: { width: 0, height: scale(3) },
          shadowOpacity: 0.12,
          shadowRadius: scale(6),
          elevation: 5,
          borderWidth: 1.5,
          borderColor: "rgba(10,135,84,0.10)",
        }}
      >
        <Image
          source={item.image}
          style={{ width: sz * 0.62, height: sz * 0.62 }}
          resizeMode="contain"
        />
      </View>
    </Animated.View>
  );
};

/* ================================================================
   Floating decorative particle
   ================================================================ */
const Particle = ({
  delay,
  x,
  y,
  size,
  color,
}: {
  delay: number;
  x: number;
  y: number;
  size: number;
  color: string;
}) => {
  const a = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    const t = setTimeout(() => {
      Animated.loop(
        Animated.sequence([
          Animated.timing(a, { toValue: 1, duration: 2800, easing: Easing.inOut(Easing.sin), useNativeDriver: true }),
          Animated.timing(a, { toValue: 0, duration: 2800, easing: Easing.inOut(Easing.sin), useNativeDriver: true }),
        ])
      ).start();
    }, delay);
    return () => clearTimeout(t);
  }, [a, delay]);

  return (
    <Animated.View
      style={{
        position: "absolute",
        left: x,
        top: y,
        width: scale(size),
        height: scale(size),
        borderRadius: scale(size / 2),
        backgroundColor: color,
        transform: [{ translateY: a.interpolate({ inputRange: [0, 1], outputRange: [0, -scale(18)] }) }],
        opacity: a.interpolate({ inputRange: [0, 0.5, 1], outputRange: [0.3, 0.8, 0.3] }),
      }}
    />
  );
};

/* ================================================================
   Animated badge in the bottom row
   ================================================================ */
const Badge = ({ item, index }: { item: GroceryDef; index: number }) => {
  const pop = useRef(new Animated.Value(0)).current;
  const pulse = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    const t = setTimeout(() => {
      Animated.spring(pop, { toValue: 1, friction: 5, tension: 80, useNativeDriver: true }).start();
    }, 350 + index * 160);

    Animated.loop(
      Animated.sequence([
        Animated.timing(pulse, { toValue: 1, duration: 1500 + index * 200, easing: Easing.inOut(Easing.sin), useNativeDriver: true }),
        Animated.timing(pulse, { toValue: 0, duration: 1500 + index * 200, easing: Easing.inOut(Easing.sin), useNativeDriver: true }),
      ])
    ).start();

    return () => clearTimeout(t);
  }, [index, pop, pulse]);

  const s = pulse.interpolate({ inputRange: [0, 1], outputRange: [0.93, 1.07] });

  return (
    <Animated.View
      style={[
        styles.groceryBadge,
        { transform: [{ scale: Animated.multiply(pop, s) }], opacity: pop },
      ]}
    >
      <Image source={item.image} style={styles.groceryBadgeImage} resizeMode="contain" />
    </Animated.View>
  );
};

/* ================================================================
   MAIN LOADER COMPONENT
   ================================================================ */
const AppLoader = ({
  size = "large",
  color = BRAND_GREEN,
  style,
  fullScreen = false,
  title = "Anusha Bazaar",
  subtitle = "Packing fresh groceries, fruits, and daily essentials for your doorstep.",
}: Props) => {
  const isSmall = size === "small";

  /* shared animations */
  const orbitSpin = useRef(new Animated.Value(0)).current;
  const pulse = useRef(new Animated.Value(0)).current;
  const float = useRef(new Animated.Value(0)).current;
  const progress = useRef(new Animated.Value(0)).current;
  const spinner = useRef(new Animated.Value(0)).current;
  const shimmer = useRef(new Animated.Value(0)).current;

  /* cycling status text */
  const [textIdx, setTextIdx] = useState(0);
  const textFade = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    const loops = [
      Animated.loop(
        Animated.timing(orbitSpin, { toValue: 1, duration: 10000, easing: Easing.linear, useNativeDriver: true })
      ),
      Animated.loop(
        Animated.sequence([
          Animated.timing(pulse, { toValue: 1, duration: 1200, easing: Easing.inOut(Easing.cubic), useNativeDriver: true }),
          Animated.timing(pulse, { toValue: 0, duration: 1200, easing: Easing.inOut(Easing.cubic), useNativeDriver: true }),
        ])
      ),
      Animated.loop(
        Animated.sequence([
          Animated.timing(float, { toValue: 1, duration: 2000, easing: Easing.inOut(Easing.sin), useNativeDriver: true }),
          Animated.timing(float, { toValue: 0, duration: 2000, easing: Easing.inOut(Easing.sin), useNativeDriver: true }),
        ])
      ),
      Animated.loop(
        Animated.sequence([
          Animated.timing(progress, { toValue: 1, duration: 1500, easing: Easing.inOut(Easing.cubic), useNativeDriver: false }),
          Animated.timing(progress, { toValue: 0, duration: 1500, easing: Easing.inOut(Easing.cubic), useNativeDriver: false }),
        ])
      ),
      Animated.loop(
        Animated.timing(spinner, { toValue: 1, duration: 850, easing: Easing.linear, useNativeDriver: true })
      ),
      Animated.loop(
        Animated.sequence([
          Animated.timing(shimmer, { toValue: 1, duration: 2200, easing: Easing.inOut(Easing.sin), useNativeDriver: true }),
          Animated.timing(shimmer, { toValue: 0, duration: 2200, easing: Easing.inOut(Easing.sin), useNativeDriver: true }),
        ])
      ),
    ];
    loops.forEach((l) => l.start());
    return () => loops.forEach((l) => l.stop());
  }, [orbitSpin, pulse, float, progress, spinner, shimmer]);

  /* text cycler */
  useEffect(() => {
    const iv = setInterval(() => {
      Animated.timing(textFade, { toValue: 0, duration: 250, useNativeDriver: true }).start(() => {
        setTextIdx((p) => (p + 1) % LOADING_TEXTS.length);
        Animated.timing(textFade, { toValue: 1, duration: 250, useNativeDriver: true }).start();
      });
    }, 2200);
    return () => clearInterval(iv);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  /* interpolations */
  const coreScale = pulse.interpolate({ inputRange: [0, 1], outputRange: [0.96, 1.06] });
  const rippleScale = pulse.interpolate({ inputRange: [0, 1], outputRange: [1, 1.55] });
  const rippleOp = pulse.interpolate({ inputRange: [0, 0.5, 1], outputRange: [0.22, 0.08, 0] });
  const floatY = float.interpolate({ inputRange: [0, 1], outputRange: [0, -scale(8)] });
  const progressW = progress.interpolate({ inputRange: [0, 1], outputRange: [scale(30), Math.min(screenWidth * 0.52, scale(210))] });
  const spinDeg = spinner.interpolate({ inputRange: [0, 1], outputRange: ["0deg", "360deg"] });
  const orbitDeg = orbitSpin.interpolate({ inputRange: [0, 1], outputRange: ["0deg", "360deg"] });
  const counterDeg = orbitSpin.interpolate({ inputRange: [0, 1], outputRange: ["0deg", "-360deg"] });
  const shimOp = shimmer.interpolate({ inputRange: [0, 1], outputRange: [0.4, 1] });

  /* ── small spinner ────────────────────────────────────── */
  if (isSmall) {
    return (
      <Animated.View style={[styles.smallLoader, { transform: [{ rotate: spinDeg }] }, style]}>
        <Ionicons name="refresh-outline" size={scale(18)} color={color} />
      </Animated.View>
    );
  }

  const ORBIT_R = scale(105);
  const ZONE = ORBIT_R * 2 + scale(48);

  /* ── fullscreen splash ────────────────────────────────── */
  if (fullScreen) {
    return (
      <View style={[styles.screen, style]}>
        {/* gradient bg */}
        <LinearGradient
          colors={["#FFF7E8", "#E8F8EE", SOFT_MINT, "#FFFFFF"]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={StyleSheet.absoluteFillObject}
        />

        {/* decorative orbs */}
        <View style={styles.bgOrbTop} />
        <View style={styles.bgOrbBottom} />

        {/* floating particles */}
        <Particle delay={0} x={scale(30)} y={verticalScale(120)} size={10} color="#FFE39B" />
        <Particle delay={400} x={scale(300)} y={verticalScale(180)} size={8} color="#D6F3E2" />
        <Particle delay={800} x={scale(60)} y={verticalScale(580)} size={12} color="#FFD89B" />
        <Particle delay={1200} x={scale(280)} y={verticalScale(640)} size={7} color="#C8EDDA" />
        <Particle delay={200} x={scale(180)} y={verticalScale(100)} size={6} color="#FFE39B" />
        <Particle delay={600} x={scale(330)} y={verticalScale(420)} size={9} color="#D6F3E2" />
        <Particle delay={1000} x={scale(20)} y={verticalScale(380)} size={8} color="#FFD89B" />
        <Particle delay={1400} x={scale(160)} y={verticalScale(700)} size={10} color="#C8EDDA" />

        <View style={styles.screenContent}>
          {/* ─── orbit zone ─────────────────────────────────── */}
          <View style={[styles.orbitZone, { width: ZONE, height: ZONE }]}>
            {/* dashed orbit ring */}
            <Animated.View
              style={[
                styles.orbitRing,
                { width: ZONE, height: ZONE, borderRadius: ZONE / 2, opacity: shimOp },
              ]}
            />

            {/* rotating container with counter‑rotated children */}
            <Animated.View
              style={[
                styles.orbitItems,
                { width: ZONE, height: ZONE, transform: [{ rotate: orbitDeg }] },
              ]}
            >
              {GROCERY_ITEMS.map((item, i) => {
                const rad = ((item.angle - 90) * Math.PI) / 180;
                const cx = Math.cos(rad) * ORBIT_R;
                const cy = Math.sin(rad) * ORBIT_R;
                const sz = scale(item.size);
                return (
                  <Animated.View
                    key={item.id}
                    style={{
                      position: "absolute",
                      left: ZONE / 2 - sz / 2 + cx,
                      top: ZONE / 2 - sz / 2 + cy,
                      width: sz,
                      height: sz,
                      transform: [{ rotate: counterDeg }],
                    }}
                  >
                    <OrbitBubble item={item} index={i} />
                  </Animated.View>
                );
              })}
            </Animated.View>

            {/* central pulsing logo */}
            <Animated.View
              style={[styles.centralLogo, { transform: [{ translateY: floatY }, { scale: coreScale }] }]}
            >
              <Animated.View
                style={[styles.ripple, { transform: [{ scale: rippleScale }], opacity: rippleOp }]}
              />
              <LinearGradient
                colors={[BRAND_GREEN, "#12C776"]}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={styles.logoBadge}
              >
                <View style={styles.logoPlate}>
                  <Image source={BRAND_LOGO} style={styles.logoImg} resizeMode="contain" />
                </View>
              </LinearGradient>
            </Animated.View>
          </View>

          {/* title */}
          <Text style={styles.heroTitle}>{title}</Text>
          <Text style={styles.heroSub}>{subtitle}</Text>

          {/* cycling status */}
          <Animated.View style={[styles.statusPill, { opacity: textFade }]}>
            <Text style={styles.statusTxt}>{LOADING_TEXTS[textIdx]}</Text>
          </Animated.View>

          {/* gradient progress bar */}
          <View style={styles.progressTrack}>
            <Animated.View style={[styles.progressFill, { width: progressW }]}>
              <LinearGradient
                colors={[BRAND_GREEN, "#12C776", WARM_YELLOW]}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0 }}
                style={StyleSheet.absoluteFillObject}
              />
            </Animated.View>
          </View>

          {/* bottom badge row */}
          <View style={styles.badgeRow}>
            {GROCERY_ITEMS.map((g, i) => (
              <Badge key={g.id} item={g} index={i} />
            ))}
          </View>
        </View>

        <Text style={styles.footer}>Fresh groceries • Better prices • Faster delivery</Text>
      </View>
    );
  }

  /* ── compact (inline) loader ──────────────────────────── */
  return (
    <View style={[styles.compactWrap, style]}>
      <Animated.View
        style={[styles.compactRipple, { backgroundColor: color, transform: [{ scale: rippleScale }], opacity: rippleOp }]}
      />

      {GROCERY_ITEMS.slice(0, 3).map((item, i) => {
        const a = ((i * 120 - 90) * Math.PI) / 180;
        const r = scale(44);
        return (
          <Animated.View
            key={item.id}
            style={{
              position: "absolute",
              left: scale(62) + Math.cos(a) * r - scale(14),
              top: scale(62) + Math.sin(a) * r - scale(14),
              transform: [{ scale: coreScale }],
            }}
          >
            <View style={styles.compactChip}>
              <Image source={item.image} style={{ width: scale(20), height: scale(20) }} resizeMode="contain" />
            </View>
          </Animated.View>
        );
      })}

      <Animated.View style={{ transform: [{ translateY: floatY }, { scale: coreScale }] }}>
        <LinearGradient
          colors={[color, BRAND_GREEN_DARK]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={styles.compactCore}
        >
          <View style={styles.compactInner}>
            <Ionicons name="cart-outline" size={scale(28)} color="#fff" />
          </View>
        </LinearGradient>
      </Animated.View>
    </View>
  );
};

export default AppLoader;

/* ================================================================
   STYLES
   ================================================================ */
const styles = StyleSheet.create({
  /* small */
  smallLoader: { width: scale(20), height: scale(20), justifyContent: "center", alignItems: "center" },

  /* screen */
  screen: { flex: 1, backgroundColor: "#FFF" },
  bgOrbTop: {
    position: "absolute", top: verticalScale(-80), right: scale(-60),
    width: scale(220), height: scale(220), borderRadius: scale(110),
    backgroundColor: "#FFF0C8", opacity: 0.6,
  },
  bgOrbBottom: {
    position: "absolute", bottom: verticalScale(-90), left: scale(-70),
    width: scale(260), height: scale(260), borderRadius: scale(130),
    backgroundColor: "#DFF5E7", opacity: 0.5,
  },
  screenContent: {
    flex: 1, justifyContent: "center", alignItems: "center",
    paddingHorizontal: scale(24),
  },

  /* orbit */
  orbitZone: { justifyContent: "center", alignItems: "center", marginBottom: verticalScale(16) },
  orbitRing: {
    position: "absolute", borderWidth: 1.5,
    borderColor: "rgba(10,135,84,0.08)", borderStyle: "dashed",
  },
  orbitItems: { position: "absolute", justifyContent: "center", alignItems: "center" },

  /* central logo */
  centralLogo: { justifyContent: "center", alignItems: "center" },
  ripple: {
    position: "absolute", width: scale(115), height: scale(115),
    borderRadius: scale(58), backgroundColor: BRAND_GREEN,
  },
  logoBadge: {
    width: scale(98), height: scale(98), borderRadius: scale(49),
    justifyContent: "center", alignItems: "center",
    shadowColor: BRAND_GREEN, shadowOffset: { width: 0, height: scale(8) },
    shadowOpacity: 0.25, shadowRadius: scale(16), elevation: 12,
  },
  logoPlate: {
    width: scale(74), height: scale(74), borderRadius: scale(22),
    backgroundColor: "#FFF", justifyContent: "center", alignItems: "center",
  },
  logoImg: { width: "78%", height: "78%" },

  /* text */
  heroTitle: {
    fontSize: moderateScale(28), fontWeight: "900", color: "#0F172A",
    letterSpacing: scale(-0.5), textAlign: "center",
  },
  heroSub: {
    fontSize: moderateScale(13), lineHeight: moderateScale(20), color: "#64748B",
    textAlign: "center", marginTop: verticalScale(6), marginBottom: verticalScale(14),
    maxWidth: scale(280),
  },

  /* status pill */
  statusPill: {
    flexDirection: "row", alignItems: "center", justifyContent: "center",
    backgroundColor: "rgba(255,255,255,0.92)", borderRadius: scale(20),
    paddingHorizontal: scale(18), paddingVertical: scale(10),
    marginBottom: verticalScale(12),
    borderWidth: 1, borderColor: "#E2F2E9",
    shadowColor: "#0A8754", shadowOffset: { width: 0, height: scale(2) },
    shadowOpacity: 0.06, shadowRadius: scale(6), elevation: 2,
  },
  statusTxt: { fontSize: moderateScale(13), fontWeight: "700", color: "#1F2937" },

  /* progress */
  progressTrack: {
    width: "80%", maxWidth: scale(260), height: scale(8),
    backgroundColor: "#E8F3EC", borderRadius: scale(999),
    overflow: "hidden", marginBottom: verticalScale(14),
  },
  progressFill: { height: "100%", borderRadius: scale(999), overflow: "hidden" },

  /* badges */
  badgeRow: {
    flexDirection: "row", justifyContent: "center", alignItems: "center",
    gap: scale(10), flexWrap: "wrap",
  },
  groceryBadge: {
    width: scale(42), height: scale(42), borderRadius: scale(21),
    backgroundColor: "#FFF", justifyContent: "center", alignItems: "center",
    borderWidth: 1.5, borderColor: "#E6F4EC",
    shadowColor: "#0A8754", shadowOffset: { width: 0, height: scale(3) },
    shadowOpacity: 0.1, shadowRadius: scale(6), elevation: 4,
  },
  groceryBadgeImage: { width: scale(26), height: scale(26) },

  /* footer */
  footer: {
    position: "absolute", bottom: verticalScale(36), alignSelf: "center",
    fontSize: moderateScale(11), fontWeight: "600", color: "#94A3B8",
    textAlign: "center", letterSpacing: 0.5,
  },

  /* compact */
  compactWrap: { width: scale(124), height: scale(124), justifyContent: "center", alignItems: "center" },
  compactRipple: {
    position: "absolute", width: scale(88), height: scale(88), borderRadius: scale(44),
  },
  compactCore: {
    width: scale(70), height: scale(70), borderRadius: scale(35),
    justifyContent: "center", alignItems: "center",
    shadowColor: BRAND_GREEN, shadowOffset: { width: 0, height: scale(6) },
    shadowOpacity: 0.18, shadowRadius: scale(12), elevation: 8,
  },
  compactInner: {
    width: scale(50), height: scale(50), borderRadius: scale(25),
    backgroundColor: "rgba(255,255,255,0.14)", justifyContent: "center", alignItems: "center",
  },
  compactChip: {
    width: scale(28), height: scale(28), borderRadius: scale(14),
    backgroundColor: "#fff", justifyContent: "center", alignItems: "center",
    borderWidth: 1, borderColor: "#E6F4EC",
    shadowColor: "#000", shadowOffset: { width: 0, height: scale(2) },
    shadowOpacity: 0.1, shadowRadius: scale(4), elevation: 3,
  },
});
