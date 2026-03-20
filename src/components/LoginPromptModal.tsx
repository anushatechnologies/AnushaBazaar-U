import React from "react";
import {
  View,
  Text,
  StyleSheet,
  Modal,
  Pressable,
  Animated,
  Dimensions,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";

const { width, height } = Dimensions.get("window");

interface LoginPromptModalProps {
  isVisible: boolean;
  onClose: () => void;
  onLogin: () => void;
  title?: string;
  message?: string;
}

const LoginPromptModal = ({
  isVisible,
  onClose,
  onLogin,
  title = "Login Required",
  message = "Please login to manage your orders, saved addresses, and faster checkout experience.",
}: LoginPromptModalProps) => {
  return (
    <Modal
      visible={isVisible}
      transparent
      animationType="fade"
      onRequestClose={onClose}
    >
      <View style={styles.overlay}>
        <Pressable style={styles.backdrop} onPress={onClose} />
        
        <Animated.View style={styles.content}>
          <View style={styles.iconContainer}>
            <View style={styles.iconCircle}>
              <Ionicons name="person" size={40} color="#0A8754" />
            </View>
            <View style={styles.pulse1} />
            <View style={styles.pulse2} />
          </View>

          <Text style={styles.title}>{title}</Text>
          <Text style={styles.message}>{message}</Text>

          <View style={styles.buttonContainer}>
            <Pressable
              style={({ pressed }) => [
                styles.loginBtn,
                pressed && styles.btnPressed,
              ]}
              onPress={onLogin}
            >
              <Text style={styles.loginBtnText}>Login Now</Text>
              <Ionicons name="arrow-forward" size={18} color="#fff" />
            </Pressable>

            <Pressable
              style={({ pressed }) => [
                styles.cancelBtn,
                pressed && styles.btnPressed,
              ]}
              onPress={onClose}
            >
              <Text style={styles.cancelBtnText}>Maybe Later</Text>
            </Pressable>
          </View>
        </Animated.View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "rgba(0,0,0,0.5)",
  },
  backdrop: {
    ...StyleSheet.absoluteFillObject,
  },
  content: {
    width: width * 0.85,
    backgroundColor: "#fff",
    borderRadius: 30,
    padding: 30,
    alignItems: "center",
    elevation: 20,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.2,
    shadowRadius: 20,
  },
  iconContainer: {
    width: 100,
    height: 100,
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 25,
  },
  iconCircle: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: "#E6F5EE",
    justifyContent: "center",
    alignItems: "center",
    zIndex: 2,
  },
  pulse1: {
    position: "absolute",
    width: 90,
    height: 90,
    borderRadius: 45,
    backgroundColor: "rgba(10, 135, 84, 0.1)",
    zIndex: 1,
  },
  pulse2: {
    position: "absolute",
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: "rgba(10, 135, 84, 0.05)",
    zIndex: 0,
  },
  title: {
    fontSize: 22,
    fontWeight: "900",
    color: "#111",
    marginBottom: 12,
    textAlign: "center",
  },
  message: {
    fontSize: 14,
    color: "#666",
    textAlign: "center",
    lineHeight: 20,
    marginBottom: 30,
    paddingHorizontal: 10,
  },
  buttonContainer: {
    width: "100%",
    gap: 12,
  },
  loginBtn: {
    backgroundColor: "#0A8754",
    height: 56,
    borderRadius: 18,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    shadowColor: "#0A8754",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
  },
  loginBtnText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "800",
  },
  cancelBtn: {
    height: 50,
    borderRadius: 18,
    alignItems: "center",
    justifyContent: "center",
  },
  cancelBtnText: {
    color: "#888",
    fontSize: 14,
    fontWeight: "700",
  },
  btnPressed: {
    opacity: 0.8,
    transform: [{ scale: 0.98 }],
  },
});

export default LoginPromptModal;
