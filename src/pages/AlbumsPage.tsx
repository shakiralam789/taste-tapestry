"use client";

import { motion } from "framer-motion";
import Link from "next/link";
import { useQuery } from "@tanstack/react-query";
import { Layout } from "@/components/layout/Layout";
import { Button } from "@/components/ui/button";
import { AlbumCard } from "@/components/albums/AlbumCard";
import { Images, Plus, Sparkles } from "lucide-react";
import { getAlbums } from "@/features/albums/api";

export default function AlbumsPage() {
  const {
    data: albums = [],
    isLoading: albumsLoading,
    isError: albumsError,
  } = useQuery({
    queryKey: ["albums"],
    queryFn: getAlbums,
  });

  const staggerDelay = 0.08;

  return (
    <Layout>
      <div className="min-h-screen py-12">
        <div className="container mx-auto px-4">
          {/* Header */}
          <motion.div
            initial={{ opacity: 0, y: -16 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-center mb-10"
          >
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/10 text-primary mb-4">
              <Images className="w-4 h-4" />
              <span className="text-sm font-medium">
                Curate albums of your taste
              </span>
            </div>
            <h1 className="font-display text-4xl md:text-5xl font-bold mb-3">
              Your <span className="gradient-text">Albums</span>
            </h1>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
              Group any mix of movies, series, songs, and books into beautiful
              themed albums you can revisit and share.
            </p>
          </motion.div>

          {/* Action Bar */}
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.08 }}
            className="flex justify-center mb-10"
          >
            <Link href="/create-album">
              <Button variant="gradient" size="lg" className="rounded-full">
                <Plus className="w-5 h-5" />
                Create New Album
              </Button>
            </Link>
          </motion.div>

          {/* Albums Grid / Empty State */}
          {albumsLoading ? (
            <div className="flex justify-center py-16 text-sm text-muted-foreground">
              Loading albums...
            </div>
          ) : albumsError ? (
            <div className="flex justify-center py-16 text-sm text-red-400">
              We couldn&apos;t load your albums right now.
            </div>
          ) : albums.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {albums.map((album, index) => (
                <motion.div
                  key={album.id}
                  initial={{ opacity: 0, y: 14 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * staggerDelay, duration: 0.25 }}
                >
                  <Link href={`/albums/${album.id}`} className="block">
                    <AlbumCard album={album} />
                  </Link>
                </motion.div>
              ))}

              {/* Add new card */}
              <motion.div
                initial={{ opacity: 0, y: 14 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{
                  delay: albums.length * staggerDelay,
                  duration: 0.25,
                }}
              >
                <Link href="/create-album">
                  <div className="group h-full rounded-2xl border-2 border-dashed border-white/10 hover:border-primary/40 bg-card/30 flex flex-col items-center justify-center gap-4 px-6 py-8 cursor-pointer transition-colors">
                    <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center group-hover:bg-primary/20 transition-colors">
                      <Plus className="w-6 h-6 text-primary" />
                    </div>
                    <div className="text-center">
                      <p className="font-semibold">Start a new album</p>
                      <p className="text-sm text-muted-foreground">
                        Combine any favorites into a themed collection.
                      </p>
                    </div>
                  </div>
                </Link>
              </motion.div>
            </div>
          ) : (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.12 }}
              className="max-w-xl mx-auto text-center rounded-2xl border border-dashed border-white/10 bg-card/30 px-8 py-10"
            >
              <div className="mx-auto mb-4 w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center">
                <Sparkles className="w-6 h-6 text-primary" />
              </div>
              <h2 className="font-display text-xl font-semibold mb-2">
                No albums yet
              </h2>
              <p className="text-sm text-muted-foreground mb-5">
                Create your first album to bundle your comfort movies, favorite
                series, healing songs, and unforgettable books in one place.
              </p>
              <Link href="/create-album">
                <Button variant="gradient" className="rounded-full">
                  <Plus className="w-4 h-4 mr-1" />
                  Create an album
                </Button>
              </Link>
            </motion.div>
          )}
        </div>
      </div>
    </Layout>
  );
}

