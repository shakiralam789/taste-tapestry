// User Types
export interface User {
  id: string;
  name: string;
  username: string;
  avatar: string;
  bio: string;
  location?: string;
  followers: number;
  following: number;
  interests: Interest[];
  talents: Talent[];
  createdAt: Date;
}

export interface Interest {
  id: string;
  name: string;
  category: InterestCategory;
  icon?: string;
}

export type InterestCategory = 
  | 'creative'
  | 'performance'
  | 'skill'
  | 'intellectual'
  | 'unique'
  | 'collaborative';

export interface Talent {
  id: string;
  name: string;
  isPublic: boolean;
}

// Category Types
export interface Category {
  id: string;
  name: string;
  icon: string;
  color: string;
  isDefault: boolean;
  fields?: CustomField[];
}

export interface CustomField {
  id: string;
  name: string;
  type: 'text' | 'rating' | 'mood' | 'dropdown' | 'date' | 'tags' | 'textarea';
  options?: string[];
  required?: boolean;
}

// Favorite Types
export interface Favorite {
  id: string;
  userId: string;
  categoryId: string;
  title: string;
  image?: string;
  rating: number;
  mood: Mood[];
  whyILike: string;
  timePeriod?: string;
  recommendedTime?: string[];
  tags: string[];
  createdAt: Date;
  fields: Record<string, any>;
}

export interface MovieFavorite extends Favorite {
  genre: string[];
  releaseYear: number;
  plotSummary: string;
  inspiredBy?: string;
}

// Mood Types
export type Mood = 
  | 'happy'
  | 'sad'
  | 'nostalgic'
  | 'motivated'
  | 'chill'
  | 'lonely'
  | 'heartbroken'
  | 'excited'
  | 'peaceful';

export interface MoodOption {
  id: Mood;
  name: string;
  emoji: string;
  gradient: string;
}

// Time Capsule Types
export interface TimeCapsule {
  id: string;
  userId: string;
  title: string;
  description: string;
  period: string;
  image?: string;
  favorites: string[];
  emotions: string[];
  story?: string;
  createdAt: Date;
}

// Taste Matching Types
export interface TasteMatch {
  userId: string;
  user: User;
  compatibilityScore: number;
  sharedFavorites: Favorite[];
  recommendations: Favorite[];
  breakdown: {
    category: string;
    score: number;
  }[];
}

// Social Types
export interface Message {
  id: string;
  senderId: string;
  receiverId: string;
  content: string;
  type: 'text' | 'recommendation' | 'voice';
  recommendation?: Favorite;
  createdAt: Date;
  read: boolean;
}

export interface Notification {
  id: string;
  userId: string;
  type: 'follow' | 'recommendation' | 'match' | 'message';
  fromUser: User;
  content: string;
  createdAt: Date;
  read: boolean;
}

// Chain Reaction Types
export interface ChainReaction {
  favoriteId: string;
  chain: {
    user: User;
    date: Date;
  }[];
}
