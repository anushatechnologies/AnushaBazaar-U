import React, { createContext, useContext, useState, useEffect } from "react";
import auth from "@react-native-firebase/auth";
import * as SecureStore from "expo-secure-store";
import AsyncStorage from "@react-native-async-storage/async-storage";
import {
  ACCESS_TOKEN_KEY,
  REFRESH_TOKEN_KEY,
  USER_PROFILE_KEY,
  saveTokens,
  logoutCustomerSession,
  onTokenUpdate,
  onSessionExpired,
  clearCachedTokens,
} from "../services/authSession";

type UserType = {
  name: string;
  phone: string;
  email?: string;
  customerId?: number | string;
};

type AuthContextType = {
  user: UserType | null;
  jwtToken: string | null;
  loading: boolean;
  login: (user: UserType, token: string, refreshToken?: string) => void;
  logout: () => void;
};

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider = ({ children }: any) => {
  const [user, setUser] = useState<UserType | null>(null);
  const [jwtToken, setJwtToken] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  // Load from SecureStore explicitly on mount
  useEffect(() => {
    const checkPersistentSession = async () => {
      try {
        // Reset in-memory cache so we read fresh from disk
        clearCachedTokens();

        const storedUser = await SecureStore.getItemAsync(USER_PROFILE_KEY);
        const storedToken = await SecureStore.getItemAsync(ACCESS_TOKEN_KEY);
        
        // Backwards compatibility migration from AsyncStorage
        if (!storedUser || !storedToken) {
          const oldUser = await AsyncStorage.getItem("@Anusha:UserProfile");
          const oldToken = await AsyncStorage.getItem("@Anusha:jwtToken");
          
          if (oldUser && oldToken) {
            await SecureStore.setItemAsync(USER_PROFILE_KEY, oldUser);
            await SecureStore.setItemAsync(ACCESS_TOKEN_KEY, oldToken);
            setUser(JSON.parse(oldUser));
            setJwtToken(oldToken);
            
            await AsyncStorage.removeItem("@Anusha:UserProfile");
            await AsyncStorage.removeItem("@Anusha:jwtToken");
            return;
          }
        }
        
        if (storedUser) {
          setUser(JSON.parse(storedUser));
        }
        if (storedToken) {
          setJwtToken(storedToken);
        }
      } catch (error) {
        console.log("SecureStore error reading session:", error);
      } finally {
        setLoading(false);
      }
    };

    checkPersistentSession();

    // Firebase Auth State Observer
    const unsubscribe = auth().onAuthStateChanged(async (firebaseUser) => {
      if (firebaseUser) {
        // We defer to whatever was passed through `login()` since Firebase doesn't always have `displayName`,
        // but if they re-open the app, SecureStore handles the main state load above.
        // We only use this listener to keep Firebase tokens alive.
      } else {
        // Only explicitly set user to null if Firebase says we are signed out
      }
    });

    return unsubscribe;
  }, []);

  // Subscribe to token updates from authSession (e.g. after silent refresh)
  useEffect(() => {
    const unsubToken = onTokenUpdate((newToken) => {
      setJwtToken(newToken);
    });

    return unsubToken;
  }, []);

  // Subscribe to session-expired events (e.g. refresh token failed)
  useEffect(() => {
    const unsubExpired = onSessionExpired(() => {
      console.warn("[AuthContext] Session expired — clearing user state.");
      setUser(null);
      setJwtToken(null);
    });

    return unsubExpired;
  }, []);

  const login = async (userData: UserType, token: string, refreshToken?: string) => {
    try {
      await SecureStore.setItemAsync(USER_PROFILE_KEY, JSON.stringify(userData));
      // Save both accessToken and refreshToken
      await saveTokens(token, refreshToken);
      setUser(userData);
      setJwtToken(token);
    } catch (e) {
      console.error("Error saving user session", e);
    }
  };

  const logout = async () => {
    try {
      await auth().signOut();
    } catch (error) {
      console.log("Firebase signOut error:", error);
    }
    // Use authSession logout — calls backend + clears SecureStore
    await logoutCustomerSession();
    setUser(null);
    setJwtToken(null);
  };

  return (
    <AuthContext.Provider value={{ user, jwtToken, loading, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) throw new Error("useAuth must be used inside AuthProvider");
  return context;
};
