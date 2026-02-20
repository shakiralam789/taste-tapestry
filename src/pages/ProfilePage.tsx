"use client";
import { useMemo } from 'react';
import { motion } from 'framer-motion';
import { Layout } from '@/components/layout/Layout';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ProfilePostCard } from '@/components/profile/ProfilePostCard';
import { useWishbook } from '@/contexts/WishbookContext';
import { interestCategories } from '@/data/mockData';
import type { InterestCategory } from '@/types/wishbook';
import {
  MapPin,
  Calendar,
  Edit3,
  Share2,
  Sparkles,
  Plus,
  Rocket,
  Users,
  Heart,
  Palette,
  Mic2,
  Lock,
  ChevronRight,
} from 'lucide-react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import Link from 'next/link';

const categoryLabels: Record<InterestCategory, string> = {
  creative: 'Creative pursuits',
  performance: 'Performance-based',
  skill: 'Skill-based',
  intellectual: 'Intellectual / technical',
  unique: 'Unique / unconventional',
  collaborative: 'Collaborative',
};

const talentOptions = ['Singing', 'Dancing', 'Writing', 'Art', 'Acting', 'Stunts'];

export default function ProfilePage() {
  const { user, favorites, timeCapsules } = useWishbook();

  const interestsByCategory = useMemo(() => {
    const map: Partial<Record<InterestCategory, typeof user.interests>> = {};
    user.interests.forEach((i) => {
      if (!map[i.category]) map[i.category] = [];
      map[i.category]!.push(i);
    });
    return map;
  }, [user]);

  const revealedTalents = useMemo(
    () => user.talents.filter((t) => t.isPublic),
    [user.talents]
  );

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: { staggerChildren: 0.08 },
    },
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: { opacity: 1, y: 0 },
  };

  return (
    <Layout className="md:px-0 px-0 pt-0 md:pt-0">
      <div className="min-h-screen pb-12">
        {/* Immersive Cyber Banner */}
        <div className="relative h-64 md:h-80 w-full overflow-hidden">
          <div className="absolute inset-0 bg-[url('https://images.unsplash.com/photo-1535868463750-c78d9543614f?q=80&w=2676&auto=format&fit=crop')] bg-cover bg-center opacity-60" />
          <div className="absolute inset-0 bg-gradient-to-t from-background via-background/20 to-transparent" />
          <div className="absolute inset-0 bg-gradient-to-r from-primary/20 to-secondary/20 mix-blend-overlay" />
        </div>

        <div className="container mx-auto px-4 -mt-32 relative z-10">
          <div className="flex flex-col lg:flex-row md:gap-6 gap-4 items-start">
            {/* Left: Profile Identity Card */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="w-full lg:w-1/3 flex flex-col items-center text-center p-4 pt-8 md:p-8 rounded-3xl bg-card/40 backdrop-blur-xl border border-white/10 shadow-xl"
            >
              <div className="relative md:mb-6 mb-4 group">
                <div className="absolute -inset-1 bg-gradient-to-br from-primary to-secondary rounded-full opacity-75 blur transition duration-500 group-hover:opacity-100" />
                <Avatar className="w-40 h-40 ring-4 ring-background relative">
                  <AvatarImage src={user.avatar} alt={user.name} className="object-cover" />
                  <AvatarFallback className="text-4xl bg-background text-foreground">
                    {user.name[0]}
                  </AvatarFallback>
                </Avatar>
                <div className="absolute bottom-2 right-2 flex gap-2">
                  <Button size="icon" variant="secondary" className="rounded-full shadow-lg h-10 w-10">
                    <Edit3 className="w-4 h-4" />
                  </Button>
                </div>
              </div>

              <h1 className="font-display md:text-4xl text-2xl font-bold mb-2 flex items-center gap-2">
                {user.name}
                <Sparkles className="w-6 h-6 text-yellow-400 fill-yellow-400 animate-pulse" />
              </h1>
              <p className="text-primary font-medium mb-4 md:text-lg text-base">@{user.username}</p>

              <p className="text-sm md:text-base text-muted-foreground md:mb-6 mb-4 leading-relaxed max-w-xs">
                {user.bio || 'Digital explorer navigating the neon tides. Curator of moments and memories.'}
              </p>

              <div className="flex items-center justify-center gap-4 md:text-sm text-xs text-gray-400 md:mb-6 mb-4 w-full flex-wrap">
                <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-white/5 border border-white/5">
                  <MapPin className="w-3.5 h-3.5" />
                  {user.location || 'Neo Tokyo'}
                </div>
                <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-white/5 border border-white/5">
                  <Calendar className="w-3.5 h-3.5" />
                  Since {user.createdAt.getFullYear()}
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3 w-full">
                <Button className="w-full rounded-xl" variant="outline" size="sm">
                  <Edit3 className="w-4 h-4 mr-2" />
                  Edit profile
                </Button>
                <Button className="w-full rounded-xl" variant="outline" size="sm">
                  <Share2 className="w-4 h-4 mr-2" /> Share
                </Button>
              </div>

              {/* Quick discovery links */}
              <div className="md:mt-6 mt-4 w-full space-y-2">
                <Link href="/matches" className="block">
                  <div className="flex items-center justify-between p-3 rounded-xl bg-white/5 border border-white/5 hover:bg-white/10 hover:border-primary/20 transition-colors">
                    <span className="flex items-center gap-2 text-sm font-medium">
                      <Heart className="w-4 h-4 text-primary" />
                      Taste matches
                    </span>
                    <ChevronRight className="w-4 h-4 text-muted-foreground" />
                  </div>
                </Link>
                <Link href="/mood" className="block">
                  <div className="flex items-center justify-between p-3 rounded-xl bg-white/5 border border-white/5 hover:bg-white/10 hover:border-primary/20 transition-colors">
                    <span className="flex items-center gap-2 text-sm font-medium">
                      <Palette className="w-4 h-4 text-primary" />
                      Mood recommendations
                    </span>
                    <ChevronRight className="w-4 h-4 text-muted-foreground" />
                  </div>
                </Link>
                <Link href="/capsules" className="block">
                  <div className="flex items-center justify-between p-3 rounded-xl bg-white/5 border border-white/5 hover:bg-white/10 hover:border-primary/20 transition-colors">
                    <span className="flex items-center gap-2 text-sm font-medium">
                      <Rocket className="w-4 h-4 text-primary" />
                      Time capsules
                    </span>
                    <ChevronRight className="w-4 h-4 text-muted-foreground" />
                  </div>
                </Link>
              </div>
            </motion.div>

            {/* Right: Content & Stats */}
            <div className="flex-1 w-full space-y-8 pt-8 lg:pt-0">
              {/* Stats Bar */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.1 }}
                className="grid grid-cols-2 sm:grid-cols-4 gap-4"
              >
                {[
                  { label: 'Followers', value: user.followers.toLocaleString(), icon: Users },
                  { label: 'Following', value: user.following.toLocaleString(), icon: Users },
                  { label: 'Stars', value: favorites.length, icon: Sparkles },
                  { label: 'Capsules', value: timeCapsules.length, icon: Rocket },
                ].map((stat, i) => (
                  <div
                    key={i}
                    className="p-4 rounded-2xl bg-card/30 border border-white/5 backdrop-blur-sm hover:bg-white/5 transition-colors group cursor-default"
                  >
                    <div className="flex items-center gap-2 mb-2 text-muted-foreground">
                      <stat.icon className="w-4 h-4 group-hover:text-primary transition-colors" />
                      <span className="text-xs font-semibold uppercase tracking-wider">{stat.label}</span>
                    </div>
                    <p className="font-display md:text-3xl text-2xl font-bold text-foreground group-hover:text-primary transition-colors">
                      {stat.value}
                    </p>
                  </div>
                ))}
              </motion.div>

              <Tabs defaultValue="favorites" className="w-full">
                <TabsList className="w-full justify-start flex-wrap bg-transparent border-b border-white/10 p-0 h-auto rounded-none mb-8 gap-4">
                  <TabsTrigger
                    value="favorites"
                    className="rounded-none border-b-2 border-transparent px-0 py-4 data-[state=active]:bg-transparent data-[state=active]:border-primary data-[state=active]:text-primary data-[state=active]:shadow-none hover:text-primary transition-colors text-base"
                  >
                    My collection
                  </TabsTrigger>
                  <TabsTrigger
                    value="interests"
                    className="rounded-none border-b-2 border-transparent px-0 py-4 data-[state=active]:bg-transparent data-[state=active]:border-primary data-[state=active]:text-primary data-[state=active]:shadow-none hover:text-primary transition-colors text-base"
                  >
                    Interests & pursuits
                  </TabsTrigger>
                  <TabsTrigger
                    value="talents"
                    className="rounded-none border-b-2 border-transparent px-0 py-4 data-[state=active]:bg-transparent data-[state=active]:border-primary data-[state=active]:text-primary data-[state=active]:shadow-none hover:text-primary transition-colors text-base"
                  >
                    Hidden talents
                  </TabsTrigger>
                  <TabsTrigger
                    value="capsules"
                    className="rounded-none border-b-2 border-transparent px-0 py-4 data-[state=active]:bg-transparent data-[state=active]:border-primary data-[state=active]:text-primary data-[state=active]:shadow-none hover:text-primary transition-colors text-base"
                  >
                    Time capsules
                  </TabsTrigger>
                </TabsList>

                <TabsContent value="favorites" className="mt-0">
                  <div className="flex items-center justify-between mb-6">
                    <div>
                      <h3 className="text-2xl font-display font-bold">My collection</h3>
                      <p className="text-muted-foreground text-sm">
                        Curated favorites — movies, songs, books, places. Your taste, your story.
                      </p>
                    </div>
                    <Link href="/add-favorite">
                      <Button
                        variant="outline"
                        size="sm"
                        className="rounded-full border-dashed group hover:border-primary hover:text-primary"
                      >
                        <Plus className="w-4 h-4 mr-1 group-hover:rotate-90 transition-transform" /> Add new
                      </Button>
                    </Link>
                  </div>
                  <motion.div
                    variants={containerVariants}
                    initial="hidden"
                    animate="visible"
                    className="grid grid-cols-2 md:grid-cols-2 lg:grid-cols-3 gap-4"
                  >
                    {favorites.map((favorite) => (
                      <motion.div key={favorite.id} variants={itemVariants}>
                        <ProfilePostCard favorite={favorite} />
                      </motion.div>
                    ))}
                    <Link href="/add-favorite">
                      <motion.div
                        variants={itemVariants}
                        className="aspect-[4/5] rounded-2xl border-2 border-dashed border-black/10 dark:border-white/10 flex flex-col items-center justify-center gap-4 text-muted-foreground hover:text-primary hover:border-primary/50 hover:bg-primary/5 transition-all cursor-pointer group"
                      >
                        <div className="w-12 h-12 rounded-full bg-white/5 flex items-center justify-center group-hover:scale-110 transition-transform">
                          <Plus className="w-6 h-6" />
                        </div>
                        <span className="font-medium text-sm">Add to collection</span>
                      </motion.div>
                    </Link>
                  </motion.div>
                </TabsContent>

                <TabsContent value="interests" className="mt-0">
                  <div className="mb-6">
                    <h3 className="text-2xl font-display font-bold">Interests & creative pursuits</h3>
                    <p className="text-muted-foreground text-sm">
                      Creative, performance, skill-based, and more — what drives you.
                    </p>
                  </div>
                  {user.interests.length > 0 ? (
                    <div className="space-y-6">
                      {Object.entries(interestsByCategory).map(([cat, interests]) => (
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
                                <Badge key={i.id} variant="secondary" className="bg-primary/10 text-primary border-primary/20">
                                  {i.name}
                                </Badge>
                              ))}
                            </div>
                          </div>
                        )
                      ))}
                    </div>
                  ) : null}
                  <div className="mt-6 p-6 rounded-2xl bg-card/20 border border-dashed border-white/10">
                    <h4 className="text-lg font-semibold mb-3 text-muted-foreground">Explore more interests</h4>
                    <p className="text-sm text-muted-foreground mb-4">
                      Add from creative, performance, skill-based, intellectual, unique, and collaborative pursuits.
                    </p>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      {Object.entries(interestCategories).map(([category, interests]) => (
                        <div key={category} className="space-y-2">
                          <span className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
                            {categoryLabels[category as InterestCategory] || category}
                          </span>
                          <div className="flex flex-wrap gap-2">
                            {interests.slice(0, 6).map((i) => (
                              <Badge key={i.id} variant="outline" className="bg-background/50 cursor-pointer hover:border-primary/50">
                                {i.name}
                              </Badge>
                            ))}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </TabsContent>

                <TabsContent value="talents" className="mt-0">
                  <div className="mb-6">
                    <h3 className="text-2xl font-display font-bold">Hidden talents</h3>
                    <p className="text-muted-foreground text-sm">
                      Reveal your secret skills — singing, dancing, writing, art, acting, stunts.
                    </p>
                  </div>
                  {revealedTalents.length > 0 && (
                    <div className="flex flex-wrap gap-3 mb-6">
                      {revealedTalents.map((t) => (
                        <div
                          key={t.id}
                          className="flex items-center gap-2 px-4 py-3 rounded-2xl bg-secondary/10 border border-secondary/20"
                        >
                          <Mic2 className="w-5 h-5 text-secondary" />
                          <span className="font-medium">{t.name}</span>
                          <Badge variant="secondary" className="text-xs">Revealed</Badge>
                        </div>
                      ))}
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
                        <Button key={name} variant="outline" size="sm" className="rounded-full">
                          {name}
                        </Button>
                      ))}
                    </div>
                    <p className="text-xs text-muted-foreground text-center mt-4 flex items-center justify-center gap-1">
                      <Lock className="w-3 h-3" /> Private until you reveal
                    </p>
                  </div>
                </TabsContent>

                <TabsContent value="capsules" className="mt-0">
                  <div className="flex items-center justify-between mb-6">
                    <div>
                      <h3 className="text-2xl font-display font-bold">Time capsules</h3>
                      <p className="text-muted-foreground text-sm">
                        Collections tied to a period — school days, breakup era, summer 2024.
                      </p>
                    </div>
                    <Link href="/create-capsule">
                      <Button variant="outline" size="sm" className="rounded-full border-dashed group hover:border-primary hover:text-primary">
                        <Plus className="w-4 h-4 mr-1 group-hover:rotate-90 transition-transform" /> Create capsule
                      </Button>
                    </Link>
                  </div>
                  {timeCapsules.length === 0 ? (
                    <Link href="/create-capsule">
                      <div className="p-12 rounded-3xl bg-card/20 border-2 border-dashed border-white/10 text-center text-muted-foreground hover:border-primary/30 hover:bg-primary/5 transition-all cursor-pointer group">
                        <Rocket className="w-14 h-14 mx-auto mb-4 opacity-50 group-hover:opacity-80" />
                        <h4 className="text-lg font-semibold mb-2 text-foreground">No capsules yet</h4>
                        <p className="text-sm mb-4">Capture a chapter of your life with favorites, emotions, and stories.</p>
                        <Button variant="secondary" size="sm">Create your first capsule</Button>
                      </div>
                    </Link>
                  ) : (
                    <motion.div
                      variants={containerVariants}
                      initial="hidden"
                      animate="visible"
                      className="grid grid-cols-1 md:grid-cols-2 gap-6"
                    >
                      {timeCapsules.map((capsule) => (
                        <motion.div key={capsule.id} variants={itemVariants}>
                          <Link href={`/capsules#${capsule.id}`}>
                            <div className="group rounded-2xl overflow-hidden border border-white/10 bg-card/30 hover:border-primary/20 transition-all">
                              <div className="aspect-video relative overflow-hidden">
                                {capsule.image ? (
                                  <img
                                    src={capsule.image}
                                    alt={capsule.title}
                                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                                  />
                                ) : (
                                  <div className="w-full h-full bg-gradient-to-br from-primary/20 to-secondary/20 flex items-center justify-center">
                                    <Rocket className="w-12 h-12 text-primary/50" />
                                  </div>
                                )}
                                <div className="absolute inset-0 bg-gradient-to-t from-background/90 to-transparent" />
                                <div className="absolute bottom-0 left-0 right-0 p-4">
                                  <h4 className="font-display font-semibold text-lg">{capsule.title}</h4>
                                  <p className="text-xs text-muted-foreground">{capsule.period}</p>
                                  <div className="flex flex-wrap gap-1 mt-2">
                                    {capsule.emotions.slice(0, 3).map((e) => (
                                      <span key={e} className="text-xs px-2 py-0.5 rounded-full bg-white/10">
                                        {e}
                                      </span>
                                    ))}
                                  </div>
                                </div>
                              </div>
                              <div className="p-4">
                                <p className="text-sm text-muted-foreground line-clamp-2">{capsule.description}</p>
                              </div>
                            </div>
                          </Link>
                        </motion.div>
                      ))}
                      <Link href="/create-capsule">
                        <motion.div
                          variants={itemVariants}
                          className="aspect-video rounded-2xl border-2 border-dashed border-white/10 flex flex-col items-center justify-center gap-3 text-muted-foreground hover:text-primary hover:border-primary/50 hover:bg-primary/5 transition-all cursor-pointer group"
                        >
                          <Plus className="w-10 h-10" />
                          <span className="font-medium text-sm">New capsule</span>
                        </motion.div>
                      </Link>
                    </motion.div>
                  )}
                </TabsContent>
              </Tabs>
            </div>
          </div>
        </div>
      </div>
    </Layout>
  );
}
