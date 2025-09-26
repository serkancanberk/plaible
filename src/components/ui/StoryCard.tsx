import React from 'react';
import { Link } from 'react-router-dom';
import C2AButton from '../C2AButton';

export type StoryCardProps = {
  title: string;
  author: string;
  slug: string; // for navigation
  description?: string;
  media?: Array<{ type: 'image' | 'video'; src: string; alt?: string }>; 
  playCount?: number;
  rating?: number; // 0–5
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
  author,
  slug,
  description,
  media,
  playCount,
  rating,
  onPlay,
  className,
}: StoryCardProps) {
  const hasMedia = Array.isArray(media) && media.length > 0;
  const [currentIndex, setCurrentIndex] = React.useState(0);
  const item = hasMedia ? media[Math.min(currentIndex, media.length - 1)] : undefined;

  const to = `/stories/${slug}`;

  const showPlayCount = typeof playCount === 'number';
  const showRating = typeof rating === 'number';

  const handlePrev = (e: React.MouseEvent) => {
    e.preventDefault();
    if (!hasMedia) return;
    setCurrentIndex((idx) => (idx - 1 + media!.length) % media!.length);
  };

  const handleNext = (e: React.MouseEvent) => {
    e.preventDefault();
    if (!hasMedia) return;
    setCurrentIndex((idx) => (idx + 1) % media!.length);
  };

  return (
    <Link
      to={to}
      className={[
        'block bg-primary text-text-tertiary rounded-card shadow-card overflow-hidden',
        'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-accent',
        'flex flex-col justify-between h-full',
        className,
      ].filter(Boolean).join(' ')}
      aria-label={`${title} by ${author}`}
    >
      {/* Media section with inner padding */}
      <div className="px-spacing-md pt-spacing-md">
        <div className="w-full aspect-[16/9] rounded-md overflow-hidden bg-ui-muted">
          {hasMedia ? (
            item?.type === 'video' ? (
              <video
                className="h-full w-full object-cover"
                src={item.src}
                muted
                playsInline
                controls={false}
                preload="metadata"
                aria-label={item.alt || title}
              />
            ) : (
              <img
                className="h-full w-full object-cover"
                src={item!.src}
                alt={item!.alt || title}
                loading="lazy"
              />
            )
          ) : null}
        </div>
      </div>

      {/* Content section */}
      <div className="flex-grow flex flex-col justify-between px-spacing-md pt-spacing-md">
        <div className="flex flex-col gap-spacing-2xs">
          <h3 className="font-serif text-heading text-accent">{title}</h3>
          <p className="font-mono text-caption text-text-tertiary/80">{`by ${author}`}</p>
        </div>
        {description ? (
          <div className="flex-grow flex items-center">
            <p className="font-sans text-caption text-text-tertiary/90 line-clamp-1">
              {description} <span className="text-accent">More</span>
            </p>
          </div>
        ) : null}

        {/* Meta row */}
        <div className="flex items-center gap-spacing-lg text-caption font-mono text-accent mb-spacing-md">
          {showPlayCount ? (
            <span className="inline-flex items-center gap-spacing-xs" title="Play count">
              <span aria-hidden="true">👀</span>
              <span className="sr-only">Plays:</span>
              <span>{formatCount(playCount!)}</span>
            </span>
          ) : null}
          {showRating ? (
            <span className="inline-flex items-center gap-spacing-xs" title="Rating">
              <span aria-hidden="true">★</span>
              <span className="sr-only">Rating:</span>
              <span>{clampRating(rating!).toFixed(1)}</span>
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
