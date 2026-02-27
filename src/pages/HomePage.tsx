"use client";

import { useState } from "react";
import { Layout } from "@/components/layout/Layout";
import { FavoriteCard } from "@/components/favorites/FavoriteCard";
import { CategoryChip } from "@/components/categories/CategoryChip";
import { useWishbook } from "@/contexts/WishbookContext";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { CATEGORY_TABS } from "@/features/albums/constants";

export default function HomePage() {
  const { favorites } = useWishbook();
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);

  const filteredFavorites = selectedCategory
    ? favorites.filter((f) => f.categoryId === selectedCategory)
    : favorites;

  return (
    <Layout className="px-0 md:px-0 pt-0 md:pt-0">
      <div className="min-h-screen">
        {/* Header / Tabs */}
        <header className="sticky top-0 z-30 bg-background/80 backdrop-blur-md border-b border-black/10 dark:border-white/5 px-4 mb-4 md:mx-0">
          {/* Categories Filter */}
          <div className="flex justify-center items-center gap-1.5 md:gap-2 overflow-x-auto pb-3 scrollbar-hide -mx-4 px-4 py-3">
           
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
          </div>
        </header>
        <div className="max-w-2xl mx-auto md:px-4">
          {/* Create Post Input (Desktop) */}
          <div className="px-4 md:px-0 mb-4 md:mb-6 relative group">
            <Link href="/add-favorite">
              <div className="flex gap-4 p-4 bg-card/30 rounded-xl shadow-sm border border-white/5 cursor-text hover:bg-card/50 transition-colors">
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
