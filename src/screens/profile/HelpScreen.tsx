import React from "react";
import { View, Text, StyleSheet, TouchableOpacity, Image, Linking } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useNavigation } from "@react-navigation/native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

const HelpScreen = () => {
  const navigation = useNavigation<any>();
  const insets = useSafeAreaInsets();

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      {/* Header Setup */}
      <View style={styles.header}>
        <TouchableOpacity style={styles.backBtn} onPress={() => navigation.goBack()}>
          <Ionicons name="arrow-back" size={24} color="#111827" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Help & Support</Text>
        <View style={{ width: 40 }} />
      </View>

      <View style={styles.content}>
        <View style={styles.iconWrapper}>
          <Ionicons name="chatbubbles-outline" size={56} color="#0A8754" />
        </View>
        
        <Text style={styles.bannerTitle}>We are here to help you</Text>
        <Text style={styles.bannerSub}>Get in touch with us for any questions or issues with your orders. We are available 24/7!</Text>

        <TouchableOpacity style={styles.contactCard} activeOpacity={0.7} onPress={() => Linking.openURL("tel:+918522918866")}>
          <View style={[styles.cardIconBox, { backgroundColor: "#ECFDF5" }]}>
            <Ionicons name="call" size={22} color="#0A8754" />
          </View>
          <View style={styles.cardTextWrap}>
            <Text style={styles.cardLabel}>Call Us</Text>
            <Text style={styles.cardValue}>+91 8522918866</Text>
          </View>
          <Ionicons name="chevron-forward" size={18} color="#D1D5DB" />
        </TouchableOpacity>

        <TouchableOpacity style={styles.contactCard} activeOpacity={0.7} onPress={() => Linking.openURL("mailto:anushabazaar4@gmail.com")}>
          <View style={[styles.cardIconBox, { backgroundColor: "#EFF6FF" }]}>
            <Ionicons name="mail" size={22} color="#3B82F6" />
          </View>
          <View style={styles.cardTextWrap}>
            <Text style={styles.cardLabel}>Email Support</Text>
            <Text style={styles.cardValue}>anushabazaar4@gmail.com</Text>
          </View>
          <Ionicons name="chevron-forward" size={18} color="#D1D5DB" />
        </TouchableOpacity>

        <View style={styles.contactCard}>
          <View style={[styles.cardIconBox, { backgroundColor: "#FFF7ED" }]}>
            <Ionicons name="location" size={22} color="#F97316" />
          </View>
          <View style={styles.cardTextWrap}>
            <Text style={styles.cardLabel}>Office Address</Text>
            <Text style={styles.cardValue}>501, Manjeera Trinity Corporate, KPHB, Hyderabad, 500072</Text>
          </View>
        </View>
      </View>
    </View>
  );
};


export default HelpScreen;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#F9FAFB",
  },
  
  /* Header Setup */
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: "#fff",
    borderBottomWidth: 1,
    borderBottomColor: "#F3F4F6",
  },
  backBtn: {
    width: 40, height: 40,
    borderRadius: 20,
    backgroundColor: "#F3F4F6",
    justifyContent: "center",
    alignItems: "center",
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: "700",
    color: "#111827",
  },

  content: {
    padding: 20,
    alignItems: "center",
  },
  iconWrapper: {
    width: 100, height: 100,
    borderRadius: 50,
    backgroundColor: "#DCFCE7",
    justifyContent: "center",
    alignItems: "center",
    marginTop: 20,
    marginBottom: 20,
  },
  bannerTitle: {
    fontSize: 22,
    fontWeight: "800",
    color: "#111827",
    marginBottom: 8,
    textAlign: "center",
  },
  bannerSub: {
    fontSize: 14,
    color: "#6B7280",
    textAlign: "center",
    lineHeight: 22,
    paddingHorizontal: 10,
    marginBottom: 40,
  },

  contactCard: {
    width: "100%",
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#fff",
    padding: 16,
    borderRadius: 16,
    marginBottom: 16,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.03,
    shadowRadius: 6,
    elevation: 2,
    borderWidth: 1,
    borderColor: "#F3F4F6",
  },
  cardIconBox: {
    width: 44, height: 44,
    borderRadius: 22,
    justifyContent: "center",
    alignItems: "center",
    marginRight: 16,
  },
  cardTextWrap: {
    flex: 1,
  },
  cardLabel: {
    fontSize: 13,
    color: "#6B7280",
    fontWeight: "500",
    marginBottom: 4,
  },
  cardValue: {
    fontSize: 16,
    fontWeight: "700",
    color: "#111827",
  },
});
