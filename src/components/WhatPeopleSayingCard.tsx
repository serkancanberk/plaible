import React from 'react';
import TextLink from './ui/TextLink';
import StartToPlayNowModal from './ui/modals/StartToPlayNowModal';

type WhatPeopleSayingCardProps = {
  username: string;
  city?: string;
  characterName: string;
  characterImageUrl?: string;
  rating?: number; // 0-5
  weeksAgo?: number;
  testimonial: string;
  ctaHref: string;
};

export default function WhatPeopleSayingCard({
  username,
  city,
  characterName,
  characterImageUrl,
  rating = 5,
  weeksAgo = 2,
  testimonial,
  ctaHref,
}: WhatPeopleSayingCardProps) {
  const [imgError, setImgError] = React.useState(false);
  const [isModalOpen, setIsModalOpen] = React.useState(false);
  const showFallback = imgError || !characterImageUrl;

  const safeRating = Math.max(0, Math.min(5, Math.round(rating)));
  const stars = '★'.repeat(safeRating) + '☆'.repeat(5 - safeRating);
  const timeLabel = `${weeksAgo} week${weeksAgo === 1 ? '' : 's'} ago`;

  return (
    <>
      <article className="bg-primary rounded-[24px] p-[24px] w-full max-w-sm sm:max-w-md lg:max-w-lg text-text-tertiary">
        <div className="flex flex-col gap-[16px]">
        {/* Row 1: Profile Section */}
        <div className="flex flex-row items-start gap-[16px]">
          {showFallback ? (
            <div className="w-[60px] h-[60px] rounded-[12px] bg-secondary/40 flex items-center justify-center text-text-tertiary/70 text-body select-none">
              <span role="img" aria-label="avatar">🧑</span>
            </div>
          ) : (
            <img
              src={characterImageUrl}
              alt={characterName}
              width={60}
              height={60}
              className="w-[60px] h-[60px] rounded-[12px] object-cover"
              loading="lazy"
              onError={() => setImgError(true)}
            />
          )}
          <div className="flex-1 min-w-0 flex flex-col justify-center gap-[2px]">
            <p className="font-mono text-caption truncate">
              <span className="truncate" title={username}>{username}</span>
              <span>{' '}played as{' '}</span>
            </p>
            <p>
              <span className="font-serif text-subheading text-accent whitespace-nowrap">{characterName}</span>
            </p>
          </div>
        </div>

        {/* Info Row: rating / count / time */}
        <div className="text-caption text-text-tertiary/90 flex items-center flex-wrap gap-[8px]">
          <span className="text-accent" aria-hidden="true">{stars}</span>
          <span>({safeRating})</span>
          {city ? <span>• {city}</span> : null}
          <span>– {timeLabel}</span>
        </div>

        {/* Row 2: Description */}
        <p className="font-mono text-caption text-text-tertiary/90 line-clamp-2 leading-[1.6]">{testimonial}</p>

        {/* Row 3: CTA */}
        <TextLink
          href={ctaHref}
          aria-label={`Play as ${characterName} now`}
          onClick={(e) => {
            e.preventDefault();
            setIsModalOpen(true);
          }}
        >
          {`Read more →`}
        </TextLink>
        </div>
      </article>
      <StartToPlayNowModal open={isModalOpen} onClose={() => setIsModalOpen(false)} />
    </>
  );
}


