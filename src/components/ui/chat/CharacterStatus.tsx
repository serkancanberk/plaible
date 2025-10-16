import React from 'react';

export interface CharacterStatusProps {
  alignment?: string;
  relationshipHint?: string;
  progress?: string;
  className?: string;
}

export const CharacterStatus: React.FC<CharacterStatusProps> = ({
  alignment = 'Neutral',
  relationshipHint = 'Building trust',
  progress = 'Chapter 1 of 6',
  className = ''
}) => {
  return (
    <div className={`rounded-card bg-ui-muted p-spacing-md text-text-secondary text-caption ${className}`}>
      <div className="flex flex-col gap-spacing-xs">
        <p>🎭 Alignment: {alignment}</p>
        <p>🤝 Relationships: {relationshipHint}</p>
        <p>⏳ Progress: {progress}</p>
      </div>
    </div>
  );
};
