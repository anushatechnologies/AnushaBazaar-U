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
import { useNavigation } from "@react-navigation/native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { checkPhoneExists } from "../services/api/auth";
import auth from "@react-native-firebase/auth";
import { scale } from "../utils/responsive";

const LoginScreen = () => {
  const navigation = useNavigation<any>();
  const insets = useSafeAreaInsets();

  // ✅ FIXED TYPES
  const [phone, setPhone] = useState<string>("");
  const [loading, setLoading] = useState<boolean>(false);

  const isValidPhone = /^[6-9]\d{9}$/.test(phone);

  const sendOtp = async () => {
    if (loading) return;

    const normalizedPhone = phone.replace(/\D/g, "").slice(0, 10);

    if (!isValidPhone) {
      Alert.alert("Invalid Number", "Please enter a valid 10-digit mobile number");
      return;
    }

    setLoading(true);

    try {
      // ✅ Check user exists
      const checkResponse = await checkPhoneExists(normalizedPhone);

      if (!checkResponse.exists) {
        setLoading(false);
        navigation.navigate("Signup", { phone: normalizedPhone });
        return;
      }

      if (auth().currentUser) {
        try {
          await auth().signOut();
        } catch (signOutError) {
          console.log("Firebase sign out before OTP request failed:", signOutError);
        }
      }

      // Send OTP via Native Firebase
      const confirmation = await auth().signInWithPhoneNumber(`+91${normalizedPhone}`);
      
      setLoading(false);
      navigation.navigate("Otp", {
        phone: normalizedPhone,
        verificationId: confirmation.verificationId,
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
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        bounces={false}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        {/* Background */}
        <View style={styles.bgCircle1} />
        <View style={styles.bgCircle2} />

        {/* Back Button */}
        <View style={[styles.backBtnContainer, { top: insets.top + scale(10) }]}>
          <Pressable style={styles.backBtn} onPress={() => navigation.goBack()}>
            <Ionicons name="arrow-back" size={scale(24)} color="#1E293B" />
          </Pressable>
        </View>

        <View style={[styles.content, { paddingTop: insets.top + scale(100) }]}>
          
          {/* Header */}
          <View style={styles.header}>
            <View style={styles.logoContainer}>
              <Image
                source={require("../../assets/company-logo.png")}
                style={styles.logo}
              />
            </View>
            <Text style={styles.brandName}>Anusha Bazaar</Text>
            <Text style={styles.brandTagline}>
              Quality Groceries • Lightning Fast
            </Text>
          </View>

          {/* Card */}
          <View style={styles.card}>
            <Text style={styles.cardTitle}>Welcome</Text>
            <Text style={styles.cardSubtitle}>
              Enter your phone number to continue
            </Text>

            {/* Phone Input */}
            <TextInput
              placeholder="Enter mobile number"
              placeholderTextColor="#94a3b8"
              keyboardType="number-pad"
              maxLength={10}
              value={phone}
              onChangeText={(value) => setPhone(value.replace(/\D/g, "").slice(0, 10))}
              style={styles.input}
            />

            {/* Button */}
            <Pressable
              style={[
                styles.primaryButton,
                (!isValidPhone || loading) && styles.buttonDisabled,
              ]}
              onPress={sendOtp}
              disabled={!isValidPhone || loading}
            >
              {loading ? (
                <ActivityIndicator color="#fff" />
              ) : (
                <>
                  <Text style={styles.buttonText}>Get OTP</Text>
                  <Ionicons name="arrow-forward" size={scale(20)} color="#fff" />
                </>
              )}
            </Pressable>

            {/* Sign Up Link */}
            <Pressable
              style={styles.signupRow}
              onPress={() => navigation.navigate("Signup", {})}
            >
              <Text style={styles.signupText}>New user? </Text>
              <Text style={styles.signupLink}>Sign Up</Text>
            </Pressable>
          </View>
        </View>
      </ScrollView>
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
  },
  header: {
    alignItems: "center",
    marginBottom: scale(40),
  },
  logoContainer: {
    width: scale(100),
    height: scale(100),
    borderRadius: scale(30),
    backgroundColor: "#fff",
    justifyContent: "center",
    alignItems: "center",
    marginBottom: scale(20),
    overflow: "hidden",
  },
  logo: {
    width: "100%",
    height: "100%",
  },
  brandName: {
    fontSize: scale(30),
    fontWeight: "900",
    color: "#0F172A",
  },
  brandTagline: {
    fontSize: scale(14),
    color: "#64748B",
    marginTop: scale(5),
  },
  card: {
    backgroundColor: "#fff",
    borderRadius: scale(30),
    padding: scale(25),
  },
  cardTitle: {
    fontSize: scale(22),
    fontWeight: "800",
    marginBottom: scale(5),
  },
  cardSubtitle: {
    fontSize: scale(13),
    color: "#64748B",
    marginBottom: scale(20),
  },
  input: {
    backgroundColor: "#F8FAFC",
    borderRadius: scale(15),
    padding: scale(14),
    fontSize: scale(16),
    marginBottom: scale(20),
  },
  primaryButton: {
    backgroundColor: "#0A8754",
    height: scale(60),
    borderRadius: scale(18),
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    gap: scale(10),
  },
  buttonDisabled: {
    backgroundColor: "#94a3b8",
  },
  buttonText: {
    color: "#fff",
    fontSize: scale(16),
    fontWeight: "800",
  },
  signupRow: {
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    marginTop: scale(20),
  },
  signupText: {
    fontSize: scale(14),
    color: "#64748B",
  },
  signupLink: {
    fontSize: scale(14),
    fontWeight: "800",
    color: "#0A8754",
  },
});
