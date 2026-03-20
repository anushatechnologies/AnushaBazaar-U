import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  Image,
  TouchableOpacity,
  Dimensions,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';

const { height } = Dimensions.get('window');

interface ProductSuggestion {
  id: string | number;
  name: string;
  price: number;
  imageUrl?: string;
  image?: any;
  unit?: string;
  categoryId?: string;
  subCategoryId?: string;
}

interface SearchSuggestionsProps {
  suggestions: ProductSuggestion[];
  searchText?: string;
  isVisible: boolean;
  onClose: () => void;
}

const SearchSuggestions = ({ suggestions, searchText, isVisible, onClose }: SearchSuggestionsProps) => {
  const navigation = useNavigation<any>();

  if (!isVisible) return null;

  const handleViewAllResults = () => {
    onClose();
    if (searchText?.trim()) {
      navigation.navigate("SearchResults", { query: searchText });
    }
  };

  const handleSuggestionTap = (item: ProductSuggestion) => {
    onClose();
    navigation.navigate("ProductDetail", { product: item });
  };

  const handleSearchTermTap = (name: string) => {
    onClose();
    navigation.navigate("SearchResults", { query: name });
  };

  // Get unique product names for text suggestions
  const textSuggestions = [...new Set(suggestions.map(s => s.name))].slice(0, 5);

  const renderTextSuggestion = ({ item, index }: { item: string; index: number }) => (
    <TouchableOpacity
      style={styles.textRow}
      onPress={() => handleSearchTermTap(item)}
      activeOpacity={0.6}
    >
      <View style={styles.searchIconBox}>
        <Ionicons name="search-outline" size={16} color="#9CA3AF" />
      </View>
      <Text style={styles.textName} numberOfLines={1}>{item}</Text>
      <Ionicons name="arrow-forward-outline" size={16} color="#D1D5DB" />
    </TouchableOpacity>
  );

  const renderProductItem = ({ item }: { item: ProductSuggestion }) => {
    const imgSource = item.imageUrl ? { uri: item.imageUrl } :
                     (typeof item.image === 'string' ? { uri: item.image } : item.image);

    return (
      <TouchableOpacity
        style={styles.productRow}
        onPress={() => handleSuggestionTap(item)}
        activeOpacity={0.6}
      >
        <View style={styles.imageContainer}>
          {imgSource ? (
            <Image source={imgSource} style={styles.image} />
          ) : (
            <Ionicons name="basket-outline" size={20} color="#D1D5DB" />
          )}
        </View>
        <View style={styles.info}>
          <Text style={styles.productName} numberOfLines={1}>{item.name}</Text>
          <Text style={styles.productUnit}>{item.unit || ''}</Text>
        </View>
        <Text style={styles.productPrice}>₹{item.price}</Text>
      </TouchableOpacity>
    );
  };

  return (
    <View style={styles.overlay}>
      <View style={styles.container}>
        {/* Text-based search suggestions (like Blinkit) */}
        {textSuggestions.length > 0 && (
          <View style={styles.section}>
            <FlatList
              data={textSuggestions}
              keyExtractor={(item, idx) => `text-${idx}`}
              renderItem={renderTextSuggestion}
              keyboardShouldPersistTaps="handled"
              scrollEnabled={false}
            />
          </View>
        )}

        {/* Product results with images */}
        {suggestions.length > 0 && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Products</Text>
            <FlatList
              data={suggestions.slice(0, 4)}
              keyExtractor={(item) => item.id.toString()}
              renderItem={renderProductItem}
              keyboardShouldPersistTaps="handled"
              scrollEnabled={false}
            />
          </View>
        )}

        {/* View all results button */}
        {suggestions.length > 0 && searchText?.trim() && (
          <TouchableOpacity
            style={styles.viewAllBtn}
            onPress={handleViewAllResults}
            activeOpacity={0.7}
          >
            <Text style={styles.viewAllText}>
              See all results for "{searchText}"
            </Text>
            <Ionicons name="chevron-forward" size={16} color="#0A8754" />
          </TouchableOpacity>
        )}

        {suggestions.length === 0 && (
          <View style={styles.emptyState}>
            <Ionicons name="search-outline" size={40} color="#E5E7EB" />
            <Text style={styles.emptyText}>No products found</Text>
          </View>
        )}
      </View>
      <TouchableOpacity style={styles.backdrop} onPress={onClose} activeOpacity={1} />
    </View>
  );
};

export default SearchSuggestions;

const styles = StyleSheet.create({
  overlay: {
    ...StyleSheet.absoluteFillObject,
    zIndex: 1000,
    top: 0,
  },
  backdrop: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.3)',
  },
  container: {
    backgroundColor: '#fff',
    maxHeight: height * 0.55,
    borderBottomLeftRadius: 20,
    borderBottomRightRadius: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 10,
    elevation: 10,
    paddingBottom: 8,
  },
  section: {
    paddingTop: 4,
  },
  sectionTitle: {
    fontSize: 12,
    fontWeight: "700",
    color: "#9CA3AF",
    letterSpacing: 0.5,
    textTransform: "uppercase",
    paddingHorizontal: 16,
    paddingVertical: 8,
    backgroundColor: "#F9FAFB",
  },

  /* Text suggestion rows (like Blinkit) */
  textRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 13,
    paddingHorizontal: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
  },
  searchIconBox: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#F3F4F6',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  textName: {
    flex: 1,
    fontSize: 15,
    fontWeight: '500',
    color: '#374151',
  },

  /* Product rows */
  productRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
  },
  imageContainer: {
    width: 44,
    height: 44,
    borderRadius: 10,
    backgroundColor: '#F9FAFB',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
    borderWidth: 1,
    borderColor: '#F3F4F6',
  },
  image: {
    width: 34,
    height: 34,
    resizeMode: 'contain',
  },
  info: {
    flex: 1,
  },
  productName: {
    fontSize: 14,
    fontWeight: '600',
    color: '#111827',
  },
  productUnit: {
    fontSize: 12,
    color: '#9CA3AF',
    marginTop: 1,
  },
  productPrice: {
    fontSize: 14,
    fontWeight: '700',
    color: '#0A8754',
  },

  /* View all button */
  viewAllBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 14,
    marginHorizontal: 16,
    marginTop: 8,
    borderRadius: 12,
    backgroundColor: '#ECFDF5',
    borderWidth: 1,
    borderColor: '#D1FAE5',
  },
  viewAllText: {
    fontSize: 14,
    fontWeight: '700',
    color: '#0A8754',
    marginRight: 6,
  },

  /* Empty */
  emptyState: {
    padding: 30,
    alignItems: 'center',
  },
  emptyText: {
    marginTop: 10,
    fontSize: 14,
    color: '#9CA3AF',
  },
});
