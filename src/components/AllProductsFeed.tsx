import React, { useEffect, useState, useCallback } from "react";
import {
    View,
    Text,
    StyleSheet,
    ActivityIndicator,
    TouchableOpacity,
} from "react-native";
import { getProducts } from "../services/api/products";
import ProductCard from "./ProductCard";
import ProductFilterBar, { SortOption, PRICE_RANGES } from "./ProductFilterBar";
import SkeletonCard from "./SkeletonCard";

interface Props {
    categoryFilter?: string; // Passed from HomeScreen CategoryTabs
}

const AllProductsFeed = ({ categoryFilter = "All" }: Props) => {
    const [allProducts, setAllProducts] = useState<any[]>([]);
    const [displayed, setDisplayed] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [sortBy, setSort] = useState<SortOption>("default");
    const [priceRange, setPrice] = useState(PRICE_RANGES[0]);

    useEffect(() => {
        loadProducts();
    }, []);

    // Re-apply filters whenever input props or local filter state changes
    useEffect(() => {
        applyFilters(categoryFilter, sortBy, priceRange, allProducts);
    }, [categoryFilter, sortBy, priceRange, allProducts]);

    const loadProducts = async () => {
        setLoading(true);
        try {
            const data = await getProducts();
            const shuffled = data.sort(() => Math.random() - 0.5);
            setAllProducts(shuffled);
            setDisplayed(shuffled);
        } catch (e) {
            console.error("Error loading products feed:", e);
        } finally {
            setLoading(false);
        }
    };

    const applyFilters = useCallback((
        catFilter: string,
        sort: SortOption,
        range: typeof PRICE_RANGES[0],
        base: any[]
    ) => {
        let result = [...base];

        // Category filter from CategoryTabs
        if (catFilter && catFilter !== "All") {
            const f = catFilter.toLowerCase();
            result = result.filter(p =>
                (p.categoryName || "").toLowerCase().includes(f) ||
                (p.subCategoryName || "").toLowerCase().includes(f) ||
                (p.name || "").toLowerCase().includes(f)
            );
        }

        // Price range filter
        if (range.max > 0) {
            result = result.filter(p => {
                const price = p.price ?? p.sellingPrice ?? 0;
                return price >= range.min && price <= range.max;
            });
        } else if (range.min > 0) {
            result = result.filter(p => (p.price ?? p.sellingPrice ?? 0) >= range.min);
        }

        // Sort
        if (sort === "price_asc") result.sort((a, b) => (a.price ?? 0) - (b.price ?? 0));
        if (sort === "price_desc") result.sort((a, b) => (b.price ?? 0) - (a.price ?? 0));
        if (sort === "name_asc") result.sort((a, b) => (a.name || "").localeCompare(b.name || ""));

        setDisplayed(result);
    }, []);

    if (loading && allProducts.length === 0) {
        return (
            <View style={styles.container}>
                <Text style={styles.title}>Explore More ✨</Text>
                <View style={styles.grid}>
                    {[1, 2, 3, 4].map((i) => (
                        <SkeletonCard key={i} />
                    ))}
                </View>
            </View>
        );
    }

    return (
        <View style={styles.container}>
            <Text style={styles.title}>Explore More ✨</Text>
            
            <ProductFilterBar
                activeSort={sortBy}
                activePriceRange={priceRange}
                onSortChange={setSort}
                onPriceChange={setPrice}
                itemCount={displayed.length}
            />

            {/* ── Product Grid ── */}
            {displayed.length === 0 ? (
                <View style={styles.empty}>
                    <Text style={{ fontSize: 36 }}>🔍</Text>
                    <Text style={styles.emptyText}>No products match your filters</Text>
                    <TouchableOpacity onPress={() => { setSort("default"); setPrice(PRICE_RANGES[0]); }}>
                        <Text style={styles.clearBtn}>Clear filters</Text>
                    </TouchableOpacity>
                </View>
            ) : (
                <View style={styles.grid}>
                    {displayed.map((item, index) => (
                        <View key={item.id?.toString() || index} style={{ width: "48%", marginBottom: 12 }}>
                            <ProductCard product={item} />
                        </View>
                    ))}
                </View>
            )}
        </View>
    );
};

export default AllProductsFeed;

const styles = StyleSheet.create({
    container: {
        paddingHorizontal: 0, // Let the filter bar handle its own padding
        marginTop: 20,
    },
    title: {
        fontSize: 18,
        fontWeight: "700",
        color: "#111",
        marginBottom: 5,
        paddingHorizontal: 16,
    },
    grid: {
        flexDirection: "row",
        flexWrap: "wrap",
        justifyContent: "space-between",
        paddingHorizontal: 16,
        marginTop: 10,
    },
    loader: {
        paddingVertical: 40,
        alignItems: "center",
    },
    empty: {
        alignItems: "center",
        paddingVertical: 40,
        gap: 8,
    },
    emptyText: {
        fontSize: 14,
        color: "#999",
        fontWeight: "600",
    },
    clearBtn: {
        fontSize: 13,
        color: "#0A8754",
        fontWeight: "700",
        marginTop: 4,
    },
});
