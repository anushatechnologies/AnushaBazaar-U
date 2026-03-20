import React, { useEffect, useRef } from "react";
import {
    View,
    Text,
    StyleSheet,
    Pressable,
    Animated,
    Dimensions
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { useNavigation } from "@react-navigation/native";
import { useCart } from "../context/CartContext";
import { LinearGradient } from "expo-linear-gradient";

const { width } = Dimensions.get("window");

const FloatingCart = ({ currentRoute }: { currentRoute?: string }) => {
    const navigation = useNavigation<any>();
    const { cart } = useCart();
    const insets = useSafeAreaInsets();

    const slideAnim = useRef(new Animated.Value(150)).current;
    const pulseAnim = useRef(new Animated.Value(1)).current;

    // Screens that have bottom tab bar
    const tabScreens = ["Home", "Categories", "Trending", "Order Again"];
    const isTabScreen = currentRoute ? tabScreens.includes(currentRoute) : true;
    const bottomOffset = isTabScreen ? 65 : 0; // 60 (tab bar) + 5 padding

    const totalItems = cart.reduce((sum, item) => sum + item.quantity, 0);
    const totalPrice = cart.reduce((sum, item) => sum + item.price * item.quantity, 0);

    useEffect(() => {
        // Hide on Cart screen or if empty
        if (totalItems > 0 && currentRoute !== "Cart" && currentRoute !== "Checkout") {
            Animated.spring(slideAnim, {
                toValue: 0,
                tension: 50,
                friction: 8,
                useNativeDriver: true,
            }).start();
            
            // Start subtle pulsing animation
            Animated.loop(
                Animated.sequence([
                    Animated.timing(pulseAnim, { toValue: 1.05, duration: 1500, useNativeDriver: true }),
                    Animated.timing(pulseAnim, { toValue: 1, duration: 1500, useNativeDriver: true })
                ])
            ).start();
        } else {
            Animated.spring(slideAnim, {
                toValue: 150,
                tension: 50,
                friction: 8,
                useNativeDriver: true,
            }).start();
        }
    }, [totalItems, currentRoute]);

    if (totalItems === 0) return null;

    return (
        <Animated.View
            pointerEvents="box-none"
            style={[
                styles.container,
                { transform: [{ translateY: slideAnim }] }
            ]}
        >
            <Pressable
                style={[
                    styles.cartContainer,
                    { marginBottom: Math.max(insets.bottom, 15) + bottomOffset }
                ]}
                onPress={() => navigation.navigate("Cart")}
            >
                <LinearGradient
                    colors={["#10B981", "#047A55"]}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 1 }}
                    style={styles.cartGradient}
                >
                    <View style={styles.left}>
                        <Animated.View style={[styles.iconCircle, { transform: [{ scale: pulseAnim }] }]}>
                            <Ionicons name="cart" size={20} color="#047A55" />
                            <View style={styles.badge}>
                                <Text style={styles.badgeText}>{totalItems}</Text>
                            </View>
                        </Animated.View>
                        <View style={styles.textColumn}>
                            <Text style={styles.priceText}>
                                ₹{totalPrice.toLocaleString()}
                            </Text>
                            <Text style={styles.itemsText}>
                                {totalItems} {totalItems === 1 ? "Item" : "Items"}
                            </Text>
                        </View>
                    </View>

                    <View style={styles.right}>
                        <Text style={styles.viewCart}>View Cart</Text>
                        <View style={styles.arrowCircle}>
                            <Ionicons name="chevron-forward" size={16} color="#047A55" />
                        </View>
                    </View>
                </LinearGradient>
            </Pressable>
        </Animated.View>
    );
};

export default FloatingCart;

const styles = StyleSheet.create({
    container: {
        position: "absolute",
        bottom: 0,
        left: 0,
        right: 0,
        alignItems: "center",
        zIndex: 9999,
    },
    cartContainer: {
        width: width * 0.9,
        shadowColor: "#059669",
        shadowOffset: { width: 0, height: 12 },
        shadowOpacity: 0.4,
        shadowRadius: 20,
        elevation: 14,
    },
    cartGradient: {
        height: 64,
        paddingLeft: 10,
        paddingRight: 10,
        borderRadius: 35,
        flexDirection: "row",
        justifyContent: "space-between",
        alignItems: "center",
        borderWidth: 1,
        borderColor: "rgba(255,255,255,0.15)",
    },
    left: {
        flexDirection: "row",
        alignItems: "center",
    },
    iconCircle: {
        width: 44,
        height: 44,
        borderRadius: 22,
        backgroundColor: "#fff",
        justifyContent: "center",
        alignItems: "center",
        marginRight: 12,
        position: "relative",
    },
    badge: {
        position: "absolute",
        top: -2,
        right: -4,
        backgroundColor: "#F59E0B",
        minWidth: 18,
        height: 18,
        borderRadius: 9,
        justifyContent: "center",
        alignItems: "center",
        paddingHorizontal: 4,
        borderWidth: 2,
        borderColor: "#fff",
    },
    badgeText: {
        color: "#fff",
        fontSize: 10,
        fontWeight: "900",
    },
    textColumn: {
        justifyContent: "center",
    },
    priceText: {
        color: "#fff",
        fontWeight: "900",
        fontSize: 17,
        letterSpacing: 0.5,
    },
    itemsText: {
        color: "rgba(255,255,255,0.8)",
        fontWeight: "600",
        fontSize: 11,
        marginTop: 1,
    },
    right: {
        flexDirection: "row",
        alignItems: "center",
        backgroundColor: "rgba(255,255,255,0.15)",
        paddingVertical: 6,
        paddingLeft: 14,
        paddingRight: 6,
        borderRadius: 30,
    },
    viewCart: {
        color: "#fff",
        fontWeight: "800",
        fontSize: 13,
        marginRight: 8,
        letterSpacing: 0.3,
    },
    arrowCircle: {
        width: 28,
        height: 28,
        borderRadius: 14,
        backgroundColor: "#fff",
        justifyContent: "center",
        alignItems: "center",
    }
});