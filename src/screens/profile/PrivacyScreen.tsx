import React from "react";
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Linking } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { useNavigation } from "@react-navigation/native";

const PrivacyScreen = () => {
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
        <Text style={styles.headerTitle}>Privacy Policy</Text>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        <Text style={styles.paragraph}>
          <Text style={styles.bold}>Anusha Bazaar Technologies Private Limited</Text> built the ANUSHA BAZAAR as a free app. This service is provided by Anusha Bazaar Technologies Private Limited at no cost and is intended for use as is.
        </Text>
        <Text style={styles.paragraph}>
          This page is used to inform visitors regarding my policies with the collection, use, and disclosure of Personal Information if anyone decided to use my Service.
        </Text>
        <Text style={styles.paragraph}>
          If you choose to use my Service, then you agree to the collection and use of information in relation to this policy. The Personal Information that I collect is used for providing and improving the Service. I will not use or share your information with anyone except as described in this Privacy Policy.
        </Text>
        <Text style={styles.paragraph}>
          The terms used in this Privacy Policy have the same meanings as in our Terms and Conditions, which are accessible at ANUSHA BAZAAR unless otherwise defined in this Privacy Policy.
        </Text>

        <Text style={styles.sectionTitle}>Information Collection and Use</Text>
        <Text style={styles.paragraph}>
          For a better experience, while using our Service, I may require you to provide us with certain personally identifiable information. The information that I request will be retained on your device and is not collected by me in any way.
        </Text>
        <Text style={styles.paragraph}>
          The app does use third-party services that may collect information used to identify you.
        </Text>
        <Text style={styles.paragraph}>
          Link to the privacy policy of third-party service providers used by the app:
        </Text>
        <TouchableOpacity style={styles.linkRow} onPress={() => openLink("https://www.google.com/policies/privacy/")}>
          <Ionicons name="link-outline" size={16} color="#0A8754" />
          <Text style={styles.linkText}>Google Play Services</Text>
        </TouchableOpacity>

        <Text style={styles.sectionTitle}>Log Data</Text>
        <Text style={styles.paragraph}>
          I want to inform you that whenever you use my Service, in a case of an error in the app I collect data and information (through third-party products) on your phone called Log Data. This Log Data may include information such as your device Internet Protocol ("IP") address, device name, operating system version, the configuration of the app when utilizing my Service, the time and date of your use of the Service, and other statistics.
        </Text>

        <Text style={styles.sectionTitle}>Cookies</Text>
        <Text style={styles.paragraph}>
          Cookies are files with a small amount of data that are commonly used as anonymous unique identifiers. These are sent to your browser from the websites that you visit and are stored on your device's internal memory.
        </Text>
        <Text style={styles.paragraph}>
          This Service does not use these "cookies" explicitly. However, the app may use third-party code and libraries that use "cookies" to collect information and improve their services. You have the option to either accept or refuse these cookies and know when a cookie is being sent to your device. If you choose to refuse our cookies, you may not be able to use some portions of this Service.
        </Text>

        <Text style={styles.sectionTitle}>Service Providers</Text>
        <Text style={styles.paragraph}>
          I may employ third-party companies and individuals due to the following reasons:
        </Text>
        <View style={styles.bulletList}>
          <Text style={styles.bulletItem}>• To facilitate our Service;</Text>
          <Text style={styles.bulletItem}>• To provide the Service on our behalf;</Text>
          <Text style={styles.bulletItem}>• To perform Service-related services; or</Text>
          <Text style={styles.bulletItem}>• To assist us in analyzing how our Service is used.</Text>
        </View>
        <Text style={styles.paragraph}>
          I want to inform users of this Service that these third parties have access to their Personal Information. The reason is to perform the tasks assigned to them on our behalf. However, they are obligated not to disclose or use the information for any other purpose.
        </Text>

        <Text style={styles.sectionTitle}>Security</Text>
        <Text style={styles.paragraph}>
          I value your trust in providing us your Personal Information, thus we are striving to use commercially acceptable means of protecting it. But remember that no method of transmission over the internet, or method of electronic storage is 100% secure and reliable, and I cannot guarantee its absolute security.
        </Text>

        <Text style={styles.sectionTitle}>Links to Other Sites</Text>
        <Text style={styles.paragraph}>
          This Service may contain links to other sites. If you click on a third-party link, you will be directed to that site. Note that these external sites are not operated by me. Therefore, I strongly advise you to review the Privacy Policy of these websites. I have no control over and assume no responsibility for the content, privacy policies, or practices of any third-party sites or services.
        </Text>

        <Text style={styles.sectionTitle}>Children's Privacy</Text>
        <Text style={styles.paragraph}>
          These Services do not address anyone under the age of 13. I do not knowingly collect personally identifiable information from children under 13 years of age. In the case I discover that a child under 13 has provided me with personal information, I immediately delete this from our servers. If you are a parent or guardian and you are aware that your child has provided us with personal information, please contact me so that I will be able to do the necessary actions.
        </Text>

        <Text style={styles.sectionTitle}>Changes to This Privacy Policy</Text>
        <Text style={styles.paragraph}>
          I may update our Privacy Policy from time to time. Thus, you are advised to review this page periodically for any changes. I will notify you of any changes by posting the new Privacy Policy on this page.
        </Text>
        <Text style={styles.boldParagraph}>
          This policy is effective as of 2024-Nov-25
        </Text>

        <Text style={styles.sectionTitle}>Contact Us</Text>
        <Text style={styles.paragraph}>
          If you have any questions or suggestions about my Privacy Policy, do not hesitate to contact me at:
        </Text>
        <TouchableOpacity onPress={() => openLink("mailto:anushabazaar4@gmail.com")}>
          <Text style={[styles.linkText, { marginBottom: 16 }]}>anushabazaar4@gmail.com</Text>
        </TouchableOpacity>
        
        <View style={{ height: 40 }} />
      </ScrollView>
    </View>
  );
};

export default PrivacyScreen;


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
    marginBottom: 12,
  },
  bold: {
    fontWeight: "700",
    color: "#222",
  },
  linkRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    marginBottom: 16,
    paddingVertical: 8,
    paddingHorizontal: 12,
    backgroundColor: "#E6F5EE",
    borderRadius: 8,
    alignSelf: "flex-start",
  },
  linkText: {
    fontSize: 15,
    fontWeight: "600",
    color: "#0A8754",
  },
  inlineLink: {
    color: "#0A8754",
    textDecorationLine: "underline",
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
  footerText: {
    fontSize: 13,
    color: "#888",
    marginTop: 20,
    textAlign: "center",
  },
});
