import React, { useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  Pressable,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  Alert,
  ActivityIndicator,
  Image,
} from "react-native";
import { useNavigation, useRoute } from "@react-navigation/native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import auth from "@react-native-firebase/auth";
import { scale } from "../utils/responsive";

const SignupScreen = () => {
  const navigation = useNavigation<any>();
  const route = useRoute<any>();
  const insets = useSafeAreaInsets();

  const routePhone = route.params?.phone || "";
  const [phone, setPhone] = useState(routePhone);
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);

  const isValidPhone = /^[6-9]\d{9}$/.test(phone);

  const handleSignup = async () => {
    if (loading) return;

    const normalizedPhone = phone.replace(/\D/g, "").slice(0, 10);

    if (!name.trim()) {
      Alert.alert("Required", "Please enter your name");
      return;
    }
    if (!/^[6-9]\d{9}$/.test(normalizedPhone)) {
      Alert.alert("Invalid Number", "Please enter a valid 10-digit mobile number");
      return;
    }

    setLoading(true);
    try {
      // NOTE: Do NOT call auth().signOut() here!\n      // For new phone numbers, Firebase needs the Play Integrity/SafetyNet \n      // verification token intact. Calling signOut() destroys it and \n      // causes SMS delivery to silently fail for unregistered numbers.

      console.log("[Signup] Sending OTP to +91" + normalizedPhone);
      const confirmation = await auth().signInWithPhoneNumber(`+91${normalizedPhone}`);
      console.log("[Signup] OTP sent, verificationId:", confirmation.verificationId ? "received" : "missing");
      
      setLoading(false);
      
      navigation.navigate("Otp", {
        phone: normalizedPhone,
        verificationId: confirmation.verificationId,
        signupData: {
          name: name.trim(),
          email: email.trim() || undefined,
        },
      });
    } catch (error: any) {
      setLoading(false);
      console.error("[Signup] OTP error:", error?.code, error?.message);

      let errorMessage = "Could not send OTP. Please try again.";

      if (error?.code === "auth/too-many-requests") {
        errorMessage = "Too many attempts. Please wait a few minutes and try again.";
      } else if (error?.code === "auth/invalid-phone-number") {
        errorMessage = "The phone number format is invalid. Please check and try again.";
      } else if (error?.code === "auth/quota-exceeded") {
        errorMessage = "SMS quota exceeded. Please try again later.";
      } else if (error?.code === "auth/network-request-failed") {
        errorMessage = "Network error. Please check your internet connection.";
      } else if (error?.message) {
        errorMessage = error.message;
      }

      Alert.alert("Error", errorMessage);
    }
  };

  return (
    <KeyboardAvoidingView
      style={styles.root}
      behavior={Platform.OS === "ios" ? "padding" : "height"}
    >
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        bounces={false}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        <View style={styles.bgCircle1} />
        <View style={styles.bgCircle2} />

        <View style={[styles.backBtnContainer, { top: insets.top + scale(10) }]}>
          <Pressable style={styles.backBtn} onPress={() => navigation.goBack()}>
            <Ionicons name="arrow-back" size={scale(24)} color="#1E293B" />
          </Pressable>
        </View>

        <View style={[styles.content, { paddingTop: insets.top + scale(80) }]}>
          <View style={styles.header}>
            <View style={styles.logoContainer}>
              <Image
                source={require("../../assets/company-logo.png")}
                style={styles.logo}
              />
            </View>
            <Text style={styles.brandName}>Join Us</Text>
          </View>

          <View style={styles.card}>
            <Text style={styles.cardTitle}>Create Account</Text>

            <TextInput
              placeholder="Full Name"
              value={name}
              onChangeText={setName}
              style={styles.input}
            />

            <TextInput
              placeholder="Email (Optional)"
              keyboardType="email-address"
              autoCapitalize="none"
              value={email}
              onChangeText={setEmail}
              style={styles.input}
            />

            <View style={styles.phoneInputContainer}>
              <View style={styles.countryCodeContainer}>
                <Text style={styles.countryCodeText}>+91</Text>
              </View>
              <TextInput
                placeholder="Phone Number"
                placeholderTextColor="#94a3b8"
                keyboardType="number-pad"
                maxLength={10}
                value={phone}
                onChangeText={(value) => setPhone(value.replace(/\D/g, "").slice(0, 10))}
                style={styles.phoneInput}
              />
            </View>

            <Pressable
              style={({ pressed }) => [
                styles.primaryButton,
                (!name.trim() || !isValidPhone || loading) && styles.buttonDisabled,
                pressed && styles.buttonPressed,
              ]}
              onPress={handleSignup}
              disabled={!name.trim() || !isValidPhone || loading}
            >
              {loading ? (
                <ActivityIndicator color="#fff" />
              ) : (
                <Text style={styles.buttonText}>Sign Up</Text>
              )}
            </Pressable>
          </View>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
};

export default SignupScreen;

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: "#F8FAFC",
  },
  scrollContent: {
    flexGrow: 1,
  },
  bgCircle1: {
    position: "absolute",
    top: scale(-100),
    right: scale(-100),
    width: scale(300),
    height: scale(300),
    borderRadius: scale(150),
    backgroundColor: "#E2F2E9",
    opacity: 0.6,
  },
  bgCircle2: {
    position: "absolute",
    top: scale(200),
    left: scale(-150),
    width: scale(400),
    height: scale(400),
    borderRadius: scale(200),
    backgroundColor: "#FEF9C3",
    opacity: 0.4,
  },
  content: {
    flex: 1,
    paddingHorizontal: scale(28),
    paddingBottom: scale(40),
  },
  backBtnContainer: {
    position: "absolute",
    left: scale(20),
    zIndex: 100,
  },
  backBtn: {
    width: scale(44),
    height: scale(44),
    borderRadius: scale(22),
    backgroundColor: "#fff",
    justifyContent: "center",
    alignItems: "center",
    elevation: 4,
    shadowColor: "#000",
    shadowOpacity: 0.05,
    shadowRadius: scale(10),
  },
  header: {
    alignItems: "center",
    marginBottom: scale(40),
  },
  logoContainer: {
    width: scale(80),
    height: scale(80),
    borderRadius: scale(24),
    backgroundColor: "#fff",
    justifyContent: "center",
    alignItems: "center",
    marginBottom: scale(16),
    elevation: 8,
    shadowColor: "#0A8754",
    shadowOffset: { width: 0, height: scale(10) },
    shadowOpacity: 0.1,
    shadowRadius: scale(20),
    overflow: "hidden",
  },
  logo: {
    width: "100%",
    height: "100%",
  },
  brandName: {
    fontSize: scale(28),
    fontWeight: "900",
    color: "#0F172A",
    letterSpacing: scale(-1),
  },
  card: {
    backgroundColor: "#fff",
    borderRadius: scale(32),
    padding: scale(30),
    elevation: 4,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: scale(10) },
    shadowOpacity: 0.05,
    shadowRadius: scale(30),
  },
  cardTitle: {
    fontSize: scale(22),
    fontWeight: "800",
    color: "#1E293B",
    marginBottom: scale(20),
  },
  input: {
    backgroundColor: "#F8FAFC",
    borderRadius: scale(18),
    borderWidth: 1.5,
    borderColor: "#F1F5F9",
    paddingVertical: scale(14),
    paddingHorizontal: scale(16),
    fontSize: scale(16),
    fontWeight: "600",
    color: "#1E293B",
    marginBottom: scale(16),
  },
  phoneInputContainer: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#F8FAFC",
    borderRadius: scale(18),
    borderWidth: 1.5,
    borderColor: "#F1F5F9",
    marginBottom: scale(16),
  },
  countryCodeContainer: {
    paddingHorizontal: scale(16),
    justifyContent: "center",
    borderRightWidth: 1.5,
    borderRightColor: "#F1F5F9",
  },
  countryCodeText: {
    fontSize: scale(16),
    fontWeight: "700",
    color: "#1E293B",
  },
  phoneInput: {
    flex: 1,
    paddingVertical: scale(14),
    paddingHorizontal: scale(16),
    fontSize: scale(16),
    fontWeight: "600",
    color: "#1E293B",
  },
  primaryButton: {
    backgroundColor: "#0A8754",
    height: scale(64),
    borderRadius: scale(20),
    justifyContent: "center",
    alignItems: "center",
    marginTop: scale(8),
    elevation: 8,
    shadowColor: "#0A8754",
    shadowOffset: { width: 0, height: scale(8) },
    shadowOpacity: 0.25,
    shadowRadius: scale(15),
  },
  buttonPressed: {
    transform: [{ scale: 0.98 }],
    opacity: 0.9,
  },
  buttonDisabled: {
    backgroundColor: "#94a3b8",
    shadowOpacity: 0,
    elevation: 0,
  },
  buttonText: {
    color: "#fff",
    fontSize: scale(17),
    fontWeight: "800",
  },
});
