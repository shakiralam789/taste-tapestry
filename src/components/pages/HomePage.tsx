"use client";

import { Layout } from "@/components/layout/Layout";
import { FavoriteCard } from "@/components/favorites/FavoriteCard";
import { useWishbook } from "@/contexts/WishbookContext";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { useSearchParams } from "next/navigation";

export default function HomePage() {
  const { favorites } = useWishbook();
  const searchParams = useSearchParams();
  const selectedCategory = searchParams?.get("category") || null;

  const filteredFavorites =
    !selectedCategory || selectedCategory === "all"
      ? favorites
      : favorites.filter((f) => f.categoryId === selectedCategory);

  return (
    <Layout className="px-0 md:px-0 pt-0 md:pt-0">
      <div className="min-h-screen">
        <div className="max-w-3xl mx-auto md:px-4 pt-4">
          {/* Create Post Input (Desktop) */}
          <div className="px-4 md:px-0 mb-4 relative group">
            <Link href="/add-favorite">
              <div className="flex gap-4 p-4 bg-card/30 rounded-xl shadow-sm border border-white/5 cursor-text hover:bg-card/50 transition-colors">
                <div className="flex-1 text-muted-foreground pt-2 md:text-base text-sm">
                  Share your taste with the universe...
                </div>
                <Button size="sm">Post</Button>
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
