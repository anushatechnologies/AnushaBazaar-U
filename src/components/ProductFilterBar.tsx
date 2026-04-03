import React, { useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Modal,
  Pressable,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { scale } from "../utils/responsive";

/* ─── Types and Constants ─── */
export type SortOption = "default" | "price_asc" | "price_desc" | "name_asc";

export const SORT_LABELS: Record<SortOption, string> = {
  default: "Relevance",
  price_asc: "Price: Low to High",
  price_desc: "Price: High to Low",
  name_asc: "Name A–Z",
};

export const PRICE_RANGES = [
  { label: "All Prices", min: 0, max: 0 },
  { label: "Under ₹100", min: 0, max: 100 },
  { label: "₹100 – ₹500", min: 100, max: 500 },
  { label: "₹500 – ₹1000", min: 500, max: 1000 },
  { label: "Above ₹1000", min: 1000, max: 0 },
];

interface ProductFilterBarProps {
  activeSort: SortOption;
  activePriceRange: (typeof PRICE_RANGES)[0];
  onSortChange: (sort: SortOption) => void;
  onPriceChange: (range: (typeof PRICE_RANGES)[0]) => void;
  itemCount?: number;
  showCount?: boolean;
}

const ProductFilterBar = ({
  activeSort,
  activePriceRange,
  onSortChange,
  onPriceChange,
  itemCount,
  showCount = true,
}: ProductFilterBarProps) => {
  const [modalVisible, setModalVisible] = useState(false);

  const hasActiveFilters = activeSort !== "default" || activePriceRange.label !== "All Prices";

  return (
    <View style={styles.container}>
      <View style={styles.headerRow}>
        {showCount && itemCount !== undefined && (
          <Text style={styles.countText}>{itemCount} products found</Text>
        )}
        <View style={{ flex: 1 }} />
        <TouchableOpacity
          style={[styles.filterBtn, hasActiveFilters && styles.filterBtnActive]}
          onPress={() => setModalVisible(true)}
          activeOpacity={0.7}
        >
          <Ionicons
            name="options-outline"
            size={scale(18)}
            color={hasActiveFilters ? "#fff" : "#333"}
          />
          <Text style={[styles.filterBtnText, hasActiveFilters && { color: "#fff" }]}>
            Sort & Filter
          </Text>
        </TouchableOpacity>
      </View>

      {/* Active Filter Chips */}
      {hasActiveFilters && (
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          style={styles.chipsRow}
          contentContainerStyle={styles.chipsContent}
        >
          {activeSort !== "default" && (
            <TouchableOpacity
              style={styles.chip}
              onPress={() => onSortChange("default")}
            >
              <Text style={styles.chipText}>{SORT_LABELS[activeSort]}</Text>
              <Ionicons name="close-circle" size={scale(14)} color="#0A8754" />
            </TouchableOpacity>
          )}

          {activePriceRange.label !== "All Prices" && (
            <TouchableOpacity
              style={styles.chip}
              onPress={() => onPriceChange(PRICE_RANGES[0])}
            >
              <Text style={styles.chipText}>{activePriceRange.label}</Text>
              <Ionicons name="close-circle" size={scale(14)} color="#0A8754" />
            </TouchableOpacity>
          )}

          <TouchableOpacity
            onPress={() => {
              onSortChange("default");
              onPriceChange(PRICE_RANGES[0]);
            }}
          >
            <Text style={styles.clearAll}>Clear All</Text>
          </TouchableOpacity>
        </ScrollView>
      )}

      {/* Filter Modal */}
      <Modal
        visible={modalVisible}
        transparent
        animationType="slide"
        onRequestClose={() => setModalVisible(false)}
      >
        <View style={{ flex: 1 }}>
          <Pressable style={styles.overlay} onPress={() => setModalVisible(false)} />
          <View style={styles.sheet}>
            <View style={styles.sheetHandle} />
            
            <View style={styles.sheetHeader}>
              <Text style={styles.sheetTitle}>Sort & Filter</Text>
              <TouchableOpacity onPress={() => setModalVisible(false)}>
                <Ionicons name="close" size={scale(24)} color="#333" />
              </TouchableOpacity>
            </View>

            <ScrollView showsVerticalScrollIndicator={false}>
              {/* Sort Section */}
              <Text style={styles.sectionTitle}>Sort By</Text>
              {(Object.keys(SORT_LABELS) as SortOption[]).map((key) => (
                <TouchableOpacity
                  key={key}
                  style={[styles.optionRow, activeSort === key && styles.optionRowActive]}
                  onPress={() => onSortChange(key)}
                >
                  <Text style={[styles.optionText, activeSort === key && styles.optionTextActive]}>
                    {SORT_LABELS[key]}
                  </Text>
                  {activeSort === key && (
                    <Ionicons name="checkmark-circle" size={scale(20)} color="#0A8754" />
                  )}
                </TouchableOpacity>
              ))}

              <View style={styles.divider} />

              {/* Price Section */}
              <Text style={styles.sectionTitle}>Price Range</Text>
              {PRICE_RANGES.map((range) => (
                <TouchableOpacity
                  key={range.label}
                  style={[
                    styles.optionRow,
                    activePriceRange.label === range.label && styles.optionRowActive,
                  ]}
                  onPress={() => onPriceChange(range)}
                >
                  <Text
                    style={[
                      styles.optionText,
                      activePriceRange.label === range.label && styles.optionTextActive,
                    ]}
                  >
                    {range.label}
                  </Text>
                  {activePriceRange.label === range.label && (
                    <Ionicons name="checkmark-circle" size={scale(20)} color="#0A8754" />
                  )}
                </TouchableOpacity>
              ))}
            </ScrollView>

            <TouchableOpacity
              style={styles.applyBtn}
              onPress={() => setModalVisible(false)}
            >
              <Text style={styles.applyBtnText}>Apply Filters</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </View>
  );
};

export default ProductFilterBar;

const styles = StyleSheet.create({
  container: {
    paddingVertical: scale(10),
    backgroundColor: "transparent",
  },
  headerRow: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: scale(16),
  },
  countText: {
    fontSize: scale(13),
    color: "#666",
    fontWeight: "500",
  },
  filterBtn: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#fff",
    paddingVertical: scale(8),
    paddingHorizontal: scale(14),
    borderRadius: scale(20),
    borderWidth: 1,
    borderColor: "#E5E7EB",
    gap: scale(6),
    elevation: 2,
    shadowColor: "#000",
    shadowOpacity: 0.05,
    shadowRadius: scale(5),
    shadowOffset: { width: 0, height: scale(2) },
  },
  filterBtnActive: {
    backgroundColor: "#0A8754",
    borderColor: "#0A8754",
  },
  filterBtnText: {
    fontSize: scale(13),
    fontWeight: "700",
    color: "#374151",
  },
  chipsRow: {
    marginTop: scale(12),
  },
  chipsContent: {
    paddingHorizontal: scale(16),
    alignItems: "center",
    gap: scale(10),
    paddingBottom: scale(4),
  },
  chip: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#E8F5EE",
    paddingVertical: scale(6),
    paddingHorizontal: scale(12),
    borderRadius: scale(20),
    gap: scale(6),
    borderWidth: 1,
    borderColor: "#D1FAE5",
  },
  chipText: {
    fontSize: scale(12),
    color: "#0A8754",
    fontWeight: "600",
  },
  clearAll: {
    fontSize: scale(12),
    color: "#9CA3AF",
    fontWeight: "600",
    marginLeft: scale(5),
  },
  
  /* Modal Styles */
  overlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.5)",
  },
  sheet: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: "#fff",
    borderTopLeftRadius: scale(24),
    borderTopRightRadius: scale(24),
    paddingHorizontal: scale(20),
    paddingBottom: scale(40),
    paddingTop: scale(12),
    maxHeight: "85%",
  },
  sheetHandle: {
    width: scale(40),
    height: scale(4),
    backgroundColor: "#E5E7EB",
    borderRadius: scale(2),
    alignSelf: "center",
    marginBottom: scale(20),
  },
  sheetHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: scale(20),
  },
  sheetTitle: {
    fontSize: scale(20),
    fontWeight: "800",
    color: "#111827",
  },
  sectionTitle: {
    fontSize: scale(14),
    fontWeight: "700",
    color: "#6B7280",
    textTransform: "uppercase",
    letterSpacing: scale(1),
    marginTop: scale(20),
    marginBottom: scale(10),
  },
  optionRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: scale(14),
    paddingHorizontal: scale(16),
    borderRadius: scale(14),
    marginBottom: scale(6),
    backgroundColor: "#F9FAFB",
  },
  optionRowActive: {
    backgroundColor: "#F0FDF4",
    borderWidth: 1,
    borderColor: "#DCFCE7",
  },
  optionText: {
    fontSize: scale(15),
    color: "#4B5563",
    fontWeight: "500",
  },
  optionTextActive: {
    color: "#0A8754",
    fontWeight: "700",
  },
  divider: {
    height: 1,
    backgroundColor: "#F3F4F6",
    marginVertical: scale(10),
  },
  applyBtn: {
    backgroundColor: "#0A8754",
    paddingVertical: scale(16),
    borderRadius: scale(16),
    alignItems: "center",
    marginTop: scale(24),
    elevation: 4,
    shadowColor: "#0A8754",
    shadowOpacity: 0.2,
    shadowRadius: scale(10),
    shadowOffset: { width: 0, height: scale(4) },
  },
  applyBtnText: {
    color: "#fff",
    fontSize: scale(16),
    fontWeight: "800",
  },
});
