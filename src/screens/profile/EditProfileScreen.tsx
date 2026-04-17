import React, { useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
} from "react-native";
import { useAuth } from "../../context/AuthContext";
import { useNavigation } from "@react-navigation/native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { updateProfile } from "../../services/api/profile";

const EditProfileScreen = () => {
  const { user, jwtToken, login } = useAuth();
  const navigation = useNavigation<any>();
  const insets = useSafeAreaInsets();

  const [name, setName] = useState(user?.name || "");
  const [email, setEmail] = useState(user?.email || "");
  const [phone] = useState(user?.phone || "");
  const [saving, setSaving] = useState(false);

  const isValidEmail = (value: string) => {
    if (!value.trim()) return true; // Optional — empty is fine
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value.trim());
  };

  const handleSave = async () => {
    if (!name.trim()) {
      Alert.alert("Error", "Name is required");
      return;
    }

    if (email.trim() && !isValidEmail(email)) {
      Alert.alert("Invalid Email", "Please enter a valid email address (e.g. name@example.com)");
      return;
    }

    setSaving(true);

    try {
      // Call backend API
      if (jwtToken) {
        const result = await updateProfile(jwtToken, {
          name: name.trim(),
          email: email.trim() || undefined,
        });

        if (result) {
          // Update local context with API response
          login(
            {
              name: result.name || name.trim(),
              phone: result.phone || phone,
              email: result.email || email.trim(),
              customerId: result.id || user?.customerId,
            },
            jwtToken
          );
          Alert.alert("Success", "Profile updated successfully!");
          navigation.goBack();
          return;
        }
      }

      // Fallback: local-only update
      login(
        {
          name: name.trim(),
          phone: phone,
          email: email.trim(),
          customerId: user?.customerId,
        },
        jwtToken || ""
      );
      navigation.goBack();
    } catch (error) {
      console.error("Profile update error:", error);
      Alert.alert("Error", "Could not update profile. Please try again.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <View style={[styles.container, { paddingTop: Math.max(insets.top, 20) }]}>
      <Text style={styles.title}>Edit Profile</Text>

      <Text style={styles.label}>Full Name</Text>
      <TextInput
        style={styles.input}
        value={name}
        onChangeText={setName}
        placeholder="Full Name"
      />

      <Text style={styles.label}>Email</Text>
      <TextInput
        style={styles.input}
        value={email}
        onChangeText={setEmail}
        placeholder="Email (optional)"
        keyboardType="email-address"
        autoCapitalize="none"
      />

      <Text style={styles.label}>Phone Number</Text>
      <TextInput
        style={[styles.input, { backgroundColor: "#F3F4F6", color: "#9CA3AF" }]}
        value={phone}
        editable={false}
        placeholder="Phone Number"
      />

      <TouchableOpacity
        style={[styles.saveBtn, saving && { opacity: 0.6 }]}
        onPress={handleSave}
        disabled={saving}
      >
        {saving ? (
          <ActivityIndicator color="#fff" />
        ) : (
          <Text style={styles.saveText}>Save Changes</Text>
        )}
      </TouchableOpacity>
    </View>
  );
};

export default EditProfileScreen;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingHorizontal: 20,
    backgroundColor: "#f5f5f5",
  },
  title: {
    fontSize: 20,
    fontWeight: "600",
    marginBottom: 20,
  },
  label: {
    fontSize: 13,
    fontWeight: "700",
    color: "#6B7280",
    marginBottom: 6,
    marginTop: 4,
    textTransform: "uppercase",
    letterSpacing: 0.5,
  },
  input: {
    backgroundColor: "#fff",
    padding: 15,
    borderRadius: 12,
    marginBottom: 15,
    elevation: 3,
    fontSize: 15,
    color: "#111827",
    fontWeight: "500",
  },
  saveBtn: {
    backgroundColor: "#0A8754",
    padding: 16,
    borderRadius: 12,
    alignItems: "center",
    marginTop: 10,
  },
  saveText: {
    color: "#fff",
    fontWeight: "600",
    fontSize: 16,
  },
});
