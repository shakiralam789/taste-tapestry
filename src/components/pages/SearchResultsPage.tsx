"use client";

import { useState, useMemo, useEffect, useRef, useCallback, Suspense } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { useQuery, useQueries } from "@tanstack/react-query";
import { motion } from "framer-motion";
import { Layout } from "@/components/layout/Layout";
import { FavoriteCard } from "@/components/favorites/FavoriteCard";
import { CategoryChip } from "@/components/categories/CategoryChip";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Search, Filter, Loader2 } from "lucide-react";
import { CATEGORY_TABS } from "@/features/albums/constants";
import { globalSearchItems, type GlobalSearchItemResult } from "@/features/users/api";
import { getFavorite } from "@/features/favorites/api";
import type { Favorite } from "@/types/wishbook";

function SearchResultsContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const initialQuery = searchParams?.get("q") ?? "";
  
  const [searchInput, setSearchInput] = useState(initialQuery);
  const [activeQuery, setActiveQuery] = useState(initialQuery);
  const [selectedCategory, setSelectedCategory] = useState<string>("all");

  // Autocomplete dropdown state
  const [dropdownResults, setDropdownResults] = useState<GlobalSearchItemResult[]>([]);
  const [dropdownSearching, setDropdownSearching] = useState(false);
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const searchBoxRef = useRef<HTMLDivElement>(null);
  const suppressDropdownRef = useRef(false);

  useEffect(() => {
    if (initialQuery !== activeQuery) {
      setSearchInput(initialQuery);
      setActiveQuery(initialQuery);
    }
  }, [initialQuery, activeQuery]);

  // Debounced live search for autocomplete
  const runDropdownSearch = useCallback(async (q: string) => {
    if (suppressDropdownRef.current) {
      suppressDropdownRef.current = false;
      return;
    }
    if (!q.trim()) {
      setDropdownResults([]);
      return;
    }
    setDropdownSearching(true);
    try {
      const list = await globalSearchItems(q);
      setDropdownResults(list);
      if (!suppressDropdownRef.current) {
        const isInputFocused = searchBoxRef.current?.contains(document.activeElement);
        if (isInputFocused) {
          setDropdownOpen(true);
        }
      }
    } catch {
      setDropdownResults([]);
    } finally {
      setDropdownSearching(false);
    }
  }, []);

  useEffect(() => {
    const t = setTimeout(() => runDropdownSearch(searchInput), 300);
    return () => clearTimeout(t);
  }, [searchInput, runDropdownSearch]);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (searchBoxRef.current && !searchBoxRef.current.contains(e.target as Node)) {
        setDropdownOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleSelectTitle = (title: string) => {
    suppressDropdownRef.current = true;
    setDropdownOpen(false);
    setDropdownResults([]);
    setSearchInput(title);
    setActiveQuery(title);
    router.push(`/search?q=${encodeURIComponent(title)}`);
  };

  const handleSearchSubmit = (e?: React.KeyboardEvent<HTMLInputElement>) => {
    if (e && e.key !== "Enter") return;
    const query = searchInput.trim();
    setDropdownOpen(false);
    setActiveQuery(query);
    if (query) {
      router.push(`/search?q=${encodeURIComponent(query)}`);
    } else {
      router.push(`/search`);
    }
  };

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
        {/* Header & Search Bar */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center md:mb-10 mb-6"
        >
          <h1 className="font-display text-3xl md:text-5xl font-bold mb-6 tracking-tight">
            Search <span className="gradient-text">Results</span>
          </h1>
          
          <div className="max-w-2xl mx-auto" ref={searchBoxRef}>
            <div className="relative group">
              <div className="absolute inset-0 bg-primary/20 blur-xl rounded-full opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
              <Search className="z-10 absolute left-5 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground group-focus-within:text-primary transition-colors" />
              <Input
                placeholder="Search favorites..."
                value={searchInput}
                onChange={(e) => setSearchInput(e.target.value)}
                onFocus={() => setDropdownOpen(true)}
                onKeyDown={handleSearchSubmit}
                className="pl-14 pr-14 h-14 md:text-lg text-base rounded-full border-2 bg-card/50 backdrop-blur-xl focus:border-primary/50 focus:ring-4 focus:ring-primary/10 transition-all shadow-lg"
              />
              <Button
                variant="ghost"
                size="icon"
                onClick={() => handleSearchSubmit()}
                className="absolute right-3 top-1/2 -translate-y-1/2 hover:bg-primary/10 hover:text-primary rounded-full w-10 h-10"
              >
                <Filter className="w-5 h-5" />
              </Button>

              {/* Autocomplete Dropdown */}
              {dropdownOpen && (searchInput.trim() || dropdownResults.length > 0) && (
                <div className="absolute top-full left-0 right-0 mt-2 p-1 rounded-xl bg-popover border border-border shadow-xl z-50 max-h-[60vh] overflow-y-auto">
                  {dropdownSearching ? (
                    <p className="px-3 py-4 text-sm text-muted-foreground text-center">Searching...</p>
                  ) : dropdownResults.length === 0 ? (
                    <p className="px-3 py-4 text-sm text-muted-foreground text-center">
                      {searchInput.trim() ? "No results found" : "Type to search favorites"}
                    </p>
                  ) : (
                    dropdownResults.map((res) => (
                      <button
                        key={`${res.categoryId}-${res.title}`}
                        type="button"
                        onClick={() => handleSelectTitle(res.title)}
                        className="w-full flex items-center justify-between gap-3 px-4 py-3 text-left rounded-lg hover:bg-muted transition-colors"
                      >
                        <div className="flex flex-col min-w-0">
                          <p className="font-medium text-sm truncate">{res.title}</p>
                          <p className="text-xs text-muted-foreground capitalize">{res.categoryId}</p>
                        </div>
                        <Search className="w-3.5 h-3.5 text-muted-foreground shrink-0" />
                      </button>
                    ))
                  )}
                </div>
              )}
            </div>
          </div>
        </motion.div>

        {/* Categories */}
        {activeQuery && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="flex justify-center items-center gap-2 md:gap-3 overflow-x-auto py-1 md:mb-6 mb-4 scrollbar-hide px-1"
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
