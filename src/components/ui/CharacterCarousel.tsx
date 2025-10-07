import React, { useRef, useState, useCallback } from 'react';
import CharacterCard from './CharacterCard';

// Use the same Character type as defined in the StoryData interface
export interface Character {
  id: string;
  name: string;
  summary: string;
  hooks: string[];
  assets: {
    images: string[];
    videos: string[];
  };
  roles?: string[];
}

interface CharacterCarouselProps {
  characters: Character[];
  onPlay: (characterId: string) => void;
}

export const CharacterCarousel: React.FC<CharacterCarouselProps> = ({ characters, onPlay }) => {
  const scrollerRef = useRef<HTMLDivElement>(null);
  const [isHovered, setIsHovered] = useState(false);
  const [canScrollLeft, setCanScrollLeft] = useState(false);
  const [canScrollRight, setCanScrollRight] = useState(true);

  // Check scroll position and update button states
  const updateScrollButtons = useCallback(() => {
    const el = scrollerRef.current;
    if (!el) return;

    const { scrollLeft, scrollWidth, clientWidth } = el;
    setCanScrollLeft(scrollLeft > 0);
    setCanScrollRight(scrollLeft < scrollWidth - clientWidth - 1);
  }, []);

  // Desktop full navigation scroll functions
  const scrollLeft = useCallback(() => {
    const el = scrollerRef.current;
    if (!el) return;

    el.scrollTo({
      left: 0,
      behavior: 'smooth'
    });
  }, []);

  const scrollRight = useCallback(() => {
    const el = scrollerRef.current;
    if (!el) return;

    el.scrollTo({
      left: el.scrollWidth,
      behavior: 'smooth'
    });
  }, []);

  // Mobile incremental scroll functions
  const scrollLeftMobile = useCallback(() => {
    const el = scrollerRef.current;
    if (!el) return;

    const cardWidth = Math.min(el.clientWidth * 0.8, 320); // Responsive card width, max 320px
    el.scrollBy({
      left: -cardWidth,
      behavior: 'smooth'
    });
  }, []);

  const scrollRightMobile = useCallback(() => {
    const el = scrollerRef.current;
    if (!el) return;

    const cardWidth = Math.min(el.clientWidth * 0.8, 320); // Responsive card width, max 320px
    el.scrollBy({
      left: cardWidth,
      behavior: 'smooth'
    });
  }, []);

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

  if (!characters?.length) return null;

  return (
    <div className="px-spacing-lg sm:px-spacing-xl">
      <div 
        className="relative"
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

        {/* Scroll Container */}
        <div 
          ref={scrollerRef}
          className="overflow-x-auto no-scrollbar snap-x snap-mandatory scroll-smooth flex gap-spacing-md px-spacing-md pb-spacing-md -mx-spacing-md touch-pan-x overscroll-x-contain mt-spacing-lg"
          style={{ 
            WebkitOverflowScrolling: 'touch', 
            scrollbarWidth: 'none', 
            msOverflowStyle: 'none'
          }}
          onScroll={handleScroll}
        >
          {characters.map((character) => (
            <div 
              key={character.id} 
              className="snap-start min-w-[280px] sm:min-w-[320px] lg:min-w-[360px]"
            >
              <CharacterCard
                id={character.id}
                name={character.name}
                role={character.roles?.join(' · ')}
                summary={character.summary}
                hooks={character.hooks}
                assets={character.assets}
                onPlay={onPlay}
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
    </div>
  );
};

export default CharacterCarousel;
