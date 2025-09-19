import React, { useState } from 'react';

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
      <div className={`grid grid-cols-1 md:grid-cols-3 h-screen w-screen overflow-hidden ${className ?? ''}`}>
        {/* Left */}
        <aside className="h-full p-6 md:p-8 bg-red-100">
          {left ?? (
            <div className="flex flex-col h-full justify-between">
              {/* Top (Logo) */}
              <div>
                <h1 className="font-bold text-left">🌚 Plaible</h1>
              </div>

              {/* Center (Heading + Paragraph) */}
              <div className="flex-1 flex items-center">
                <div className="space-y-4">
                  <h2 className="text-3xl md:text-4xl font-bold leading-tight">Live your own epic stories.</h2>
                  <p className="text-sm md:text-base text-gray-600 leading-relaxed max-w-md">
                    Every word you type shapes and grows the story into a living world by your imagination and Plaible’s storyrunner AI.
                    Forge the tale only you can dream up.
                  </p>
                </div>
              </div>

              {/* Bottom (Nav links + Footer) */}
              <div className="space-y-4">
                <nav>
                  <ul className="space-y-2">
                    <li>
                      <button
                        type="button"
                        onClick={openStartModal}
                        className="text-left text-sm font-semibold text-gray-700 hover:text-black transition"
                      >
                        START TO PLAY NOW →
                      </button>
                    </li>
                    <li><a href="#" className="text-sm font-medium text-gray-700 hover:text-black transition">Get the app (Soon) →</a></li>
                    <li><a href="#" className="text-sm font-medium text-gray-700 hover:text-black transition">Pay as you go →</a></li>
                    <li><a href="#" className="text-sm font-medium text-gray-700 hover:text-black transition">Keep in touch →</a></li>
                    <li><a href="#" className="text-sm font-medium text-gray-700 hover:text-black transition">Check legal stuffs →</a></li>
                  </ul>
                </nav>
                <div className="pt-2">
                  <p className="text-xs text-gray-400">© Plaible.com 2025</p>
                </div>
              </div>
            </div>
          )}
        </aside>

        {/* Center (primary) */}
        <section className="h-full p-6 md:p-8 bg-green-100 flex items-center justify-center">
          {center ?? (
            <div className="w-[min(100%,400px)] p-2 shadow rounded-[24px] bg-white/30">
              <div className="aspect-[9/16] rounded-[20px] bg-gray-300" />
            </div>
          )}
        </section>

        {/* Right */}
        <aside className="h-full p-6 md:p-8 bg-blue-100 flex flex-col">
          {right ?? (
            <>
              {/* Tabs */}
              <div className="flex gap-4 text-sm font-semibold border-b border-gray-300">
                <button
                  type="button"
                  onClick={() => setActiveTab('playing')}
                  className={`${activeTab === 'playing' ? 'text-yellow-400 border-b-2 border-yellow-400' : 'text-gray-700 hover:text-black'} pb-2`}
                >
                  What People Are Playing
                </button>
                <button
                  type="button"
                  onClick={() => setActiveTab('saying')}
                  className={`${activeTab === 'saying' ? 'text-yellow-400 border-b-2 border-yellow-400' : 'text-gray-700 hover:text-black'} pb-2`}
                >
                  What People Are Saying
                </button>
              </div>

              {/* Cards Feed */}
              <div className="flex-1 overflow-y-auto max-h-screen pt-4 space-y-4">
                {activeTab === 'playing' ? (
                  <>
                    <div className="rounded-xl bg-gray-900 p-4 space-y-2">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full bg-gray-700" />
                        <div className="text-sm text-white"><span className="font-medium">Jennifer</span> is playing as <span className="font-medium">Dracula</span></div>
                      </div>
                      <p className="text-gray-300 text-sm">Short description about the playthrough, enticing the user to read more...</p>
                      <button className="text-yellow-400 text-sm font-semibold hover:underline">Drink in the night as Dracula →</button>
                    </div>

                    <div className="rounded-xl bg-gray-900 p-4 space-y-2">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full bg-gray-700" />
                        <div className="text-sm text-white"><span className="font-medium">Marco</span> is playing as <span className="font-medium">Elizabeth Bennet</span></div>
                      </div>
                      <p className="text-gray-300 text-sm">A brief highlight from Marco's choices and how the story evolved...</p>
                      <button className="text-yellow-400 text-sm font-semibold hover:underline">Navigate society with wit as Elizabeth →</button>
                    </div>

                    <div className="rounded-xl bg-gray-900 p-4 space-y-2">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full bg-gray-700" />
                        <div className="text-sm text-white"><span className="font-medium">Aisha</span> is playing as <span className="font-medium">Sherlock Holmes</span></div>
                      </div>
                      <p className="text-gray-300 text-sm">A thrilling deduction sequence that led to an unexpected twist...</p>
                      <button className="text-yellow-400 text-sm font-semibold hover:underline">Deduce the truth as Sherlock →</button>
                    </div>
                  </>
                ) : (
                  <>
                    <div className="rounded-xl bg-gray-900 p-4 space-y-2">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full bg-gray-700" />
                        <div className="text-sm text-white">Ayşe Korkmaz from Istanbul,</div>
                      </div>
                      <div className="text-yellow-400 text-sm font-semibold">played last as Queen Arlena</div>
                      <div className="text-yellow-400 text-sm">★★★★★ (5) – 2 weeks ago</div>
                      <p className="text-sm text-gray-300">An unforgettable experience. The branching felt meaningful and I truly cared about the consequences. Will definitely play again!</p>
                      <button className="text-sm text-yellow-400 font-semibold hover:underline">Read more →</button>
                    </div>

                    <div className="rounded-xl bg-gray-900 p-4 space-y-2">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full bg-gray-700" />
                        <div className="text-sm text-white">Liam O'Connor from Dublin,</div>
                      </div>
                      <div className="text-yellow-400 text-sm font-semibold">played last as The Count of Monte Cristo</div>
                      <div className="text-yellow-400 text-sm">★★★★☆ (4) – 3 weeks ago</div>
                      <p className="text-sm text-gray-300">Loved the writing and the moral choices. A few tougher decisions really stuck with me afterwards—great storytelling.</p>
                      <button className="text-sm text-yellow-400 font-semibold hover:underline">Read more →</button>
                    </div>

                    <div className="rounded-xl bg-gray-900 p-4 space-y-2">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full bg-gray-700" />
                        <div className="text-sm text-white">Sofia Almeida from Lisbon,</div>
                      </div>
                      <div className="text-yellow-400 text-sm font-semibold">played last as Jane Eyre</div>
                      <div className="text-yellow-400 text-sm">★★★★★ (5) – 1 month ago</div>
                      <p className="text-sm text-gray-300">Beautifully paced and surprisingly emotional. The AI felt attentive to my previous choices throughout the whole run.</p>
                      <button className="text-sm text-yellow-400 font-semibold hover:underline">Read more →</button>
                    </div>
                  </>
                )}
              </div>
              {/* Footer */}
              <div className="text-xs text-gray-400 mt-6 text-center">🟡 404,852 stories played by 1000+ people.</div>
            </>
          )}
        </aside>
      </div>

      {/* Start To Play Modal */}
      {isStartModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
          <div className="w-full max-w-sm rounded-lg bg-white p-6 shadow-lg">
            <div className="mb-4 flex items-center justify-between">
              <h3 className="text-lg font-semibold">Start To Play</h3>
              <button
                aria-label="Close"
                onClick={closeStartModal}
                className="rounded px-2 py-1 text-gray-500 hover:bg-gray-100"
              >
                ×
              </button>
            </div>
            <div className="flex items-center justify-center">
              <button
                type="button"
                onClick={continueWithGoogle}
                className="inline-flex items-center justify-center gap-2 rounded-md border border-gray-300 bg-white px-4 py-2 text-sm font-medium hover:bg-gray-50"
              >
                Continue with Google
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};


