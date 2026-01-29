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
      <div className="min-h-screen py-8 md:py-12 max-w-7xl mx-auto">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center mb-12"
        >
          <h1 className="font-display text-4xl md:text-6xl font-bold mb-4 tracking-tight">
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
          className="max-w-2xl mx-auto mb-10"
        >
          <div className="relative group">
            <div className="absolute inset-0 bg-primary/20 blur-xl rounded-full opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
            <Search className="absolute left-5 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground group-focus-within:text-primary transition-colors" />
            <Input
              placeholder="Search movies, songs, books, places..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-14 pr-14 h-16 text-lg rounded-full border-2 bg-card/50 backdrop-blur-xl focus:border-primary/50 focus:ring-4 focus:ring-primary/10 transition-all shadow-lg"
            />
            <Button variant="ghost" size="icon" className="absolute right-3 top-1/2 -translate-y-1/2 hover:bg-primary/10 hover:text-primary rounded-full w-10 h-10">
              <Filter className="w-5 h-5" />
            </Button>
          </div>
        </motion.div>

        {/* Categories */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.2 }}
          className="flex items-center justify-center gap-3 overflow-x-auto pb-4 mb-10 scrollbar-hide px-4"
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
          <TabsList className="mx-auto grid w-full max-w-md grid-cols-3 bg-secondary/10 p-1 rounded-full border border-white/5">
            <TabsTrigger value="trending" className="rounded-full data-[state=active]:bg-primary data-[state=active]:text-primary-foreground">
              Trending
            </TabsTrigger>
            <TabsTrigger value="people" className="rounded-full data-[state=active]:bg-primary data-[state=active]:text-primary-foreground">
              People
            </TabsTrigger>
            <TabsTrigger value="collections" className="rounded-full data-[state=active]:bg-primary data-[state=active]:text-primary-foreground">
              Collections
            </TabsTrigger>
          </TabsList>

          {/* Trending Tab - WIDER GRID */}
          <TabsContent value="trending">
            <motion.div
              variants={containerVariants}
              initial="hidden"
              animate="visible"
              className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6"
            >
              {filteredFavorites.map((favorite) => (
                <motion.div key={favorite.id} variants={itemVariants}>
                  <FavoriteCard favorite={favorite} />
                </motion.div>
              ))}
            </motion.div>

            {filteredFavorites.length === 0 && (
              <div className="text-center py-20">
                <div className="w-24 h-24 mx-auto mb-6 rounded-full bg-card flex items-center justify-center border border-white/5 animate-pulse">
                  <Search className="w-10 h-10 text-muted-foreground" />
                </div>
                <h3 className="font-display text-2xl font-bold mb-2">No results found</h3>
                <p className="text-muted-foreground">
                  Try adjusting your search or filters to explore the cosmos.
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
              className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6"
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
            <div className="text-center py-20 bg-card/30 rounded-3xl border border-white/5 border-dashed">
              <div className="w-20 h-20 mx-auto mb-4 rounded-full bg-primary/10 flex items-center justify-center">
                <Bookmark className="w-8 h-8 text-primary" />
              </div>
              <h3 className="font-display text-xl font-semibold mb-2">Curated Collections</h3>
              <p className="text-muted-foreground mb-6 max-w-sm mx-auto">
                Explore hand-picked collections from our top tastemakers. Coming soon to a galaxy near you.
              </p>
              <Button variant="outline">Notify Me</Button>
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </Layout>
  );
}
