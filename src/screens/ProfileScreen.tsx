import React, { useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Pressable,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useNavigation } from "@react-navigation/native";
import { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { RootStackParamList } from "../navigation/RootStack";
import { useAuth } from "../context/AuthContext";
import { useWallet } from "../context/WalletContext";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import Constants from "expo-constants";
import { Share } from "react-native";
import { API_CONFIG } from "../config/api.config";

type NavigationProp = NativeStackNavigationProp<RootStackParamList>;

const ProfileScreen = () => {
  const navigation = useNavigation<NavigationProp>();
  const { user, logout } = useAuth();
  const { points } = useWallet();
  const insets = useSafeAreaInsets();
  
  const getTier = (pts: number) => {
    if (pts >= 2000) return { name: "Gold", color: "#EAB308", icon: "crown" };
    if (pts >= 500) return { name: "Silver", color: "#94A3B8", icon: "shield" };
    return { name: "Bronze", color: "#B45309", icon: "medal" };
  };

  const tier = getTier(points);

  const [showLogoutModal, setShowLogoutModal] = useState(false);

  return (
    <View style={{ flex: 1, backgroundColor: "#F9FAFB" }}>
      <ScrollView
        style={styles.container}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: 40 }}
      >
        {/* Header */}
        <View style={[styles.topSection, { paddingTop: Math.max(insets.top, 24) }]}>
          <View style={styles.headerRow}>
            <Pressable 
              style={({ pressed }) => [
                styles.backBtnSmall,
                pressed && { opacity: 0.7 }
              ]}
              onPress={() => navigation.goBack()}
            >
              <Ionicons name="arrow-back" size={24} color="#111827" />
            </Pressable>
            <Text style={styles.headerTitle}>Account Details</Text>
          </View>
        </View>

        {/* Share App Floating Action - Optional, but let's put it in menu group 3 */}

        {/* Profile Card */}
        <View style={styles.profileCard}>
          <View style={styles.avatar}>
            <Text style={styles.avatarText}>
              {user?.name?.charAt(0)?.toUpperCase() || "A"}
            </Text>
          </View>

          <View style={styles.profileInfo}>
            {user ? (
              <>
                <Text style={styles.name}>{user.name}</Text>
                <Text style={styles.phone}>{user.phone}</Text>
              </>
            ) : (
              <Pressable
                style={styles.loginBtnContainer}
                onPress={() => navigation.navigate("Login")}
              >
                <Text style={styles.loginText}>Login or Sign Up {">"}</Text>
              </Pressable>
            )}
          </View>

          {user && (
            <Pressable
              onPress={() => navigation.navigate("EditProfile")}
              style={styles.editBtn}
            >
              <Ionicons
                name="pencil"
                size={18}
                color="#0A8754"
              />
            </Pressable>
          )}
        </View>

        {/* --- Options Group 1: Shopping & Support --- */}
        <View style={styles.menuGroup}>
          <MenuItem 
            title="My Orders" 
            icon="receipt-outline" 
            onPress={() => navigation.navigate("Orders")} 
          />
          <MenuItem 
            title="Wishlist" 
            icon="heart-outline" 
            onPress={() => navigation.navigate("Wishlist")} 
          />
        </View>

        {/* --- Options Group 2: Payment & Addresses --- */}
        <View style={styles.menuGroup}>
          <MenuItem 
            title="Saved Addresses" 
            icon="location-outline" 
            onPress={() => navigation.navigate("SavedAddress")} 
          />
          <View style={styles.divider} />
          <MenuItem 
            title="Payments & Wallets" 
            icon="card-outline" 
            onPress={() => navigation.navigate("Payment")} 
          />
        </View>

        {/* --- Options Group 3: App Settings & Info --- */}
        <View style={styles.menuGroup}>
          <MenuItem 
            title="Notifications" 
            icon="notifications-outline" 
            onPress={() => navigation.navigate("Notifications")} 
          />
          <View style={styles.divider} />
          <MenuItem 
            title="Help & Support" 
            icon="headset-outline" 
            onPress={() => navigation.navigate("Help")} 
          />
          <View style={styles.divider} />
          <MenuItem 
            title="Share App" 
            icon="share-social-outline" 
            onPress={async () => {
              try {
                const shareUrl = `${API_CONFIG.SHARE_URL}/app`;
                await Share.share({
                  message: `Check out Anusha Bazaar for fresh groceries and amazing deals! Download now: ${shareUrl}`,
                  url: shareUrl,
                });
              } catch (e) {
                console.error(e);
              }
            }} 
          />
          <View style={styles.divider} />
          <MenuItem 
            title="General Information" 
            icon="information-circle-outline" 
            onPress={() => navigation.navigate("GeneralInfo")} 
            hideChevron={true}
          />
        </View>

        {/* Logout */}
        {user && (
          <Pressable
            style={styles.logoutBtn}
            onPress={() => setShowLogoutModal(true)}
          >
            <Ionicons name="log-out-outline" size={20} color="#E8294A" style={{ marginRight: 8 }} />
            <Text style={styles.logoutText}>Log Out</Text>
          </Pressable>
        )}

        {/* App Version */}
        <View style={styles.versionBox}>
          <Text style={styles.versionLabel}>App Version {Constants.expoConfig?.version || "1.0.0"}</Text>
        </View>
      </ScrollView>

      {/* ===== Styled Logout Modal ===== */}
      {showLogoutModal && (
        <View style={styles.modalOverlay}>
          <View style={styles.modalContainer}>
            <Text style={styles.modalTitle}>Log Out</Text>
            <Text style={styles.modalSubtitle}>
              Are you sure you want to log out from this account?
            </Text>

            <View style={styles.modalButtons}>
              <Pressable
                style={styles.cancelBtn}
                onPress={() => setShowLogoutModal(false)}
              >
                <Text style={styles.cancelText}>Cancel</Text>
              </Pressable>

              <Pressable
                style={styles.confirmBtn}
                onPress={() => {
                  setShowLogoutModal(false);
                  logout();
                  navigation.reset({
                    index: 0,
                    routes: [{ name: "MainTabs" }],
                  });
                }}
              >
                <Text style={styles.confirmText}>Log Out</Text>
              </Pressable>
            </View>
          </View>
        </View>
      )}
    </View>
  );
};

type MenuItemProps = {
  title: string;
  icon: keyof typeof Ionicons.glyphMap;
  onPress?: () => void;
  hideChevron?: boolean;
  badge?: string;
  badgeColor?: string;
};

const MenuItem = ({ title, icon, onPress, hideChevron, badge, badgeColor }: MenuItemProps) => (
  <Pressable
    style={({ pressed }) => [
      styles.menuItem,
      pressed && { backgroundColor: "#F3F4F6" },
    ]}
    android_ripple={{ color: "#F3F4F6" }}
    onPress={onPress}
  >
    <View style={styles.menuLeft}>
      <View style={styles.iconBox}>
        <Ionicons name={icon} size={20} color="#6B7280" />
      </View>
      <Text style={styles.menuText}>{title}</Text>
    </View>
    <View style={{ flexDirection: "row", alignItems: "center" }}>
      {badge && (
        <View style={[styles.badge, { backgroundColor: badgeColor + "15" }]}>
          <Text style={[styles.badgeText, { color: badgeColor || "#6B7280" }]}>{badge}</Text>
        </View>
      )}
      {!hideChevron && <Ionicons name="chevron-forward" size={18} color="#D1D5DB" />}
    </View>
  </Pressable>
);

export default ProfileScreen;

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#F9FAFB" },

  topSection: { paddingHorizontal: 20, paddingBottom: 16 },
  headerRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  backBtnSmall: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: "#fff",
    justifyContent: "center",
    alignItems: "center",
    elevation: 2,
    shadowColor: "#000",
    shadowOpacity: 0.05,
    shadowRadius: 5,
  },
  headerTitle: { fontSize: 28, fontWeight: "700", color: "#111827" },

  /* -- Profile Card -- */
  profileCard: {
    marginHorizontal: 16,
    marginBottom: 24,
    backgroundColor: "#fff",
    padding: 20,
    borderRadius: 16,
    flexDirection: "row",
    alignItems: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 8,
    elevation: 2,
    borderWidth: 1,
    borderColor: "#F3F4F6",
  },
  avatar: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: "#E5F4ED",
    justifyContent: "center",
    alignItems: "center",
    marginRight: 16,
    borderWidth: 1,
    borderColor: "#D3ECDY",
  },
  avatarText: {
    color: "#0A8754",
    fontSize: 24,
    fontWeight: "800",
  },
  profileInfo: { flex: 1, justifyContent: "center" },
  name: { fontSize: 18, fontWeight: "700", color: "#111827" },
  phone: { color: "#6B7280", marginTop: 4, fontSize: 14, fontWeight: "500" },
  
  loginBtnContainer: { alignSelf: "flex-start", marginTop: 2 },
  loginText: { color: "#0A8754", fontWeight: "700", fontSize: 16 },

  editBtn: {
    padding: 8,
    backgroundColor: "#F9FAFB",
    borderRadius: 20,
    borderWidth: 1,
    borderColor: "#E5E7EB",
  },

  /* -- Menu Groups -- */
  menuGroup: {
    marginHorizontal: 16,
    marginBottom: 20,
    backgroundColor: "#fff",
    borderRadius: 16,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.02,
    shadowRadius: 6,
    elevation: 1,
    borderWidth: 1,
    borderColor: "#F3F4F6",
    overflow: "hidden",
  },
  menuItem: {
    padding: 16,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  menuLeft: { flexDirection: "row", alignItems: "center" },
  iconBox: {
    width: 36, height: 36,
    borderRadius: 18,
    backgroundColor: "#F9FAFB",
    justifyContent: "center",
    alignItems: "center",
    marginRight: 14,
  },
  menuText: { fontSize: 16, fontWeight: "500", color: "#374151" },
  divider: {
    height: 1,
    backgroundColor: "#F3F4F6",
    marginLeft: 66, // aligns with text starting position
  },

  /* -- Logout -- */
  logoutBtn: {
    marginHorizontal: 16,
    marginTop: 8,
    backgroundColor: "#FEF2F2",
    paddingVertical: 16,
    borderRadius: 16,
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    borderWidth: 1,
    borderColor: "#FEE2E2",
  },
  logoutText: { color: "#E8294A", fontWeight: "700", fontSize: 16 },

  /* -- Version Box -- */
  versionBox: { alignItems: "center", marginTop: 32 },
  versionLabel: { color: "#9CA3AF", fontSize: 13, fontWeight: "500" },

  /* -- Modal UI -- */
  modalOverlay: {
    position: "absolute",
    top: 0, left: 0, right: 0, bottom: 0,
    backgroundColor: "rgba(0,0,0,0.5)",
    justifyContent: "center",
    alignItems: "center",
    zIndex: 1000,
  },
  modalContainer: {
    width: "80%",
    backgroundColor: "#fff",
    borderRadius: 24,
    padding: 24,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 12,
    elevation: 10,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: "700",
    color: "#111827",
    marginBottom: 8,
  },
  modalSubtitle: {
    color: "#6B7280",
    fontSize: 15,
    lineHeight: 22,
    marginBottom: 24,
  },
  modalButtons: {
    flexDirection: "row",
    justifyContent: "flex-end",
    gap: 12,
  },
  cancelBtn: { 
    paddingVertical: 10, 
    paddingHorizontal: 20,
    borderRadius: 12,
    backgroundColor: "#F3F4F6",
  },
  cancelText: { color: "#4B5563", fontWeight: "600", fontSize: 15 },
  
  confirmBtn: { 
    paddingVertical: 10, 
    paddingHorizontal: 20,
    borderRadius: 12,
    backgroundColor: "#E8294A" 
  },
  confirmText: { color: "#fff", fontWeight: "700", fontSize: 15 },
  pointsEarnedBox: {
    flexDirection: "row",
    alignItems: "center",
  },
  badge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 8,
    marginRight: 8,
  },
  badgeText: {
    fontSize: 11,
    fontWeight: "800",
    textTransform: "uppercase",
  },
});