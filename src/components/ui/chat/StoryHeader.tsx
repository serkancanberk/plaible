import React from 'react';

export interface StoryHeaderProps {
  story: {
    title: string;
    slug?: string;
  };
  character?: {
    name: string;
    displayName: string;
  };
  toneStyle?: {
    id: string;
    label: string;
  };
  timeFlavor?: {
    id: string;
    label: string;
  };
  className?: string;
}

export const StoryHeader: React.FC<StoryHeaderProps> = ({
  story,
  character,
  toneStyle,
  timeFlavor,
  className = ''
}) => {
  // Guard against missing character data
  if (!character) {
    return (
      <div className={`flex flex-col gap-spacing-xs text-text-tertiary ${className}`}>
        <h1 className="text-heading text-text-primary">In the Scene</h1>
        <p className="text-label">Loading character...</p>
      </div>
    );
  }

  return (
    <div className={`flex flex-col gap-spacing-xs text-text-tertiary ${className}`}>
      <h1 className="text-heading text-text-primary">In the Scene</h1>
      <p className="text-label">
        Playing as <span className="text-accent font-medium">{character.displayName || character.name || 'Unknown Character'}</span>  
        in the <span className="text-text-primary">{toneStyle?.label || 'Unknown'}</span> theme  
        set in <span className="text-text-primary">{timeFlavor?.label || 'Unknown'}</span> time.
      </p>
    </div>
  );
};
