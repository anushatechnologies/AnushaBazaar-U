import React from "react";
import { View, Text, StyleSheet, TouchableOpacity } from "react-native";
import { Ionicons } from "@expo/vector-icons";

interface MapBottomCardProps {
  address: string;
  eta: string | number | null;
  onConfirm: () => void;
  insetsBottom: number;
}

const MapBottomCard = ({ address, eta, onConfirm, insetsBottom }: MapBottomCardProps) => {
  return (
    <View style={[styles.card, { paddingBottom: Math.max(insetsBottom, 12) }]}>
      <View style={styles.handle} />
      
      <View style={styles.header}>
        <Text style={styles.title}>Confirm Delivery Location</Text>
        <TouchableOpacity style={styles.changeBtn}>
          <Text style={styles.changeBtnText}>SEARCH</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.addressSection}>
        <View style={styles.iconCircle}>
          <Ionicons name="location" size={20} color="#0A8754" />
        </View>
        <View style={styles.textStack}>
          <Text style={styles.addressLabel}>DELIVERING TO</Text>
          <Text style={styles.addressText} numberOfLines={2}>{address || "Locating..."}</Text>
        </View>
      </View>

      <View style={styles.infoGrid}>
        <View style={styles.infoBox}>
          <Ionicons name="time" size={16} color="#0A8754" />
          <Text style={styles.infoText}>{typeof eta === 'number' ? `${eta} mins` : "15-20 mins"}</Text>
        </View>
        <View style={[styles.infoBox, { backgroundColor: "#E9F5FF" }]}>
          <Ionicons name="flash" size={16} color="#007AFF" />
          <Text style={[styles.infoText, { color: "#007AFF" }]}>EXPRESS</Text>
        </View>
      </View>

      <TouchableOpacity style={styles.confirmBtn} onPress={onConfirm} activeOpacity={0.8}>
        <Text style={styles.confirmText}>CONFIRM & PROCEED</Text>
        <View style={styles.btnArrow}>
          <Ionicons name="arrow-forward" size={18} color="#fff" />
        </View>
      </TouchableOpacity>
    </View>
  );
};

export default MapBottomCard;

const styles = StyleSheet.create({
  card: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: "#fff",
    borderTopLeftRadius: 32,
    borderTopRightRadius: 32,
    padding: 24,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: -10 },
    shadowOpacity: 0.12,
    shadowRadius: 15,
    elevation: 24,
  },
  handle: {
    width: 44,
    height: 5,
    backgroundColor: "#E5E7EB",
    borderRadius: 3,
    alignSelf: "center",
    marginBottom: 20,
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 24,
  },
  title: {
    fontSize: 18,
    fontWeight: "800",
    color: "#111",
    letterSpacing: -0.5,
  },
  changeBtn: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    backgroundColor: "#F3F4F6",
    borderRadius: 8,
  },
  changeBtnText: {
    fontSize: 11,
    fontWeight: "800",
    color: "#4B5563",
  },
  addressSection: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 20,
    backgroundColor: "#F9FAFB",
    padding: 16,
    borderRadius: 20,
  },
  iconCircle: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: "#DCFCE7",
    justifyContent: "center",
    alignItems: "center",
    marginRight: 14,
  },
  textStack: {
    flex: 1,
  },
  addressLabel: {
    fontSize: 10,
    color: "#059669",
    fontWeight: "800",
    letterSpacing: 1,
    marginBottom: 4,
  },
  addressText: {
    fontSize: 15,
    color: "#1F2937",
    fontWeight: "700",
    lineHeight: 20,
  },
  infoGrid: {
    flexDirection: "row",
    gap: 12,
    marginBottom: 24,
  },
  infoBox: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#F0FDF4",
    paddingVertical: 10,
    borderRadius: 12,
    gap: 6,
  },
  infoText: {
    fontSize: 13,
    color: "#166534",
    fontWeight: "700",
  },
  confirmBtn: {
    backgroundColor: "#0A8754",
    height: 60,
    borderRadius: 20,
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    gap: 12,
    shadowColor: "#0A8754",
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.3,
    shadowRadius: 12,
    elevation: 8,
  },
  confirmText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "900",
    letterSpacing: 0.5,
  },
  btnArrow: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: "rgba(255,255,255,0.2)",
    justifyContent: "center",
    alignItems: "center",
  },
});
