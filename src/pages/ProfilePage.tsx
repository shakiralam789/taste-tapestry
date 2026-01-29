import { motion } from 'framer-motion';
import { Layout } from '@/components/layout/Layout';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { FavoriteCard } from '@/components/favorites/FavoriteCard';
import { ProfilePostCard } from '@/components/profile/ProfilePostCard';
import { useWishbook } from '@/contexts/WishbookContext';
import { interestCategories } from '@/data/mockData';
import { 
  MapPin, 
  Calendar, 
  Settings, 
  Edit3, 
  Share2,
  Sparkles,
  Plus,
  Rocket
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

  return (
    <Layout>
      <div className="min-h-screen pb-12">
        {/* Immersive Cyber Banner */}
        <div className="relative h-64 md:h-80 w-full overflow-hidden rounded-b-[3rem] shadow-neon">
          <div className="absolute inset-0 bg-[url('https://images.unsplash.com/photo-1535868463750-c78d9543614f?q=80&w=2676&auto=format&fit=crop')] bg-cover bg-center opacity-60" />
          <div className="absolute inset-0 bg-gradient-to-t from-background via-background/20 to-transparent" />
          <div className="absolute inset-0 bg-gradient-to-r from-primary/20 to-secondary/20 mix-blend-overlay" />
        </div>

        {/* Profile Card & Stats - Floating Shift */}
        <div className="container mx-auto px-4 -mt-32 relative z-10">
          <div className="flex flex-col lg:flex-row gap-8 items-start">
            
            {/* Left: Profile Identity Card */}
            <motion.div 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="w-full lg:w-1/3 flex flex-col items-center text-center p-8 rounded-3xl bg-card/40 backdrop-blur-xl border border-white/10 shadow-xl"
            >
              <div className="relative mb-6 group">
                <div className="absolute -inset-1 bg-gradient-to-br from-primary to-secondary rounded-full opacity-75 blur transition duration-500 group-hover:opacity-100" />
                <Avatar className="w-40 h-40 ring-4 ring-background relative">
                  <AvatarImage src={user.avatar} alt={user.name} className="object-cover" />
                  <AvatarFallback className="text-4xl bg-background text-foreground">{user.name[0]}</AvatarFallback>
                </Avatar>
                <div className="absolute bottom-2 right-2 flex gap-2">
                   <Button size="icon" variant="secondary" className="rounded-full shadow-lg h-10 w-10">
                    <Edit3 className="w-4 h-4" />
                   </Button>
                </div>
              </div>

              <h1 className="font-display text-4xl font-bold mb-2 flex items-center gap-2">
                {user.name}
                <Sparkles className="w-6 h-6 text-yellow-400 fill-yellow-400 animate-pulse" />
              </h1>
              <p className="text-primary font-medium mb-4 text-lg">@{user.username}</p>
              
              <p className="text-muted-foreground mb-6 leading-relaxed max-w-xs">
                {user.bio || "Digital explorer navigating the neon tides. Curator of moments and memories."}
              </p>

              <div className="flex items-center justify-center gap-4 text-sm text-gray-400 mb-8 w-full">
                <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-white/5 border border-white/5">
                  <MapPin className="w-3.5 h-3.5" />
                  {user.location || "Neo Tokyo"}
                </div>
                <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-white/5 border border-white/5">
                  <Calendar className="w-3.5 h-3.5" />
                  Since {user.createdAt.getFullYear()}
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3 w-full">
                <Button className="w-full rounded-xl" variant="default">
                  Follow
                </Button>
                <Button className="w-full rounded-xl" variant="outline">
                  <Share2 className="w-4 h-4 mr-2" /> Share
                </Button>
              </div>
            </motion.div>

            {/* Right: Content & Stats */}
            <div className="flex-1 w-full space-y-8 pt-8 lg:pt-0">
              {/* Futuristic Stats Bar */}
              <motion.div 
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.1 }}
                className="grid grid-cols-2 sm:grid-cols-4 gap-4"
              >
                {[
                  { label: "Followers", value: user.followers.toLocaleString(), icon: Users },
                  { label: "Following", value: user.following.toLocaleString(), icon: Users },
                  { label: "Stars", value: favorites.length, icon: Sparkles },
                  { label: "Capsules", value: timeCapsules.length, icon: Rocket },
                ].map((stat, i) => (
                   <div key={i} className="p-4 rounded-2xl bg-card/30 border border-white/5 backdrop-blur-sm hover:bg-white/5 transition-colors group cursor-default">
                      <div className="flex items-center gap-2 mb-2 text-muted-foreground">
                        <stat.icon className="w-4 h-4 group-hover:text-primary transition-colors" />
                        <span className="text-xs font-semibold uppercase tracking-wider">{stat.label}</span>
                      </div>
                      <p className="font-display text-3xl font-bold text-foreground group-hover:text-primary transition-colors">{stat.value}</p>
                   </div>
                ))}
              </motion.div>

              {/* Tabs Section */}
              <Tabs defaultValue="favorites" className="w-full">
                <TabsList className="w-full justify-start bg-transparent border-b border-white/10 p-0 h-auto rounded-none mb-8 gap-8">
                  {['favorites', 'interests', 'talents'].map((tab) => (
                    <TabsTrigger 
                      key={tab} 
                      value={tab}
                      className="rounded-none border-b-2 border-transparent px-0 py-4 data-[state=active]:bg-transparent data-[state=active]:border-primary data-[state=active]:text-primary data-[state=active]:shadow-none hover:text-primary transition-colors text-lg"
                    >
                      {tab.charAt(0).toUpperCase() + tab.slice(1)}
                    </TabsTrigger>
                  ))}
                </TabsList>

                <TabsContent value="favorites" className="mt-0">
                  <div className="flex items-center justify-between mb-6">
                    <div>
                      <h3 className="text-2xl font-display font-bold">My Collection</h3>
                      <p className="text-muted-foreground text-sm">Curated moments and obsessions.</p>
                    </div>
                    <Link to="/add-favorite">
                      <Button variant="outline" size="sm" className="rounded-full border-dashed group hover:border-primary hover:text-primary">
                        <Plus className="w-4 h-4 mr-1 group-hover:rotate-90 transition-transform" /> Add New
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
                    
                    {/* Add New Placeholder Card */}
                    <motion.div 
                      variants={itemVariants}
                      className="aspect-[4/5] rounded-2xl border-2 border-dashed border-white/10 flex flex-col items-center justify-center gap-4 text-muted-foreground hover:text-primary hover:border-primary/50 hover:bg-primary/5 transition-all cursor-pointer group"
                    >
                      <div className="w-12 h-12 rounded-full bg-white/5 flex items-center justify-center group-hover:scale-110 transition-transform">
                        <Plus className="w-6 h-6" />
                      </div>
                      <span className="font-medium text-sm">Add to Collection</span>
                    </motion.div>
                  </motion.div>
                </TabsContent>

                <TabsContent value="interests" className="mt-0">
                  {/* Reuse existing logic or redesign simple typography */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {Object.entries(interestCategories).map(([category, interests]) => (
                      <div key={category} className="p-6 rounded-2xl bg-card/20 border border-white/5 hover:border-primary/20 transition-all">
                        <h4 className="text-lg font-semibold mb-3 capitalize text-primary">{category}</h4>
                        <div className="flex flex-wrap gap-2">
                           {interests.slice(0, 8).map(i => (
                             <Badge key={i.id} variant="outline" className="bg-background/50">{i.name}</Badge>
                           ))}
                        </div>
                      </div>
                    ))}
                  </div>
                </TabsContent>

                <TabsContent value="talents">
                   <div className="p-8 text-center rounded-3xl bg-secondary/5 border border-secondary/20 border-dashed">
                      <Sparkles className="w-12 h-12 text-secondary mx-auto mb-4" />
                      <h3 className="text-2xl font-bold mb-2">Hidden Talents</h3>
                      <p className="text-muted-foreground mb-6">Unveil your secret skills to the universe.</p>
                      <Button variant="secondary">Reveal Talent</Button>
                   </div>
                </TabsContent>
              </Tabs>
            </div>
          </div>
        </div>
      </div>
    </Layout>
  );
}
