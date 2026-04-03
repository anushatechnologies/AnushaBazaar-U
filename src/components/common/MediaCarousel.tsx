import React, { useState, useRef } from "react";
import {
  View,
  Text,
  StyleSheet,
  Image,
  Dimensions,
  FlatList,
  Pressable,
} from "react-native";
import { Video, ResizeMode } from "expo-av";
import { Ionicons } from "@expo/vector-icons";
import { scale } from "../../utils/responsive";
import { normalizeImageUrl, resolveImageSource } from "../../utils/image";

const { width: SCREEN_WIDTH } = Dimensions.get("window");

interface MediaItem {
  id: string;
  url: string;
  type: "image" | "video";
}

interface Props {
  product: any;
}

const PRODUCT_IMAGE_SIZE = 512;

const MediaCarousel: React.FC<Props> = ({ product }) => {
  const [activeIndex, setActiveIndex] = useState(0);
  const [mediaFailed, setMediaFailed] = useState<Record<string, boolean>>({});
  const flatListRef = useRef<FlatList<MediaItem>>(null);

  const gatherMedia = (): MediaItem[] => {
    const items: MediaItem[] = [];
    const seen = new Set<string>();

    const pushMedia = (value: unknown, forcedType?: "image" | "video") => {
      if (typeof value !== "string") return;

      const raw = value.trim();
      if (!raw) return;

      const type =
        forcedType || (/\.(mp4|mov|mkv)$/i.test(raw) ? "video" : "image");
      const normalizedUrl =
        type === "image" ? normalizeImageUrl(raw) || raw : raw;
      const key = `${type}:${normalizedUrl}`;

      if (seen.has(key)) return;
      seen.add(key);

      items.push({
        id: `${type}_${items.length}`,
        url: normalizedUrl,
        type,
      });
    };

    pushMedia(
      product?.imageUrl ||
        product?.image ||
        product?.thumbnail ||
        product?.productImage ||
        product?.icon ||
        product?.imageUri
    );

    if (Array.isArray(product?.media)) {
      product.media.forEach((m: any) => {
        pushMedia(
          typeof m === "string" ? m : m.url || m.imageUrl,
          m?.type
        );
      });
    } else {
      const rawImages = product?.images || product?.gallery || [];
      if (Array.isArray(rawImages)) {
        rawImages.forEach((img: any) => {
          pushMedia(
            typeof img === "string" ? img : img.imageUrl || img.url || img.image,
            "image"
          );
        });
      }

      if (Array.isArray(product?.videos)) {
        product.videos.forEach((url: string) => pushMedia(url, "video"));
      }
    }

    return items;
  };

  const mediaItems = gatherMedia();
  const mediaSignature = mediaItems.map((item) => `${item.type}:${item.url}`).join("|");

  React.useEffect(() => {
    setActiveIndex(0);
    flatListRef.current?.scrollToOffset({ offset: 0, animated: false });
  }, [mediaSignature]);

  React.useEffect(() => {
    if (mediaItems.length <= 1) return;

    const interval = setInterval(() => {
      setActiveIndex((current) => {
        const next = (current + 1) % mediaItems.length;
        if (flatListRef.current) {
          flatListRef.current.scrollToIndex({ index: next, animated: true });
        }
        return next;
      });
    }, 3000);

    return () => clearInterval(interval);
  }, [mediaItems.length]);

  const handleScroll = (event: any) => {
    const slideSize = event.nativeEvent.layoutMeasurement.width;
    const index = event.nativeEvent.contentOffset.x / slideSize;
    setActiveIndex(Math.round(index));
  };

  const goToIndex = (index: number) => {
    if (index < 0 || index >= mediaItems.length) return;
    flatListRef.current?.scrollToIndex({ index, animated: true });
    setActiveIndex(index);
  };

  const renderItem = ({ item }: { item: MediaItem }) => {
    if (item.type === "video") {
      return (
        <View style={styles.slide}>
          <Video
            source={{ uri: item.url }}
            style={styles.media}
            useNativeControls
            resizeMode={ResizeMode.CONTAIN}
            isLooping
            onError={() => setMediaFailed((prev) => ({ ...prev, [item.id]: true }))}
          />
        </View>
      );
    }

    // Handle Image
    const imageSource = resolveImageSource(item.url, {
      width: PRODUCT_IMAGE_SIZE,
      height: PRODUCT_IMAGE_SIZE,
    });
    const hasFailed = mediaFailed[item.id];

    return (
      <View style={styles.slide}>
        {imageSource && !hasFailed ? (
          <Image
            source={imageSource as any}
            style={styles.media}
            resizeMode="contain"
            onError={() => setMediaFailed((prev) => ({ ...prev, [item.id]: true }))}
          />
        ) : (
          <View style={styles.mediaFallback}>
            <Ionicons name="image-outline" size={scale(44)} color="#CBD5E1" />
            <Text style={styles.mediaFallbackText}>Media unavailable</Text>
          </View>
        )}
      </View>
    );
  };

  if (mediaItems.length === 0) {
    return (
      <View style={[styles.slide, styles.mediaFallback]}>
        <Ionicons name="image-outline" size={scale(44)} color="#CBD5E1" />
        <Text style={styles.mediaFallbackText}>No Image Provided</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <FlatList
        ref={flatListRef}
        data={mediaItems}
        keyExtractor={(item) => item.id}
        renderItem={renderItem}
        horizontal
        pagingEnabled
        showsHorizontalScrollIndicator={false}
        onMomentumScrollEnd={handleScroll}
        bounces={false}
        getItemLayout={(_, index) => ({
          length: SCREEN_WIDTH,
          offset: SCREEN_WIDTH * index,
          index,
        })}
        onScrollToIndexFailed={({ index }) => {
          flatListRef.current?.scrollToOffset({
            offset: SCREEN_WIDTH * index,
            animated: true,
          });
          setActiveIndex(index);
        }}
      />



      {mediaItems.length > 1 && (
        <View style={styles.pagination}>
          {mediaItems.map((_, index) => (
            <View
              key={index}
              style={[
                styles.dot,
                activeIndex === index ? styles.activeDot : styles.inactiveDot,
              ]}
            />
          ))}
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: "#fff",
    alignItems: "center",
    width: SCREEN_WIDTH,
  },
  slide: {
    width: SCREEN_WIDTH,
    height: scale(400),
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#fff",
  },
  media: {
    width: "100%",
    height: "100%",
  },
  mediaFallback: {
    flex: 1,
    width: "100%",
    height: "100%",
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#F8FAFC",
    gap: scale(8),
  },
  mediaFallbackText: {
    color: "#94A3B8",
    fontSize: scale(13),
    fontWeight: "600",
  },
  pagination: {
    flexDirection: "row",
    position: "absolute",
    bottom: scale(16),
    alignSelf: "center",
    gap: scale(6),
  },
  navButton: {
    position: "absolute",
    top: "50%",
    marginTop: scale(-20),
    width: scale(40),
    height: scale(40),
    borderRadius: scale(20),
    backgroundColor: "rgba(255,255,255,0.92)",
    justifyContent: "center",
    alignItems: "center",
    shadowColor: "#111827",
    shadowOffset: { width: 0, height: scale(3) },
    shadowOpacity: 0.12,
    shadowRadius: scale(8),
    elevation: 4,
  },
  navButtonLeft: {
    left: scale(14),
  },
  navButtonRight: {
    right: scale(14),
  },
  navButtonDisabled: {
    opacity: 0.45,
  },
  dot: {
    width: scale(8),
    height: scale(8),
    borderRadius: scale(4),
  },
  activeDot: {
    backgroundColor: "#0A8754",
    width: scale(16),
  },
  inactiveDot: {
    backgroundColor: "#D1D5DB",
  },
});

export default MediaCarousel;
