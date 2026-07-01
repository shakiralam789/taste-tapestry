"use client";
import { useState } from 'react';
import { motion } from 'framer-motion';
import { Layout } from '@/components/layout/Layout';
import { TasteMatchCard } from '@/components/matching/TasteMatchCard';
import { Button } from '@/components/ui/button';
import { Heart, RefreshCw } from 'lucide-react';
import { MultiCountrySelect } from '@/components/ui/multi-country-select';

import { useInfiniteQuery, useQueryClient } from '@tanstack/react-query';
import { getTopMatches } from '@/features/users/api';
import { useAuth } from '@/features/auth/AuthContext';
import { Loader2 } from 'lucide-react';

export default function MatchesPage() {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  const [selectedCountries, setSelectedCountries] = useState<string[]>([]);

  const {
    data,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
    status,
  } = useInfiniteQuery({
    queryKey: ['topMatches', user?.id, selectedCountries.join(',')],
    queryFn: async ({ pageParam = 0 }) => {
      if (!user?.id) throw new Error('Not authenticated');
      return getTopMatches(user.id, 20, pageParam, false, selectedCountries.length > 0 ? selectedCountries.join(',') : undefined);
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
      const freshData = await getTopMatches(user.id, 20, 0, true, selectedCountries.length > 0 ? selectedCountries.join(',') : undefined);
      queryClient.setQueryData(['topMatches', user.id, selectedCountries.join(',')], {
        pages: [freshData],
        pageParams: [0],
      });
    } catch (e) {
      console.error(e);
    } finally {
      setIsForceRefreshing(false);
    }
  };

  const matches = (data?.pages.flatMap(page => page.items) ?? []).filter(
    (m) => m.user,
  );

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

          {/* Controls */}
          <div className="flex flex-col sm:flex-row justify-end items-center gap-4 mb-8">
            <div className="w-full sm:w-96">
              <MultiCountrySelect 
                values={selectedCountries} 
                onChange={setSelectedCountries}
                placeholder="Filter by Country..."
              />
            </div>
            <Button 
              variant="outline" 
              className="w-full sm:w-auto"
              onClick={handleRefresh} 
              disabled={status === 'pending' || isForceRefreshing}
            >
              <RefreshCw className={`w-4 h-4 mr-2 ${(status === 'pending' || isForceRefreshing) ? 'animate-spin' : ''}`} />
              Refresh Matches
            </Button>
          </div>

          {/* Top Matches Content */}
          <div className="space-y-8">
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
            </div>
        </div>
      </div>
    </Layout>
  );
}
