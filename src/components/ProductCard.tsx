import React from "react";
import {
  View,
  Text,
  StyleSheet,
  Image,
  Pressable,
  ToastAndroid,
  Platform,
  Modal,
  TouchableWithoutFeedback,
  ScrollView,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { scale } from "../utils/responsive";
import { resolveImageSource } from "../utils/image";
import { useNavigation } from "@react-navigation/native";
import { useCart, CartItem } from "../context/CartContext";
import QuantitySelector from "./common/QuantitySelector";

const ProductCard = ({ product }: any) => {
  const navigation = useNavigation<any>();
  const [isVariantModalVisible, setVariantModalVisible] = React.useState(false);
  const [imageFailed, setImageFailed] = React.useState(false);
  
  const {
    cart,
    wishlist,
    addToCart,
    increaseQty,
    decreaseQty,
    addToWishlist,
    removeFromWishlist,
  } = useCart();

  const cartLookupId = product?.productVariants?.[0]?.id 
    ? String(product.productVariants[0].id) 
    : String(product?.id || "");

  const cartItem = cart?.find(
    (i: any) => i.id === cartLookupId || String(i.variantId) === cartLookupId
  );

  const wishItem = wishlist?.find((i: any) => i.id === product?.id);

  const toggleWishlist = () => {
    if (wishItem) {
      removeFromWishlist(product.id);
    } else {
      addToWishlist(product);
    }
  };

  const imageUrl =
    product?.image || product?.imageUrl || product?.icon || product?.imageUri || product?.thumbnail;
  const imageSource = resolveImageSource(imageUrl);

  React.useEffect(() => {
    setImageFailed(false);
  }, [product?.id, imageUrl]);

  const sellingPrice = product?.price ?? product?.sellingPrice ?? 0;
  const mrp = product?.originalPrice ?? product?.mrp ?? (product?.productVariants?.[0]?.mrp) ?? sellingPrice;
  const discount = mrp > sellingPrice ? Math.round(((mrp - sellingPrice) / mrp) * 100) : 0;

  return (
    <View style={styles.card}>
      <Pressable onPress={() => navigation.navigate("ProductDetail", { product })} style={styles.imageContainer}>
        {imageSource && !imageFailed ? (
          <Image
            source={imageSource}
            style={styles.image}
            resizeMode="contain"
            onError={() => setImageFailed(true)}
          />
        ) : (
          <View style={styles.imagePlaceholder}>
            <Ionicons name="image-outline" size={24} color="#ccc" />
          </View>
        )}
        
        <Pressable style={styles.wishlistIcon} onPress={toggleWishlist}>
          <Ionicons name={wishItem ? "heart" : "heart-outline"} size={14} color={wishItem ? "#E82A4B" : "#A0A0A0"} />
        </Pressable>

        <View style={styles.vegIconBox}>
          <View style={styles.vegIconDot} />
        </View>
      </Pressable>

      <View style={styles.detailsContainer}>
        
        <View style={styles.actionRow}>
          <Text style={styles.weightText} numberOfLines={1}>
            {product?.unit || product?.weight || product?.volume || "1 pc"}
          </Text>
          
          <View style={styles.addBtnWrapper}>
            {!cartItem ? (
              <View style={styles.addButtonVessel}>
                <Pressable
                  style={styles.addBtn}
                  onPress={() => {
                    if (product?.productVariants && product.productVariants.length > 1) {
                      setVariantModalVisible(true);
                    } else {
                      addToCart(product);
                      if (Platform.OS === "android") {
                        ToastAndroid.show(`${product?.name?.split(' ').slice(0, 2).join(' ')} added`, ToastAndroid.SHORT);
                      }
                    }
                  }}
                >
                  <Text style={styles.addText}>ADD</Text>
                </Pressable>
                {product?.productVariants && product.productVariants.length > 1 && (
                  <View style={styles.optionsBadge}>
                    <Text style={styles.optionsText}>{product.productVariants.length} options</Text>
                  </View>
                )}
              </View>
            ) : (
              <View style={styles.quantityContainer}>
                <QuantitySelector
                  quantity={cartItem.quantity}
                  onIncrease={() => increaseQty(cartItem.id)}
                  onDecrease={() => decreaseQty(cartItem.id)}
                />
              </View>
            )}
          </View>
        </View>

        <View style={styles.priceRow}>
          <Text style={styles.sellingPrice}>₹{sellingPrice}</Text>
          {mrp > sellingPrice && (
            <Text style={styles.mrpText}>₹{mrp}</Text>
          )}
        </View>
        
        {discount > 0 && (
          <Text style={styles.discountText}>{discount}% OFF on MRP</Text>
        )}

        <Text numberOfLines={2} style={styles.name}>{product?.name || "Product Name"}</Text>

        <View style={styles.footerPill}>
          <Text style={styles.footerPillText}>All {product?.categoryName || "items"} ▶</Text>
        </View>

      </View>

      <Modal
        visible={isVariantModalVisible}
        transparent={true}
        animationType="slide"
        onRequestClose={() => setVariantModalVisible(false)}
      >
        <Pressable 
          style={styles.modalOverlay} 
          onPress={() => setVariantModalVisible(false)}
        >
          <View style={styles.modalContent}>
            <TouchableWithoutFeedback>
              <View style={styles.modalInner}>
                <View style={styles.modalHeader}>
                  <Text style={styles.modalTitle}>Select Variant</Text>
                  <Pressable onPress={() => setVariantModalVisible(false)} style={styles.closeModalBtn}>
                    <Ionicons name="close" size={24} color="#333" />
                  </Pressable>
                </View>

                <ScrollView showsVerticalScrollIndicator={false} style={styles.modalScroll}>
                  {product?.productVariants?.map((variant: any) => {
                    const variantCartItem = cart?.find((i: any) => String(i.variantId) === String(variant.id));
                    
                    return (
                      <View key={variant.id} style={styles.variantRow}>
                        <View style={styles.variantDetails}>
                          <Text style={styles.variantName}>{variant.variantName}</Text>
                          <View style={styles.variantPriceRow}>
                            <Text style={styles.variantSellingPrice}>₹{variant.sellingPrice}</Text>
                            {variant.mrp > variant.sellingPrice && (
                              <Text style={styles.variantMrp}>₹{variant.mrp}</Text>
                            )}
                          </View>
                        </View>
                        
                        <View style={styles.variantAction}>
                          {!variantCartItem ? (
                            <Pressable
                              style={styles.variantAddBtn}
                              onPress={() => {
                                addToCart(product, variant);
                                if (Platform.OS === "android") {
                                  ToastAndroid.show(`${variant.variantName} added`, ToastAndroid.SHORT);
                                }
                              }}
                            >
                              <Text style={styles.variantAddText}>ADD</Text>
                            </Pressable>
                          ) : (
                            <View style={styles.variantQuantityBox}>
                              <QuantitySelector
                                quantity={variantCartItem.quantity}
                                onIncrease={() => increaseQty(variantCartItem.id)}
                                onDecrease={() => decreaseQty(variantCartItem.id)}
                              />
                            </View>
                          )}
                        </View>
                      </View>
                    );
                  })}
                </ScrollView>
              </View>
            </TouchableWithoutFeedback>
          </View>
        </Pressable>
      </Modal>
    </View>
  );
};

export default ProductCard;

const styles = StyleSheet.create({
  card: {
    backgroundColor: "#fff",
    borderRadius: scale(8),
    borderWidth: 1,
    borderColor: "#F0F0F0",
    padding: scale(6),
    marginBottom: scale(8),
  },
  imageContainer: {
    width: "100%",
    aspectRatio: 1,
    borderRadius: scale(8),
    backgroundColor: "#fff", // White background like Zepto
    overflow: "hidden",
    position: "relative",
    justifyContent: "center",
    alignItems: "center",
    padding: scale(2),
  },
  image: {
    width: "100%", // Full width
    height: "100%", // Full height
  },
  imagePlaceholder: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  wishlistIcon: {
    position: "absolute",
    right: scale(4),
    top: scale(4),
    zIndex: 10,
    backgroundColor: "rgba(255,255,255,0.9)",
    borderRadius: scale(12),
    padding: scale(4),
  },
  vegIconBox: {
    position: "absolute",
    right: scale(4),
    bottom: scale(4),
    width: scale(12),
    height: scale(12),
    borderWidth: 1,
    borderColor: "#0C831F",
    borderRadius: scale(2),
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#fff",
  },
  vegIconDot: {
    width: scale(6),
    height: scale(6),
    borderRadius: scale(3),
    backgroundColor: "#0C831F",
  },
  detailsContainer: {
    marginTop: scale(6),
  },
  actionRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-end",
    height: scale(38), 
    marginBottom: scale(2),
  },
  weightText: {
    fontSize: scale(10),
    color: "#444",
    fontWeight: "700",
    flex: 1,
    paddingBottom: scale(4),
  },
  addBtnWrapper: {
    alignItems: "flex-end",
  },
  addButtonVessel: {
    alignItems: "center",
  },
  addBtn: {
    backgroundColor: "#FFFfff",
    borderWidth: 1,
    borderColor: "#0C831F",
    borderRadius: scale(6),
    paddingHorizontal: scale(10),
    paddingVertical: scale(4),
    minWidth: scale(46),
    alignItems: "center",
  },
  addText: {
    color: "#0C831F",
    fontWeight: "800",
    fontSize: scale(10),
    letterSpacing: 0.5,
  },
  optionsBadge: {
    position: "absolute",
    bottom: scale(-11),
    backgroundColor: "#f0fdf4",
    borderWidth: 0.5,
    borderColor: "#bbf7d0",
    borderRadius: scale(4),
    paddingHorizontal: scale(4),
    paddingVertical: scale(1),
  },
  optionsText: {
    fontSize: scale(7),
    color: "#0C831F",
    fontWeight: "600",
  },
  quantityContainer: {
    transform: [{ scale: 0.8 }],
    transformOrigin: "right bottom",
  },
  priceRow: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: scale(2),
    gap: scale(4),
  },
  sellingPrice: {
    fontSize: scale(12),
    fontWeight: "800",
    color: "#111",
  },
  mrpText: {
    fontSize: scale(9),
    color: "#888",
    textDecorationLine: "line-through",
  },
  discountText: {
    fontSize: scale(9),
    color: "#256fef",
    fontWeight: "800",
    marginTop: scale(1),
  },
  name: {
    fontSize: scale(11),
    fontWeight: "500",
    color: "#333",
    marginTop: scale(4),
    lineHeight: scale(14),
  },
  ratingRow: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: scale(4),
  },
  ratingStars: {
    fontSize: scale(8),
    letterSpacing: -1,
  },
  ratingCount: {
    fontSize: scale(8),
    color: "#777",
  },
  timeRow: {
    marginTop: scale(2),
  },
  timeText: {
    fontSize: scale(9),
    color: "#555",
    fontWeight: "600",
  },
  footerPill: {
    marginTop: scale(6),
    backgroundColor: "#f8fdfa",
    alignSelf: "flex-start",
    paddingHorizontal: scale(6),
    paddingVertical: scale(3),
    borderRadius: scale(4),
  },
  footerPillText: {
    fontSize: scale(9),
    color: "#0C831F",
    fontWeight: "700",
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.5)",
    justifyContent: "flex-end",
  },
  modalContent: {
    backgroundColor: "#fff",
    borderTopLeftRadius: scale(20),
    borderTopRightRadius: scale(20),
    maxHeight: "60%",
  },
  modalInner: {
    padding: scale(20),
  },
  modalHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: scale(15),
  },
  modalTitle: {
    fontSize: scale(18),
    fontWeight: "800",
    color: "#111",
  },
  closeModalBtn: {
    padding: scale(4),
  },
  modalScroll: {
    marginBottom: scale(20),
  },
  variantRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: scale(14),
    borderBottomWidth: 1,
    borderBottomColor: "#F0F0F0",
  },
  variantDetails: {
    flex: 1,
  },
  variantName: {
    fontSize: scale(14),
    fontWeight: "600",
    color: "#333",
    marginBottom: scale(4),
  },
  variantPriceRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: scale(6),
  },
  variantSellingPrice: {
    fontSize: scale(14),
    fontWeight: "800",
    color: "#111",
  },
  variantMrp: {
    fontSize: scale(12),
    color: "#888",
    textDecorationLine: "line-through",
  },
  variantAction: {
    width: scale(80),
    alignItems: "flex-end",
  },
  variantAddBtn: {
    backgroundColor: "#ecfceb",
    borderWidth: 1,
    borderColor: "#0C831F",
    borderRadius: scale(8),
    paddingHorizontal: scale(16),
    paddingVertical: scale(8),
    alignItems: "center",
  },
  variantAddText: {
    color: "#0C831F",
    fontWeight: "800",
    fontSize: scale(12),
  },
  variantQuantityBox: {
    transform: [{ scale: 0.9 }],
    transformOrigin: "right center",
  },
});
