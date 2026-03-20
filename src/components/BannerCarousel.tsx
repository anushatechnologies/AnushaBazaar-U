import React, { useRef, useState, useEffect } from "react";
import {
  View,
  FlatList,
  Image,
  Dimensions,
  StyleSheet,
  Animated,
  Text,
  TouchableOpacity,
} from "react-native";
import { LinearGradient } from "expo-linear-gradient";

const { width } = Dimensions.get("window");

const banners = [
  {
    id: "1",
    image: "https://images.unsplash.com/photo-1542838132-92c53300491e?w=900&q=80",
    tag: "🛒 Upto 40% OFF",
    title: "Fresh Vegetables",
    subtitle: "Direct from farms to your door",
    tagBg: "#0A8754",
  },
  {
    id: "2",
    image: "https://images.unsplash.com/photo-1560472355-536de3962603?w=900&q=80",
    tag: "🔥 Flash Sale",
    title: "Dairy & Eggs",
    subtitle: "Best prices guaranteed today",
    tagBg: "#EF4444",
  },
  {
    id: "3",
    image: "https://images.unsplash.com/photo-1584473457409-ae5c91d211ff?w=900&q=80",
    tag: "✨ New Arrivals",
    title: "Exotic Fruits",
    subtitle: "Imported & locally sourced",
    tagBg: "#F59E0B",
  },
  {
    id: "4",
    image: "https://images.unsplash.com/photo-1607082349566-187342175e2f?w=900&q=80",
    tag: "⚡ Quick Deals",
    title: "Snacks & Beverages",
    subtitle: "Your daily essentials, delivered fast",
    tagBg: "#8B5CF6",
  },
];

const BannerCarousel = () => {
  const scrollX = useRef(new Animated.Value(0)).current;
  const flatListRef = useRef<FlatList>(null);
  const [currentIndex, setCurrentIndex] = useState(0);

  useEffect(() => {
    const interval = setInterval(() => {
      const nextIndex =
        currentIndex === banners.length - 1 ? 0 : currentIndex + 1;

      flatListRef.current?.scrollToIndex({
        index: nextIndex,
        animated: true,
      });

      setCurrentIndex(nextIndex);
    }, 3500);

    return () => clearInterval(interval);
  }, [currentIndex]);

  return (
    <View>
      <Animated.FlatList
        ref={flatListRef}
        data={banners}
        horizontal
        pagingEnabled
        showsHorizontalScrollIndicator={false}
        keyExtractor={(item) => item.id}
        onScroll={Animated.event(
          [{ nativeEvent: { contentOffset: { x: scrollX } } }],
          { useNativeDriver: false }
        )}
        renderItem={({ item }) => (
          <TouchableOpacity activeOpacity={0.95} style={styles.bannerContainer}>
            <Image
              source={{ uri: item.image }}
              style={styles.image}
              resizeMode="cover"
            />
            {/* Dark gradient overlay for text readability */}
            <LinearGradient
              colors={["transparent", "rgba(0,0,0,0.65)"]}
              style={styles.overlay}
            >
              <View style={[styles.tag, { backgroundColor: item.tagBg }]}>
                <Text style={styles.tagText}>{item.tag}</Text>
              </View>
              <Text style={styles.bannerTitle}>{item.title}</Text>
              <Text style={styles.bannerSubtitle}>{item.subtitle}</Text>
            </LinearGradient>
          </TouchableOpacity>
        )}
      />

      {/* Animated Pagination Dots */}
      <View style={styles.pagination}>
        {banners.map((_, i) => {
          const dotWidth = scrollX.interpolate({
            inputRange: [width * (i - 1), width * i, width * (i + 1)],
            outputRange: [8, 22, 8],
            extrapolate: "clamp",
          });
          const opacity = scrollX.interpolate({
            inputRange: [width * (i - 1), width * i, width * (i + 1)],
            outputRange: [0.3, 1, 0.3],
            extrapolate: "clamp",
          });

          return (
            <Animated.View
              key={i}
              style={[styles.dot, { width: dotWidth, opacity }]}
            />
          );
        })}
      </View>
    </View>
  );
};

export default BannerCarousel;

const styles = StyleSheet.create({
  bannerContainer: {
    width,
    paddingHorizontal: 14,
  },
  image: {
    width: "100%",
    height: 175,
    borderRadius: 20,
  },
  overlay: {
    position: "absolute",
    bottom: 0,
    left: 14,
    right: 14,
    borderBottomLeftRadius: 20,
    borderBottomRightRadius: 20,
    paddingHorizontal: 16,
    paddingVertical: 14,
    justifyContent: "flex-end",
  },
  tag: {
    alignSelf: "flex-start",
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 20,
    marginBottom: 6,
  },
  tagText: {
    color: "#fff",
    fontSize: 11,
    fontWeight: "800",
    letterSpacing: 0.3,
  },
  bannerTitle: {
    color: "#fff",
    fontSize: 18,
    fontWeight: "900",
    letterSpacing: -0.3,
  },
  bannerSubtitle: {
    color: "rgba(255,255,255,0.8)",
    fontSize: 12,
    fontWeight: "500",
    marginTop: 2,
  },
  pagination: {
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    marginTop: 10,
    gap: 4,
  },
  dot: {
    height: 8,
    borderRadius: 4,
    backgroundColor: "#0A8754",
  },
});