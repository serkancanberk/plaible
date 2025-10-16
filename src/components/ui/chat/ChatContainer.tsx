import React, { useEffect, useRef } from 'react';

export interface Message {
  id: string;
  role: 'system' | 'assistant' | 'user';
  content: string;
  choices?: Array<{
    id: string;
    text: string;
  }> | string[];
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
}

interface ChatContainerProps {
  messages: Message[];
  isLoading?: boolean;
  onChoiceSelect?: (choice: string, index: number) => void;
  className?: string;
}

export const ChatContainer: React.FC<ChatContainerProps> = ({
  messages,
  isLoading = false,
  onChoiceSelect,
  className = ''
}) => {
  const scrollRef = useRef<HTMLDivElement>(null);

  // Auto-scroll to bottom when new messages arrive
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages, isLoading]);

  return (
    <div 
      className={`flex-1 overflow-y-auto bg-secondary px-spacing-md py-spacing-sm ${className}`}
      ref={scrollRef}
    >
      <div className="space-y-spacing-sm max-w-4xl mx-auto">
        {messages.length === 0 && !isLoading && (
          <div className="flex justify-center items-center h-32">
            <div className="text-center text-text-tertiary">
              <div className="text-body mb-spacing-xs">📖</div>
              <div className="text-label">No messages yet. Your story will begin soon.</div>
            </div>
          </div>
        )}
        
        {messages.map((message) => (
          <div
            key={message.id}
            className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}
          >
            <div
              className={`max-w-[80%] rounded-card px-spacing-md py-spacing-sm ${
                message.role === 'user'
                  ? 'bg-accent text-text-primary'
                  : 'bg-ui-muted text-text-primary'
              }`}
            >
              <div className="text-body leading-relaxed">
                {message.content}
              </div>
              
              {message.choices && message.choices.length > 0 && (
                <div className="mt-spacing-sm space-y-spacing-xs">
                  {message.choices.map((choice, index) => {
                    const choiceText = typeof choice === 'string' ? choice : choice.text;
                    const choiceId = typeof choice === 'string' ? `choice_${index}` : choice.id;
                    
                    return (
                      <div
                        key={choiceId}
                        className="text-caption text-text-secondary cursor-pointer hover:text-text-primary transition-colors"
                        onClick={() => onChoiceSelect?.(choiceText, index)}
                      >
                        {index + 1}. {choiceText}
                      </div>
                    );
                  })}
                </div>
              )}
              
              {message.metadata && (
                <div className="mt-spacing-xs text-caption text-text-tertiary">
                  {message.metadata.chapter && `Chapter ${message.metadata.chapter}`}
                  {message.metadata.beat && ` • Beat ${message.metadata.beat}`}
                  {message.metadata.latency && ` • ${message.metadata.latency}ms`}
                </div>
              )}
            </div>
          </div>
        ))}
        
        {isLoading && (
          <div className="flex justify-start">
            <div className="bg-ui-muted text-text-primary rounded-card px-spacing-md py-spacing-sm">
              <div className="flex items-center space-x-spacing-xs">
                <span className="text-body">AI is typing</span>
                <div className="flex space-x-spacing-xs">
                  <div className="w-1 h-1 bg-text-accent rounded-full animate-pulse"></div>
                  <div className="w-1 h-1 bg-text-accent rounded-full animate-pulse" style={{ animationDelay: '0.2s' }}></div>
                  <div className="w-1 h-1 bg-text-accent rounded-full animate-pulse" style={{ animationDelay: '0.4s' }}></div>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
