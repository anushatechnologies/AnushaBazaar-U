import React, { createContext, useContext, useState, useEffect } from "react";
import auth from "@react-native-firebase/auth";
import AsyncStorage from "@react-native-async-storage/async-storage";

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
  login: (user: UserType, token: string) => void;
  logout: () => void;
};

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider = ({ children }: any) => {
  const [user, setUser] = useState<UserType | null>(null);
  const [jwtToken, setJwtToken] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  // Load from AsyncStorage explicitly on mount
  useEffect(() => {
    const checkPersistentSession = async () => {
      try {
        const storedUser = await AsyncStorage.getItem("@Anusha:UserProfile");
        const storedToken = await AsyncStorage.getItem("@Anusha:jwtToken");
        if (storedUser) {
          setUser(JSON.parse(storedUser));
        }
        if (storedToken) {
          setJwtToken(storedToken);
        }
      } catch (error) {
        console.log("AsyncStorage error reading session:", error);
      } finally {
        setLoading(false);
      }
    };

    checkPersistentSession();

    // Firebase Auth State Observer
    const unsubscribe = auth().onAuthStateChanged(async (firebaseUser) => {
      if (firebaseUser) {
        // We defer to whatever was passed through `login()` since Firebase doesn't always have `displayName`,
        // but if they re-open the app, AsyncStorage handles the main state load above.
        // We only use this listener to keep Firebase tokens alive.
      } else {
        // Only explicitly set user to null if Firebase says we are signed out
        // AND we want to sync the states.
      }
    });

    return unsubscribe;
  }, []);

  const login = async (userData: UserType, token: string) => {
    try {
      await AsyncStorage.setItem("@Anusha:UserProfile", JSON.stringify(userData));
      await AsyncStorage.setItem("@Anusha:jwtToken", token);
      setUser(userData);
      setJwtToken(token);
    } catch(e) {
      console.error("Error saving user session", e);
    }
  };

  const logout = async () => {
    try {
      await auth().signOut();
      await AsyncStorage.removeItem("@Anusha:UserProfile");
      await AsyncStorage.removeItem("@Anusha:jwtToken");
    } catch (error) {
      console.log("Logout error:", error);
    }
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