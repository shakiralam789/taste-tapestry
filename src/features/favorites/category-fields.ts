/**
 * Category-specific extra fields for Song, Book, and Game favorites.
 * Stored in favorite.fields. Used in add/edit form, list card subtitle, and show page.
 */

export type CategoryFieldType = "text" | "number" | "textarea";

export interface CategoryFieldDef {
  key: string;
  label: string;
  placeholder: string;
  type: CategoryFieldType;
  /** Optional: for list card / show page, primary line (e.g. "Artist" for song) */
  primary?: boolean;
}

/** Song: artist, songwriter, album, release year, genre, duration */
export const SONG_FIELDS: CategoryFieldDef[] = [
  { key: "artist", label: "Artist / Singer", placeholder: "e.g. Taylor Swift", type: "text", primary: true },
  { key: "songwriter", label: "Songwriter", placeholder: "e.g. Max Martin", type: "text" },
  { key: "album", label: "Album", placeholder: "Album name", type: "text" },
  { key: "releaseYear", label: "Release Year", placeholder: "2024", type: "number" },
  { key: "genre", label: "Genre", placeholder: "Pop, Rock, R&B", type: "text" },
  { key: "duration", label: "Duration", placeholder: "3:45 or 225 (seconds)", type: "text" },
];

/** Book: author, illustrator, publisher, year, genre, page count */
export const BOOK_FIELDS: CategoryFieldDef[] = [
  { key: "author", label: "Author", placeholder: "e.g. Haruki Murakami", type: "text", primary: true },
  { key: "illustrator", label: "Illustrator", placeholder: "If applicable", type: "text" },
  { key: "publisher", label: "Publisher", placeholder: "e.g. Vintage", type: "text" },
  { key: "publicationYear", label: "Publication Year", placeholder: "2020", type: "number" },
  { key: "genre", label: "Genre", placeholder: "Fiction, Memoir, Sci-Fi", type: "text" },
  { key: "pageCount", label: "Page Count", placeholder: "320", type: "number" },
];

/** Game: developer, publisher, platform, release year, genre, playtime */
export const GAME_FIELDS: CategoryFieldDef[] = [
  { key: "developer", label: "Developer / Studio", placeholder: "e.g. FromSoftware", type: "text", primary: true },
  { key: "publisher", label: "Publisher", placeholder: "e.g. Bandai Namco", type: "text" },
  { key: "platform", label: "Platform", placeholder: "PC, PlayStation, Xbox, Nintendo Switch, Mobile", type: "text" },
  { key: "releaseYear", label: "Release Year", placeholder: "2022", type: "number" },
  { key: "genre", label: "Genre", placeholder: "RPG, Action, Indie", type: "text" },
  { key: "playtimeHours", label: "Playtime (hours)", placeholder: "45", type: "number" },
];

export const CATEGORY_EXTRA_FIELDS: Record<string, CategoryFieldDef[]> = {
  songs: SONG_FIELDS,
  books: BOOK_FIELDS,
  games: GAME_FIELDS,
};

/** Get primary display line for list card (e.g. "Artist" for song, "Author" for book). */
export function getCategoryPrimarySubtitle(
  categoryId: string,
  fields: Record<string, unknown> | null | undefined
): string | null {
  if (!fields) return null;
  const config = CATEGORY_EXTRA_FIELDS[categoryId];
  if (!config) return null;
  const primary = config.find((f) => f.primary);
  if (!primary) return null;
  const value = fields[primary.key];
  if (value == null || value === "") return null;
  return typeof value === "number" ? String(value) : String(value).trim();
}

/** Get full subtitle for card (e.g. "Artist · Album" or "Author · Genre"). */
export function getCategoryCardSubtitle(
  categoryId: string,
  fields: Record<string, unknown> | null | undefined
): string | null {
  if (!fields) return null;
  const config = CATEGORY_EXTRA_FIELDS[categoryId];
  if (!config) return null;
  const parts: string[] = [];
  for (const def of config) {
    const value = fields[def.key];
    if (value != null && value !== "") {
      parts.push(typeof value === "number" ? String(value) : String(value).trim());
    }
  }
  return parts.length > 0 ? parts.join(" · ") : null;
}
