import React, { useState, useEffect, useRef, useCallback } from "react";
import {
  View,
  Text,
  TextInput,
  Pressable,
  StyleSheet,
  Alert,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
} from "react-native";
import { useNavigation, useRoute } from "@react-navigation/native";
import { useAuth } from "../context/AuthContext";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import auth from "@react-native-firebase/auth";
import { Ionicons } from "@expo/vector-icons";
import { loginWithFirebaseToken, signupWithFirebaseToken } from "../services/api/auth";

const OtpScreen = () => {
  const navigation = useNavigation<any>();
  const route = useRoute<any>();
  const insets = useSafeAreaInsets();
  const { login } = useAuth();

  const phone = route.params?.phone || "";
  const signupData = route.params?.signupData;
  const initialVerificationId = route.params?.verificationId || "";

  const [code, setCode] = useState("");
  const [verificationId, setVerificationId] = useState(initialVerificationId);
  const [loading, setLoading] = useState(false);
  const [isResending, setIsResending] = useState(false);
  const [resendTimer, setResendTimer] = useState(60);
  const [canResend, setCanResend] = useState(false);

  // Always mirrors the latest verificationId state (avoids stale closures)
  const verificationIdRef = useRef(initialVerificationId);
  // Prevents duplicate backend calls if both auto-verify & manual verify fire
  const isCompletingRef = useRef(false);
  // Only allow onAuthStateChanged to act after we've cleared the stale session
  const readyForAutoVerifyRef = useRef(false);

  useEffect(() => {
    verificationIdRef.current = verificationId;
  }, [verificationId]);

  // Countdown timer for resend button
  useEffect(() => {
    if (resendTimer > 0) {
      const t = setTimeout(() => setResendTimer((v) => v - 1), 1000);
      return () => clearTimeout(t);
    } else {
      setCanResend(true);
    }
  }, [resendTimer]);

  // ------------------------------------------------------------------
  // KEY FIX: Sign out any stale Firebase session on mount BEFORE
  // setting up the onAuthStateChanged listener. This prevents the
  // listener from firing with an old user and invalidating the new OTP.
  // ------------------------------------------------------------------
  useEffect(() => {
    let unsubscribe: (() => void) | null = null;

    const setupListener = async () => {
      // 1. Clear any previous session to avoid stale token firing the listener
      try {
        if (auth().currentUser) {
          console.log("🧹 Signing out stale session before OTP screen");
          await auth().signOut();
        }
      } catch (e) {
        console.log("Sign out before OTP failed (non-critical):", e);
      }

      // 2. Mark as ready — now the listener is allowed to act
      readyForAutoVerifyRef.current = true;

      // 3. Now listen: will only fire for the NEW OTP verification
      unsubscribe = auth().onAuthStateChanged((user) => {
        if (user && readyForAutoVerifyRef.current && !isCompletingRef.current) {
          console.log("🔥 Firebase auto-verified:", user.phoneNumber);
          handleAuthenticatedUser(user);
        }
      });
    };

    setupListener();
    return () => {
      if (unsubscribe) unsubscribe();
    };
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  // ------------------------------------------------------------------
  // Exchange Firebase user → backend JWT
  // ------------------------------------------------------------------
  const finalizeSession = useCallback(
    async (firebaseUser: any) => {
      // IMPORTANT: force=true refreshes the token, critical for Play Store builds
      const firebaseIdToken = await firebaseUser.getIdToken(true);
      if (!firebaseIdToken) throw new Error("Could not retrieve a valid Firebase token.");

      if (signupData) {
        return await signupWithFirebaseToken(firebaseIdToken, signupData.name, signupData.email);
      } else {
        return await loginWithFirebaseToken(firebaseIdToken);
      }
    },
    [signupData]
  );

  const handleAuthenticatedUser = useCallback(
    async (firebaseUser: any) => {
      if (!firebaseUser || isCompletingRef.current) return;
      isCompletingRef.current = true;
      setLoading(true);

      try {
        const res = await finalizeSession(firebaseUser);
        if (res) {
          login(
            {
              name: res.name || "Customer",
              phone: res.phoneNumber || phone,
              email: res.email || signupData?.email || "",
              customerId: res.customerId,
            },
            res.jwtToken
          );
          navigation.reset({ index: 0, routes: [{ name: "MainTabs" }] });
        }
      } catch (error: any) {
        isCompletingRef.current = false;
        console.error("Auth finalization error:", JSON.stringify(error));

        if (error?.status === 404) {
          Alert.alert("Account Not Found", "You are not registered. Please sign up.", [
            { text: "Sign Up", onPress: () => navigation.navigate("Signup", { phone }) },
            { text: "Cancel", style: "cancel" },
          ]);
          return;
        }
        if (error?.status === 409) {
          Alert.alert("Already Registered", "This number is already registered. Please login instead.");
          return;
        }
        Alert.alert("Authentication Failed", error?.message || "Please try again.");
      } finally {
        setLoading(false);
      }
    },
    [finalizeSession, login, navigation, phone, signupData]
  );

  // ------------------------------------------------------------------
  // Manual OTP verification (user types the code)
  // ------------------------------------------------------------------
  const verifyOtp = async () => {
    if (code.length !== 6 || loading || isCompletingRef.current) return;

    // Prevent the auto-listener from double-triggering when signInWithCredential resolves
    readyForAutoVerifyRef.current = false;
    setLoading(true);

    try {
      const credential = auth.PhoneAuthProvider.credential(verificationIdRef.current, code);
      const result = await auth().signInWithCredential(credential);
      await handleAuthenticatedUser(result.user);
    } catch (error: any) {
      setLoading(false);
      readyForAutoVerifyRef.current = true;
      console.error("OTP verify error:", error?.code, error?.message);

      let msg = "Invalid OTP. Please check and try again.";
      if (error?.code === "auth/session-expired") {
        msg = "OTP has expired. Please tap 'Resend Code' to get a new one.";
      } else if (error?.code === "auth/invalid-verification-code") {
        msg = "The code you entered is incorrect. Please try again.";
      } else if (error?.code === "auth/quota-exceeded") {
        msg = "Too many verification attempts. Please wait and try again later.";
      } else if (error?.code === "auth/invalid-verification-id") {
        msg = "Your OTP session is invalid. Please go back and request a new code.";
      }

      Alert.alert("Verification Failed", msg);
    }
  };

  // ------------------------------------------------------------------
  // Resend OTP (actually calls Firebase to send a new SMS)
  // ------------------------------------------------------------------
  const resendOtp = async () => {
    if (!canResend || isResending) return;
    setIsResending(true);
    setCode("");
    isCompletingRef.current = false;
    readyForAutoVerifyRef.current = false;

    try {
      // Sign out first to reset Firebase auth state cleanly
      try { await auth().signOut(); } catch (_) {}

      const confirmation = await auth().signInWithPhoneNumber(`+91${phone}`);

      setVerificationId(confirmation.verificationId);
      verificationIdRef.current = confirmation.verificationId;
      readyForAutoVerifyRef.current = true;

      setResendTimer(60);
      setCanResend(false);
      Alert.alert("✅ Code Resent", "A new verification code has been sent to your number.");
    } catch (error: any) {
      console.error("Resend OTP error:", error?.code, error?.message);
      readyForAutoVerifyRef.current = true;
      Alert.alert("Resend Failed", error?.message || "Could not resend OTP. Please go back and try again.");
    } finally {
      setIsResending(false);
    }
  };

  // ------------------------------------------------------------------
  // OTP box renderer
  // ------------------------------------------------------------------
  const renderOtpBoxes = () => {
    const codeArray = code.split("");
    return (
      <View style={styles.otpBoxesContainer}>
        {Array.from({ length: 6 }).map((_, i) => {
          const char = codeArray[i] || "";
          const isFocused = i === code.length || (i === 5 && code.length === 6);
          return (
            <View
              key={i}
              style={[
                styles.otpBox,
                isFocused && styles.otpBoxActive,
                char !== "" && styles.otpBoxFilled,
              ]}
            >
              <Text style={styles.otpBoxText}>{char}</Text>
            </View>
          );
        })}
      </View>
    );
  };

  // ------------------------------------------------------------------
  // Render
  // ------------------------------------------------------------------
  return (
    <KeyboardAvoidingView
      style={styles.root}
      behavior={Platform.OS === "ios" ? "padding" : undefined}
    >
      <ScrollView contentContainerStyle={styles.scrollContent} bounces={false}>
        <View style={[styles.header, { paddingTop: insets.top + 20 }]}>
          <Pressable style={styles.backBtn} onPress={() => navigation.goBack()}>
            <Ionicons name="chevron-back" size={24} color="#1E293B" />
          </Pressable>
        </View>

        <View style={styles.content}>
          <View style={styles.titleSection}>
            <Text style={styles.title}>Verification Code</Text>
            <Text style={styles.subtitle}>
              We've sent a 6-digit code to{"\n"}
              <Text style={styles.phoneHighlight}>+91 {phone}</Text>
            </Text>
          </View>

          <TextInput
            style={styles.hiddenInput}
            keyboardType="number-pad"
            maxLength={6}
            value={code}
            onChangeText={setCode}
            autoFocus
            textContentType="oneTimeCode"
            autoComplete="sms-otp"
            importantForAutofill="yes"
          />

          {renderOtpBoxes()}

          <Pressable
            style={({ pressed }) => [
              styles.primaryButton,
              code.length !== 6 && styles.buttonDisabled,
              pressed && styles.buttonPressed,
            ]}
            onPress={verifyOtp}
            disabled={code.length !== 6 || loading}
          >
            {loading ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <>
                <Text style={styles.buttonText}>Verify & Continue</Text>
                <Ionicons name="checkmark-circle" size={20} color="#fff" />
              </>
            )}
          </Pressable>

          <View style={styles.resendSection}>
            <Text style={styles.resendText}>Didn't receive the code?</Text>
            {canResend ? (
              <Pressable onPress={resendOtp} disabled={isResending}>
                {isResending ? (
                  <ActivityIndicator size="small" color="#0A8754" />
                ) : (
                  <Text style={styles.resendAction}>Resend Code</Text>
                )}
              </Pressable>
            ) : (
              <Text style={styles.timerText}>
                Resend in <Text style={styles.timerBold}>{resendTimer}s</Text>
              </Text>
            )}
          </View>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
};

export default OtpScreen;

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: "#fff" },
  scrollContent: { flexGrow: 1 },
  header: { paddingHorizontal: 20, marginBottom: 40 },
  backBtn: {
    width: 48, height: 48, borderRadius: 16,
    backgroundColor: "#F8FAFC",
    justifyContent: "center", alignItems: "center",
  },
  content: { paddingHorizontal: 28 },
  titleSection: { marginBottom: 48 },
  title: { fontSize: 32, fontWeight: "900", color: "#0F172A", letterSpacing: -1 },
  subtitle: { fontSize: 16, color: "#64748B", marginTop: 12, lineHeight: 24, fontWeight: "500" },
  phoneHighlight: { color: "#1E293B", fontWeight: "800" },
  hiddenInput: { position: "absolute", width: 1, height: 1, opacity: 0 },
  otpBoxesContainer: { flexDirection: "row", justifyContent: "space-between", marginBottom: 48 },
  otpBox: {
    width: 48, height: 64, borderRadius: 18, borderWidth: 2,
    borderColor: "#F1F5F9", backgroundColor: "#F8FAFC",
    justifyContent: "center", alignItems: "center",
  },
  otpBoxActive: {
    borderColor: "#0A8754", backgroundColor: "#fff", elevation: 4,
    shadowColor: "#0A8754", shadowOpacity: 0.1, shadowRadius: 10,
  },
  otpBoxFilled: { borderColor: "#E2E8F0", backgroundColor: "#fff" },
  otpBoxText: { fontSize: 24, fontWeight: "800", color: "#0F172A" },
  primaryButton: {
    backgroundColor: "#0A8754", height: 64, borderRadius: 20,
    flexDirection: "row", justifyContent: "center", alignItems: "center",
    gap: 12, elevation: 8, shadowColor: "#0A8754",
    shadowOffset: { width: 0, height: 8 }, shadowOpacity: 0.25, shadowRadius: 15,
  },
  buttonPressed: { transform: [{ scale: 0.98 }], opacity: 0.9 },
  buttonDisabled: { backgroundColor: "#CBD5E1", shadowOpacity: 0, elevation: 0 },
  buttonText: { color: "#fff", fontSize: 17, fontWeight: "800" },
  resendSection: { marginTop: 40, alignItems: "center", gap: 8 },
  resendText: { fontSize: 15, color: "#64748B", fontWeight: "500" },
  resendAction: { fontSize: 15, color: "#0A8754", fontWeight: "800", textDecorationLine: "underline" },
  timerText: { fontSize: 15, color: "#94a3b8", fontWeight: "600" },
  timerBold: { color: "#0A8754", fontWeight: "800" },
});