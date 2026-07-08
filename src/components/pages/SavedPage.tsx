"use client";

import { useCallback, useEffect, useRef, useState, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useInfiniteQuery } from "@tanstack/react-query";
import { motion } from "framer-motion";
import Link from "next/link";
import { Layout } from "@/components/layout/Layout";
import { FavoriteCard } from "@/components/favorites/FavoriteCard";
import { CategoryChip } from "@/components/categories/CategoryChip";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Bookmark, Loader2, Search } from "lucide-react";
import { CATEGORY_TABS } from "@/features/albums/constants";
import { getSavedFavoritesPage } from "@/features/saved/api";
import { useAuth } from "@/features/auth/AuthContext";

const SEARCH_DEBOUNCE_MS = 300;

function SavedPageContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { user } = useAuth();
  const loadMoreRef = useRef<HTMLDivElement>(null);

  const initialCategory = searchParams?.get("category") ?? "all";
  const initialSearch = searchParams?.get("q") ?? "";

  const [activeTab, setActiveTab] =
    useState<(typeof CATEGORY_TABS)[number]["value"]>(
      CATEGORY_TABS.some((t) => t.value === initialCategory)
        ? (initialCategory as (typeof CATEGORY_TABS)[number]["value"])
        : "all",
    );
  const [searchInput, setSearchInput] = useState(initialSearch);
  const [debouncedSearch, setDebouncedSearch] = useState(initialSearch);

  useEffect(() => {
    const t = setTimeout(() => {
      setDebouncedSearch(searchInput.trim());
    }, SEARCH_DEBOUNCE_MS);
    return () => clearTimeout(t);
  }, [searchInput]);

  useEffect(() => {
    const url = new URL(window.location.href);
    if (activeTab === "all") url.searchParams.delete("category");
    else url.searchParams.set("category", activeTab);
    if (debouncedSearch) url.searchParams.set("q", debouncedSearch);
    else url.searchParams.delete("q");
    window.history.replaceState({}, "", url.pathname + url.search);
  }, [activeTab, debouncedSearch]);

  const categoryParam = activeTab === "all" ? undefined : activeTab;

  const {
    data,
    isLoading,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
  } = useInfiniteQuery({
    queryKey: ["saved", "page", activeTab, debouncedSearch],
    queryFn: ({ pageParam }) =>
      getSavedFavoritesPage(
        pageParam as number,
        categoryParam,
        debouncedSearch || undefined,
      ),
    getNextPageParam: (lastPage) =>
      lastPage.hasMore ? lastPage.nextOffset : undefined,
    initialPageParam: 0,
    enabled: !!user,
  });

  const savedItems = data?.pages.flatMap((p) => p.items) ?? [];

  useEffect(() => {
    const el = loadMoreRef.current;
    if (!el || !hasNextPage || isFetchingNextPage) return;
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0]?.isIntersecting) void fetchNextPage();
      },
      { rootMargin: "200px", threshold: 0.1 },
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, [hasNextPage, isFetchingNextPage, fetchNextPage]);

  const handleTabChange = useCallback((value: string) => {
    setActiveTab(value as (typeof CATEGORY_TABS)[number]["value"]);
  }, []);

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

  if (!user) {
    return (
      <Layout>
        <div className="min-h-screen flex flex-col items-center justify-center gap-4 px-4 text-center">
          <Bookmark className="w-12 h-12 text-muted-foreground" />
          <h1 className="font-display text-2xl font-bold">Sign in to view saved items</h1>
          <p className="text-muted-foreground max-w-md">
            Save favorites from search results and other people&apos;s collections to find them here later.
          </p>
          <Link href="/login">
            <Button>Sign in</Button>
          </Link>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="min-h-screen py-8 md:py-12 max-w-7xl mx-auto px-4 sm:px-6">
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center md:mb-10 mb-6"
        >
          <h1 className="font-display text-3xl md:text-5xl font-bold mb-3 tracking-tight">
            Saved <span className="gradient-text">Items</span>
          </h1>
          <p className="text-muted-foreground mb-6 max-w-lg mx-auto">
            Favorites you&apos;ve bookmarked from search and other collections.
          </p>

          <div className="max-w-2xl mx-auto">
            <div className="relative group">
              <div className="absolute inset-0 bg-primary/20 blur-xl rounded-full opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
              <Search className="z-10 absolute left-5 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground group-focus-within:text-primary transition-colors" />
              <Input
                placeholder="Search saved items..."
                value={searchInput}
                onChange={(e) => setSearchInput(e.target.value)}
                className="pl-14 h-14 md:text-lg text-base rounded-full border-2 bg-card/50 backdrop-blur-xl focus:border-primary/50 focus:ring-4 focus:ring-primary/10 transition-all shadow-lg"
              />
            </div>
          </div>
        </motion.div>

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
                isSelected={activeTab === category.value}
                onClick={() => handleTabChange(category.value)}
              />
            );
          })}
        </motion.div>

        {isLoading ? (
          <div className="flex flex-col items-center justify-center py-20 text-muted-foreground">
            <Loader2 className="w-8 h-8 animate-spin mb-4 text-primary" />
            <p>Loading saved items...</p>
          </div>
        ) : savedItems.length > 0 ? (
          <>
            <motion.div
              variants={containerVariants}
              initial="hidden"
              animate="visible"
              className="flex flex-col gap-6 max-w-2xl mx-auto"
            >
              {savedItems.map((item) => (
                <motion.div key={item.favorite.id} variants={itemVariants}>
                  <FavoriteCard
                    favorite={item.favorite}
                    showSaveButton
                    onClick={() => router.push(`/favorites/${item.favorite.id}`)}
                    authorOverride={{
                      name: item.author.displayName || item.author.username,
                      username: item.author.username,
                      avatar: item.author.avatar,
                    }}
                  />
                </motion.div>
              ))}
            </motion.div>

            <div ref={loadMoreRef} className="flex justify-center py-8">
              {isFetchingNextPage && (
                <Loader2 className="w-6 h-6 animate-spin text-primary" />
              )}
            </div>
          </>
        ) : (
          <div className="text-center py-20">
            <div className="w-24 h-24 mx-auto mb-6 rounded-full bg-card flex items-center justify-center border border-white/5">
              <Bookmark className="w-10 h-10 text-muted-foreground" />
            </div>
            <h3 className="font-display text-2xl font-bold mb-2">
              {debouncedSearch ? "No saved items match your search" : "Nothing saved yet"}
            </h3>
            <p className="text-muted-foreground mb-6 max-w-md mx-auto">
              {debouncedSearch
                ? "Try a different search term or category filter."
                : "Browse other people's collections and tap the bookmark icon on a card to save favorites here."}
            </p>
            {!debouncedSearch && (
              <Link href="/search">
                <Button variant="outline" className="rounded-full">
                  Explore favorites
                </Button>
              </Link>
            )}
          </div>
        )}
      </div>
    </Layout>
  );
}

export default function SavedPage() {
  return (
    <Suspense
      fallback={
        <Layout>
          <div className="min-h-screen flex items-center justify-center">
            <Loader2 className="w-8 h-8 animate-spin text-primary" />
          </div>
        </Layout>
      }
    >
      <SavedPageContent />
    </Suspense>
  );
}
