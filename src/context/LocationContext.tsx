import React, { createContext, useState, useContext, useEffect } from "react";
import AsyncStorage from "@react-native-async-storage/async-storage";

interface LocationData {
  latitude: number;
  longitude: number;
  address: string;
}

interface LocationContextType {
  location: LocationData | null;
  setLocation: (data: LocationData) => void;
}

const LocationContext = createContext<LocationContextType | undefined>(undefined);

export const LocationProvider = ({ children }: { children: React.ReactNode }) => {

  const [location, setLocationState] = useState<LocationData | null>(null);

  useEffect(() => {
    loadSavedLocation();
  }, []);

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
    <LocationContext.Provider value={{ location, setLocation }}>
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