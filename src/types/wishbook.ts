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
/** One point on the emotional curve: x = time in seconds, y = intensity 0–10. Optional image & note per point. */
export interface EmotionalCurvePoint {
  id: string;
  /** Time position in seconds (depends on movie/song/episode duration) */
  x: number;
  /** Intensity / how you felt: 0 (low) to 10 (high) */
  y: number;
  image?: string;
  note?: string;
}

/** Preset emotion colors for segment bars (happy, sad, angry, etc.). */
export type EmotionColorKey =
  | 'happy'
  | 'sad'
  | 'angry'
  | 'scary'
  | 'funny'
  | 'peaceful'
  | 'excited'
  | 'nostalgic'
  | 'mix'
  | 'neutral';

/** A time range segment on the emotional journey (video-editor style): bar from start to end with one intensity. */
export interface EmotionalSegment {
  id: string;
  /** Start time in seconds */
  startSeconds: number;
  /** End time in seconds */
  endSeconds: number;
  /** Intensity 0–10 for this segment */
  intensity: number;
  /** Optional emotion color preset for this segment */
  emotionColor?: EmotionColorKey;
  image?: string;
  note?: string;
}

/** A moment pin: a specific point in the experience with optional image and note. For series/anime, use season + episode. */
export interface MomentPin {
  id: string;
  positionPercent: number;
  note: string;
  image?: string;
  /** Series/Anime: season number (1-based) */
  season?: number;
  /** Series/Anime: episode number (1-based) */
  episode?: number;
  /** Series/Anime: position within the episode (0-100) */
  positionInEpisodePercent?: number;
}

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
