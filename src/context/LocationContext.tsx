import React, { createContext, useState, useContext, useEffect, useRef } from "react";
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

// Helper: Haversine distance formula to calculate displacement in meters
const getDistanceFromLatLonInMeters = (lat1: number, lon1: number, lat2: number, lon2: number) => {
  const R = 6371e3; // Radius of the earth in meters
  const dLat = (lat2 - lat1) * (Math.PI / 180);
  const dLon = (lon2 - lon1) * (Math.PI / 180);
  const a = 
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(lat1 * (Math.PI / 180)) * Math.cos(lat2 * (Math.PI / 180)) * 
    Math.sin(dLon / 2) * Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a)); 
  return R * c; 
};

export const LocationProvider = ({ children }: { children: React.ReactNode }) => {

  const [location, setLocationState] = useState<LocationData | null>(null);
  const [hasPermission, setHasPermission] = useState<boolean | null>(null);
  const [isDetecting, setIsDetecting] = useState(false);
  
  // Retain subscription reference globally to sever connection on unmount
  const locationSub = useRef<Location.LocationSubscription | null>(null);
  
  // Track last successfully geocoded coordinates to throttle expensive reverseGeocode API
  const lastGeocodedCoords = useRef<{latitude: number, longitude: number} | null>(null);

  useEffect(() => {
    loadSavedLocation();
    checkPermission();

    return () => {
      // Disconnect hardware GPS hook immediately unmount to prevent massive leaks
      if (locationSub.current) {
        locationSub.current.remove();
      }
    };
  }, []);

  const checkPermission = async () => {
    try {
      const { status } = await Location.requestForegroundPermissionsAsync();
      const granted = status === 'granted';
      setHasPermission(granted);
      
      if (granted) {
        const saved = await AsyncStorage.getItem("user_location");
        if (saved) {
           const parsed = JSON.parse(saved);
           lastGeocodedCoords.current = { latitude: parsed.latitude, longitude: parsed.longitude };
        }
        startLocationTracking();
      } else {
        setIsDetecting(false);
      }
      return granted;
    } catch (error) {
      console.log("Permission check error", error);
      setHasPermission(false);
      setIsDetecting(false);
      return false;
    }
  };

  const startLocationTracking = async () => {
    setIsDetecting(true);
    try {
      // Ensure no phantom listeners exist before creating new listener map
      if (locationSub.current) {
        locationSub.current.remove();
      }

      locationSub.current = await Location.watchPositionAsync(
        {
          accuracy: Location.Accuracy.Balanced,
          timeInterval: 30000,   // Aggressively restrict updates to max 1 per 30 seconds
          distanceInterval: 100, // Trigger OS level API check only if GPS jumps 100 meters
        },
        async (position) => {
          const newLat = position.coords.latitude;
          const newLon = position.coords.longitude;
          
          let shouldGeocode = true;
          
          // Extra logical throttle layer: check Haversine distance physically inside JS layer
          if (lastGeocodedCoords.current) {
             const dist = getDistanceFromLatLonInMeters(
               lastGeocodedCoords.current.latitude,
               lastGeocodedCoords.current.longitude,
               newLat,
               newLon
             );
             if (dist < 100) {
               shouldGeocode = false; // Too close to previous geocoded area; ignoring.
             }
          }

          if (shouldGeocode) {
            try {
              const [addr] = await Location.reverseGeocodeAsync({
                latitude: newLat,
                longitude: newLon
              });

              if (addr) {
                // Extract clean, robust readable string excluding phantom values
                const addressParts = [
                  addr.name,
                  addr.street,
                  addr.subregion,
                  addr.city
                ].filter(part => part && part !== 'Unnamed Road' && part !== 'null');
                
                // Set prevents duplicate strings merging into ugly labels (e.g. "Main St, Main St, Area")
                const uniqueParts = [...new Set(addressParts)];
                const addressStr = uniqueParts.join(", ");

                const newLoc = {
                  latitude: newLat,
                  longitude: newLon,
                  address: addressStr || "Current Location"
                };
                
                setLocation(newLoc);
                lastGeocodedCoords.current = { latitude: newLat, longitude: newLon };
              }
            } catch (geocodeError) {
              console.log("Reverse geocode error", geocodeError);
            }
          }
          
          setIsDetecting(false); // Conclude initial blocking fetch cycle
        }
      );
    } catch (error) {
      console.log("Auto-detect GPS watcher error", error);
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
      // Hook triggers automatically in Context consumers
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
