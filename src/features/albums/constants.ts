import { Film, Music, BookOpen, Tv } from "lucide-react";

export const CATEGORY_TABS = [
  { value: "all", label: "All" },
  { value: "movies", label: "Movie", icon: Film },
  { value: "series", label: "Series", icon: Tv },
  { value: "songs", label: "Song", icon: Music },
  { value: "books", label: "Book", icon: BookOpen },
] as const;

export type CategoryTabValue = (typeof CATEGORY_TABS)[number]["value"];

