import React from "react";
import {
  View,
  Text,
  StyleSheet,
  Image,
  Pressable,
  ScrollView,
  ActivityIndicator,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useCart } from "../context/CartContext";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useNavigation } from "@react-navigation/native";
import { filterProducts } from "../services/api/products";
import ProductCard from "../components/ProductCard";
import FloatingCart from "../components/FloatingCart";
import { Share } from "react-native";
import { API_CONFIG } from "../config/api.config";

const ProductDetailScreen = ({ route }: any) => {
  const { product } = route.params;
  const navigation = useNavigation<any>();
  const insets = useSafeAreaInsets();
  const { cart, addToCart, increaseQty, decreaseQty } = useCart();

  const [selectedVariant, setSelectedVariant] = React.useState<any>(
    product.productVariants && product.productVariants.length > 0 ? product.productVariants[0] : null
  );

  const [relatedProducts, setRelatedProducts] = React.useState<any[]>([]);
  const [loadingRelated, setLoadingRelated] = React.useState(true);

  React.useEffect(() => {
    fetchRelated();
  }, [product.id]);

  // Update selected variant if product changes
  React.useEffect(() => {
    if (product.productVariants && product.productVariants.length > 0) {
      setSelectedVariant(product.productVariants[0]);
    }
  }, [product]);

  const fetchRelated = async () => {
    setLoadingRelated(true);
    try {
      const data = await filterProducts({
        categoryId: product.categoryId || product.category_id,
        subCategoryId: product.subCategoryId || product.sub_category_id
      });
      // Filter out current product
      const filtered = data.filter((p: any) => p.id !== product.id);
      setRelatedProducts(filtered);
    } catch (error) {
      console.error("Error fetching related products:", error);
    } finally {
      setLoadingRelated(false);
    }
  };

  const imageSource = product.imageUrl ? { uri: product.imageUrl } :
    typeof product.image === "string" ? { uri: product.image } :
      product.image;

  // Use variantId for matching cart items
  const activeVariantId = selectedVariant?.id || product.variantId;
  const cartItem = cart.find((item: any) => String(item.variantId) === String(activeVariantId));

  // Display prices based on selected variant or top-level product
  const displayPrice = selectedVariant ? selectedVariant.sellingPrice : (product.price || 0);
  const displayMrp = (selectedVariant ? selectedVariant.mrp : product.mrp) || product.originalPrice || displayPrice;
  const hasDiscount = displayMrp > displayPrice;

  const [isWishlisted, setIsWishlisted] = React.useState(false);

  const renderHeader = () => (
    <View style={[styles.headerContainer, { paddingTop: Math.max(insets.top, 10) }]}>
      <Pressable
        style={styles.headerBtn}
        onPress={() => navigation.goBack()}
      >
        <Ionicons name="arrow-back" size={24} color="#111" />
      </Pressable>

      <View style={styles.headerRight}>
        <Pressable
          style={styles.headerBtn}
          onPress={() => setIsWishlisted(!isWishlisted)}
        >
          <Ionicons 
            name={isWishlisted ? "heart" : "heart-outline"} 
            size={22} 
            color={isWishlisted ? "#E8294A" : "#111"} 
          />
        </Pressable>
        <Pressable
          style={styles.headerBtn}
          onPress={async () => {
            try {
              const shareUrl = `${API_CONFIG.SHARE_URL}/product/${product.id}`;
              await Share.share({
                message: `Check out ${product.name} on Anusha Bazaar! Get it here: ${shareUrl}`,
                url: shareUrl,
              });
            } catch (e) {
              console.error(e);
            }
          }}
        >
          <Ionicons name="share-social-outline" size={22} color="#111" />
        </Pressable>
      </View>
    </View>
  );

  return (
    <View style={styles.container}>
      {renderHeader()}
      <ScrollView showsVerticalScrollIndicator={false}>
        <View style={styles.imageContainer}>
          <Image source={imageSource} style={styles.image} />
        </View>

        <View style={styles.infoContainer}>
          <View style={styles.badgeRow}>
            <View style={styles.brandBadge}>
              <Text style={styles.brandText}>{product.brand || "Anusha Exclusive"}</Text>
            </View>
            <View style={styles.categoryBadge}>
              <Text style={styles.categoryText}>{product.categoryName || "Premium"}</Text>
            </View>
          </View>

          <Text style={styles.name}>{product.name}</Text>

          <View style={styles.priceRow}>
            <View style={styles.priceMainCol}>
              <Text style={styles.price}>₹{displayPrice}</Text>
              {hasDiscount && (
                <View style={styles.mrpRow}>
                  <Text style={styles.mrpLabel}>MRP </Text>
                  <Text style={styles.mrp}>₹{displayMrp}</Text>
                </View>
              )}
            </View>

            {hasDiscount && (
              <View style={styles.discountBadge}>
                <Ionicons name="trending-down" size={14} color="#fff" />
                <Text style={styles.discountText}>
                  {Math.round(((displayMrp - displayPrice) / displayMrp) * 100)}% OFF
                </Text>
              </View>
            )}
          </View>

          <View style={styles.divider} />

          {product.productVariants && product.productVariants.length > 1 && (
            <View style={styles.variantSection}>
              <View style={styles.variantHeader}>
                <Text style={styles.variantTitle}>Select Variant</Text>
                <Text style={styles.variantSubtitle}>Choose your preference</Text>
              </View>
              <View style={styles.variantList}>
                {product.productVariants.map((v: any) => (
                  <Pressable
                    key={v.id}
                    onPress={() => setSelectedVariant(v)}
                    style={[
                      styles.variantChip,
                      selectedVariant?.id === v.id && styles.variantChipSelected
                    ]}
                  >
                    <View style={styles.chipLeft}>
                      <View style={[styles.radio, selectedVariant?.id === v.id && styles.radioActive]}>
                        {selectedVariant?.id === v.id && <View style={styles.radioInner} />}
                      </View>
                      <Text style={[
                        styles.variantChipText,
                        selectedVariant?.id === v.id && styles.variantChipTextSelected
                      ]}>
                        {v.variantName}
                      </Text>
                    </View>
                    <Text style={[
                      styles.variantChipPrice,
                      selectedVariant?.id === v.id && styles.variantChipPriceSelected
                    ]}>
                      ₹{v.sellingPrice}
                    </Text>
                  </Pressable>
                ))}
              </View>
            </View>
          )}

          <View style={styles.detailsGroup}>
            <Text style={styles.detailsHeader}>Product Details</Text>
            <Text style={styles.description}>
              {product.description || "Premium quality product. Freshly packed and delivered to your doorstep. Best quality guaranteed for our customers."}
            </Text>
          </View>

          {!cartItem ? (
            <Pressable
              style={styles.addBtn}
              onPress={() => addToCart(product, selectedVariant)}
            >
              <Text style={styles.addText}>Add to Cart</Text>
            </Pressable>
          ) : (
            <View style={styles.qtyContainer}>
              <Pressable onPress={() => decreaseQty(cartItem.id)}>
                <Text style={styles.qtyBtn}>-</Text>
              </Pressable>
              <Text style={styles.qty}>{cartItem.quantity}</Text>
              <Pressable onPress={() => increaseQty(cartItem.id)}>
                <Text style={styles.qtyBtn}>+</Text>
              </Pressable>
            </View>
          )}
        </View>

        {/* Related Products Section */}
        <View style={styles.relatedContainer}>
          <Text style={styles.relatedTitle}>Related Products</Text>
          {loadingRelated ? (
            <ActivityIndicator color="#0A8754" style={{ marginVertical: 20 }} />
          ) : relatedProducts.length > 0 ? (
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              style={styles.relatedScroll}
              contentContainerStyle={{ paddingRight: 20 }}
            >
              {relatedProducts.map((item) => (
                <View key={item.id} style={{ marginRight: 15, width: 160 }}>
                  <ProductCard product={item} />
                </View>
              ))}
            </ScrollView>
          ) : (
            <Text style={styles.noRelated}>No related products found</Text>
          )}
        </View>
      </ScrollView>

      <FloatingCart currentRoute="ProductDetail" />
    </View>
  );
};

export default ProductDetailScreen;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#fff",
  },
  headerContainer: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingVertical: 12,
    zIndex: 100,
  },
  headerRight: {
    flexDirection: "row",
    gap: 12,
  },
  headerBtn: {
    width: 44,
    height: 44,
    backgroundColor: "#fff",
    borderRadius: 22,
    justifyContent: "center",
    alignItems: "center",
    elevation: 3,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },

  imageContainer: {
    backgroundColor: "#fff",
    alignItems: "center",
    width: "100%",
  },

  image: {
    width: "100%",
    height: 400,
    resizeMode: "contain",
  },

  relatedContainer: {
    backgroundColor: "#fff",
    paddingVertical: 15,
    paddingLeft: 20,
    marginBottom: 50,
  },

  relatedTitle: {
    fontSize: 14,
    fontWeight: "700",
    color: "#333",
    marginBottom: 10,
  },

  relatedScroll: {
    flexDirection: "row",
  },

  relatedBox: {
    width: 80,
    height: 80,
    borderRadius: 10,
    backgroundColor: "#f2f2f2",
    marginRight: 10,
    overflow: "hidden",
  },

  relatedImg: {
    width: "100%",
    height: "100%",
    resizeMode: "cover",
  },
  noRelated: {
    color: "#888",
    fontSize: 13,
    paddingVertical: 10,
  },

  infoContainer: {
    backgroundColor: "#fff",
    marginTop: 10,
    padding: 20,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
  },

  name: {
    fontSize: 24,
    fontWeight: "900",
    color: "#111",
    letterSpacing: -0.5,
    marginBottom: 4,
  },

  badgeRow: {
    flexDirection: "row",
    gap: 8,
    marginBottom: 12,
  },
  brandBadge: {
    backgroundColor: "#E6F5EE",
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 8,
  },
  brandText: {
    color: "#0A8754",
    fontSize: 11,
    fontWeight: "800",
    textTransform: "uppercase",
  },
  categoryBadge: {
    backgroundColor: "#F3F4F6",
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 8,
  },
  categoryText: {
    color: "#666",
    fontSize: 11,
    fontWeight: "700",
  },

  priceMainCol: {
    justifyContent: "center",
  },
  mrpRow: {
    flexDirection: "row",
    alignItems: "center",
  },
  mrpLabel: {
    fontSize: 12,
    color: "#999",
    fontWeight: "600",
  },
  price: {
    fontSize: 26,
    color: "#0A8754",
    fontWeight: "900",
    lineHeight: 30,
  },
  priceRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginTop: 10,
  },
  mrp: {
    fontSize: 15,
    color: "#999",
    textDecorationLine: "line-through",
    fontWeight: "600",
  },
  discountBadge: {
    backgroundColor: "#E8294A",
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 10,
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    elevation: 2,
  },
  discountText: {
    color: "#fff",
    fontSize: 13,
    fontWeight: "900",
  },

  divider: {
    height: 1,
    backgroundColor: "#f0f0f0",
    marginVertical: 20,
  },

  detailsGroup: {
    marginTop: 25,
  },
  detailsHeader: {
    fontSize: 16,
    fontWeight: "800",
    color: "#111",
    marginBottom: 10,
  },
  description: {
    color: "#555",
    lineHeight: 22,
    fontSize: 14,
  },

  addBtn: {
    backgroundColor: "#fff",
    borderWidth: 1.5,
    borderColor: "#0C831F",
    marginTop: 25,
    paddingVertical: 14,
    borderRadius: 10,
    alignItems: "center",
    elevation: 4,
    shadowColor: "#0C831F",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 6,
  },

  addText: {
    color: "#0C831F",
    fontWeight: "900",
    fontSize: 16,
    letterSpacing: 0.5,
  },

  qtyContainer: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginTop: 25,
    backgroundColor: "#0C831F",
    borderRadius: 10,
    paddingVertical: 14,
    paddingHorizontal: 25,
    elevation: 5,
    shadowColor: "#0C831F",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
  },

  qtyBtn: {
    fontSize: 22,
    fontWeight: "900",
    color: "#fff",
  },

  qty: {
    fontSize: 18,
    fontWeight: "900",
    color: "#fff",
  },
  variantSection: {
    marginVertical: 20,
    backgroundColor: "#F8FDFB",
    padding: 15,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: "#E9F7F1",
  },
  variantHeader: {
    marginBottom: 15,
  },
  variantTitle: {
    fontSize: 16,
    fontWeight: "700",
    color: "#333",
  },
  variantSubtitle: {
    fontSize: 12,
    color: "#888",
    marginTop: 2,
  },
  variantList: {
    gap: 12,
  },
  variantChip: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 15,
    paddingVertical: 14,
    borderRadius: 12,
    borderWidth: 1.5,
    borderColor: "#eee",
    backgroundColor: "#fff",
  },
  variantChipSelected: {
    borderColor: "#0A8754",
    backgroundColor: "#E9F7F1",
  },
  chipLeft: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
  },
  radio: {
    width: 20,
    height: 20,
    borderRadius: 10,
    borderWidth: 2,
    borderColor: "#ccc",
    justifyContent: "center",
    alignItems: "center",
  },
  radioActive: {
    borderColor: "#0A8754",
  },
  radioInner: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: "#0A8754",
  },
  variantChipText: {
    fontSize: 14,
    fontWeight: "600",
    color: "#444",
  },
  variantChipTextSelected: {
    color: "#0A8754",
  },
  variantChipPrice: {
    fontSize: 14,
    color: "#666",
    fontWeight: "600",
  },
  variantChipPriceSelected: {
    color: "#0A8754",
  },
});