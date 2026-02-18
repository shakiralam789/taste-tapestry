"use client";
import React, { createContext, useContext, useState, ReactNode } from 'react';
import { User, Category, Favorite, TimeCapsule, Mood, TasteMatch } from '@/types/wishbook';
import { 
  currentUser as initialUser, 
  defaultCategories, 
  sampleFavorites, 
  sampleTimeCapsules,
  sampleTasteMatches,
  sampleUsers
} from '@/data/mockData';

interface WishbookContextType {
  user: User;
  setUser: (user: User) => void;
  categories: Category[];
  setCategories: (categories: Category[]) => void;
  favorites: Favorite[];
  addFavorite: (favorite: Favorite) => void;
  updateFavorite: (id: string, favorite: Partial<Favorite>) => void;
  deleteFavorite: (id: string) => void;
  timeCapsules: TimeCapsule[];
  addTimeCapsule: (capsule: TimeCapsule) => void;
  tasteMatches: TasteMatch[];
  selectedMood: Mood | null;
  setSelectedMood: (mood: Mood | null) => void;
  allUsers: User[];
  getFavoritesByMood: (mood: Mood) => Favorite[];
  getFavoritesByCategory: (categoryId: string) => Favorite[];
}

const defaultContextValue: WishbookContextType = {
  user: initialUser,
  setUser: () => {},
  categories: defaultCategories,
  setCategories: () => {},
  favorites: sampleFavorites,
  addFavorite: () => {},
  updateFavorite: () => {},
  deleteFavorite: () => {},
  timeCapsules: sampleTimeCapsules,
  addTimeCapsule: () => {},
  tasteMatches: sampleTasteMatches,
  selectedMood: null,
  setSelectedMood: () => {},
  allUsers: [initialUser, ...sampleUsers],
  getFavoritesByMood: () => sampleFavorites,
  getFavoritesByCategory: () => sampleFavorites,
};

const WishbookContext = createContext<WishbookContextType>(defaultContextValue);

export function WishbookProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User>(initialUser);
  const [categories, setCategories] = useState<Category[]>(defaultCategories);
  const [favorites, setFavorites] = useState<Favorite[]>(sampleFavorites);
  const [timeCapsules, setTimeCapsules] = useState<TimeCapsule[]>(sampleTimeCapsules);
  const [tasteMatches] = useState<TasteMatch[]>(sampleTasteMatches);
  const [selectedMood, setSelectedMood] = useState<Mood | null>(null);
  const [allUsers] = useState<User[]>([initialUser, ...sampleUsers]);

  const addFavorite = (favorite: Favorite) => {
    setFavorites(prev => [...prev, favorite]);
  };

  const updateFavorite = (id: string, updates: Partial<Favorite>) => {
    setFavorites(prev => prev.map(f => f.id === id ? { ...f, ...updates } : f));
  };

  const deleteFavorite = (id: string) => {
    setFavorites(prev => prev.filter(f => f.id !== id));
  };

  const addTimeCapsule = (capsule: TimeCapsule) => {
    setTimeCapsules(prev => [...prev, capsule]);
  };

  const getFavoritesByMood = (mood: Mood) => {
    return favorites.filter(f => f.mood.includes(mood));
  };

  const getFavoritesByCategory = (categoryId: string) => {
    return favorites.filter(f => f.categoryId === categoryId);
  };

  return (
    <WishbookContext.Provider value={{
      user,
      setUser,
      categories,
      setCategories,
      favorites,
      addFavorite,
      updateFavorite,
      deleteFavorite,
      timeCapsules,
      addTimeCapsule,
      tasteMatches,
      selectedMood,
      setSelectedMood,
      allUsers,
      getFavoritesByMood,
      getFavoritesByCategory,
    }}>
      {children}
    </WishbookContext.Provider>
  );
}

export function useWishbook() {
  return useContext(WishbookContext);
}
