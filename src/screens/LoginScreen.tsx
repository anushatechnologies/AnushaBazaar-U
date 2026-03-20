import React, { useState, useRef } from "react";
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
import { useNavigation } from "@react-navigation/native";
import { FirebaseRecaptchaVerifierModal } from "expo-firebase-recaptcha";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import firebase from "./config/firebase";
import { Ionicons } from "@expo/vector-icons";
import { checkPhoneExists } from "../services/api/auth";
import SignupPopup from "../components/SignupPopup";

const LoginScreen = () => {
  const navigation = useNavigation<any>();
  const insets = useSafeAreaInsets();
  const recaptchaVerifier = useRef<FirebaseRecaptchaVerifierModal>(null);

  const [phone, setPhone] = useState("");
  const [loading, setLoading] = useState(false);
  const [showSignupPopup, setShowSignupPopup] = useState(false);

  const isValidPhone = /^[6-9]\d{9}$/.test(phone);

  const sendOtp = async () => {
    if (!isValidPhone) {
      Alert.alert("Invalid Number", "Please enter a valid 10-digit mobile number");
      return;
    }

    setLoading(true);
    try {
      // 1. Check if user exists in DB
      const checkResponse = await checkPhoneExists(`+91${phone}`);
      
      if (!checkResponse.exists) {
        setLoading(false);
        setShowSignupPopup(true);
        return;
      }

      // 2. If exists, proceed with Firebase OTP
      const phoneProvider = new firebase.auth.PhoneAuthProvider();
      const verificationId = await phoneProvider.verifyPhoneNumber(
        `+91${phone}`,
        recaptchaVerifier.current!
      );

      setLoading(false);
      navigation.navigate("Otp", {
        phone,
        verificationId,
      });
    } catch (error: any) {
      setLoading(false);
      console.log("Auth Error:", error);
      Alert.alert(
        "Verification Failed",
        error?.message || "Something went wrong. Please try again."
      );
    }
  };

  return (
    <KeyboardAvoidingView
      style={styles.root}
      behavior={Platform.OS === "ios" ? "padding" : "height"}
    >
      <FirebaseRecaptchaVerifierModal
        ref={recaptchaVerifier}
        firebaseConfig={firebase.app().options}
        attemptInvisibleVerification={true}
      />

      <ScrollView 
        contentContainerStyle={styles.scrollContent}
        bounces={false}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        {/* Background Decorative Elements */}
        <View style={styles.bgCircle1} />
        <View style={styles.bgCircle2} />

        <View style={[styles.backBtnContainer, { top: insets.top + 10 }]}>
          <Pressable 
            style={({ pressed }) => [
              styles.backBtn,
              pressed && styles.buttonPressed
            ]}
            onPress={() => navigation.goBack()}
          >
            <Ionicons name="arrow-back" size={24} color="#1E293B" />
          </Pressable>
        </View>

        <View style={[styles.content, { paddingTop: insets.top + (navigation.canGoBack() ? 100 : 60) }]}>
          {/* Brand Header */}
          <View style={styles.header}>
            <View style={styles.logoContainer}>
              <Image 
                source={require("../../assets/company-logo.jpeg")} 
                style={styles.logo}
                resizeMode="cover"
              />
            </View>
            <Text style={styles.brandName}>Anusha Bazaar</Text>
            <Text style={styles.brandTagline}>Quality Groceries • Lightning Fast</Text>
          </View>

          {/* Login Card */}
          <View style={styles.card}>
            <Text style={styles.cardTitle}>Welcome</Text>
            <Text style={styles.cardSubtitle}>Enter your phone number to continue your shopping journey</Text>

            <View style={styles.inputWrapper}>
              <Text style={styles.inputLabel}>Mobile Number</Text>
              <View style={styles.phoneInputRow}>
                <View style={styles.countryBadge}>
                  <Text style={styles.countryText}>🇮🇳 +91</Text>
                </View>
                <TextInput
                  placeholder="99999 99999"
                  placeholderTextColor="#94a3b8"
                  style={styles.input}
                  keyboardType="number-pad"
                  maxLength={10}
                  value={phone}
                  onChangeText={setPhone}
                />
              </View>
            </View>

            <Pressable
              style={({ pressed }) => [
                styles.primaryButton,
                (!isValidPhone || loading) && styles.buttonDisabled,
                pressed && styles.buttonPressed
              ]}
              onPress={sendOtp}
              disabled={!isValidPhone || loading}
            >
              {loading ? (
                <ActivityIndicator color="#fff" />
              ) : (
                <>
                  <Text style={styles.buttonText}>Get Verification Code</Text>
                  <Ionicons name="arrow-forward" size={20} color="#fff" />
                </>
              )}
            </Pressable>

            {/* Signup Section moved up under the button */}
            <View style={styles.signupSection}>
              <Text style={styles.signupText}>Not a member yet?</Text>
              <Pressable onPress={() => navigation.navigate("Signup")}>
                <Text style={styles.signupLink}>Sign Up Now</Text>
              </Pressable>
            </View>

            <View style={styles.divider}>
              <View style={styles.dividerLine} />
              <Text style={styles.dividerText}>SECURE LOGIN</Text>
              <View style={styles.dividerLine} />
            </View>

            <Text style={styles.footerNote}>
              By continuing, you agree to our{"\n"}
              <Text style={styles.linkText}>Terms of Service</Text> & <Text style={styles.linkText}>Privacy Policy</Text>
            </Text>
          </View>
        </View>
      </ScrollView>

      <SignupPopup 
        visible={showSignupPopup}
        onClose={() => setShowSignupPopup(false)}
        onSignup={() => {
          setShowSignupPopup(false);
          navigation.navigate("Signup", { phone });
        }}
        phone={phone}
      />
    </KeyboardAvoidingView>
  );
};

export default LoginScreen;

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
    top: -100,
    right: -100,
    width: 300,
    height: 300,
    borderRadius: 150,
    backgroundColor: "#E2F2E9",
    opacity: 0.6,
  },
  bgCircle2: {
    position: "absolute",
    top: 200,
    left: -150,
    width: 400,
    height: 400,
    borderRadius: 200,
    backgroundColor: "#FEF9C3",
    opacity: 0.4,
  },
  content: {
    flex: 1,
    paddingHorizontal: 28,
    paddingBottom: 40,
  },
  backBtnContainer: {
    position: "absolute",
    left: 20,
    zIndex: 100,
  },
  backBtn: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: "#fff",
    justifyContent: "center",
    alignItems: "center",
    elevation: 4,
    shadowColor: "#000",
    shadowOpacity: 0.05,
    shadowRadius: 10,
  },
  header: {
    alignItems: "center",
    marginBottom: 48,
  },
  logoContainer: {
    width: 100,
    height: 100,
    borderRadius: 30,
    backgroundColor: "#fff",
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 20,
    elevation: 8,
    shadowColor: "#0A8754",
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.1,
    shadowRadius: 20,
    overflow: "hidden", // Added to keep image within rounded corners
  },
  logo: {
    width: "100%",
    height: "100%",
  },
  brandName: {
    fontSize: 32,
    fontWeight: "900",
    color: "#0F172A",
    letterSpacing: -1,
  },
  brandTagline: {
    fontSize: 15,
    color: "#64748B",
    marginTop: 6,
    fontWeight: "500",
  },
  card: {
    backgroundColor: "#fff",
    borderRadius: 32,
    padding: 30,
    elevation: 4,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.05,
    shadowRadius: 30,
  },
  cardTitle: {
    fontSize: 24,
    fontWeight: "800",
    color: "#1E293B",
    marginBottom: 8,
  },
  cardSubtitle: {
    fontSize: 14,
    color: "#64748B",
    lineHeight: 20,
    marginBottom: 32,
  },
  inputWrapper: {
    marginBottom: 24,
  },
  inputLabel: {
    fontSize: 13,
    fontWeight: "700",
    color: "#475569",
    marginBottom: 10,
    marginLeft: 4,
    textTransform: "uppercase",
    letterSpacing: 0.5,
  },
  phoneInputRow: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#F8FAFC",
    borderRadius: 18,
    borderWidth: 1.5,
    borderColor: "#F1F5F9",
    paddingHorizontal: 4,
  },
  countryBadge: {
    paddingHorizontal: 16,
    paddingVertical: 14,
    backgroundColor: "#fff",
    borderRadius: 14,
    margin: 4,
    elevation: 2,
    shadowColor: "#000",
    shadowOpacity: 0.05,
    shadowRadius: 5,
  },
  countryText: {
    fontSize: 15,
    fontWeight: "700",
    color: "#1E293B",
  },
  input: {
    flex: 1,
    paddingVertical: 14,
    paddingHorizontal: 12,
    fontSize: 16,
    fontWeight: "600",
    color: "#1E293B",
  },
  primaryButton: {
    backgroundColor: "#0A8754",
    height: 64,
    borderRadius: 20,
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    gap: 12,
    elevation: 8,
    shadowColor: "#0A8754",
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.25,
    shadowRadius: 15,
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
    fontSize: 17,
    fontWeight: "800",
  },
  divider: {
    flexDirection: "row",
    alignItems: "center",
    marginVertical: 32,
    opacity: 0.4,
  },
  dividerLine: {
    flex: 1,
    height: 1,
    backgroundColor: "#CBD5E1",
  },
  dividerText: {
    paddingHorizontal: 16,
    fontSize: 11,
    fontWeight: "800",
    color: "#64748B",
    letterSpacing: 2,
  },
  footerNote: {
    fontSize: 12,
    color: "#94a3b8",
    textAlign: "center",
    lineHeight: 18,
  },
  linkText: {
    color: "#0A8754",
    fontWeight: "700",
  },
  signupSection: {
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    marginTop: 20, // Reduced from 40 since it's now inside the card or closer to the button
    gap: 8,
  },
  signupText: {
    fontSize: 15,
    color: "#64748B",
    fontWeight: "500",
  },
  signupLink: {
    fontSize: 15,
    color: "#0A8754",
    fontWeight: "800",
  },
});