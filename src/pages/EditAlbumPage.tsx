"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import type { AxiosError } from "axios";
import { toast } from "sonner";
import { Layout } from "@/components/layout/Layout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { FullScreenLoader } from "@/components/ui/full-screen-loader";
import { Pencil } from "lucide-react";
import { getAlbum, updateAlbum } from "@/features/albums/api";
import { CoverImageField } from "@/components/ui/cover-image-field";

export default function EditAlbumPage() {
  const params = useParams<{ id: string }>();
  const id = params?.id;
  const router = useRouter();
  const queryClient = useQueryClient();
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [coverImage, setCoverImage] = useState("");

  const {
    data: album,
    isLoading,
    isError,
  } = useQuery({
    queryKey: ["album", id],
    queryFn: () => getAlbum(typeof id === "string" ? id : ""),
    enabled: typeof id === "string",
  });

  useEffect(() => {
    if (album) {
      setName(album.name);
      setDescription(album.description ?? "");
      setCoverImage(album.coverImage ?? "");
    }
  }, [album]);

  const { mutateAsync, isPending: submitting } = useMutation({
    mutationFn: (payload: { name: string; description?: string; coverImage?: string }) =>
      updateAlbum(id as string, payload),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ["albums"] });
      void queryClient.invalidateQueries({ queryKey: ["album", id] });
    },
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !id) return;
    try {
      await mutateAsync({
        name: name.trim(),
        description: description.trim() || undefined,
        coverImage: coverImage.trim() || undefined,
      });
      toast.success("Album updated", {
        description: "Your changes have been saved.",
      });
      router.push("/albums");
    } catch (err) {
      const axiosError = err as AxiosError<{ message?: string }>;
      const message =
        axiosError.response?.data?.message ??
        "Could not update album. Please try again.";
      toast.error("Update failed", { description: message });
      throw err;
    }
  };

  if (isLoading || !album) {
    return <FullScreenLoader />;
  }

  if (isError) {
    return (
      <Layout>
        <div className="min-h-screen flex items-center justify-center">
          <p className="text-sm text-muted-foreground">
            We couldn&apos;t load this album to edit.
          </p>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="min-h-screen py-10">
        <div className="container mx-auto px-4 max-w-4xl">
          <div className="flex items-center gap-3 mb-6">
            <div className="w-9 h-9 rounded-full bg-primary/10 flex items-center justify-center">
              <Pencil className="w-5 h-5 text-primary" />
            </div>
            <div>
              <h1 className="font-display text-2xl md:text-3xl font-bold">
                Edit album
              </h1>
              <p className="text-sm text-muted-foreground">
                Update the name, description, or cover image.
              </p>
            </div>
          </div>

          <form
            onSubmit={handleSubmit}
            className="space-y-8 rounded-2xl border border-white/10 bg-card/40 p-6 md:p-8"
          >
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
                {submitting ? "Saving..." : "Save changes"}
              </Button>
            </div>
          </form>
        </div>
      </div>
    </Layout>
  );
}
