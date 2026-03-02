"use client";
import { useState } from "react";
import { motion } from "framer-motion";
import Link from "next/link";
import { Layout } from "@/components/layout/Layout";
import { TimeCapsuleCard } from "@/components/capsules/TimeCapsuleCard";
import { Button } from "@/components/ui/button";
import { useWishbook } from "@/contexts/WishbookContext";
import { Clock, Plus, Archive, Sparkles, Lock, Globe2 } from "lucide-react";
import type { TimeCapsule, Favorite } from "@/types/wishbook";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

export default function CapsulesPage() {
  const { timeCapsules, favorites } = useWishbook();
  const [activeCapsule, setActiveCapsule] = useState<TimeCapsule | null>(null);

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: { staggerChildren: 0.1 }
    }
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: { opacity: 1, y: 0 }
  };

  return (
    <Layout>
      <div className="min-h-screen py-12">
        <div className="container mx-auto px-4">
          {/* Header */}
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-center mb-12"
          >
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/10 text-primary mb-4">
              <Clock className="w-4 h-4" />
              <span className="text-sm font-medium">Memory Preservation</span>
            </div>
            <h1 className="font-display text-4xl md:text-5xl font-bold mb-4">
              Your{' '}
              <span className="gradient-text">Time Capsules</span>
            </h1>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
              Capture eras of your life with the movies, songs, and experiences that defined them.
            </p>
          </motion.div>

          {/* Action Bar */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="flex flex-wrap items-center justify-center gap-3 mb-12"
          >
            <Link href="/create-capsule">
              <Button variant="gradient" size="lg">
                <Plus className="w-5 h-5" />
                Create New Capsule
              </Button>
            </Link>
            <Link href="/capsules/explore">
              <Button variant="outline" size="lg" className="gap-2 rounded-full">
                <Sparkles className="w-4 h-4" />
                Explore life phases
              </Button>
            </Link>
          </motion.div>

          {/* Info Cards */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.2 }}
            className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-12"
          >
            {[
              { 
                icon: Archive, 
                title: 'Capture Moments', 
                desc: 'Bundle your favorites from specific time periods' 
              },
              { 
                icon: Sparkles, 
                title: 'Tell Your Story', 
                desc: 'Add personal notes and emotions to each capsule' 
              },
              { 
                icon: Clock, 
                title: 'Revisit Memories', 
                desc: 'Look back on who you were through your taste' 
              },
            ].map((item, index) => (
              <motion.div
                key={item.title}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2 + index * 0.1 }}
                className="glass-card p-6 rounded-2xl text-center"
              >
                <div className="w-12 h-12 mx-auto mb-4 rounded-full bg-primary/10 flex items-center justify-center">
                  <item.icon className="w-6 h-6 text-primary" />
                </div>
                <h3 className="font-semibold mb-2">{item.title}</h3>
                <p className="text-sm text-muted-foreground">{item.desc}</p>
              </motion.div>
            ))}
          </motion.div>

          {/* Capsules Grid */}
          {timeCapsules.length > 0 ? (
            <motion.div
              variants={containerVariants}
              initial="hidden"
              animate="visible"
              className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6"
            >
              {timeCapsules.map((capsule) => (
                <motion.div key={capsule.id} variants={itemVariants}>
                  <TimeCapsuleCard capsule={capsule} />
                </motion.div>
              ))}

              {/* Add New Card */}
              <motion.div variants={itemVariants}>
                <Link href="/create-capsule">
                  <div className="elevated-card p-8 h-full min-h-[280px] flex flex-col items-center justify-center text-center border-2 border-dashed border-border hover:border-primary/50 transition-colors cursor-pointer group">
                    <div className="w-16 h-16 rounded-full bg-muted flex items-center justify-center mb-4 group-hover:bg-primary/10 transition-colors">
                      <Plus className="w-8 h-8 text-muted-foreground group-hover:text-primary transition-colors" />
                    </div>
                    <h3 className="font-semibold text-foreground mb-2">Create Time Capsule</h3>
                    <p className="text-sm text-muted-foreground">
                      Start a new collection of memories
                    </p>
                  </div>
                </Link>
              </motion.div>
            </motion.div>
          ) : (
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              className="text-center py-16"
            >
              <div className="w-24 h-24 mx-auto mb-6 rounded-full bg-muted flex items-center justify-center">
                <Clock className="w-12 h-12 text-muted-foreground" />
              </div>
              <h3 className="font-display text-2xl font-semibold mb-3">No capsules yet</h3>
              <p className="text-muted-foreground mb-6 max-w-md mx-auto">
                Create your first time capsule to preserve the favorites that define a special period of your life.
              </p>
              <Link href="/create-capsule">
                <Button variant="gradient" size="lg">
                  <Plus className="w-5 h-5" />
                  Create Your First Capsule
                </Button>
              </Link>
            </motion.div>
          )}
        </div>
      </div>

      {/* Capsule Detail (design-only, no backend) */}
      <Dialog
        open={!!activeCapsule}
        onOpenChange={(open) => {
          if (!open) setActiveCapsule(null);
        }}
      >
        <DialogContent className="max-w-4xl p-0 overflow-hidden">
          {activeCapsule && (
            <>
              <div className="relative h-56 md:h-64 overflow-hidden">
                <img
                  src={activeCapsule.image}
                  alt={activeCapsule.title}
                  className="w-full h-full object-cover brightness-[0.45]"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-background via-background/40 to-transparent" />
                <div className="absolute inset-x-0 bottom-0 p-4 md:p-6 flex flex-col gap-1">
                  <p className="text-xs font-medium uppercase tracking-wider text-primary flex items-center gap-1">
                    <Clock className="w-3.5 h-3.5" />
                    {activeCapsule.period || "Time period not set"}
                  </p>
                  <div className="flex items-center gap-2 text-[11px] text-muted-foreground">
                    {activeCapsule.visibility === "private" && (
                      <>
                        <Lock className="w-3 h-3" />
                        <span>Private capsule</span>
                      </>
                    )}
                    {(!activeCapsule.visibility ||
                      activeCapsule.visibility === "public") && (
                      <>
                        <Globe2 className="w-3 h-3" />
                        <span>Public capsule</span>
                      </>
                    )}
                    {activeCapsule.visibility === "future" && (
                      <>
                        <Lock className="w-3 h-3" />
                        <span>
                          Opens{" "}
                          {activeCapsule.unlockAt
                            ? activeCapsule.unlockAt.toLocaleDateString()
                            : "in future"}
                        </span>
                      </>
                    )}
                  </div>
                  <DialogHeader className="p-0">
                    <DialogTitle className="font-display text-2xl md:text-3xl font-bold text-foreground">
                      {activeCapsule.title}
                    </DialogTitle>
                  </DialogHeader>
                  {activeCapsule.description && (
                    <p className="text-sm text-muted-foreground line-clamp-2">
                      {activeCapsule.description}
                    </p>
                  )}
                </div>
              </div>

              <div className="p-4 md:p-6 grid grid-cols-1 md:grid-cols-3 gap-6">
                {/* Left: timeline of favorites */}
                <div className="md:col-span-2 space-y-4">
                  <h3 className="text-sm font-semibold uppercase tracking-wide text-muted-foreground">
                    Memories in this chapter
                  </h3>
                  {getFavoritesForCapsule(activeCapsule, favorites).length ===
                  0 ? (
                    <p className="text-sm text-muted-foreground">
                      No favorites linked yet. Add movies, songs, or books that
                      defined this phase.
                    </p>
                  ) : (
                    <div className="space-y-3">
                      {getFavoritesForCapsule(activeCapsule, favorites).map(
                        (fav) => (
                          <div
                            key={fav.id}
                            className="flex items-center gap-3 rounded-xl border border-white/10 bg-card/40 p-2.5"
                          >
                            <div className="w-12 h-12 rounded-lg overflow-hidden flex-shrink-0">
                              <img
                                src={fav.image}
                                alt={fav.title}
                                className="w-full h-full object-cover"
                              />
                            </div>
                            <div className="min-w-0">
                              <p className="text-sm font-medium truncate">
                                {fav.title}
                              </p>
                              <p className="text-[11px] text-muted-foreground capitalize">
                                {fav.categoryId}
                              </p>
                            </div>
                          </div>
                        ),
                      )}
                    </div>
                  )}
                </div>

                {/* Right: capsule DNA */}
                <div className="space-y-4">
                  <h3 className="text-sm font-semibold uppercase tracking-wide text-muted-foreground">
                    Capsule DNA
                  </h3>
                  <div className="rounded-2xl border border-white/10 bg-card/40 p-3 space-y-3 text-sm">
                    <div>
                      <p className="text-xs text-muted-foreground mb-1">
                        Dominant moods
                      </p>
                      <div className="flex flex-wrap gap-1.5">
                        {activeCapsule.emotions.length === 0 ? (
                          <span className="text-xs text-muted-foreground">
                            No moods added yet.
                          </span>
                        ) : (
                          activeCapsule.emotions.slice(0, 4).map((emotion) => (
                            <span
                              key={emotion}
                              className="inline-flex items-center rounded-full bg-primary/10 px-2 py-0.5 text-[11px] text-primary border border-primary/20"
                            >
                              {emotion}
                            </span>
                          ))
                        )}
                      </div>
                    </div>
                    <div>
                      <p className="text-xs text-muted-foreground mb-1">
                        Number of memories
                      </p>
                      <p className="text-sm font-medium">
                        {activeCapsule.favorites.length} favorites
                      </p>
                    </div>
                    {activeCapsule.story && (
                      <div>
                        <p className="text-xs text-muted-foreground mb-1">
                          Story
                        </p>
                        <p className="text-xs text-muted-foreground line-clamp-4">
                          {activeCapsule.story}
                        </p>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </>
          )}
        </DialogContent>
      </Dialog>
    </Layout>
  );
}

function getFavoritesForCapsule(
  capsule: TimeCapsule,
  allFavorites: Favorite[],
): Favorite[] {
  if (!capsule.favorites?.length) return [];
  const ids = new Set(capsule.favorites);
  return allFavorites.filter((f) => ids.has(f.id));
}
