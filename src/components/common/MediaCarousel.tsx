import React, { useState, useRef, useEffect, useCallback } from "react";
import {
  View,
  Text,
  StyleSheet,
  Image,
  Dimensions,
  ScrollView,
  FlatList,
  Pressable,
  TouchableOpacity,
} from "react-native";
import { Video, ResizeMode } from "expo-av";
// @ts-ignore
import { Ionicons } from "@expo/vector-icons";
import { scale } from "../../utils/responsive";
import { normalizeImageUrl, resolveImageSource } from "../../utils/image";

const { width: SCREEN_WIDTH } = Dimensions.get("window");
const CAROUSEL_HEIGHT = scale(340);
const AUTO_SLIDE_INTERVAL = 2000; // 2 seconds
const THUMB_SIZE = scale(58);

interface MediaItem {
  id: string;
  url: string;
  type: "image" | "video";
}

interface Props {
  product: any;
}

const MediaCarousel: React.FC<Props> = ({ product }) => {
  const [activeIndex, setActiveIndex] = useState(0);
  const [mediaFailed, setMediaFailed] = useState<Record<string, boolean>>({});
  const scrollViewRef = useRef<ScrollView>(null);
  const thumbListRef = useRef<FlatList<MediaItem>>(null);
  const autoSlideTimer = useRef<NodeJS.Timeout | null>(null);
  const interactionTimer = useRef<NodeJS.Timeout | null>(null);
  const isScrolling = useRef(false);

  // ─── Gather all media items from product data ───────────────────────────────
  const gatherMedia = (): MediaItem[] => {
    const items: MediaItem[] = [];
    const seen = new Set<string>();

    const pushMedia = (value: unknown, forcedType?: "image" | "video") => {
      if (typeof value !== "string") return;
      const raw = value.trim();
      if (!raw) return;

      const type =
        forcedType || (/\.(mp4|mov|mkv|webm)$/i.test(raw) ? "video" : "image");
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

    // Primary image
    pushMedia(
      product?.imageUrl ||
        product?.image ||
        product?.thumbnail ||
        product?.productImage ||
        product?.icon ||
        product?.imageUri
    );

    // Media array (mixed)
    if (Array.isArray(product?.media)) {
      product.media.forEach((m: any) => {
        pushMedia(typeof m === "string" ? m : m.url || m.imageUrl, m?.type);
      });
    } else {
      // Image gallery arrays
      const rawImages =
        product?.images ||
        product?.gallery ||
        product?.imageUrls ||
        product?.productImages ||
        [];
      if (Array.isArray(rawImages)) {
        rawImages.forEach((img: any) => {
          pushMedia(
            typeof img === "string"
              ? img
              : img.imageUrl || img.url || img.image || img.uri,
            "image"
          );
        });
      }

      // Videos
      if (Array.isArray(product?.videos)) {
        product.videos.forEach((url: string) => pushMedia(url, "video"));
      }
      if (product?.videoUrl) {
        pushMedia(product.videoUrl, "video");
      }
    }

    return items;
  };

  const mediaItems = gatherMedia();
  const mediaSignature = mediaItems.map((i) => `${i.type}:${i.url}`).join("|");

  // ─── Reset on product change ─────────────────────────────────────────────────
  useEffect(() => {
    setActiveIndex(0);
    setMediaFailed({});
    scrollViewRef.current?.scrollTo({ x: 0, animated: false });
  }, [mediaSignature]);

  // ─── Auto-slide every 2 seconds ──────────────────────────────────────────────
  useEffect(() => {
    if (mediaItems.length <= 1) return;

    const startTimer = () => {
      if (autoSlideTimer.current) clearInterval(autoSlideTimer.current);
      autoSlideTimer.current = setInterval(() => {
        if (isScrolling.current) return;
        setActiveIndex((current) => {
          const next = (current + 1) % mediaItems.length;
          scrollViewRef.current?.scrollTo({
            x: next * SCREEN_WIDTH,
            animated: true,
          });
          return next;
        });
      }, AUTO_SLIDE_INTERVAL);
    };

    startTimer();
    return () => {
      if (autoSlideTimer.current) clearInterval(autoSlideTimer.current);
    };
  }, [mediaItems.length]);

  // ─── Sync thumbnail strip ────────────────────────────────────────────────────
  useEffect(() => {
    if (mediaItems.length > 1 && thumbListRef.current) {
      try {
        thumbListRef.current.scrollToIndex({
          index: activeIndex,
          animated: true,
          viewPosition: 0.5,
        });
      } catch {}
    }
  }, [activeIndex]);

  // ─── User interaction handlers ───────────────────────────────────────────────
  const handleScrollBegin = () => {
    isScrolling.current = true;
    // Pause auto-slide while user swipes
    if (autoSlideTimer.current) clearInterval(autoSlideTimer.current);
    if (interactionTimer.current) clearTimeout(interactionTimer.current);
  };

  const handleScrollEnd = (e: any) => {
    const offsetX = e.nativeEvent.contentOffset.x;
    const newIndex = Math.round(offsetX / SCREEN_WIDTH);
    setActiveIndex(Math.max(0, Math.min(newIndex, mediaItems.length - 1)));
    // Resume auto-slide 1.5s after user stops swiping
    interactionTimer.current = setTimeout(() => {
      isScrolling.current = false;
      if (autoSlideTimer.current) clearInterval(autoSlideTimer.current);
      autoSlideTimer.current = setInterval(() => {
        if (isScrolling.current) return;
        setActiveIndex((current) => {
          const next = (current + 1) % mediaItems.length;
          scrollViewRef.current?.scrollTo({ x: next * SCREEN_WIDTH, animated: true });
          return next;
        });
      }, AUTO_SLIDE_INTERVAL);
    }, 1500);
  };

  const goToIndex = useCallback(
    (index: number) => {
      if (index < 0 || index >= mediaItems.length) return;
      isScrolling.current = true;
      scrollViewRef.current?.scrollTo({ x: index * SCREEN_WIDTH, animated: true });
      setActiveIndex(index);
      setTimeout(() => {
        isScrolling.current = false;
      }, 600);
    },
    [mediaItems.length]
  );

  // ─── Render single media slide ───────────────────────────────────────────────
  const renderSlide = (item: MediaItem) => {
    if (item.type === "video") {
      return (
        <View key={item.id} style={styles.slide}>
          <Video
            source={{ uri: item.url }}
            style={styles.media}
            useNativeControls
            resizeMode={ResizeMode.CONTAIN}
            isLooping
          />
          <View style={styles.videoBadge}>
            <Ionicons name="play-circle" size={scale(16)} color="#fff" />
            <Text style={styles.videoBadgeText}>VIDEO</Text>
          </View>
        </View>
      );
    }

    const hasFailed = mediaFailed[item.id];
    const imageSource = resolveImageSource(item.url, { width: 512, height: 512 });

    return (
      <View key={item.id} style={styles.slide}>
        {imageSource && !hasFailed ? (
          <Image
            source={imageSource as any}
            style={styles.media}
            resizeMode="contain"
            onError={() =>
              setMediaFailed((prev) => ({ ...prev, [item.id]: true }))
            }
          />
        ) : (
          <View style={styles.mediaFallback}>
            <Ionicons name="image-outline" size={scale(44)} color="#CBD5E1" />
            <Text style={styles.mediaFallbackText}>Image unavailable</Text>
          </View>
        )}
      </View>
    );
  };

  // ─── Thumbnail renderer ──────────────────────────────────────────────────────
  const renderThumbnail = ({ item, index }: { item: MediaItem; index: number }) => {
    const isActive = index === activeIndex;
    const isVideo = item.type === "video";
    const thumbSource = resolveImageSource(item.url, { width: 100, height: 100 });

    return (
      <TouchableOpacity
        onPress={() => goToIndex(index)}
        style={[styles.thumbItem, isActive && styles.thumbItemActive]}
        activeOpacity={0.8}
      >
        {isVideo ? (
          <View style={styles.thumbVideoPlaceholder}>
            <Ionicons name="play-circle" size={scale(22)} color="#0A8754" />
          </View>
        ) : thumbSource ? (
          <Image
            source={thumbSource as any}
            style={styles.thumbImage}
            resizeMode="contain"
          />
        ) : (
          <View style={styles.thumbVideoPlaceholder} />
        )}
      </TouchableOpacity>
    );
  };

  // ─── Empty state ─────────────────────────────────────────────────────────────
  if (mediaItems.length === 0) {
    return (
      <View style={[styles.slide, styles.mediaFallback]}>
        <Ionicons name="image-outline" size={scale(44)} color="#CBD5E1" />
        <Text style={styles.mediaFallbackText}>No Image Available</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* ── Main image ScrollView ─────────────────── */}
      <View style={styles.mainImageArea}>
        <ScrollView
          ref={scrollViewRef}
          horizontal
          pagingEnabled
          showsHorizontalScrollIndicator={false}
          onScrollBeginDrag={handleScrollBegin}
          onMomentumScrollEnd={handleScrollEnd}
          scrollEventThrottle={16}
          bounces={false}
          decelerationRate="fast"
          style={styles.scrollView}
        >
          {mediaItems.map((item) => renderSlide(item))}
        </ScrollView>

        {/* Counter badge */}
        {mediaItems.length > 1 && (
          <View style={styles.counterBadge}>
            <Ionicons name="images-outline" size={scale(12)} color="#fff" />
            <Text style={styles.counterText}>
              {activeIndex + 1}/{mediaItems.length}
            </Text>
          </View>
        )}
      </View>

      {/* ── Pagination dots ───────────────────────── */}
      {mediaItems.length > 1 && (
        <View style={styles.pagination}>
          {mediaItems.map((_, index) => (
            <Pressable key={index} onPress={() => goToIndex(index)}>
              <View
                style={[
                  styles.dot,
                  activeIndex === index ? styles.activeDot : styles.inactiveDot,
                ]}
              />
            </Pressable>
          ))}
        </View>
      )}

      {/* ── Thumbnail strip ───────────────────────── */}
      {mediaItems.length > 1 && (
        <View style={styles.thumbStrip}>
          <FlatList
            ref={thumbListRef}
            data={mediaItems}
            keyExtractor={(item) => `thumb_${item.id}`}
            renderItem={renderThumbnail}
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.thumbContent}
            onScrollToIndexFailed={() => {}}
          />
        </View>
      )}
    </View>
  );
};

export default MediaCarousel;

const styles = StyleSheet.create({
  container: {
    backgroundColor: "#fff",
    width: SCREEN_WIDTH,
  },
  mainImageArea: {
    width: SCREEN_WIDTH,
    height: CAROUSEL_HEIGHT,
    backgroundColor: "#FAFBFC",
    overflow: "hidden",
  },
  scrollView: {
    width: SCREEN_WIDTH,
    height: CAROUSEL_HEIGHT,
  },
  slide: {
    width: SCREEN_WIDTH,
    height: CAROUSEL_HEIGHT,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#FAFBFC",
  },
  media: {
    width: "100%",
    height: "100%",
  },
  mediaFallback: {
    flex: 1,
    width: "100%",
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

  /* Video badge */
  videoBadge: {
    position: "absolute",
    top: scale(12),
    left: scale(12),
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "rgba(0,0,0,0.6)",
    paddingHorizontal: scale(10),
    paddingVertical: scale(5),
    borderRadius: scale(8),
    gap: scale(4),
  },
  videoBadgeText: {
    color: "#fff",
    fontSize: scale(10),
    fontWeight: "800",
    letterSpacing: 1,
  },

  /* Counter badge */
  counterBadge: {
    position: "absolute",
    top: scale(12),
    right: scale(12),
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "rgba(0,0,0,0.55)",
    paddingHorizontal: scale(10),
    paddingVertical: scale(5),
    borderRadius: scale(12),
    gap: scale(4),
  },
  counterText: {
    color: "#fff",
    fontSize: scale(11),
    fontWeight: "700",
  },

  /* Pagination dots */
  pagination: {
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    gap: scale(6),
    marginTop: scale(10),
    marginBottom: scale(2),
  },
  dot: {
    height: scale(8),
    borderRadius: scale(4),
  },
  activeDot: {
    backgroundColor: "#0A8754",
    width: scale(20),
  },
  inactiveDot: {
    backgroundColor: "#D1D5DB",
    width: scale(8),
  },

  /* Thumbnail strip */
  thumbStrip: {
    marginTop: scale(8),
    paddingBottom: scale(10),
  },
  thumbContent: {
    paddingHorizontal: scale(16),
    gap: scale(8),
    alignItems: "center",
  },
  thumbItem: {
    width: THUMB_SIZE,
    height: THUMB_SIZE,
    borderRadius: scale(10),
    borderWidth: 2,
    borderColor: "#E5E7EB",
    overflow: "hidden",
    backgroundColor: "#F9FAFB",
  },
  thumbItemActive: {
    borderColor: "#0A8754",
    borderWidth: 2.5,
    shadowColor: "#0A8754",
    shadowOffset: { width: 0, height: scale(2) },
    shadowOpacity: 0.25,
    shadowRadius: scale(6),
    elevation: 4,
  },
  thumbImage: {
    width: "100%",
    height: "100%",
  },
  thumbVideoPlaceholder: {
    width: "100%",
    height: "100%",
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#F0FDF4",
  },
});
