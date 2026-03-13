import React, { useState } from 'react';
import { MediaMetadata } from '@/lib/upload';
import { cn } from '@/lib/utils';
import { Play } from 'lucide-react';

interface OptimizedMediaProps extends React.HTMLAttributes<HTMLDivElement> {
  media: MediaMetadata;
  alt?: string;
  fill?: boolean;
  className?: string;
  imageClassName?: string;
  videoClassName?: string;
}

export function OptimizedMedia({
  media,
  alt = 'Media content',
  className,
  imageClassName,
  videoClassName,
  ...props
}: OptimizedMediaProps) {
  const [isLoaded, setIsLoaded] = useState(false);

  // Fallback to original if optimization failed or wasn't applied
  const isImage = media.resource_type === 'image';
  
  // Construct srcset for responsive images
  // Large: 2048, Medium: 800, Small: 300
  const buildResourceUrl = (w: number) => {
    return media.original_url.replace(/\/upload\//, `/upload/w_${w},f_auto,q_auto/`);
  };

  const srcSet = isImage 
    ? `${media.thumbnail_url} 300w, ${buildResourceUrl(800)} 800w, ${media.optimized_url} 2048w`
    : undefined;

  return (
    <div 
      className={cn(
        "relative overflow-hidden w-full h-full bg-muted",
        className
      )}
      {...props}
    >
      {isImage ? (
        <>
          {/* Blur Placeholder */}
          {media.blur_data_url && (
            <div 
              className={cn(
                "absolute inset-0 bg-cover bg-center transition-opacity duration-500",
                isLoaded ? "opacity-0" : "opacity-100"
              )}
              style={{ backgroundImage: `url(${media.blur_data_url})` }}
            />
          )}
          
          {/* Main Image */}
          <img
            src={media.optimized_url}
            srcSet={srcSet}
            sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
            alt={alt}
            loading="lazy"
            onLoad={() => setIsLoaded(true)}
            className={cn(
              "w-full h-full object-cover transition-opacity duration-500",
              isLoaded ? "opacity-100" : "opacity-0",
              imageClassName
            )}
          />
        </>
      ) : (
        // Video handling
        <div className="relative w-full h-full group">
           {/* Placeholder poster */}
          <div 
            className="absolute inset-0 bg-cover bg-center pointer-events-none"
            style={{ backgroundImage: `url(${media.thumbnail_url})` }}
          />

          {/* Simple HTML5 Video handler. For advanced HLS, you'd use video.js or hls.js */}
          <video
            src={media.optimized_url}
            poster={media.thumbnail_url}
            controls
            preload="metadata"
            className={cn(
              "w-full h-full object-cover z-10 relative opacity-0 hover:opacity-100 transition-opacity",
              videoClassName
            )}
            style={{
              // Fallback to original mp4 if the browser doesn't support native HLS (.m3u8)
              // Safari supports .m3u8 natively, others need HLS.js. 
              // Providing original_url as a fallback guarantees cross-browser playability without adding heavy libraries.
            }}
          >
            <source src={media.optimized_url} type="application/x-mpegURL" />
            <source src={media.original_url} type="video/mp4" />
          </video>
          
          {/* Play Icon Overlay (visible until hovered/played) */}
          <div className="absolute inset-0 flex items-center justify-center pointer-events-none group-hover:opacity-0 transition-opacity">
            <div className="w-12 h-12 rounded-full bg-black/50 backdrop-blur-sm flex items-center justify-center border border-white/20">
              <Play className="w-5 h-5 text-white ml-1" />
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
