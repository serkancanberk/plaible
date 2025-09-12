// src/admin/components/storyEdit/HooksTagInput.tsx
import React, { useState, useRef, KeyboardEvent } from 'react';

interface HooksTagInputProps {
  value: string[];
  onChange: (hooks: string[]) => void;
  placeholder?: string;
  className?: string;
}

export const HooksTagInput: React.FC<HooksTagInputProps> = ({
  value,
  onChange,
  placeholder = "Type a hook and press Enter or comma...",
  className = ""
}) => {
  const [inputValue, setInputValue] = useState('');
  const inputRef = useRef<HTMLInputElement>(null);

  const addHook = (hook: string) => {
    const trimmedHook = hook.trim();
    if (trimmedHook && !value.includes(trimmedHook)) {
      onChange([...value, trimmedHook]);
    }
  };

  const removeHook = (index: number) => {
    const newHooks = value.filter((_, i) => i !== index);
    onChange(newHooks);
  };

  const handleKeyDown = (e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' || e.key === ',') {
      e.preventDefault();
      if (inputValue.trim()) {
        addHook(inputValue);
        setInputValue('');
      }
    } else if (e.key === 'Backspace' && !inputValue && value.length > 0) {
      // Remove last hook if input is empty and backspace is pressed
      removeHook(value.length - 1);
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newValue = e.target.value;
    
    // Check if user typed a comma
    if (newValue.includes(',')) {
      const parts = newValue.split(',');
      const hookToAdd = parts[0].trim();
      if (hookToAdd) {
        addHook(hookToAdd);
      }
      setInputValue(parts.slice(1).join(',').trim());
    } else {
      setInputValue(newValue);
    }
  };

  const handleBlur = () => {
    // Add hook when input loses focus if there's text
    if (inputValue.trim()) {
      addHook(inputValue);
      setInputValue('');
    }
  };

  return (
    <div className={`relative ${className}`}>
      {/* Tags Container */}
      <div className="min-h-[2.5rem] p-2 border border-gray-300 rounded-md focus-within:ring-2 focus-within:ring-blue-500 focus-within:border-blue-500 bg-white">
        <div className="flex flex-wrap gap-2 items-center">
          {/* Existing Tags */}
          {value.map((hook, index) => (
            <span
              key={index}
              className="inline-flex items-start gap-1 px-3 py-1 bg-blue-100 text-blue-800 text-sm rounded-full border border-blue-200"
            >
              <span className="whitespace-normal break-words" title={hook}>
                {hook}
              </span>
              <button
                type="button"
                onClick={() => removeHook(index)}
                className="ml-1 mt-0.5 flex-shrink-0 text-blue-600 hover:text-blue-800 hover:bg-blue-200 rounded-full p-0.5 transition-colors duration-150"
                title="Remove hook"
              >
                <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </span>
          ))}
          
          {/* Input Field */}
          <input
            ref={inputRef}
            type="text"
            value={inputValue}
            onChange={handleInputChange}
            onKeyDown={handleKeyDown}
            onBlur={handleBlur}
            placeholder={value.length === 0 ? placeholder : ""}
            className="flex-1 min-w-[120px] px-2 py-1 text-sm border-none outline-none bg-transparent placeholder-gray-400"
          />
        </div>
      </div>
      
      {/* Helper Text */}
      <p className="text-xs text-gray-500 mt-1">
        Press Enter or comma to add hooks. Click × to remove.
      </p>
    </div>
  );
};
