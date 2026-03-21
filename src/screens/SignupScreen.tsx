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
    if (!name.trim()) {
      Alert.alert("Required", "Please enter your name");
      return;
    }
    if (!isValidPhone) {
      Alert.alert("Invalid Number", "Please enter a valid 10-digit mobile number");
      return;
    }

    setLoading(true);
    try {
      setLoading(false);
      navigation.navigate("Otp", {
        phone,
        verificationId: "test-verification-id",
        signupData: {
          name: name.trim(),
          email: email.trim(),
        },
      });
    } catch (error: any) {
      setLoading(false);
      Alert.alert("Error", error?.message || "Something went wrong");
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

        <View style={[styles.backBtnContainer, { top: insets.top + 10 }]}>
          <Pressable style={styles.backBtn} onPress={() => navigation.goBack()}>
            <Ionicons name="arrow-back" size={24} color="#1E293B" />
          </Pressable>
        </View>

        <View style={[styles.content, { paddingTop: insets.top + 80 }]}>
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

            <TextInput
              placeholder="Phone Number"
              keyboardType="number-pad"
              maxLength={10}
              value={phone}
              onChangeText={setPhone}
              style={styles.input}
            />

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
    marginBottom: 40,
  },
  logoContainer: {
    width: 80,
    height: 80,
    borderRadius: 24,
    backgroundColor: "#fff",
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 16,
    elevation: 8,
    shadowColor: "#0A8754",
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.1,
    shadowRadius: 20,
    overflow: "hidden",
  },
  logo: {
    width: "100%",
    height: "100%",
  },
  brandName: {
    fontSize: 28,
    fontWeight: "900",
    color: "#0F172A",
    letterSpacing: -1,
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
    fontSize: 22,
    fontWeight: "800",
    color: "#1E293B",
    marginBottom: 20,
  },
  input: {
    backgroundColor: "#F8FAFC",
    borderRadius: 18,
    borderWidth: 1.5,
    borderColor: "#F1F5F9",
    paddingVertical: 14,
    paddingHorizontal: 16,
    fontSize: 16,
    fontWeight: "600",
    color: "#1E293B",
    marginBottom: 16,
  },
  primaryButton: {
    backgroundColor: "#0A8754",
    height: 64,
    borderRadius: 20,
    justifyContent: "center",
    alignItems: "center",
    marginTop: 8,
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
});
