import { motion } from 'framer-motion';
import { Layout } from '@/components/layout/Layout';
import { TasteMatchCard } from '@/components/matching/TasteMatchCard';
import { UserCard } from '@/components/users/UserCard';
import { Button } from '@/components/ui/button';
import { useWishbook } from '@/contexts/WishbookContext';
import { Heart, Globe, Sparkles, RefreshCw } from 'lucide-react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

export default function MatchesPage() {
  const { tasteMatches, allUsers, user } = useWishbook();

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
                <Button variant="outline" size="sm">
                  <RefreshCw className="w-4 h-4" />
                  Refresh Matches
                </Button>
              </div>

              <motion.div
                variants={containerVariants}
                initial="hidden"
                animate="visible"
                className="grid grid-cols-1 lg:grid-cols-2 gap-6"
              >
                {tasteMatches.map((match) => (
                  <motion.div key={match.userId} variants={itemVariants}>
                    <TasteMatchCard match={match} />
                  </motion.div>
                ))}
              </motion.div>

              {tasteMatches.length === 0 && (
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
                  {allUsers.filter(u => u.id !== user.id).map((u) => (
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
