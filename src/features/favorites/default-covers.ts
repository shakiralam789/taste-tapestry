/**
 * Default cover image URL per favorite category when no image is set.
 * Used in editor (submit fallback), cards, and show page.
 */

const UNSPLASH_BASE = "https://images.unsplash.com";

export const DEFAULT_COVER_BY_CATEGORY: Record<string, string> = {
  movies:
    `${UNSPLASH_BASE}/photo-1489599849927-2ee91cede3ba?w=400&h=600&fit=crop`,
  series:
    `${UNSPLASH_BASE}/photo-1594909122845-11baa439b7bf?w=400&h=600&fit=crop`,
  anime:
    `${UNSPLASH_BASE}/photo-1578632767115-351597cf2477?w=400&h=600&fit=crop`,
  songs:
    `${UNSPLASH_BASE}/photo-1478737270239-2f02b77fc618?w=400&h=600&fit=crop`,
  books:
    `${UNSPLASH_BASE}/photo-1481627834876-b7833e8f5570?w=400&h=600&fit=crop`,
  games:
    `${UNSPLASH_BASE}/photo-1542751371-adc38448a05e?w=400&h=600&fit=crop`,
};

const FALLBACK_IMAGE =
  `${UNSPLASH_BASE}/photo-1489599849927-2ee91cede3ba?w=400&h=600&fit=crop`;

/** Default cover for a category; falls back to generic image if category unknown. */
export function getDefaultCoverForCategory(categoryId: string): string {
  return DEFAULT_COVER_BY_CATEGORY[categoryId] ?? FALLBACK_IMAGE;
}

/** Image URL to show for a favorite: its image or the category default. */
export function getFavoriteCoverImage(
  image: string | null | undefined,
  categoryId: string
): string {
  return image?.trim() || getDefaultCoverForCategory(categoryId);
}
