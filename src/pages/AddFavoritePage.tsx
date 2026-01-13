import { useState } from 'react';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { Layout } from '@/components/layout/Layout';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { CategoryChip } from '@/components/categories/CategoryChip';
import { useWishbook } from '@/contexts/WishbookContext';
import { moodOptions } from '@/data/mockData';
import { 
  ArrowLeft, 
  Upload, 
  Star, 
  Sparkles,
  Clock,
  Tag,
  X,
  Plus
} from 'lucide-react';
import { Slider } from '@/components/ui/slider';
import { Favorite, Mood } from '@/types/wishbook';

export default function AddFavoritePage() {
  const navigate = useNavigate();
  const { categories, addFavorite } = useWishbook();
  
  const [selectedCategory, setSelectedCategory] = useState<string>('movies');
  const [formData, setFormData] = useState({
    title: '',
    image: '',
    rating: 8,
    whyILike: '',
    timePeriod: '',
    genre: '',
    releaseYear: '',
    plotSummary: '',
  });
  const [selectedMoods, setSelectedMoods] = useState<Mood[]>([]);
  const [tags, setTags] = useState<string[]>([]);
  const [newTag, setNewTag] = useState('');
  const [recommendedTimes, setRecommendedTimes] = useState<string[]>([]);

  const timeOptions = [
    { id: 'night', label: '🌙 Night' },
    { id: 'morning', label: '☀️ Morning' },
    { id: 'rainy-day', label: '🌧️ Rainy Day' },
    { id: 'alone', label: '🧘 Alone' },
    { id: 'with-friends', label: '👥 With Friends' },
    { id: 'weekend', label: '📅 Weekend' },
  ];

  const toggleMood = (mood: Mood) => {
    setSelectedMoods(prev => 
      prev.includes(mood) 
        ? prev.filter(m => m !== mood)
        : [...prev, mood]
    );
  };

  const toggleTime = (time: string) => {
    setRecommendedTimes(prev =>
      prev.includes(time)
        ? prev.filter(t => t !== time)
        : [...prev, time]
    );
  };

  const addTag = () => {
    if (newTag.trim() && !tags.includes(newTag.trim())) {
      setTags(prev => [...prev, newTag.trim()]);
      setNewTag('');
    }
  };

  const removeTag = (tag: string) => {
    setTags(prev => prev.filter(t => t !== tag));
  };

  const handleSubmit = () => {
    const newFavorite: Favorite = {
      id: Date.now().toString(),
      userId: '1',
      categoryId: selectedCategory,
      title: formData.title,
      image: formData.image || 'https://images.unsplash.com/photo-1489599849927-2ee91cede3ba?w=400&h=600&fit=crop',
      rating: formData.rating,
      mood: selectedMoods,
      whyILike: formData.whyILike,
      timePeriod: formData.timePeriod,
      recommendedTime: recommendedTimes,
      tags,
      createdAt: new Date(),
      fields: {
        genre: formData.genre.split(',').map(g => g.trim()),
        releaseYear: parseInt(formData.releaseYear) || new Date().getFullYear(),
        plotSummary: formData.plotSummary,
      },
    };

    addFavorite(newFavorite);
    navigate('/profile');
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
              Add New <span className="gradient-text">Favorite</span>
            </h1>
            <p className="text-muted-foreground">
              Share something you love with the world
            </p>
          </motion.div>

          {/* Category Selection */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="mb-8"
          >
            <Label className="text-base font-medium mb-3 block">Category</Label>
            <div className="flex flex-wrap gap-2">
              {categories.map((category) => (
                <CategoryChip
                  key={category.id}
                  category={category}
                  isSelected={selectedCategory === category.id}
                  onClick={() => setSelectedCategory(category.id)}
                />
              ))}
            </div>
          </motion.div>

          {/* Form */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="space-y-6"
          >
            {/* Image Upload */}
            <div className="elevated-card p-6">
              <Label className="text-base font-medium mb-3 block">Cover Image</Label>
              <div className="border-2 border-dashed border-border rounded-xl p-8 text-center hover:border-primary/50 transition-colors cursor-pointer">
                <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-muted flex items-center justify-center">
                  <Upload className="w-8 h-8 text-muted-foreground" />
                </div>
                <p className="text-sm text-muted-foreground mb-2">
                  Drag and drop or click to upload
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
                <Label htmlFor="title">Title *</Label>
                <Input
                  id="title"
                  placeholder="e.g., Eternal Sunshine of the Spotless Mind"
                  value={formData.title}
                  onChange={(e) => setFormData(prev => ({ ...prev, title: e.target.value }))}
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="genre">Genre</Label>
                  <Input
                    id="genre"
                    placeholder="e.g., Romance, Drama"
                    value={formData.genre}
                    onChange={(e) => setFormData(prev => ({ ...prev, genre: e.target.value }))}
                  />
                </div>
                <div>
                  <Label htmlFor="year">Release Year</Label>
                  <Input
                    id="year"
                    type="number"
                    placeholder="e.g., 2004"
                    value={formData.releaseYear}
                    onChange={(e) => setFormData(prev => ({ ...prev, releaseYear: e.target.value }))}
                  />
                </div>
              </div>

              <div>
                <Label htmlFor="plot">Plot Summary</Label>
                <Textarea
                  id="plot"
                  placeholder="Brief description..."
                  value={formData.plotSummary}
                  onChange={(e) => setFormData(prev => ({ ...prev, plotSummary: e.target.value }))}
                  rows={3}
                />
              </div>
            </div>

            {/* Rating */}
            <div className="elevated-card p-6">
              <div className="flex items-center justify-between mb-4">
                <Label className="text-base font-medium flex items-center gap-2">
                  <Star className="w-5 h-5 text-secondary" />
                  Your Rating
                </Label>
                <span className="text-2xl font-display font-bold gradient-text">
                  {formData.rating}/10
                </span>
              </div>
              <Slider
                value={[formData.rating]}
                onValueChange={(value) => setFormData(prev => ({ ...prev, rating: value[0] }))}
                max={10}
                min={1}
                step={0.5}
                className="w-full"
              />
            </div>

            {/* Why I Like */}
            <div className="elevated-card p-6">
              <Label htmlFor="why" className="text-base font-medium flex items-center gap-2 mb-3">
                <Sparkles className="w-5 h-5 text-primary" />
                Why I Love This *
              </Label>
              <Textarea
                id="why"
                placeholder="What makes this special to you? Share your personal connection..."
                value={formData.whyILike}
                onChange={(e) => setFormData(prev => ({ ...prev, whyILike: e.target.value }))}
                rows={4}
              />
            </div>

            {/* Time Period */}
            <div className="elevated-card p-6">
              <Label htmlFor="period" className="text-base font-medium flex items-center gap-2 mb-3">
                <Clock className="w-5 h-5 text-primary" />
                Time Period of Your Life
              </Label>
              <Input
                id="period"
                placeholder="e.g., College Years, Summer 2023, First Job"
                value={formData.timePeriod}
                onChange={(e) => setFormData(prev => ({ ...prev, timePeriod: e.target.value }))}
              />
            </div>

            {/* Mood Selection */}
            <div className="elevated-card p-6">
              <Label className="text-base font-medium mb-4 block">Mood Tags</Label>
              <div className="flex flex-wrap gap-2">
                {moodOptions.map((mood) => (
                  <Button
                    key={mood.id}
                    variant={selectedMoods.includes(mood.id) ? 'default' : 'outline'}
                    size="sm"
                    onClick={() => toggleMood(mood.id)}
                    className="gap-1"
                  >
                    {mood.emoji} {mood.name}
                  </Button>
                ))}
              </div>
            </div>

            {/* Recommended Time */}
            <div className="elevated-card p-6">
              <Label className="text-base font-medium mb-4 block">Best Time to Experience</Label>
              <div className="flex flex-wrap gap-2">
                {timeOptions.map((time) => (
                  <Button
                    key={time.id}
                    variant={recommendedTimes.includes(time.id) ? 'default' : 'outline'}
                    size="sm"
                    onClick={() => toggleTime(time.id)}
                  >
                    {time.label}
                  </Button>
                ))}
              </div>
            </div>

            {/* Tags */}
            <div className="elevated-card p-6">
              <Label className="text-base font-medium flex items-center gap-2 mb-4">
                <Tag className="w-5 h-5 text-primary" />
                Custom Tags
              </Label>
              <div className="flex gap-2 mb-3">
                <Input
                  placeholder="Add a tag..."
                  value={newTag}
                  onChange={(e) => setNewTag(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), addTag())}
                />
                <Button onClick={addTag} variant="outline">
                  <Plus className="w-4 h-4" />
                </Button>
              </div>
              {tags.length > 0 && (
                <div className="flex flex-wrap gap-2">
                  {tags.map((tag) => (
                    <span
                      key={tag}
                      className="inline-flex items-center gap-1 px-3 py-1 rounded-full bg-accent text-sm"
                    >
                      {tag}
                      <button onClick={() => removeTag(tag)}>
                        <X className="w-3 h-3" />
                      </button>
                    </span>
                  ))}
                </div>
              )}
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
                disabled={!formData.title || !formData.whyILike}
              >
                <Sparkles className="w-5 h-5" />
                Add to Favorites
              </Button>
            </div>
          </motion.div>
        </div>
      </div>
    </Layout>
  );
}
