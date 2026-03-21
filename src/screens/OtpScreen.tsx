import React, { useState, useEffect, useRef } from "react";
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
import firebase from "./config/firebase";
import { Ionicons } from "@expo/vector-icons";
import { loginWithFirebaseToken, signupWithFirebaseToken } from "../services/api/auth";

const OtpScreen = () => {
  const navigation = useNavigation<any>();
  const route = useRoute<any>();
  const insets = useSafeAreaInsets();
  const { login } = useAuth();

  const verificationId = route.params?.verificationId;
  const phone = route.params?.phone || "";
  const signupData = route.params?.signupData; // { name, email } if coming from signup

  const [code, setCode] = useState("");
  const [loading, setLoading] = useState(false);
  const inputRef = useRef<TextInput>(null);

  const [resendTimer, setResendTimer] = useState(30);
  const [canResend, setCanResend] = useState(false);

  useEffect(() => {
    if (resendTimer > 0) {
      const timer = setTimeout(() => setResendTimer(resendTimer - 1), 1000);
      return () => clearTimeout(timer);
    } else {
      setCanResend(true);
    }
  }, [resendTimer]);

  const verifyOtp = async () => {
    if (code.length !== 6) {
      Alert.alert("Incomplete Code", "Please enter the 6-digit verification code.");
      return;
    }

    setLoading(true);

    try {
      const credential = firebase.auth.PhoneAuthProvider.credential(
        verificationId,
        code
      );
      const userCredential = await firebase.auth().signInWithCredential(credential);
      const firebaseIdToken = await userCredential.user?.getIdToken();

      if (!firebaseIdToken) {
        throw new Error("Session expired. Please try again.");
      }

      let backendResponse: any = null;

      if (signupData) {
        // PERMIT signup flow
        backendResponse = await signupWithFirebaseToken(
            firebaseIdToken, 
            signupData.name, 
            signupData.email
        );
      } else {
        // PERMIT login flow (with 404 fallback to signup if unexpected)
        try {
          backendResponse = await loginWithFirebaseToken(firebaseIdToken);
        } catch (loginError: any) {
          if (loginError.status === 404) {
             setLoading(false);
             Alert.alert("Account Not Found", "It seems you haven't registered yet. Let's create your profile!", [
                 { text: "Join Now", onPress: () => navigation.navigate("Signup", { phone }) }
             ]);
             return;
          }
          throw loginError;
        }
      }

      if (backendResponse) {
        login(
          {
            name: backendResponse.name || "Customer",
            phone: backendResponse.phoneNumber || phone,
            email: backendResponse.email || signupData?.email || "",
            customerId: backendResponse.customerId,
          },
          backendResponse.jwtToken
        );
      }

      setLoading(false);
      navigation.reset({
        index: 0,
        routes: [{ name: "MainTabs" }],
      });
    } catch (error: any) {
      setLoading(false);
      console.log("OTP Verify Error:", error);
      Alert.alert(
        "Verification Failed",
        error?.message || "The code you entered is invalid. Please try again."
      );
    }
  };

  const resendOtp = () => {
    setCanResend(false);
    setResendTimer(30);
    // Ideally trigger firebase resend logic here
    Alert.alert("Code Resent", "A new verification code has been sent to your number.");
  };

  const renderOtpBoxes = () => {
    const codeArray = code.split("");
    const boxes = [];
    
    for (let i = 0; i < 6; i++) {
        const char = codeArray[i] || "";
        const isFocused = i === code.length || (i === 5 && code.length === 6);
        
        boxes.push(
            <View key={i} style={[styles.otpBox, isFocused && styles.otpBoxActive, char !== "" && styles.otpBoxFilled]}>
                <Text style={styles.otpBoxText}>{char}</Text>
            </View>
        );
    }

    return (
        <Pressable style={styles.otpBoxesContainer} onPress={() => inputRef.current?.focus()}>
            {boxes}
        </Pressable>
    );
  };

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
                ref={inputRef}
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
                    pressed && styles.buttonPressed
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
                    <Pressable onPress={resendOtp}>
                        <Text style={styles.resendAction}>Resend Code</Text>
                    </Pressable>
                ) : (
                    <Text style={styles.timerText}>Resend in <Text style={styles.timerBold}>{resendTimer}s</Text></Text>
                )}
            </View>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
};

export default OtpScreen;

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: "#fff",
  },
  scrollContent: {
    flexGrow: 1,
  },
  header: {
    paddingHorizontal: 20,
    marginBottom: 40,
  },
  backBtn: {
    width: 48,
    height: 48,
    borderRadius: 16,
    backgroundColor: "#F8FAFC",
    justifyContent: "center",
    alignItems: "center",
  },
  content: {
    paddingHorizontal: 28,
  },
  titleSection: {
    marginBottom: 48,
  },
  title: {
    fontSize: 32,
    fontWeight: "900",
    color: "#0F172A",
    letterSpacing: -1,
  },
  subtitle: {
    fontSize: 16,
    color: "#64748B",
    marginTop: 12,
    lineHeight: 24,
    fontWeight: "500",
  },
  phoneHighlight: {
    color: "#1E293B",
    fontWeight: "800",
  },
  hiddenInput: {
    position: "absolute",
    width: 1,
    height: 1,
    opacity: 0,
  },
  otpBoxesContainer: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 48,
  },
  otpBox: {
    width: 48,
    height: 64,
    borderRadius: 18,
    borderWidth: 2,
    borderColor: "#F1F5F9",
    backgroundColor: "#F8FAFC",
    justifyContent: "center",
    alignItems: "center",
  },
  otpBoxActive: {
    borderColor: "#0A8754",
    backgroundColor: "#fff",
    elevation: 4,
    shadowColor: "#0A8754",
    shadowOpacity: 0.1,
    shadowRadius: 10,
  },
  otpBoxFilled: {
    borderColor: "#E2E8F0",
    backgroundColor: "#fff",
  },
  otpBoxText: {
    fontSize: 24,
    fontWeight: "800",
    color: "#0F172A",
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
    backgroundColor: "#CBD5E1",
    shadowOpacity: 0,
    elevation: 0,
  },
  buttonText: {
    color: "#fff",
    fontSize: 17,
    fontWeight: "800",
  },
  resendSection: {
    marginTop: 40,
    alignItems: "center",
    gap: 8,
  },
  resendText: {
    fontSize: 15,
    color: "#64748B",
    fontWeight: "500",
  },
  resendAction: {
    fontSize: 15,
    color: "#0A8754",
    fontWeight: "800",
    textDecorationLine: "underline",
  },
  timerText: {
    fontSize: 15,
    color: "#94a3b8",
    fontWeight: "600",
  },
  timerBold: {
    color: "#0A8754",
    fontWeight: "800",
  },
});