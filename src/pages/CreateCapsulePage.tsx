"use client";
import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { useParams, useRouter, useSearchParams } from "next/navigation";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Layout } from "@/components/layout/Layout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { ArrowLeft, Upload, Clock, Sparkles, Plus, X } from "lucide-react";
import { CapsuleMediaUploader } from "@/components/capsules/CapsuleMediaUploader";
import { createCapsule, getCapsule, updateCapsule } from "@/features/capsules/api";
import { toast } from "sonner";

export default function CreateCapsulePage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const params = useParams<{ id?: string }>();
  const routeId = typeof params?.id === "string" ? params.id : null;
  const queryId = searchParams?.get("id");
  const editId = routeId || queryId;
  const queryClient = useQueryClient();

  const [formData, setFormData] = useState({
    title: "",
    description: "",
    period: "",
    story: "",
  });
  const [coverImage, setCoverImage] = useState<string | null>(null);
  const [emotions, setEmotions] = useState<string[]>([]);
  const [newEmotion, setNewEmotion] = useState("");
  const [media, setMedia] = useState<{ images: string[]; videos: string[] }>({
    images: [],
    videos: [],
  });

  const { data: existingCapsule } = useQuery({
    queryKey: ["capsule", editId],
    queryFn: () => getCapsule(editId as string),
    enabled: !!editId,
  });

  // Hydrate form when editing
  useEffect(() => {
    if (!existingCapsule) return;

    // Drop any blob: URLs that can't be reused after reload
    const safeImages =
      (existingCapsule.images ?? []).filter((src) => !src.startsWith("blob:"));
    const safeVideos =
      (existingCapsule.videos ?? []).filter((src) => !src.startsWith("blob:"));
    const safeImage =
      existingCapsule.image && !existingCapsule.image.startsWith("blob:")
        ? existingCapsule.image
        : undefined;

    setFormData({
      title: existingCapsule.title,
      description: existingCapsule.description ?? "",
      period: existingCapsule.period ?? "",
      story: existingCapsule.story ?? "",
    });
    setCoverImage(
      safeImage ?? safeImages[0] ?? safeVideos[0] ?? null,
    );
    setEmotions(existingCapsule.emotions ?? []);
    setMedia({
      images: safeImages,
      videos: safeVideos,
    });
  }, [existingCapsule]);

  const mutation = useMutation({
    mutationFn: async (payload: Parameters<typeof createCapsule>[0]) => {
      if (editId) {
        return updateCapsule(editId, payload);
      }
      return createCapsule(payload);
    },
    onSuccess: (savedCapsule) => {
      queryClient.invalidateQueries({ queryKey: ["capsules"] });
      if (editId) {
        queryClient.invalidateQueries({ queryKey: ["capsule", savedCapsule.id] });
        router.push(`/profile/capsules/${savedCapsule.id}`);
      } else {
        router.push("/profile/capsules");
      }
      toast.success(editId ? "Capsule updated" : "Capsule created");
    },
    onError: () => {
      toast.error("Failed to create capsule. Please try again.");
    },
  });

  const emotionSuggestions = [
    "nostalgic",
    "happy",
    "bittersweet",
    "adventurous",
    "peaceful",
    "hopeful",
    "melancholic",
    "excited",
    "reflective",
    "free",
  ];

  const addEmotion = (emotion: string) => {
    if (emotion.trim() && !emotions.includes(emotion.trim())) {
      setEmotions((prev) => [...prev, emotion.trim()]);
      setNewEmotion("");
    }
  };

  const removeEmotion = (emotion: string) => {
    setEmotions((prev) => prev.filter((e) => e !== emotion));
  };

  const handleSubmit = () => {
    const filteredImages = media.images.filter((src) => !src.startsWith("blob:"));
    const filteredVideos = media.videos.filter((src) => !src.startsWith("blob:"));

    const cleanCover =
      coverImage && !coverImage.startsWith("blob:")
        ? coverImage
        : filteredImages[0] || filteredVideos[0] || "";

    mutation.mutate({
      title: formData.title,
      description: formData.description || undefined,
      period: formData.period || undefined,
      image: cleanCover || undefined,
      images: filteredImages.length ? filteredImages : undefined,
      videos: filteredVideos.length ? filteredVideos : undefined,
      favorites: [],
      emotions,
      story: formData.story || undefined,
    });
  };

  return (
    <Layout>
      <div className="min-h-screen py-12">
        <div className="container mx-auto px-0">
          {/* Header */}
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            className="mb-8"
          >
            <Button
              variant="ghost"
              onClick={() => router.back()}
              className="mb-4"
            >
              <ArrowLeft className="w-4 h-4" />
              Back
            </Button>
            <h1 className="font-display text-3xl font-bold">
              {editId ? "Edit" : "Create"}{" "}
              <span className="gradient-text">Time Capsule</span>
            </h1>
            <p className="text-muted-foreground">
              Preserve a chapter of your life through the things you loved
            </p>
          </motion.div>

          <div className="grid gap-10 md:grid-cols-[minmax(0,2.2fr)_minmax(0,1.4fr)] items-start">
            {/* Form */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
              className="shadow-glow elevated-card p-4 md:p-6 border-2 border-primary/5 rounded-2xl transition-[filter,opacity] duration-500 ease-out hover:shadow-elevated hover:scale-[1.02] active:scale-[0.98]"
            >
              <div className="space-y-6">
                {/* Basic Info */}
                <div className="elevated-card space-y-4">
                  <div>
                    <Label
                      htmlFor="title"
                      className="mb-1 flex items-center gap-2"
                    >
                      <Clock className="w-4 h-4 text-primary" />
                      Capsule Title *
                    </Label>
                    <Input
                      id="title"
                      placeholder="e.g., College Days, Summer of 2023"
                      value={formData.title}
                      onChange={(e) =>
                        setFormData((prev) => ({
                          ...prev,
                          title: e.target.value,
                        }))
                      }
                    />
                  </div>

                  <div>
                    <Label htmlFor="period">Time Period</Label>
                    <Input
                      id="period"
                      placeholder="e.g., 2018-2022, Summer 2023"
                      value={formData.period}
                      onChange={(e) =>
                        setFormData((prev) => ({
                          ...prev,
                          period: e.target.value,
                        }))
                      }
                    />
                  </div>

                  <div>
                    <Label htmlFor="description">
                      One line that describes this era
                    </Label>
                    <Textarea
                      id="description"
                      placeholder="e.g., The years I learned to let go."
                      value={formData.description}
                      onChange={(e) =>
                        setFormData((prev) => ({
                          ...prev,
                          description: e.target.value,
                        }))
                      }
                      rows={2}
                    />
                  </div>
                </div>

                {/* Extra media */}
                <CapsuleMediaUploader
                  images={media.images}
                  videos={media.videos}
                  coverUrl={coverImage}
                  onChange={setMedia}
                  onCoverChange={setCoverImage}
                />

                {/* Emotions */}
                <div className="elevated-card">
                  <Label className="text-base font-medium mb-4 block">
                    How this phase felt
                  </Label>

                  {/* Suggestions */}
                  <div className="flex flex-wrap gap-2 mb-4">
                    {emotionSuggestions.map((emotion) => (
                      <Button
                        key={emotion}
                        variant={
                          emotions.includes(emotion) ? "default" : "outline"
                        }
                        size="sm"
                        onClick={() =>
                          emotions.includes(emotion)
                            ? removeEmotion(emotion)
                            : addEmotion(emotion)
                        }
                      >
                        {emotion}
                      </Button>
                    ))}
                  </div>

                  {/* Custom Input */}
                  <div className="flex gap-2">
                    <Input
                      placeholder="Add custom emotion..."
                      value={newEmotion}
                      onChange={(e) => setNewEmotion(e.target.value)}
                      onKeyDown={(e) =>
                        e.key === "Enter" &&
                        (e.preventDefault(), addEmotion(newEmotion))
                      }
                    />
                    <Button
                      onClick={() => addEmotion(newEmotion)}
                      variant="outline"
                    >
                      <Plus className="w-4 h-4" />
                    </Button>
                  </div>

                  {/* Selected Emotions */}
                  {emotions.filter((e) => !emotionSuggestions.includes(e))
                    .length > 0 && (
                    <div className="flex flex-wrap gap-2 mt-3">
                      {emotions
                        .filter((e) => !emotionSuggestions.includes(e))
                        .map((emotion) => (
                          <span
                            key={emotion}
                            className="inline-flex items-center gap-1 px-3 py-1 rounded-full bg-accent text-sm"
                          >
                            {emotion}
                            <button onClick={() => removeEmotion(emotion)}>
                              <X className="w-3 h-3" />
                            </button>
                          </span>
                        ))}
                    </div>
                  )}
                </div>

                {/* Story */}
                <div className="elevated-card">
                  <Label
                    htmlFor="story"
                    className="text-base font-medium flex items-center gap-2 mb-3"
                  >
                    <Sparkles className="w-5 h-5 text-primary" />
                    Your story of this chapter
                  </Label>
                  <Textarea
                    id="story"
                    placeholder="Write about what happened during this time. What defined these days? What do you want to remember?"
                    value={formData.story}
                    onChange={(e) =>
                      setFormData((prev) => ({
                        ...prev,
                        story: e.target.value,
                      }))
                    }
                    rows={6}
                  />
                </div>
              </div>
              {/* Capsule preview (design-only, mirrors favorite preview shell) */}

              {/* Submit */}
              <div className="flex gap-4 pt-6 mt-4 border-t border-white/10">
                <Button
                  variant="outline"
                  className="flex-1"
                  onClick={() => router.back()}
                >
                  Cancel
                </Button>
                <Button
                  variant="gradient"
                  className="flex-1"
                  onClick={handleSubmit}
                  disabled={!formData.title || mutation.isPending}
                >
                  <Clock className="w-5 h-5" />
                  {mutation.isPending ? "Creating..." : "Create Capsule"}
                </Button>
              </div>
            </motion.div>
            <div className="md:sticky md:top-4">
              <div className="shadow-glow rounded-2xl border border-white/10 bg-primary/5 backdrop-blur-sm overflow-hidden">
                <div className="text-xs font-medium text-muted-foreground uppercase tracking-wider px-4 py-3 border-b border-white/5">
                  <p>Live preview</p>
                </div>
                <div className="p-4">
                  {/* Cover preview */}
                  <div className="aspect-[3/4] w-full rounded-xl overflow-hidden bg-muted border border-white/5 mb-4 flex items-center justify-center">
                    {coverImage || media.images[0] || media.videos[0] ? (
                      media.videos.includes(coverImage || media.images[0] || media.videos[0]) ? (
                        <video
                          src={coverImage || media.videos[0]}
                          className="w-full h-full object-cover pointer-events-none"
                          autoPlay
                          muted
                          loop
                        />
                      ) : (
                        <img
                          src={coverImage || media.images[0]}
                          alt=""
                          className="w-full h-full object-cover pointer-events-none"
                        />
                      )
                    ) : (
                      <div className="w-full h-full flex flex-col items-center justify-center text-muted-foreground">
                        <Upload className="w-10 h-10 mb-2 opacity-50" />
                        <span className="text-sm">Cover media</span>
                      </div>
                    )}
                  </div>

                  {/* Text + moods */}
                  <div className="flex flex-col gap-3">
                    <div>
                      <p className="text-[11px] uppercase tracking-wide text-primary">
                        {formData.period || "Time period not set"}
                      </p>
                      <h2 className="font-display text-lg font-semibold truncate">
                        {formData.title || "Untitled capsule"}
                      </h2>
                      {formData.description && (
                        <p className="text-sm text-muted-foreground mt-1 line-clamp-2">
                          {formData.description}
                        </p>
                      )}
                    </div>
                    <div className="flex flex-wrap gap-2">
                      {emotions.slice(0, 4).map((emotion) => (
                        <span
                          key={emotion}
                          className="inline-flex items-center rounded-full border border-primary/30 bg-primary/10 px-2.5 py-0.5 text-xs text-primary"
                        >
                          {emotion}
                        </span>
                      ))}
                      {emotions.length === 0 && (
                        <span className="text-xs text-muted-foreground">
                          No moods selected yet.
                        </span>
                      )}
                    </div>
                    <p className="text-xs text-muted-foreground">
                      Memories you link later will appear in this capsule&apos;s
                      story.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </Layout>
  );
}
