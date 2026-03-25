import React, { useEffect, useRef } from "react";
import {
    View,
    Text,
    StyleSheet,
    Pressable,
    Animated,
    Dimensions,
    Image,
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

    // Get last 3 unique items for thumbnails
    const thumbnails = cart.slice(-3).reverse();

    useEffect(() => {
        // Hide on Cart screen or if empty
        if (totalItems > 0 && currentRoute !== "Cart" && currentRoute !== "Checkout") {
            Animated.spring(slideAnim, {
                toValue: 0,
                tension: 50,
                friction: 8,
                useNativeDriver: true,
            }).start();
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
                    colors={["#0C831F", "#0B6E1A"]}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 0 }}
                    style={styles.cartGradient}
                >
                    <View style={styles.left}>
                        {/* Thumbnails stack */}
                        <View style={styles.thumbStack}>
                            {thumbnails.map((item, idx) => {
                                const img = item.imageUrl || item.image;
                                const source = typeof img === "string" ? { uri: img } : img;
                                return (
                                    <View 
                                        key={item.id} 
                                        style={[
                                            styles.thumbCircle, 
                                            { marginLeft: idx === 0 ? 0 : -20, zIndex: 10 - idx }
                                        ]}
                                    >
                                        <Image source={source} style={styles.thumbImg} resizeMode="contain" />
                                    </View>
                                );
                            })}
                        </View>
                        <View style={styles.textColumn}>
                            <Text style={styles.itemsCountText}>{totalItems} items</Text>
                            <Text style={styles.priceText}>₹{totalPrice.toLocaleString()}</Text>
                        </View>
                    </View>

                    <View style={styles.right}>
                        <Text style={styles.viewCart}>View Cart</Text>
                        <Ionicons name="caret-forward" size={12} color="#fff" />
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
        width: width * 0.94,
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.2,
        shadowRadius: 8,
        elevation: 10,
    },
    cartGradient: {
        height: 56,
        paddingHorizontal: 16,
        borderRadius: 12, // More rectangular like Blinkit/Zepto
        flexDirection: "row",
        justifyContent: "space-between",
        alignItems: "center",
    },
    left: {
        flexDirection: "row",
        alignItems: "center",
        flex: 1,
    },
    thumbStack: {
        flexDirection: "row",
        alignItems: "center",
        marginRight: 12,
    },
    thumbCircle: {
        width: 32,
        height: 32,
        borderRadius: 16,
        backgroundColor: "#fff",
        borderWidth: 1.5,
        borderColor: "#0C831F",
        justifyContent: "center",
        alignItems: "center",
        overflow: "hidden",
    },
    thumbImg: {
        width: "90%",
        height: "90%",
    },
    textColumn: {
        justifyContent: "center",
    },
    itemsCountText: {
        color: "#fff",
        fontSize: 11,
        fontWeight: "600",
        opacity: 0.9,
    },
    priceText: {
        color: "#fff",
        fontWeight: "800",
        fontSize: 16,
    },
    right: {
        flexDirection: "row",
        alignItems: "center",
        backgroundColor: "rgba(255,255,255,0.05)",
        paddingVertical: 8,
        paddingHorizontal: 12,
        borderRadius: 8,
        gap: 4,
    },
    viewCart: {
        color: "#fff",
        fontWeight: "800",
        fontSize: 13,
    },
});