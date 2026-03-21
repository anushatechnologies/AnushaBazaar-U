// Wallet State Management Context
import React, { createContext, useContext, useState, useEffect } from "react";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useAuth } from "./AuthContext";
import { getProfile } from "../services/api/profile";

export type WalletContextType = {
    balance: number;
    points: number;
    loading: boolean;
    addMoney: (amount: number) => Promise<void>;
    spendMoney: (amount: number) => Promise<boolean>;
    addPoints: (amount: number) => Promise<void>;
    spendPoints: (amount: number) => Promise<boolean>;
};

export const WalletContext = createContext<WalletContextType | undefined>(undefined);

const BALANCE_KEY = "@wallet_balance";
const POINTS_KEY = "@wallet_points";

export const WalletProvider = ({ children }: any) => {
    const { jwtToken } = useAuth();
    const [balance, setBalance] = useState(0); // Wallet disabled - no balance
    const [points, setPoints] = useState(120); // Default points
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        loadData();
    }, []);

    const fetchLiveBalance = async () => {
        if (!jwtToken) return;
        try {
            const profile = await getProfile(jwtToken);
            if (profile) {
                // If backend returns wallet info, use it. Otherwise, rely on local state.
                const liveBalance = profile.walletBalance ?? profile.balance ?? profile.wallet;
                if (liveBalance !== undefined && liveBalance !== null) {
                    setBalance(Number(liveBalance));
                    saveData(Number(liveBalance), points);
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

    // DISABLED: Online payments not yet integrated
    const addMoney = async (amount: number) => {
        // Wallet top-up is disabled until payment gateway is integrated
        console.log("[Wallet] addMoney disabled - no payment gateway");
    };

    // DISABLED: Cannot spend wallet money
    const spendMoney = async (amount: number): Promise<boolean> => {
        // Wallet spending is disabled
        return false;
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
