import React, { useRef, useState } from 'react';
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
  const [isDragging, setDragging] = useState(false);
  const startX = useRef(0);
  const startLeft = useRef(0);
  const moved = useRef(false);
  const DRAG_THRESHOLD = 5;

  const onPointerDown: React.PointerEventHandler<HTMLDivElement> = (e) => {
    const el = scrollerRef.current; if (!el) return;
    el.setPointerCapture?.(e.pointerId);
    setDragging(true);
    moved.current = false;
    startX.current = e.clientX;
    startLeft.current = el.scrollLeft;
  };

  const onPointerMove: React.PointerEventHandler<HTMLDivElement> = (e) => {
    if (!isDragging) return;
    const el = scrollerRef.current; if (!el) return;
    const dx = e.clientX - startX.current;
    if (Math.abs(dx) > DRAG_THRESHOLD) moved.current = true;
    e.preventDefault();
    el.scrollLeft = startLeft.current - dx;
  };

  const endDrag: React.PointerEventHandler<HTMLDivElement> = (e) => {
    const el = scrollerRef.current; if (!el) return;
    el.releasePointerCapture?.(e.pointerId);
    setDragging(false);
  };

  if (!characters?.length) return null;

  return (
    <div className="px-spacing-lg sm:px-spacing-xl">
      <div 
        ref={scrollerRef}
        className={`overflow-x-auto no-scrollbar snap-x snap-mandatory flex gap-spacing-md px-spacing-md pb-spacing-md -mx-spacing-md touch-pan-x overscroll-x-contain select-none mt-spacing-lg ${isDragging ? 'cursor-grabbing' : 'cursor-grab'}`}
        style={{ 
          WebkitOverflowScrolling: 'touch', 
          scrollbarWidth: 'none', 
          msOverflowStyle: 'none' 
        }}
        onPointerDown={onPointerDown}
        onPointerMove={onPointerMove}
        onPointerUp={endDrag}
        onPointerLeave={endDrag}
        onPointerCancel={endDrag}
      >
      {characters.map((character) => (
        <div key={character.id} className="snap-start min-w-[280px] sm:min-w-[320px] lg:min-w-[360px]">
          <div style={{ pointerEvents: isDragging ? 'none' : 'auto' }}>
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
        </div>
      ))}
      </div>
    </div>
  );
};

export default CharacterCarousel;
