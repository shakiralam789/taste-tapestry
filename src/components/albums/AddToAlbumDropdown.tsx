"use client";

import { useState, useRef, useEffect } from "react";
import { Search } from "lucide-react";
import { Input } from "@/components/ui/input";
import type { Album } from "@/types/wishbook";
import { cn } from "@/lib/utils";

const DEFAULT_ALBUM_IMAGE = "/images/default-cover-image.jpg";
const DEFAULT_ALBUM_IMAGE_DARK = "/images/default-cover-image-dark.jpg";

interface AddToAlbumDropdownProps {
  /** All albums for the current user */
  albums: Album[];
  /** Favorite id we're adding — albums that already contain it are hidden */
  favoriteId: string;
  /** Called when user selects an album */
  onSelect: (albumId: string) => void;
  disabled?: boolean;
  loading?: boolean;
  placeholder?: string;
  className?: string;
}

export function AddToAlbumDropdown({
  albums,
  favoriteId,
  onSelect,
  disabled = false,
  loading = false,
  placeholder = "Search albums...",
  className,
}: AddToAlbumDropdownProps) {
  const [searchQuery, setSearchQuery] = useState("");
  const [open, setOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  const availableAlbums = albums.filter(
    (a) => !(a.favoriteIds ?? []).includes(favoriteId),
  );

  const query = searchQuery.trim().toLowerCase();
  const filteredAlbums = query
    ? availableAlbums.filter((a) =>
        a.name.toLowerCase().includes(query),
      )
    : availableAlbums;

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  if (loading) {
    return (
      <p className="text-sm text-muted-foreground py-2">Loading albums...</p>
    );
  }

  if (availableAlbums.length === 0) {
    return (
      <p className="text-sm text-muted-foreground py-2">
        No albums available to add to. This item is already in all your albums,
        or you don&apos;t have any albums yet.
      </p>
    );
  }

  return (
    <div ref={containerRef} className={cn("relative", className)}>
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground pointer-events-none" />
        <Input
          type="text"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          onFocus={() => setOpen(true)}
          placeholder={placeholder}
          disabled={disabled}
          className="pl-9 pr-3"
          aria-expanded={open}
          aria-haspopup="listbox"
          role="combobox"
        />
      </div>

      {open && (
        <ul
          className="absolute z-50 mt-1 w-full rounded-lg border border-white/10 bg-card shadow-lg overflow-hidden max-h-64 overflow-y-auto"
          role="listbox"
        >
          {filteredAlbums.length === 0 ? (
            <li className="px-3 py-4 text-sm text-muted-foreground text-center">
              No albums match &quot;{searchQuery}&quot;
            </li>
          ) : (
            filteredAlbums.map((album) => (
              <li key={album.id} role="option">
                <button
                  type="button"
                  onClick={() => {
                    onSelect(album.id);
                    setOpen(false);
                    setSearchQuery("");
                  }}
                  className="w-full flex items-center gap-3 px-3 py-2.5 text-left hover:bg-primary/10 focus:bg-primary/10 focus:outline-none border-b border-white/5 last:border-b-0"
                >
                  <div className="w-10 h-10 rounded-lg overflow-hidden bg-muted flex-shrink-0 flex items-center justify-center">
                    <img
                      src={album.coverImage || DEFAULT_ALBUM_IMAGE}
                      alt=""
                      className="dark:hidden w-full h-full object-cover"
                      onError={(e) => {
                        (e.target as HTMLImageElement).src = DEFAULT_ALBUM_IMAGE;
                      }}
                    />
                    <img
                      src={album.coverImage || DEFAULT_ALBUM_IMAGE_DARK}
                      alt=""
                      className="hidden dark:block w-full h-full object-cover"
                      onError={(e) => {
                        (e.target as HTMLImageElement).src = DEFAULT_ALBUM_IMAGE_DARK;
                      }}
                    />
                  </div>
                  <span className="text-sm font-medium truncate flex-1 min-w-0">
                    {album.name}
                  </span>
                </button>
              </li>
            ))
          )}
        </ul>
      )}
    </div>
  );
}
