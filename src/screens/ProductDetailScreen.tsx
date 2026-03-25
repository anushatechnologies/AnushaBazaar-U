import React from "react";
import {
  View,
  Text,
  StyleSheet,
  Image,
  Pressable,
  ScrollView,
  ActivityIndicator,
  TextInput,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useCart } from "../context/CartContext";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useNavigation } from "@react-navigation/native";
import { filterProducts, submitProductRating, getProductRatings } from "../services/api/products";
import { useAuth } from "../context/AuthContext";
import { Alert } from "react-native";
import ProductCard from "../components/ProductCard";
import QuantitySelector from "../components/common/QuantitySelector";
import PriceRow from "../components/common/PriceRow";
import FloatingCart from "../components/FloatingCart";
import { Share } from "react-native";
import { API_CONFIG } from "../config/api.config";

const ProductDetailScreen = ({ route }: any) => {
  const { product } = route.params;
  const navigation = useNavigation<any>();
  const insets = useSafeAreaInsets();
  const { user } = useAuth();
  const { cart, addToCart, increaseQty, decreaseQty, wishlist, addToWishlist, removeFromWishlist } = useCart();

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
  
  // Rating State
  const [ratings, setRatings] = React.useState<any[]>([]);
  const [rating, setRating] = React.useState(5);
  const [comment, setComment] = React.useState("");
  const [submittingRating, setSubmittingRating] = React.useState(false);
  const [loadingRatings, setLoadingRatings] = React.useState(true);

  React.useEffect(() => {
    fetchRatings();
  }, [product.id]);

  const fetchRatings = async () => {
    setLoadingRatings(true);
    try {
      const data = await getProductRatings(product.id);
      setRatings(data);
    } catch (error) {
      console.error("Error fetching ratings:", error);
    } finally {
      setLoadingRatings(false);
    }
  };

  const averageRating = ratings.length > 0 
    ? (ratings.reduce((acc, curr) => acc + curr.rating, 0) / ratings.length).toFixed(1) 
    : "5.0";

  const isWishlisted = wishlist.some((item: any) => String(item.id) === String(product.id));

  const handleToggleWishlist = () => {
    if (isWishlisted) {
      removeFromWishlist(product.id);
    } else {
      addToWishlist(product);
    }
  };

  const handleSubmitRating = async () => {
    if (!user?.customerId) {
      Alert.alert("Login Required", "Please login to rate this product");
      return;
    }
    if (!comment.trim()) {
      Alert.alert("Required", "Please add a comment");
      return;
    }

    setSubmittingRating(true);
    try {
      const success = await submitProductRating({
        customerId: user.customerId,
        productId: product.id,
        rating,
        comment: comment.trim(),
      });

      if (success) {
        Alert.alert("Success", "Thank you for your rating!");
        setComment("");
        fetchRatings(); // Refresh ratings
      } else {
        Alert.alert("Error", "Could not submit rating. Please try again.");
      }
    } catch (error) {
      Alert.alert("Error", "Something went wrong");
    } finally {
      setSubmittingRating(false);
    }
  };

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
          onPress={handleToggleWishlist}
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
            <View style={styles.ratingBadge}>
              <Ionicons name="star" size={12} color="#fff" />
              <Text style={styles.ratingBadgeText}>{averageRating}</Text>
            </View>
          </View>

          <Text style={styles.name}>{product.name}</Text>
          <Text style={styles.reviewerCount}>{ratings.length} ratings</Text>

          <View style={styles.priceRow}>
            <PriceRow 
              sellingPrice={displayPrice} 
              mrp={displayMrp} 
              priceStyle={{ fontSize: 26, lineHeight: 30 }}
              mrpStyle={{ fontSize: 15 }}
            />

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
              <Text style={styles.variantTitle}>Select Variant</Text>
              <View style={styles.variantList}>
                {product.productVariants.map((v: any) => {
                  const variantCartItem = cart.find((item: any) => String(item.variantId) === String(v.id));
                  return (
                    <View key={v.id} style={styles.variantRow}>
                      <View style={styles.variantInfo}>
                        <Text style={styles.variantNameText}>{v.variantName}</Text>
                        <View style={styles.variantPriceBox}>
                          <Text style={styles.variantSellingPrice}>₹{v.sellingPrice}</Text>
                          {v.mrp > v.sellingPrice && (
                            <Text style={styles.variantMrpText}>₹{v.mrp}</Text>
                          )}
                        </View>
                      </View>
                      <View style={styles.variantAction}>
                        {!variantCartItem ? (
                          <Pressable
                            style={styles.variantAddButton}
                            onPress={() => addToCart(product, v)}
                          >
                            <Text style={styles.variantAddText}>ADD</Text>
                          </Pressable>
                        ) : (
                          <QuantitySelector
                            quantity={variantCartItem.quantity}
                            onIncrease={() => increaseQty(variantCartItem.id)}
                            onDecrease={() => decreaseQty(variantCartItem.id)}
                            mini
                          />
                        )}
                      </View>
                    </View>
                  );
                })}
              </View>
            </View>
          )}

          <View style={styles.detailsGroup}>
            <Text style={styles.detailsHeader}>Product Details</Text>
            <Text style={styles.description}>
              {product.description || "No description provided."}
            </Text>
          </View>

          <View style={styles.divider} />

          {/* Rating Section */}
          <View style={styles.ratingSection}>
            <Text style={styles.detailsHeader}>Rate this product</Text>
            <View style={styles.starsRow}>
              {[1, 2, 3, 4, 5].map((s) => (
                <Pressable key={s} onPress={() => setRating(s)}>
                  <Ionicons
                    name={s <= rating ? "star" : "star-outline"}
                    size={32}
                    color={s <= rating ? "#FFB800" : "#ccc"}
                  />
                </Pressable>
              ))}
            </View>
            <View style={styles.inputContainer}>
               <View style={styles.commentInputBox}>
                 <Ionicons name="chatbubble-outline" size={20} color="#666" style={{ marginTop: 12, marginLeft: 12 }} />
                 <View style={{ flex: 1, padding: 12 }}>
                   <Text style={{ fontSize: 12, color: '#888', marginBottom: 4 }}>Your Review</Text>
                   <TextInput
                      style={styles.commentTextInput}
                      placeholder="Write your thoughts about this product..."
                      value={comment}
                      onChangeText={setComment}
                      multiline
                   />
                 </View>
               </View>

              <Pressable
                style={[styles.submitBtn, submittingRating && { opacity: 0.7 }]}
                onPress={handleSubmitRating}
                disabled={submittingRating}
              >
                {submittingRating ? (
                  <ActivityIndicator color="#fff" size="small" />
                ) : (
                  <Text style={styles.submitText}>Submit Review</Text>
                )}
              </Pressable>
            </View>

            {ratings.length > 0 && (
              <View style={styles.reviewsList}>
                <Text style={styles.reviewsTitle}>Customer Reviews ({ratings.length})</Text>
                {ratings.map((r, idx) => (
                  <View key={idx} style={styles.reviewItem}>
                    <View style={styles.reviewHeader}>
                      <View style={styles.reviewStars}>
                        {[1, 2, 3, 4, 5].map(s => (
                          <Ionicons key={s} name="star" size={12} color={s <= r.rating ? "#FFB800" : "#E5E7EB"} />
                        ))}
                      </View>
                      <Text style={styles.reviewDate}>Verified User</Text>
                    </View>
                    <Text style={styles.reviewComment}>{r.comment}</Text>
                  </View>
                ))}
              </View>
            )}
          </View>
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
    fontSize: 18,
    fontWeight: "800",
    color: "#111",
    letterSpacing: -0.2,
    marginBottom: 2,
  },
  reviewerCount: {
    fontSize: 12,
    color: "#888",
    marginBottom: 10,
  },
  badgeRow: {
    flexDirection: "row",
    gap: 8,
    marginBottom: 12,
    alignItems: "center",
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
  ratingBadge: {
    backgroundColor: "#0A8754",
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
  },
  ratingBadgeText: {
    color: "#fff",
    fontSize: 12,
    fontWeight: "800",
  },
  priceRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginTop: 10,
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
    backgroundColor: "#f2f2f2",
    marginVertical: 20,
  },
  detailsGroup: {
    marginTop: 20,
  },
  detailsHeader: {
    fontSize: 15,
    fontWeight: "800",
    color: "#111",
    marginBottom: 8,
  },
  description: {
    color: "#666",
    lineHeight: 20,
    fontSize: 13,
  },
  variantSection: {
    marginVertical: 10,
  },
  variantTitle: {
    fontSize: 15,
    fontWeight: "800",
    color: "#111",
    marginBottom: 12,
  },
  variantList: {
    gap: 12,
  },
  variantRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    padding: 12,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#eee",
    backgroundColor: "#fff",
  },
  variantInfo: {
    flex: 1,
  },
  variantNameText: {
    fontSize: 14,
    fontWeight: "600",
    color: "#333",
  },
  variantPriceBox: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    marginTop: 4,
  },
  variantSellingPrice: {
    fontSize: 14,
    fontWeight: "800",
    color: "#111",
  },
  variantMrpText: {
    fontSize: 12,
    color: "#888",
    textDecorationLine: "line-through",
  },
  variantAction: {
    width: 80,
    alignItems: "flex-end",
  },
  variantAddButton: {
    backgroundColor: "#FFF",
    borderWidth: 1,
    borderColor: "#0C831F",
    borderRadius: 8,
    paddingHorizontal: 16,
    paddingVertical: 8,
  },
  variantAddText: {
    color: "#0C831F",
    fontWeight: "800",
    fontSize: 12,
  },
  ratingSection: {
    marginTop: 10,
    marginBottom: 40,
  },
  starsRow: {
    flexDirection: "row",
    gap: 8,
    marginVertical: 12,
  },
  inputContainer: {
    marginTop: 5,
  },
  commentInputBox: {
    flexDirection: 'row',
    backgroundColor: '#F9FAFB',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  commentTextInput: {
    fontSize: 14,
    color: "#374151",
    minHeight: 60,
    textAlignVertical: "top",
  },
  submitBtn: {
    backgroundColor: "#0A8754",
    marginTop: 15,
    paddingVertical: 14,
    borderRadius: 10,
    alignItems: "center",
  },
  submitText: {
    color: "#fff",
    fontWeight: "800",
    fontSize: 15,
  },
  reviewsList: {
    marginTop: 30,
  },
  reviewsTitle: {
    fontSize: 15,
    fontWeight: "800",
    color: "#111",
    marginBottom: 15,
  },
  reviewItem: {
    paddingVertical: 15,
    borderBottomWidth: 1,
    borderBottomColor: "#f2f2f2",
  },
  reviewHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 6,
  },
  reviewStars: {
    flexDirection: "row",
    gap: 2,
  },
  reviewDate: {
    fontSize: 11,
    color: "#888",
    fontWeight: "600",
  },
  reviewComment: {
    fontSize: 13,
    color: "#444",
    lineHeight: 18,
  },
});