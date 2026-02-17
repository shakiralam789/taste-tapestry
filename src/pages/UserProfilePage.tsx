import { useMemo } from 'react';
import { useParams, Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Layout } from '@/components/layout/Layout';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ProfilePostCard } from '@/components/profile/ProfilePostCard';
import { useWishbook } from '@/contexts/WishbookContext';
import { TasteMatchCard } from '@/components/matching/TasteMatchCard';
import type { InterestCategory, TasteMatch } from '@/types/wishbook';
import {
  MapPin,
  Share2,
  ArrowLeft,
  Sparkles,
  Users,
  Rocket,
  Mic2,
  Palette,
} from 'lucide-react';

const categoryLabels: Record<InterestCategory, string> = {
  creative: 'Creative pursuits',
  performance: 'Performance-based',
  skill: 'Skill-based',
  intellectual: 'Intellectual / technical',
  unique: 'Unique / unconventional',
  collaborative: 'Collaborative',
};

export default function UserProfilePage() {
  const { id } = useParams<{ id: string }>();
  const { user: currentUser, favorites, timeCapsules, tasteMatches, allUsers } = useWishbook();

  const profileUser = useMemo(
    () => allUsers.find((u) => u.id === id),
    [allUsers, id]
  );

  const match = useMemo(
    () => (profileUser ? tasteMatches.find((m) => m.userId === profileUser.id) : null),
    [tasteMatches, profileUser]
  );

  const userFavorites = useMemo(
    () => (profileUser ? favorites.filter((f) => f.userId === profileUser.id) : []),
    [favorites, profileUser]
  );

  const userCapsules = useMemo(
    () => (profileUser ? timeCapsules.filter((t) => t.userId === profileUser.id) : []),
    [timeCapsules, profileUser]
  );

  const revealedTalents = useMemo(
    () => (profileUser ? profileUser.talents.filter((t) => t.isPublic) : []),
    [profileUser]
  );

  const interestsByCategory = useMemo(() => {
    if (!profileUser) return {};
    const map: Partial<Record<InterestCategory, typeof profileUser.interests>> = {};
    profileUser.interests.forEach((i) => {
      if (!map[i.category]) map[i.category] = [];
      map[i.category]!.push(i);
    });
    return map;
  }, [profileUser]);

  const displayMatch = useMemo((): TasteMatch | null => {
    if (!profileUser) return null;
    return (
      match ?? {
        userId: profileUser.id,
        user: profileUser,
        compatibilityScore: 0,
        sharedFavorites: [],
        recommendations: [],
        breakdown: [],
      }
    );
  }, [profileUser, match]);

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

  if (!profileUser) {
    return (
      <Layout>
        <div className="min-h-screen flex flex-col items-center justify-center gap-4">
          <p className="text-lg text-muted-foreground">User not found.</p>
          <Link to="/matches">
            <Button variant="outline">
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back to matches
            </Button>
          </Link>
        </div>
      </Layout>
    );
  }

  const hasInterests = profileUser.interests.length > 0;

  return (
    <Layout className="md:px-0 px-0 pt-0 md:pt-0">
      <div className="min-h-screen pb-12">
        {/* Header: Back + cover + profile row */}
        <div className="relative">
          <div className="relative h-44 md:h-52 w-full overflow-hidden border-b border-white/10">
            <div className="absolute inset-0 bg-[url('https://images.unsplash.com/photo-1535868463750-c78d9543614f?q=80&w=2676&auto=format&fit=crop')] bg-cover bg-center opacity-50" />
            <div className="absolute inset-0 bg-gradient-to-t from-background via-background/60 to-transparent" />
            <div className="absolute bottom-0 left-0 right-0 p-4 md:p-6 flex flex-wrap items-end gap-4">
              <Avatar className="w-20 h-20 md:w-24 md:h-24 ring-4 ring-background shadow-xl">
                <AvatarImage src={profileUser.avatar} alt={profileUser.name} className="object-cover" />
                <AvatarFallback className="text-2xl md:text-3xl bg-primary/20 text-foreground">
                  {profileUser.name[0]}
                </AvatarFallback>
              </Avatar>
              <div className="flex-1 min-w-0 pb-1">
                <h1 className="font-display text-2xl md:text-3xl font-bold truncate">
                  {profileUser.name}
                </h1>
                <p className="text-primary font-medium truncate">@{profileUser.username}</p>
                {profileUser.location && (
                  <p className="text-sm text-muted-foreground flex items-center gap-1 mt-1">
                    <MapPin className="w-3.5 h-3.5" />
                    {profileUser.location}
                  </p>
                )}
              </div>
              <div className="flex gap-2 flex-shrink-0">
                <Button size="sm" variant="default" className="rounded-full gap-2">
                  <Users className="w-4 h-4" />
                  Follow
                </Button>
                <Button size="sm" variant="outline" className="rounded-full">
                  <Share2 className="w-4 h-4" />
                </Button>
              </div>
            </div>
          </div>
        </div>

        <div className="container mx-auto px-4 mt-6 space-y-8">
          {/* Bio */}
          {profileUser.bio && (
            <motion.p
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="text-muted-foreground text-sm md:text-base max-w-2xl leading-relaxed"
            >
              {profileUser.bio}
            </motion.p>
          )}

          {/* Taste Match – reuse TasteMatchCard from MatchesPage */}
          {displayMatch && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
            >
              <TasteMatchCard match={displayMatch} />
            </motion.div>
          )}

          {/* Stats */}
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.08 }}
            className="grid grid-cols-3 gap-4"
          >
            <div className="p-4 rounded-2xl bg-card/30 border border-white/5 text-center">
              <p className="font-display md:text-2xl text-xl font-bold text-foreground">
                {profileUser.followers.toLocaleString()}
              </p>
              <p className="text-xs text-muted-foreground uppercase tracking-wider">Followers</p>
            </div>
            <div className="p-4 rounded-2xl bg-card/30 border border-white/5 text-center">
              <p className="font-display md:text-2xl text-xl font-bold text-foreground">
                {profileUser.following.toLocaleString()}
              </p>
              <p className="text-xs text-muted-foreground uppercase tracking-wider">Following</p>
            </div>
            <div className="p-4 rounded-2xl bg-card/30 border border-white/5 text-center">
              <p className="font-display md:text-2xl text-xl font-bold text-foreground">
                {userFavorites.length}
              </p>
              <p className="text-xs text-muted-foreground uppercase tracking-wider">Favorites</p>
            </div>
          </motion.div>

          {/* Interests (only if they have any) */}
          {hasInterests && (
            <section>
              <h2 className="md:text-xl text-lg font-display font-bold mb-3 flex items-center gap-2">
                <Palette className="w-5 h-5 text-primary" />
                Interests & pursuits
              </h2>
              <div className="space-y-4">
                {Object.entries(interestsByCategory).map(
                  ([cat, interests]) =>
                    interests &&
                    interests.length > 0 && (
                      <div
                        key={cat}
                        className="p-4 rounded-2xl bg-card/20 border border-white/5"
                      >
                        <span className="text-xs font-medium uppercase tracking-wider text-muted-foreground block mb-2">
                          {categoryLabels[cat as InterestCategory] || cat}
                        </span>
                        <div className="flex flex-wrap gap-2">
                          {interests.map((i) => (
                            <Badge key={i.id} variant="secondary" className="bg-primary/10 text-primary border-primary/20">
                              {i.name}
                            </Badge>
                          ))}
                        </div>
                      </div>
                    )
                )}
              </div>
            </section>
          )}

          {/* Revealed talents (only public) */}
          {revealedTalents.length > 0 && (
            <section>
              <h2 className="md:text-xl text-lg font-display font-bold mb-3 flex items-center gap-2">
                <Mic2 className="w-5 h-5 text-secondary" />
                Revealed talents
              </h2>
              <div className="flex flex-wrap gap-3">
                {revealedTalents.map((t) => (
                  <div
                    key={t.id}
                    className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-secondary/10 border border-secondary/20"
                  >
                    <Sparkles className="w-4 h-4 text-secondary" />
                    <span className="font-medium text-sm">{t.name}</span>
                  </div>
                ))}
              </div>
            </section>
          )}

          {/* Their Collection */}
          <section>
            <div className="mb-6">
              <h2 className="md:text-2xl text-xl font-display font-bold">Their collection</h2>
              <p className="text-muted-foreground text-sm">
                A peek into {profileUser.name}&apos;s taste universe — movies, songs, books, places.
              </p>
            </div>

            {userFavorites.length === 0 ? (
              <div className="elevated-card p-12 text-center text-muted-foreground">
                <Sparkles className="w-12 h-12 mx-auto mb-3 opacity-50" />
                <p>No favorites shared yet.</p>
              </div>
            ) : (
              <motion.div
                variants={containerVariants}
                initial="hidden"
                animate="visible"
                className="grid grid-cols-2 md:grid-cols-2 lg:grid-cols-3 gap-4"
              >
                {userFavorites.map((favorite) => (
                  <motion.div key={favorite.id} variants={itemVariants}>
                    <ProfilePostCard favorite={favorite} />
                  </motion.div>
                ))}
              </motion.div>
            )}
          </section>

          {/* Time capsules (if any) */}
          {userCapsules.length > 0 && (
            <section>
              <h2 className="md:text-xl text-lg font-display font-bold mb-3 flex items-center gap-2">
                <Rocket className="w-5 h-5 text-primary" />
                Time capsules
              </h2>
              <motion.div
                variants={containerVariants}
                initial="hidden"
                animate="visible"
                className="grid grid-cols-1 md:grid-cols-2 gap-4"
              >
                {userCapsules.map((capsule) => (
                  <motion.div key={capsule.id} variants={itemVariants}>
                    <div className="rounded-2xl overflow-hidden border border-white/10 bg-card/30 hover:border-primary/20 transition-all">
                      <div className="aspect-video relative overflow-hidden">
                        {capsule.image ? (
                          <img
                            src={capsule.image}
                            alt={capsule.title}
                            className="w-full h-full object-cover"
                          />
                        ) : (
                          <div className="w-full h-full bg-gradient-to-br from-primary/20 to-secondary/20 flex items-center justify-center">
                            <Rocket className="w-12 h-12 text-primary/50" />
                          </div>
                        )}
                        <div className="absolute inset-0 bg-gradient-to-t from-background/90 to-transparent" />
                        <div className="absolute bottom-0 left-0 right-0 p-4">
                          <h4 className="font-display font-semibold">{capsule.title}</h4>
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
                  </motion.div>
                ))}
              </motion.div>
            </section>
          )}
        </div>
      </div>
    </Layout>
  );
}
