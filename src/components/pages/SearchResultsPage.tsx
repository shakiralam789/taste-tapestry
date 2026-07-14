"use client";

import { useState, useMemo, Suspense } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { useQuery, useQueries } from "@tanstack/react-query";
import { motion } from "framer-motion";
import { Layout } from "@/components/layout/Layout";
import { FavoriteCard } from "@/components/favorites/FavoriteCard";
import { CategoryChip } from "@/components/categories/CategoryChip";
import { Button } from "@/components/ui/button";
import { Search, Loader2, X } from "lucide-react";
import { CATEGORY_TABS } from "@/features/albums/constants";
import { globalSearchItems } from "@/features/users/api";
import { getFavorite } from "@/features/favorites/api";
import type { Favorite } from "@/types/wishbook";

function SearchResultsContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  // The header navbar owns the search input. This page only reads `?q=` from
  // the URL and renders the active term as a read-only pill. Editing the
  // query happens in the global header.
  const activeQuery = searchParams?.get("q") ?? "";
  const [selectedCategory, setSelectedCategory] = useState<string>("all");

  const { data: searchResults, isLoading: isSearchLoading } = useQuery({
    queryKey: ["search", "items", activeQuery],
    queryFn: () => globalSearchItems(activeQuery),
    enabled: !!activeQuery,
  });

  const searchResultItems = useMemo(() => {
    if (!searchResults) return [];
    const filtered = selectedCategory === "all" 
      ? searchResults 
      : searchResults.filter(r => r.categoryId === selectedCategory);
    return filtered.flatMap(r => r.users.map(u => ({
      favoriteId: u.favoriteId,
      authorOverride: {
        name: u.displayName || u.username,
        username: u.username,
        avatar: u.avatar
      },
      matchPercentage: u.similarityScore
    })));
  }, [searchResults, selectedCategory]);

  const favoriteQueries = useQueries({
    queries: searchResultItems.map(item => ({
      queryKey: ["favorite", item.favoriteId],
      queryFn: () => getFavorite(item.favoriteId),
      staleTime: 1000 * 60 * 5,
    }))
  });

  const isFavoritesLoading = favoriteQueries.some(q => q.isLoading);
  const fetchedFavorites = favoriteQueries
    .map((q, index) => {
      if (!q.data) return null;
      return {
        favorite: q.data as Favorite,
        meta: searchResultItems[index]
      };
    })
    .filter(Boolean) as { favorite: Favorite; meta: typeof searchResultItems[0] }[];

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: { staggerChildren: 0.08 },
    },
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: { opacity: 1, y: 0 },
  };

  return (
    <Layout>
      <div className="min-h-screen py-8 md:py-12 max-w-7xl mx-auto px-4 sm:px-6">
        {/* Header & active-query pill */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center md:mb-10 mb-6"
        >
          <h1 className="font-display text-3xl md:text-5xl font-bold mb-3 tracking-tight">
            Search <span className="gradient-text">Results</span>
          </h1>

          {activeQuery ? (
            <div className="inline-flex items-center gap-2 mt-2 px-4 py-1.5 rounded-full bg-primary/10 border border-primary/20 text-sm">
              <Search className="w-3.5 h-3.5 text-primary" />
              <span className="text-foreground/80">
                Showing results for <span className="font-semibold text-primary">&ldquo;{activeQuery}&rdquo;</span>
              </span>
              <button
                type="button"
                onClick={() => router.push("/search")}
                aria-label="Clear search"
                className="ml-1 rounded-full p-1 hover:bg-primary/20 text-muted-foreground hover:text-foreground transition-colors"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            </div>
          ) : (
            <p className="text-sm text-muted-foreground">
              Type a query in the search bar above to find favorites.
            </p>
          )}
        </motion.div>

        {/* Categories */}
        {activeQuery && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="flex flex-wrap justify-center items-center gap-2 md:gap-3 py-1 md:mb-6 mb-4 px-1"
          >
            {CATEGORY_TABS.map((category) => {
              const Icon = "icon" in category ? category.icon : undefined;
              return (
                <CategoryChip
                  key={category.value}
                  category={{
                    id: category.value,
                    name: category.label,
                    icon: Icon ? <Icon className="w-4 h-4" /> : "✨",
                    color: "primary",
                    isDefault: true,
                  }}
                  isSelected={selectedCategory === category.value}
                  onClick={() => setSelectedCategory(category.value)}
                />
              );
            })}
          </motion.div>
        )}

        {/* Results */}
        {activeQuery ? (
          isSearchLoading || isFavoritesLoading ? (
            <div className="flex flex-col items-center justify-center py-20 text-muted-foreground">
              <Loader2 className="w-8 h-8 animate-spin mb-4 text-primary" />
              <p>Searching the cosmos...</p>
            </div>
          ) : fetchedFavorites.length > 0 ? (
            <motion.div
              variants={containerVariants}
              initial="hidden"
              animate="visible"
              className="flex flex-col gap-6 max-w-2xl mx-auto"
            >
              {fetchedFavorites.map(({ favorite, meta }) => (
                <motion.div key={favorite.id} variants={itemVariants}>
                  <FavoriteCard 
                    favorite={favorite} 
                    onClick={() => router.push(`/favorites/${favorite.id}`)}
                    authorOverride={meta.authorOverride}
                    matchPercentage={meta.matchPercentage}
                    showSaveButton
                  />
                </motion.div>
              ))}
            </motion.div>
          ) : (
            <div className="text-center py-20">
              <div className="w-24 h-24 mx-auto mb-6 rounded-full bg-card flex items-center justify-center border border-white/5">
                <Search className="w-10 h-10 text-muted-foreground" />
              </div>
              <h3 className="font-display text-2xl font-bold mb-2">
                No results found
              </h3>
              <p className="text-muted-foreground">
                Try adjusting your search or filters to explore the cosmos.
              </p>
            </div>
          )
        ) : (
          <div className="text-center py-20 text-muted-foreground">
            Enter a search term above to begin.
          </div>
        )}
      </div>
    </Layout>
  );
}

export default function SearchResultsPage() {
  return (
    <Suspense fallback={<Layout><div className="min-h-screen flex items-center justify-center"><Loader2 className="w-8 h-8 animate-spin text-primary" /></div></Layout>}>
      <SearchResultsContent />
    </Suspense>
  );
}
