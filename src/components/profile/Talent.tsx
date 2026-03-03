import { useWishbook } from "@/contexts/WishbookContext";
import React, { useMemo } from "react";
import { Mic2 } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Lock } from "lucide-react";
const talentOptions = [
  "Singing",
  "Dancing",
  "Writing",
  "Art",
  "Acting",
  "Stunts",
];
export default function Talent() {
  const { user: wishbookUser } = useWishbook();
  const revealedTalents = useMemo(
    () => wishbookUser.talents.filter((t) => t.isPublic),
    [wishbookUser.talents],
  );
  return (
    <>
      <div className="mb-6">
        <h3 className="text-2xl font-display font-bold">Hidden talents</h3>
        <p className="text-muted-foreground text-sm">
          Reveal your secret skills — singing, dancing, writing, art, acting,
          stunts.
        </p>
      </div>
      {revealedTalents.length > 0 ? (
        <div className="flex flex-wrap gap-3 mb-6">
          {revealedTalents.map((t) => (
            <div
              key={t.id}
              className="flex items-center gap-2 px-4 py-3 rounded-2xl bg-secondary/10 border border-secondary/20"
            >
              <Mic2 className="w-5 h-5 text-secondary" />
              <span className="font-medium">{t.name}</span>
              <Badge variant="secondary" className="text-xs">
                Revealed
              </Badge>
            </div>
          ))}
        </div>
      ) : (
        <div className="py-10 px-4 rounded-2xl border border-dashed border-white/10 bg-card/20 text-center text-muted-foreground text-sm mb-6">
          No talents revealed yet.
        </div>
      )}
      <div className="p-8 rounded-3xl bg-secondary/5 border border-secondary/20 border-dashed">
        <Sparkles className="w-12 h-12 text-secondary mx-auto mb-4" />
        <h4 className="text-xl font-bold mb-2 text-center">Unveil a talent</h4>
        <p className="text-muted-foreground text-center mb-6 text-sm">
          Share a hidden skill with your taste twin community.
        </p>
        <div className="flex flex-wrap justify-center gap-2">
          {talentOptions.map((name) => (
            <Button
              key={name}
              variant="outline"
              size="sm"
              className="rounded-full"
            >
              {name}
            </Button>
          ))}
        </div>
        <p className="text-xs text-muted-foreground text-center mt-4 flex items-center justify-center gap-1">
          <Lock className="w-3 h-3" /> Private until you reveal
        </p>
      </div>
    </>
  );
}
