import React from 'react';
import { Link } from 'react-router-dom';
import C2AButton from '../C2AButton';
import type { DBStoryAssets, DBStoryStats } from '../../types/story';

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
  const firstImage = assets?.images?.[0];
  const hasMedia = Boolean(firstImage);

  const to = `/stories/${slug}`;

  const showPlayCount = typeof stats?.totalPlayed === 'number';
  const showRating = typeof stats?.avgRating === 'number';

  return (
    <Link
      to={to}
      className={[
        'block bg-primary text-text-tertiary rounded-card shadow-card overflow-hidden',
        'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-accent',
        'flex flex-col justify-between h-full min-h-card',
        className,
      ].filter(Boolean).join(' ')}
      aria-label={authorName ? `${title} by ${authorName}` : title}
    >
      {/* Media section with inner padding */}
      <div className="px-spacing-md pt-spacing-md">
        <div className="w-full aspect-[16/9] rounded-md overflow-hidden bg-ui-muted">
          {hasMedia ? (
            <img
              className="h-full w-full object-cover"
              src={firstImage as string}
              alt={title}
              loading="lazy"
            />
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
