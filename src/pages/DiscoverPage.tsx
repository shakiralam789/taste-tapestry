import { useState } from 'react';
import { motion } from 'framer-motion';
import { Layout } from '@/components/layout/Layout';
import { FavoriteCard } from '@/components/favorites/FavoriteCard';
import { CategoryChip } from '@/components/categories/CategoryChip';
import { UserCard } from '@/components/users/UserCard';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { useWishbook } from '@/contexts/WishbookContext';
import { Search, Filter, TrendingUp, Users, Bookmark } from 'lucide-react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

export default function DiscoverPage() {
  const { categories, favorites, allUsers, user } = useWishbook();
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);

  const filteredFavorites = favorites.filter(f => {
    const matchesSearch = f.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      f.whyILike.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCategory = !selectedCategory || f.categoryId === selectedCategory;
    return matchesSearch && matchesCategory;
  });

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: { staggerChildren: 0.08 }
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
            <h1 className="font-display text-4xl md:text-5xl font-bold mb-4">
              Discover{' '}
              <span className="gradient-text">New Favorites</span>
            </h1>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
              Explore recommendations from people with similar taste and find your next obsession.
            </p>
          </motion.div>

          {/* Search Bar */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="max-w-2xl mx-auto mb-8"
          >
            <div className="relative">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
              <Input
                placeholder="Search movies, songs, books, places..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-12 pr-12 h-14 text-lg rounded-2xl border-2 focus:border-primary"
              />
              <Button variant="ghost" size="icon" className="absolute right-2 top-1/2 -translate-y-1/2">
                <Filter className="w-5 h-5" />
              </Button>
            </div>
          </motion.div>

          {/* Categories */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.2 }}
            className="flex items-center gap-3 overflow-x-auto pb-4 mb-8 scrollbar-hide"
          >
            <CategoryChip
              category={{ id: 'all', name: 'All', icon: '✨', color: 'primary', isDefault: true }}
              isSelected={selectedCategory === null}
              onClick={() => setSelectedCategory(null)}
            />
            {categories.map((category) => (
              <CategoryChip
                key={category.id}
                category={category}
                isSelected={selectedCategory === category.id}
                onClick={() => setSelectedCategory(category.id)}
              />
            ))}
          </motion.div>

          {/* Tabs */}
          <Tabs defaultValue="trending" className="space-y-8">
            <TabsList className="mx-auto grid w-full max-w-lg grid-cols-3">
              <TabsTrigger value="trending" className="gap-2">
                <TrendingUp className="w-4 h-4" />
                Trending
              </TabsTrigger>
              <TabsTrigger value="people" className="gap-2">
                <Users className="w-4 h-4" />
                People
              </TabsTrigger>
              <TabsTrigger value="collections" className="gap-2">
                <Bookmark className="w-4 h-4" />
                Collections
              </TabsTrigger>
            </TabsList>

            {/* Trending Tab */}
            <TabsContent value="trending">
              <motion.div
                variants={containerVariants}
                initial="hidden"
                animate="visible"
                className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6"
              >
                {filteredFavorites.map((favorite) => (
                  <motion.div key={favorite.id} variants={itemVariants}>
                    <FavoriteCard favorite={favorite} />
                  </motion.div>
                ))}
              </motion.div>

              {filteredFavorites.length === 0 && (
                <div className="text-center py-16">
                  <div className="w-20 h-20 mx-auto mb-4 rounded-full bg-muted flex items-center justify-center">
                    <Search className="w-10 h-10 text-muted-foreground" />
                  </div>
                  <h3 className="font-display text-xl font-semibold mb-2">No results found</h3>
                  <p className="text-muted-foreground">
                    Try adjusting your search or filters
                  </p>
                </div>
              )}
            </TabsContent>

            {/* People Tab */}
            <TabsContent value="people">
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
            </TabsContent>

            {/* Collections Tab */}
            <TabsContent value="collections">
              <div className="text-center py-16">
                <div className="w-20 h-20 mx-auto mb-4 rounded-full bg-muted flex items-center justify-center">
                  <Bookmark className="w-10 h-10 text-muted-foreground" />
                </div>
                <h3 className="font-display text-xl font-semibold mb-2">Community Collections</h3>
                <p className="text-muted-foreground mb-4">
                  Curated collections from the community coming soon!
                </p>
              </div>
            </TabsContent>
          </Tabs>
        </div>
      </div>
    </Layout>
  );
}
