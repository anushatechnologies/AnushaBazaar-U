import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  Image,
  Pressable,
  ActivityIndicator,
} from "react-native";
import { useNavigation, CompositeNavigationProp } from "@react-navigation/native";
import { BottomTabNavigationProp } from "@react-navigation/bottom-tabs";
import { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { RootTabParamList } from "../navigation/BottomTabs";
import { RootStackParamList } from "../navigation/RootStack";
import { getCategories } from "../services/api/categories";
import { LinearGradient } from "expo-linear-gradient";
import { Ionicons } from "@expo/vector-icons";

type GridNavigationProp = CompositeNavigationProp<
  BottomTabNavigationProp<RootTabParamList>,
  NativeStackNavigationProp<RootStackParamList>
>;

const CategoryGrid = () => {
  const navigation = useNavigation<GridNavigationProp>();
  const [categories, setCategories] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadCategories();
  }, []);

  const loadCategories = async () => {
    setLoading(true);
    try {
      const data: any = await getCategories();
      // Handle the case where the API might return the array inside a data property, etc.
      // E.g., { status: 'success', data: [...] } or just [...]
      const items = Array.isArray(data) ? data : (data?.data || []);
      setCategories(items.slice(0, 6)); // Display top 6 categories in home screen or all depending on requirement. Usually grids show a subset
    } catch (error) {
      console.error("Error fetching categories:", error);
    } finally {
      setLoading(false);
    }
  };

  const renderItem = ({ item }: any) => {
    const imageUrl = item.image || item.imageUrl || item.icon;
    const isLocalImage = typeof imageUrl === 'number';

    return (
      <Pressable
        style={({ pressed }) => [
          styles.card,
          pressed && { transform: [{ scale: 0.98 }] },
        ]}
        onPress={() =>
          navigation.navigate("CategoryProducts", { category: item })
        }
      >
        <Image
          source={isLocalImage ? imageUrl : { uri: imageUrl }}
          style={styles.image}
          resizeMode="cover"
        />

        {/* Subtle Overlay for Text Readability */}
        <LinearGradient
          colors={["transparent", "rgba(0,0,0,0.6)"]}
          style={styles.gradient}
        />

        <View style={styles.textContainer}>
          <Text style={styles.name} numberOfLines={1}>{item.name || item.title || "Category"}</Text>
          <View style={styles.exploreBtn}>
            <Text style={styles.exploreText}>Shop Now</Text>
            <Ionicons name="arrow-forward" size={12} color="#fff" />
          </View>
        </View>

        <View style={styles.iconWrapper}>
          <Ionicons name={item.iconName || "leaf"} size={14} color="#0A8754" />
        </View>
      </Pressable>
    );
  };

  if (loading) {
    return <ActivityIndicator size="small" color="#0A8754" style={{ marginVertical: 30 }} />;
  }

  return (
    <View style={styles.container}>
      <FlatList
        data={categories}
        horizontal
        showsHorizontalScrollIndicator={false}
        keyExtractor={(item, index) => (item.id || item._id || index).toString()}
        renderItem={renderItem}
        contentContainerStyle={{ paddingHorizontal: 18, gap: 15 }}
      />
    </View>
  );
};

export default CategoryGrid;

const styles = StyleSheet.create({
  container: {
    marginTop: 5,
  },
  card: {
    backgroundColor: "#fff",
    borderRadius: 20,
    width: 140,
    height: 185,
    overflow: "hidden",
    elevation: 8,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.15,
    shadowRadius: 10,
    position: "relative",
  },

  image: {
    width: "100%",
    height: "100%",
  },

  gradient: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    height: "60%",
  },

  textContainer: {
    position: "absolute",
    bottom: 15,
    left: 15,
    right: 15,
  },

  name: {
    fontWeight: "900",
    fontSize: 18,
    color: "#fff",
    textShadowColor: "rgba(0,0,0,0.3)",
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 4,
  },

  exploreBtn: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: 6,
    gap: 4,
  },

  exploreText: {
    color: "#fff",
    fontSize: 11,
    fontWeight: "700",
    textTransform: "uppercase",
    letterSpacing: 1,
  },

  iconWrapper: {
    position: "absolute",
    top: 12,
    right: 12,
    backgroundColor: "rgba(255,255,255,0.9)",
    padding: 8,
    borderRadius: 14,
  },
});