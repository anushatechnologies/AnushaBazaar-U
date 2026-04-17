import React, { createContext, useContext, useState, useEffect } from "react";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useAuth } from "./AuthContext";
import { getWalletBalance, addWalletMoney, spendWalletMoney } from "../services/api/wallet";
import { startRazorpayCheckout, buildRazorpayOptions } from "../services/razorpay";
import { ToastAndroid, Platform, Alert } from "react-native";

export type WalletContextType = {
    balance: number;
    points: number;
    loading: boolean;
    addMoney: (amount: number) => Promise<void>;
    spendMoney: (amount: number, description?: string) => Promise<boolean>;
    addPoints: (amount: number) => Promise<void>;
    spendPoints: (amount: number) => Promise<boolean>;
};

export const WalletContext = createContext<WalletContextType | undefined>(undefined);

const BALANCE_KEY = "@wallet_balance";
const POINTS_KEY = "@wallet_points";

export const WalletProvider = ({ children }: any) => {
    const { jwtToken, user } = useAuth();
    const [balance, setBalance] = useState(0); // Wallet disabled - no balance
    const [points, setPoints] = useState(120); // Default points
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        loadData();
    }, []);

    const fetchLiveBalance = async () => {
        if (!jwtToken) return;
        try {
            if (user?.customerId) {
                const liveBalance = await getWalletBalance(jwtToken, user.customerId);
                if (liveBalance && liveBalance.balance !== undefined) {
                    setBalance(Number(liveBalance.balance));
                    saveData(Number(liveBalance.balance), points);
                }
            }
        } catch (error) {
            console.error("Error fetching live wallet:", error);
        }
    };

    useEffect(() => {
        fetchLiveBalance();
        const interval = setInterval(fetchLiveBalance, 15000);
        return () => clearInterval(interval);
    }, [jwtToken]);

    const loadData = async () => {
        try {
            const savedBalance = await AsyncStorage.getItem(BALANCE_KEY);
            const savedPoints = await AsyncStorage.getItem(POINTS_KEY);
            
            if (savedBalance !== null) setBalance(Number(savedBalance));
            if (savedPoints !== null) setPoints(Number(savedPoints));
        } catch (e) {
            console.error("Error loading wallet data:", e);
        } finally {
            setLoading(false);
        }
    };

    const saveData = async (newBalance: number, newPoints: number) => {
        try {
            await AsyncStorage.multiSet([
                [BALANCE_KEY, newBalance.toString()],
                [POINTS_KEY, newPoints.toString()]
            ]);
        } catch (e) {
            console.error("Error saving wallet data:", e);
        }
    };

    // Enable addMoney via Razorpay
    const addMoney = async (amount: number) => {
        if (!jwtToken || !user) {
            Platform.OS === 'android' ? ToastAndroid.show("Please login to add money", ToastAndroid.SHORT) : Alert.alert("Error", "Please login to add money");
            return;
        }

        try {
            const uniqueId = `wallet_${Date.now()}`;
            const options = buildRazorpayOptions({
                razorpayOrderId: "", // Empty string to let Razorpay create a direct payment if allowed, usually backend order_id is required
                amount: amount * 100, // INR to paise
                receipt: uniqueId,
                userEmail: user?.email || "",
                userPhone: user?.phone || "",
                userName: user?.name || "Customer",
            });

            // Open Razorpay SDK
            const result = await startRazorpayCheckout(options);

            // On success
            if (result.razorpay_payment_id) {
                const success = await addWalletMoney(jwtToken, user.customerId!, amount, `Razorpay Topup: ${result.razorpay_payment_id}`);
                
                if (success) {
                    Platform.OS === 'android' ? ToastAndroid.show("Money added successfully!", ToastAndroid.SHORT) : Alert.alert("Success", "Money added successfully!");
                    await fetchLiveBalance(); // Fetch updated live balance from backend
                } else {
                    Platform.OS === 'android' ? ToastAndroid.show("Payment successful but failed to update wallet on server. Please contact support.", ToastAndroid.LONG) : Alert.alert("Warning", "Payment successful but failed to update wallet on server. Please contact support.");
                }
            }
        } catch (error: any) {
            console.error("Razorpay Add Money Error:", error);
            const msg = error?.description || error?.error?.description || error?.message || "Payment cancelled or failed.";
            Platform.OS === 'android' ? ToastAndroid.show(msg, ToastAndroid.SHORT) : Alert.alert("Payment Info", msg);
        }
    };

    const spendMoney = async (amount: number, description: string = "Payment for Order"): Promise<boolean> => {
        if (!jwtToken || !user) return false;
        if (balance < amount) {
          Platform.OS === 'android' ? ToastAndroid.show("Insufficient wallet balance", ToastAndroid.SHORT) : Alert.alert("Error", "Insufficient wallet balance");
          return false;
        }

        try {
          const success = await spendWalletMoney(jwtToken, user.customerId!, amount, description);
          if (success) {
            await fetchLiveBalance(); // Sync with server
            return true;
          }
          return false;
        } catch (error) {
          console.error("Wallet spend error:", error);
          return false;
        }
    };

    const addPoints = async (amount: number) => {
        const newPoints = points + amount;
        setPoints(newPoints);
        await saveData(balance, newPoints);
    };

    const spendPoints = async (amount: number): Promise<boolean> => {
        if (points < amount) return false;
        const newPoints = points - amount;
        setPoints(newPoints);
        await saveData(balance, newPoints);
        return true;
    };

    return (
        <WalletContext.Provider value={{ balance, points, loading, addMoney, spendMoney, addPoints, spendPoints }}>
            {children}
        </WalletContext.Provider>
    );
};

export const useWallet = () => {
    const context = useContext(WalletContext);
    if (!context) throw new Error("useWallet must be used inside WalletProvider");
    return context;
};
