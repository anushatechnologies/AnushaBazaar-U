import React, { useState } from "react";
import {
View,
Text,
TextInput,
StyleSheet,
Pressable
} from "react-native";

import { useNavigation } from "@react-navigation/native";
import { useAddress } from "../../context/AddressContext";
import { useAuth } from "../../context/AuthContext";
import { 
  KeyboardAvoidingView, 
  Platform, 
  ScrollView 
} from "react-native";

const AddAddressScreen = () => {
  const navigation = useNavigation<any>();
  const { addAddress } = useAddress();
  const { user } = useAuth();

  const [label, setLabel] = useState("");
  const [address, setAddress] = useState("");
  // Auto-fill phone field correctly with +91 prefix
  const [mobile, setMobile] = useState(() => {
    if (user?.phone) {
      return user.phone.startsWith("+91") ? user.phone : `+91${user.phone}`;
    }
    return "+91";
  });

  const saveAddress = () => {
    if (!label || !address || !mobile || mobile.length < 13) return;
    addAddress({
      id: Date.now().toString(),
      label,
      address,
      mobile
    });
    navigation.goBack();
  };

  return (
    <KeyboardAvoidingView 
      style={styles.root} 
      behavior={Platform.OS === "ios" ? "padding" : "height"}
    >
      <ScrollView 
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        <View style={styles.container}>
          <Text style={styles.title}>Add Address</Text>

          <TextInput
            placeholder="Home / Work"
            placeholderTextColor="#94a3b8"
            style={styles.input}
            value={label}
            onChangeText={setLabel}
          />

          <TextInput
            placeholder="Full Address"
            placeholderTextColor="#94a3b8"
            style={styles.input}
            value={address}
            onChangeText={setAddress}
            multiline
          />

          <Text style={styles.labelTitle}>Mobile Number *</Text>
          <TextInput
            placeholder="+91 Mobile Number"
            placeholderTextColor="#94a3b8"
            style={styles.input}
            keyboardType="phone-pad"
            maxLength={13} // +91 + 10 digits
            value={mobile}
            onChangeText={(text) => {
              if (!text.startsWith("+91")) {
                setMobile("+91" + text.replace(/^\+?9?1?/, ""));
              } else {
                setMobile(text);
              }
            }}
          />

          <Pressable style={styles.btn} onPress={saveAddress}>
            <Text style={styles.btnText}>Save Address</Text>
          </Pressable>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
};

export default AddAddressScreen;

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: "#fff",
  },
  scrollContent: {
    flexGrow: 1,
  },
  container: {
    padding: 24,
  },
  title: {
    fontSize: 20,
    fontWeight: "700",
    marginBottom: 20,
    color: "#1E293B",
  },
  input: {
    borderWidth: 1,
    borderColor: "#E2E8F0",
    borderRadius: 12,
    padding: 14,
    marginBottom: 15,
    fontSize: 15,
    backgroundColor: "#F8FAFC",
  },
  labelTitle: {
    fontSize: 14,
    fontWeight: "700",
    color: "#475569",
    marginBottom: 8,
    textTransform: "uppercase",
    letterSpacing: 0.5,
  },
  phoneInputRow: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#F8FAFC",
    borderRadius: 14,
    borderWidth: 1,
    borderColor: "#E2E8F0",
    marginBottom: 25,
    padding: 4,
  },
  countryBadge: {
    paddingHorizontal: 12,
    paddingVertical: 10,
    backgroundColor: "#fff",
    borderRadius: 10,
    marginRight: 8,
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
  phoneInput: {
    flex: 1,
    fontSize: 16,
    fontWeight: "600",
    color: "#1E293B",
    paddingVertical: 10,
  },
  btn: {
    backgroundColor: "#0A8754",
    padding: 18,
    borderRadius: 16,
    alignItems: "center",
    marginTop: 10,
    elevation: 4,
    shadowColor: "#0A8754",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
  },
  btnText: {
    color: "#fff",
    fontWeight: "800",
    fontSize: 16,
  },
});
