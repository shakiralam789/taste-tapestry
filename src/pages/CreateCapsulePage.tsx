import { useState } from 'react';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { Layout } from '@/components/layout/Layout';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { useWishbook } from '@/contexts/WishbookContext';
import { 
  ArrowLeft, 
  Upload, 
  Clock,
  Sparkles,
  Plus,
  X
} from 'lucide-react';
import { TimeCapsule } from '@/types/wishbook';

export default function CreateCapsulePage() {
  const navigate = useNavigate();
  const { favorites, addTimeCapsule } = useWishbook();
  
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    period: '',
    image: '',
    story: '',
  });
  const [selectedFavorites, setSelectedFavorites] = useState<string[]>([]);
  const [emotions, setEmotions] = useState<string[]>([]);
  const [newEmotion, setNewEmotion] = useState('');

  const emotionSuggestions = [
    'nostalgic', 'happy', 'bittersweet', 'adventurous', 'peaceful', 
    'hopeful', 'melancholic', 'excited', 'reflective', 'free'
  ];

  const toggleFavorite = (id: string) => {
    setSelectedFavorites(prev =>
      prev.includes(id)
        ? prev.filter(f => f !== id)
        : [...prev, id]
    );
  };

  const addEmotion = (emotion: string) => {
    if (emotion.trim() && !emotions.includes(emotion.trim())) {
      setEmotions(prev => [...prev, emotion.trim()]);
      setNewEmotion('');
    }
  };

  const removeEmotion = (emotion: string) => {
    setEmotions(prev => prev.filter(e => e !== emotion));
  };

  const handleSubmit = () => {
    const newCapsule: TimeCapsule = {
      id: Date.now().toString(),
      userId: '1',
      title: formData.title,
      description: formData.description,
      period: formData.period,
      image: formData.image || 'https://images.unsplash.com/photo-1523050854058-8df90110c9f1?w=600&h=400&fit=crop',
      favorites: selectedFavorites,
      emotions,
      story: formData.story,
      createdAt: new Date(),
    };

    addTimeCapsule(newCapsule);
    navigate('/capsules');
  };

  return (
    <Layout>
      <div className="min-h-screen py-12">
        <div className="container mx-auto px-4 max-w-3xl">
          {/* Header */}
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            className="mb-8"
          >
            <Button 
              variant="ghost" 
              onClick={() => navigate(-1)}
              className="mb-4"
            >
              <ArrowLeft className="w-4 h-4" />
              Back
            </Button>
            <h1 className="font-display text-3xl font-bold">
              Create <span className="gradient-text">Time Capsule</span>
            </h1>
            <p className="text-muted-foreground">
              Preserve a chapter of your life through the things you loved
            </p>
          </motion.div>

          {/* Form */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="space-y-6"
          >
            {/* Cover Image */}
            <div className="elevated-card p-6">
              <Label className="text-base font-medium mb-3 block">Cover Image</Label>
              <div className="border-2 border-dashed border-border rounded-xl p-8 text-center hover:border-primary/50 transition-colors cursor-pointer">
                <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-muted flex items-center justify-center">
                  <Upload className="w-8 h-8 text-muted-foreground" />
                </div>
                <p className="text-sm text-muted-foreground mb-2">
                  Add a photo that represents this time
                </p>
                <Input
                  placeholder="Or paste an image URL"
                  value={formData.image}
                  onChange={(e) => setFormData(prev => ({ ...prev, image: e.target.value }))}
                  className="max-w-md mx-auto"
                />
              </div>
            </div>

            {/* Basic Info */}
            <div className="elevated-card p-6 space-y-4">
              <div>
                <Label htmlFor="title" className="flex items-center gap-2">
                  <Clock className="w-4 h-4 text-primary" />
                  Capsule Title *
                </Label>
                <Input
                  id="title"
                  placeholder="e.g., College Days, Summer of 2023"
                  value={formData.title}
                  onChange={(e) => setFormData(prev => ({ ...prev, title: e.target.value }))}
                />
              </div>

              <div>
                <Label htmlFor="period">Time Period</Label>
                <Input
                  id="period"
                  placeholder="e.g., 2018-2022, Summer 2023"
                  value={formData.period}
                  onChange={(e) => setFormData(prev => ({ ...prev, period: e.target.value }))}
                />
              </div>

              <div>
                <Label htmlFor="description">Short Description</Label>
                <Textarea
                  id="description"
                  placeholder="A brief description of what this time meant to you..."
                  value={formData.description}
                  onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                  rows={2}
                />
              </div>
            </div>

            {/* Select Favorites */}
            <div className="elevated-card p-6">
              <Label className="text-base font-medium mb-4 block">
                Select Favorites to Include
              </Label>
              {favorites.length > 0 ? (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {favorites.map((fav) => (
                    <label
                      key={fav.id}
                      className={`flex items-center gap-3 p-3 rounded-xl border-2 cursor-pointer transition-all ${
                        selectedFavorites.includes(fav.id)
                          ? 'border-primary bg-primary/5'
                          : 'border-border hover:border-primary/30'
                      }`}
                    >
                      <Checkbox
                        checked={selectedFavorites.includes(fav.id)}
                        onCheckedChange={() => toggleFavorite(fav.id)}
                      />
                      <div className="flex items-center gap-3 flex-1 min-w-0">
                        <div className="w-10 h-10 rounded-lg overflow-hidden flex-shrink-0">
                          <img 
                            src={fav.image} 
                            alt={fav.title}
                            className="w-full h-full object-cover"
                          />
                        </div>
                        <div className="min-w-0">
                          <p className="font-medium truncate">{fav.title}</p>
                          <p className="text-xs text-muted-foreground capitalize">
                            {fav.categoryId}
                          </p>
                        </div>
                      </div>
                    </label>
                  ))}
                </div>
              ) : (
                <p className="text-muted-foreground text-center py-8">
                  No favorites yet. Add some favorites first!
                </p>
              )}
            </div>

            {/* Emotions */}
            <div className="elevated-card p-6">
              <Label className="text-base font-medium mb-4 block">
                Emotions & Feelings
              </Label>
              
              {/* Suggestions */}
              <div className="flex flex-wrap gap-2 mb-4">
                {emotionSuggestions.map((emotion) => (
                  <Button
                    key={emotion}
                    variant={emotions.includes(emotion) ? 'default' : 'outline'}
                    size="sm"
                    onClick={() => emotions.includes(emotion) ? removeEmotion(emotion) : addEmotion(emotion)}
                  >
                    {emotion}
                  </Button>
                ))}
              </div>

              {/* Custom Input */}
              <div className="flex gap-2">
                <Input
                  placeholder="Add custom emotion..."
                  value={newEmotion}
                  onChange={(e) => setNewEmotion(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), addEmotion(newEmotion))}
                />
                <Button onClick={() => addEmotion(newEmotion)} variant="outline">
                  <Plus className="w-4 h-4" />
                </Button>
              </div>

              {/* Selected Emotions */}
              {emotions.filter(e => !emotionSuggestions.includes(e)).length > 0 && (
                <div className="flex flex-wrap gap-2 mt-3">
                  {emotions.filter(e => !emotionSuggestions.includes(e)).map((emotion) => (
                    <span
                      key={emotion}
                      className="inline-flex items-center gap-1 px-3 py-1 rounded-full bg-accent text-sm"
                    >
                      {emotion}
                      <button onClick={() => removeEmotion(emotion)}>
                        <X className="w-3 h-3" />
                      </button>
                    </span>
                  ))}
                </div>
              )}
            </div>

            {/* Story */}
            <div className="elevated-card p-6">
              <Label htmlFor="story" className="text-base font-medium flex items-center gap-2 mb-3">
                <Sparkles className="w-5 h-5 text-primary" />
                Your Story (Optional)
              </Label>
              <Textarea
                id="story"
                placeholder="Write about what happened during this time. What defined these days? What do you want to remember?"
                value={formData.story}
                onChange={(e) => setFormData(prev => ({ ...prev, story: e.target.value }))}
                rows={6}
              />
            </div>

            {/* Submit */}
            <div className="flex gap-4 pt-4">
              <Button variant="outline" className="flex-1" onClick={() => navigate(-1)}>
                Cancel
              </Button>
              <Button 
                variant="gradient" 
                className="flex-1"
                onClick={handleSubmit}
                disabled={!formData.title}
              >
                <Clock className="w-5 h-5" />
                Create Capsule
              </Button>
            </div>
          </motion.div>
        </div>
      </div>
    </Layout>
  );
}
