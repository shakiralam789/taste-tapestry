import React, { useMemo, useState } from "react";
import { interestCategories } from "@/data/mockData";
import { InterestCategory, Interest } from "@/types/wishbook";
import { useWishbook } from "@/contexts/WishbookContext";
import { updateProfile, getProfile } from "@/features/profile/api";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useAuth } from "@/features/auth/AuthContext";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { motion, AnimatePresence } from "framer-motion";
import { Palette, Mic2, Star, Brain, Sparkles, Users, Plus, Zap, X, Check, Pencil, Trash2, MoreHorizontal } from "lucide-react";
import { cn } from "@/lib/utils";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

const categoryConfig: Record<InterestCategory, { label: string; icon: any; color: string; bg: string }> = {
  creative: { label: "Creative pursuits", icon: Palette, color: "text-pink-400", bg: "bg-pink-500/10" },
  performance: { label: "Performance-based", icon: Mic2, color: "text-orange-400", bg: "bg-orange-500/10" },
  skill: { label: "Skill-based", icon: Star, color: "text-yellow-400", bg: "bg-yellow-500/10" },
  intellectual: { label: "Intellectual / technical", icon: Brain, color: "text-indigo-400", bg: "bg-indigo-500/10" },
  unique: { label: "Unique / unconventional", icon: Sparkles, color: "text-purple-400", bg: "bg-purple-500/10" },
  collaborative: { label: "Collaborative", icon: Users, color: "text-cyan-400", bg: "bg-cyan-500/10" },
};

export default function Interests() {
  const { user: authUser } = useAuth();
  const queryClient = useQueryClient();

  const { data: profile, isLoading } = useQuery({
    queryKey: ["profile"],
    queryFn: getProfile,
    enabled: !!authUser,
    staleTime: 5 * 60 * 1000,
  });

  const profileInterests = profile?.interests || [];

  const [categoryInputs, setCategoryInputs] = useState<Record<string, string>>({});
  const [descriptionInputs, setDescriptionInputs] = useState<Record<string, string>>({});
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingInterest, setEditingInterest] = useState<Interest | null>(null);
  const [editDescriptionValue, setEditDescriptionValue] = useState("");

  const handleCategoryInputChange = (category: string, value: string) => {
    setCategoryInputs(prev => ({ ...prev, [category]: value }));
  };

  const handleDescriptionInputChange = (category: string, value: string) => {
    setDescriptionInputs(prev => ({ ...prev, [category]: value }));
  };

  const handleAddCategoryInterest = (e: React.FormEvent, category: string) => {
    e.preventDefault();
    const val = categoryInputs[category];
    if (!val || !val.trim()) return;

    const desc = descriptionInputs[category]?.trim();

    const newInterest: Interest = {
      id: `custom-${Date.now()}`,
      name: val.trim(),
      category: category as InterestCategory,
      ...(desc ? { description: desc } : {})
    };

    handleAddInterest(newInterest);
    setCategoryInputs(prev => ({ ...prev, [category]: "" }));
    setDescriptionInputs(prev => ({ ...prev, [category]: "" }));
  };

  const handleAddInterest = async (interest: Interest) => {
    if (!profileInterests.find((i: Interest) => i.id === interest.id)) {
      const updatedInterests = [...profileInterests, interest];
      // Opt UI Update
      queryClient.setQueryData(["profile"], (old: any) => ({
        ...old,
        interests: updatedInterests,
      }));

      try {
        await updateProfile({ interests: updatedInterests });
      } catch (err) {
        console.error("Failed to save interest", err);
        queryClient.invalidateQueries({ queryKey: ["profile"] });
      }
    }
  };

  const handleRemoveInterest = async (interestId: string) => {
    const updatedInterests = profileInterests.filter((i: Interest) => i.id !== interestId);
    
    queryClient.setQueryData(["profile"], (old: any) => ({
      ...old,
      interests: updatedInterests,
    }));

    setEditingInterest(null);

    try {
      await updateProfile({ interests: updatedInterests });
    } catch (err) {
      console.error("Failed to remove interest", err);
      queryClient.invalidateQueries({ queryKey: ["profile"] });
    }
  };

  const handleUpdateDescription = async () => {
    if (!editingInterest) return;

    const updatedInterests = profileInterests.map((i: Interest) => {
      if (i.id === editingInterest.id) {
        return { ...i, description: editDescriptionValue.trim() || undefined };
      }
      return i;
    });

    queryClient.setQueryData(["profile"], (old: any) => ({
      ...old,
      interests: updatedInterests,
    }));

    setEditingInterest(null);

    try {
      await updateProfile({ interests: updatedInterests });
    } catch (err) {
      console.error("Failed to update interest description", err);
      queryClient.invalidateQueries({ queryKey: ["profile"] });
    }
  };

  const interestsByCategory = useMemo(() => {
    const map: Partial<
      Record<InterestCategory, Interest[]>
    > = {};
    profileInterests.forEach((i: Interest) => {
      if (!map[i.category]) map[i.category] = [];
      map[i.category]!.push(i);
    });
    return map;
  }, [profileInterests]);

  if (isLoading) {
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
          The skills, hobbies, and creative escapes that define your energy.
        </p>
      </motion.div>

      {/* User Interests Grid */}
      {profileInterests.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <AnimatePresence mode="popLayout">
            {Object.entries(interestsByCategory).map(([cat, interests], index) => {
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
                  className="group relative p-6 rounded-2xl bg-card/10 border border-white/5 backdrop-blur-md hover:bg-card/20 hover:border-white/10 transition-all overflow-hidden"
                >
                  {/* Decorative Background Glow */}
                  <div className={cn("absolute -right-4 -top-4 w-24 h-24 blur-3xl opacity-20 transition-opacity group-hover:opacity-40", config.bg)} />

                  <div className="relative flex items-center gap-3 mb-4">
                    <motion.div
                      whileHover={{ rotate: 15 }}
                      className={cn("p-2 rounded-xl border border-white/10", config.bg)}
                    >
                      <Icon className={cn("w-5 h-5", config.color)} />
                    </motion.div>
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
                              <motion.div
                                layout
                                initial={{ opacity: 0, scale: 0.8, filter: "blur(4px)" }}
                                animate={{ opacity: 1, scale: 1, filter: "blur(0px)" }}
                                exit={{ opacity: 0, scale: 0.8, filter: "blur(4px)" }}
                                transition={{ type: "spring", stiffness: 500, damping: 30 }}
                                whileHover={{ scale: 1.05 }}
                                whileTap={{ scale: 0.95 }}
                                className="relative"
                              >
                                <DropdownMenu>
                                  <DropdownMenuTrigger asChild>
                                    <Badge
                                      variant="secondary"
                                      className={cn(
                                        "bg-white/5 text-foreground/80 border-white/5 transition-all select-none px-3 py-1 font-medium flex items-center gap-1",
                                        "hover:bg-primary/20 hover:text-primary hover:border-primary/30 cursor-pointer",
                                      )}
                                      onClick={(e) => e.stopPropagation()}
                                    >
                                      <span>{i.name}</span>
                                    </Badge>
                                  </DropdownMenuTrigger>
                                  <DropdownMenuContent
                                    align="end"
                                    className="w-40 text-xs"
                                    onClick={(e) => e.stopPropagation()}
                                  >
                                    <DropdownMenuItem
                                      className="flex items-center gap-2 cursor-pointer"
                                      onSelect={() => {
                                        setEditingInterest(i);
                                        setEditDescriptionValue(i.description || "");
                                      }}
                                    >
                                      <Pencil className="w-3 h-3" />
                                      Edit note
                                    </DropdownMenuItem>
                                    <DropdownMenuItem
                                      className="flex items-center gap-2 cursor-pointer text-destructive focus:text-destructive"
                                      onSelect={() => {
                                        handleRemoveInterest(i.id);
                                      }}
                                    >
                                      <Trash2 className="w-3 h-3" />
                                      Remove
                                    </DropdownMenuItem>
                                  </DropdownMenuContent>
                                </DropdownMenu>

                                <Popover open={editingInterest?.id === i.id}>
                                  <PopoverTrigger asChild>
                                    <button
                                      type="button"
                                      className="sr-only"
                                      aria-hidden="true"
                                    />
                                  </PopoverTrigger>
                                  <PopoverContent
                                    className="w-64 p-3 bg-card/95 backdrop-blur-xl border-white/10 shadow-2xl"
                                    side="bottom"
                                    align="start"
                                    sideOffset={8}
                                    onPointerDownOutside={() => {
                                      if (editingInterest?.id === i.id) {
                                        setEditingInterest(null);
                                      }
                                    }}
                                  >
                                    <div className="space-y-2">
                                      <div className="flex items-center gap-2">
                                        <Badge variant="outline" className="bg-primary/20 text-primary border-primary/40 px-2 py-0.5 text-[10px] uppercase">
                                          Edit
                                        </Badge>
                                        <span className="text-xs font-semibold">{i.name}</span>
                                      </div>
                                      <Textarea
                                        value={editDescriptionValue}
                                        onChange={(e) => setEditDescriptionValue(e.target.value)}
                                        placeholder="Why do you love this?"
                                        className="min-h-[60px] bg-black/40 border-white/10 text-xs resize-none"
                                      />
                                      <Button
                                        size="sm"
                                        variant="gradient"
                                        className="w-full h-7 text-xs"
                                        onClick={handleUpdateDescription}
                                      >
                                        Save
                                      </Button>
                                    </div>
                                  </PopoverContent>
                                </Popover>
                              </motion.div>
                            </TooltipTrigger>
                            {i.description && editingInterest?.id !== i.id && (
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
            animate={{ y: [0, -10, 0] }}
            transition={{ repeat: Infinity, duration: 2, ease: "easeInOut" }}
            className="w-12 h-12 bg-white/5 rounded-full flex items-center justify-center mx-auto mb-4"
          >
            <Plus className="w-6 h-6 text-muted-foreground" />
          </motion.div>
          <p className="text-muted-foreground font-medium">No interests added yet.</p>
          <p className="text-xs text-muted-foreground/60 mt-1">Explore categories below to start your profile.</p>
        </motion.div>
      )}

      {/* Explore More Button triggering Dialog */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogTrigger asChild>
          <motion.div
            initial={{ opacity: 0, y: 40 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="relative group rounded-[32px] overflow-hidden cursor-pointer"
          >
            {/* Hub Glow */}
            <div className="absolute inset-0 bg-gradient-to-b from-primary/5 to-transparent pointer-events-none" />

            <div className="relative p-8 rounded-[32px] bg-card/15 border border-white/5 backdrop-blur-xl">
              <div className="flex items-center gap-3">
                <motion.div
                  whileHover={{ rotate: 90 }}
                  transition={{ type: "spring", stiffness: 200, damping: 10 }}
                  className="w-10 h-10 rounded-full bg-primary/20 flex items-center justify-center border border-primary/30"
                >
                  <Plus className="w-5 h-5 text-primary" />
                </motion.div>
                <div>
                  <h4 className="text-xl font-bold font-display">Expand your tapestry</h4>
                  <p className="text-sm text-muted-foreground">Click to add passions to your profile</p>
                </div>
              </div>
            </div>
          </motion.div>
        </DialogTrigger>

        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-2xl font-display">Expand your tapestry</DialogTitle>
            <DialogDescription>
              Select the hobbies and passions that resonate with your energy.
            </DialogDescription>
          </DialogHeader>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mt-4">
            {Object.entries(interestCategories).map(([category, interests], idx) => {
              const config = categoryConfig[category as InterestCategory] || {
                label: category,
                icon: Zap,
                color: "text-primary",
                bg: "bg-primary/10",
              };
              const Icon = config.icon;

              const predefined = (interests as Interest[]).slice(0, 8);
              const userCustomsForCategory = profileInterests.filter(
                (i: Interest) => i.category === category && !predefined.some(p => p.id === i.id)
              );
              const combinedInterests = [...predefined, ...userCustomsForCategory];

              return (
                <div key={category} className="space-y-4">
                  <div className="flex items-center gap-2">
                    <Icon className={cn("w-4 h-4", config.color)} />
                    <span className="text-xs font-black uppercase tracking-[0.2em] text-muted-foreground/60">
                      {config.label}
                    </span>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {combinedInterests.map((i) => {
                      const isAdded = profileInterests.some((userInt: Interest) => userInt.id === i.id);

                      return (
                        <motion.div
                          key={i.id}
                          layout
                          whileHover={{ scale: 1.05, y: -2 }}
                          whileTap={isAdded ? {} : { scale: 0.95 }}
                          className="group/badge"
                        >
                          <Badge
                            variant="outline"
                            className={cn(
                              "transition-all duration-300 rounded-lg px-3 py-1 font-medium flex items-center gap-1.5",
                              isAdded
                                ? "bg-primary/20 border-primary/40 text-primary hover:bg-primary/30"
                                : "bg-card border-white/10 hover:border-primary/40 hover:bg-primary/10 text-muted-foreground hover:text-foreground cursor-pointer"
                            )}
                            onClick={() => {
                              if (!isAdded) {
                                handleAddInterest(i);
                              } else {
                                handleRemoveInterest(i.id);
                              }
                            }}
                          >
                            <AnimatePresence mode="popLayout">
                              {isAdded && (
                                <motion.div
                                  key="check"
                                  initial={{ scale: 0, width: 0, opacity: 0 }}
                                  animate={{ scale: 1, width: "auto", opacity: 1 }}
                                  exit={{ scale: 0, width: 0, opacity: 0 }}
                                  className="flex items-center"
                                >
                                  <Check className="w-3 h-3" />
                                </motion.div>
                              )}
                            </AnimatePresence>

                            <span>{i.name}</span>
                          </Badge>
                        </motion.div>
                      );
                    })}
                  </div>
                  <form 
                    onSubmit={(e) => handleAddCategoryInterest(e, category)} 
                    className="flex flex-col gap-2 mt-4 max-w-[280px]"
                  >
                    <div className="flex items-center gap-2">
                      <Input
                        placeholder={`Add custom ${config.label.toLowerCase()}...`}
                        value={categoryInputs[category] || ""}
                        onChange={(e) => handleCategoryInputChange(category, e.target.value)}
                        className="bg-black/20 border-white/10 h-9 rounded-lg px-3 text-xs w-full placeholder:text-muted-foreground/50 focus-visible:ring-primary/50"
                      />
                      <Button
                        type="submit"
                        variant="secondary"
                        size="sm"
                        className="h-9 rounded-lg px-4 text-xs bg-white/5 hover:bg-white/10 border border-white/10 shrink-0"
                        disabled={!(categoryInputs[category] || "").trim()}
                      >
                        <Plus className="w-3 h-3 mr-1" />
                        Add
                      </Button>
                    </div>
                    <Input
                      placeholder="(Optional) Why do you love this?"
                      value={descriptionInputs[category] || ""}
                      onChange={(e) => handleDescriptionInputChange(category, e.target.value)}
                      className="bg-black/20 border-white/10 h-8 rounded-lg px-3 text-[11px] w-full placeholder:text-muted-foreground/40 focus-visible:ring-primary/50 italic"
                    />
                  </form>
                </div>
              );
            })}
          </div>

        </DialogContent>
      </Dialog>
    </div>
  );
}

