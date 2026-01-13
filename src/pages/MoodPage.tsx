import { useState } from 'react';
import { motion } from 'framer-motion';
import { Layout } from '@/components/layout/Layout';
import { MoodSelector } from '@/components/mood/MoodSelector';
import { FavoriteCard } from '@/components/favorites/FavoriteCard';
import { Button } from '@/components/ui/button';
import { useWishbook } from '@/contexts/WishbookContext';
import { moodOptions } from '@/data/mockData';
import { Sparkles, RefreshCw, Shuffle } from 'lucide-react';
import { Mood } from '@/types/wishbook';

export default function MoodPage() {
  const { favorites, selectedMood, setSelectedMood } = useWishbook();
  const [showResults, setShowResults] = useState(false);

  const handleMoodSelect = (moodId: string) => {
    setSelectedMood(moodId as Mood);
    setShowResults(true);
  };

  const filteredFavorites = selectedMood 
    ? favorites.filter(f => f.mood.includes(selectedMood))
    : [];

  const handleReset = () => {
    setSelectedMood(null);
    setShowResults(false);
  };

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
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/10 text-primary mb-4">
              <Sparkles className="w-4 h-4" />
              <span className="text-sm font-medium">Mood-Based Discovery</span>
            </div>
            <h1 className="font-display text-4xl md:text-5xl font-bold mb-4">
              How are you feeling{' '}
              <span className="gradient-text">today?</span>
            </h1>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
              Select your current mood and we'll show you recommendations that match how you feel right now.
            </p>
          </motion.div>

          {/* Mood Selector */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="max-w-3xl mx-auto mb-12"
          >
            <MoodSelector
              moods={moodOptions}
              selectedMood={selectedMood}
              onSelect={handleMoodSelect}
            />
          </motion.div>

          {/* Results */}
          {showResults && selectedMood && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.3 }}
            >
              {/* Results Header */}
              <div className="flex flex-col sm:flex-row items-center justify-between gap-4 mb-8">
                <div className="flex items-center gap-3">
                  <span className="text-3xl">
                    {moodOptions.find(m => m.id === selectedMood)?.emoji}
                  </span>
                  <div>
                    <h2 className="font-display text-2xl font-semibold">
                      Feeling {moodOptions.find(m => m.id === selectedMood)?.name}
                    </h2>
                    <p className="text-sm text-muted-foreground">
                      {filteredFavorites.length} recommendations for you
                    </p>
                  </div>
                </div>
                
                <div className="flex gap-2">
                  <Button variant="outline" size="sm" onClick={handleReset}>
                    <RefreshCw className="w-4 h-4" />
                    Change Mood
                  </Button>
                  <Button variant="gradient" size="sm">
                    <Shuffle className="w-4 h-4" />
                    Surprise Me
                  </Button>
                </div>
              </div>

              {/* Results Grid */}
              {filteredFavorites.length > 0 ? (
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
              ) : (
                <motion.div
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  className="text-center py-16"
                >
                  <div className="w-20 h-20 mx-auto mb-4 rounded-full bg-muted flex items-center justify-center">
                    <span className="text-4xl">🔍</span>
                  </div>
                  <h3 className="font-display text-xl font-semibold mb-2">No matches yet</h3>
                  <p className="text-muted-foreground mb-4">
                    We don't have favorites tagged with this mood yet.
                  </p>
                  <Button variant="gradient">
                    Add Your First {moodOptions.find(m => m.id === selectedMood)?.name} Favorite
                  </Button>
                </motion.div>
              )}
            </motion.div>
          )}

          {/* Blind Recommendation Feature */}
          {!showResults && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.4 }}
              className="max-w-xl mx-auto mt-16"
            >
              <div className="elevated-card p-8 text-center">
                <div className="w-16 h-16 mx-auto mb-4 rounded-full flex items-center justify-center" style={{ background: 'var(--gradient-sunset)' }}>
                  <Shuffle className="w-8 h-8 text-primary-foreground" />
                </div>
                <h3 className="font-display text-xl font-semibold mb-2">
                  Blind Recommendation Roulette
                </h3>
                <p className="text-muted-foreground mb-6">
                  Feeling adventurous? Get a random recommendation without knowing what it is. 
                  Experience first, then judge!
                </p>
                <Button variant="glow" size="lg">
                  Spin the Wheel
                </Button>
              </div>
            </motion.div>
          )}
        </div>
      </div>
    </Layout>
  );
}
