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
            size={18}
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
              <Ionicons name="close-circle" size={14} color="#0A8754" />
            </TouchableOpacity>
          )}

          {activePriceRange.label !== "All Prices" && (
            <TouchableOpacity
              style={styles.chip}
              onPress={() => onPriceChange(PRICE_RANGES[0])}
            >
              <Text style={styles.chipText}>{activePriceRange.label}</Text>
              <Ionicons name="close-circle" size={14} color="#0A8754" />
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
        <Pressable style={styles.overlay} onPress={() => setModalVisible(false)} />
        <View style={styles.sheet}>
          <View style={styles.sheetHandle} />
          
          <View style={styles.sheetHeader}>
            <Text style={styles.sheetTitle}>Sort & Filter</Text>
            <TouchableOpacity onPress={() => setModalVisible(false)}>
              <Ionicons name="close" size={24} color="#333" />
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
                  <Ionicons name="checkmark-circle" size={20} color="#0A8754" />
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
                  <Ionicons name="checkmark-circle" size={20} color="#0A8754" />
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
      </Modal>
    </View>
  );
};

export default ProductFilterBar;

const styles = StyleSheet.create({
  container: {
    paddingVertical: 10,
    backgroundColor: "transparent",
  },
  headerRow: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 16,
  },
  countText: {
    fontSize: 13,
    color: "#666",
    fontWeight: "500",
  },
  filterBtn: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#fff",
    paddingVertical: 8,
    paddingHorizontal: 14,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: "#E5E7EB",
    gap: 6,
    elevation: 2,
    shadowColor: "#000",
    shadowOpacity: 0.05,
    shadowRadius: 5,
    shadowOffset: { width: 0, height: 2 },
  },
  filterBtnActive: {
    backgroundColor: "#0A8754",
    borderColor: "#0A8754",
  },
  filterBtnText: {
    fontSize: 13,
    fontWeight: "700",
    color: "#374151",
  },
  chipsRow: {
    marginTop: 12,
  },
  chipsContent: {
    paddingHorizontal: 16,
    alignItems: "center",
    gap: 10,
    paddingBottom: 4,
  },
  chip: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#E8F5EE",
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 20,
    gap: 6,
    borderWidth: 1,
    borderColor: "#D1FAE5",
  },
  chipText: {
    fontSize: 12,
    color: "#0A8754",
    fontWeight: "600",
  },
  clearAll: {
    fontSize: 12,
    color: "#9CA3AF",
    fontWeight: "600",
    marginLeft: 5,
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
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    paddingHorizontal: 20,
    paddingBottom: 40,
    paddingTop: 12,
    maxHeight: "85%",
  },
  sheetHandle: {
    width: 40,
    height: 4,
    backgroundColor: "#E5E7EB",
    borderRadius: 2,
    alignSelf: "center",
    marginBottom: 20,
  },
  sheetHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 20,
  },
  sheetTitle: {
    fontSize: 20,
    fontWeight: "800",
    color: "#111827",
  },
  sectionTitle: {
    fontSize: 14,
    fontWeight: "700",
    color: "#6B7280",
    textTransform: "uppercase",
    letterSpacing: 1,
    marginTop: 20,
    marginBottom: 10,
  },
  optionRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: 14,
    paddingHorizontal: 16,
    borderRadius: 14,
    marginBottom: 6,
    backgroundColor: "#F9FAFB",
  },
  optionRowActive: {
    backgroundColor: "#F0FDF4",
    borderWidth: 1,
    borderColor: "#DCFCE7",
  },
  optionText: {
    fontSize: 15,
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
    marginVertical: 10,
  },
  applyBtn: {
    backgroundColor: "#0A8754",
    paddingVertical: 16,
    borderRadius: 16,
    alignItems: "center",
    marginTop: 24,
    elevation: 4,
    shadowColor: "#0A8754",
    shadowOpacity: 0.2,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 4 },
  },
  applyBtnText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "800",
  },
});
