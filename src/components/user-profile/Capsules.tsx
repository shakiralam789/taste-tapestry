import { useRouter } from "nextjs-toploader/app";
import { Rocket } from "lucide-react";
import { TimeCapsuleCard } from "../capsules/TimeCapsuleCard";
import { getUserCapsules } from "@/features/capsules/api";
import { useQuery } from "@tanstack/react-query";
import { useParams } from "next/navigation";
import { usePublicProfileInfo } from "@/features/users/usePublicProfileInfo";

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
        <p className="text-sm text-muted-foreground">Loading capsules...</p>
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
          {capsules.map((capsule) => (
            <div key={capsule.id}>
              <TimeCapsuleCard
                capsule={capsule}
                authorName={displayName}
                authorSubtitle={displayUsername || "Time capsule"}
                authorAvatar={profile.avatar}
                onClick={() => router.push(`/capsules/${capsule.id}`)}
              />
            </div>
          ))}
        </div>
      )}
    </>
  );
}
