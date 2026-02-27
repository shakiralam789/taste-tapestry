"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Layout } from "@/components/layout/Layout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Sparkles } from "lucide-react";
import { createAlbum } from "@/features/albums/api";
import { CoverImageField } from "@/components/ui/cover-image-field";

export default function CreateAlbumPage() {
  const router = useRouter();
  const queryClient = useQueryClient();
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [coverImage, setCoverImage] = useState("");

  const { mutateAsync, isPending: submitting } = useMutation({
    mutationFn: createAlbum,
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ["albums"] });
    },
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;

    await mutateAsync({
      name: name.trim(),
      description: description.trim() || undefined,
      coverImage: coverImage.trim() || undefined,
      favoriteIds: [],
    });
    router.push("/albums");
  };

  return (
    <Layout>
      <div className="min-h-screen py-10">
        <div className="container mx-auto px-4 max-w-4xl">
          <div className="flex items-center gap-3 mb-6">
            <div className="w-9 h-9 rounded-full bg-primary/10 flex items-center justify-center">
              <Sparkles className="w-5 h-5 text-primary" />
            </div>
            <div>
              <h1 className="font-display text-2xl md:text-3xl font-bold">
                Create a new album
              </h1>
              <p className="text-sm text-muted-foreground">
                Give it a name, a vibe, and fill it with the movies, series,
                songs, and books you love.
              </p>
            </div>
          </div>

          <form
            onSubmit={handleSubmit}
            className="space-y-8 rounded-2xl border border-white/10 bg-card/40 p-6 md:p-8"
          >
            {/* Basic info + cover image */}
            <div className="grid grid-cols-1 gap-6">
              <div className="space-y-4">
                <div className="space-y-2">
                  <label className="text-sm font-medium">Album name</label>
                  <Input
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="Comfort watchlist, Healing songs, Cozy reads..."
                    required
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium">Description</label>
                  <Textarea
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    placeholder="Optional: explain the vibe or story behind this album."
                    rows={4}
                  />
                </div>
              </div>

              <div className="space-y-3">
                <label className="text-sm font-medium flex items-center gap-2">
                  Cover image
                  <span className="text-[11px] text-muted-foreground font-normal">
                    Optional
                  </span>
                </label>
                <CoverImageField
                  image={coverImage}
                  onImageChange={setCoverImage}
                />
              </div>
            </div>

            <div className="flex justify-end gap-3 pt-2">
              <Button
                type="button"
                variant="ghost"
                className="rounded-full"
                onClick={() => router.back()}
              >
                Cancel
              </Button>
              <Button
                type="submit"
                disabled={submitting || !name.trim()}
                className="rounded-full"
              >
                {submitting ? "Creating..." : "Create album"}
              </Button>
            </div>
          </form>
        </div>
      </div>
    </Layout>
  );
}

