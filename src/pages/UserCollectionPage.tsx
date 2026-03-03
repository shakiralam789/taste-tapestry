"use client";

import { useEffect, useRef, useState, useCallback } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { useRouter } from "nextjs-toploader/app";
import {
  useInfiniteQuery,
  useQuery,
  keepPreviousData,
} from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { FullScreenLoader } from "@/components/ui/full-screen-loader";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { getPublicFavoritesPage, getPublicProfile } from "@/features/users/api";
import { CATEGORY_TABS } from "@/features/albums/constants";
import { ProfilePostCard } from "@/components/profile/ProfilePostCard";
import { ArrowLeft, Images, Loader2, Search } from "lucide-react";
import { ClientOnly } from "@/components/common/ClientOnly";

const SEARCH_DEBOUNCE_MS = 300;

type UserCollectionPageProps = { id: string };

function UserCollectionPageInner({ id }: UserCollectionPageProps) {
  const searchParams = useSearchParams();
  const [activeTab, setActiveTab] =
    useState<(typeof CATEGORY_TABS)[number]["value"]>("all");
  const [searchInput, setSearchInput] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const loadMoreRef = useRef<HTMLDivElement>(null);
  const router = useRouter();
  const categoryFromUrl = searchParams?.get("category") ?? null;
  useEffect(() => {
    if (
      categoryFromUrl &&
      CATEGORY_TABS.some((t) => t.value === categoryFromUrl)
    ) {
      setActiveTab(categoryFromUrl as (typeof CATEGORY_TABS)[number]["value"]);
    }
  }, [categoryFromUrl]);

  useEffect(() => {
    const t = setTimeout(() => {
      setDebouncedSearch(searchInput.trim());
    }, SEARCH_DEBOUNCE_MS);
    return () => clearTimeout(t);
  }, [searchInput]);

  const categoryParam = activeTab === "all" ? undefined : activeTab;

  const { data: profile } = useQuery({
    queryKey: ["user-profile", id],
    queryFn: () => getPublicProfile(id),
    enabled: !!id,
  });

  const {
    data: infiniteData,
    isLoading,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
  } = useInfiniteQuery({
    queryKey: ["user-favorites-page", id, activeTab, debouncedSearch],
    queryFn: ({ pageParam }) =>
      getPublicFavoritesPage(
        id,
        pageParam as number,
        categoryParam,
        debouncedSearch || undefined,
      ),
    getNextPageParam: (lastPage) =>
      lastPage.hasMore ? lastPage.nextOffset : undefined,
    initialPageParam: 0,
    enabled: !!id,
    placeholderData: keepPreviousData,
  });

  const allItems = infiniteData?.pages.flatMap((p) => p.items) ?? [];

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
    const url = new URL(window.location.href);
    if (value === "all") url.searchParams.delete("category");
    else url.searchParams.set("category", value);
    window.history.replaceState({}, "", url.pathname + url.search);
  }, []);

  const displayName =
    profile?.displayName?.trim() || profile?.username?.trim() || "User";

  if (isLoading && allItems.length === 0) {
    return (
      <>
        <div className="min-h-screen flex items-center justify-center">
          <FullScreenLoader />
        </div>
      </>
    );
  }

  return (
    <>
      <div className="min-h-screen py-8 px-8">
        <div className="container mx-auto px-4">
          <div className="mb-6 flex items-end justify-between gap-4">
            <div className="flex flex-wrap items-center gap-4">
              <Link href={`/users/${id}`}>
                <Button
                  variant="ghost"
                  size="icon"
                  className="rounded-full border border-border/60 shadow-sm"
                  aria-label="Back to profile"
                >
                  <ArrowLeft className="w-4 h-4" />
                </Button>
              </Link>
              <div className="flex-1 min-w-0">
                <h1 className="font-display text-2xl md:text-3xl font-bold">
                  {displayName}&apos;s Collection
                </h1>
                <p className="text-muted-foreground text-sm mt-0.5">
                  All their favorites with filters and search
                </p>
              </div>
            </div>
              <Link href={`/users/${id}/albums`}>
                <Button
                  variant="outline"
                  size="sm"
                  className="rounded-full gap-2"
                >
                  <Images className="w-4 h-4" />
                  View albums
                </Button>
              </Link>
          </div>

          <div className="relative mb-4">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              type="search"
              placeholder="Search by title..."
              value={searchInput}
              onChange={(e) => setSearchInput(e.target.value)}
              className="pl-9 rounded-full bg-muted/50 border-white/10"
              aria-label="Search collection"
            />
          </div>

          <Tabs
            value={activeTab}
            onValueChange={handleTabChange}
            className="w-full"
          >
            <TabsList className="w-full justify-start flex-wrap bg-transparent border-b border-white/10 p-0 h-auto rounded-none gap-0">
              {CATEGORY_TABS.map((tab) => {
                const Icon = "icon" in tab ? tab.icon : undefined;
                return (
                  <TabsTrigger
                    key={tab.value}
                    value={tab.value}
                    className="rounded-none border-b-2 border-transparent px-0 py-4 mr-6 data-[state=active]:bg-transparent data-[state=active]:border-primary data-[state=active]:text-primary data-[state=active]:shadow-none hover:text-primary transition-colors text-sm gap-1.5"
                  >
                    {Icon ? <Icon className="w-4 h-4" /> : null}
                    {tab.label}
                  </TabsTrigger>
                );
              })}
            </TabsList>

            <TabsContent value={activeTab} className="mt-6">
              {allItems.length === 0 ? (
                <div className="rounded-2xl border border-dashed border-white/10 bg-card/20 p-12 text-center text-muted-foreground text-sm">
                  {debouncedSearch
                    ? "No items match your search."
                    : activeTab === "all"
                      ? "No items in their collection yet."
                      : `No ${CATEGORY_TABS.find((c) => c.value === activeTab)?.label ?? activeTab} in their collection.`}
                </div>
              ) : (
                <>
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                    {allItems.map((favorite) => (
                      <div
                        key={favorite.id}
                        className="block"
                      >
                        <ProfilePostCard favorite={favorite} variant="grid" onTitleClick={() => router.push(`/favorites/${favorite.id}`)} />
                      </div>
                    ))}
                  </div>
                  <div
                    ref={loadMoreRef}
                    className="min-h-12 flex items-center justify-center py-6"
                  >
                    {isFetchingNextPage && (
                      <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
                    )}
                  </div>
                </>
              )}
            </TabsContent>
          </Tabs>
        </div>
      </div>
    </>
  );
}

export default function UserCollectionPage(props: UserCollectionPageProps) {
  return (
    <ClientOnly>
      <UserCollectionPageInner {...props} />
    </ClientOnly>
  );
}
