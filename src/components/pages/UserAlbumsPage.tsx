"use client";

import Link from "next/link";
import { useQuery } from "@tanstack/react-query";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { AlbumCard } from "@/components/albums/AlbumCard";
import { FullScreenLoader } from "@/components/ui/full-screen-loader";
import { getPublicProfile, getPublicAlbums } from "@/features/users/api";
import { ArrowLeft, Images } from "lucide-react";
import { ClientOnly } from "@/components/common/ClientOnly";

const staggerDelay = 0.08;

type UserAlbumsPageProps = { id: string };

function UserAlbumsPageInner({ id }: UserAlbumsPageProps) {
  const { data: profile, isLoading: profileLoading } = useQuery({
    queryKey: ["user-profile", id],
    queryFn: () => getPublicProfile(id),
    enabled: !!id,
  });

  const { data: albums = [], isLoading: albumsLoading } = useQuery({
    queryKey: ["user-albums", id],
    queryFn: () => getPublicAlbums(id),
    enabled: !!id && !!profile,
  });

  if (profileLoading && !profile) {
    return <FullScreenLoader />;
  }

  const displayName =
    profile?.displayName?.trim() || profile?.username?.trim() || "User";

  if (!profile) {
    return (
      <>
        <div className="min-h-screen flex flex-col items-center justify-center gap-4">
          <p className="text-lg text-muted-foreground">User not found.</p>
          <Link href="/profile">
            <Button variant="outline">
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back
            </Button>
          </Link>
        </div>
      </>
    );
  }

  return (
    <>
      <div className="min-h-screen py-12 px-8">
        <div className="container mx-auto px-4">
          <div className="mb-6 flex items-center gap-4">
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
            <div className="flex-1">
              <h1 className="font-display text-3xl font-bold">
                {displayName}&apos;s Albums
              </h1>
              <p className="text-muted-foreground text-sm mt-1">
                Albums by {displayName}
              </p>
            </div>
          </div>

          {albumsLoading ? (
            <div className="flex justify-center py-16 text-sm text-muted-foreground">
              Loading albums...
            </div>
          ) : albums.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16 px-4 rounded-2xl border border-dashed border-white/10 bg-card/20 text-center">
              <Images className="w-12 h-12 text-muted-foreground mb-3 opacity-50" />
              <p className="text-muted-foreground text-sm">No albums yet.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {albums.map((album, index) => (
                <motion.div
                  key={album.id}
                  initial={{ opacity: 0, y: 14 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{
                    delay: index * staggerDelay,
                    duration: 0.25,
                  }}
                >
                  <Link href={`/albums/${album.id}`} className="block h-full">
                    <AlbumCard album={album} />
                  </Link>
                </motion.div>
              ))}
            </div>
          )}
        </div>
      </div>
    </>
  );
}

export default function UserAlbumsPage(props: UserAlbumsPageProps) {
  return (
    <ClientOnly>
      <UserAlbumsPageInner {...props} />
    </ClientOnly>
  );
}
