import React, { useState } from 'react';

interface Character {
  id: string;
  name: string;
  summary: string;
  hooks: string[];
  assets: {
    images: string[];
    videos: string[];
  };
  helloMessage?: string;
  onboardingText?: string;
}

interface CharacterAvatarProps {
  character: Character | undefined;
  className?: string;
}

export default function CharacterAvatar({ character, className }: CharacterAvatarProps) {
  const [imageError, setImageError] = useState(false);
  const [imageLoaded, setImageLoaded] = useState(false);
  
  const hasImage = character?.assets?.images?.[0] && !imageError;
  const characterName = character?.displayName || character?.name || 'Character';

  return (
    <div 
      className={`w-56 md:w-64 aspect-[4/5] rounded-card shadow-card p-spacing-xs bg-accent/50 flex items-center justify-center overflow-hidden ${className || ''}`}
      aria-label={`${characterName} avatar`}
    >
      {hasImage ? (
        <img
          src={character.assets.images[0]}
          alt={`${characterName} avatar`}
          loading="lazy"
          className={`w-full h-full object-cover rounded-[0.5rem] transition-opacity duration-300 ${
            imageLoaded ? 'opacity-100' : 'opacity-0'
          }`}
          onError={() => setImageError(true)}
          onLoad={() => setImageLoaded(true)}
        />
      ) : (
        <span 
          className="text-3xl select-none"
          role="img"
          aria-label="Character avatar fallback"
        >
          🧑
        </span>
      )}
    </div>
  );
}
