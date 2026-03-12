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
import { ArrowLeft, Upload, Clock, Sparkles, Plus, X, ChevronRight, ChevronLeft, Zap } from "lucide-react";
import { Switch } from "@/components/ui/switch";
import { AnimatePresence } from "framer-motion";
import { CapsuleMediaUploader } from "@/components/capsules/CapsuleMediaUploader";
import { createCapsule, getCapsule, updateCapsule } from "@/features/capsules/api";
import { toast } from "sonner";
import { TimeCapsule } from "@/types/wishbook";
import { TimeCapsuleCard } from "@/components/capsules/TimeCapsuleCard";

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
  const [bannerImage, setBannerImage] = useState<string | null>(null);
  const [emotions, setEmotions] = useState<string[]>([]);
  const [newEmotion, setNewEmotion] = useState("");
  const [media, setMedia] = useState<{ images: string[]; videos: string[] }>({
    images: [],
    videos: [],
  });
  const [step, setStep] = useState(1);
  const [isQuickPost, setIsQuickPost] = useState(false);
  const totalSteps = 3;

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
    const safeBanner =
      existingCapsule.bannerImage &&
        !existingCapsule.bannerImage.startsWith("blob:")
        ? existingCapsule.bannerImage
        : undefined;

    setFormData({
      title: existingCapsule.title,
      description: existingCapsule.description ?? "",
      period: existingCapsule.period ?? "",
      story: existingCapsule.story ?? "",
    });
    const defaultMedia = safeImage ?? safeImages[0] ?? safeVideos[0] ?? null;
    setCoverImage(defaultMedia);
    setBannerImage(safeBanner ?? defaultMedia);
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
        router.push(`/capsules/${savedCapsule.id}`);
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
    if (step < totalSteps && !isQuickPost) {
      setStep(step + 1);
      return;
    }

    const filteredImages = media.images.filter((src) => !src.startsWith("blob:"));
    const filteredVideos = media.videos.filter((src) => !src.startsWith("blob:"));

    const cleanPoster =
      coverImage && !coverImage.startsWith("blob:")
        ? coverImage
        : filteredImages[0] || filteredVideos[0] || "";

    const cleanBanner =
      bannerImage && !bannerImage.startsWith("blob:")
        ? bannerImage
        : cleanPoster;

    mutation.mutate({
      title: formData.title,
      description: formData.description || undefined,
      period: formData.period || undefined,
      image: cleanPoster || undefined,
      bannerImage: cleanBanner || undefined,
      images: filteredImages.length ? filteredImages : undefined,
      videos: filteredVideos.length ? filteredVideos : undefined,
      favorites: [],
      emotions: isQuickPost ? [] : emotions,
      story: isQuickPost ? undefined : (formData.story || undefined),
    });
  };

  const goBack = () => setStep(Math.max(1, step - 1));
  const goNext = () => setStep(Math.min(totalSteps, step + 1));

  const posterPreview =
    coverImage || media.images[0] || media.videos[0] || null;

  const previewCapsule: TimeCapsule = {
    id: (existingCapsule?.id as string) ?? "preview-id",
    userId: existingCapsule?.userId ?? "preview-user",
    title: formData.title || "Untitled capsule",
    description: formData.description || "",
    period: formData.period || "",
    image: posterPreview || undefined,
    images: media.images,
    videos: media.videos,
    favorites: existingCapsule?.favorites ?? [],
    emotions,
    story: formData.story || "",
    visibility: existingCapsule?.visibility ?? "public",
    unlockAt: existingCapsule?.unlockAt,
    loveCount: existingCapsule?.loveCount ?? 0,
    lovedByMe: existingCapsule?.lovedByMe ?? false,
    createdAt: existingCapsule?.createdAt ?? new Date(),
  };

  return (
    <Layout>
      <div className="min-h-screen py-0">
        <div className="container mx-auto px-0">
          {/* Header */}
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            className="mb-8 flex items-center gap-4"
          >
            <Button
              variant="outline"
              size="icon"
              onClick={() => router.back()}
            >
              <ArrowLeft className="w-4 h-4" />
            </Button>
            <div>
              <h1 className="font-display text-3xl font-bold">
                {editId ? "Edit" : "Create"}{" "}
                <span className="gradient-text">Time Capsule</span>
              </h1>
              <p className="text-muted-foreground">
                Preserve a chapter of your life through the things you loved
              </p>
            </div>
          </motion.div>

          <div className="grid gap-10 md:grid-cols-12 items-start">
            {/* Form */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
              className="col-span-7 space-y-6"
            >
              {/* Premium Header/Controls */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-4 rounded-2xl bg-primary/5 border border-white/5 backdrop-blur-md mb-2">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-primary/20 flex items-center justify-center border border-primary/30">
                    <Zap className="w-5 h-5 text-primary" />
                  </div>
                  <div>
                    <p className="text-xs font-black uppercase tracking-widest text-primary/70">Mode</p>
                    <p className="text-sm font-bold">{isQuickPost ? "Quick Post" : "Full Story"}</p>
                  </div>
                </div>
                <div className="flex items-center gap-3 bg-black/20 p-2 rounded-xl border border-white/5">
                  <span className={`text-xs font-bold transition-colors ${!isQuickPost ? "text-white" : "text-gray-500"}`}>Full Story</span>
                  <Switch
                    checked={isQuickPost}
                    onCheckedChange={(val) => {
                      setIsQuickPost(val);
                      if (val) setStep(1);
                    }}
                  />
                  <span className={`text-xs font-bold transition-colors ${isQuickPost ? "text-white" : "text-gray-500"}`}>Quick Post</span>
                </div>
              </div>

              {/* Progress Bar (Only in Full Story mode) */}
              {!isQuickPost && (
                <div className="px-1 mb-2">
                  <div className="flex justify-between mb-2">
                    {["Identity", "Media", "Journey"].map((label, i) => (
                      <span
                        key={label}
                        className={`text-[10px] uppercase font-black tracking-widest transition-colors ${step >= i + 1 ? "text-primary" : "text-gray-600"
                          }`}
                      >
                        {label}
                      </span>
                    ))}
                  </div>
                  <div className="h-1.5 w-full bg-white/5 rounded-full overflow-hidden flex gap-1">
                    {Array.from({ length: totalSteps }).map((_, i) => (
                      <div
                        key={i}
                        className={`h-full flex-1 rounded-full transition-all duration-500 ${step > i
                          ? "bg-primary shadow-[0_0_10px_rgba(var(--primary-rgb),0.5)]"
                          : step === i + 1
                            ? "bg-primary/40 animate-pulse"
                            : "bg-white/5"
                          }`}
                      />
                    ))}
                  </div>
                </div>
              )}

              <div className="shadow-glow elevated-card p-4 md:p-6 border-2 border-primary/5 rounded-2xl transition-[filter,opacity] duration-300 ease-out hover:shadow-elevated">
                <AnimatePresence mode="wait">
                  {step === 1 && (
                    <motion.section
                      key="step1"
                      initial={{ opacity: 0, x: 20 }}
                      animate={{ opacity: 1, x: 0 }}
                      exit={{ opacity: 0, x: -20 }}
                      className="space-y-6"
                    >
                      {/* Basic Info */}
                      <div className="space-y-4">
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
                            autoComplete="off"
                            placeholder="Name your capsule"
                            value={formData.title}
                            onChange={(e) =>
                              setFormData((prev) => ({
                                ...prev,
                                title: e.target.value,
                              }))
                            }
                          />
                        </div>

                        {!isQuickPost && (
                          <>
                            <div>
                              <Label htmlFor="period">Time Period</Label>
                              <Input
                                id="period"
                                autoComplete="off"
                                placeholder="When did this era take place?"
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
                                placeholder="Describe this era in a few words"
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

                            {/* Emotions Moved to Step 1 for better grouping */}
                            <div>
                              <Label className="text-base font-medium mb-4 block">
                                How this phase felt
                              </Label>

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
                                    className="rounded-full !text-[10px] uppercase font-black tracking-widest"
                                  >
                                    {emotion}
                                  </Button>
                                ))}
                              </div>

                              <div className="flex gap-2">
                                <Input
                                  placeholder="Add custom..."
                                  value={newEmotion}
                                  onChange={(e) => setNewEmotion(e.target.value)}
                                  onKeyDown={(e) =>
                                    e.key === "Enter" &&
                                    (e.preventDefault(), addEmotion(newEmotion))
                                  }
                                  className="h-9"
                                />
                                <Button
                                  onClick={() => addEmotion(newEmotion)}
                                  variant="outline"
                                  size="sm"
                                >
                                  <Plus className="w-4 h-4" />
                                </Button>
                              </div>

                              {emotions.filter((e) => !emotionSuggestions.includes(e)).length > 0 && (
                                <div className="flex flex-wrap gap-2 mt-3">
                                  {emotions
                                    .filter((e) => !emotionSuggestions.includes(e))
                                    .map((emotion) => (
                                      <span
                                        key={emotion}
                                        className="inline-flex items-center gap-1 px-3 py-1 rounded-full bg-primary/10 border border-primary/20 text-xs font-bold text-primary"
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
                          </>
                        )}
                      </div>
                    </motion.section>
                  )}

                  {(step === 2 || isQuickPost) && (
                    <motion.section
                      key="step2"
                      initial={{ opacity: 0, x: 20 }}
                      animate={{ opacity: 1, x: 0 }}
                      exit={{ opacity: 0, x: -20 }}
                      className="space-y-6"
                    >
                      {/* Extra media */}
                      <div className="space-y-4 mt-4">
                        <Label className="text-base font-medium flex items-center gap-2">
                          <Plus className="w-5 h-5 text-primary" />
                          {isQuickPost ? "Primary Media *" : "Era Media & Clips"}
                        </Label>
                        <CapsuleMediaUploader
                          images={media.images}
                          videos={media.videos}
                          coverUrl={coverImage}
                          bannerUrl={bannerImage}
                          onChange={setMedia}
                          onCoverChange={setCoverImage}
                          onBannerChange={setBannerImage}
                        />
                      </div>
                    </motion.section>
                  )}

                  {step === 3 && !isQuickPost && (
                    <motion.section
                      key="step3"
                      initial={{ opacity: 0, x: 20 }}
                      animate={{ opacity: 1, x: 0 }}
                      exit={{ opacity: 0, x: -20 }}
                      className="space-y-6"
                    >
                      {/* Story */}
                      <div className="">
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
                          rows={10}
                          className="resize-none"
                        />
                      </div>
                    </motion.section>
                  )}
                </AnimatePresence>

                {/* Navigation Controls */}
                <div className="flex gap-3 pt-6 mt-6 border-t border-white/5">
                  {!isQuickPost && step > 1 && (
                    <Button
                      variant="outline"
                      onClick={goBack}
                      className="px-4"
                    >
                      <ChevronLeft className="w-4 h-4 mr-1" />
                      Back
                    </Button>
                  )}

                  <Button
                    variant="gradient"
                    className="flex-1 font-bold tracking-tight h-11"
                    onClick={handleSubmit}
                    disabled={
                      !formData.title ||
                      (isQuickPost && media.images.length === 0 && media.videos.length === 0) ||
                      mutation.isPending
                    }
                  >
                    {isQuickPost ? (
                      <>
                        <Zap className="w-5 h-5 mr-2" />
                        {mutation.isPending ? "Sharing..." : "Post Instantly"}
                      </>
                    ) : step === totalSteps ? (
                      <>
                        <Sparkles className="w-5 h-5 mr-2" />
                        {mutation.isPending ? "Creating..." : editId ? "Update Capsule" : "Preserve Memories"}
                      </>
                    ) : (
                      <>
                        Next
                        <ChevronRight className="w-4 h-4 ml-2" />
                      </>
                    )}
                  </Button>
                </div>
              </div>
            </motion.div>
            <div className="col-span-5 md:sticky md:top-20">
              <div className="shadow-glow rounded-2xl border border-white/10 bg-primary/5 backdrop-blur-sm overflow-hidden">
                <div className="text-xs font-medium text-muted-foreground uppercase tracking-wider px-4 py-2 border-b border-white/5">
                  <p>Live preview</p>
                </div>
                <div className="p-4 pointer-events-none">
                  <TimeCapsuleCard
                    capsule={previewCapsule}
                    showActions={false}
                    authorName="You"
                    authorSubtitle={
                      formData.period
                        ? `Chapter from ${formData.period}`
                        : "Your time capsule"
                    }
                    authorAvatar={null}
                  />
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </Layout>
  );
}
