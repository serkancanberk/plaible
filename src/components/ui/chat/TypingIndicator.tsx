import React from 'react';

interface TypingIndicatorProps {
  isVisible?: boolean;
  className?: string;
}

export const TypingIndicator: React.FC<TypingIndicatorProps> = ({
  isVisible = true,
  className = ''
}) => {
  if (!isVisible) return null;

  return (
    <div className={`flex justify-start ${className}`}>
      <div className="bg-ui-muted text-text-primary rounded-card px-spacing-md py-spacing-sm">
        <div className="flex items-center space-x-spacing-xs">
          <span className="text-body">AI is typing</span>
          <div className="flex space-x-spacing-xs">
            <div 
              className="w-1 h-1 bg-text-accent rounded-full animate-pulse"
              style={{ animationDelay: '0ms' }}
            />
            <div 
              className="w-1 h-1 bg-text-accent rounded-full animate-pulse"
              style={{ animationDelay: '200ms' }}
            />
            <div 
              className="w-1 h-1 bg-text-accent rounded-full animate-pulse"
              style={{ animationDelay: '400ms' }}
            />
          </div>
        </div>
      </div>
    </div>
  );
};
