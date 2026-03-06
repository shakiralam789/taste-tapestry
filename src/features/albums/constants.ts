import { Film, Music, BookOpen, Tv, Gamepad, Globe, Heart, Sparkles, Clock, Album } from "lucide-react";

export const CATEGORY_TABS = [
  { value: "all", label: "All", icon: Globe },
  { value: "movies", label: "Movie", icon: Film },
  { value: "series", label: "Series", icon: Tv },
  { value: "songs", label: "Song", icon: Music },
  { value: "books", label: "Book", icon: BookOpen },
  { value: "games", label: "Game", icon: Gamepad },
] as const;

export type CategoryTabValue = (typeof CATEGORY_TABS)[number]["value"];

export const PROFILE_TABS = [
  { value: "", label: "My collection", icon: Album },
  { value: "interests", label: "Interests & pursuits", icon: Heart },
  { value: "talents", label: "Hidden talents", icon: Sparkles },
  { value: "capsules", label: "Time capsules", icon: Clock },
] as const;

export type ProfileTabValue = (typeof PROFILE_TABS)[number]["value"];