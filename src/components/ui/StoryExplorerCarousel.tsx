import React, { useRef, useState, useCallback } from 'react';
import StoryCard from './StoryCard';
import type { DBStoryListItem } from '../../types/story';

interface StoryExplorerCarouselProps {
  stories: DBStoryListItem[];
  onSelect?: (slug: string) => void;
}

export default function StoryExplorerCarousel({ stories, onSelect }: StoryExplorerCarouselProps) {
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

  // Don't render if no stories
  if (!stories?.length) {
    return null;
  }

  return (
    <div 
      className="relative"
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
    >
      {/* Desktop Arrow Buttons */}
      <div className="hidden sm:flex absolute left-0 top-1/2 -translate-y-1/2 -translate-x-4 z-10">
        <button
          onClick={scrollLeft}
          disabled={!canScrollLeft}
          className={`
            w-10 h-10 rounded-full
            flex items-center justify-center
            transition-all duration-200
            ${canScrollLeft 
              ? 'bg-white/90 text-text-primary hover:bg-white shadow-lg hover:shadow-xl' 
              : 'bg-white/50 text-text-tertiary cursor-not-allowed'
            }
            ${isHovered ? 'opacity-100' : 'opacity-0'}
          `}
          aria-label="Scroll to previous stories"
        >
          <svg
            className="w-5 h-5"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
        </button>
      </div>

      <div className="hidden sm:flex absolute right-0 top-1/2 -translate-y-1/2 translate-x-4 z-10">
        <button
          onClick={scrollRight}
          disabled={!canScrollRight}
          className={`
            w-10 h-10 rounded-full
            flex items-center justify-center
            transition-all duration-200
            ${canScrollRight 
              ? 'bg-white/90 text-text-primary hover:bg-white shadow-lg hover:shadow-xl' 
              : 'bg-white/50 text-text-tertiary cursor-not-allowed'
            }
            ${isHovered ? 'opacity-100' : 'opacity-0'}
          `}
          aria-label="Scroll to next stories"
        >
          <svg
            className="w-5 h-5"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
          </svg>
        </button>
      </div>

      {/* Scroll Container */}
      <div 
        ref={scrollerRef}
        className="overflow-x-auto no-scrollbar snap-x snap-mandatory scroll-smooth flex gap-spacing-xl px-spacing-md pb-spacing-md -mx-spacing-md touch-pan-x overscroll-x-contain"
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
            className="snap-start flex justify-center items-start w-full max-w-[300px] sm:max-w-[320px] lg:max-w-[350px]"
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
            flex items-center justify-center
            transition-all duration-200
            ${canScrollLeft 
              ? 'bg-white/90 text-text-primary hover:bg-white shadow-lg' 
              : 'bg-white/50 text-text-tertiary cursor-not-allowed'
            }
          `}
          aria-label="Scroll to previous stories"
        >
          <svg
            className="w-6 h-6"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
        </button>

        <button
          onClick={scrollRightMobile}
          disabled={!canScrollRight}
          className={`
            w-12 h-12 rounded-full
            flex items-center justify-center
            transition-all duration-200
            ${canScrollRight 
              ? 'bg-white/90 text-text-primary hover:bg-white shadow-lg' 
              : 'bg-white/50 text-text-tertiary cursor-not-allowed'
            }
          `}
          aria-label="Scroll to next stories"
        >
          <svg
            className="w-6 h-6"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
          </svg>
        </button>
      </div>
    </div>
  );
}
