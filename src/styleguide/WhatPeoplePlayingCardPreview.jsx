import React from 'react';
import WhatPeoplePlayingCard from '../components/WhatPeoplePlayingCard';

export default function WhatPeoplePlayingCardPreview() {
  const demos = [
    {
      username: 'Username',
      characterName: 'Character',
      characterImageUrl: 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?q=80&w=256&auto=format&fit=crop',
      storyDescription: 'Short description about the story and the playing character of…',
      ctaText: 'Play as Character now →',
      ctaHref: '#',
    },
    {
      username: 'Leah',
      characterName: 'The Archivist',
      characterImageUrl: 'https://images.unsplash.com/photo-1502685104226-ee32379fefbe?q=80&w=256&auto=format&fit=crop',
      storyDescription: 'Unravel forbidden records beneath the old city and decide what to reveal.',
      ctaText: 'Play as The Archivist →',
      ctaHref: '#',
    },
    {
      username: 'Hakan',
      characterName: 'Navigator',
      characterImageUrl: 'https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?q=80&w=256&auto=format&fit=crop',
      storyDescription: 'Chart a storm-ridden archipelago where each island remembers your lies.',
      ctaText: 'Take the Helm →',
      ctaHref: '#',
    },
  ];

  return (
    <div className="flex flex-col gap-[32px]">
      {demos.map((props, idx) => (
        <WhatPeoplePlayingCard key={idx} {...props} />
      ))}
    </div>
  );
}

