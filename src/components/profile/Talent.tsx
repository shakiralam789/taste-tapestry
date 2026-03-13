import React from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useAuth } from "@/features/auth/AuthContext";
import { getQuirks } from "@/features/quirks/api";
import type { Quirk } from "@/types/wishbook";
import { QuirkCard } from "@/components/profile/QuirkCard";
import { QuirkEditor } from "@/components/profile/QuirkEditor";
import { Sparkles, Plus } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";

export default function Quirks() {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  const { data: quirks = [], isLoading } = useQuery<Quirk[]>({
    queryKey: ["quirks", "me"],
    queryFn: () => getQuirks(),
    enabled: !!user,
  });

  const handleCreated = () => {
    void queryClient.invalidateQueries({ queryKey: ["quirks", "me"] });
  };

  const hasQuirks = quirks.length > 0;

  return (
    <>
      <div className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="space-y-2">
          <div className="inline-flex items-center gap-2 rounded-full bg-primary/10 px-3 py-1 text-xs font-medium text-primary">
            <Sparkles className="h-3.5 w-3.5" />
            Quirks & party tricks
          </div>
          <div>
            <h3 className="text-2xl font-display font-bold">
              Quirks & party tricks
            </h3>
            <p className="text-muted-foreground text-sm max-w-xl">
              A soft, playful corner for the weird little things you do at
              gatherings, late at night, or when you think nobody’s watching.
              No talent show energy, just cozy storytelling.
            </p>
          </div>
        </div>

        <Dialog>
          <DialogTrigger asChild>
            <Button
              type="button"
              size="sm"
              className="rounded-full gap-2 w-full sm:w-auto"
            >
              <Plus className="h-4 w-4" />
              Unveil a quirk
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-xl sm:max-w-2xl rounded-3xl">
            <DialogHeader>
              <DialogTitle className="font-display text-xl sm:text-2xl flex items-center gap-2">
                <Sparkles className="h-5 w-5 text-primary" />
                Unveil a quirk
              </DialogTitle>
              <DialogDescription className="text-xs sm:text-sm">
                Share one small, funny, or quietly impressive thing you do.
                Think cozy-story-around-the-table, not a performance.
              </DialogDescription>
            </DialogHeader>
            <QuirkEditor onCreated={handleCreated} />
          </DialogContent>
        </Dialog>
      </div>

      {isLoading ? (
        <div className="py-10 px-4 rounded-2xl border border-dashed border-white/10 bg-card/20 text-center text-muted-foreground text-sm mb-6">
          Loading your quirks…
        </div>
      ) : hasQuirks ? (
        <div className="mb-6 grid gap-4 sm:grid-cols-2">
          {quirks.map((quirk) => (
            <QuirkCard key={quirk.id} quirk={quirk} />
          ))}
        </div>
      ) : (
        <div className="py-8 px-4 rounded-2xl border border-dashed border-white/10 bg-card/20 text-center text-sm mb-6 space-y-2">
          <p className="text-muted-foreground">
            No quirks shared yet — which is completely okay.
          </p>
          <p className="text-muted-foreground/80 text-xs max-w-md mx-auto">
            When you’re ready, you can gently drop in a tiny story or party
            trick. This space is built to feel like a kind, curious family
            table, not a spotlight.
          </p>
        </div>
      )}
    </>
  );
}

