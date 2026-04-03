import React, { useState, useEffect, useCallback } from "react";
import { 
  View, 
  Text, 
  StyleSheet, 
  FlatList, 
  TouchableOpacity,
  Modal,
  TextInput,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
  ActivityIndicator,
  Alert
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useNavigation, useFocusEffect } from "@react-navigation/native";
import { Ionicons } from "@expo/vector-icons";
import { useAuth } from "../context/AuthContext";
import * as AddressAPI from "../services/api/addresses";
import * as Location from "expo-location";
import { scale } from "../utils/responsive";

const SavedAddressScreen = () => {
  const insets = useSafeAreaInsets();
  const navigation = useNavigation();
  const { user, jwtToken } = useAuth();

  // State
  const [addresses, setAddresses] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isModalVisible, setModalVisible] = useState(false);
  const [isLocating, setIsLocating] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [editingAddressId, setEditingAddressId] = useState<string | number | null>(null);

  // Form State
  const [newAddressLine1, setNewAddressLine1] = useState("");
  const [newAddressLine2, setNewAddressLine2] = useState("");
  const [newLandmark, setNewLandmark] = useState("");
  const [newCity, setNewCity] = useState("");
  const [newState, setNewState] = useState("");
  const [newPostalCode, setNewPostalCode] = useState("");
  const [newTag, setNewTag] = useState("home");

  const fetchAddresses = useCallback(async () => {
    if (!jwtToken) {
      setAddresses([]);
      setIsLoading(false);
      return;
    }
    setIsLoading(true);
    try {
      const data = await AddressAPI.getAddresses(jwtToken, user?.customerId);
      setAddresses(Array.isArray(data) ? data : []);
    } catch (error) {
      console.error("Error loading addresses:", error);
    } finally {
      setIsLoading(false);
    }
  }, [jwtToken]);

  useFocusEffect(
    useCallback(() => {
      fetchAddresses();
    }, [fetchAddresses])
  );

  const resetForm = () => {
    setEditingAddressId(null);
    setNewAddressLine1("");
    setNewAddressLine2("");
    setNewLandmark("");
    setNewCity("");
    setNewState("");
    setNewPostalCode("");
    setNewTag("home");
  };

  const renderAddress = ({ item }: { item: any }) => {
    const tag = (item.addressType || "home").toUpperCase();
    const fullAddress = [item.addressLine1, item.addressLine2, item.landmark, item.city, item.state, item.postalCode]
      .filter(Boolean)
      .join(", ");

    return (
      <View style={[styles.card, item.isDefault && styles.cardDefault]}>
        <View style={styles.cardHeader}>
          <View style={styles.tagWrap}>
            <Ionicons 
              name={tag === "HOME" ? "home" : tag === "WORK" ? "briefcase" : "location"} 
              size={scale(16)} 
              color={item.isDefault ? "#0A8754" : "#4B5563"} 
            />
            <Text style={[styles.tagText, item.isDefault && { color: "#0A8754" }]}>
              {tag}
            </Text>
          </View>
          <TouchableOpacity onPress={() => handleDeleteAddress(item.id)}>
            <Ionicons name="trash-outline" size={scale(20)} color="#EF4444" />
          </TouchableOpacity>
        </View>

        <Text style={styles.addressText}>{fullAddress}</Text>

        <View style={styles.actionRow}>
          <View style={{ flexDirection: "row", gap: scale(10) }}>
            <TouchableOpacity 
              style={styles.editBtn}
              onPress={() => {
                setEditingAddressId(item.id);
                setNewAddressLine1(item.addressLine1 || "");
                setNewAddressLine2(item.addressLine2 || "");
                setNewLandmark(item.landmark || "");
                setNewCity(item.city || "");
                setNewState(item.state || "");
                setNewPostalCode(item.postalCode || "");
                setNewTag(item.addressType || "home");
                setModalVisible(true);
              }}
            >
              <Text style={styles.editBtnText}>Edit</Text>
            </TouchableOpacity>
            {!item.isDefault && (
              <TouchableOpacity 
                style={styles.editBtn}
                onPress={() => handleSetDefault(item.id)}
              >
                <Text style={styles.editBtnText}>Set Default</Text>
              </TouchableOpacity>
            )}
          </View>
          {item.isDefault && (
            <View style={styles.defaultBadge}>
              <Ionicons name="checkmark-circle" size={scale(14)} color="#0A8754" />
              <Text style={styles.defaultText}>Default</Text>
            </View>
          )}
        </View>
      </View>
    );
  };

  const handleSetDefault = async (id: number | string) => {
    if (!jwtToken) return;
    try {
      const existingAddress = addresses.find(a => a.id === id);
      if (!existingAddress) return;

      const payload = {
        addressType: existingAddress.addressType || "Home",
        addressLine1: existingAddress.addressLine1 || "",
        addressLine2: existingAddress.addressLine2 || "",
        landmark: existingAddress.landmark || "",
        city: existingAddress.city || "",
        state: existingAddress.state || "",
        postalCode: existingAddress.postalCode || "",
        isDefault: true,
      };

      const success = await AddressAPI.updateAddress(jwtToken, id, payload);
      if (success) {
        fetchAddresses();
      } else {
        Alert.alert("Error", "Could not set default address.");
      }
    } catch (e) {
      Alert.alert("Error", "Something went wrong.");
    }
  };

  const handleDeleteAddress = async (id: number | string) => {
    if (!jwtToken) return;
    Alert.alert("Delete Address", "Are you sure you want to delete this address?", [
      { text: "Cancel", style: "cancel" },
      {
        text: "Delete",
        style: "destructive",
        onPress: async () => {
          const success = await AddressAPI.deleteAddress(jwtToken, id);
          if (success) {
            setAddresses((prev) => prev.filter((a) => a.id !== id));
          } else {
            Alert.alert("Error", "Could not delete address.");
          }
        },
      },
    ]);
  };

  const handleUseCurrentLocation = async () => {
    setIsLocating(true);
    try {
      let { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert("Permission Refused", "We need location access to find your address.");
        setIsLocating(false);
        return;
      }

      let location = await Location.getCurrentPositionAsync({
        accuracy: Location.Accuracy.High
      });

      let [addressData] = await Location.reverseGeocodeAsync({
        latitude: location.coords.latitude,
        longitude: location.coords.longitude
      });

      if (addressData) {
        setNewAddressLine1([addressData.name, addressData.street].filter(Boolean).join(", "));
        setNewCity(addressData.city || addressData.subregion || "");
        setNewState(addressData.region || "");
        setNewPostalCode(addressData.postalCode || "");
        setNewLandmark(addressData.district || "");
      }
    } catch (error) {
      console.log("Location Error:", error);
      Alert.alert("GPS Error", "Could not fetch your location. Please type manually.");
    } finally {
      setIsLocating(false);
    }
  };

  const handleSaveBtn = async () => {
    if (!newAddressLine1.trim() || !newCity.trim() || !newState.trim() || !newPostalCode.trim()) {
      Alert.alert("Missing Details", "Please fill all required fields: Address, City, State, and Pincode.");
      return;
    }

    if (newPostalCode.trim().length < 6) {
      Alert.alert("Invalid Pincode", "Please enter a valid 6-digit postal code.");
      return;
    }

    if (!jwtToken) {
      Alert.alert("Login Required", "Please login to save addresses.");
      return;
    }
    setIsSaving(true);
    try {
      const payload = {
        addressType: newTag.toUpperCase(),
        addressLine1: newAddressLine1.trim(),
        addressLine2: newAddressLine2.trim(),
        landmark: newLandmark.trim(),
        city: newCity.trim(),
        state: newState.trim(),
        postalCode: newPostalCode.trim(),
        isDefault: editingAddressId ? undefined : (addresses.length === 0),
      };

      let result;
      if (editingAddressId) {
        result = await AddressAPI.updateAddress(jwtToken, editingAddressId, payload);
      } else {
        result = await AddressAPI.addAddress(jwtToken, payload);
      }

      if (result) {
        fetchAddresses();
        resetForm();
        setModalVisible(false);
      } else {
        Alert.alert("Error", "Could not save address. Please try again.");
      }
    } catch (error) {
      console.error("Save address error:", error);
      Alert.alert("Error", "Something went wrong.");
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      {/* Header Setup */}
      <View style={styles.header}>
        <TouchableOpacity style={styles.backBtn} onPress={() => navigation.goBack()}>
          <Ionicons name="arrow-back" size={scale(24)} color="#111827" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Saved Addresses</Text>
        <View style={{ width: scale(40) }} />
      </View>

      <FlatList
        data={addresses}
        keyExtractor={(item) => item.id}
        renderItem={renderAddress}
        contentContainerStyle={{ padding: scale(16), paddingBottom: scale(100) }}
        showsVerticalScrollIndicator={false}
      />

      <View style={[styles.footer, { paddingBottom: Math.max(insets.bottom, scale(20)) }]}>
        <TouchableOpacity onPress={() => setModalVisible(true)} style={styles.addBtn}>
          <Ionicons name="add" size={scale(22)} color="#fff" />
          <Text style={styles.addBtnText}>Add New Address</Text>
        </TouchableOpacity>
      </View>

      {/* --- ADD ADDRESS MODAL --- */}
      <Modal
        visible={isModalVisible}
        animationType="slide"
        presentationStyle="formSheet"
        onRequestClose={() => setModalVisible(false)}
      >
        <KeyboardAvoidingView
          style={{ flex: 1, backgroundColor: "#fff" }}
          behavior={Platform.OS === "ios" ? "padding" : undefined}
        >
          {/* Modal Header */}
          <View style={[styles.modalHeader, { marginTop: Platform.OS === "android" ? insets.top : scale(20) }]}>
             <Text style={styles.modalTitle}>{editingAddressId ? "Edit Address" : "Add New Address"}</Text>
             <TouchableOpacity style={styles.closeBtn} onPress={() => { setModalVisible(false); resetForm(); }}>
                <Ionicons name="close" size={scale(24)} color="#6B7280" />
             </TouchableOpacity>
          </View>

          <ScrollView 
            style={styles.modalBody}
            contentContainerStyle={{ paddingBottom: scale(40) }}
            showsVerticalScrollIndicator={false}
          >
             {/* Use Current Location Button */}
             <TouchableOpacity 
               style={styles.locationBtn} 
               activeOpacity={0.7}
               onPress={handleUseCurrentLocation}
             >
               {isLocating ? (
                 <ActivityIndicator size="small" color="#0A8754" />
               ) : (
                 <Ionicons name="locate" size={scale(20)} color="#0A8754" />
               )}
               <Text style={styles.locationBtnText}>
                 {isLocating ? "Fetching location..." : "Use Current Location"}
               </Text>
             </TouchableOpacity>

             <View style={styles.formBorderDivider} />

             {/* Tag Selector */}
             <Text style={styles.label}>Save delivery address as</Text>
             <View style={styles.tagsContainer}>
                <TouchableOpacity 
                   style={[styles.tagOption, newTag === "home" && styles.tagOptionActive]}
                   onPress={() => setNewTag("home")}
                >
                   <Ionicons name="home" size={scale(16)} color={newTag === "home" ? "#0A8754" : "#6B7280"} />
                   <Text style={[styles.tagOptionText, newTag === "home" && styles.tagOptionTextActive]}>Home</Text>
                </TouchableOpacity>

                <TouchableOpacity 
                   style={[styles.tagOption, newTag === "work" && styles.tagOptionActive]}
                   onPress={() => setNewTag("work")}
                >
                   <Ionicons name="briefcase" size={scale(16)} color={newTag === "work" ? "#0A8754" : "#6B7280"} />
                   <Text style={[styles.tagOptionText, newTag === "work" && styles.tagOptionTextActive]}>Work</Text>
                </TouchableOpacity>

                <TouchableOpacity 
                   style={[styles.tagOption, newTag === "other" && styles.tagOptionActive]}
                   onPress={() => setNewTag("other")}
                >
                   <Ionicons name="location" size={scale(16)} color={newTag === "other" ? "#0A8754" : "#6B7280"} />
                   <Text style={[styles.tagOptionText, newTag === "other" && styles.tagOptionTextActive]}>Other</Text>
                </TouchableOpacity>
             </View>

             <View style={styles.formGroup}>
               <Text style={styles.label}>Address Line 1 *</Text>
               <TextInput 
                 style={styles.input} 
                 placeholder="House No, Building, Street" 
                 placeholderTextColor="#9CA3AF"
                 value={newAddressLine1}
                 onChangeText={setNewAddressLine1}
               />
             </View>

             <View style={styles.formGroup}>
               <Text style={styles.label}>Address Line 2</Text>
               <TextInput 
                 style={styles.input} 
                 placeholder="Area, Colony (optional)" 
                 placeholderTextColor="#9CA3AF"
                 value={newAddressLine2}
                 onChangeText={setNewAddressLine2}
               />
             </View>

             <View style={styles.formGroup}>
               <Text style={styles.label}>Landmark</Text>
               <TextInput 
                 style={styles.input} 
                 placeholder="Near Temple, Mall etc. (optional)" 
                 placeholderTextColor="#9CA3AF"
                 value={newLandmark}
                 onChangeText={setNewLandmark}
               />
             </View>

             <View style={styles.formGroup}>
               <Text style={styles.label}>City *</Text>
               <TextInput 
                 style={styles.input} 
                 placeholder="City" 
                 placeholderTextColor="#9CA3AF"
                 value={newCity}
                 onChangeText={setNewCity}
               />
             </View>

             <View style={styles.formGroup}>
               <Text style={styles.label}>State *</Text>
               <TextInput 
                 style={styles.input} 
                 placeholder="State" 
                 placeholderTextColor="#9CA3AF"
                 value={newState}
                 onChangeText={setNewState}
               />
             </View>

             <View style={styles.formGroup}>
               <Text style={styles.label}>Postal Code *</Text>
               <TextInput 
                 style={styles.input} 
                 placeholder="Pincode" 
                 placeholderTextColor="#9CA3AF"
                 keyboardType="number-pad"
                 maxLength={6}
                 value={newPostalCode}
                 onChangeText={setNewPostalCode}
               />
             </View>
          </ScrollView>

          {/* Modal Footer (Save Btn) */}
          <View style={[styles.modalFooter, { paddingBottom: Math.max(insets.bottom, scale(20)) }]}>
             <TouchableOpacity style={[styles.saveBtn, isSaving && { opacity: 0.6 }]} onPress={handleSaveBtn} disabled={isSaving}>
                {isSaving ? (
                  <ActivityIndicator color="#fff" />
                ) : (
                  <Text style={styles.saveBtnText}>{editingAddressId ? "Update Address" : "Save Address"}</Text>
                )}
             </TouchableOpacity>
          </View>
        </KeyboardAvoidingView>
      </Modal>

    </View>
  );
};

export default SavedAddressScreen;

const styles = StyleSheet.create({
  container: {
    flex: 1, 
    backgroundColor: "#F9FAFB"
  },
  
  /* Header Setup */
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: scale(16),
    paddingVertical: scale(12),
    backgroundColor: "#fff",
    borderBottomWidth: 1,
    borderBottomColor: "#F3F4F6",
  },
  backBtn: {
    width: scale(40), height: scale(40),
    borderRadius: scale(20),
    backgroundColor: "#F3F4F6",
    justifyContent: "center",
    alignItems: "center",
  },
  headerTitle: {
    fontSize: scale(18),
    fontWeight: "700",
    color: "#111827",
  },

  /* Card */
  card: {
    backgroundColor: "#fff",
    borderRadius: scale(16),
    padding: scale(16),
    marginBottom: scale(16),
    shadowColor: "#000",
    shadowOffset: { width: 0, height: scale(2) },
    shadowOpacity: 0.03,
    shadowRadius: scale(6),
    elevation: 2,
    borderWidth: 1,
    borderColor: "#F3F4F6",
  },
  cardDefault: {
    borderColor: "#D1FAE5",
    backgroundColor: "#FAFFFC",
  },
  cardHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: scale(12),
  },
  tagWrap: {
    flexDirection: "row",
    alignItems: "center",
  },
  tagText: {
    fontSize: scale(13),
    fontWeight: "700",
    marginLeft: scale(6),
    letterSpacing: scale(0.5),
    color: "#4B5563",
  },
  nameText: {
    fontSize: scale(16),
    fontWeight: "700",
    color: "#111827",
    marginBottom: scale(6),
  },
  addressText: {
    fontSize: scale(14),
    color: "#6B7280",
    lineHeight: scale(22),
    marginBottom: scale(10),
  },
  phoneText: {
    fontSize: scale(13),
    color: "#4B5563",
    fontWeight: "500",
    marginBottom: scale(16),
  },
  
  actionRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    borderTopWidth: 1,
    borderTopColor: "#F3F4F6",
    paddingTop: scale(14),
  },
  editBtn: {
    paddingHorizontal: scale(20),
    paddingVertical: scale(8),
    borderRadius: scale(8),
    borderWidth: 1,
    borderColor: "#E5E7EB",
  },
  editBtnText: {
    fontSize: scale(13),
    fontWeight: "600",
    color: "#374151",
  },
  defaultBadge: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#ECFDF5",
    paddingHorizontal: scale(10),
    paddingVertical: scale(4),
    borderRadius: scale(8),
  },
  defaultText: {
    fontSize: scale(12),
    fontWeight: "700",
    color: "#0A8754",
    marginLeft: scale(4),
  },

  /* Footer */
  footer: {
    position: "absolute",
    bottom: 0, left: 0, right: 0,
    backgroundColor: "#fff",
    paddingHorizontal: scale(16),
    paddingTop: scale(16),
    borderTopWidth: 1,
    borderTopColor: "#F3F4F6",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: scale(-4) },
    shadowOpacity: 0.05,
    shadowRadius: scale(10),
    elevation: 10,
  },
  addBtn: {
    flexDirection: "row",
    backgroundColor: "#0A8754",
    paddingVertical: scale(16),
    borderRadius: scale(14),
    justifyContent: "center",
    alignItems: "center",
  },
  addBtnText: {
    color: "#fff",
    fontSize: scale(16),
    fontWeight: "700",
    marginLeft: scale(8),
  },

  /* --- MODAL STYLES --- */
  modalHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: scale(20),
    paddingBottom: scale(20),
    borderBottomWidth: 1,
    borderBottomColor: "#F3F4F6",
  },
  modalTitle: {
    fontSize: scale(20),
    fontWeight: "800",
    color: "#111827",
  },
  closeBtn: {
    padding: scale(4),
    backgroundColor: "#F3F4F6",
    borderRadius: scale(16),
  },
  modalBody: {
    flex: 1,
    padding: scale(20),
  },
  /* Specific Button styling for Location */
  locationBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#ECFDF5",
    borderWidth: 1,
    borderColor: "#D1FAE5",
    borderRadius: scale(12),
    paddingVertical: scale(14),
    marginBottom: scale(20),
  },
  locationBtnText: {
    fontSize: scale(15),
    fontWeight: "700",
    color: "#0A8754",
    marginLeft: scale(8),
  },
  formBorderDivider: {
    height: 1,
    backgroundColor: "#F3F4F6",
    marginBottom: scale(20),
  },

  tagsContainer: {
    flexDirection: "row",
    gap: scale(12),
    marginBottom: scale(24),
  },
  tagOption: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: scale(16),
    paddingVertical: scale(10),
    borderRadius: scale(10),
    borderWidth: 1,
    borderColor: "#E5E7EB",
    backgroundColor: "#fff",
  },
  tagOptionActive: {
    borderColor: "#0A8754",
    backgroundColor: "#F2FCEE",
  },
  tagOptionText: {
    fontSize: scale(14),
    fontWeight: "600",
    color: "#6B7280",
    marginLeft: scale(6),
  },
  tagOptionTextActive: {
    color: "#0A8754",
  },
  formGroup: {
    marginBottom: scale(20),
  },
  label: {
    fontSize: scale(14),
    fontWeight: "700",
    color: "#374151",
    marginBottom: scale(8),
  },
  input: {
    backgroundColor: "#F9FAFB",
    borderWidth: 1,
    borderColor: "#E5E7EB",
    borderRadius: scale(12),
    paddingHorizontal: scale(16),
    paddingVertical: scale(14),
    fontSize: scale(15),
    color: "#111827",
  },
  textArea: {
    height: scale(100),
  },
  modalFooter: {
    paddingHorizontal: scale(20),
    paddingTop: scale(16),
    backgroundColor: "#fff",
    borderTopWidth: 1,
    borderTopColor: "#F3F4F6",
  },
  saveBtn: {
    backgroundColor: "#0A8754",
    borderRadius: scale(14),
    paddingVertical: scale(16),
    alignItems: "center",
  },
  saveBtnText: {
    color: "#fff",
    fontSize: scale(16),
    fontWeight: "700",
  },
});