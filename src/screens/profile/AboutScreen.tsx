import React from "react";
import { View, Text, StyleSheet, TouchableOpacity, Image, Linking } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { useNavigation } from "@react-navigation/native";
import Constants from "expo-constants";

const AboutScreen = () => {
  const insets = useSafeAreaInsets();
  const navigation = useNavigation<any>();

  // Get the version from app.json via Constants.expoConfig
  // Fallback to "1.0.0" if running in a bare workflow without config
  const appVersion = Constants.expoConfig?.version || "1.0.0";
  const appName = Constants.expoConfig?.name || "Anusha Bazaar";

  const openWebsite = () => {
    Linking.openURL("https://billionbrightsolutions.com").catch((err) =>
      console.error("Couldn't load page", err)
    );
  };

  return (
    <View style={[styles.root, { paddingTop: Math.max(insets.top, 20) }]}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
          <Ionicons name="arrow-back" size={24} color="#111" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>About App</Text>
        <View style={{ width: 40 }} />
      </View>

      <View style={styles.content}>
        {/* App Branding */}
        <View style={styles.logoContainer}>
          <Image
            source={require('../../../assets/splash.png')}
            style={styles.logo}
            resizeMode="contain"
          />
          <Text style={styles.appName}>{appName}</Text>
          <View style={styles.versionBadge}>
            <Text style={styles.versionText}>Version {appVersion}</Text>
          </View>
        </View>

        {/* Info Cards */}
        <View style={styles.infoCard}>
          <Text style={styles.sectionTitle}>Company</Text>
          <Text style={styles.paragraph}>
            Anusha Bazaar is operated by <Text style={styles.bold}>Anusha Bazaar Technologies Private Limited</Text>.
          </Text>
          
          <Text style={[styles.sectionTitle, { marginTop: 16 }]}>Address</Text>
          <Text style={styles.paragraph}>
            501, Manjeera Trinity Corporate, KPHB, Hyderabad, 500072
          </Text>
        </View>

        <View style={styles.infoCard}>
          <Text style={styles.sectionTitle}>Our Mission</Text>
          <Text style={styles.paragraph}>
            To deliver fresh groceries and daily essentials right to your doorstep within 45 minutes, providing a seamless and premium shopping experience.
          </Text>
        </View>

        {/* Footer */}
        <View style={styles.footer}>
          <Ionicons name="heart" size={16} color="#FF4B4B" style={{ marginRight: 6 }} />
          <Text style={styles.footerText}>
            Made with love in India
          </Text>
        </View>
        
        <Text style={styles.copyrightText}>
          © {new Date().getFullYear()} Anusha Bazaar Technologies Private Limited. All rights reserved.
        </Text>
      </View>
    </View>
  );
};

export default AboutScreen;

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: "#F9FAF9",
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    paddingBottom: 16,
    backgroundColor: "#fff",
    borderBottomWidth: 1,
    borderBottomColor: "#EAEAEA",
  },
  backBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: "#F3F4F6",
    justifyContent: "center",
    alignItems: "center",
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: "700",
    color: "#111",
  },
  content: {
    padding: 24,
    flex: 1,
    alignItems: "center",
  },
  logoContainer: {
    alignItems: "center",
    marginBottom: 40,
    marginTop: 20,
  },
  logo: {
    width: 100,
    height: 100,
    borderRadius: 24,
    marginBottom: 16,
  },
  appName: {
    fontSize: 24,
    fontWeight: "800",
    color: "#111",
    marginBottom: 8,
  },
  versionBadge: {
    backgroundColor: "#E6F5EE",
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
  },
  versionText: {
    fontSize: 14,
    fontWeight: "600",
    color: "#0A8754",
  },
  infoCard: {
    backgroundColor: "#fff",
    width: "100%",
    padding: 20,
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
  sectionTitle: {
    fontSize: 16,
    fontWeight: "700",
    color: "#222",
    marginBottom: 8,
  },
  paragraph: {
    fontSize: 14,
    lineHeight: 22,
    color: "#555",
  },
  bold: {
    fontWeight: "700",
    color: "#222",
  },
  websiteBtn: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: 16,
    paddingVertical: 8,
    paddingHorizontal: 14,
    backgroundColor: "#E6F5EE",
    borderRadius: 8,
    alignSelf: "flex-start",
  },
  websiteText: {
    fontSize: 14,
    fontWeight: "600",
    color: "#0A8754",
    marginLeft: 6,
  },
  footer: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: "auto",
    marginBottom: 8,
  },
  footerText: {
    fontSize: 14,
    color: "#777",
    fontWeight: "500",
  },
  copyrightText: {
    fontSize: 12,
    color: "#999",
    textAlign: "center",
    marginBottom: 10,
  },
});
