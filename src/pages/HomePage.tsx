"use client";
import { useState } from "react";
import { Layout } from "@/components/layout/Layout";
import { FavoriteCard } from "@/components/favorites/FavoriteCard";
import { CategoryChip } from "@/components/categories/CategoryChip";
import { useWishbook } from "@/contexts/WishbookContext";
import { Button } from "@/components/ui/button";
import { PenSquare } from "lucide-react";
import Link from "next/link";

export default function HomePage() {
  const { favorites, categories } = useWishbook();
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [feedType, setFeedType] = useState<"foryou" | "following">("foryou");

  const filteredFavorites = selectedCategory
    ? favorites.filter((f) => f.categoryId === selectedCategory)
    : favorites;

  return (
    <Layout className="px-0 md:px-0 pt-0 md:pt-0">
      <div className="min-h-screen">
        {/* Header / Tabs */}
        <header className="sticky top-0 z-30 bg-background/80 backdrop-blur-md border-b border-white/5 px-4 mb-4 md:rounded-xl md:mx-0">
          <div className="flex items-center justify-center pb-3 pt-3">
            <div className="flex gap-6">
              <button
                onClick={() => setFeedType("foryou")}
                className={`text-sm font-bold relative pb-2 transition-colors ${feedType === "foryou" ? "text-foreground" : "text-muted-foreground"}`}
              >
                For You
                {feedType === "foryou" && (
                  <div className="absolute bottom-0 left-0 right-0 h-1 bg-primary rounded-full" />
                )}
              </button>
              <button
                onClick={() => setFeedType("following")}
                className={`text-sm font-bold relative pb-2 transition-colors ${feedType === "following" ? "text-foreground" : "text-muted-foreground"}`}
              >
                Following
                {feedType === "following" && (
                  <div className="absolute bottom-0 left-0 right-0 h-1 bg-primary rounded-full" />
                )}
              </button>
            </div>
          </div>

          {/* Categories Filter */}
          <div className="flex justify-center items-center gap-1.5 md:gap-2 overflow-x-auto pb-3 scrollbar-hide -mx-4 px-4 py-1">
            <CategoryChip
              category={{
                id: "all",
                name: "All",
                icon: "✨",
                color: "primary",
                isDefault: true,
              }}
              isSelected={selectedCategory === null}
              onClick={() => setSelectedCategory(null)}
            />
            {categories.map((category) => (
              <CategoryChip
                key={category.id}
                category={category}
                isSelected={selectedCategory === category.id}
                onClick={() => setSelectedCategory(category.id)}
              />
            ))}
          </div>
        </header>
        <div className="max-w-2xl mx-auto md:px-4">
          {/* Create Post Input (Desktop) */}
          <div className="px-4 md:px-0 mb-4 md:mb-6 relative group">
            <Link href="/add-favorite">
              <div className="flex gap-4 p-4 bg-card/30 rounded-xl border border-white/5 cursor-text hover:bg-card/50 transition-colors">
                {/* <div className="w-10 h-10 rounded-full bg-gradient-cyber" /> */}
                <div className="flex-1 text-muted-foreground pt-2 md:text-base text-sm">
                  Share your taste with the universe...
                </div>
                <Button size="sm">
                  Post
                </Button>
              </div>
            </Link>
          </div>

          {/* Feed */}
          <div className="space-y-4 px-4 md:px-0">
            {filteredFavorites.length > 0 ? (
              filteredFavorites.map((favorite) => (
                <FavoriteCard key={favorite.id} favorite={favorite} />
              ))
            ) : (
              <div className="text-center py-20 text-muted-foreground">
                <p>No favorites found in this category.</p>
                <Link
                  href="/add-favorite"
                  className="text-primary hover:underline"
                >
                  Create a post
                </Link>
              </div>
            )}
          </div>
        </div>
      </div>
    </Layout>
  );
}
