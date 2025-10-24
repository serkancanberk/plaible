import React from 'react';

export interface MessageBubbleProps {
  message: {
    id: string;
    role: 'system' | 'assistant' | 'user';
    content: string;
    choices?: string[];
    metadata?: {
      chapter?: number;
      beat?: number;
      tokenUsage?: {
        prompt: number;
        completion: number;
        total: number;
      };
      latency?: number;
    };
    createdAt?: Date;
  };
  onChoiceSelect?: (choice: string, index: number) => void;
  className?: string;
}

export const MessageBubble: React.FC<MessageBubbleProps> = ({
  message,
  onChoiceSelect,
  className = ''
}) => {
  const isUser = message.role === 'user';
  const isAssistant = message.role === 'assistant';
  const isSystem = message.role === 'system';

  const getBubbleClasses = () => {
    if (isUser) {
      return 'bg-accent text-text-primary';
    } else if (isAssistant) {
      return 'bg-ui-muted text-text-primary';
    } else {
      return 'bg-primary text-text-tertiary';
    }
  };

  const getAlignmentClasses = () => {
    if (isUser) {
      return 'justify-end';
    } else {
      return 'justify-start';
    }
  };

  return (
    <div className={`flex ${getAlignmentClasses()} ${className}`}>
      <div
        className={`max-w-[80%] rounded-card px-spacing-md py-spacing-sm ${getBubbleClasses()}`}
      >
        {/* Message Content */}
        <div className="text-body leading-relaxed">
          {message.content}
        </div>
        
        {/* Choices (only for assistant messages) */}
        {isAssistant && message.choices && message.choices.length > 0 && (
          <div className="mt-spacing-sm space-y-spacing-xs">
            {message.choices.map((choice, index) => (
              <div
                key={index}
                className="text-caption text-text-secondary cursor-pointer hover:text-text-primary transition-colors"
                onClick={() => onChoiceSelect?.(choice, index)}
              >
                {index + 1}. {choice}
              </div>
            ))}
          </div>
        )}
        
        {/* Metadata */}
        {message.metadata && (
          <div className="mt-spacing-xs text-caption text-text-tertiary">
            {message.metadata.chapter && `Chapter ${message.metadata.chapter}`}
            {message.metadata.beat && ` • Beat ${message.metadata.beat}`}
            {message.metadata.latency && ` • ${message.metadata.latency}ms`}
          </div>
        )}
        
        {/* Timestamp */}
        {message.createdAt && (
          <div className="mt-spacing-xs text-caption text-text-tertiary">
            {new Date(message.createdAt).toLocaleTimeString()}
          </div>
        )}
      </div>
    </div>
  );
};
