import React, { useState, useEffect, useRef } from "react";
import {
    View,
    Text,
    StyleSheet,
    ScrollView,
    TouchableOpacity,
    Dimensions,
    Animated,
    Linking,
    Platform,
    ActivityIndicator,
    Alert,
    Modal,
    TextInput,
    KeyboardAvoidingView,
} from "react-native";
import { Ionicons, MaterialCommunityIcons } from "@expo/vector-icons";
import { useNavigation, useRoute } from "@react-navigation/native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import MapView, { Marker, Polyline, PROVIDER_GOOGLE } from "react-native-maps";
import * as Location from "expo-location";
import { useAuth } from "../context/AuthContext";
import { getOrderById, cancelOrder } from "../services/api/orders";
import AppLoader from "../components/AppLoader";
import { scale } from "../utils/responsive";

const { height } = Dimensions.get("window");
const MAP_HEIGHT = scale(350);

const OrderTrackingScreen = () => {
    const navigation = useNavigation<any>();
    const route = useRoute<any>();
    const insets = useSafeAreaInsets();
    const mapRef = useRef<MapView>(null);

    const orderId = route.params?.orderId || "AB-1024";
    const { jwtToken, user } = useAuth();
    const [isCancelling, setIsCancelling] = useState(false);
    const [isCancelled, setIsCancelled] = useState(false);

    // Real-time order data from API
    const [orderData, setOrderData] = useState<any>(null);
    const [orderStatus, setOrderStatus] = useState("pending");
    const [deliveryPartner, setDeliveryPartner] = useState<any>(null);
    const [orderItems, setOrderItems] = useState<any[]>([]);

    // Dynamic Locations
    const [customerLocation, setCustomerLocation] = useState<{latitude: number; longitude: number} | null>(null);
    const [storeLocation, setStoreLocation] = useState<{latitude: number; longitude: number} | null>(null);
    const [routeCoords, setRouteCoords] = useState<{latitude: number; longitude: number}[]>([]);
    const [loadingLocation, setLoadingLocation] = useState(true);

    // Animated rider position along the route
    const pulseAnim = useRef(new Animated.Value(1)).current;

    // Modals State
    const [showCancelModal, setShowCancelModal] = useState(false);
    const [showDetailsModal, setShowDetailsModal] = useState(false);
    const [selectedReason, setSelectedReason] = useState("");
    const [otherReason, setOtherReason] = useState("");

    const CANCEL_REASONS = [
        "Changed my mind",
        "Delivery taking too long",
        "Item price too high",
        "Ordered by mistake / Double order",
        "Need to add/change items",
        "Other",
    ];

    // ── Fetch order details from API & poll every 10s ──
    const fetchOrderDetails = async () => {
        if (!jwtToken) return;
        try {
            const data = await getOrderById(jwtToken, orderId);
            if (data) {
                setOrderData(data);
                const status = (data.status || data.orderStatus || "pending").toLowerCase();
                setOrderStatus(status);
                if (data.deliveryPartner || data.rider) {
                    setDeliveryPartner(data.deliveryPartner || data.rider);
                }
                if (data.items || data.orderItems) {
                    setOrderItems(data.items || data.orderItems || []);
                }
                if (status === "cancelled") setIsCancelled(true);
            }
        } catch (err) {
            console.error("Failed to fetch order:", err);
        }
    };

    useEffect(() => {
        fetchOrderDetails();
        const poller = setInterval(fetchOrderDetails, 10000); // Poll every 10 seconds
        return () => clearInterval(poller);
    }, [jwtToken, orderId]);

    // 1. Fetch User's Real Location
    useEffect(() => {
        const fetchLocation = async () => {
            try {
                let { status } = await Location.requestForegroundPermissionsAsync();
                if (status !== 'granted') {
                    setCustomerLocation({ latitude: 28.6100, longitude: 77.2300 });
                    return;
                }
                let location = await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.Balanced });
                setCustomerLocation({
                    latitude: location.coords.latitude,
                    longitude: location.coords.longitude
                });
            } catch (error) {
                console.error("Location error:", error);
                setCustomerLocation({ latitude: 28.6100, longitude: 77.2300 }); 
            }
        };
        fetchLocation();
    }, []);

    // 2. Real Store Location: Manjeera Trinity Corporate, KPHB
    useEffect(() => {
        if (customerLocation) {
            const store = {
                latitude: 17.48995,
                longitude: 78.393127,
            };
            setStoreLocation(store);

            // Generate a simple straight-line route for visualization if backend hasn't provided one
            const pts = 6;
            const coords = [];
            for (let i = 0; i <= pts; i++) {
                coords.push({
                    latitude: store.latitude + (customerLocation.latitude - store.latitude) * (i / pts),
                    longitude: store.longitude + (customerLocation.longitude - store.longitude) * (i / pts),
                });
            }
            setRouteCoords(coords);
            setLoadingLocation(false);
            
            setTimeout(fitMap, 800);
        }
    }, [customerLocation]);

    const riderLat = orderData?.deliveryPartner?.latitude || orderData?.rider?.latitude;
    const riderLng = orderData?.deliveryPartner?.longitude || orderData?.rider?.longitude;
    const isRiderLive = !!(riderLat && riderLng);
    
    const riderPosition = isRiderLive 
        ? { latitude: Number(riderLat), longitude: Number(riderLng) }
        : storeLocation;

    // Pulsing animation for rider
    useEffect(() => {
        if (loadingLocation) return;
        const pulse = Animated.loop(
            Animated.sequence([
                Animated.timing(pulseAnim, {
                    toValue: 1.4,
                    duration: 1000,
                    useNativeDriver: true,
                }),
                Animated.timing(pulseAnim, {
                    toValue: 1,
                    duration: 1000,
                    useNativeDriver: true,
                }),
            ])
        );
        pulse.start();
        return () => pulse.stop();
    }, [loadingLocation]);

    // Calculate ETA based on backend estimate
    const etaMinutes = orderData?.estimatedDeliveryTime
        ? Math.max(0, Math.round((new Date(orderData.estimatedDeliveryTime).getTime() - Date.now()) / 60000))
        : (orderStatus === "delivered" ? 0 : 45);

    // ── Build timeline from real order status ──
    const STATUS_FLOW = ["pending", "confirmed", "packed", "picked_up", "out_for_delivery", "delivered"];
    const currentIdx = STATUS_FLOW.indexOf(orderStatus);

    const getStepStatus = (stepIdx: number) => {
        if (isCancelled) return stepIdx <= currentIdx ? "completed" : "pending";
        if (stepIdx < currentIdx) return "completed";
        if (stepIdx === currentIdx) return "active";
        return "pending";
    };

    const formatTime = (dateStr?: string) => {
        if (!dateStr) return "—";
        const d = new Date(dateStr);
        return d.toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit" });
    };

    const timeline = [
        { title: "Order Placed", time: formatTime(orderData?.createdAt), status: getStepStatus(0), icon: "checkmark-circle" },
        { title: "Order Confirmed", time: (getStepStatus(1) === "completed" || getStepStatus(1) === "active") ? formatTime(orderData?.confirmedAt) || "Processing" : "—", status: getStepStatus(1), icon: "shield-checkmark" },
        { title: "Order Packed", time: (getStepStatus(2) === "completed" || getStepStatus(2) === "active") ? formatTime(orderData?.packedAt) || "Packing" : "—", status: getStepStatus(2), icon: "cube" },
        { title: "Picked Up", time: (getStepStatus(3) === "completed" || getStepStatus(3) === "active") ? formatTime(orderData?.pickedUpAt) || "Picking up" : "—", status: getStepStatus(3), icon: "bag-check" },
        { title: "Out for Delivery", time: getStepStatus(4) === "active" ? (etaMinutes > 0 ? `Arriving in ~${etaMinutes} mins` : "Arrived!") : getStepStatus(4) === "completed" ? formatTime(orderData?.outForDeliveryAt) : "—", status: getStepStatus(4), icon: "bicycle" },
        { title: "Delivered", time: getStepStatus(5) === "completed" ? formatTime(orderData?.deliveredAt) || "Done!" : "—", status: getStepStatus(5), icon: "home" },
    ];

    const statusDisplayMap: Record<string, string> = {
        pending: "Order Pending",
        confirmed: "Order Confirmed",
        packed: "Order Packed",
        picked_up: "Picked Up",
        out_for_delivery: "Out for Delivery",
        delivered: "Delivered",
        cancelled: "Cancelled",
    };
    const displayStatus = statusDisplayMap[orderStatus] || orderStatus;

    const handleCallRider = () => {
        Linking.openURL("tel:+919876543210");
    };

    const handleCancelOrder = () => {
        setShowCancelModal(true);
    };

    const confirmCancellation = async () => {
        const finalReason = selectedReason === "Other" ? otherReason : selectedReason;
        if (!finalReason) {
            Alert.alert("Reason Required", "Please select a reason for cancellation.");
            return;
        }

        setIsCancelling(true);
        setShowCancelModal(false);
        try {
            if (jwtToken) {
                await cancelOrder(jwtToken, orderId, finalReason);
            }
            setIsCancelled(true);
            setOrderStatus("cancelled");
            Alert.alert(
                "Order Cancelled",
                "Your order has been cancelled successfully.",
                [{ text: "OK", onPress: () => navigation.navigate("MainTabs") }]
            );
        } catch (error) {
            Alert.alert("Error", "Could not cancel the order.");
        } finally {
            setIsCancelling(false);
        }
    };

    const fitMap = () => {
        if (mapRef.current && storeLocation && customerLocation && riderPosition) {
            mapRef.current.fitToCoordinates(
                [storeLocation, customerLocation, riderPosition],
                { edgePadding: { top: 80, right: 60, bottom: 60, left: 60 }, animated: true }
            );
        }
    };

    return (
        <View style={styles.root}>
            <View style={styles.mapContainer}>
                {loadingLocation || !storeLocation || !customerLocation || !riderPosition ? (
                    <View style={styles.loaderCenter}>
                        <AppLoader size="large" />
                        <Text style={{ marginTop: 10, color: "#666", fontWeight: "600" }}>Locating your order...</Text>
                    </View>
                ) : (
                    <MapView
                        ref={mapRef}
                        style={styles.map}
                        provider={Platform.OS === "android" ? PROVIDER_GOOGLE : undefined}
                        initialRegion={{
                            latitude: (storeLocation.latitude + customerLocation.latitude) / 2,
                            longitude: (storeLocation.longitude + customerLocation.longitude) / 2,
                            latitudeDelta: 0.05,
                            longitudeDelta: 0.05,
                        }}
                        showsUserLocation={false}
                        showsMyLocationButton={false}
                        showsCompass={false}
                        toolbarEnabled={false}
                    >
                        <Polyline coordinates={routeCoords} strokeColor="#ccc" strokeWidth={3} lineDashPattern={[8, 6]} />
                        <Marker coordinate={storeLocation} anchor={{ x: 0.5, y: 0.5 }}>
                            <View style={styles.storeMarker}><Ionicons name="storefront" size={16} color="#fff" /></View>
                        </Marker>
                        <Marker coordinate={customerLocation} anchor={{ x: 0.5, y: 1 }}>
                            <View style={styles.homeMarkerWrap}>
                                <View style={styles.homeMarker}><Ionicons name="home" size={14} color="#fff" /></View>
                                <View style={styles.homeMarkerTip} />
                            </View>
                        </Marker>
                        <Marker coordinate={riderPosition} anchor={{ x: 0.5, y: 0.5 }}>
                            <Animated.View style={[styles.riderOuter, { transform: [{ scale: pulseAnim }] }]}>
                                <View style={styles.riderInner}><MaterialCommunityIcons name="motorbike" size={18} color="#fff" /></View>
                            </Animated.View>
                        </Marker>
                    </MapView>
                )}

                <TouchableOpacity style={[styles.floatingBack, { top: insets.top + 10 }]} onPress={() => navigation.goBack()}>
                    <Ionicons name="arrow-back" size={22} color="#333" />
                </TouchableOpacity>

                {!loadingLocation && (
                    <TouchableOpacity style={[styles.recenterBtn, { top: insets.top + 10 }]} onPress={fitMap}>
                        <Ionicons name="locate" size={20} color="#0A8754" />
                    </TouchableOpacity>
                )}

                {!loadingLocation && (
                    <View style={styles.etaPill}>
                        <View style={styles.pulsingDot} />
                        <Text style={styles.etaText}>
                            {etaMinutes > 0 ? `Your rider is ~${etaMinutes} min away` : "Rider has arrived! 🎉"}
                        </Text>
                    </View>
                )}
            </View>

            <ScrollView 
                style={styles.sheet} 
                showsVerticalScrollIndicator={false} 
                contentContainerStyle={{ paddingBottom: 40 }}
                bounces={false}
            >
                <View style={styles.handle} />
                <View style={styles.headerRow}>
                    <View>
                        <Text style={styles.orderId}>Order #{orderId}</Text>
                        <View style={styles.statusRow}>
                            <View style={[styles.statusDot, isCancelled && { backgroundColor: "#EF4444" }]} />
                            <Text style={[styles.statusLabel, isCancelled && { color: "#EF4444" }]}>{displayStatus}</Text>
                        </View>
                    </View>
                    <TouchableOpacity style={styles.callBtn} onPress={handleCallRider}>
                        <Ionicons name="call" size={20} color="#0A8754" />
                    </TouchableOpacity>
                </View>

                {deliveryPartner?.name && (
                    <>
                        <View style={styles.partnerCard}>
                            <View style={styles.partnerAvatar}><MaterialCommunityIcons name="account" size={26} color="#0A8754" /></View>
                            <View style={styles.partnerInfo}>
                                <Text style={styles.partnerLabel}>DELIVERY PARTNER</Text>
                                <Text style={styles.partnerName}>{deliveryPartner.name}</Text>
                            </View>
                            <View style={styles.ratingBox}>
                                <Ionicons name="star" size={12} color="#FFA800" />
                                <Text style={styles.ratingText}>4.8</Text>
                            </View>
                            <TouchableOpacity style={styles.chatBtn} onPress={handleCallRider}>
                                <Ionicons name="chatbox-ellipses" size={18} color="#0A8754" />
                            </TouchableOpacity>
                        </View>
                        <View style={styles.divider} />
                    </>
                )}

                <View style={styles.timelineContainer}>
                    <Text style={styles.timelineTitle}>Order Status</Text>
                    {timeline.map((step, index) => (
                        <View key={index} style={styles.timelineRow}>
                            <View style={styles.timelineLeft}>
                                <View style={[styles.dot, step.status === "completed" && styles.dotCompleted, step.status === "active" && styles.dotActive]}>
                                    {step.status === "active" ? (
                                        <MaterialCommunityIcons name={step.icon as any} size={16} color="#fff" />
                                    ) : (
                                        <Ionicons name={step.icon as any} size={step.status === "completed" ? 14 : 12} color={step.status === "pending" ? "#C4C4C4" : "#fff"} />
                                    )}
                                </View>
                                {index < timeline.length - 1 && <View style={[styles.line, step.status === "completed" && styles.lineCompleted]} />}
                            </View>
                            <View style={styles.timelineBody}>
                                <Text style={[styles.stepTitle, step.status === "pending" && styles.stepTitlePending, step.status === "active" && styles.stepTitleActive]}>{step.title}</Text>
                                <Text style={[styles.stepTime, step.status === "active" && { color: "#0A8754", fontWeight: "700" }]}>{step.time}</Text>
                            </View>
                        </View>
                    ))}
                </View>

                <TouchableOpacity style={styles.detailsBtn} activeOpacity={0.7} onPress={() => setShowDetailsModal(true)}>
                    <View style={{ flexDirection: "row", alignItems: "center" }}>
                        <Ionicons name="receipt-outline" size={18} color="#333" style={{ marginRight: 10 }} />
                        <Text style={styles.detailsBtnText}>View Full Order Details</Text>
                    </View>
                    <Ionicons name="chevron-forward" size={16} color="#888" />
                </TouchableOpacity>

                <TouchableOpacity style={[styles.detailsBtn, { marginTop: 10, borderColor: "#FECACA" }]} activeOpacity={0.7} onPress={() => navigation.navigate("Help")}>
                    <View style={{ flexDirection: "row", alignItems: "center" }}>
                        <Ionicons name="help-circle-outline" size={18} color="#EF4444" style={{ marginRight: 10 }} />
                        <Text style={[styles.detailsBtnText, { color: "#EF4444" }]}>Need Help?</Text>
                    </View>
                    <Ionicons name="chevron-forward" size={16} color="#EF4444" />
                </TouchableOpacity>

                {!isCancelled && orderStatus !== "delivered" && (
                    <TouchableOpacity style={styles.cancelBtn} onPress={handleCancelOrder} disabled={isCancelling} activeOpacity={0.7}>
                        {isCancelling ? <ActivityIndicator size="small" color="#EF4444" /> : (
                            <>
                                <Ionicons name="close-circle-outline" size={18} color="#EF4444" style={{ marginRight: 8 }} />
                                <Text style={styles.cancelBtnText}>Cancel Order</Text>
                            </>
                        )}
                    </TouchableOpacity>
                )}
            </ScrollView>

            {/* Cancellation Reason Modal */}
            <Modal visible={showCancelModal} transparent animationType="slide">
                <View style={styles.modalOverlay}>
                    <KeyboardAvoidingView behavior={Platform.OS === "ios" ? "padding" : "height"} style={styles.modalContent}>
                        <View style={styles.modalHeader}>
                            <Text style={styles.modalTitle}>Cancel Order?</Text>
                            <TouchableOpacity onPress={() => setShowCancelModal(false)}><Ionicons name="close" size={24} color="#666" /></TouchableOpacity>
                        </View>
                        <Text style={styles.modalSubtitle}>Please select a reason for cancellation</Text>
                        {CANCEL_REASONS.map((reason) => (
                            <TouchableOpacity key={reason} style={styles.reasonOption} onPress={() => setSelectedReason(reason)}>
                                <View style={[styles.radio, selectedReason === reason && styles.radioSelected]}>{selectedReason === reason && <View style={styles.radioInner} />}</View>
                                <Text style={[styles.reasonText, selectedReason === reason && styles.reasonTextActive]}>{reason}</Text>
                            </TouchableOpacity>
                        ))}
                        {selectedReason === "Other" && (
                            <TextInput style={styles.otherInput} placeholder="Tell us more (optional)" value={otherReason} onChangeText={setOtherReason} multiline />
                        )}
                        <View style={styles.modalFooter}>
                            <TouchableOpacity style={styles.keepBtn} onPress={() => setShowCancelModal(false)}><Text style={styles.keepBtnText}>Keep Order</Text></TouchableOpacity>
                            <TouchableOpacity style={[styles.confirmCancelBtn, !selectedReason && { opacity: 0.5 }]} onPress={confirmCancellation} disabled={!selectedReason || isCancelling}>
                                {isCancelling ? <ActivityIndicator size="small" color="#fff" /> : <Text style={styles.confirmCancelBtnText}>Cancel Order</Text>}
                            </TouchableOpacity>
                        </View>
                    </KeyboardAvoidingView>
                </View>
            </Modal>

            {/* Order Details Modal */}
            <Modal visible={showDetailsModal} transparent animationType="slide" onRequestClose={() => setShowDetailsModal(false)}>
                <View style={styles.modalOverlay}>
                    <View style={[styles.modalContent, { maxHeight: height * 0.8 }]}>
                        <View style={styles.modalHeader}>
                            <Text style={styles.modalTitle}>Order Details</Text>
                            <TouchableOpacity onPress={() => setShowDetailsModal(false)}><Ionicons name="close" size={24} color="#666" /></TouchableOpacity>
                        </View>
                        <ScrollView showsVerticalScrollIndicator={false}>
                            <View style={styles.detailsSection}>
                                <Text style={styles.sectionHeading}>Items</Text>
                                {orderItems.map((item: any, idx: number) => (
                                    <View key={idx} style={styles.orderItemRow}>
                                        <View style={styles.itemQuantityBadge}><Text style={styles.itemQuantityText}>{item.quantity}x</Text></View>
                                        <View style={{ flex: 1, marginLeft: 12 }}>
                                            <Text style={styles.itemNameText}>{item.productName || item.name || "Product"}</Text>
                                            <Text style={styles.itemVariantText}>{item.variantName || ""}</Text>
                                        </View>
                                        <Text style={styles.itemPriceText}>₹{((item.unitPrice || item.price || 0) * item.quantity).toFixed(2)}</Text>
                                    </View>
                                ))}
                            </View>
                            <View style={styles.detailsSection}>
                                <Text style={styles.sectionHeading}>Delivery Address</Text>
                                <View style={styles.addressBox}>
                                    <Ionicons name="location" size={18} color="#6B7280" />
                                    <Text style={styles.addressValueText}>
                                        {(() => {
                                            const addr = orderData?.address;
                                            if (!addr) return "Delivery Address";
                                            if (typeof addr === "string") return addr;
                                            return [addr.addressLine1, addr.addressLine2, addr.landmark, addr.city, addr.postalCode].filter(Boolean).join(", ");
                                        })()}
                                    </Text>
                                </View>
                            </View>
                            <View style={[styles.detailsSection, { borderBottomWidth: 0 }]}>
                                <Text style={styles.sectionHeading}>Payment Summary</Text>
                                <View style={styles.pricingRow}><Text style={styles.pricingLabel}>Item Total</Text><Text style={styles.pricingValue}>₹{(orderData?.totalAmount || 0).toFixed(2)}</Text></View>
                                <View style={styles.pricingRow}><Text style={styles.pricingLabel}>Delivery Fee</Text><Text style={[styles.pricingValue, { color: "#0A8754" }]}>FREE</Text></View>
                                <View style={[styles.pricingRow, { marginTop: 10, paddingTop: 10, borderTopWidth: 1, borderTopColor: "#F3F4F6" }]}>
                                    <Text style={[styles.pricingLabel, { fontWeight: "800", color: "#111" }]}>Total Paid</Text>
                                    <Text style={[styles.pricingValue, { fontWeight: "800", color: "#111", fontSize: 18 }]}>₹{(orderData?.totalAmount || 0).toFixed(2)}</Text>
                                </View>
                            </View>
                        </ScrollView>
                        <TouchableOpacity style={styles.closeDetailsBtn} onPress={() => setShowDetailsModal(false)}><Text style={styles.closeDetailsBtnText}>Close</Text></TouchableOpacity>
                    </View>
                </View>
            </Modal>
        </View>
    );
};

const styles = StyleSheet.create({
    root: { flex: 1, backgroundColor: "#fff" },
    loaderCenter: { flex: 1, justifyContent: "center", alignItems: "center", backgroundColor: "#f9f9f9" },
    mapContainer: { height: MAP_HEIGHT, width: "100%", backgroundColor: "#f9f9f9" },
    map: { ...StyleSheet.absoluteFillObject },
    floatingBack: { position: "absolute", left: scale(16), width: scale(44), height: scale(44), borderRadius: scale(22), backgroundColor: "#fff", justifyContent: "center", alignItems: "center", elevation: 6, shadowColor: "#000", shadowOffset: { width: 0, height: scale(2) }, shadowOpacity: 0.15, shadowRadius: scale(6) },
    recenterBtn: { position: "absolute", right: scale(16), width: scale(44), height: scale(44), borderRadius: scale(22), backgroundColor: "#fff", justifyContent: "center", alignItems: "center", elevation: 6, shadowColor: "#000", shadowOffset: { width: 0, height: scale(2) }, shadowOpacity: 0.15, shadowRadius: scale(6) },
    etaPill: { position: "absolute", bottom: scale(30), alignSelf: "center", backgroundColor: "#fff", paddingHorizontal: scale(18), paddingVertical: scale(12), borderRadius: scale(30), flexDirection: "row", alignItems: "center", elevation: 8, shadowColor: "#000", shadowOffset: { width: 0, height: scale(4) }, shadowOpacity: 0.12, shadowRadius: scale(10) },
    pulsingDot: { width: scale(10), height: scale(10), borderRadius: scale(5), backgroundColor: "#0A8754", marginRight: scale(10) },
    etaText: { fontSize: scale(14), fontWeight: "700", color: "#222" },
    storeMarker: { backgroundColor: "#FF6B35", width: scale(32), height: scale(32), borderRadius: scale(16), justifyContent: "center", alignItems: "center", borderWidth: scale(2.5), borderColor: "#fff", elevation: 4 },
    homeMarkerWrap: { alignItems: "center" },
    homeMarker: { backgroundColor: "#3B82F6", width: scale(30), height: scale(30), borderRadius: scale(15), justifyContent: "center", alignItems: "center", borderWidth: scale(2.5), borderColor: "#fff", elevation: 4 },
    homeMarkerTip: { width: 0, height: 0, borderLeftWidth: scale(6), borderRightWidth: scale(6), borderTopWidth: scale(8), borderLeftColor: "transparent", borderRightColor: "transparent", borderTopColor: "#3B82F6", marginTop: scale(-2) },
    riderOuter: { width: scale(44), height: scale(44), borderRadius: scale(22), backgroundColor: "rgba(10, 135, 84, 0.15)", justifyContent: "center", alignItems: "center" },
    riderInner: { width: scale(32), height: scale(32), borderRadius: scale(16), backgroundColor: "#0A8754", justifyContent: "center", alignItems: "center", borderWidth: scale(2.5), borderColor: "#fff", elevation: 6 },
    sheet: { flex: 1, backgroundColor: "#fff", marginTop: scale(-20), borderTopLeftRadius: scale(24), borderTopRightRadius: scale(24), paddingHorizontal: scale(20), elevation: 10 },
    handle: { width: scale(40), height: scale(4), borderRadius: scale(2), backgroundColor: "#E0E0E0", alignSelf: "center", marginTop: scale(12), marginBottom: scale(16) },
    headerRow: { flexDirection: "row", justifyContent: "space-between", alignItems: "center" },
    orderId: { fontSize: scale(18), fontWeight: "800", color: "#111" },
    statusRow: { flexDirection: "row", alignItems: "center", marginTop: scale(5) },
    statusDot: { width: scale(8), height: scale(8), borderRadius: scale(4), backgroundColor: "#0A8754", marginRight: scale(8) },
    statusLabel: { fontSize: scale(13), color: "#0A8754", fontWeight: "600" },
    callBtn: { width: scale(44), height: scale(44), borderRadius: scale(22), backgroundColor: "#EAF7F1", justifyContent: "center", alignItems: "center" },
    partnerCard: { flexDirection: "row", alignItems: "center", marginTop: scale(16), backgroundColor: "#F8FAF9", padding: scale(14), borderRadius: scale(16) },
    partnerAvatar: { width: scale(48), height: scale(48), borderRadius: scale(24), backgroundColor: "#E8F5E9", justifyContent: "center", alignItems: "center" },
    partnerInfo: { flex: 1, marginLeft: scale(14) },
    partnerLabel: { fontSize: scale(10), color: "#888", fontWeight: "700", letterSpacing: 0.8 },
    partnerName: { fontSize: scale(15), fontWeight: "700", color: "#111", marginTop: scale(2) },
    ratingBox: { flexDirection: "row", alignItems: "center", backgroundColor: "#fff", paddingHorizontal: scale(8), paddingVertical: scale(4), borderRadius: scale(8), borderWidth: 1, borderColor: "#eee" },
    ratingText: { fontSize: scale(12), fontWeight: "700", marginLeft: scale(4), color: "#333" },
    chatBtn: { width: scale(40), height: scale(40), borderRadius: scale(20), backgroundColor: "#EAF7F1", justifyContent: "center", alignItems: "center", marginLeft: scale(8) },
    divider: { height: 1, backgroundColor: "#f2f2f2", marginVertical: scale(20) },
    timelineContainer: { paddingBottom: scale(10) },
    timelineTitle: { fontSize: scale(16), fontWeight: "800", color: "#111", marginBottom: scale(18) },
    timelineRow: { flexDirection: "row", minHeight: scale(58) },
    timelineLeft: { width: scale(32), alignItems: "center" },
    dot: { width: scale(26), height: scale(26), borderRadius: scale(13), backgroundColor: "#F0F0F0", justifyContent: "center", alignItems: "center", zIndex: 2 },
    dotCompleted: { backgroundColor: "#0A8754" },
    dotActive: { width: scale(32), height: scale(32), borderRadius: scale(16), backgroundColor: "#0A8754", borderWidth: scale(4), borderColor: "#D4EDDA" },
    line: { width: scale(2.5), flex: 1, backgroundColor: "#E8E8E8", marginVertical: -1 },
    lineCompleted: { backgroundColor: "#0A8754" },
    timelineBody: { flex: 1, marginLeft: scale(14), paddingBottom: scale(24) },
    stepTitle: { fontSize: scale(14), fontWeight: "700", color: "#333" },
    stepTitlePending: { color: "#B0B0B0", fontWeight: "500" },
    stepTitleActive: { color: "#0A8754", fontSize: scale(15), fontWeight: "800" },
    stepTime: { fontSize: scale(12), color: "#888", marginTop: scale(3) },
    detailsBtn: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", backgroundColor: "#F9F9F9", padding: scale(16), borderRadius: scale(14), borderWidth: 1, borderColor: "#eee" },
    detailsBtnText: { fontSize: scale(14), fontWeight: "700", color: "#333" },
    cancelBtn: { flexDirection: "row", alignItems: "center", justifyContent: "center", marginTop: scale(16), paddingVertical: scale(16), borderRadius: scale(14), borderWidth: scale(1.5), borderColor: "#FECACA", backgroundColor: "#FEF2F2" },
    cancelBtnText: { fontSize: scale(14), fontWeight: "700", color: "#EF4444" },
    modalOverlay: { flex: 1, backgroundColor: "rgba(0,0,0,0.5)", justifyContent: "flex-end" },
    modalContent: { backgroundColor: "#fff", borderTopLeftRadius: scale(24), borderTopRightRadius: scale(24), padding: scale(20), paddingBottom: Platform.OS === "ios" ? scale(40) : scale(20) },
    modalHeader: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: scale(15) },
    modalTitle: { fontSize: scale(18), fontWeight: "800", color: "#111" },
    modalSubtitle: { fontSize: scale(14), color: "#666", marginBottom: scale(20) },
    reasonOption: { flexDirection: "row", alignItems: "center", paddingVertical: scale(12), borderBottomWidth: 1, borderBottomColor: "#f1f1f1" },
    radio: { width: scale(20), height: scale(20), borderRadius: scale(10), borderWidth: 2, borderColor: "#D1D5DB", justifyContent: "center", alignItems: "center", marginRight: scale(12) },
    radioSelected: { borderColor: "#EF4444" },
    radioInner: { width: scale(10), height: scale(10), borderRadius: scale(5), backgroundColor: "#EF4444" },
    reasonText: { fontSize: scale(15), color: "#374151" },
    reasonTextActive: { color: "#111", fontWeight: "600" },
    otherInput: { borderWidth: 1, borderColor: "#E5E7EB", borderRadius: scale(12), padding: scale(12), marginTop: scale(15), height: scale(80), textAlignVertical: "top", fontSize: scale(14) },
    modalFooter: { flexDirection: "row", marginTop: scale(25), gap: scale(12) },
    keepBtn: { flex: 1, paddingVertical: scale(14), borderRadius: scale(12), backgroundColor: "#F3F4F6", alignItems: "center" },
    keepBtnText: { fontSize: scale(15), fontWeight: "700", color: "#4B5563" },
    confirmCancelBtn: { flex: 1, backgroundColor: "#EF4444", paddingVertical: scale(14), borderRadius: scale(12), alignItems: "center", justifyContent: "center" },
    confirmCancelBtnText: { color: "#fff", fontSize: scale(16), fontWeight: "700" },
    detailsSection: { paddingVertical: scale(16), borderBottomWidth: 1, borderBottomColor: "#F3F4F6" },
    sectionHeading: { fontSize: scale(12), fontWeight: "800", color: "#9CA3AF", textTransform: "uppercase", letterSpacing: 0.8, marginBottom: scale(12) },
    orderItemRow: { flexDirection: "row", alignItems: "center", marginBottom: scale(10) },
    itemQuantityBadge: { backgroundColor: "#F3F4F6", paddingHorizontal: scale(6), paddingVertical: scale(2), borderRadius: scale(4), borderWidth: 1, borderColor: "#E5E7EB" },
    itemQuantityText: { fontSize: scale(12), fontWeight: "700", color: "#4B5563" },
    itemNameText: { fontSize: scale(14), fontWeight: "600", color: "#111827" },
    itemVariantText: { fontSize: scale(12), color: "#6B7280" },
    itemPriceText: { fontSize: scale(14), fontWeight: "700", color: "#111827" },
    addressBox: { flexDirection: "row", alignItems: "flex-start", backgroundColor: "#F9FAFB", padding: scale(12), borderRadius: scale(12) },
    addressValueText: { flex: 1, marginLeft: scale(10), fontSize: scale(14), color: "#4B5563", lineHeight: scale(20) },
    pricingRow: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: scale(8) },
    pricingLabel: { fontSize: scale(14), color: "#6B7280" },
    pricingValue: { fontSize: scale(14), fontWeight: "600", color: "#111827" },
    closeDetailsBtn: { backgroundColor: "#F3F4F6", paddingVertical: scale(14), borderRadius: scale(12), alignItems: "center", marginTop: scale(10) },
    closeDetailsBtnText: { fontSize: scale(16), fontWeight: "700", color: "#4B5563" },
});

export default OrderTrackingScreen;
