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
import { scale } from "../utils/responsive";

type NavigationProp = NativeStackNavigationProp<RootStackParamList>;

const ProfileScreen = () => {
  const navigation = useNavigation<NavigationProp>();
  const { user, logout } = useAuth();
  const { points } = useWallet();
  const insets = useSafeAreaInsets();
  
  // DISABLED: Rewards/Coins system hidden for now
  // const tier = getTier(points);

  const [showLogoutModal, setShowLogoutModal] = useState(false);

  return (
    <View style={{ flex: 1, backgroundColor: "#F9FAFB" }}>
      <ScrollView
        style={styles.container}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: scale(40) }}
      >
        {/* Header */}
        <View style={[styles.topSection, { paddingTop: Math.max(insets.top, scale(24)) }]}>
          <View style={styles.headerRow}>
            <Pressable 
              style={({ pressed }) => [
                styles.backBtnSmall,
                pressed && { opacity: 0.7 }
              ]}
              onPress={() => navigation.goBack()}
            >
              <Ionicons name="arrow-back" size={scale(24)} color="#111827" />
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
                size={scale(18)}
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
            title="Payments & Wallet" 
            icon="card-outline" 
            onPress={() => navigation.navigate("Wallet")} 
            badge="Coming Soon"
            badgeColor="#6B7280"
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
            <Ionicons name="log-out-outline" size={scale(20)} color="#E8294A" style={{ marginRight: scale(8) }} />
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
        <Ionicons name={icon} size={scale(20)} color="#6B7280" />
      </View>
      <Text style={styles.menuText}>{title}</Text>
    </View>
    <View style={{ flexDirection: "row", alignItems: "center" }}>
      {badge && (
        <View style={[styles.badge, { backgroundColor: badgeColor + "15" }]}>
          <Text style={[styles.badgeText, { color: badgeColor || "#6B7280" }]}>{badge}</Text>
        </View>
      )}
      {!hideChevron && <Ionicons name="chevron-forward" size={scale(18)} color="#D1D5DB" />}
    </View>
  </Pressable>
);

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#F9FAFB" },

  topSection: { paddingHorizontal: scale(20), paddingBottom: scale(16) },
  headerRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: scale(12),
  },
  backBtnSmall: {
    width: scale(40),
    height: scale(40),
    borderRadius: scale(20),
    backgroundColor: "#fff",
    justifyContent: "center",
    alignItems: "center",
    elevation: 2,
    shadowColor: "#000",
    shadowOpacity: 0.05,
    shadowRadius: scale(5),
  },
  headerTitle: { fontSize: scale(28), fontWeight: "700", color: "#111827" },

  /* -- Profile Card -- */
  profileCard: {
    marginHorizontal: scale(16),
    marginBottom: scale(24),
    backgroundColor: "#fff",
    padding: scale(20),
    borderRadius: scale(16),
    flexDirection: "row",
    alignItems: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: scale(2) },
    shadowOpacity: 0.04,
    shadowRadius: scale(8),
    elevation: 2,
    borderWidth: 1,
    borderColor: "#F3F4F6",
  },
  avatar: {
    width: scale(64),
    height: scale(64),
    borderRadius: scale(32),
    backgroundColor: "#E5F4ED",
    justifyContent: "center",
    alignItems: "center",
    marginRight: scale(16),
    borderWidth: 1,
    borderColor: "#D3ECD0",
  },
  avatarText: {
    color: "#0A8754",
    fontSize: scale(24),
    fontWeight: "800",
  },
  profileInfo: { flex: 1, justifyContent: "center" },
  name: { fontSize: scale(18), fontWeight: "700", color: "#111827" },
  phone: { color: "#6B7280", marginTop: scale(4), fontSize: scale(14), fontWeight: "500" },
  
  loginBtnContainer: { alignSelf: "flex-start", marginTop: scale(2) },
  loginText: { color: "#0A8754", fontWeight: "700", fontSize: scale(16) },

  editBtn: {
    padding: scale(8),
    backgroundColor: "#F9FAFB",
    borderRadius: scale(20),
    borderWidth: 1,
    borderColor: "#E5E7EB",
  },

  /* -- Menu Groups -- */
  menuGroup: {
    marginHorizontal: scale(16),
    marginBottom: scale(20),
    backgroundColor: "#fff",
    borderRadius: scale(16),
    shadowColor: "#000",
    shadowOffset: { width: 0, height: scale(2) },
    shadowOpacity: 0.02,
    shadowRadius: scale(6),
    elevation: 1,
    borderWidth: 1,
    borderColor: "#F3F4F6",
    overflow: "hidden",
  },
  menuItem: {
    padding: scale(16),
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  menuLeft: { flexDirection: "row", alignItems: "center" },
  iconBox: {
    width: scale(36), height: scale(36),
    borderRadius: scale(18),
    backgroundColor: "#F9FAFB",
    justifyContent: "center",
    alignItems: "center",
    marginRight: scale(14),
  },
  menuText: { fontSize: scale(16), fontWeight: "500", color: "#374151" },
  divider: {
    height: 1,
    backgroundColor: "#F3F4F6",
    marginLeft: scale(66), // aligns with text starting position
  },

  /* -- Logout -- */
  logoutBtn: {
    marginHorizontal: scale(16),
    marginTop: scale(8),
    backgroundColor: "#FEF2F2",
    paddingVertical: scale(16),
    borderRadius: scale(16),
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    borderWidth: 1,
    borderColor: "#FEE2E2",
  },
  logoutText: { color: "#E8294A", fontWeight: "700", fontSize: scale(16) },

  /* -- Version Box -- */
  versionBox: { alignItems: "center", marginTop: scale(32) },
  versionLabel: { color: "#9CA3AF", fontSize: scale(13), fontWeight: "500" },

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
    borderRadius: scale(24),
    padding: scale(24),
    shadowColor: "#000",
    shadowOffset: { width: 0, height: scale(4) },
    shadowOpacity: 0.1,
    shadowRadius: scale(12),
    elevation: 10,
  },
  modalTitle: {
    fontSize: scale(20),
    fontWeight: "700",
    color: "#111827",
    marginBottom: scale(8),
  },
  modalSubtitle: {
    color: "#6B7280",
    fontSize: scale(15),
    lineHeight: scale(22),
    marginBottom: scale(24),
  },
  modalButtons: {
    flexDirection: "row",
    justifyContent: "flex-end",
    gap: scale(12),
  },
  cancelBtn: { 
    paddingVertical: scale(10), 
    paddingHorizontal: scale(20),
    borderRadius: scale(12),
    backgroundColor: "#F3F4F6",
  },
  cancelText: { color: "#4B5563", fontWeight: "600", fontSize: scale(15) },
  
  confirmBtn: { 
    paddingVertical: scale(10), 
    paddingHorizontal: scale(20),
    borderRadius: scale(12),
    backgroundColor: "#E8294A" 
  },
  confirmText: { color: "#fff", fontWeight: "700", fontSize: scale(15) },
  badge: {
    paddingHorizontal: scale(10),
    paddingVertical: scale(4),
    borderRadius: scale(8),
    marginRight: scale(8),
  },
  badgeText: {
    fontSize: scale(11),
    fontWeight: "800",
    textTransform: "uppercase",
  },
});

export default ProfileScreen;