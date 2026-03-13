import React from "react";
import { useParams } from "next/navigation";
import { useQuery } from "@tanstack/react-query";
import type { Quirk } from "@/types/wishbook";
import { getQuirks } from "@/features/quirks/api";
import { QuirkCard } from "@/components/profile/QuirkCard";
import { Sparkles } from "lucide-react";

export default function Talents() {
  const { id } = useParams<{ id: string }>();

  const { data: quirks = [], isLoading } = useQuery<Quirk[]>({
    queryKey: ["quirks", "user", id],
    queryFn: () => getQuirks(id),
    enabled: !!id,
  });

  const publicQuirks = quirks.filter((q) => q.isPublic);

  return (
    <>
      <div className="mb-6 space-y-2">
        <div className="inline-flex items-center gap-2 rounded-full bg-primary/10 px-3 py-1 text-xs font-medium text-primary">
          <Sparkles className="h-3.5 w-3.5" />
          Quirks & party tricks
        </div>
        <h3 className="text-2xl font-display font-bold">
          Quirks & party tricks
        </h3>
        <p className="text-muted-foreground text-sm max-w-xl">
          Little stories and playful habits this person felt safe enough to
          share. Only the ones they made visible will appear here.
        </p>
      </div>

      {isLoading ? (
        <div className="py-10 px-4 rounded-2xl border border-dashed border-white/10 bg-card/20 text-center text-muted-foreground text-sm">
          Loading quirks…
        </div>
      ) : publicQuirks.length > 0 ? (
        <div className="grid gap-4 sm:grid-cols-2">
          {publicQuirks.map((quirk) => (
            <QuirkCard key={quirk.id} quirk={quirk} />
          ))}
        </div>
      ) : (
        <div className="py-10 px-4 rounded-2xl border border-dashed border-white/10 bg-card/20 text-center text-muted-foreground text-sm">
          No quirks shared publicly yet.
        </div>
      )}
    </>
  );
}

