import { useState, useEffect, useRef, useCallback } from "react";
import * as Location from "expo-location";
import { Alert, Animated } from "react-native";
import { Region } from "react-native-maps";

const STORE_LOCATION = {
  latitude: 17.48995,
  longitude: 78.393127,
};

export const useMapLocation = () => {
  const mapRef = useRef<any>(null);
  const pinAnim = useRef(new Animated.Value(0)).current;
  const debounceRef = useRef<NodeJS.Timeout | null>(null);

  const [region, setRegion] = useState<Region | null>(null);
  const [address, setAddress] = useState("");
  const [eta, setEta] = useState<number | null>(null);
  const [loading, setLoading] = useState(true);

  // Calculate ETA based on distance from store
  const calculateETA = useCallback((coords: Region) => {
    // Basic Haversine approximation
    const R = 6371; // km
    const dLat = (coords.latitude - STORE_LOCATION.latitude) * Math.PI / 180;
    const dLon = (coords.longitude - STORE_LOCATION.longitude) * Math.PI / 180;
    const a = Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos(STORE_LOCATION.latitude * Math.PI / 180) * Math.cos(coords.latitude * Math.PI / 180) *
      Math.sin(dLon / 2) * Math.sin(dLon / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    const distance = R * c;

    // ETA Rule: 10 mins base + 2-3 mins per km
    const estimatedTime = Math.max(10, Math.round(10 + distance * 2.5));
    setEta(estimatedTime);
  }, []);

  // Update address and ETA from coordinates
  const updateAddressAndETA = useCallback(async (coords: Region) => {
    try {
      const result = await Location.reverseGeocodeAsync(coords);

      if (result.length > 0) {
        const d = result[0];
        const fullAddress = [
          d.name,
          d.street,
          d.city,
          d.region,
        ]
          .filter(Boolean)
          .join(", ");

        setAddress(fullAddress);
      }
      calculateETA(coords);
    } catch {
      setAddress("Address not found");
    } finally {
      setLoading(false);
    }
  }, [calculateETA]);

  // Get current user location
  const getCurrentLocation = useCallback(async () => {
    try {
      setLoading(true);
      const { status } = await Location.requestForegroundPermissionsAsync();

      if (status !== "granted") {
        Alert.alert("Permission denied", "We need location permission to find you on the map.");
        setLoading(false);
        return;
      }

      const loc = await Location.getCurrentPositionAsync({
        accuracy: Location.Accuracy.High,
      });

      const newRegion: Region = {
        latitude: loc.coords.latitude,
        longitude: loc.coords.longitude,
        latitudeDelta: 0.01,
        longitudeDelta: 0.01,
      };

      mapRef.current?.animateToRegion(newRegion, 600);
      setRegion(newRegion);
      updateAddressAndETA(newRegion);
    } catch (error) {
      Alert.alert("Error", "Unable to fetch location. Please try again.");
      setLoading(false);
    }
  }, [updateAddressAndETA]);

  // Handle map movement finish
  const onRegionChangeComplete = useCallback((newRegion: Region) => {
    setRegion(newRegion);

    // Pin drop animation
    Animated.sequence([
      Animated.timing(pinAnim, {
        toValue: -12,
        duration: 120,
        useNativeDriver: true,
      }),
      Animated.timing(pinAnim, {
        toValue: 0,
        duration: 120,
        useNativeDriver: true,
      }),
    ]).start();

    // Debounce address update to avoid excessive API calls
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => {
      updateAddressAndETA(newRegion);
    }, 500);
  }, [pinAnim, updateAddressAndETA]);

  useEffect(() => {
    getCurrentLocation();
    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
    };
  }, [getCurrentLocation]);

  // Programmatically move map to specific coordinates (e.g. from search)
  const moveToLocation = useCallback((lat: number, lon: number) => {
    const newRegion: Region = {
      latitude: lat,
      longitude: lon,
      latitudeDelta: 0.005,
      longitudeDelta: 0.005,
    };
    mapRef.current?.animateToRegion(newRegion, 1000);
    setRegion(newRegion);
    updateAddressAndETA(newRegion);
  }, [updateAddressAndETA]);

  return {
    region,
    address,
    eta,
    loading,
    mapRef,
    pinAnim,
    getCurrentLocation,
    moveToLocation,
    onRegionChangeComplete,
  };
};
