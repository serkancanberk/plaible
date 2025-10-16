import React, { useState, useRef, useEffect } from 'react';
import C2AButton from '../../C2AButton';

interface ChatInputProps {
  onSendMessage: (message: string) => void;
  disabled?: boolean;
  placeholder?: string;
  className?: string;
}

export const ChatInput: React.FC<ChatInputProps> = ({
  onSendMessage,
  disabled = false,
  placeholder = 'Type your answer here',
  className = ''
}) => {
  const [message, setMessage] = useState('');
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // Auto-resize textarea based on content
  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
      textareaRef.current.style.height = `${textareaRef.current.scrollHeight}px`;
    }
  }, [message]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (message.trim() && !disabled) {
      onSendMessage(message.trim());
      setMessage('');
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSubmit(e);
    }
    // Shift+Enter allows new lines (default behavior)
  };

  const handleSend = () => {
    if (message.trim() && !disabled) {
      onSendMessage(message.trim());
      setMessage('');
    }
  };

  return (
    <div className={`bg-secondary border-t border-ui-muted px-spacing-md py-spacing-sm ${className}`}>
      <form onSubmit={handleSubmit} className="flex items-end space-x-spacing-sm">
        {/* Text Input */}
        <div className="flex-1">
          <textarea
            ref={textareaRef}
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder={placeholder}
            disabled={disabled}
            className={`
              w-full min-h-[44px] max-h-[120px] 
              bg-ui-muted text-text-primary 
              border border-ui-muted rounded-card 
              px-spacing-md py-spacing-sm
              text-body placeholder-text-tertiary
              resize-none overflow-hidden
              focus:outline-none focus:ring-2 focus:ring-accent focus:border-transparent
              disabled:opacity-50 disabled:cursor-not-allowed
              transition-colors
            `}
            rows={1}
          />
        </div>

        {/* Voice Mode Button */}
        <button
          type="button"
          disabled={disabled}
          className={`
            w-10 h-10 rounded-full bg-ui-muted text-text-secondary
            hover:bg-ui-muted/80 hover:text-text-primary
            disabled:opacity-50 disabled:cursor-not-allowed
            transition-colors flex items-center justify-center
          `}
          title="Use Voice Mode"
        >
          <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M7 4a3 3 0 016 0v4a3 3 0 11-6 0V4zm4 10.93A7.001 7.001 0 0017 8a1 1 0 10-2 0A5 5 0 015 8a1 1 0 00-2 0 7.001 7.001 0 006 6.93V17H6a1 1 0 100 2h8a1 1 0 100-2h-3v-2.07z" clipRule="evenodd" />
          </svg>
        </button>

        {/* Send Button */}
        <C2AButton
          type="submit"
          variant="primary"
          size="sm"
          disabled={disabled || !message.trim()}
          onClick={handleSend}
          className="w-10 h-10 p-0 flex items-center justify-center"
        >
          <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
            <path d="M10.894 2.553a1 1 0 00-1.788 0l-7 14a1 1 0 001.169 1.409l5-1.429A1 1 0 009 15.571V11a1 1 0 112 0v4.571a1 1 0 00.725.962l5 1.428a1 1 0 001.17-1.408l-7-14z" />
          </svg>
        </C2AButton>
      </form>

      {/* Action Links */}
      <div className="flex items-center justify-between mt-spacing-sm">
        <div className="flex items-center space-x-spacing-md">
          <button className="flex items-center space-x-spacing-xs text-caption text-text-tertiary hover:text-text-secondary transition-colors">
            <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
              <path d="M10 12a2 2 0 100-4 2 2 0 000 4z" />
              <path fillRule="evenodd" d="M.458 10C1.732 5.943 5.522 3 10 3s8.268 2.943 9.542 7c-1.274 4.057-5.064 7-9.542 7S1.732 14.057.458 10zM14 10a4 4 0 11-8 0 4 4 0 018 0z" clipRule="evenodd" />
            </svg>
            <span>View Story Mirror</span>
          </button>
          
          <button className="flex items-center space-x-spacing-xs text-caption text-text-tertiary hover:text-text-secondary transition-colors">
            <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M10 3a1 1 0 011 1v5h5a1 1 0 110 2h-5v5a1 1 0 11-2 0v-5H4a1 1 0 110-2h5V4a1 1 0 011-1z" clipRule="evenodd" />
            </svg>
            <span>Add Item</span>
          </button>
        </div>

        <div className="text-caption text-text-tertiary">
          <span>You may face with unexpected answers. Share your feedback please. </span>
          <button className="underline hover:text-text-secondary transition-colors">
            Learn more
          </button>
        </div>
      </div>
    </div>
  );
};
