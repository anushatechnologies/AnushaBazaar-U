import React, { useState } from "react";
import {
View,
Text,
StyleSheet,
Image,
Pressable,
ToastAndroid,
Platform,
} from "react-native";

import { Ionicons } from "@expo/vector-icons";
import { useNavigation } from "@react-navigation/native";
import { useCart } from "../context/CartContext";

const ProductCard = ({ product }: any) => {

const navigation = useNavigation<any>();

const {
  cart,
  wishlist,
  addToCart,
  increaseQty,
  decreaseQty,
  addToWishlist,
  removeFromWishlist,
} = useCart();

// Match by variantId (first variant) or product id — must align with addToCart logic
const cartLookupId = product?.productVariants?.[0]?.id ? String(product.productVariants[0].id) : String(product?.id || "");

const cartItem = cart?.find(
  (i: any) => i.id === cartLookupId || String(i.variantId) === cartLookupId
);

const wishItem = wishlist?.find(
  (i: any) => i.id === product?.id
);
const toggleWishlist = () => {

if(wishItem){
removeFromWishlist(product.id);
}else{
addToWishlist(product);
}

};

const imageUrl = product?.image || product?.imageUrl || product?.icon || product?.imageUri;
const imageSource = typeof imageUrl === "string" && imageUrl.startsWith("http")
  ? { uri: imageUrl }
  : imageUrl && typeof imageUrl === "number"
  ? imageUrl
  : null;

  const sellingPrice = product?.price ?? product?.sellingPrice ?? 0;
  const mrp = product?.originalPrice ?? product?.mrp ?? (product?.productVariants?.[0]?.mrp) ?? 0;
  const discount = mrp > sellingPrice ? Math.round(((mrp - sellingPrice) / mrp) * 100) : 0;

  return (
    <View style={styles.card}>
      <Pressable style={styles.wishlistIcon} onPress={toggleWishlist}>
        <Ionicons name={wishItem ? "heart" : "heart-outline"} size={18} color={wishItem ? "#FF3B30" : "#bbb"} />
      </Pressable>

      <Pressable onPress={() => navigation.navigate("ProductDetail", { product })}>
        <View style={styles.imageContainer}>
          {imageSource ? (
            <Image source={imageSource} style={styles.image} resizeMode="cover" />
          ) : (
            <View style={styles.imagePlaceholder}>
              <Ionicons name="image-outline" size={36} color="#ccc" />
            </View>
          )}
          {discount > 0 && (
            <View style={styles.discountBadge}>
              <Text style={styles.discountText}>{discount}% OFF</Text>
            </View>
          )}
        </View>
      </Pressable>

      <Text numberOfLines={2} style={styles.name}>{product?.name}</Text>

      <View style={styles.priceRow}>
        <Text style={styles.price}>₹{sellingPrice}</Text>
        {mrp > sellingPrice && <Text style={styles.originalPrice}>₹{mrp}</Text>}
      </View>

      {!cartItem ? (
        <View style={styles.addBtnContainer}>
          <Pressable
            style={styles.addBtn}
            onPress={() => {
              if (product?.productVariants && product.productVariants.length > 1) {
                navigation.navigate("ProductDetail", { product });
              } else {
                addToCart(product);
                if (Platform.OS === "android") {
                  ToastAndroid.show(`${product?.name?.split(' ').slice(0, 2).join(' ')} added to cart ✅`, ToastAndroid.SHORT);
                }
              }
            }}
          >
            <Text style={styles.addText}>ADD</Text>
          </Pressable>
          {product?.productVariants && product.productVariants.length > 1 && (
            <Text style={styles.customText}>Options</Text>
          )}
        </View>
      ) : (
        <View style={styles.qtyContainer}>
          <Pressable style={styles.qtyBtnBox} onPress={() => decreaseQty(cartItem.id)}>
            <Text style={styles.qtyBtn}>-</Text>
          </Pressable>
          <Text style={styles.qty}>{cartItem.quantity}</Text>
          <Pressable style={styles.qtyBtnBox} onPress={() => increaseQty(cartItem.id)}>
            <Text style={styles.qtyBtn}>+</Text>
          </Pressable>
        </View>
      )}
    </View>
  );

};

export default ProductCard;

const styles = StyleSheet.create({

card:{
  backgroundColor:"#fff",
  borderRadius:16,
  padding:10,
  marginBottom:14,
  elevation:3,
  shadowColor:"#000",
  shadowOpacity:0.07,
  shadowOffset:{width:0,height:3},
  shadowRadius:8,
  overflow:"hidden",
},

imageContainer:{
  width:"100%",
  height:120,
  borderRadius:12,
  backgroundColor:"#F8F8F8",
  overflow:"hidden",
  marginBottom:6,
},

image:{
  width:"100%",
  height:"100%",
},

imagePlaceholder:{
  flex:1,
  justifyContent:"center",
  alignItems:"center",
  backgroundColor:"#F0F0F0",
},

name:{
  fontSize:13,
  fontWeight:"600",
  color:"#1a1a1a",
  marginTop:2,
  minHeight:34,
  lineHeight:17,
},

priceRow:{
  flexDirection:"row",
  alignItems:"center",
  gap:6,
  marginTop:4,
  marginBottom:2,
},

price:{
  color:"#0A8754",
  fontWeight:"800",
  fontSize:15,
},

originalPrice:{
  color:"#aaa",
  fontSize:12,
  textDecorationLine:"line-through",
  fontWeight:"500",
},

  addBtn: {
    backgroundColor: "#fff",
    borderWidth: 1.5,
    borderColor: "#0C831F",
    paddingVertical: 7,
    width: "100%",
    borderRadius: 8,
    alignItems: "center",
    elevation: 4,
    shadowColor: "#0C831F",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },

  addText: {
    color: "#0C831F",
    fontWeight: "900",
    fontSize: 13,
    letterSpacing: 0.5,
  },

  qtyContainer: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginTop: 6,
    backgroundColor: "#0C831F",
    borderRadius: 8,
    paddingVertical: 8,
    paddingHorizontal: 8,
    elevation: 4,
    shadowColor: "#0C831F",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
  },

  qtyBtnBox: {
    paddingHorizontal: 8,
  },

  qtyBtn: {
    fontSize: 20,
    fontWeight: "900",
    color: "#fff",
  },

  qty: {
    fontWeight: "900",
    fontSize: 16,
    color: "#fff",
  },

wishlistIcon: {
  position: "absolute",
  right: 8,
  top: 8,
  zIndex: 10,
  backgroundColor: "rgba(255,255,255,0.85)",
  borderRadius: 12,
  padding: 4,
},
discountBadge: {
  position: "absolute",
  top: 8,
  left: 0,
  backgroundColor: "#E8294A",
  paddingHorizontal: 8,
  paddingVertical: 4,
  borderTopRightRadius: 8,
  borderBottomRightRadius: 8,
  zIndex: 10,
},
discountText: {
  color: "#fff",
  fontSize: 10,
  fontWeight: "800",
},
addBtnContainer: {
  marginTop: 6,
  alignItems: "center",
  width: "100%",
},
customText: {
  fontSize: 9,
  color: "#888",
  marginTop: 2,
  fontWeight: "500",
},

});