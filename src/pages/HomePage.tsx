import { useState } from 'react';
import { motion } from 'framer-motion';
import { Layout } from '@/components/layout/Layout';
import { FavoriteCard } from '@/components/favorites/FavoriteCard';
import { CategoryChip } from '@/components/categories/CategoryChip';
import { TimeCapsuleCard } from '@/components/capsules/TimeCapsuleCard';
import { UserCard } from '@/components/users/UserCard';
import { Button } from '@/components/ui/button';
import { useWishbook } from '@/contexts/WishbookContext';
import { Plus, Sparkles, TrendingUp, Heart, Clock } from 'lucide-react';
import { Link } from 'react-router-dom';

export default function HomePage() {
  const { user, categories, favorites, timeCapsules, allUsers } = useWishbook();
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);

  const filteredFavorites = selectedCategory 
    ? favorites.filter(f => f.categoryId === selectedCategory)
    : favorites;

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
      <div className="min-h-screen">
        {/* Hero Section */}
        <section className="relative overflow-hidden py-16 md:py-24">
          <div className="absolute inset-0" style={{ background: 'var(--gradient-sunset)', opacity: 0.08 }} />
          <div className="absolute top-10 right-10 w-96 h-96 rounded-full blur-3xl opacity-20" style={{ background: 'var(--gradient-sunset)' }} />
          
          <div className="container mx-auto px-4 relative">
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6 }}
              className="max-w-3xl"
            >
              <h1 className="font-display text-4xl md:text-6xl font-bold mb-4">
                Welcome back,{' '}
                <span className="gradient-text">{user.name.split(' ')[0]}</span>
              </h1>
              <p className="text-lg md:text-xl text-muted-foreground mb-8">
                Curate your world. Share your story. Discover kindred spirits.
              </p>
              
              <div className="flex flex-wrap gap-3">
                <Link to="/add-favorite">
                  <Button variant="gradient" size="lg">
                    <Plus className="w-5 h-5" />
                    Add Favorite
                  </Button>
                </Link>
                <Link to="/mood">
                  <Button variant="outline" size="lg">
                    <Sparkles className="w-5 h-5" />
                    Discover by Mood
                  </Button>
                </Link>
              </div>
            </motion.div>
          </div>
        </section>

        {/* Categories */}
        <section className="py-8 border-b border-border">
          <div className="container mx-auto px-4">
            <div className="flex items-center gap-3 overflow-x-auto pb-2 scrollbar-hide">
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
                  count={favorites.filter(f => f.categoryId === category.id).length}
                />
              ))}
            </div>
          </div>
        </section>

        {/* Main Content Grid */}
        <section className="py-12">
          <div className="container mx-auto px-4">
            <div className="flex items-center justify-between mb-8">
              <div className="flex items-center gap-3">
                <Heart className="w-6 h-6 text-primary" />
                <h2 className="font-display text-2xl font-semibold">Your Favorites</h2>
              </div>
              <Link to="/favorites">
                <Button variant="ghost" size="sm">View All →</Button>
              </Link>
            </div>

            <motion.div
              variants={containerVariants}
              initial="hidden"
              animate="visible"
              className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6"
            >
              {filteredFavorites.slice(0, 4).map((favorite) => (
                <motion.div key={favorite.id} variants={itemVariants}>
                  <FavoriteCard favorite={favorite} />
                </motion.div>
              ))}
            </motion.div>
          </div>
        </section>

        {/* Time Capsules */}
        <section className="py-12 bg-muted/30">
          <div className="container mx-auto px-4">
            <div className="flex items-center justify-between mb-8">
              <div className="flex items-center gap-3">
                <Clock className="w-6 h-6 text-primary" />
                <h2 className="font-display text-2xl font-semibold">Time Capsules</h2>
              </div>
              <Link to="/capsules">
                <Button variant="ghost" size="sm">View All →</Button>
              </Link>
            </div>

            <motion.div
              variants={containerVariants}
              initial="hidden"
              animate="visible"
              className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6"
            >
              {timeCapsules.map((capsule) => (
                <motion.div key={capsule.id} variants={itemVariants}>
                  <TimeCapsuleCard capsule={capsule} />
                </motion.div>
              ))}
              
              {/* Add New Capsule Card */}
              <motion.div variants={itemVariants}>
                <Link to="/create-capsule">
                  <div className="elevated-card p-8 h-full min-h-[280px] flex flex-col items-center justify-center text-center border-2 border-dashed border-border hover:border-primary/50 transition-colors cursor-pointer group">
                    <div className="w-16 h-16 rounded-full bg-muted flex items-center justify-center mb-4 group-hover:bg-primary/10 transition-colors">
                      <Plus className="w-8 h-8 text-muted-foreground group-hover:text-primary transition-colors" />
                    </div>
                    <h3 className="font-semibold text-foreground mb-2">Create Time Capsule</h3>
                    <p className="text-sm text-muted-foreground">
                      Capture a moment in time with your favorites
                    </p>
                  </div>
                </Link>
              </motion.div>
            </motion.div>
          </div>
        </section>

        {/* Discover People */}
        <section className="py-12">
          <div className="container mx-auto px-4">
            <div className="flex items-center justify-between mb-8">
              <div className="flex items-center gap-3">
                <TrendingUp className="w-6 h-6 text-primary" />
                <h2 className="font-display text-2xl font-semibold">People You May Like</h2>
              </div>
              <Link to="/discover">
                <Button variant="ghost" size="sm">Discover More →</Button>
              </Link>
            </div>

            <motion.div
              variants={containerVariants}
              initial="hidden"
              animate="visible"
              className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6"
            >
              {allUsers.filter(u => u.id !== user.id).slice(0, 4).map((u) => (
                <motion.div key={u.id} variants={itemVariants}>
                  <UserCard user={u} />
                </motion.div>
              ))}
            </motion.div>
          </div>
        </section>
      </div>
    </Layout>
  );
}
