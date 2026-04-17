import React, { useEffect, useRef } from "react";
import {
  View,
  Text,
  StyleSheet,
  Modal,
  TouchableOpacity,
  Animated,
  Easing,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { scale } from "../utils/responsive";

interface PaymentResultModalProps {
  visible: boolean;
  success: boolean;
  amount?: string;
  orderId?: string | number;
  message?: string;
  onDone: () => void;
  onRetry?: () => void;
}

const PaymentResultModal = ({
  visible,
  success,
  amount,
  orderId,
  message,
  onDone,
  onRetry,
}: PaymentResultModalProps) => {
  const scaleAnim = useRef(new Animated.Value(0)).current;
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const bounceAnim = useRef(new Animated.Value(0)).current;
  const rotateAnim = useRef(new Animated.Value(0)).current;
  const confettiAnims = useRef(
    Array.from({ length: 8 }, () => ({
      translateY: new Animated.Value(0),
      translateX: new Animated.Value(0),
      opacity: new Animated.Value(0),
      scale: new Animated.Value(0),
    }))
  ).current;

  useEffect(() => {
    if (visible) {
      // Reset
      scaleAnim.setValue(0);
      fadeAnim.setValue(0);
      bounceAnim.setValue(0);
      rotateAnim.setValue(0);
      confettiAnims.forEach((c) => {
        c.translateY.setValue(0);
        c.translateX.setValue(0);
        c.opacity.setValue(0);
        c.scale.setValue(0);
      });

      // Main icon animation
      Animated.sequence([
        Animated.delay(100),
        Animated.parallel([
          Animated.spring(scaleAnim, {
            toValue: 1,
            tension: 40,
            friction: 5,
            useNativeDriver: true,
          }),
          Animated.timing(fadeAnim, {
            toValue: 1,
            duration: 400,
            useNativeDriver: true,
          }),
        ]),
      ]).start();

      if (success) {
        // Bounce checkmark
        Animated.sequence([
          Animated.delay(400),
          Animated.spring(bounceAnim, {
            toValue: 1,
            tension: 60,
            friction: 4,
            useNativeDriver: true,
          }),
        ]).start();

        // Confetti burst
        confettiAnims.forEach((c, i) => {
          const angle = (i / 8) * Math.PI * 2;
          const distance = scale(80 + Math.random() * 40);
          Animated.sequence([
            Animated.delay(300 + i * 50),
            Animated.parallel([
              Animated.timing(c.translateX, {
                toValue: Math.cos(angle) * distance,
                duration: 600,
                easing: Easing.out(Easing.cubic),
                useNativeDriver: true,
              }),
              Animated.timing(c.translateY, {
                toValue: Math.sin(angle) * distance,
                duration: 600,
                easing: Easing.out(Easing.cubic),
                useNativeDriver: true,
              }),
              Animated.sequence([
                Animated.timing(c.opacity, {
                  toValue: 1,
                  duration: 200,
                  useNativeDriver: true,
                }),
                Animated.delay(200),
                Animated.timing(c.opacity, {
                  toValue: 0,
                  duration: 200,
                  useNativeDriver: true,
                }),
              ]),
              Animated.sequence([
                Animated.spring(c.scale, {
                  toValue: 1,
                  tension: 80,
                  friction: 5,
                  useNativeDriver: true,
                }),
                Animated.timing(c.scale, {
                  toValue: 0,
                  duration: 200,
                  useNativeDriver: true,
                }),
              ]),
            ]),
          ]).start();
        });
      } else {
        // Shake for failure
        Animated.sequence([
          Animated.delay(400),
          Animated.timing(rotateAnim, { toValue: 1, duration: 80, useNativeDriver: true }),
          Animated.timing(rotateAnim, { toValue: -1, duration: 80, useNativeDriver: true }),
          Animated.timing(rotateAnim, { toValue: 1, duration: 80, useNativeDriver: true }),
          Animated.timing(rotateAnim, { toValue: -1, duration: 80, useNativeDriver: true }),
          Animated.timing(rotateAnim, { toValue: 0, duration: 80, useNativeDriver: true }),
        ]).start();
      }
    }
  }, [visible, success]);

  const rotateInterpolate = rotateAnim.interpolate({
    inputRange: [-1, 0, 1],
    outputRange: ["-10deg", "0deg", "10deg"],
  });

  const confettiColors = ["#FFD700", "#FF6B6B", "#4ECDC4", "#45B7D1", "#96CEB4", "#FFEAA7", "#DDA0DD", "#98D8C8"];

  return (
    <Modal visible={visible} transparent animationType="fade">
      <View style={styles.overlay}>
        <Animated.View
          style={[
            styles.card,
            {
              transform: [{ scale: scaleAnim }],
              opacity: fadeAnim,
            },
          ]}
        >
          {/* Confetti particles (success only) */}
          {success &&
            confettiAnims.map((c, i) => (
              <Animated.View
                key={i}
                style={[
                  styles.confetti,
                  {
                    backgroundColor: confettiColors[i],
                    transform: [
                      { translateX: c.translateX },
                      { translateY: c.translateY },
                      { scale: c.scale },
                    ],
                    opacity: c.opacity,
                  },
                ]}
              />
            ))}

          {/* Icon */}
          <Animated.View
            style={[
              styles.iconCircle,
              success ? styles.successCircle : styles.failCircle,
              {
                transform: [
                  { scale: success ? bounceAnim.interpolate({ inputRange: [0, 1], outputRange: [0.5, 1] }) : scaleAnim },
                  { rotate: success ? "0deg" : rotateInterpolate },
                ],
              },
            ]}
          >
            <Ionicons
              name={success ? "checkmark" : "close"}
              size={scale(50)}
              color="#fff"
            />
          </Animated.View>

          {/* Title */}
          <Text style={[styles.title, !success && { color: "#EF4444" }]}>
            {success ? "Payment Successful!" : "Payment Failed"}
          </Text>

          {/* Amount */}
          {amount && (
            <Text style={styles.amount}>₹{amount}</Text>
          )}

          {/* Message */}
          <Text style={styles.message}>
            {message ||
              (success
                ? "Your payment has been processed successfully. Your order is being prepared!"
                : "Something went wrong with your payment. Please try again.")}
          </Text>

          {/* Order ID */}
          {orderId && success && (
            <View style={styles.orderIdBox}>
              <Text style={styles.orderIdLabel}>Order ID</Text>
              <Text style={styles.orderIdValue}>#{orderId}</Text>
            </View>
          )}

          {/* Actions */}
          <View style={styles.actions}>
            <TouchableOpacity
              style={[styles.primaryBtn, success ? styles.successBtn : styles.failBtn]}
              onPress={onDone}
              activeOpacity={0.8}
            >
              <Text style={styles.primaryBtnText}>
                {success ? "View Order" : "Go to My Orders"}
              </Text>
            </TouchableOpacity>

            {!success && onRetry && (
              <TouchableOpacity
                style={styles.retryBtn}
                onPress={onRetry}
                activeOpacity={0.8}
              >
                <Ionicons name="refresh-outline" size={scale(18)} color="#EF4444" />
                <Text style={styles.retryBtnText}>Try Again</Text>
              </TouchableOpacity>
            )}
          </View>
        </Animated.View>
      </View>
    </Modal>
  );
};

export default PaymentResultModal;

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.6)",
    justifyContent: "center",
    alignItems: "center",
    padding: scale(24),
  },
  card: {
    width: "100%",
    backgroundColor: "#fff",
    borderRadius: scale(28),
    padding: scale(32),
    alignItems: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: scale(20) },
    shadowOpacity: 0.25,
    shadowRadius: scale(30),
    elevation: 25,
  },
  confetti: {
    position: "absolute",
    width: scale(10),
    height: scale(10),
    borderRadius: scale(5),
    top: "40%",
  },
  iconCircle: {
    width: scale(100),
    height: scale(100),
    borderRadius: scale(50),
    justifyContent: "center",
    alignItems: "center",
    marginBottom: scale(24),
  },
  successCircle: {
    backgroundColor: "#0A8754",
    shadowColor: "#0A8754",
    shadowOffset: { width: 0, height: scale(10) },
    shadowOpacity: 0.3,
    shadowRadius: scale(20),
    elevation: 12,
  },
  failCircle: {
    backgroundColor: "#EF4444",
    shadowColor: "#EF4444",
    shadowOffset: { width: 0, height: scale(10) },
    shadowOpacity: 0.3,
    shadowRadius: scale(20),
    elevation: 12,
  },
  title: {
    fontSize: scale(22),
    fontWeight: "900",
    color: "#0A8754",
    marginBottom: scale(8),
    textAlign: "center",
  },
  amount: {
    fontSize: scale(32),
    fontWeight: "900",
    color: "#111",
    marginBottom: scale(12),
  },
  message: {
    fontSize: scale(14),
    color: "#6B7280",
    textAlign: "center",
    lineHeight: scale(21),
    marginBottom: scale(20),
    paddingHorizontal: scale(10),
  },
  orderIdBox: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#F0FDF4",
    paddingHorizontal: scale(16),
    paddingVertical: scale(10),
    borderRadius: scale(12),
    marginBottom: scale(24),
    gap: scale(8),
  },
  orderIdLabel: {
    fontSize: scale(13),
    color: "#6B7280",
    fontWeight: "600",
  },
  orderIdValue: {
    fontSize: scale(14),
    color: "#0A8754",
    fontWeight: "800",
  },
  actions: {
    width: "100%",
    gap: scale(12),
  },
  primaryBtn: {
    width: "100%",
    paddingVertical: scale(16),
    borderRadius: scale(16),
    alignItems: "center",
  },
  successBtn: {
    backgroundColor: "#0A8754",
    shadowColor: "#0A8754",
    shadowOffset: { width: 0, height: scale(6) },
    shadowOpacity: 0.25,
    shadowRadius: scale(12),
    elevation: 6,
  },
  failBtn: {
    backgroundColor: "#EF4444",
    shadowColor: "#EF4444",
    shadowOffset: { width: 0, height: scale(6) },
    shadowOpacity: 0.25,
    shadowRadius: scale(12),
    elevation: 6,
  },
  primaryBtnText: {
    color: "#fff",
    fontSize: scale(16),
    fontWeight: "800",
  },
  retryBtn: {
    width: "100%",
    paddingVertical: scale(14),
    borderRadius: scale(16),
    alignItems: "center",
    flexDirection: "row",
    justifyContent: "center",
    borderWidth: 1.5,
    borderColor: "#FEE2E2",
    backgroundColor: "#FFF5F5",
    gap: scale(8),
  },
  retryBtnText: {
    color: "#EF4444",
    fontSize: scale(15),
    fontWeight: "700",
  },
});
