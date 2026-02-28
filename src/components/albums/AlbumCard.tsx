import { motion } from "framer-motion";
import { PrivateBadge } from "@/components/common/PrivateBadge";
import type { Album } from "@/types/wishbook";

const DEFAULT_ALBUM_IMAGE = "/images/default-cover-image.jpg";
const DEFAULT_ALBUM_IMAGE_DARK = "/images/default-cover-image-dark.jpg";

interface AlbumCardProps {
  album: Album;
  onClick?: () => void;
}

export function AlbumCard({ album, onClick }: AlbumCardProps) {
  const itemCount = album.favoriteIds?.length ?? 0;

  return (
    <motion.div
      whileHover={{ scale: 1.02 }}
      transition={{ duration: 0.2 }}
      className="group relative overflow-hidden rounded-2xl bg-card/40 border border-white/5 backdrop-blur-sm hover:border-primary/30 transition-colors cursor-pointer"
      onClick={onClick}
    >
      {/* Cover */}
      <div className="relative h-40 overflow-hidden">
        <img
          src={album.coverImage || DEFAULT_ALBUM_IMAGE_DARK}
          alt={album.name}
          className="hidden dark:block w-full h-full object-cover transition-transform duration-700 group-hover:scale-110"
          onError={(e) => {
            (e.target as HTMLImageElement).src = DEFAULT_ALBUM_IMAGE_DARK;
          }}
        />
        <img
          src={album.coverImage || DEFAULT_ALBUM_IMAGE}
          alt={album.name}
          className="dark:hidden w-full h-full object-cover transition-transform duration-700 group-hover:scale-110"
          onError={(e) => {
            (e.target as HTMLImageElement).src = DEFAULT_ALBUM_IMAGE;
          }}
        />
        <div className="absolute inset-0 bg-gradient-to-b from-transparent via-transparent to-black/80" />
      </div>

      {album.isPublic === false && <PrivateBadge className="absolute top-3 left-3" />}
      {/* Content */}
      <div className="relative p-5 -mt-10">
        <div className="flex items-center justify-between gap-2 mb-1">
          <h3 className="font-display text-xl font-bold text-white drop-shadow-lg">
            {album.name}
          </h3>
        </div>
        {album.description && (
          <p className="text-sm text-gray-300 line-clamp-2 mb-3">
            {album.description}
          </p>
        )}

        <div className="flex items-center justify-between pt-3 border-t border-white/10 text-xs text-gray-400">
          <span className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-primary animate-pulse" />
            {itemCount} {itemCount === 1 ? "item" : "items"} in album
          </span>
        </div>
      </div>
    </motion.div>
  );
}
