import React, { useCallback, useEffect, useState } from 'react';
import PlaibleLogo from '../components/PlaibleLogo';
import LandingLeftColumn from '../components/LandingLeftColumn';
import MenuItem from '../components/MenuItem';
import StartToPlayNowModal from '../components/ui/StartToPlayNowModal';
import GetTheAppModal from '../components/ui/GetTheAppModal';
import KeepInTouchModal from '../components/ui/KeepInTouchModal';
import CheckLegalStuffModal from '../components/ui/CheckLegalStuffModal';

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
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [activeTab, setActiveTab] = useState<'playing' | 'saying'>('playing');
  const [openGetApp, setOpenGetApp] = useState(false);
  const [openKeep, setOpenKeep] = useState(false);
  const [openLegal, setOpenLegal] = useState(false);

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
      <header className="md:hidden sticky top-0 z-30 border-b bg-primary backdrop-blur">
        <div className="flex items-center justify-between px-spacing-md pt-spacing-md pb-spacing-md">
          <div className="text-subheading font-sans">
            <PlaibleLogo variant="light" size="sm" />
          </div>
          <button
            type="button"
            aria-label="Toggle menu"
            aria-expanded={isMobileMenuOpen}
            aria-controls="landing-mobile-menu"
            onClick={() => setIsMobileMenuOpen((v) => !v)}
            className="inline-flex items-center justify-center rounded-md p-spacing-xs hover:bg-primary/10 focus:outline-none focus:ring-2 focus:ring-primary/40"
          >
            <svg
              className={`h-6 w-6 text-text-tertiary transition-transform ${isMobileMenuOpen ? 'rotate-90' : ''}`}
              xmlns="http://www.w3.org/2000/svg"
              fill="none"
              viewBox="0 0 24 24"
              strokeWidth={1.5}
              stroke="currentColor"
            >
              {isMobileMenuOpen ? (
                <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
              ) : (
                <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 6.75h16.5M3.75 12h16.5m-16.5 5.25h16.5" />
              )}
            </svg>
          </button>
        </div>
        <div
          id="landing-mobile-menu"
          className={`md:hidden overflow-hidden transition-[max-height] duration-300 ${isMobileMenuOpen ? 'max-h-96' : 'max-h-0'}`}
        >
          <nav className="bg-primary">
            <ul className="mt-spacing-md space-y-spacing-xs px-spacing-md pb-spacing-md max-w-md mx-auto [&_a]:text-text-tertiary [&_button]:text-text-tertiary [&_a:hover]:text-accent [&_button:hover]:text-accent">
              <li>
                <MenuItem
                  label="START TO PLAY NOW"
                  onClick={() => {
                    setIsMobileMenuOpen(false);
                    setIsStartModalOpen(true);
                  }}
                />
              </li>
              <li>
                <MenuItem
                  label="Get the app (Soon)"
                  onClick={() => {
                    setIsMobileMenuOpen(false);
                    setOpenGetApp(true);
                  }}
                />
              </li>
              <li className="hidden">
                <MenuItem label="Pay as you go" href="#" />
              </li>
              <li>
                <MenuItem
                  label="Keep in touch"
                  onClick={() => {
                    setIsMobileMenuOpen(false);
                    setOpenKeep(true);
                  }}
                />
              </li>
              <li>
                <MenuItem
                  label="Check legal stuffs"
                  onClick={() => {
                    setIsMobileMenuOpen(false);
                    setOpenLegal(true);
                  }}
                />
              </li>
            </ul>
          </nav>
        </div>
      </header>

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
                    <div className="rounded-card bg-secondary p-card space-y-2">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full bg-primary" />
                        <div className="text-label text-text-tertiary">Ayşe Korkmaz from Istanbul,</div>
                      </div>
                      <div className="text-accent text-body font-semibold">played last as Queen Arlena</div>
                      <div className="text-accent text-body">★★★★★ (5) – 2 weeks ago</div>
                      <p className="text-body text-text-primary">An unforgettable experience. The branching felt meaningful and I truly cared about the consequences. Will definitely play again!</p>
                      <button className="text-body text-accent font-semibold hover:underline">Read more →</button>
                    </div>

                    <div className="rounded-card bg-secondary p-card space-y-2">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full bg-primary" />
                        <div className="text-label text-text-tertiary">Liam O'Connor from Dublin,</div>
                      </div>
                      <div className="text-accent text-body font-semibold">played last as The Count of Monte Cristo</div>
                      <div className="text-accent text-body">★★★★☆ (4) – 3 weeks ago</div>
                      <p className="text-body text-text-primary">Loved the writing and the moral choices. A few tougher decisions really stuck with me afterwards—great storytelling.</p>
                      <button className="text-body text-accent font-semibold hover:underline">Read more →</button>
                    </div>

                    <div className="rounded-card bg-secondary p-card space-y-2">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full bg-primary" />
                        <div className="text-label text-text-tertiary">Sofia Almeida from Lisbon,</div>
                      </div>
                      <div className="text-accent text-body font-semibold">played last as Jane Eyre</div>
                      <div className="text-accent text-body">★★★★★ (5) – 1 month ago</div>
                      <p className="text-body text-text-primary">Beautifully paced and surprisingly emotional. The AI felt attentive to my previous choices throughout the whole run.</p>
                      <button className="text-body text-accent font-semibold hover:underline">Read more →</button>
                    </div>
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
