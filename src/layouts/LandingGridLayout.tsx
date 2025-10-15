import React, { useCallback, useEffect, useState } from 'react';
import PlaibleLogo from '../components/PlaibleLogo';
import LandingLeftColumn from '../components/LandingLeftColumn';
import MenuItem from '../components/MenuItem';
import StartToPlayNowModal from '../components/ui/modals/StartToPlayNowModal';
import GetTheAppModal from '../components/ui/modals/GetTheAppModal';
import KeepInTouchModal from '../components/ui/modals/KeepInTouchModal';
import CheckLegalStuffModal from '../components/ui/modals/CheckLegalStuffModal';
import { MobileHeader } from '../components/ui/MobileHeader';
import { FeedbackCard, FeedbackData } from '../components/ui/FeedbackCard';

type LandingGridLayoutProps = {
  left?: React.ReactNode;
  center?: React.ReactNode;
  right?: React.ReactNode;
  className?: string;
};

// Responsive landing layout: 1-col (mobile), 2-col (tablet), 3-col (desktop)
// Ordering prioritizes center content on small screens
export const LandingGridLayout: React.FC<LandingGridLayoutProps> = ({
  left,
  center,
  right,
  className,
}) => {
  const [isStartModalOpen, setIsStartModalOpen] = useState(false);
  const [activeTab, setActiveTab] = useState<'playing' | 'saying'>('playing');
  const [openGetApp, setOpenGetApp] = useState(false);
  const [openKeep, setOpenKeep] = useState(false);
  const [openLegal, setOpenLegal] = useState(false);

  // Mock feedback data - will be replaced with real data later
  const mockFeedbacks: FeedbackData[] = [
    {
      id: "1",
      username: "Ayşe Korkmaz",
      city: "Istanbul",
      character: "Queen Arlena",
      rating: 5,
      weeksAgo: 2,
      text: "An unforgettable experience. The branching felt meaningful and I truly cared about the consequences. Will definitely play again!",
      characterImageUrl: "https://randomuser.me/api/portraits/women/12.jpg"
    },
    {
      id: "2",
      username: "Liam O'Connor",
      city: "Dublin",
      character: "The Count of Monte Cristo",
      rating: 4,
      weeksAgo: 3,
      text: "Loved the writing and the moral choices. A few tougher decisions really stuck with me afterwards—great storytelling.",
      characterImageUrl: "https://randomuser.me/api/portraits/men/54.jpg"
    },
    {
      id: "3",
      username: "Sofia Almeida",
      city: "Lisbon",
      character: "Jane Eyre",
      rating: 5,
      weeksAgo: 4,
      text: "Beautifully paced and surprisingly emotional. The AI felt attentive to my previous choices throughout the whole run.",
      characterImageUrl: "https://randomuser.me/api/portraits/women/36.jpg"
    }
  ];

  const openStartModal = () => setIsStartModalOpen(true);
  const closeStartModal = () => setIsStartModalOpen(false);
  const continueWithGoogle = () => {
    try {
      const redirectUrl = `${window.location.origin}/play`;
      window.location.href = `/api/auth/google?redirect=${encodeURIComponent(redirectUrl)}`;
    } catch {
      window.location.href = '/api/auth/google';
    }
  };

  return (
    <>
      {/* Mobile top nav */}
      <div className="md:hidden sticky top-0 z-30 backdrop-blur">
        <MobileHeader
          items={[
            { 
              label: 'START TO PLAY NOW',
              onClick: () => setIsStartModalOpen(true)
            },
            { 
              label: 'Get the app (Soon)',
              onClick: () => setOpenGetApp(true)
            },
            { 
              label: 'Keep in touch',
              onClick: () => setOpenKeep(true)
            },
            { 
              label: 'Check legal stuffs',
              onClick: () => setOpenLegal(true)
            },
          ]}
          logoVariant="light"
          bgClassName="bg-primary"
        />
      </div>

      <div className={`grid grid-cols-1 md:grid-cols-[1fr_0.9fr_1.2fr] gap-spacing-md md:gap-0 min-h-screen w-full overflow-x-hidden overflow-y-auto md:overflow-y-visible font-sans bg-secondary text-text-primary ${className ?? ''}`}>
        {/* Left */}
        {left ?? <LandingLeftColumn openStartModal={openStartModal} />}

        {/* Center (primary) */}
        <section className="md:h-screen bg-secondary flex items-center justify-center md:items-start md:justify-start p-spacing-xl md:px-spacing-2xl md:pt-spacing-3xl md:pb-spacing-2xl">
          {center ?? (
            <div className="w-full p-spacing-sm rounded-card bg-secondary/60 md:h-full md:flex md:flex-col">
              <div className="aspect-[9/16] w-full max-w-xs mx-auto my-spacing-md rounded-card overflow-hidden md:mx-0 md:h-full md:max-h-[calc(100vh_-_theme(space.spacing-3xl)*2)] md:w-auto md:max-w-none">
                <img
                  src="https://images.unsplash.com/photo-1544005313-94ddf0286df2?auto=format&fit=crop&w=540&q=80"
                  alt="Story preview"
                  loading="lazy"
                  className="w-full h-full object-cover"
                />
              </div>
            </div>
          )}
        </section>

        {/* Right */}
        <aside className="md:h-screen bg-secondary flex flex-col p-spacing-xl md:px-spacing-2xl md:pt-spacing-3xl md:pb-spacing-2xl">
          {right ?? (
            <>
              {/* Tabs */}
              <div className="flex gap-spacing-md text-label font-sans border-b border-text-secondary/30">
                <button
                  type="button"
                  onClick={() => setActiveTab('playing')}
                  className={`${activeTab === 'playing' ? 'text-accent border-b-2 border-accent' : 'text-text-secondary hover:text-text-primary'} pb-2`}
                >
                  What People Are Playing
                </button>
                <button
                  type="button"
                  onClick={() => setActiveTab('saying')}
                  className={`${activeTab === 'saying' ? 'text-accent border-b-2 border-accent' : 'text-text-secondary hover:text-text-primary'} pb-2`}
                >
                  What People Are Saying
                </button>
              </div>

              {/* Cards Feed */}
              <div className="md:flex-1 md:overflow-y-auto md:max-h-screen pt-spacing-md space-y-spacing-md">
                {activeTab === 'playing' ? (
                  <>
                    <div className="rounded-card bg-secondary p-card space-y-2">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full bg-primary" />
                        <div className="text-label text-text-tertiary"><span className="font-medium">Jennifer</span> is playing as <span className="text-accent font-medium">Dracula</span></div>
                      </div>
                      <p className="text-text-primary text-body">Short description about the playthrough, enticing the user to read more...</p>
                      <button className="text-accent text-body font-semibold hover:underline">Drink in the night as Dracula →</button>
                    </div>

                    <div className="rounded-card bg-secondary p-card space-y-2">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full bg-primary" />
                        <div className="text-label text-text-tertiary"><span className="font-medium">Marco</span> is playing as <span className="text-accent font-medium">Elizabeth Bennet</span></div>
                      </div>
                      <p className="text-text-primary text-body">A brief highlight from Marco's choices and how the story evolved...</p>
                      <button className="text-accent text-body font-semibold hover:underline">Navigate society with wit as Elizabeth →</button>
                    </div>

                    <div className="rounded-card bg-secondary p-card space-y-2">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full bg-primary" />
                        <div className="text-label text-text-tertiary"><span className="font-medium">Aisha</span> is playing as <span className="text-accent font-medium">Sherlock Holmes</span></div>
                      </div>
                      <p className="text-text-primary text-body">A thrilling deduction sequence that led to an unexpected twist...</p>
                      <button className="text-accent text-body font-semibold hover:underline">Deduce the truth as Sherlock →</button>
                    </div>
                  </>
                ) : (
                  <>
                    {mockFeedbacks.map((feedback) => (
                      <FeedbackCard key={feedback.id} data={feedback} />
                    ))}
                  </>
                )}
              </div>
              {/* Footer */}
              <div className="text-caption text-text-tertiary pt-spacing-md text-center">🟡 404,852 stories played by 1000+ people.</div>
            </>
          )}
        </aside>
      </div>

      <StartToPlayNowModal open={isStartModalOpen} onClose={() => setIsStartModalOpen(false)} />
      <GetTheAppModal open={openGetApp} onClose={() => setOpenGetApp(false)} />
      <KeepInTouchModal open={openKeep} onClose={() => setOpenKeep(false)} />
      <CheckLegalStuffModal open={openLegal} onClose={() => setOpenLegal(false)} />
    </>
  );
};
