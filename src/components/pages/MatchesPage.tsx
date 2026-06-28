"use client";
import { useState } from 'react';
import { motion } from 'framer-motion';
import { Layout } from '@/components/layout/Layout';
import { TasteMatchCard } from '@/components/matching/TasteMatchCard';
import { UserCard } from '@/components/users/UserCard';
import { Button } from '@/components/ui/button';
import { useWishbook } from '@/contexts/WishbookContext';
import { Heart, Globe, Sparkles, RefreshCw } from 'lucide-react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

import { useInfiniteQuery, useQueryClient } from '@tanstack/react-query';
import { getTopMatches } from '@/features/users/api';
import { useAuth } from '@/features/auth/AuthContext';
import { Loader2 } from 'lucide-react';

export default function MatchesPage() {
  const { allUsers } = useWishbook();
  const { user } = useAuth();
  const queryClient = useQueryClient();

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

  const {
    data,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
    status,
    refetch,
    isRefetching
  } = useInfiniteQuery({
    queryKey: ['topMatches', user?.id],
    queryFn: async ({ pageParam = 0 }) => {
      if (!user?.id) throw new Error('Not authenticated');
      return getTopMatches(user.id, 20, pageParam, false);
    },
    initialPageParam: 0,
    getNextPageParam: (lastPage) => lastPage.hasMore ? lastPage.nextOffset : undefined,
    enabled: !!user?.id,
  });

  const [isForceRefreshing, setIsForceRefreshing] = useState(false);

  const handleRefresh = async () => {
    if (!user?.id) return;
    setIsForceRefreshing(true);
    try {
      const freshData = await getTopMatches(user.id, 20, 0, true);
      queryClient.setQueryData(['topMatches', user.id], {
        pages: [freshData],
        pageParams: [0],
      });
    } catch (e) {
      console.error(e);
    } finally {
      setIsForceRefreshing(false);
    }
  };

  const matches = data?.pages.flatMap(page => page.items) ?? [];

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
              <Heart className="w-4 h-4" />
              <span className="text-sm font-medium">Taste Matching</span>
            </div>
            <h1 className="font-display text-4xl md:text-5xl font-bold mb-4">
              Find Your{' '}
              <span className="gradient-text">Taste Twins</span>
            </h1>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
              Discover people who share your passions and might recommend something you'll love.
            </p>
          </motion.div>

          {/* Tabs */}
          <Tabs defaultValue="matches" className="space-y-8">
            <TabsList className="mx-auto grid w-full max-w-md grid-cols-2">
              <TabsTrigger value="matches" className="gap-2">
                <Sparkles className="w-4 h-4" />
                Top Matches
              </TabsTrigger>
              <TabsTrigger value="cultural" className="gap-2">
                <Globe className="w-4 h-4" />
                Cultural Exchange
              </TabsTrigger>
            </TabsList>

            {/* Top Matches Tab */}
            <TabsContent value="matches">
              <div className="flex justify-end mb-6">
                <Button variant="outline" size="sm" onClick={handleRefresh} disabled={status === 'pending' || isForceRefreshing}>
                  <RefreshCw className={`w-4 h-4 ${(status === 'pending' || isForceRefreshing) ? 'animate-spin' : ''}`} />
                  Refresh Matches
                </Button>
              </div>

              {status === 'pending' ? (
                <div className="py-20 text-center">
                  <Loader2 className="w-8 h-8 animate-spin mx-auto text-primary" />
                  <p className="mt-4 text-muted-foreground">Finding your taste twins...</p>
                </div>
              ) : matches.length === 0 ? (
                <div className="text-center py-16">
                  <div className="w-20 h-20 mx-auto mb-4 rounded-full bg-muted flex items-center justify-center">
                    <Heart className="w-10 h-10 text-muted-foreground" />
                  </div>
                  <h3 className="font-display text-xl font-semibold mb-2">No matches yet</h3>
                  <p className="text-muted-foreground mb-4">
                    Add more favorites to find your taste twins!
                  </p>
                  <Button variant="gradient">Add Favorites</Button>
                </div>
              ) : (
                <>
                  <div
                    className="grid grid-cols-1 lg:grid-cols-2 gap-6"
                  >
                    {matches.map((match, i) => (
                      <motion.div 
                        key={match.matchedUserId} 
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: i * 0.1 }}
                      >
                        <TasteMatchCard match={match} />
                      </motion.div>
                    ))}
                  </div>

                  {hasNextPage && (
                    <div className="mt-8 text-center">
                      <Button
                        variant="outline"
                        onClick={() => fetchNextPage()}
                        disabled={isFetchingNextPage}
                      >
                        {isFetchingNextPage ? (
                          <>
                            <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                            Loading...
                          </>
                        ) : (
                          'Load More Matches'
                        )}
                      </Button>
                    </div>
                  )}
                </>
              )}
            </TabsContent>

            {/* Cultural Exchange Tab */}
            <TabsContent value="cultural">
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="space-y-8"
              >
                {/* Cultural Exchange Info */}
                <div className="elevated-card p-6 text-center">
                  <Globe className="w-12 h-12 mx-auto mb-4 text-primary" />
                  <h3 className="font-display text-xl font-semibold mb-2">
                    Cultural Exchange Matching
                  </h3>
                  <p className="text-muted-foreground max-w-xl mx-auto mb-4">
                    Connect with users from different countries and discover their favorite
                    movies, music, and books. Expand your horizons through shared taste!
                  </p>
                  <div className="flex flex-wrap justify-center gap-2">
                    {['🇯🇵 Japan', '🇫🇷 France', '🇧🇷 Brazil', '🇰🇷 Korea', '🇮🇳 India'].map((country) => (
                      <span
                        key={country}
                        className="px-3 py-1.5 rounded-full bg-accent text-sm"
                      >
                        {country}
                      </span>
                    ))}
                  </div>
                </div>

                {/* Users from Different Countries */}
                <motion.div
                  variants={containerVariants}
                  initial="hidden"
                  animate="visible"
                  className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6"
                >
                  {allUsers.filter(u => u.id !== user?.id).map((u) => (
                    <motion.div key={u.id} variants={itemVariants}>
                      <UserCard user={u} />
                    </motion.div>
                  ))}
                </motion.div>
              </motion.div>
            </TabsContent>
          </Tabs>
        </div>
      </div>
    </Layout>
  );
}
