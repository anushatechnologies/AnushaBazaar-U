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

const LoginScreen = () => {
  const navigation = useNavigation<any>();
  const insets = useSafeAreaInsets();

  // ✅ FIXED TYPES
  const [phone, setPhone] = useState<string>("");
  const [loading, setLoading] = useState<boolean>(false);

  const isValidPhone = /^[6-9]\d{9}$/.test(phone);

  const sendOtp = async () => {
    if (!isValidPhone) {
      Alert.alert("Invalid Number", "Please enter a valid 10-digit mobile number");
      return;
    }

    setLoading(true);

    try {
      // ✅ Check user exists
      const checkResponse = await checkPhoneExists(`+91${phone}`);

      if (!checkResponse.exists) {
        setLoading(false);
        navigation.navigate("Signup", { phone });
        return;
      }

      // Send OTP via Native Firebase
      const confirmation = await auth().signInWithPhoneNumber(`+91${phone}`);
      
      setLoading(false);
      navigation.navigate("Otp", {
        phone,
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
        <View style={[styles.backBtnContainer, { top: insets.top + 10 }]}>
          <Pressable style={styles.backBtn} onPress={() => navigation.goBack()}>
            <Ionicons name="arrow-back" size={24} color="#1E293B" />
          </Pressable>
        </View>

        <View style={[styles.content, { paddingTop: insets.top + 100 }]}>
          
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
              onChangeText={setPhone}
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
                  <Ionicons name="arrow-forward" size={20} color="#fff" />
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
  },
  header: {
    alignItems: "center",
    marginBottom: 40,
  },
  logoContainer: {
    width: 100,
    height: 100,
    borderRadius: 30,
    backgroundColor: "#fff",
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 20,
    overflow: "hidden",
  },
  logo: {
    width: "100%",
    height: "100%",
  },
  brandName: {
    fontSize: 30,
    fontWeight: "900",
    color: "#0F172A",
  },
  brandTagline: {
    fontSize: 14,
    color: "#64748B",
    marginTop: 5,
  },
  card: {
    backgroundColor: "#fff",
    borderRadius: 30,
    padding: 25,
  },
  cardTitle: {
    fontSize: 22,
    fontWeight: "800",
    marginBottom: 5,
  },
  cardSubtitle: {
    fontSize: 13,
    color: "#64748B",
    marginBottom: 20,
  },
  input: {
    backgroundColor: "#F8FAFC",
    borderRadius: 15,
    padding: 14,
    fontSize: 16,
    marginBottom: 20,
  },
  primaryButton: {
    backgroundColor: "#0A8754",
    height: 60,
    borderRadius: 18,
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    gap: 10,
  },
  buttonDisabled: {
    backgroundColor: "#94a3b8",
  },
  buttonText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "800",
  },
  signupRow: {
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    marginTop: 20,
  },
  signupText: {
    fontSize: 14,
    color: "#64748B",
  },
  signupLink: {
    fontSize: 14,
    fontWeight: "800",
    color: "#0A8754",
  },
});