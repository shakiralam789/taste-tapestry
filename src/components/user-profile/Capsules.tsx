import { useRouter } from "nextjs-toploader/app";
import { Rocket } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { useParams } from "next/navigation";
import { TimeCapsuleCard } from "../capsules/TimeCapsuleCard";
import { TimeCapsuleCardSkeleton } from "../capsules/TimeCapsuleCardSkeleton";
import { FavoriteCard } from "../favorites/FavoriteCard";
import { getUserCapsules } from "@/features/capsules/api";
import { capsuleToFavorite } from "@/features/capsules/adapters";
import { usePublicProfileInfo } from "@/features/users/usePublicProfileInfo";
import type { TimeCapsule } from "@/types/wishbook";

/**
 * Same dispatch as the home feed and the logged-in profile: a capsule with
 * at least one linked favorite is rendered via `FavoriteCard` (collection
 * post look). Plain capsules fall back to the original TimeCapsuleCard.
 */
function isCollectionCapsule(capsule: TimeCapsule): boolean {
  return (capsule.favorites?.length ?? 0) > 0;
}

export default function Capsules() {
  const { id } = useParams<{ id: string | undefined }>();
  const router = useRouter();
  const {
    profile,
    displayName,
    displayUsername,
    loading: profileLoading,
    error: profileError,
  } = usePublicProfileInfo(id as string);
  const { data: capsules = [], isLoading: capsulesLoading } = useQuery({
    queryKey: ["user-capsules", id],
    queryFn: () => getUserCapsules(id as string),
    enabled: !!id && !!profile && !profileLoading,
  });

  if (profileError || !profile || profileLoading) {
    return null;
  }

  return (
    <>
      <div className="mb-6">
        <h3 className="text-2xl font-display font-bold">Time capsules</h3>
        <p className="text-muted-foreground text-sm">
          Collections tied to a period — school days, breakup era, summer this
          year.
        </p>
      </div>
      {capsulesLoading || profileLoading ? (
        <div className="flex flex-col gap-4 mx-auto">
          {[...Array(3)].map((_, i) => (
            <TimeCapsuleCardSkeleton key={i} />
          ))}
        </div>
      ) : capsules.length === 0 ? (
        <div className="p-12 rounded-3xl bg-card/20 border-2 border-dashed border-white/10 text-center text-muted-foreground">
          <Rocket className="w-14 h-14 mx-auto mb-4 opacity-50" />
          <h4 className="text-lg font-semibold mb-2 text-foreground">
            No capsules yet
          </h4>
          <p className="text-sm">
            {displayName} hasn&apos;t created any time capsules yet.
          </p>
        </div>
      ) : (
        <div className="flex flex-col gap-4 mx-auto">
          {capsules.map((capsule) => {
            if (isCollectionCapsule(capsule)) {
              const fav = capsuleToFavorite(capsule, {
                id: profile.id,
                name: profile.displayName?.trim() || profile.username?.trim() || "User",
                username: (profile.username ?? "user").replace(/^@/, ""),
                avatar: profile.avatar ?? null,
              });
              // For collections, route to the FIRST linked favorite's details
              // page (not the capsule id) so the user lands on a real Favorite
              // record with the same edit/theme-music UI as MyCollections.
              const firstLinkedFavoriteId = capsule.favorites?.[0];
              const targetId = firstLinkedFavoriteId ?? capsule.id;
              return (
                <FavoriteCard
                  key={capsule.id}
                  favorite={fav}
                  onClick={() => router.push(`/favorites/${targetId}`)}
                  showSaveButton
                  authorOverride={{
                    name: displayName,
                    username: displayUsername || "user",
                    avatar: profile.avatar,
                  }}
                />
              );
            }
            return (
              <div key={capsule.id}>
                <TimeCapsuleCard
                  capsule={capsule}
                  authorName={displayName}
                  authorSubtitle={displayUsername || "Time capsule"}
                  authorAvatar={profile.avatar}
                  onClick={() => router.push(`/capsules/${capsule.id}`)}
                />
              </div>
            );
          })}
        </div>
      )}
    </>
  );
}
