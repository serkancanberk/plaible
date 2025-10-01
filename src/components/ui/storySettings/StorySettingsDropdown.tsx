import React, { useState, useRef, useEffect } from 'react';

export interface DropdownOption {
  id: string;
  displayLabel: string;
  description?: string;
}

export interface StorySettingsDropdownProps {
  label: string;
  options: DropdownOption[];
  selectedValue: string | null;
  onSelect: (value: string) => void;
  placeholder?: string;
  disabled?: boolean;
  ariaLabel: string;
}

export const StorySettingsDropdown: React.FC<StorySettingsDropdownProps> = ({
  label,
  options,
  selectedValue,
  onSelect,
  placeholder = "Select an option",
  disabled = false,
  ariaLabel
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const buttonRef = useRef<HTMLButtonElement>(null);

  const selectedOption = options.find(option => option.id === selectedValue);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleKeyDown = (event: React.KeyboardEvent) => {
    if (event.key === 'Escape') {
      setIsOpen(false);
      buttonRef.current?.focus();
    } else if (event.key === 'Enter' || event.key === ' ') {
      event.preventDefault();
      setIsOpen(!isOpen);
    } else if (event.key === 'ArrowDown') {
      event.preventDefault();
      if (!isOpen) {
        setIsOpen(true);
      }
    }
  };

  const handleOptionKeyDown = (event: React.KeyboardEvent, optionId: string) => {
    if (event.key === 'Enter' || event.key === ' ') {
      event.preventDefault();
      onSelect(optionId);
      setIsOpen(false);
      buttonRef.current?.focus();
    }
  };

  const handleOptionClick = (optionId: string) => {
    onSelect(optionId);
    setIsOpen(false);
    buttonRef.current?.focus();
  };

  return (
    <div className="space-y-spacing-sm">
      <label className="text-caption font-bold text-primary">
        {label}
      </label>
      <div className="relative" ref={dropdownRef}>
        <button
          ref={buttonRef}
          type="button"
          onClick={() => !disabled && setIsOpen(!isOpen)}
          onKeyDown={handleKeyDown}
          disabled={disabled}
          className={`
            w-full px-spacing-md py-spacing-sm rounded-card border border-primary/20
            bg-accent/10 text-left text-body text-primary
            hover:bg-accent/20 focus:ring-2 focus:ring-primary focus:ring-offset-2
            disabled:opacity-50 disabled:cursor-not-allowed
            ${isOpen ? 'ring-2 ring-primary ring-offset-2' : ''}
          `}
          aria-label={ariaLabel}
          aria-expanded={isOpen}
          aria-haspopup="listbox"
        >
          <div className="flex items-center justify-between">
            <div className="flex-1 min-w-0">
              {selectedOption ? (
                <div>
                  <div className="font-medium truncate">{selectedOption.displayLabel}</div>
                  {selectedOption.description && (
                    <div className="text-caption text-primary/70 truncate">
                      {selectedOption.description}
                    </div>
                  )}
                </div>
              ) : (
                <div className="text-primary/70">{placeholder}</div>
              )}
            </div>
            <div className="ml-spacing-sm flex-shrink-0">
              <svg
                className={`w-4 h-4 text-primary transition-transform ${isOpen ? 'rotate-180' : ''}`}
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
              </svg>
            </div>
          </div>
        </button>

        {isOpen && (
          <div className="absolute z-10 w-full mt-spacing-xs bg-accent border border-primary/20 rounded-card shadow-lg max-h-60 overflow-y-auto">
            <div role="listbox" aria-label={ariaLabel}>
              {options.map((option) => (
                <button
                  key={option.id}
                  type="button"
                  onClick={() => handleOptionClick(option.id)}
                  onKeyDown={(e) => handleOptionKeyDown(e, option.id)}
                  className={`
                    w-full px-spacing-md py-spacing-sm text-left text-body text-primary
                    hover:bg-primary/10 focus:bg-primary/10 focus:outline-none
                    ${selectedValue === option.id ? 'bg-primary/10 font-medium' : ''}
                  `}
                  role="option"
                  aria-selected={selectedValue === option.id}
                >
                  <div className="font-medium">{option.displayLabel}</div>
                  {option.description && (
                    <div className="text-caption text-primary/70 mt-spacing-xs">
                      {option.description}
                    </div>
                  )}
                </button>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
