import React from "react";
import { View, Text, StyleSheet, TouchableOpacity, Share } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useNavigation } from "@react-navigation/native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { API_CONFIG } from "../config/api.config";

type Props = {
  title: string;
  onSearch?: () => void;
  onShare?: () => void;
};

const TopBar = ({ title, onSearch, onShare }: Props) => {
  const navigation = useNavigation<any>();
  const insets = useSafeAreaInsets();

  const handleDefaultShare = async () => {
    try {
      if (onShare) {
        onShare();
        return;
      }
      const shareUrl = `${API_CONFIG.SHARE_URL}/app`;
      await Share.share({
        message: `Check out ${title} on Anusha Bazaar! Shop fresh groceries and more here: ${shareUrl}`,
        url: shareUrl, // iOS support
        title: "Anusha Bazaar",
      });
    } catch (error) {
      console.error("Share error:", error);
    }
  };

  return (
    <View style={[styles.container, { paddingTop: Math.max(insets.top, 12) }]}>
      <TouchableOpacity 
        onPress={() => navigation.goBack()}
        style={styles.backBtn}
        activeOpacity={0.7}
      >
        <Ionicons name="arrow-back" size={24} color="#111" />
      </TouchableOpacity>

      <Text style={styles.title} numberOfLines={1}>{title}</Text>

      <View style={styles.icons}>
        <TouchableOpacity 
          onPress={() => {
            if (onSearch) onSearch();
            else navigation.navigate("SearchResults", { query: "" });
          }}
          style={styles.iconBtn}
          activeOpacity={0.7}
        >
          <Ionicons name="search-outline" size={22} color="#111" />
        </TouchableOpacity>

        <TouchableOpacity 
          onPress={handleDefaultShare}
          style={styles.iconBtn}
          activeOpacity={0.7}
        >
          <Ionicons name="share-social-outline" size={22} color="#111" />
        </TouchableOpacity>
      </View>
    </View>
  );
};

export default TopBar;

const styles = StyleSheet.create({
  container: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#fff",
    paddingHorizontal: 16,
    paddingBottom: 14,
    borderBottomWidth: 1,
    borderBottomColor: "#F3F4F6",
    elevation: 2,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 10,
  },
  backBtn: {
    padding: 4,
    marginRight: 12,
  },
  title: {
    flex: 1,
    fontSize: 18,
    fontWeight: "700",
    color: "#111",
    letterSpacing: -0.5,
  },
  icons: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  iconBtn: {
    width: 40,
    height: 40,
    justifyContent: "center",
    alignItems: "center",
    borderRadius: 20,
    backgroundColor: "#F9FAFB",
  },
});
