"use client";
import { motion } from "framer-motion";
import Link from "next/link";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Layout } from "@/components/layout/Layout";
import { TimeCapsuleCard } from "@/components/capsules/TimeCapsuleCard";
import { Button } from "@/components/ui/button";
import { Clock, Plus, Archive, Sparkles } from "lucide-react";
import { deleteCapsule, getMyCapsules, updateCapsule } from "@/features/capsules/api";
import { getProfile } from "@/features/profile/api";
import { useRouter } from "next/navigation";
import { toast } from "sonner";

export default function CapsulesPage() {
  const router = useRouter();
  const queryClient = useQueryClient();
  const { data: profile } = useQuery({
    queryKey: ["profile"],
    queryFn: getProfile,
  });
  const { data: timeCapsules = [], isLoading } = useQuery({
    queryKey: ["capsules"],
    queryFn: getMyCapsules,
  });

  const updateVisibilityMutation = useMutation({
    mutationFn: ({
      id,
      visibility,
    }: {
      id: string;
      visibility: "public" | "private";
    }) => updateCapsule(id, { visibility }),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ["capsules"] });
      toast.success("Capsule visibility updated");
    },
    onError: () => {
      toast.error("Could not update capsule visibility");
    },
  });

  const deleteMutation = useMutation({
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
              <Button className="rounded-full" variant="gradient" size="lg">
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
            className="max-w-2xl mx-auto grid grid-cols-1 md:grid-cols-2 gap-6 mb-12"
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

          {/* Capsules list (single column, social-style cards) */}
          {isLoading ? (
            <p className="text-center text-muted-foreground py-10">
              Loading capsules...
            </p>
          ) : timeCapsules.length > 0 ? (
            <div className="flex flex-col gap-4 max-w-2xl mx-auto">
              {timeCapsules.map((capsule, index) => (
                <motion.div
                  key={capsule.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.06 }}
                >
                  <TimeCapsuleCard
                    capsule={capsule}
                    onClick={() => router.push(`/capsules/${capsule.id}`)}
                    showActions
                    authorName={
                      profile?.displayName?.trim() ||
                      profile?.username?.trim() ||
                      "You"
                    }
                    authorSubtitle="Your time capsule"
                    authorAvatar={profile?.avatar ?? null}
                    onEdit={() => router.push(`/update-captule/${capsule.id}`)}
                    onToggleVisibility={(visibility) =>
                      updateVisibilityMutation.mutate({
                        id: capsule.id,
                        visibility,
                      })
                    }
                    onDelete={() => deleteMutation.mutate(capsule.id)}
                  />
                </motion.div>
              ))}

              {/* Add New Card */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: timeCapsules.length * 0.06 }}
              >
                <Link href="/create-capsule">
                  <div className="rounded-xl elevated-card p-8 h-full min-h-[280px] flex flex-col items-center justify-center text-center border-2 border-dashed border-border hover:border-primary/50 transition-colors cursor-pointer group">
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
            </div>
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
    </Layout>
  );
}
