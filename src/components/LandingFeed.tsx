import React, { useState } from 'react';
import WhatPeoplePlayingCard from './WhatPeoplePlayingCard.jsx';
import WhatPeopleSayingCard from './WhatPeopleSayingCard.jsx';

type TabKey = 'playing' | 'saying';

export const LandingFeed: React.FC = () => {
  const [activeTab, setActiveTab] = useState<TabKey>('playing');

  const playingData = [
    {
      username: 'Jennifer',
      characterName: 'Dracula',
      characterImageUrl: 'https://randomuser.me/api/portraits/women/65.jpg',
      storyDescription: 'Short description about the playthrough, enticing the user to read more...'
        + ' The path of night calls to those who dare.',
      ctaText: 'Drink in the night as Dracula →',
      ctaHref: '#',
    },
    {
      username: 'Marco',
      characterName: 'Elizabeth Bennet',
      characterImageUrl: 'https://randomuser.me/api/portraits/men/23.jpg',
      storyDescription: "A brief highlight from Marco's choices and how the story evolved...",
      ctaText: 'Navigate society with wit as Elizabeth →',
      ctaHref: '#',
    },
    {
      username: 'Aisha',
      characterName: 'Sherlock Holmes',
      characterImageUrl: 'https://randomuser.me/api/portraits/women/44.jpg',
      storyDescription: 'A thrilling deduction sequence that led to an unexpected twist...',
      ctaText: 'Deduce the truth as Sherlock →',
      ctaHref: '#',
    },
  ];

  const sayingData = [
    {
      username: 'Ayşe Korkmaz',
      city: 'Istanbul',
      characterName: 'Queen Arlena',
      characterImageUrl: 'https://randomuser.me/api/portraits/women/12.jpg',
      rating: 5,
      weeksAgo: 2,
      testimonial: 'An unforgettable experience. The branching felt meaningful and I truly cared about the consequences. Will definitely play again!',
      ctaHref: '#',
    },
    {
      username: "Liam O'Connor",
      city: 'Dublin',
      characterName: 'The Count of Monte Cristo',
      characterImageUrl: 'https://randomuser.me/api/portraits/men/54.jpg',
      rating: 4,
      weeksAgo: 3,
      testimonial: 'Loved the writing and the moral choices. A few tougher decisions really stuck with me afterwards—great storytelling.',
      ctaHref: '#',
    },
    {
      username: 'Sofia Almeida',
      city: 'Lisbon',
      characterName: 'Jane Eyre',
      characterImageUrl: 'https://randomuser.me/api/portraits/women/36.jpg',
      rating: 5,
      weeksAgo: 4,
      testimonial: 'Beautifully paced and surprisingly emotional. The AI felt attentive to my previous choices throughout the whole run.',
      ctaHref: '#',
    },
  ];

  const onSelectTab = (key: TabKey) => setActiveTab(key);

  return (
    <div className="flex flex-col min-h-0 h-full mx-auto w-full px-spacing-lg md:max-w-md lg:max-w-xl xl:max-w-2xl">
      {/* Tabs */}
      <div role="tablist" aria-label="Landing feed tabs" className="flex justify-center gap-0 font-sans border-b border-text-secondary/30">
        <button
          type="button"
          role="tab"
          aria-selected={activeTab === 'playing'}
          aria-controls="panel-playing"
          id="tab-playing"
          onClick={() => onSelectTab('playing')}
          className={`tab-base ${activeTab === 'playing' ? 'tab-active' : 'tab-inactive'} tab-focus font-mono basis-1/2 text-center py-spacing-sm`}
        >
          What People Are Playing
        </button>
        <button
          type="button"
          role="tab"
          aria-selected={activeTab === 'saying'}
          aria-controls="panel-saying"
          id="tab-saying"
          onClick={() => onSelectTab('saying')}
          className={`tab-base ${activeTab === 'saying' ? 'tab-active' : 'tab-inactive'} tab-focus font-mono basis-1/2 text-center py-spacing-sm`}
        >
          What People Are Saying
        </button>
      </div>

      {/* Panels (scrollable middle) */}
      <div className="flex-1 min-h-0 overflow-y-auto scrollbar-hide">
        <div className="mx-auto w-full px-spacing-md">
          <div className="pt-spacing-lg pb-spacing-2xl space-y-spacing-2xl">
            {activeTab === 'playing' ? (
              <div id="panel-playing" role="tabpanel" aria-labelledby="tab-playing" className="space-y-spacing-2xl">
                {playingData.map((item, idx) => (
                  <WhatPeoplePlayingCard key={`p-${idx}`} {...item} />
                ))}
              </div>
            ) : (
              <div id="panel-saying" role="tabpanel" aria-labelledby="tab-saying" className="space-y-spacing-2xl">
                {sayingData.map((item, idx) => (
                  <WhatPeopleSayingCard key={`s-${idx}`} {...item} />
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Fixed bottom info row */}
      <div className="border-t border-accent px-spacing-md py-spacing-sm">
        <div className="mx-auto w-full max-w-3xl text-center font-mono text-label text-text-tertiary">
          🌕 404852 stories played by 1000+ people.
        </div>
      </div>
    </div>
  );
};

export default LandingFeed;


