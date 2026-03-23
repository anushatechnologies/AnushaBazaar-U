import React, { useRef } from "react";
import { View, StyleSheet, TouchableOpacity, Text, ActivityIndicator, StatusBar, Keyboard, Dimensions } from "react-native";
import MapView, { Marker } from "react-native-maps";
import { Ionicons } from "@expo/vector-icons";
import { useNavigation } from "@react-navigation/native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useLocation } from "../context/LocationContext";
import { GooglePlacesAutocomplete } from "react-native-google-places-autocomplete";

// Hooks & Components
import { useMapLocation } from "../hooks/useMapLocation";
import MapPin from "../components/map/MapPin";
import GpsButton from "../components/map/GpsButton";
import MapBottomCard from "../components/map/MapBottomCard";

const { width } = Dimensions.get("window");
const GOOGLE_MAPS_APIKEY = "AIzaSyChxzqLaLTuN5cV1LV92yF6tRPh8ZV7FeI";

const DARK_MAP_STYLE = [
  { elementType: "geometry", stylers: [{ color: "#1d2c4d" }] },
  { elementType: "labels.text.fill", stylers: [{ color: "#8ec3b9" }] },
  { elementType: "labels.text.stroke", stylers: [{ color: "#1a3646" }] },
  { featureType: "road", elementType: "geometry", stylers: [{ color: "#304a7d" }] },
  { featureType: "road", elementType: "labels.text.fill", stylers: [{ color: "#98a5be" }] },
];

const SelectLocationScreen = () => {
  const navigation = useNavigation<any>();
  const { setLocation } = useLocation();
  const insets = useSafeAreaInsets();
  const searchRef = useRef<any>(null);

  const {
    region,
    address,
    eta,
    loading,
    initialLoading,
    mapRef,
    pinAnim,
    getCurrentLocation,
    moveToLocation,
    onRegionChangeComplete,
  } = useMapLocation();

  const storeCoords = { latitude: 17.48995, longitude: 78.393127 };

  const handleConfirm = () => {
    if (!region) return;
    setLocation({
      latitude: region.latitude,
      longitude: region.longitude,
      address,
    });
    navigation.goBack();
  };

  if (initialLoading || !region) {
    return (
      <View style={styles.loader}>
        <ActivityIndicator size="large" color="#0A8754" />
        <Text style={styles.loaderText}>Setting up map...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <StatusBar barStyle="dark-content" />
      <MapView
        ref={mapRef}
        style={styles.map}
        initialRegion={region}
        customMapStyle={DARK_MAP_STYLE}
        onRegionChangeComplete={onRegionChangeComplete}
        showsUserLocation
        showsMyLocationButton={false}
      >
        <Marker 
          coordinate={storeCoords}
          title="Anusha Bazaar Store"
          description="Manjeera Trinity Corporate"
        >
          <View style={styles.storeMarker}>
            <Ionicons name="storefront" size={18} color="#fff" />
          </View>
        </Marker>
      </MapView>

      <MapPin pinAnim={pinAnim} />

      {/* Floating Header with Search */}
      <View style={[styles.headerContainer, { top: insets.top + 10 }]}>
        <View style={styles.topRow}>
          <TouchableOpacity
            style={styles.backBtn}
            onPress={() => navigation.goBack()}
          >
            <Ionicons name="arrow-back" size={24} color="#111" />
          </TouchableOpacity>
          {loading && (
            <View style={styles.inlineLoader}>
              <ActivityIndicator size="small" color="#0A8754" />
            </View>
          )}
        </View>

        <View style={styles.searchWrapper}>
          <View style={styles.searchBarContainer}>
            <View style={styles.searchIconBoxInner}>
              <Ionicons name="search" size={20} color="#0A8754" />
            </View>
            <GooglePlacesAutocomplete
              ref={searchRef}
              placeholder="Search for area, street, or building..."
              onPress={(data, details = null) => {
                if (details?.geometry?.location) {
                  const { lat, lng } = details.geometry.location;
                  moveToLocation(lat, lng);
                  Keyboard.dismiss();
                }
              }}
              query={{
                key:GOOGLE_MAPS_APIKEY ,
                language: "en",
                components: "country:in",
              }}
              fetchDetails={true}
              renderRow={(data) => (
                <View style={styles.resultRowContainer}>
                  <View style={styles.resultIconBox}>
                    <Ionicons name="location-sharp" size={18} color="#64748B" />
                  </View>
                  <View style={styles.resultTextBox}>
                    <Text style={styles.resultMainText}>{data.structured_formatting?.main_text || data.description}</Text>
                    <Text style={styles.resultSubText} numberOfLines={1}>{data.structured_formatting?.secondary_text || ""}</Text>
                  </View>
                </View>
              )}
              textInputProps={{
                placeholderTextColor: "#9CA3AF",
                clearButtonMode: "while-editing",
                style: styles.searchInputInner,
              }}
              onFail={(error) => console.error("GooglePlacesAutocomplete Error: ", error)}
              styles={{
                container: styles.searchContainer,
                listView: styles.resultsList,
                row: styles.resultRow,
                separator: { height: 0 },
              }}
              enablePoweredByContainer={false}
            />
          </View>
        </View>
      </View>

      <View style={[styles.gpsWrapper, { bottom: 335 + insets.bottom }]}>
        <GpsButton onPress={() => getCurrentLocation(false)} />
      </View>

      <MapBottomCard
        address={address}
        eta={eta}
        onConfirm={handleConfirm}
        insetsBottom={insets.bottom}
      />
    </View>
  );
};

export default SelectLocationScreen;

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#fff" },
  map: { flex: 1 },
  headerContainer: {
    position: "absolute",
    left: 16,
    right: 16,
    zIndex: 100,
  },
  topRow: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 12,
  },
  backBtn: {
    backgroundColor: "#fff",
    width: 44,
    height: 44,
    borderRadius: 22,
    justifyContent: "center",
    alignItems: "center",
    elevation: 8,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 10,
  },
  searchWrapper: {
    width: "100%",
  },
  searchBarContainer: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#fff",
    borderRadius: 16,
    elevation: 8,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 12,
  },
  searchIconBoxInner: {
    paddingLeft: 16,
    paddingRight: 8,
    justifyContent: "center",
  },
  searchContainer: {
    flex: 1,
    zIndex: 1000,
  },
  searchInputInner: {
    height: 52,
    fontSize: 15,
    fontWeight: "600",
    color: "#111",
    backgroundColor: "transparent",
    paddingRight: 16,
    flex: 1,
  },
  resultsList: {
    backgroundColor: "#fff",
    marginTop: 8,
    borderRadius: 16,
    elevation: 12,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.2,
    shadowRadius: 15,
    maxHeight: 300,
    position: "absolute",
    top: 52, // Height of the search bar
    left: 0,
    right: 0,
  },
  resultRow: {
    backgroundColor: "#fff",
    paddingVertical: 12,
  },
  resultRowContainer: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 16,
  },
  resultIconBox: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: "#F1F5F9",
    justifyContent: "center",
    alignItems: "center",
    marginRight: 12,
  },
  resultTextBox: {
    flex: 1,
  },
  resultMainText: {
    fontSize: 15,
    fontWeight: "700",
    color: "#1E293B",
  },
  resultSubText: {
    fontSize: 13,
    color: "#64748B",
    marginTop: 2,
  },
  gpsWrapper: {
    position: "absolute",
    right: 20,
    zIndex: 5,
  },
  loader: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#fff",
  },
  loaderText: {
    marginTop: 16,
    fontSize: 14,
    color: "#666",
    fontWeight: "600",
  },
  storeMarker: {
    backgroundColor: "#0A8754",
    width: 38,
    height: 38,
    borderRadius: 19,
    justifyContent: "center",
    alignItems: "center",
    borderWidth: 3,
    borderColor: "#fff",
    elevation: 10,
    shadowColor: "#000",
    shadowOpacity: 0.3,
    shadowRadius: 5,
  },
  inlineLoader: {
    backgroundColor: "#fff",
    width: 36,
    height: 36,
    borderRadius: 18,
    justifyContent: "center",
    alignItems: "center",
    marginLeft: 12,
    elevation: 4,
    shadowColor: "#000",
    shadowOpacity: 0.1,
    shadowRadius: 5,
  },
});