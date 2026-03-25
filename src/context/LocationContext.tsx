import React, { createContext, useState, useContext, useEffect } from "react";
import AsyncStorage from "@react-native-async-storage/async-storage";
import * as Location from 'expo-location';

interface LocationData {
  latitude: number;
  longitude: number;
  address: string;
}

interface LocationContextType {
  location: LocationData | null;
  setLocation: (data: LocationData) => void;
  hasPermission: boolean | null;
  checkPermission: () => Promise<boolean>;
  isDetecting: boolean;
}

const LocationContext = createContext<LocationContextType | undefined>(undefined);

export const LocationProvider = ({ children }: { children: React.ReactNode }) => {

  const [location, setLocationState] = useState<LocationData | null>(null);
  const [hasPermission, setHasPermission] = useState<boolean | null>(null);
  const [isDetecting, setIsDetecting] = useState(false);

  useEffect(() => {
    loadSavedLocation();
    checkPermission();
  }, []);

  const checkPermission = async () => {
    try {
      const { status } = await Location.requestForegroundPermissionsAsync();
      const granted = status === 'granted';
      setHasPermission(granted);
      
      if (granted) {
        setIsDetecting(true);
        const saved = await AsyncStorage.getItem("user_location");
        if (!saved) {
          getCurrentLocation();
        } else {
          setIsDetecting(false);
        }
      }
      return granted;
    } catch (error) {
      console.log("Permission check error", error);
      setHasPermission(false);
      return false;
    }
  };

  const getCurrentLocation = async () => {
    setIsDetecting(true);
    try {
      const pos = await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.Balanced });
      const [addr] = await Location.reverseGeocodeAsync({
        latitude: pos.coords.latitude,
        longitude: pos.coords.longitude
      });

      if (addr) {
        const addressStr = `${addr.name || ""}, ${addr.street || ""}, ${addr.city || ""}`.replace(/^, |, $/g, "");
        const newLoc = {
          latitude: pos.coords.latitude,
          longitude: pos.coords.longitude,
          address: addressStr || "Current Location"
        };
        setLocation(newLoc);
      }
    } catch (error) {
      console.log("Auto-detect error", error);
    } finally {
      setIsDetecting(false);
    }
  };

  const loadSavedLocation = async () => {
    try {
      const saved = await AsyncStorage.getItem("user_location");

      if (saved) {
        setLocationState(JSON.parse(saved));
      }
    } catch (error) {
      console.log("Location load error", error);
    }
  };

  const setLocation = async (data: LocationData) => {
    try {
      setLocationState(data);
      await AsyncStorage.setItem("user_location", JSON.stringify(data));
    } catch (error) {
      console.log("Location save error", error);
    }
  };

  return (
    <LocationContext.Provider value={{ location, setLocation, hasPermission, checkPermission, isDetecting }}>
      {children}
    </LocationContext.Provider>
  );
};

export const useLocation = () => {

  const context = useContext(LocationContext);

  if (!context) {
    throw new Error("useLocation must be used inside LocationProvider");
  }

  return context;
};