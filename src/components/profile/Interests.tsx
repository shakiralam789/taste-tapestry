import React, { useMemo } from "react";
import { interestCategories } from "@/data/mockData";
import { InterestCategory } from "@/types/wishbook";
import { useWishbook } from "@/contexts/WishbookContext";
import { Badge } from "@/components/ui/badge";

const categoryLabels: Record<InterestCategory, string> = {
    creative: "Creative pursuits",
    performance: "Performance-based",
    skill: "Skill-based",
    intellectual: "Intellectual / technical",
    unique: "Unique / unconventional",
    collaborative: "Collaborative",
  };
export default function Interests() {
  const { user: wishbookUser } = useWishbook();

    const interestsByCategory = useMemo(() => {
        const map: Partial<
          Record<InterestCategory, typeof wishbookUser.interests>
        > = {};
        wishbookUser.interests.forEach((i) => {
          if (!map[i.category]) map[i.category] = [];
          map[i.category]!.push(i);
        });
        return map;
      }, [wishbookUser]);
    
  return (
    <>
      <div className="mb-6">
        <h3 className="text-2xl font-display font-bold">
          Interests & creative pursuits
        </h3>
        <p className="text-muted-foreground text-sm">
          Creative, performance, skill-based, and more — what drives you.
        </p>
      </div>
      {wishbookUser.interests.length > 0 ? (
        <div className="space-y-6">
          {Object.entries(interestsByCategory).map(
            ([cat, interests]) =>
              interests &&
              interests.length > 0 && (
                <div
                  key={cat}
                  className="p-6 rounded-2xl bg-card/20 border border-white/5 hover:border-primary/20 transition-all"
                >
                  <h4 className="text-lg font-semibold mb-3 text-primary capitalize">
                    {categoryLabels[cat as InterestCategory] || cat}
                  </h4>
                  <div className="flex flex-wrap gap-2">
                    {interests.map((i) => (
                      <Badge
                        key={i.id}
                        variant="secondary"
                        className="bg-primary/10 text-primary border-primary/20"
                      >
                        {i.name}
                      </Badge>
                    ))}
                  </div>
                </div>
              ),
          )}
        </div>
      ) : (
        <div className="py-10 px-4 rounded-2xl border border-dashed border-white/10 bg-card/20 text-center text-muted-foreground text-sm mb-6">
          No interests added yet.
        </div>
      )}
      <div className="mt-6 p-6 rounded-2xl bg-card/20 border border-dashed border-white/10">
        <h4 className="text-lg font-semibold mb-3 text-muted-foreground">
          Explore more interests
        </h4>
        <p className="text-sm text-muted-foreground mb-4">
          Add from creative, performance, skill-based, intellectual, unique, and
          collaborative pursuits.
        </p>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {Object.entries(interestCategories).map(([category, interests]) => (
            <div key={category} className="space-y-2">
              <span className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
                {categoryLabels[category as InterestCategory] || category}
              </span>
              <div className="flex flex-wrap gap-2">
                {interests.slice(0, 6).map((i) => (
                  <Badge
                    key={i.id}
                    variant="outline"
                    className="bg-background/50 cursor-pointer hover:border-primary/50"
                  >
                    {i.name}
                  </Badge>
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>
    </>
  );
}
