import React from "react";
import { useRouter } from "nextjs-toploader/app";
import { TimeCapsuleCard } from "@/components/capsules/TimeCapsuleCard";
import { deleteCapsule, updateCapsule } from "@/features/capsules/api";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Plus, Rocket } from "lucide-react";
import { getProfile, PROFILE_QUERY_STALE_MS } from "@/features/profile/api";
import { useAuth } from "@/features/auth/AuthContext";

export default function Capsules() {
  const { user: authUser } = useAuth();

  const router = useRouter();
  const { data: profile, isLoading: profileLoading } = useQuery({
    queryKey: ["profile"],
    queryFn: getProfile,
    enabled: !!authUser,
    staleTime: PROFILE_QUERY_STALE_MS,
  });
  const displayName =
    profile?.displayName?.trim() || authUser?.displayName?.trim() || "";
  const displayAvatar = profile?.avatar?.trim() || "";
  const displayAvatarUrl = displayAvatar;
  const queryClient = useQueryClient();
    const { data: capsules = [] } = useQuery({
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
        },
        onError: () => {
          toast.error("Could not delete capsule");
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
      {capsules.length === 0 ? (
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
          {capsules.map((capsule) => (
            <div key={capsule.id}>
              <TimeCapsuleCard
                capsule={capsule}
                onClick={() => router.push(`/capsules/${capsule.id}`)}
                showActions
                authorName={displayName || "You"}
                authorSubtitle="Your time capsule"
                authorAvatar={displayAvatarUrl || displayAvatar || null}
                onEdit={() => router.push(`/update-captule/${capsule.id}`)}
                onToggleVisibility={(visibility) =>
                  updateCapsuleVisibilityMutation.mutate({
                    id: capsule.id,
                    visibility,
                  })
                }
                onDelete={() => deleteCapsuleMutation.mutate(capsule.id)}
              />
            </div>
          ))}
        </div>
      )}
    </>
  );
}
