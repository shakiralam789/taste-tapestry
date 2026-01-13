import { motion } from 'framer-motion';
import { Layout } from '@/components/layout/Layout';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { FavoriteCard } from '@/components/favorites/FavoriteCard';
import { useWishbook } from '@/contexts/WishbookContext';
import { interestCategories } from '@/data/mockData';
import { 
  MapPin, 
  Calendar, 
  Settings, 
  Edit3, 
  Users, 
  Eye, 
  EyeOff,
  Sparkles,
  Plus
} from 'lucide-react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Link } from 'react-router-dom';

export default function ProfilePage() {
  const { user, favorites, timeCapsules } = useWishbook();

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

  const getCategoryLabel = (category: string) => {
    const labels: Record<string, string> = {
      creative: '🎨 Creative',
      performance: '🎭 Performance',
      skill: '🛠️ Skill-Based',
      intellectual: '🧠 Intellectual',
      unique: '✨ Unique',
      collaborative: '🤝 Collaborative',
    };
    return labels[category] || category;
  };

  return (
    <Layout>
      <div className="min-h-screen">
        {/* Cover/Header */}
        <div 
          className="relative h-48 md:h-64"
          style={{ background: 'var(--gradient-sunset)' }}
        >
          <div className="absolute inset-0 bg-gradient-to-t from-background/80 to-transparent" />
        </div>

        {/* Profile Info */}
        <div className="container mx-auto px-4">
          <div className="relative -mt-20 mb-8">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="flex flex-col md:flex-row gap-6 items-start md:items-end"
            >
              {/* Avatar */}
              <Avatar className="w-32 h-32 ring-4 ring-background shadow-elevated">
                <AvatarImage src={user.avatar} alt={user.name} />
                <AvatarFallback className="text-3xl">{user.name[0]}</AvatarFallback>
              </Avatar>

              {/* Info */}
              <div className="flex-1">
                <div className="flex flex-col sm:flex-row sm:items-center gap-3 mb-2">
                  <h1 className="font-display text-3xl font-bold">{user.name}</h1>
                  <Badge variant="secondary" className="w-fit">
                    <Sparkles className="w-3 h-3 mr-1" />
                    Curator
                  </Badge>
                </div>
                <p className="text-muted-foreground mb-2">@{user.username}</p>
                <p className="text-foreground mb-3">{user.bio}</p>
                
                <div className="flex flex-wrap items-center gap-4 text-sm text-muted-foreground">
                  {user.location && (
                    <span className="flex items-center gap-1">
                      <MapPin className="w-4 h-4" />
                      {user.location}
                    </span>
                  )}
                  <span className="flex items-center gap-1">
                    <Calendar className="w-4 h-4" />
                    Joined {user.createdAt.toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}
                  </span>
                </div>
              </div>

              {/* Actions */}
              <div className="flex gap-2">
                <Button variant="outline" size="sm">
                  <Edit3 className="w-4 h-4" />
                  Edit Profile
                </Button>
                <Button variant="ghost" size="icon">
                  <Settings className="w-5 h-5" />
                </Button>
              </div>
            </motion.div>

            {/* Stats */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.2 }}
              className="flex gap-8 mt-6 pt-6 border-t border-border"
            >
              <div className="text-center">
                <p className="font-display text-2xl font-bold">{user.followers.toLocaleString()}</p>
                <p className="text-sm text-muted-foreground">Followers</p>
              </div>
              <div className="text-center">
                <p className="font-display text-2xl font-bold">{user.following.toLocaleString()}</p>
                <p className="text-sm text-muted-foreground">Following</p>
              </div>
              <div className="text-center">
                <p className="font-display text-2xl font-bold">{favorites.length}</p>
                <p className="text-sm text-muted-foreground">Favorites</p>
              </div>
              <div className="text-center">
                <p className="font-display text-2xl font-bold">{timeCapsules.length}</p>
                <p className="text-sm text-muted-foreground">Capsules</p>
              </div>
            </motion.div>
          </div>

          {/* Tabs */}
          <Tabs defaultValue="favorites" className="space-y-8 pb-16">
            <TabsList className="grid w-full max-w-lg grid-cols-3">
              <TabsTrigger value="favorites">Favorites</TabsTrigger>
              <TabsTrigger value="interests">Interests</TabsTrigger>
              <TabsTrigger value="talents">Talents</TabsTrigger>
            </TabsList>

            {/* Favorites Tab */}
            <TabsContent value="favorites">
              <div className="flex items-center justify-between mb-6">
                <h2 className="font-display text-xl font-semibold">My Favorites</h2>
                <Link to="/add-favorite">
                  <Button variant="gradient" size="sm">
                    <Plus className="w-4 h-4" />
                    Add New
                  </Button>
                </Link>
              </div>

              <motion.div
                variants={containerVariants}
                initial="hidden"
                animate="visible"
                className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6"
              >
                {favorites.map((favorite) => (
                  <motion.div key={favorite.id} variants={itemVariants}>
                    <FavoriteCard favorite={favorite} />
                  </motion.div>
                ))}
              </motion.div>
            </TabsContent>

            {/* Interests Tab */}
            <TabsContent value="interests">
              <div className="space-y-8">
                {user.interests.length > 0 ? (
                  <div>
                    <h3 className="font-semibold mb-4">Current Interests</h3>
                    <div className="flex flex-wrap gap-2">
                      {user.interests.map((interest) => (
                        <Badge key={interest.id} variant="secondary" className="px-4 py-2">
                          {interest.name}
                        </Badge>
                      ))}
                    </div>
                  </div>
                ) : null}

                <div>
                  <h3 className="font-semibold mb-4">Explore Interests</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {Object.entries(interestCategories).map(([category, interests]) => (
                      <div key={category} className="elevated-card p-5">
                        <h4 className="font-medium mb-3">{getCategoryLabel(category)}</h4>
                        <div className="flex flex-wrap gap-2">
                          {interests.slice(0, 5).map((interest) => (
                            <Badge 
                              key={interest.id} 
                              variant="outline" 
                              className="cursor-pointer hover:bg-primary hover:text-primary-foreground transition-colors"
                            >
                              {interest.name}
                            </Badge>
                          ))}
                          {interests.length > 5 && (
                            <Badge variant="outline">+{interests.length - 5} more</Badge>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </TabsContent>

            {/* Talents Tab */}
            <TabsContent value="talents">
              <div className="max-w-2xl">
                <div className="elevated-card p-6 mb-6">
                  <div className="flex items-center gap-3 mb-4">
                    <Sparkles className="w-5 h-5 text-primary" />
                    <h3 className="font-semibold">Hidden Talents</h3>
                  </div>
                  <p className="text-sm text-muted-foreground mb-4">
                    Share your secret talents with the world—or keep them hidden. 
                    It's up to you to reveal!
                  </p>

                  {user.talents.length > 0 ? (
                    <div className="space-y-3">
                      {user.talents.map((talent) => (
                        <div 
                          key={talent.id}
                          className="flex items-center justify-between p-4 rounded-xl bg-muted/50"
                        >
                          <span className="font-medium">{talent.name}</span>
                          <div className="flex items-center gap-2">
                            <Badge variant={talent.isPublic ? 'default' : 'secondary'}>
                              {talent.isPublic ? (
                                <>
                                  <Eye className="w-3 h-3 mr-1" />
                                  Public
                                </>
                              ) : (
                                <>
                                  <EyeOff className="w-3 h-3 mr-1" />
                                  Hidden
                                </>
                              )}
                            </Badge>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-muted-foreground text-center py-8">
                      No talents added yet. Click below to reveal your hidden abilities!
                    </p>
                  )}

                  <Button variant="outline" className="w-full mt-4">
                    <Plus className="w-4 h-4" />
                    Add Talent
                  </Button>
                </div>
              </div>
            </TabsContent>
          </Tabs>
        </div>
      </div>
    </Layout>
  );
}
