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
  Animated,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useNavigation, useRoute } from "@react-navigation/native";

import { scale } from "../utils/responsive";
import { resolveImageSource } from "../utils/image";
import { getProductPackLabel } from "../utils/product";
import { useCart } from "../context/CartContext";
import QuantitySelector from "./common/QuantitySelector";

const PRODUCT_IMAGE_SIZE = 512;

const ProductCard = ({ product }: any) => {
  const navigation = useNavigation<any>();
  const route = useRoute();
  const [isVariantModalVisible, setVariantModalVisible] = React.useState(false);
  const [imageFailed, setImageFailed] = React.useState(false);
  const slideAnim = React.useRef(new Animated.Value(0)).current;

  const openVariantModal = () => {
    setVariantModalVisible(true);
    Animated.spring(slideAnim, {
      toValue: 1,
      useNativeDriver: true,
      damping: 20,
      mass: 0.8,
      stiffness: 150,
    }).start();
  };

  const closeVariantModal = () => {
    Animated.timing(slideAnim, {
      toValue: 0,
      duration: 250,
      useNativeDriver: true,
    }).start(() => setVariantModalVisible(false));
  };

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
    (item: any) => item.id === cartLookupId || String(item.variantId) === cartLookupId
  );

  const wishItem = wishlist?.find((item: any) => String(item.id) === String(product?.id));

  const toggleWishlist = () => {
    if (wishItem) {
      removeFromWishlist(String(product.id));
      return;
    }

    addToWishlist(product);
  };

  const imageUrl =
    product?.image ||
    product?.imageUrl ||
    product?.icon ||
    product?.imageUri ||
    product?.thumbnail;
  const imageSource = resolveImageSource(imageUrl, {
    width: PRODUCT_IMAGE_SIZE,
    height: PRODUCT_IMAGE_SIZE,
  });

  React.useEffect(() => {
    setImageFailed(false);
  }, [product?.id, imageUrl]);

  const sellingPrice = 
    (product?.productVariants?.[0]?.sellingPrice > 0 ? product.productVariants[0].sellingPrice : null) ?? 
    (product?.sellingPrice > 0 ? product.sellingPrice : null) ?? 
    (product?.price > 0 ? product.price : 0);

  const mrp =
    (product?.originalPrice > 0 ? product.originalPrice : null) ??
    (product?.mrp > 0 ? product.mrp : null) ??
    (product?.productVariants?.[0]?.mrp > 0 ? product.productVariants[0].mrp : null) ??
    sellingPrice;

  const discount =
    mrp > sellingPrice ? Math.round(((mrp - sellingPrice) / mrp) * 100) : 0;
  const packLabel = getProductPackLabel(product, product?.productVariants?.[0])
    || product?.productVariants?.[0]?.variantName
    || product?.unit
    || '';
  const categoryId =
    product?.categoryId ||
    product?.category_id ||
    product?.category?.id ||
    product?.category?._id;
  const categoryName =
    product?.categoryName ||
    product?.category?.name ||
    product?.category?.title ||
    product?.subCategoryName ||
    product?.subCategory?.name;
  const categoryLabel =
    categoryName ||
    "items";

  const openProductDetail = React.useCallback(() => {
    if (route.name === "ProductDetail") {
      navigation.push("ProductDetail", { product });
      return;
    }

    navigation.navigate("ProductDetail", { product });
  }, [navigation, product, route.name]);

  const openCategoryProducts = React.useCallback(() => {
    if (categoryId) {
      navigation.navigate("CategoryProducts", {
        category: {
          id: categoryId,
          name: categoryName || "Category",
        },
      });
      return;
    }

    if (categoryName) {
      navigation.navigate("SearchResults", { query: categoryName });
    }
  }, [categoryId, categoryName, navigation]);

  return (
    <View style={styles.card}>
      <Pressable onPress={openProductDetail} style={styles.imageContainer}>
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

        {discount > 0 && (
          <View style={styles.imageDiscountBadge}>
            <Text style={styles.imageDiscountText}>{discount}% OFF</Text>
          </View>
        )}

        <Pressable style={styles.wishlistIcon} onPress={toggleWishlist}>
          <Ionicons
            name={wishItem ? "heart" : "heart-outline"}
            size={14}
            color={wishItem ? "#E82A4B" : "#A0A0A0"}
          />
        </Pressable>

        <View style={styles.vegIconBox}>
          <View style={styles.vegIconDot} />
        </View>
      </Pressable>
      <View style={styles.detailsContainer}>
        <Text style={styles.name} numberOfLines={2}>
          {product?.name || "Product Name"}
        </Text>
        
        <Text style={styles.weightText} numberOfLines={1}>
          {packLabel || "1 Unit"}
        </Text>

        <View style={styles.actionRow}>
          <View style={styles.priceContainer}>
            <Text style={styles.sellingPrice}>{"\u20B9"}{sellingPrice}</Text>
            {mrp > sellingPrice && (
              <Text style={styles.mrpText}>{"\u20B9"}{mrp}</Text>
            )}
          </View>

          <View style={styles.addBtnWrapper}>
            {!cartItem ? (
              <View style={styles.addButtonVessel}>
                <Pressable
                  style={styles.addBtn}
                  onPress={() => {
                    if (product?.productVariants && product.productVariants.length > 1) {
                      openVariantModal();
                      return;
                    }

                    addToCart(product);
                    if (Platform.OS === "android") {
                      ToastAndroid.show(
                        `${product?.name?.split(" ").slice(0, 2).join(" ")} added`,
                        ToastAndroid.SHORT
                      );
                    }
                  }}
                >
                  <Text style={styles.addText}>ADD</Text>
                </Pressable>
                {product?.productVariants && product.productVariants.length > 1 && (
                  <View style={styles.optionsBadge}>
                    <Text style={styles.optionsText}>
                      {product.productVariants.length} options
                    </Text>
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
      </View>

      <Modal
        visible={isVariantModalVisible}
        transparent
        animationType="none"
        onRequestClose={closeVariantModal}
      >
        <Animated.View
          style={[
            styles.modalOverlay,
            {
              opacity: slideAnim,
            },
          ]}
        >
          <Pressable style={StyleSheet.absoluteFill} onPress={closeVariantModal} />
          
          <Animated.View 
            style={[
              styles.modalContent,
              {
                transform: [
                  {
                    translateY: slideAnim.interpolate({
                      inputRange: [0, 1],
                      outputRange: [600, 0],
                    }),
                  },
                ],
              }
            ]}
          >
            <TouchableWithoutFeedback>
              <View style={styles.modalInner}>
                {/* Pull Bar */}
                <View style={styles.pullBar} />

                <View style={styles.modalHeader}>
                  <View>
                    <Text style={styles.modalTitle}>Choose Variant</Text>
                    <Text style={styles.modalSubtitle}>{product?.name}</Text>
                  </View>
                  <Pressable
                    onPress={closeVariantModal}
                    style={styles.closeModalBtn}
                  >
                    <Ionicons name="close-circle" size={28} color="#D1D5DB" />
                  </Pressable>
                </View>

                <ScrollView
                  showsVerticalScrollIndicator={false}
                  contentContainerStyle={styles.modalScroll}
                >
                  {product?.productVariants?.map((variant: any, idx: number) => {
                    const variantCartItem = cart?.find(
                      (item: any) => String(item.variantId) === String(variant.id)
                    );

                    const vSellingPrice = variant.sellingPrice;
                    const vMrp = variant.mrp > 0 ? variant.mrp : variant.originalPrice;
                    const vDiscount = (vMrp > vSellingPrice) ? Math.round(((vMrp - vSellingPrice) / vMrp) * 100) : 0;

                    return (
                      <View key={variant.id} style={[styles.variantRow, variantCartItem && styles.variantRowSelected]}>
                        <View style={styles.variantImageWrapper}>
                          <Image
                            source={
                              resolveImageSource(
                                variant.image ||
                                  variant.imageUrl ||
                                  product.imageUrl ||
                                  product.imageUri ||
                                  product.image,
                                {
                                  width: PRODUCT_IMAGE_SIZE,
                                  height: PRODUCT_IMAGE_SIZE,
                                }
                              ) as any
                            }
                            style={styles.variantImage}
                            resizeMode="contain"
                          />
                          {vDiscount > 0 && (
                            <View style={styles.variantDiscountBadge}>
                              <Text style={styles.variantDiscountText}>{vDiscount}% OFF</Text>
                            </View>
                          )}
                        </View>
                        
                        <View style={styles.variantDetails}>
                          <Text style={styles.variantName} numberOfLines={2}>
                            {variant.variantName}
                          </Text>
                          {(getProductPackLabel(variant) || variant.unit) ? (
                            <Text style={styles.variantQtyLabel}>{getProductPackLabel(variant) || variant.unit}</Text>
                          ) : null}
                          <View style={styles.variantPriceRow}>
                            <Text style={styles.variantSellingPrice}>
                              {"\u20B9"}{vSellingPrice}
                            </Text>
                            {vMrp > vSellingPrice && (
                              <Text style={styles.variantMrp}>{"\u20B9"}{vMrp}</Text>
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
                                  ToastAndroid.show(
                                    `${variant.variantName} added`,
                                    ToastAndroid.SHORT
                                  );
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
          </Animated.View>
        </Animated.View>
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
    backgroundColor: "#fff",
    overflow: "hidden",
    position: "relative",
    justifyContent: "center",
    alignItems: "center",
    padding: scale(2),
  },
  image: {
    width: "100%",
    height: "100%",
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
    alignItems: "center",
    marginTop: scale(10),
  },
  weightText: {
    fontSize: scale(11),
    color: "#6b7280",
    fontWeight: "600",
    marginTop: scale(4),
  },
  addBtnWrapper: {
    alignItems: "flex-end",
  },
  addButtonVessel: {
    alignItems: "center",
  },
  addBtn: {
    backgroundColor: "#FFFFFF",
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
  imageDiscountBadge: {
    position: "absolute",
    top: scale(4),
    left: scale(4),
    backgroundColor: "#2e7d32",
    paddingHorizontal: scale(5),
    paddingVertical: scale(2),
    borderRadius: scale(4),
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 1,
    elevation: 2,
  },
  imageDiscountText: {
    color: "#fff",
    fontSize: scale(9),
    fontWeight: "900",
    textTransform: "uppercase",
  },
  priceContainer: {
    flexDirection: "column",
    justifyContent: "center",
  },
  priceRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: scale(4),
  },
  sellingPrice: {
    fontSize: scale(14),
    fontWeight: "900",
    color: "#0e8749", // Highlight price with app's green color
  },
  mrpText: {
    fontSize: scale(11),
    color: "#888",
    textDecorationLine: "line-through",
    fontWeight: "500",
    marginTop: scale(1),
  },
  name: {
    fontSize: scale(12),
    fontWeight: "700",
    color: "#1a1a1a",
    lineHeight: scale(16),
    height: scale(32), // Ensure consistent height for 2 lines
  },
  qtyBadge: {
    backgroundColor: "#F0F3F0",
    paddingHorizontal: scale(5),
    paddingVertical: scale(2),
    borderRadius: scale(4),
  },
  qtyBadgeText: {
    fontSize: scale(9),
    color: "#666",
    fontWeight: "600",
  },
  footerPill: {
    marginTop: scale(6),
    backgroundColor: "#f1f1f1",
    alignSelf: "flex-start",
    paddingHorizontal: scale(6),
    paddingVertical: scale(2),
    borderRadius: scale(4),
  },
  footerPillText: {
    fontSize: scale(8),
    color: "#888",
    fontWeight: "600",
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.5)",
    justifyContent: "flex-end",
  },
  modalContent: {
    backgroundColor: "#FFFFFF",
    borderTopLeftRadius: scale(24),
    borderTopRightRadius: scale(24),
    maxHeight: "85%",
    elevation: 20,
    shadowColor: "#000",
    shadowOpacity: 0.15,
    shadowOffset: { width: 0, height: -2 },
    shadowRadius: 10,
  },
  pullBar: {
    width: scale(40),
    height: scale(5),
    backgroundColor: "#D1D5DB",
    borderRadius: scale(3),
    alignSelf: "center",
    marginBottom: scale(16),
  },
  modalInner: {
    padding: scale(20),
    paddingTop: scale(12),
  },
  modalHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: scale(20),
  },
  modalTitle: {
    fontSize: scale(18),
    fontWeight: "800",
    color: "#111827",
  },
  modalSubtitle: {
    fontSize: scale(12),
    color: "#6B7280",
    marginTop: scale(2),
    maxWidth: scale(250),
  },
  closeModalBtn: {
    padding: scale(4),
    marginTop: scale(-10),
  },
  modalScroll: {
    paddingBottom: scale(40),
  },
  variantRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    backgroundColor: "#FFFFFF",
    borderRadius: scale(16),
    padding: scale(12),
    marginBottom: scale(12),
    borderWidth: 1,
    borderColor: "#F3F4F6",
    elevation: 1,
    shadowColor: "#000",
    shadowOpacity: 0.02,
    shadowOffset: { width: 0, height: 2 },
    shadowRadius: 4,
  },
  variantRowSelected: {
    borderColor: "#0A8754",
    backgroundColor: "#F0FDF4",
  },
  variantImageWrapper: {
    position: "relative",
    width: scale(64),
    height: scale(64),
    borderRadius: scale(12),
    backgroundColor: "#F9FAFB",
    justifyContent: "center",
    alignItems: "center",
    marginRight: scale(12),
    borderWidth: 1,
    borderColor: "#F3F4F6",
  },
  variantImage: {
    width: "80%",
    height: "80%",
  },
  variantDiscountBadge: {
    position: "absolute",
    top: scale(-6),
    left: scale(4),
    backgroundColor: "#256fef",
    paddingHorizontal: scale(4),
    paddingVertical: scale(2),
    borderRadius: scale(4),
  },
  variantDiscountText: {
    color: "#FFFFFF",
    fontSize: scale(8),
    fontWeight: "800",
  },
  variantDetails: {
    flex: 1,
    justifyContent: "center",
  },
  variantName: {
    fontSize: scale(13),
    fontWeight: "700",
    color: "#1F2937",
    marginBottom: scale(2),
  },
  variantQtyLabel: {
    fontSize: scale(11),
    color: "#6B7280",
    fontWeight: "600",
    marginBottom: scale(4),
  },
  variantPriceRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: scale(6),
  },
  variantSellingPrice: {
    fontSize: scale(15),
    fontWeight: "800",
    color: "#111827",
  },
  variantMrp: {
    fontSize: scale(11),
    color: "#9CA3AF",
    textDecorationLine: "line-through",
  },
  variantAction: {
    width: scale(80),
    alignItems: "flex-end",
  },
  variantAddBtn: {
    backgroundColor: "#F0FDF4",
    borderWidth: 1,
    borderColor: "#0A8754",
    borderRadius: scale(8),
    paddingHorizontal: scale(20),
    paddingVertical: scale(8),
    alignItems: "center",
    shadowColor: "#0A8754",
    shadowOpacity: 0.1,
    shadowOffset: { width: 0, height: 2 },
    shadowRadius: 4,
    elevation: 1,
  },
  variantAddText: {
    color: "#0A8754",
    fontWeight: "800",
    fontSize: scale(12),
  },
  variantQuantityBox: {
    transform: [{ scale: 1 }],
  },
});
