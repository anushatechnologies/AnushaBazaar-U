import React, { useEffect, useState, useCallback, useImperativeHandle, forwardRef } from "react";
import {
    View,
    Text,
    StyleSheet,
} from "react-native";
import { getProducts } from "../services/api/products";
import ProductCard from "./ProductCard";
import ProductFilterBar, { SortOption, PRICE_RANGES } from "./ProductFilterBar";
import SkeletonCard from "./SkeletonCard";
import { scale } from "../utils/responsive";

interface Props {
    categoryFilter?: string; // Passed from HomeScreen CategoryTabs
}

export interface AllProductsFeedHandle {
    loadMore: () => void;
    hasMore: () => boolean;
    isLoadingMore: () => boolean;
}

const PAGE_SIZE = 12;

const AllProductsFeed = forwardRef<AllProductsFeedHandle, Props>(({ categoryFilter = "All" }, ref) => {
    const [allProducts, setAllProducts] = useState<any[]>([]);
    const [displayed, setDisplayed] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [sortBy, setSort] = useState<SortOption>("default");
    const [priceRange, setPrice] = useState(PRICE_RANGES[0]);
<<<<<<< HEAD
=======
    const [displayLimit, setDisplayLimit] = useState(PAGE_SIZE);
    const [loadingMore, setLoadingMore] = useState(false);

    // Expose loadMore to parent via ref
    useImperativeHandle(ref, () => ({
        loadMore: () => {
            if (displayLimit < displayed.length && !loadingMore) {
                setLoadingMore(true);
                setDisplayLimit(prev => prev + PAGE_SIZE);
                setLoadingMore(false);
            }
        },
        hasMore: () => displayLimit < displayed.length,
        isLoadingMore: () => loadingMore,
    }));
>>>>>>> 8f07c6e (hello)

    useEffect(() => {
        loadProducts();
    }, []);

    // Re-apply filters whenever input props or local filter state changes
    useEffect(() => {
        applyFilters(categoryFilter, sortBy, priceRange, allProducts);
    }, [categoryFilter, sortBy, priceRange, allProducts]);

    const loadProducts = async () => {
        setLoading(true);
        const startedAt = Date.now();
        try {
            const data = await getProducts();
            const shuffled = data.sort(() => Math.random() - 0.5);
            setAllProducts(shuffled);
            setDisplayed(shuffled);
        } catch (e) {
            console.error("Error loading products feed:", e);
        } finally {
            const elapsed = Date.now() - startedAt;
            const remainingDelay = Math.max(0, 1000 - elapsed);
            setTimeout(() => setLoading(false), remainingDelay);
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
                const price = p.sellingPrice ?? p.price ?? 0;
                return price >= range.min && price <= range.max;
            });
        } else if (range.min > 0) {
            result = result.filter(p => (p.sellingPrice ?? p.price ?? 0) >= range.min);
        }

        // Sort
        if (sort === "price_asc") result.sort((a, b) => (a.sellingPrice ?? a.price ?? 0) - (b.sellingPrice ?? b.price ?? 0));
        if (sort === "price_desc") result.sort((a, b) => (b.sellingPrice ?? b.price ?? 0) - (a.sellingPrice ?? a.price ?? 0));
        if (sort === "name_asc") result.sort((a, b) => (a.name || "").localeCompare(b.name || ""));

        setDisplayed(result);
<<<<<<< HEAD
=======
        setDisplayLimit(PAGE_SIZE); // Reset count on filter change
>>>>>>> 8f07c6e (hello)
    }, []);

    if (loading && allProducts.length === 0) {
        return (
            <View style={styles.container}>
                <Text style={styles.title}>Explore More ✨</Text>
                <View style={styles.grid}>
                    {[1, 2, 3, 4, 5, 6].map((i) => (
                        <SkeletonCard key={i} />
                    ))}
                </View>
            </View>
        );
    }

    const visibleItems = displayed.slice(0, displayLimit);
    const hasMore = displayLimit < displayed.length;

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
<<<<<<< HEAD
                    {displayed.map((item, index) => (
=======
                    {visibleItems.map((item, index) => (
>>>>>>> 8f07c6e (hello)
                        <View 
                            key={item.id?.toString() || index} 
                            style={{ 
                                width: "31%", 
                                marginBottom: 12,
                                marginLeft: index % 3 !== 0 ? "3.5%" : 0
                            }}
                        >
                            <ProductCard product={item} />
                        </View>
                    ))}
<<<<<<< HEAD
=======

                    {/* Infinite scroll loading indicator */}
                    {loadingMore && (
                        <View style={styles.loadingMore}>
                            <ActivityIndicator size="small" color="#0A8754" />
                            <Text style={styles.loadingMoreText}>Loading more...</Text>
                        </View>
                    )}

                    {/* End-of-list message */}
                    {!hasMore && visibleItems.length > 0 && (
                        <View style={styles.endMessage}>
                            <Text style={styles.endEmoji}>🎉</Text>
                            <Text style={styles.endText}>You've seen all products!</Text>
                        </View>
                    )}
>>>>>>> 8f07c6e (hello)
                </View>
            )}
        </View>
    );
});

export default AllProductsFeed;

const styles = StyleSheet.create({
    container: {
        paddingHorizontal: 0,
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
        justifyContent: "flex-start",
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
<<<<<<< HEAD
=======
    loadingMore: {
        width: "100%",
        flexDirection: "row",
        justifyContent: "center",
        alignItems: "center",
        paddingVertical: scale(16),
        gap: scale(8),
    },
    loadingMoreText: {
        color: "#6B7280",
        fontSize: scale(13),
        fontWeight: "600",
    },
    endMessage: {
        width: "100%",
        alignItems: "center",
        paddingVertical: scale(20),
        gap: scale(4),
    },
    endEmoji: {
        fontSize: scale(24),
    },
    endText: {
        color: "#9CA3AF",
        fontSize: scale(13),
        fontWeight: "600",
    },
>>>>>>> 8f07c6e (hello)
});
