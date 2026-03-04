"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import { Layout } from "@/components/layout/Layout";
import { useWishbook } from "@/contexts/WishbookContext";
import { TimeCapsuleCard } from "@/components/capsules/TimeCapsuleCard";
import { Button } from "@/components/ui/button";
import { Clock, Sparkles } from "lucide-react";

export default function ExploreCapsulesPage() {
  const { timeCapsules } = useWishbook();
  const [activeEmotion, setActiveEmotion] = useState<string>("all");

  const allEmotions = useMemo(() => {
    const set = new Set<string>();
    timeCapsules.forEach((c) => {
      if (c.visibility === "private") return;
      c.emotions.forEach((e) => set.add(e));
    });
    return Array.from(set);
  }, [timeCapsules]);

  const visibleCapsules = useMemo(
    () =>
      timeCapsules.filter((c) => {
        if (c.visibility === "private") return false;
        if (activeEmotion === "all") return true;
        return c.emotions.includes(activeEmotion);
      }),
    [timeCapsules, activeEmotion],
  );

  return (
    <Layout>
      <div className="min-h-screen py-12">
        <div className="container mx-auto px-4">
          {/* Header */}
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-center mb-10"
          >
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/10 text-primary mb-4">
              <Sparkles className="w-4 h-4" />
              <span className="text-sm font-medium">Explore life phases</span>
            </div>
            <h1 className="font-display text-3xl md:text-4xl font-bold mb-3">
              Capsules from different chapters
            </h1>
            <p className="text-muted-foreground max-w-2xl mx-auto text-sm md:text-base">
              Peek into how people describe their school days, breakup eras, and
              healing phases — through the favorites that defined them.
            </p>
          </motion.div>

          {/* Filters */}
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="flex flex-wrap items-center justify-between gap-4 mb-8"
          >
            <div className="flex flex-wrap gap-2">
              <Button
                type="button"
                variant={activeEmotion === "all" ? "default" : "outline"}
                size="sm"
                className="rounded-full"
                onClick={() => setActiveEmotion("all")}
              >
                All moods
              </Button>
              {allEmotions.map((emotion) => (
                <Button
                  key={emotion}
                  type="button"
                  variant={
                    activeEmotion === emotion ? "default" : "outline"
                  }
                  size="sm"
                  className="rounded-full"
                  onClick={() => setActiveEmotion(emotion)}
                >
                  {emotion}
                </Button>
              ))}
            </div>
            <Link href="/capsules">
              <Button variant="ghost" size="sm" className="gap-1.5">
                <Clock className="w-4 h-4" />
                Back to my capsules
              </Button>
            </Link>
          </motion.div>

          {/* Capsules list (single column, social-style cards) */}
          {visibleCapsules.length === 0 ? (
            <div className="text-center py-16 text-muted-foreground">
              <p className="mb-2 text-sm">
                No capsules match this mood filter yet.
              </p>
              <p className="text-xs">
                Try changing the mood filter or create your own capsule.
              </p>
            </div>
          ) : (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="flex flex-col gap-4 max-w-2xl mx-auto"
            >
              {visibleCapsules.map((capsule) => (
                <Link key={capsule.id} href={`/capsules/${capsule.id}`}>
                  <TimeCapsuleCard capsule={capsule} />
                </Link>
              ))}
            </motion.div>
          )}
        </div>
      </div>
    </Layout>
  );
}

