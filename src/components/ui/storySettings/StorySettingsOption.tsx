import React from 'react';

export interface StorySettingsOptionProps {
  id: string;
  displayLabel: string;
  description?: string;
  checked: boolean;
  onChange: (value: string) => void;
  name: string;
  disabled?: boolean;
}

export const StorySettingsOption: React.FC<StorySettingsOptionProps> = ({
  id,
  displayLabel,
  description,
  checked,
  onChange,
  name,
  disabled = false
}) => {
  return (
    <label
      className={`
        flex items-start space-x-spacing-sm p-spacing-md rounded-card 
        cursor-pointer transition-all duration-200
        ${checked 
          ? 'bg-primary/10 border-2 border-primary' 
          : 'bg-white border border-gray-200 hover:bg-gray-50'
        }
        ${disabled ? 'opacity-50 cursor-not-allowed' : 'hover:shadow-sm'}
        focus-within:ring-2 focus-within:ring-primary focus-within:ring-offset-2
      `}
    >
      <input
        type="radio"
        name={name}
        value={id}
        checked={checked}
        onChange={(e) => onChange(e.target.value)}
        disabled={disabled}
        className="mt-1 w-4 h-4 text-primary border-gray-300 focus:ring-primary focus:ring-2"
        aria-describedby={description ? `${id}-description` : undefined}
      />
      <div className="flex-1 min-w-0">
        <div className="text-body font-bold text-text-primary">
          {displayLabel}
        </div>
        {description && (
          <div 
            id={`${id}-description`}
            className="text-caption text-text-secondary mt-spacing-xs"
          >
            {description}
          </div>
        )}
      </div>
    </label>
  );
};
