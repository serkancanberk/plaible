import React from 'react';
import WhatPeopleSayingCard from '../components/WhatPeopleSayingCard';

export default function WhatPeopleSayingCardPreview() {
  const demos = [
    {
      username: 'Leah',
      city: 'Berlin',
      characterName: 'The Archivist',
      characterImageUrl: 'https://images.unsplash.com/photo-1502685104226-ee32379fefbe?q=80&w=256&auto=format&fit=crop',
      rating: 5,
      weeksAgo: 3,
      testimonial: 'Unraveling forbidden records was hauntingly beautiful.',
      ctaHref: '#',
    },
    {
      username: 'Hakan',
      city: 'Istanbul',
      characterName: 'Navigator',
      characterImageUrl: 'https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?q=80&w=256&auto=format&fit=crop',
      rating: 4,
      weeksAgo: 1,
      testimonial: 'A gripping voyage with choices that actually mattered.',
      ctaHref: '#',
    },
    {
      username: 'Mira',
      city: 'Lisbon',
      characterName: 'The Night Courier',
      characterImageUrl: 'https://images.unsplash.com/photo-1517841905240-472988babdf9?q=80&w=256&auto=format&fit=crop',
      rating: 5,
      weeksAgo: 6,
      testimonial: 'Tense, moody, and unforgettable. Loved every minute.',
      ctaHref: '#',
    },
  ];

  return (
    <div className="flex flex-col gap-[32px]">
      {demos.map((props, idx) => (
        <WhatPeopleSayingCard key={idx} {...props} />
      ))}
    </div>
  );
}


