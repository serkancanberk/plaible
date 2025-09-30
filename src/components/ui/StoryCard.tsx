import React, { useState, useMemo } from 'react';
import { Link } from 'react-router-dom';
import C2AButton from '../C2AButton';
import type { DBStoryAssets, DBStoryStats } from '../../types/story';

// YouTube utility functions (copied from admin components)
const getYouTubeVideoId = (url: string): string | null => {
  const patterns = [
    /(?:youtube\.com\/watch\?v=|youtu\.be\/|youtube\.com\/embed\/)([^&\n?#]+)/,
    /youtube\.com\/watch\?.*v=([^&\n?#]+)/,
    /youtube\.com\/v\/([^&\n?#]+)/,
    /youtube\.com\/embed\/([^&\n?#]+)/,
    /youtube\.com\/shorts\/([^&\n?#]+)/,
  ];
  
  for (const pattern of patterns) {
    const match = url.match(pattern);
    if (match && match[1]) {
      return match[1];
    }
  }
  
  return null;
};

const getYouTubeThumbnail = (videoId: string): string => {
  return `https://img.youtube.com/vi/${videoId}/hqdefault.jpg`;
};

export type StoryCardProps = {
  title: string;
  authorName?: string;
  slug: string; // for navigation
  headline?: string;
  assets?: DBStoryAssets;
  stats?: DBStoryStats;
  onPlay?: () => void;
  className?: string;
};

function formatCount(value: number): string {
  try {
    return Intl.NumberFormat(undefined, { notation: 'compact', maximumFractionDigits: 1 }).format(value);
  } catch {
    // Fallback
    if (value >= 1_000_000) return `${(value / 1_000_000).toFixed(1)}M`;
    if (value >= 1_000) return `${(value / 1_000).toFixed(1)}K`;
    return String(value);
  }
}

function clampRating(value: number): number {
  return Math.max(0, Math.min(5, value));
}

export default function StoryCard({
  title,
  authorName,
  slug,
  headline,
  assets,
  stats,
  onPlay,
  className,
}: StoryCardProps) {
  // Debug: Log props.assets received by StoryCard
  console.log('[StoryCard -> props.assets]', {
    title,
    images: assets?.images,
    videos: assets?.videos,
  });

  // Debug: Log API assets arrays in detail
  console.log('[StoryCard -> assets.images]', assets?.images);
  console.log('[StoryCard -> assets.videos]', assets?.videos);
  if (assets?.images) {
    assets.images.forEach((img, i) =>
      console.log(`[StoryCard -> Image ${i}]`, img)
    );
  }
  if (assets?.videos) {
    assets.videos.forEach((vid, i) =>
      console.log(`[StoryCard -> Video ${i}]`, vid)
    );
  }

  // Create media items array combining images and videos
  const mediaItems = useMemo(() => {
    const items: Array<{ type: 'image' | 'video' | 'youtube'; url: string; videoId?: string }> = [];
    
    // Add images
    if (assets?.images) {
      items.push(...assets.images.map(url => ({ type: 'image' as const, url })));
    }
    
    // Add videos (detect YouTube vs direct video files)
    if (assets?.videos) {
      items.push(...assets.videos.map(url => {
        const videoId = getYouTubeVideoId(url);
        if (videoId) {
          return { type: 'youtube' as const, url, videoId };
        } else {
          return { type: 'video' as const, url };
        }
      }));
    }
    
    return items;
  }, [assets?.images, assets?.videos]);

  // Debug: Log media items array construction
  console.log('[StoryCard -> Media Items]', {
    title,
    mediaItems,
    images: assets?.images,
    videos: assets?.videos,
  });

  // Debug: Log mediaItems mapping in detail
  console.log('[StoryCard -> mediaItems built]', mediaItems);
  mediaItems.forEach((item, i) =>
    console.log(`[StoryCard -> MediaItem ${i}]`, item)
  );

  const [currentMediaIndex, setCurrentMediaIndex] = useState(0);
  const [touchStartX, setTouchStartX] = useState<number | null>(null);
  const [touchEndX, setTouchEndX] = useState<number | null>(null);
  const [touchStartY, setTouchStartY] = useState<number | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const hasMedia = mediaItems.length > 0;
  const hasMultipleMedia = mediaItems.length > 1;
  const currentMedia = mediaItems[currentMediaIndex];

  // Safeguards: Ensure mediaItems is never undefined and add safety checks
  if (!mediaItems || !Array.isArray(mediaItems)) {
    console.warn('[StoryCard -> Safety Check] mediaItems is not an array:', mediaItems);
  }
  
  // Ensure currentMediaIndex is within bounds
  const safeCurrentIndex = Math.max(0, Math.min(currentMediaIndex, mediaItems.length - 1));
  if (safeCurrentIndex !== currentMediaIndex) {
    console.warn('[StoryCard -> Index Safety] Correcting currentMediaIndex from', currentMediaIndex, 'to', safeCurrentIndex);
  }

  // Navigation handlers
  const goToPrevious = () => {
    console.log('[StoryCard -> Navigation] Going to previous media', { title, currentIndex: currentMediaIndex, totalItems: mediaItems.length });
    setCurrentMediaIndex(prev => prev === 0 ? mediaItems.length - 1 : prev - 1);
  };

  const goToNext = () => {
    console.log('[StoryCard -> Navigation] Going to next media', { title, currentIndex: currentMediaIndex, totalItems: mediaItems.length });
    setCurrentMediaIndex(prev => prev === mediaItems.length - 1 ? 0 : prev + 1);
  };

  const goToMedia = (index: number) => {
    console.log('[StoryCard -> Navigation] Going to media index', { title, fromIndex: currentMediaIndex, toIndex: index, totalItems: mediaItems.length });
    setCurrentMediaIndex(index);
  };

  // Touch/Swipe handlers
  const handleTouchStart = (e: React.TouchEvent) => {
    setTouchStartX(e.targetTouches[0].clientX);
    setTouchStartY(e.targetTouches[0].clientY);
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    setTouchEndX(e.targetTouches[0].clientX);
    
    // Prevent default if horizontal movement is greater than vertical
    if (touchStartX && touchStartY) {
      const deltaX = Math.abs(e.targetTouches[0].clientX - touchStartX);
      const deltaY = Math.abs(e.targetTouches[0].clientY - touchStartY);
      
      if (deltaX > deltaY) {
        e.preventDefault();
      }
    }
  };

  const handleTouchEnd = () => {
    if (!touchStartX || !touchEndX) return;
    
    const distance = touchStartX - touchEndX;
    const isLeftSwipe = distance > 50;
    const isRightSwipe = distance < -50;

    if (isLeftSwipe && hasMultipleMedia) {
      console.log('[StoryCard -> Swipe]', 'left');
      goToNext();
    }
    if (isRightSwipe && hasMultipleMedia) {
      console.log('[StoryCard -> Swipe]', 'right');
      goToPrevious();
    }

    // Reset touch values
    setTouchStartX(null);
    setTouchEndX(null);
    setTouchStartY(null);
  };

  // Mouse drag handlers for desktop
  const handleMouseDown = (e: React.MouseEvent) => {
    setIsDragging(true);
    setTouchStartX(e.clientX);
    setTouchStartY(e.clientY);
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!isDragging || !touchStartX) return;
    
    setTouchEndX(e.clientX);
    
    // Prevent text selection during drag
    e.preventDefault();
  };

  const handleMouseUp = () => {
    if (!isDragging || !touchStartX || !touchEndX) {
      setIsDragging(false);
      return;
    }
    
    const distance = touchStartX - touchEndX;
    const isLeftSwipe = distance > 50;
    const isRightSwipe = distance < -50;

    if (isLeftSwipe && hasMultipleMedia) {
      console.log('[StoryCard -> Drag]', 'left');
      goToNext();
    }
    if (isRightSwipe && hasMultipleMedia) {
      console.log('[StoryCard -> Drag]', 'right');
      goToPrevious();
    }

    // Reset drag values
    setIsDragging(false);
    setTouchStartX(null);
    setTouchEndX(null);
    setTouchStartY(null);
  };

  // Helper function to render media item with thumbnail support
  const renderMediaItem = (item: { type: 'image' | 'video' | 'youtube'; url: string; videoId?: string }, index: number) => {
    const isActive = index === currentMediaIndex;
    
    if (item.type === 'youtube') {
      if (isActive) {
        return (
          <iframe
            src={`https://www.youtube.com/embed/${item.videoId}?controls=1&modestbranding=1&rel=0`}
            title="YouTube video player"
            frameBorder="0"
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
            allowFullScreen
            className="h-full w-full rounded-t-md"
          />
        );
      } else {
        // Placeholder thumbnail for non-active YouTube videos
        return (
          <img
            src={getYouTubeThumbnail(item.videoId!)}
            alt={`${title} video thumbnail`}
            className="h-full w-full object-cover rounded-t-md"
            loading="lazy"
          />
        );
      }
    } else if (item.type === 'video') {
      if (isActive) {
        return (
          <video
            className="h-full w-full object-cover rounded-t-md"
            controls
            src={item.url}
            aria-label={`${title} video`}
          />
        );
      } else {
        // Placeholder for non-active videos (could be enhanced with poster attribute)
        return (
          <div className="h-full w-full bg-black/20 rounded-t-md flex items-center justify-center">
            <span className="text-white text-sm">Video</span>
          </div>
        );
      }
    } else {
      // Images are always rendered normally
      return (
        <img
          className="h-full w-full object-cover rounded-t-md"
          src={item.url}
          alt={title}
          loading="lazy"
        />
      );
    }
  };

  const to = `/stories/${slug}`;

  const showPlayCount = typeof stats?.totalPlayed === 'number';
  const showRating = typeof stats?.avgRating === 'number';

  // Debug: Log arrows and dots visibility conditions
  console.log('[StoryCard -> Arrows Visible?]', {
    title,
    hasMultipleMedia,
    mediaCount: mediaItems.length,
  });
  console.log('[StoryCard -> Dots Visible?]', {
    title,
    hasMultipleMedia,
    currentIndex: currentMediaIndex,
  });

  // Debug: Log carousel conditions
  console.log('[StoryCard -> Carousel Conditions]', {
    title,
    mediaCount: mediaItems.length,
    hasMultipleMedia: mediaItems.length > 1,
  });

  return (
    <Link
      to={to}
      className={[
        'block bg-primary text-text-tertiary rounded-card shadow-card overflow-hidden',
        'border border-transparent hover:border-accent/15',
        'transition-all duration-200 ease-in-out hover:scale-[1.01]',
        'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-accent',
        'flex flex-col justify-between h-full min-h-card',
        className,
      ].filter(Boolean).join(' ')}
      aria-label={authorName ? `${title} by ${authorName}` : title}
    >
      {/* Media section with inner padding */}
      <div className="px-spacing-md pt-spacing-md">
        <div 
          className="w-full aspect-[16/9] rounded-md overflow-hidden bg-ui-muted relative transition-transform duration-300 ease-in-out"
          onTouchStart={handleTouchStart}
          onTouchMove={handleTouchMove}
          onTouchEnd={handleTouchEnd}
          onMouseDown={handleMouseDown}
          onMouseMove={handleMouseMove}
          onMouseUp={handleMouseUp}
          onMouseLeave={handleMouseUp}
          style={{ userSelect: isDragging ? 'none' : 'auto' }}
        >
          {hasMedia ? (
            <>
              {/* Render all media items with thumbnails for non-active videos */}
              {mediaItems.map((item, index) => (
                <div
                  key={index}
                  className={`absolute inset-0 transition-opacity duration-300 ${
                    index === currentMediaIndex ? 'opacity-100' : 'opacity-0'
                  }`}
                >
                  {renderMediaItem(item, index)}
                </div>
              ))}

              {/* Navigation arrows */}
              {hasMultipleMedia && (() => {
                console.log(`[StoryCard -> Rendering Arrows for] ${title}`);
                return (
                  <>
                    <button
                      onClick={(e) => {
                        e.preventDefault();
                        e.stopPropagation();
                        goToPrevious();
                      }}
                      className="absolute top-1/2 left-2 -translate-y-1/2 bg-black/40 text-white rounded-full p-2 hover:bg-black/70 transition"
                      aria-label="Previous media"
                    >
                      ←
                    </button>
                    <button
                      onClick={(e) => {
                        e.preventDefault();
                        e.stopPropagation();
                        goToNext();
                      }}
                      className="absolute top-1/2 right-2 -translate-y-1/2 bg-black/40 text-white rounded-full p-2 hover:bg-black/70 transition"
                      aria-label="Next media"
                    >
                      →
                    </button>
                  </>
                );
              })()}

              {/* Dots indicator */}
              {hasMultipleMedia && (() => {
                console.log(`[StoryCard -> Rendering Dots for] ${title}`);
                return (
                  <div className="absolute bottom-2 left-1/2 -translate-x-1/2 flex gap-1">
                    {mediaItems.map((_, index) => (
                      <button
                        key={index}
                        onClick={(e) => {
                          e.preventDefault();
                          e.stopPropagation();
                          goToMedia(index);
                        }}
                        className={`w-2 h-2 rounded-full transition ${
                          index === currentMediaIndex ? 'bg-white' : 'bg-white/40'
                        }`}
                        aria-label={`Go to media ${index + 1}`}
                      />
                    ))}
                  </div>
                );
              })()}
            </>
          ) : null}
        </div>
      </div>

      {/* Content section */}
      <div className="flex-grow flex flex-col justify-between px-spacing-md pt-spacing-md">
        {/* Title + Author (tight grouping) */}
        <div className="flex flex-col gap-spacing-2xs">
          <h3 className="font-serif text-subheading text-accent">{title}</h3>
          {authorName ? (
            <p className="font-mono text-caption text-text-tertiary/80">{`by ${authorName}`}</p>
          ) : null}
        </div>

        {/* Headline (single line) + More link (separate line) */}
        {headline ? (
          <div className="mt-spacing-md">
            <p className="font-mono text-caption text-text-tertiary/90 line-clamp-1">{headline}</p>
            <span className="inline-block mt-spacing-xs text-accent text-caption underline underline-offset-4 hover:brightness-110 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-accent">
              More
            </span>
          </div>
        ) : null}

        {/* Meta row */}
        <div className="mt-spacing-md flex items-center gap-spacing-lg text-caption font-mono text-accent mb-spacing-md">
          {showPlayCount ? (
            <span className="inline-flex items-center gap-spacing-xs" title="Play count">
              <span aria-hidden="true">👀</span>
              <span className="sr-only">Plays:</span>
              <span>{formatCount(stats!.totalPlayed as number)}</span>
            </span>
          ) : null}
          {showRating ? (
            <span className="inline-flex items-center gap-spacing-xs" title="Rating">
              <span aria-hidden="true">★</span>
              <span className="sr-only">Rating:</span>
              <span>{clampRating(stats!.avgRating as number).toFixed(1)}</span>
            </span>
          ) : null}
        </div>
      </div>

      {/* CTA section at bottom, full width */}
      <div className="mt-auto px-spacing-md pb-spacing-md">
        <C2AButton
          variant="primary"
          typography="caption"
          fullWidth
          onClick={() => {
            // Allow Link navigation; still surface optional callback
            onPlay?.();
          }}
        >
          Play Now
        </C2AButton>
      </div>
    </Link>
  );
}
