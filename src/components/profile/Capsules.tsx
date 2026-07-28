import React from "react";
import { useRouter } from "nextjs-toploader/app";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import Link from "next/link";
import {
  Plus,
  Rocket,
  Clock,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { TimeCapsuleCard } from "@/components/capsules/TimeCapsuleCard";
import { TimeCapsuleCardSkeleton } from "@/components/capsules/TimeCapsuleCardSkeleton";
import { FavoriteCard } from "@/components/favorites/FavoriteCard";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import { useState } from "react";
import { deleteCapsule, updateCapsule } from "@/features/capsules/api";
import { useProfileInfo } from "@/features/profile/useProfileInfo";
import { capsuleToFavorite } from "@/features/capsules/adapters";
import { useAuth } from "@/features/auth/AuthContext";
import type { TimeCapsule } from "@/types/wishbook";

/**
 * A capsule counts as a "collection post" when it has at least one linked
 * favorite. Mirrors the same branch on the home feed (`FeedPage.tsx`):
 * collection → FavoriteCard, plain capsule → TimeCapsuleCard.
 */
function isCollectionCapsule(capsule: TimeCapsule): boolean {
  return (capsule.favorites?.length ?? 0) > 0;
}

export default function Capsules() {
  const router = useRouter();
  const { user: authUser } = useAuth();
  const {
    loading: profileLoading,
    displayName,
    displayAvatar,
  } = useProfileInfo();

  const [deleteId, setDeleteId] = useState<string | null>(null);
  const queryClient = useQueryClient();
  const { data: capsules = [], isLoading } = useQuery({
    queryKey: ["capsules"],
    queryFn: () =>
      import("@/features/capsules/api").then((m) => m.getMyCapsules()),
  });
  const updateCapsuleVisibilityMutation = useMutation({
    mutationFn: ({
      id,
      visibility,
    }: {
      id: string;
      visibility: "public" | "private";
    }) => updateCapsule(id, { visibility }),
    onSuccess: (_, { visibility }) => {
      void queryClient.invalidateQueries({ queryKey: ["capsules"] });
      toast.success(
        visibility === "public"
          ? "Capsule is now public"
          : "Capsule is now private",
      );
    },
    onError: () => toast.error("Could not update capsule visibility"),
  });

  const deleteCapsuleMutation = useMutation({
    mutationFn: deleteCapsule,
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ["capsules"] });
      toast.success("Capsule deleted");
      setDeleteId(null);
    },
    onError: () => {
      toast.error("Could not delete capsule");
      setDeleteId(null);
    },
  });

  return (
    <>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h3 className="text-2xl font-display font-bold">Time capsules</h3>
          <p className="text-muted-foreground text-sm">
            Collections tied to a period — school days, breakup era, summer this
            year.
          </p>
        </div>
        <Link href="/create-capsule">
          <Button
            variant="outline"
            size="sm"
            className="rounded-full border-dashed group hover:border-primary hover:text-primary"
          >
            <Plus className="w-4 h-4 mr-1 group-hover:rotate-90 transition-transform" />{" "}
            Create capsule
          </Button>
        </Link>
      </div>

      {isLoading ? (
        <div className="flex flex-col gap-4 mx-auto">
          {[...Array(3)].map((_, i) => (
            <TimeCapsuleCardSkeleton key={i} />
          ))}
        </div>
      ) : capsules.length === 0 ? (
        <Link href="/create-capsule">
          <div className="p-12 rounded-3xl bg-card/20 border-2 border-dashed border-white/10 text-center text-muted-foreground hover:border-primary/30 hover:bg-primary/5 transition-all cursor-pointer group">
            <Rocket className="w-14 h-14 mx-auto mb-4 opacity-50 group-hover:opacity-80" />
            <h4 className="text-lg font-semibold mb-2 text-foreground">
              No capsules yet
            </h4>
            <p className="text-sm mb-4">
              Capture a chapter of your life with favorites, emotions, and
              stories.
            </p>
            <Button variant="secondary" size="sm">
              Create your first capsule
            </Button>
          </div>
        </Link>
      ) : (
        <div className="flex flex-col gap-4 mx-auto">
          {capsules.map((capsule) => {
            // ── Collection (capsule with linked favorites) → FavoriteCard
            //    Same dispatch as FeedPage.tsx so the profile mirrors the
            //    home timeline.
            if (isCollectionCapsule(capsule)) {
              const fav = capsuleToFavorite(capsule, {
                id: authUser?.id ?? "",
                name: displayName || "You",
                username: "you",
                avatar: displayAvatar,
              });
              // For collections, route to the FIRST linked favorite's details
              // page (not the capsule id) — clicking a "collection card"
              // should land on a real Favorite record so the user sees the
              // same edit/theme-music UI as on MyCollections. The capsule
              // shape is still rendered via the fallback on the favorites
              // details page when the user navigates from somewhere else
              // (e.g. the capsule page itself).
              const firstLinkedFavoriteId = capsule.favorites?.[0];
              const targetId = firstLinkedFavoriteId ?? capsule.id;
              return (
                <FavoriteCard
                  key={capsule.id}
                  favorite={fav}
                  onClick={() => router.push(`/favorites/${targetId}`)}
                  showSaveButton
                  authorOverride={{
                    name: displayName || "You",
                    username: "you",
                    avatar: displayAvatar || "",
                  }}
                />
              );
            }

            // ── Plain capsule → original TimeCapsuleCard with edit/delete
            //    controls baked into the card (showActions).
            return (
              <div key={capsule.id}>
                <TimeCapsuleCard
                  capsule={capsule}
                  onClick={() => router.push(`/capsules/${capsule.id}`)}
                  showActions
                  authorName={displayName || "You"}
                  authorSubtitle="Time capsule"
                  authorAvatar={displayAvatar || null}
                  onEdit={() => router.push(`/update-captule/${capsule.id}`)}
                  onToggleVisibility={(visibility) =>
                    updateCapsuleVisibilityMutation.mutate({
                      id: capsule.id,
                      visibility,
                    })
                  }
                  onDelete={() => setDeleteId(capsule.id)}
                />
              </div>
            );
          })}
        </div>
      )}

      <ConfirmDialog
        open={!!deleteId}
        onOpenChange={(open) => !open && setDeleteId(null)}
        title="Delete Time Capsule?"
        description="Are you sure you want to delete this capsule? This will permanently remove your memories and associated comments from the platform."
        confirmText="Delete Capsule"
        variant="destructive"
        isLoading={deleteCapsuleMutation.isPending}
        onConfirm={() => deleteId && deleteCapsuleMutation.mutate(deleteId)}
      />
    </>
  );

  void profileLoading;
  void Clock;
}
