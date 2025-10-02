import React, { useState, useRef, useEffect } from 'react';
import { DropdownTrigger } from './DropdownTrigger';
import { DropdownOption, DropdownOption as DropdownOptionType } from './DropdownOption';

export interface DropdownProps {
  options: DropdownOptionType[];
  selectedId?: string;
  onSelect: (id: string) => void;
  placeholder?: string;
  disabled?: boolean;
  variant?: 'default' | 'onAccent' | 'onAccentWithDescription' | 'onAccentCompact' | 'compact' | 'withDescription';
  fullWidth?: boolean;
  className?: string;
  ariaLabel: string;
  closeOnSelect?: boolean;
}

export const Dropdown: React.FC<DropdownProps> = ({
  options,
  selectedId,
  onSelect,
  placeholder = "Select an option",
  disabled = false,
  variant = 'default',
  fullWidth = true,
  className,
  ariaLabel,
  closeOnSelect = true
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [focusedIndex, setFocusedIndex] = useState(-1);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const triggerRef = useRef<HTMLButtonElement>(null);

  const selectedOption = options.find(option => option.id === selectedId);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
        setFocusedIndex(-1);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Handle keyboard navigation
  const handleKeyDown = (event: React.KeyboardEvent) => {
    if (disabled) return;

    switch (event.key) {
      case 'Escape':
        setIsOpen(false);
        setFocusedIndex(-1);
        triggerRef.current?.focus();
        break;
      case 'Enter':
      case ' ':
        event.preventDefault();
        if (!isOpen) {
          setIsOpen(true);
          setFocusedIndex(0);
        } else if (focusedIndex >= 0 && focusedIndex < options.length) {
          const option = options[focusedIndex];
          if (!option.disabled) {
            onSelect(option.id);
            if (closeOnSelect) {
              setIsOpen(false);
              setFocusedIndex(-1);
              triggerRef.current?.focus();
            }
          }
        }
        break;
      case 'ArrowDown':
        event.preventDefault();
        if (!isOpen) {
          setIsOpen(true);
          setFocusedIndex(0);
        } else {
          setFocusedIndex(prev => {
            let next = prev + 1;
            while (next < options.length && options[next].disabled) {
              next++;
            }
            return next < options.length ? next : prev;
          });
        }
        break;
      case 'ArrowUp':
        event.preventDefault();
        if (isOpen) {
          setFocusedIndex(prev => {
            let next = prev - 1;
            while (next >= 0 && options[next].disabled) {
              next--;
            }
            return next >= 0 ? next : prev;
          });
        }
        break;
      case 'Home':
        event.preventDefault();
        if (isOpen) {
          setFocusedIndex(0);
        }
        break;
      case 'End':
        event.preventDefault();
        if (isOpen) {
          setFocusedIndex(options.length - 1);
        }
        break;
    }
  };

  const handleOptionKeyDown = (event: React.KeyboardEvent, optionId: string) => {
    if (event.key === 'Enter' || event.key === ' ') {
      event.preventDefault();
      const option = options.find(opt => opt.id === optionId);
      if (option && !option.disabled) {
        onSelect(optionId);
        if (closeOnSelect) {
          setIsOpen(false);
          setFocusedIndex(-1);
          triggerRef.current?.focus();
        }
      }
    }
  };

  const handleOptionClick = (optionId: string) => {
    const option = options.find(opt => opt.id === optionId);
    if (option && !option.disabled) {
      onSelect(optionId);
      if (closeOnSelect) {
        setIsOpen(false);
        setFocusedIndex(-1);
        triggerRef.current?.focus();
      }
    }
  };

  const handleTriggerClick = () => {
    if (!disabled) {
      setIsOpen(!isOpen);
      if (!isOpen) {
        setFocusedIndex(0);
      } else {
        setFocusedIndex(-1);
      }
    }
  };

  const containerClasses = [
    fullWidth ? 'w-full' : 'inline-block',
    'relative',
    className
  ].filter(Boolean).join(' ');

  const getDropdownClasses = () => {
    const baseClasses = [
      'absolute z-10 w-full mt-spacing-xs rounded-card overflow-y-auto scrollbar-hide'
    ];

    const variantClasses = {
      default: ['bg-primary text-accent text-body shadow-card', 'max-h-60'],
      onAccent: ['bg-accent text-primary text-body shadow-card', 'max-h-60'],
      onAccentWithDescription: ['bg-accent text-primary text-body shadow-card', 'max-h-60'],
      onAccentCompact: ['bg-accent text-primary text-label shadow-card', 'max-h-48'],
      compact: ['bg-primary text-accent text-label shadow-card', 'max-h-48'],
      withDescription: ['bg-primary text-accent text-body shadow-card', 'max-h-60']
    };

    return [...baseClasses, ...variantClasses[variant]].join(' ');
  };

  return (
    <div className={containerClasses} ref={dropdownRef}>
      <DropdownTrigger
        isOpen={isOpen}
        selectedOption={selectedOption}
        placeholder={placeholder}
        disabled={disabled}
        variant={variant}
        onClick={handleTriggerClick}
        onKeyDown={handleKeyDown}
        ariaLabel={ariaLabel}
      />
      
      {isOpen && (
        <div className={getDropdownClasses()}>
          <div role="listbox" aria-label={ariaLabel}>
            {options.map((option, index) => (
              <DropdownOption
                key={option.id}
                option={option}
                isSelected={selectedId === option.id}
                isFocused={focusedIndex === index}
                onClick={handleOptionClick}
                onKeyDown={handleOptionKeyDown}
                variant={variant}
              />
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

