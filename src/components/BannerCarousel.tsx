import React, { useRef, useState, useEffect } from "react";
import { getActiveBanners, Banner } from "../services/api/banners";
import {
  View,
  FlatList,
  Image,
  StyleSheet,
  Animated,
  Text,
  TouchableOpacity,
  ActivityIndicator,
} from "react-native";
import { scale, screenWidth } from "../utils/responsive";

const BANNER_WIDTH = screenWidth - scale(28); // 14 padding on each side
const BANNER_HEIGHT = BANNER_WIDTH / 2; // 2:1 Aspect Ratio (e.g., 1080x540)

const BannerCarousel = () => {
  const [banners, setBanners] = useState<Banner[]>([]);
  const [loading, setLoading] = useState(true);
  const scrollX = useRef(new Animated.Value(0)).current;
  const flatListRef = useRef<FlatList>(null);
  const [currentIndex, setCurrentIndex] = useState(0);

  useEffect(() => {
    fetchBanners();
  }, []);

  const fetchBanners = async () => {
    try {
      const data = await getActiveBanners();
      setBanners(data);
    } catch (error) {
      console.error("Banner fetch error:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (banners.length === 0) return;
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
  }, [currentIndex, banners.length]);

  if (loading && banners.length === 0) {
    return (
      <View style={[styles.bannerContainer, { height: BANNER_HEIGHT, justifyContent: 'center', alignItems: 'center' }]}>
        <ActivityIndicator color="#0A8754" />
      </View>
    );
  }

  if (banners.length === 0) {
    return (
      <View style={[styles.bannerContainer, { height: BANNER_HEIGHT, backgroundColor: "#E9F5F0", justifyContent: "center", alignItems: "center" }]}>
        <Text style={{ marginTop: scale(8), color: "#0A8754", fontWeight: "700", fontSize: scale(16) }}>Exciting Offers Coming Soon!</Text>
      </View>
    );
  }

  return (
    <View>
      <Animated.FlatList
        ref={flatListRef}
        data={banners}
        horizontal
        pagingEnabled
        showsHorizontalScrollIndicator={false}
        keyExtractor={(item) => String(item.id)}
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
          </TouchableOpacity>
        )}
      />

      <View style={styles.pagination}>
        {banners.map((_, i) => {
          const dotWidth = scrollX.interpolate({
            inputRange: [screenWidth * (i - 1), screenWidth * i, screenWidth * (i + 1)],
            outputRange: [scale(8), scale(22), scale(8)],
            extrapolate: "clamp",
          });
          const opacity = scrollX.interpolate({
            inputRange: [screenWidth * (i - 1), screenWidth * i, screenWidth * (i + 1)],
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
    width: screenWidth,
    paddingHorizontal: scale(14),
  },
  image: {
    width: "100%",
    height: BANNER_HEIGHT,
    borderRadius: scale(16),
  },
  pagination: {
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    marginTop: scale(10),
    gap: scale(4),
  },
  dot: {
    height: scale(8),
    borderRadius: scale(4),
    backgroundColor: "#0A8754",
  },
});