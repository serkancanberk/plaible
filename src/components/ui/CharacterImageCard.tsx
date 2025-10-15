import React from 'react';

type CharacterImageCardProps = {
  id: string;
  name: string;
  assets?: { images?: string[] };
  className?: string;
};

const CharacterImageCard: React.FC<CharacterImageCardProps> = ({
  id,
  name,
  assets,
  className = ''
}) => {
  const imageUrl = assets?.images?.[0];
  
  // Debug logging
  console.log('[CharacterImageCard]', name, imageUrl);

  return (
    <div className={`w-full max-w-sm mx-auto ${className}`}>
      <div className="w-full aspect-[9/16] overflow-hidden rounded-card bg-ui-muted shadow-card">
        {imageUrl ? (
          <img
            src={imageUrl}
            alt={name}
            className="w-full h-full object-cover"
            loading="lazy"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center bg-ui-muted text-text-secondary">
            <span className="text-label">No image</span>
          </div>
        )}
      </div>
    </div>
  );
};

export default CharacterImageCard;
