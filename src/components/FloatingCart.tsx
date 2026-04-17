import React, { useEffect, useRef } from "react";
import {
    View,
    Text,
    StyleSheet,
    Pressable,
    Animated,
    Image,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { useNavigation } from "@react-navigation/native";
import { useCart } from "../context/CartContext";
import { scale } from "../utils/responsive";
import { resolveImageSource } from "../utils/image";

const FloatingCart = ({ currentRoute }: { currentRoute?: string }) => {
    const navigation = useNavigation<any>();
    const { cart } = useCart();
    const insets = useSafeAreaInsets();

    const slideAnim = useRef(new Animated.Value(scale(150))).current;

    // Screens that have bottom tab bar
    const tabScreens = ["Home", "Categories", "Trending", "Order Again"];
    const isTabScreen = currentRoute ? tabScreens.includes(currentRoute) : true;
    const bottomOffset = isTabScreen ? scale(65) : 0;

    const totalItems = cart.reduce((sum, item) => sum + item.quantity, 0);
    const totalPrice = cart.reduce((sum, item) => sum + item.price * item.quantity, 0);

    useEffect(() => {
        if (totalItems > 0 && currentRoute !== "Cart" && currentRoute !== "Checkout") {
            Animated.spring(slideAnim, {
                toValue: 0,
                tension: 50,
                friction: 8,
                useNativeDriver: true,
            }).start();
        } else {
            Animated.spring(slideAnim, {
                toValue: scale(150),
                tension: 50,
                friction: 8,
                useNativeDriver: true,
            }).start();
        }
    }, [currentRoute, slideAnim, totalItems]);

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
                    { marginBottom: Math.max(insets.bottom, scale(15)) + bottomOffset }
                ]}
                onPress={() => navigation.navigate("Cart")}
            >
                <View style={styles.cartGradient}>
                    <View style={styles.left}>
                        <View style={styles.thumbnailWrap}>
                            {cart.slice(0, 5).map((item, index) => {
                                const imageSource = resolveImageSource(item?.imageUrl || item?.image);
                                return (
                                    <View 
                                        key={item.id || index} 
                                        style={[
                                            styles.overlapImageWrap, 
                                            { 
                                                zIndex: 10 - index, 
                                                marginLeft: index === 0 ? 0 : scale(-15) 
                                            }
                                        ]}
                                    >
                                        {imageSource ? (
                                            <Image
                                                source={imageSource as any}
                                                style={styles.overlapImage}
                                                resizeMode="cover"
                                            />
                                        ) : (
                                            <View style={styles.thumbnailFallback}>
                                                <Ionicons name="basket-outline" size={scale(16)} color="#0A8754" />
                                            </View>
                                        )}
                                    </View>
                                );
                            })}
                            
                            {cart.length > 5 && (
                                <View style={[
                                    styles.overlapImageWrap, 
                                    styles.plusWrap, 
                                    { zIndex: 0, marginLeft: scale(-15) }
                                ]}>
                                    <Text style={styles.plusText}>+{totalItems - 5}</Text>
                                </View>
                            )}

                            {cart.length <= 5 && totalItems > cart.length && (
                                <View style={[
                                    styles.overlapImageWrap, 
                                    styles.plusWrap, 
                                    { zIndex: 0, marginLeft: scale(-15) }
                                ]}>
                                    <Text style={styles.plusText}>+{totalItems - cart.length}</Text>
                                </View>
                            )}
                        </View>

                        <View style={styles.textColumn}>
                            <Text style={styles.priceText}>{"\u20B9"}{totalPrice.toLocaleString()}</Text>
                            <Text style={styles.itemText}>
                                {totalItems} {totalItems > 1 ? "items" : "item"} in cart
                            </Text>
                        </View>
                    </View>

                    <View style={styles.right}>
                        <Text style={styles.viewCart}>View Cart</Text>
                        <Ionicons name="chevron-forward" size={scale(16)} color="#fff" />
                    </View>
                </View>
            </Pressable>
        </Animated.View>
    );
};

export default React.memo(FloatingCart);

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
        shadowColor: "#000",
        shadowOffset: { width: 0, height: scale(4) },
        shadowOpacity: 0.2,
        shadowRadius: scale(8),
        elevation: 10,
        backgroundColor: "#0C831F",
        borderRadius: scale(30),
        alignSelf: "center",
    },
    cartGradient: {
        minHeight: scale(56),
        paddingHorizontal: scale(12),
        paddingVertical: scale(8),
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "space-between",
        gap: scale(18),
    },
    left: {
        flexDirection: "row",
        alignItems: "center",
        flexShrink: 1,
    },
    textColumn: {
        justifyContent: "center",
    },
    thumbnailWrap: {
        flexDirection: "row",
        alignItems: "center",
        position: "relative",
        marginRight: scale(10),
    },
    overlapImageWrap: {
        width: scale(38),
        height: scale(38),
        borderRadius: scale(12),
        backgroundColor: "#fff",
        justifyContent: "center",
        alignItems: "center",
        borderWidth: scale(2),
        borderColor: "#0C831F",
        overflow: "hidden",
    },
    overlapImage: {
        width: "100%",
        height: "100%",
    },
    thumbnailFallback: {
        width: "100%",
        height: "100%",
        backgroundColor: "#fff",
        justifyContent: "center",
        alignItems: "center",
    },
    plusWrap: {
        backgroundColor: "#DCFCE7",
    },
    plusText: {
        color: "#0C831F",
        fontWeight: "900",
        fontSize: scale(11),
    },
    priceText: {
        color: "#fff",
        fontWeight: "800",
        fontSize: scale(14),
    },
    itemText: {
        color: "rgba(255,255,255,0.84)",
        fontWeight: "600",
        fontSize: scale(11),
        marginTop: scale(1),
    },
    right: {
        flexDirection: "row",
        alignItems: "center",
        gap: scale(2),
    },
    viewCart: {
        color: "#fff",
        fontWeight: "700",
        fontSize: scale(13),
    },
});
