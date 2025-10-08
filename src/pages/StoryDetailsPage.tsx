import React from 'react';
import { useParams } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import StoryHeader from '../components/StoryHeader';
import { CharacterCarousel } from '../components/ui/CharacterCarousel';
import { StoryHighlights } from '../components/ui/StoryHighlights';
import { StoryHowToPlay } from '../components/ui/StoryHowToPlay';
import { FeedbackCard, FeedbackData } from '../components/ui/FeedbackCard';
import { FeedbackSkeletonList } from '../components/ui/FeedbackSkeletonList';
import C2AButton from '../components/C2AButton';
import { useStoryBySlug } from '../hooks/useStoryBySlug';
import { useFeedbacksByStorySlug } from '../hooks/useFeedbacksByStorySlug';
import { useStoryStats } from '../hooks/useStoryStats';
import { useReducedMotion } from '../hooks/useReducedMotion';
import StoryFunFacts from '../components/ui/StoryFunFacts';
import { useRelatedStories } from '../hooks/useRelatedStories';
import StoryExplorerCarousel from '../components/ui/StoryExplorerCarousel';

export const StoryDetailsPage: React.FC = () => {
  const { slug } = useParams<{ slug: string }>();
  const [selectedStarsFilter, setSelectedStarsFilter] = React.useState<number | undefined>(undefined);
  const shouldReduceMotion = useReducedMotion();
  
  const { data: story, loading: storyLoading, error: storyError } = useStoryBySlug(slug);
  const {
    data: feedbacks,
    loading: feedbacksLoading,
    error: feedbacksError,
    hasMore,
    fetchFeedbacks
  } = useFeedbacksByStorySlug(slug, selectedStarsFilter);
  const { stats, loading: statsLoading, error: statsError } = useStoryStats(slug);
  const { stories: relatedStories, loading: relatedLoading, error: relatedError } = useRelatedStories(slug);

  // Animation variants
  const pageVariants = shouldReduceMotion ? undefined : {
    initial: { opacity: 0, y: 20 },
    animate: { opacity: 1, y: 0 }
  };

  const pageTransition = shouldReduceMotion ? undefined : { 
    duration: 0.5, 
    ease: [0.22, 1, 0.36, 1] as const 
  };

  const headerVariants = shouldReduceMotion ? undefined : {
    hidden: { opacity: 0, y: 10 },
    visible: { 
      opacity: 1, 
      y: 0, 
      transition: { delayChildren: 0.1, staggerChildren: 0.15 } 
    }
  };

  const filterButtonVariants = shouldReduceMotion ? undefined : {
    whileTap: { scale: 0.95 },
    whileHover: { scale: 1.05 }
  };

  const filterButtonTransition = shouldReduceMotion ? undefined : { 
    duration: 0.15, 
    ease: "easeInOut" as const 
  };


  // Function to handle loading more feedbacks with scroll harmony
  const handleLoadMore = React.useCallback(async () => {
    const previousCount = feedbacks.length;
    await fetchFeedbacks();
    
    // Scroll to new content after a short delay
    setTimeout(() => {
      if (feedbacks.length > previousCount) {
        window.scrollBy({ top: 120, behavior: "smooth" });
      }
    }, 300);
  }, [fetchFeedbacks, feedbacks.length]);

  if (storyLoading) return <p className="text-body text-text-tertiary">Loading story...</p>;
  if (storyError) return <p className="text-body text-text-tertiary">Error loading story.</p>;
  if (!story) return <p className="text-body text-text-tertiary">Story not found.</p>;

  return (
    <motion.div 
      className="flex flex-col space-y-12 overflow-y-auto no-scrollbar"
      variants={pageVariants}
      initial="initial"
      animate="animate"
      transition={pageTransition}
    >
      <motion.div 
        className="mx-auto w-full md:max-w-3xl lg:max-w-5xl px-4 py-8"
        variants={headerVariants}
        initial="hidden"
        animate="visible"
      >
        <StoryHeader />

        <CharacterCarousel
          characters={(story.characters || []) as any}
          onPlay={(id) => console.log('Play as character:', id)}
        />

        <StoryHighlights
          summary={story.summary}
          hooks={story.hooks}
          publishedYear={story.publishedYear}
        />

        <StoryHowToPlay />

        {/* WantToPlay Section */}
        <section className="mt-spacing-xl">
          <div className="mt-spacing-lg pb-spacing-md pt-spacing-lg">
            <h2>
              <span className="font-sans text-heading text-text-tertiary">Want to </span>
              <span className="font-mono text-heading text-accent">play?</span>
            </h2>
          </div>

          <div className="mt-spacing-lg pb-spacing-md">
            <h3 className="font-sans text-body text-accent">Your turn to take the story forward.</h3>
            <p className="font-sans text-body text-text-tertiary mt-2 border-b border-primary pb-spacing-sm">
              Heroes, villains, dreamers, rebels. Who will you become this time?
            </p>
          </div>

          <div className="mt-spacing-lg pb-spacing-md">
            <CharacterCarousel
              characters={(story.characters || []) as any}
              onPlay={(id) => console.log('Play as character:', id)}
            />
          </div>
        </section>

      {/* WhatPeopleAreSaying Section */}
      <section className="mt-spacing-xl">
        <div className="mt-spacing-lg pb-spacing-md pt-spacing-lg">
          <h2>
            <span className="font-sans text-heading text-text-tertiary">What people are </span>
            <span className="font-mono text-heading text-accent">saying?</span>
          </h2>
        </div>

        <div className="mt-spacing-lg pb-spacing-md">
          <h3 className="font-sans text-body text-accent">Journeys Lived, Voices Shared</h3>
          <p className="font-sans text-body text-text-tertiary mt-2">
            Each story is a new experience in every player's hands. Read their reflections and imagine how yours might unfold.
          </p>
        </div>

        {/* Statistics and Rating Filter - Horizontal Layout */}
        <div className="flex flex-wrap items-center md:items-center justify-between w-full mt-6 mb-4 gap-x-3 gap-y-3 sm:gap-x-6 sm:gap-y-4">
          {/* Left: Statistics (icon + label pairs, wraps naturally) */}
          <div className="flex flex-wrap items-center gap-x-4 gap-y-2">
            <div className="font-mono text-label text-text-tertiary flex items-center gap-2">
              <span aria-hidden>👥</span>
              <span>{statsLoading ? "…" : `${stats?.totalPlays ?? 0} playing`}</span>
            </div>
            <div className="font-mono text-label text-text-tertiary flex items-center gap-2">
              <span aria-hidden>💬</span>
              <span>{statsLoading ? "…" : `${stats?.totalReviews ?? 0} reviews`}</span>
            </div>
            <div className="font-mono text-label text-text-tertiary flex items-center gap-2">
              <span className="text-accent font-sans text-body" aria-hidden>★</span>
              <span>{statsLoading ? "…" : `${stats?.averageRating?.toFixed(1) ?? 0.0}`}</span>
            </div>
          </div>
          
          {/* Right: Rating Filter */}
          <div className="flex items-center gap-2 flex-wrap justify-center sm:justify-end font-mono text-label text-text-tertiary">
            <span className="text-text-tertiary font-mono text-label select-none">Filter by:</span>
            {[null, 5, 4, 3, 2, 1].map((stars) => (
              <motion.button
                key={stars ?? "all"}
                onClick={() => setSelectedStarsFilter(stars ?? undefined)}
                className={`px-4 py-2 transition-all font-sans text-caption ${
                  selectedStarsFilter === stars 
                    ? "text-accent" 
                    : "text-text-tertiary hover:text-accent"
                }`}
                variants={filterButtonVariants}
                whileTap="whileTap"
                whileHover="whileHover"
                transition={filterButtonTransition}
                animate={selectedStarsFilter === stars ? { scale: 1.05 } : { scale: 1 }}
              >
                {stars ? `${stars}★` : "All"}
              </motion.button>
            ))}
          </div>
        </div>

        <div className="mt-spacing-xl space-y-spacing-md">
          <AnimatePresence mode="wait">
            {feedbacksLoading && feedbacks.length === 0 ? (
              <motion.div
                key="skeleton"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.3 }}
              >
                <FeedbackSkeletonList count={3} />
              </motion.div>
            ) : feedbacksError ? (
              <motion.div 
                key="error"
                className="rounded-card bg-primary/5 text-accent text-lg text-center py-16"
                initial={{ opacity: 0, x: -4 }}
                animate={{ x: [0, -4, 4, 0] }}
                transition={{ duration: 0.3 }}
              >
                <p className="text-body text-text-tertiary">Failed to load feedbacks.</p>
              </motion.div>
            ) : feedbacks.length === 0 ? (
              <motion.div 
                key="empty"
                className="rounded-card bg-primary/5 text-accent text-lg text-center py-16"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
              >
                <p className="text-body text-text-tertiary">
                  {selectedStarsFilter ? `No ${selectedStarsFilter}-star feedbacks yet.` : "No feedbacks yet. Be the first to share your journey."}
                </p>
              </motion.div>
            ) : (
              <motion.div key="feedbacks">
                <div className="flex flex-col space-y-6">
                  <AnimatePresence>
                    {feedbacks.map((feedback, index) => (
                      <motion.div
                        key={feedback.id}
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0 }}
                        transition={{ 
                          duration: 0.4, 
                          delay: index * 0.1,
                          ease: [0.22, 1, 0.36, 1]
                        }}
                      >
                        <FeedbackCard data={feedback} variant="fullWidth" />
                      </motion.div>
                    ))}
                  </AnimatePresence>
                </div>
                
                {/* Load More Button */}
                {hasMore && (
                  <motion.div 
                    className="text-center mt-8"
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.3 }}
                  >
                    <C2AButton
                      variant="ghost"
                      typography="label"
                      onClick={handleLoadMore}
                      loading={feedbacksLoading}
                      loadingText="Loading..."
                    >
                      Load more
                    </C2AButton>
                  </motion.div>
                )}
                
                {/* Loading indicator for additional pages */}
                {feedbacksLoading && feedbacks.length > 0 && (
                  <motion.div 
                    className="text-center mt-4"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ duration: 0.3 }}
                  >
                    <div className="inline-flex items-center gap-2 text-text-tertiary">
                      <motion.div 
                        className="w-4 h-4 border-2 border-accent border-t-transparent rounded-full"
                        animate={{ rotate: 360 }}
                        transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                      />
                      <span className="font-sans text-caption">Loading more...</span>
                    </div>
                  </motion.div>
                )}
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </section>

        {/* ReadyToPlay Section */}
        <section className="mt-spacing-xl">
          <div className="mt-spacing-lg pb-spacing-md pt-spacing-lg">
            <h2>
              <span className="font-sans text-heading text-text-tertiary">So, ready to </span>
              <span className="font-mono text-heading text-accent">play?</span>
            </h2>
          </div>

          <div className="mt-spacing-lg pb-spacing-md">
            <h3 className="font-sans text-body text-accent">Your turn to take the story forward.</h3>
            <p className="font-sans text-body text-text-tertiary mt-2 border-b border-primary pb-spacing-sm">
              Heroes, villains, dreamers, rebels. Who will you become this time?
            </p>
          </div>

          <div className="mt-spacing-lg pb-spacing-md">
            <CharacterCarousel
              characters={(story.characters || []) as any}
              onPlay={(id) => console.log('Play as character:', id)}
            />
          </div>
        </section>

        {story && <StoryFunFacts funFacts={story.funFacts} />}

        {/* ReadyToPlay Section (Final Variant) */}
        <section className="mt-spacing-xl">
          <div className="mt-spacing-lg pb-spacing-md pt-spacing-lg">
            <h2>
              <span className="font-sans text-heading text-text-tertiary">Will you take the </span>
              <span className="font-mono text-heading text-accent">story forward?</span>
            </h2>
          </div>

          <div className="mt-spacing-lg pb-spacing-md">
            <h3 className="font-sans text-body text-accent">
              Every tale waits for someone to continue it.
            </h3>
            <p className="font-sans text-body text-text-tertiary mt-2 border-b border-primary pb-spacing-sm">
              Step in, choose your role, and see how far one choice can change everything.
            </p>
          </div>

          <div className="mt-spacing-lg pb-spacing-md">
            <CharacterCarousel
              characters={(story.characters || []) as any}
              onPlay={(id) => console.log('Play as character:', id)}
            />
          </div>
        </section>

        {/* Explore More Section */}
        {relatedStories?.length ? (
          <section className="mt-spacing-xl">
            <div className="mt-spacing-lg pb-spacing-md pt-spacing-lg">
              <h2>
                <span className="font-sans text-heading text-text-tertiary">Want to </span>
                <span className="font-mono text-heading text-accent">explore more?</span>
              </h2>
            </div>

            <div className="mt-spacing-lg pb-spacing-md">
              <h3 className="font-sans text-body text-accent">
                More tales to spark your imagination.
              </h3>
              <p className="font-sans text-body text-text-tertiary mt-2 border-b border-primary pb-spacing-sm">
                The story does not end here. Explore more worlds where your decisions bring every page to life.
              </p>
            </div>

            <div className="mt-spacing-lg pb-spacing-md">
              <StoryExplorerCarousel stories={relatedStories} />
            </div>
          </section>
        ) : relatedLoading ? (
          <section className="mt-spacing-xl">
            <div className="mt-spacing-lg pb-spacing-md pt-spacing-lg">
              <h2>
                <span className="font-sans text-heading text-text-tertiary">Want to </span>
                <span className="font-mono text-heading text-accent">explore more?</span>
              </h2>
            </div>
            <div className="mt-spacing-lg pb-spacing-md">
              <p className="font-sans text-body text-text-tertiary">Loading related stories...</p>
            </div>
          </section>
        ) : null}
      </motion.div>
    </motion.div>
  );
};
