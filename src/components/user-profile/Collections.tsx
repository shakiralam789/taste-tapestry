import { CATEGORY_TABS } from "@/features/albums/constants";
import { getPublicFavorites, getPublicProfile } from "@/features/users/api";
import { useQuery } from "@tanstack/react-query";
import { useMemo, useState } from "react";
import { Button } from "../ui/button";
import Link from "next/link";
import {
  ArrowLeft,
  ChevronRight,
  Images,
  LayoutGrid,
  List,
} from "lucide-react";
import { ProfilePostCardSkeleton } from "../profile/ProfilePostCardSkeleton";
import { PROFILE_PREVIEW_LIMIT } from "@/features/favorites/api";
import { motion } from "framer-motion";
import { ProfilePostCard } from "../profile/ProfilePostCard";
import { useRouter } from "nextjs-toploader/app";
import { useParams } from "next/navigation";

const staggerDelay = 0.08;

export default function Collections() {
  const { id } = useParams<{ id: string | undefined }>();
  const router = useRouter();
  const {
    data: profile,
    isLoading: profileLoading,
    isError: profileError,
  } = useQuery({
    queryKey: ["user-profile", id],
    queryFn: () => getPublicProfile(id as string),
    enabled: !!id,
  });
  const { data: favorites = [], isLoading: favoritesLoading } = useQuery({
    queryKey: ["user-favorites", id],
    queryFn: () => getPublicFavorites(id as string),
    enabled: !!id && !!profile,
  });
  const [selectedCategoryFilter, setSelectedCategoryFilter] =
    useState<(typeof CATEGORY_TABS)[number]["value"]>("all");
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid");

  const filteredFavorites = useMemo(() => {
    if (selectedCategoryFilter === "all") return favorites;
    return favorites.filter((f) => f.categoryId === selectedCategoryFilter);
  }, [favorites, selectedCategoryFilter]);

  if (profileError || !profile) {
    return (
      <>
        <div className="min-h-screen flex flex-col items-center justify-center gap-4">
          <p className="text-lg text-muted-foreground">User not found.</p>
          <Link href="/profile">
            <Button variant="outline">
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back to profile
            </Button>
          </Link>
        </div>
      </>
    );
  }

  const displayName =
    profile?.displayName?.trim() || profile?.username?.trim() || "User";
  return (
    <>
      <div className="flex flex-col gap-4 mb-6">
        <div>
          <div className="flex items-center justify-between gap-2">
            <h3 className="text-2xl font-display font-bold">
              {displayName}&apos;s collection
            </h3>
            <Link href={`/users/${id}/albums`}>
              <Button
                type="button"
                variant="outline"
                size="sm"
                className="rounded-full"
              >
                <Images className="w-3.5 h-3.5" />
                Albums
              </Button>
            </Link>
          </div>

          <p className="text-muted-foreground text-sm">
            Movies, songs, books, places — their taste in one place.
          </p>
        </div>
        <div className="flex items-center justify-between gap-4 flex-wrap">
          <div className="flex flex-wrap gap-2">
            {CATEGORY_TABS.map((cat) => {
              const Icon = "icon" in cat ? cat.icon : undefined;
              return (
                <Button
                  key={cat.value}
                  type="button"
                  size="sm"
                  variant={
                    selectedCategoryFilter === cat.value ? "default" : "outline"
                  }
                  onClick={() => setSelectedCategoryFilter(cat.value)}
                  className={`rounded-full`}
                >
                  <span aria-hidden>
                    {Icon ? <Icon className="w-3.5 h-3.5" /> : null}
                  </span>
                  <span className="hidden sm:block">{cat.label}</span>
                </Button>
              );
            })}
          </div>
          <div className="hidden sm:inline-flex items-center gap-1 rounded-full border border-white/10 bg-card/60 px-0.5 py-0.5">
            <button
              type="button"
              onClick={() => setViewMode("grid")}
              className={`inline-flex items-center justify-center h-7 w-7 rounded-full text-xs ${
                viewMode === "grid"
                  ? "bg-primary/10 text-primary"
                  : "text-muted-foreground hover:bg-white/5"
              }`}
              aria-label="Grid view"
            >
              <LayoutGrid className="w-3.5 h-3.5" />
            </button>
            <button
              type="button"
              onClick={() => setViewMode("list")}
              className={`inline-flex items-center justify-center h-7 w-7 rounded-full text-xs ${
                viewMode === "list"
                  ? "bg-primary/10 text-primary"
                  : "text-muted-foreground hover:bg-white/5"
              }`}
              aria-label="List view"
            >
              <List className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      </div>

      {favoritesLoading ? (
        <div
          className={
            viewMode === "grid"
              ? "grid grid-cols-2 md:grid-cols-2 lg:grid-cols-3 gap-4"
              : "flex flex-col gap-3"
          }
        >
          {Array.from({ length: 3 }).map((_, idx) => (
            <ProfilePostCardSkeleton key={idx} variant={viewMode} />
          ))}
        </div>
      ) : filteredFavorites.length === 0 ? (
        <div className="col-span-full flex flex-col items-center justify-center py-16 px-4 rounded-2xl border border-dashed border-white/10 bg-card/20 text-center">
          <p className="text-muted-foreground text-sm mb-2">
            {selectedCategoryFilter === "all"
              ? "No items in their collection yet."
              : `No ${CATEGORY_TABS.find((c) => c.value === selectedCategoryFilter)?.label ?? selectedCategoryFilter} in their collection.`}
          </p>
        </div>
      ) : (
        <>
          <div
            className={
              viewMode === "grid"
                ? "grid grid-cols-2 md:grid-cols-2 lg:grid-cols-3 gap-4"
                : "flex flex-col gap-3"
            }
          >
            {filteredFavorites
              .slice(0, PROFILE_PREVIEW_LIMIT)
              .map((favorite, index) => (
                <motion.div
                  key={favorite.id}
                  initial={{ opacity: 0, y: 14 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{
                    delay: index * staggerDelay,
                    duration: 0.25,
                  }}
                  className={viewMode === "list" ? "w-full" : ""}
                >
                  <ProfilePostCard
                    favorite={favorite}
                    variant={viewMode}
                    onTitleClick={() =>
                      router.push(`/favorites/${favorite.id}`)
                    }
                  />
                </motion.div>
              ))}
          </div>
          {filteredFavorites.length > PROFILE_PREVIEW_LIMIT && (
            <div className="flex justify-center pt-4">
              <Link
                href={
                  selectedCategoryFilter === "all"
                    ? `/users/${id}/collection`
                    : `/users/${id}/collection?category=${selectedCategoryFilter}`
                }
              >
                <Button
                  variant="outline"
                  size="sm"
                  className="rounded-full gap-2"
                >
                  See all ({filteredFavorites.length})
                  <ChevronRight className="w-4 h-4" />
                </Button>
              </Link>
            </div>
          )}
        </>
      )}
    </>
  );
}
