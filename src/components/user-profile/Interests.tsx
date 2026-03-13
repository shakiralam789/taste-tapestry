"use client";

import React, { useMemo } from "react";
import { useParams } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { Palette, Mic2, Star, Brain, Sparkles, Users, Zap, Plus } from "lucide-react";
import { cn } from "@/lib/utils";
import { usePublicProfileInfo } from "@/features/users/usePublicProfileInfo";
import { Badge } from "@/components/ui/badge";
import { Interest, InterestCategory } from "@/types/wishbook";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";

const categoryConfig: Record<InterestCategory, { label: string; icon: any; color: string; bg: string }> = {
  creative: { label: "Creative pursuits", icon: Palette, color: "text-pink-400", bg: "bg-pink-500/10" },
  performance: { label: "Performance-based", icon: Mic2, color: "text-orange-400", bg: "bg-orange-500/10" },
  skill: { label: "Skill-based", icon: Star, color: "text-yellow-400", bg: "bg-yellow-500/10" },
  intellectual: { label: "Intellectual / technical", icon: Brain, color: "text-indigo-400", bg: "bg-indigo-500/10" },
  unique: { label: "Unique / unconventional", icon: Sparkles, color: "text-purple-400", bg: "bg-purple-500/10" },
  collaborative: { label: "Collaborative", icon: Users, color: "text-cyan-400", bg: "bg-cyan-500/10" },
};

export default function Interests() {
  const { id } = useParams<{ id: string }>();
  const { profile, loading } = usePublicProfileInfo(id);

  const profileInterests = profile?.interests || [];

  const interestsByCategory = useMemo(() => {
    const map: Partial<Record<InterestCategory, Interest[]>> = {};
    profileInterests.forEach((i: Interest) => {
      if (!map[i.category]) map[i.category] = [];
      map[i.category]!.push(i);
    });
    return map;
  }, [profileInterests]);

  if (loading) {
    return <div className="animate-pulse h-40 bg-card/10 rounded-2xl w-full"></div>;
  }

  return (
    <div className="space-y-12 pb-12">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
      >
        <h3 className="text-2xl font-display font-bold mb-2">
          Interests & creative pursuits
        </h3>
        <p className="text-muted-foreground text-sm max-w-md">
          The skills, hobbies, and creative escapes that define their energy.
        </p>
      </motion.div>

      {/* User Interests Grid */}
      {profileInterests.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <AnimatePresence mode="popLayout">
            {Object.entries(interestsByCategory).map(([cat, interests]) => {
              if (!interests || interests.length === 0) return null;
              const config = categoryConfig[cat as InterestCategory] || {
                label: cat.charAt(0).toUpperCase() + cat.slice(1),
                icon: Zap,
                color: "text-primary",
                bg: "bg-primary/10",
              };
              const Icon = config.icon;

              return (
                <motion.div
                  key={cat}
                  layout
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.9 }}
                  transition={{ duration: 0.3 }}
                  className="group relative p-6 rounded-2xl bg-card/10 border border-white/5 backdrop-blur-md transition-all overflow-hidden"
                >
                  {/* Decorative Background Glow */}
                  <div className={cn("absolute -right-4 -top-4 w-24 h-24 blur-3xl opacity-20 transition-opacity group-hover:opacity-40", config.bg)} />

                  <div className="relative flex items-center gap-3 mb-4">
                    <div
                      className={cn("p-2 rounded-xl border border-white/10", config.bg)}
                    >
                      <Icon className={cn("w-5 h-5", config.color)} />
                    </div>
                    <h4 className="text-lg font-bold tracking-tight">
                      {config.label}
                    </h4>
                  </div>

                  <div className="flex flex-wrap gap-2 min-h-[32px]">
                    <TooltipProvider delayDuration={200}>
                      <AnimatePresence mode="popLayout">
                        {interests.map((i) => (
                          <Tooltip key={i.id}>
                            <TooltipTrigger asChild>
                              <div className="group/badge">
                                <Badge
                                  variant="secondary"
                                  className={cn(
                                    "bg-white/5 text-foreground/80 border-white/5 transition-all select-none px-3 py-1 font-medium flex items-center gap-1",
                                    "hover:bg-primary/10 hover:border-primary/30"
                                  )}
                                >
                                  <span>{i.name}</span>
                                </Badge>
                              </div>
                            </TooltipTrigger>
                            {i.description && (
                              <TooltipContent 
                                side="top" 
                                className="bg-card/80 backdrop-blur-xl border-white/10 max-w-xs shadow-2xl p-4"
                              >
                                <h5 className="font-semibold text-foreground mb-1">{i.name}</h5>
                                <p className="text-xs text-muted-foreground leading-relaxed">{i.description}</p>
                              </TooltipContent>
                            )}
                          </Tooltip>
                        ))}
                      </AnimatePresence>
                    </TooltipProvider>
                  </div>
                </motion.div>
              );
            })}
          </AnimatePresence>
        </div>
      ) : (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="py-12 px-6 rounded-3xl border-2 border-dashed border-white/5 bg-card/5 text-center"
        >
          <motion.div
            className="w-12 h-12 bg-white/5 rounded-full flex items-center justify-center mx-auto mb-4"
          >
            <Sparkles className="w-5 h-5 text-muted-foreground" />
          </motion.div>
          <p className="text-muted-foreground font-medium">No interests added yet.</p>
        </motion.div>
      )}
    </div>
  );
}
