import React from 'react';
import TextLink from './ui/TextLink';
import StartToPlayNowModal from './ui/StartToPlayNowModal';

type WhatPeoplePlayingCardProps = {
  username: string;
  characterName: string;
  characterImageUrl: string;
  storyDescription: string;
  ctaText: string;
  ctaHref: string;
};

export default function WhatPeoplePlayingCard({
  username,
  characterName,
  characterImageUrl,
  storyDescription,
  ctaText,
  ctaHref,
}: WhatPeoplePlayingCardProps) {
  const [imgError, setImgError] = React.useState(false);
  const [isModalOpen, setIsModalOpen] = React.useState(false);
  const showFallback = imgError || !characterImageUrl;
  return (
    <>
      <article className="bg-primary rounded-[24px] p-[24px] w-full max-w-sm sm:max-w-md lg:max-w-lg text-text-tertiary">
        <div className="flex flex-col gap-[16px]">
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
                <span>{' '}playing as{' '}</span>
              </p>
              <p>
                <span className="font-serif text-subheading text-accent whitespace-nowrap">{characterName}</span>
              </p>
            </div>
          </div>

          <p className="font-mono text-caption text-text-tertiary/90 line-clamp-2 leading-[1.6]">{storyDescription}</p>

          <TextLink
            href={ctaHref}
            aria-label={`Play as ${characterName} now`}
            onClick={(e) => {
              e.preventDefault();
              setIsModalOpen(true);
            }}
          >
            {ctaText || `Play as ${characterName} now →`}
          </TextLink>
        </div>
      </article>
      <StartToPlayNowModal open={isModalOpen} onClose={() => setIsModalOpen(false)} />
    </>
  );
}


