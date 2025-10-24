import React, { useRef, useState, useCallback, useEffect } from 'react';
import StoryCard from './StoryCard';
import type { DBStoryListItem } from '../../types/story';

// Constants for consistent sizing (matching CharacterCarousel)
const CARD_W = 300;       // px
const GAP = 32;           // px -> matches gap-spacing-xl
const STEP = CARD_W + GAP; // 332px

interface StoryExplorerCarouselProps {
  stories: DBStoryListItem[];
  onSelect?: (slug: string) => void;
}

export default function StoryExplorerCarousel({ stories, onSelect }: StoryExplorerCarouselProps) {
  const scrollerRef = useRef<HTMLDivElement>(null);
  const [isHovered, setIsHovered] = useState(false);
  const [canScrollLeft, setCanScrollLeft] = useState(false);
  const [canScrollRight, setCanScrollRight] = useState(true);
  const [vpWidth, setVpWidth] = useState<number>(964); // 3*300 + 2*32

  // Responsive viewport width calculation (matching CharacterCarousel)
  useEffect(() => {
    const compute = () => {
      const w = window.innerWidth;
      if (w < 640)      setVpWidth(300);         // 1 card
      else if (w < 1024) setVpWidth(632);        // 2*300 + 32
      else               setVpWidth(964);        // 3*300 + 2*32
    };
    compute();
    window.addEventListener('resize', compute);
    return () => window.removeEventListener('resize', compute);
  }, []);

  // Check scroll position and update button states
  const updateScrollButtons = useCallback(() => {
    const el = scrollerRef.current;
    if (!el) return;

    const { scrollLeft, scrollWidth, clientWidth } = el;
    setCanScrollLeft(scrollLeft > 0);
    setCanScrollRight(scrollLeft < scrollWidth - clientWidth - 1);
  }, []);

  // Card-by-card navigation scroll functions (matching CharacterCarousel)
  const scrollBy = (delta: number) => {
    if (!scrollerRef.current) return;
    scrollerRef.current.scrollBy({ left: delta, behavior: 'smooth' });
  };
  
  const scrollLeft = useCallback(() => scrollBy(-STEP), []);
  const scrollRight = useCallback(() => scrollBy(STEP), []);

  // Mobile scroll functions (same as desktop for consistency)
  const scrollLeftMobile = useCallback(() => scrollBy(-STEP), []);
  const scrollRightMobile = useCallback(() => scrollBy(STEP), []);

  // Handle scroll events to update button states
  const handleScroll = useCallback(() => {
    updateScrollButtons();
  }, [updateScrollButtons]);

  // Handle hover state changes
  const handleMouseEnter = useCallback(() => {
    setIsHovered(true);
    updateScrollButtons();
  }, [updateScrollButtons]);

  const handleMouseLeave = useCallback(() => {
    setIsHovered(false);
  }, []);

  // Don't render if no stories
  if (!stories?.length) {
    return null;
  }

  return (
    <div 
      className="relative w-full"
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
    >
      {/* Left Arrow Button */}
      <button
        onClick={scrollLeft}
        disabled={!canScrollLeft}
        className={`
          absolute left-0 top-1/2 -translate-y-1/2 z-10
          w-12 h-12 rounded-full
          bg-secondary backdrop-blur-sm
          border border-white/10
          flex items-center justify-center
          transition-all duration-300 ease-out
          hover:scale-105
          shadow-[0_0_15px_rgba(247,255,0,0.25)]
          hover:shadow-[0_0_20px_rgba(247,255,0,0.4)]
          disabled:opacity-0 disabled:pointer-events-none
          ${isHovered ? 'opacity-100 translate-x-2' : 'opacity-0 -translate-x-2'}
          sm:block hidden
        `}
        aria-label="Scroll to beginning"
      >
        <div className="flex items-center justify-center w-full h-full">
          <svg 
            width="20" 
            height="20" 
            viewBox="0 0 24 24" 
            fill="none" 
            className="text-white"
          >
            <path 
              d="M15 18L9 12L15 6" 
              stroke="currentColor" 
              strokeWidth="2" 
              strokeLinecap="round" 
              strokeLinejoin="round"
            />
          </svg>
        </div>
      </button>

      {/* Right Arrow Button */}
      <button
        onClick={scrollRight}
        disabled={!canScrollRight}
        className={`
          absolute right-0 top-1/2 -translate-y-1/2 z-10
          w-12 h-12 rounded-full
          bg-secondary backdrop-blur-sm
          border border-white/10
          flex items-center justify-center
          transition-all duration-300 ease-out
          hover:scale-105
          shadow-[0_0_15px_rgba(247,255,0,0.25)]
          hover:shadow-[0_0_20px_rgba(247,255,0,0.4)]
          disabled:opacity-0 disabled:pointer-events-none
          ${isHovered ? 'opacity-100 -translate-x-2' : 'opacity-0 translate-x-2'}
          sm:block hidden
        `}
        aria-label="Scroll to end"
      >
        <div className="flex items-center justify-center w-full h-full">
          <svg 
            width="20" 
            height="20" 
            viewBox="0 0 24 24" 
            fill="none" 
            className="text-white"
          >
            <path 
              d="M9 18L15 12L9 6" 
              stroke="currentColor" 
              strokeWidth="2" 
              strokeLinecap="round" 
              strokeLinejoin="round"
            />
          </svg>
        </div>
      </button>

      {/* Scrollable row */}
      <div
        ref={scrollerRef}
        className="flex gap-spacing-xl overflow-x-auto no-scrollbar snap-x snap-mandatory scroll-smooth justify-start"
        style={{ 
          WebkitOverflowScrolling: 'touch', 
          scrollbarWidth: 'none', 
          msOverflowStyle: 'none'
        }}
        onScroll={handleScroll}
      >
        {stories.map((story) => (
          <div 
            key={story.slug || story._id} 
            className="snap-start flex-shrink-0 w-[300px]"
          >
            <StoryCard
              title={story.title}
              authorName={story.authorName}
              slug={story.slug}
              headline={story.headline}
              assets={story.assets}
              stats={story.stats}
              onPlay={() => onSelect?.(story.slug)}
              className="w-full"
            />
          </div>
        ))}
      </div>

      {/* Mobile Arrow Buttons */}
      <div className="flex justify-center gap-6 mt-4 sm:hidden">
        <button
          onClick={scrollLeftMobile}
          disabled={!canScrollLeft}
          className={`
            w-12 h-12 rounded-full
            bg-secondary backdrop-blur-sm
            border border-white/10
            flex items-center justify-center
            transition-all duration-300 ease-out
            hover:scale-105
            shadow-[0_0_15px_rgba(247,255,0,0.25)]
            hover:shadow-[0_0_20px_rgba(247,255,0,0.4)]
            disabled:opacity-0 disabled:pointer-events-none
          `}
          aria-label="Scroll left one card"
        >
          <div className="flex items-center justify-center w-full h-full">
            <svg 
              width="20" 
              height="20" 
              viewBox="0 0 24 24" 
              fill="none" 
              className="text-white"
            >
              <path 
                d="M15 18L9 12L15 6" 
                stroke="currentColor" 
                strokeWidth="2" 
                strokeLinecap="round" 
                strokeLinejoin="round"
              />
            </svg>
          </div>
        </button>

        <button
          onClick={scrollRightMobile}
          disabled={!canScrollRight}
          className={`
            w-12 h-12 rounded-full
            bg-secondary backdrop-blur-sm
            border border-white/10
            flex items-center justify-center
            transition-all duration-300 ease-out
            hover:scale-105
            shadow-[0_0_15px_rgba(247,255,0,0.25)]
            hover:shadow-[0_0_20px_rgba(247,255,0,0.4)]
            disabled:opacity-0 disabled:pointer-events-none
          `}
          aria-label="Scroll right one card"
        >
          <div className="flex items-center justify-center w-full h-full">
            <svg 
              width="20" 
              height="20" 
              viewBox="0 0 24 24" 
              fill="none" 
              className="text-white"
            >
              <path 
                d="M9 18L15 12L9 6" 
                stroke="currentColor" 
                strokeWidth="2" 
                strokeLinecap="round" 
                strokeLinejoin="round"
              />
            </svg>
          </div>
        </button>
      </div>
    </div>
  );
}
