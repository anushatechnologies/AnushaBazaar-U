import React from "react";
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Linking } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { useNavigation } from "@react-navigation/native";

const TermsScreen = () => {
  const insets = useSafeAreaInsets();
  const navigation = useNavigation<any>();

  const openLink = (url: string) => {
    Linking.openURL(url).catch(err => console.error("Couldn't load page", err));
  };

  return (
    <View style={[styles.root, { paddingTop: Math.max(insets.top, 20) }]}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
          <Ionicons name="arrow-back" size={24} color="#111" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Terms of Service</Text>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        <Text style={styles.paragraph}>
          Welcome to <Text style={styles.bold}>Anusha Bazaar</Text>. These Terms of Service ("Terms") govern your use of our website and mobile application (collectively, the "Service") operated by <Text style={styles.bold}>Anusha Bazaar Technologies Private Limited</Text>.
        </Text>
        <Text style={styles.paragraph}>
          By accessing or using the Service, you agree to be bound by these Terms. If you disagree with any part of the terms, then you may not access the Service.
        </Text>

        <Text style={styles.sectionTitle}>1. Acceptance of Terms</Text>
        <Text style={styles.paragraph}>
          By creating an account or using our Service, you acknowledge that you have read, understood, and agree to be bound by these Terms and our Privacy Policy. If you do not agree, please do not use our Service.
        </Text>

        <Text style={styles.sectionTitle}>2. Use of Service</Text>
        <Text style={styles.paragraph}>
          You may use our Service only for lawful purposes and in accordance with these Terms. You agree not to:
        </Text>
        <View style={styles.bulletList}>
          <Text style={styles.bulletItem}>• Use the Service in any way that violates any applicable national or international law or regulation</Text>
          <Text style={styles.bulletItem}>• Engage in any conduct that restricts or inhibits anyone's use or enjoyment of the Service</Text>
          <Text style={styles.bulletItem}>• Impersonate or attempt to impersonate the Company, a Company employee, another user, or any other person or entity</Text>
          <Text style={styles.bulletItem}>• Use the Service to transmit, or procure the sending of, any advertising or promotional material without our prior written consent</Text>
        </View>

        <Text style={styles.sectionTitle}>3. User Accounts</Text>
        <Text style={styles.paragraph}>
          When you create an account with us, you must provide information that is accurate, complete, and current at all times. Failure to do so constitutes a breach of the Terms, which may result in immediate termination of your account.
        </Text>
        <Text style={styles.paragraph}>
          You are responsible for safeguarding the password that you use to access the Service and for any activities or actions under your password. You agree not to disclose your password to any third party.
        </Text>

        <Text style={styles.sectionTitle}>4. Orders and Payments</Text>
        <Text style={styles.paragraph}>
          All orders placed through our Service are subject to product availability. We reserve the right to refuse or cancel any order for any reason at any time.
        </Text>
        <Text style={styles.paragraph}>
          We accept various payment methods as displayed on our platform. By providing payment information, you represent and warrant that you are authorized to use the designated payment method.
        </Text>
        <Text style={styles.paragraph}>
          Prices for our products are subject to change without notice. We shall not be liable to you or to any third party for any modification, price change, suspension, or discontinuance of the Service.
        </Text>

        <Text style={styles.sectionTitle}>5. Delivery</Text>
        <Text style={styles.paragraph}>
          We strive to deliver all orders within our advertised 15-minute timeframe. However, delivery times may vary based on factors beyond our control, including but not limited to weather conditions, traffic, or unforeseen circumstances. We are not liable for any delays in delivery.
        </Text>

        <Text style={styles.sectionTitle}>6. Returns and Refunds</Text>
        <Text style={styles.paragraph}>
          We want you to be satisfied with your purchase. If you are not satisfied with any product, you may request a return or exchange within 24 hours of delivery, subject to our Return Policy.
        </Text>
        <Text style={styles.paragraph}>
          Refunds will be processed within 5-7 business days to the original payment method used for the purchase.
        </Text>

        <Text style={styles.sectionTitle}>7. Product Information</Text>
        <Text style={styles.paragraph}>
          We strive to provide accurate product descriptions and images. However, we do not warrant that product descriptions, images, or other content available on the Service are accurate, complete, reliable, current, or error-free.
        </Text>

        <Text style={styles.sectionTitle}>8. Limitation of Liability</Text>
        <Text style={styles.paragraph}>
          In no event shall Anusha Bazaar, Anusha Bazaar Technologies Private Limited, nor its directors, employees, partners, agents, suppliers, or affiliates, be liable for any indirect, incidental, special, consequential, or punitive damages, including without limitation, loss of profits, data, use, goodwill, or other intangible losses, resulting from your access to or use of or inability to access or use the Service.
        </Text>

        <Text style={styles.sectionTitle}>9. Intellectual Property</Text>
        <Text style={styles.paragraph}>
          The Service and its original content, features, and functionality are and will remain the exclusive property of Anusha Bazaar Technologies Private Limited and its licensors. The Service is protected by copyright, trademark, and other laws of both India and foreign countries.
        </Text>

        <Text style={styles.sectionTitle}>10. Termination</Text>
        <Text style={styles.paragraph}>
          We may terminate or suspend your account immediately, without prior notice or liability, for any reason whatsoever, including without limitation if you breach the Terms. Upon termination, your right to use the Service will immediately cease.
        </Text>

        <Text style={styles.sectionTitle}>11. Governing Law</Text>
        <Text style={styles.paragraph}>
          These Terms shall be governed and construed in accordance with the laws of India, without regard to its conflict of law provisions. Any disputes arising from these Terms or your use of the Service shall be subject to the exclusive jurisdiction of the courts in Mumbai, Maharashtra.
        </Text>

        <Text style={styles.sectionTitle}>12. Changes to Terms</Text>
        <Text style={styles.paragraph}>
          We reserve the right, at our sole discretion, to modify or replace these Terms at any time. If a revision is material, we will try to provide at least 30 days' notice prior to any new terms taking effect. What constitutes a material change will be determined at our sole discretion.
        </Text>

        <Text style={styles.sectionTitle}>13. Contact Us</Text>
        <Text style={styles.paragraph}>
          If you have any questions about these Terms, please contact us at:
        </Text>
        <View style={styles.contactInfo}>
          <Text style={styles.contactLabel}>Email: <Text style={styles.contactValue} onPress={() => openLink("mailto:anushabazaar4@gmail.com")}>anushabazaar4@gmail.com</Text></Text>
          <Text style={styles.contactLabel}>Phone: <Text style={styles.contactValue} onPress={() => openLink("tel:+918522918866")}>+91 8522918866</Text></Text>
          <Text style={styles.contactLabel}>Address: <Text style={styles.paragraph}>501, Manjeera Trinity Corporate, KPHB, Hyderabad, 500072</Text></Text>
        </View>

        <Text style={styles.boldParagraph}>
          Last Updated: March 14, 2026
        </Text>
        
        <View style={{ height: 40 }} />
      </ScrollView>
    </View>
  );
};

export default TermsScreen;

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
    backgroundColor: "#F9FAF9",
    borderBottomWidth: 1,
    borderBottomColor: "#EAEAEA",
  },
  backBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: "#EEEEEE",
    justifyContent: "center",
    alignItems: "center",
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: "700",
    color: "#111",
  },
  scrollContent: {
    padding: 20,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: "700",
    color: "#222",
    marginTop: 24,
    marginBottom: 8,
  },
  paragraph: {
    fontSize: 15,
    lineHeight: 24,
    color: "#444",
    marginBottom: 12,
  },
  boldParagraph: {
    fontSize: 15,
    lineHeight: 24,
    fontWeight: "700",
    color: "#222",
    marginTop: 20,
    marginBottom: 12,
  },
  bold: {
    fontWeight: "700",
    color: "#222",
  },
  bulletList: {
    paddingLeft: 8,
    marginBottom: 12,
  },
  bulletItem: {
    fontSize: 15,
    lineHeight: 24,
    color: "#444",
    marginBottom: 4,
  },
  contactInfo: {
    marginTop: 8,
    marginBottom: 16,
  },
  contactLabel: {
    fontSize: 15,
    lineHeight: 24,
    fontWeight: "600",
    color: "#222",
  },
  contactValue: {
    color: "#0A8754",
    textDecorationLine: "underline",
  },
});
