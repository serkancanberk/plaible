import React from 'react';

export interface DropdownTriggerProps {
  isOpen: boolean;
  selectedOption?: { id: string; label: string; description?: string };
  placeholder: string;
  disabled: boolean;
  variant: 'default' | 'onAccent' | 'onAccentWithDescription' | 'onAccentCompact' | 'compact' | 'withDescription';
  onClick: () => void;
  onKeyDown: (event: React.KeyboardEvent) => void;
  ariaLabel: string;
}

export const DropdownTrigger: React.FC<DropdownTriggerProps> = ({
  isOpen,
  selectedOption,
  placeholder,
  disabled,
  variant,
  onClick,
  onKeyDown,
  ariaLabel
}) => {
  const getBaseClasses = () => {
    const baseClasses = [
      'w-full rounded-card text-left transition-colors duration-200',
      'disabled:opacity-50 disabled:cursor-not-allowed',
      'flex items-center justify-between'
    ];

    // Add border and focus ring classes based on variant
    if (variant === 'default' || variant === 'compact' || variant === 'withDescription') {
      baseClasses.push('focus:ring-1 focus:ring-accent focus:ring-offset-1');
    } else if (variant === 'onAccent' || variant === 'onAccentWithDescription' || variant === 'onAccentCompact') {
      baseClasses.push('border border-primary', 'focus:ring-2 focus:ring-primary focus:ring-offset-2');
    } else {
      baseClasses.push('border', 'focus:ring-2 focus:ring-offset-2');
    }

    switch (variant) {
      case 'compact':
        return [...baseClasses, 'px-spacing-sm py-spacing-xs text-label'];
      case 'onAccentCompact':
        return [...baseClasses, 'px-spacing-sm py-spacing-xs text-label'];
      case 'withDescription':
        return [...baseClasses, 'px-spacing-md py-spacing-sm text-body'];
      case 'onAccentWithDescription':
        return [...baseClasses, 'px-spacing-md py-spacing-sm text-body'];
      default:
        return [...baseClasses, 'px-spacing-md py-spacing-sm text-body'];
    }
  };

  const getVariantClasses = () => {
    const baseVariantClasses = {
      default: [
        'bg-primary text-accent text-body',
        isOpen ? 'ring-1 ring-accent ring-offset-1' : ''
      ],
      onAccent: [
        'bg-accent text-primary text-body',
        'hover:bg-accent/90',
        isOpen ? 'ring-2 ring-primary ring-offset-2' : ''
      ],
      onAccentWithDescription: [
        'bg-accent text-primary text-body',
        'hover:bg-accent/90',
        isOpen ? 'ring-2 ring-primary ring-offset-2' : ''
      ],
      onAccentCompact: [
        'bg-accent text-primary text-label',
        'hover:bg-accent/90',
        isOpen ? 'ring-2 ring-primary ring-offset-2' : ''
      ],
      compact: [
        'bg-primary text-accent text-label',
        isOpen ? 'ring-1 ring-accent ring-offset-1' : ''
      ],
      withDescription: [
        'bg-primary text-accent text-body',
        isOpen ? 'ring-1 ring-accent ring-offset-1' : ''
      ]
    };

    return baseVariantClasses[variant];
  };

  const classes = [
    ...getBaseClasses(),
    ...getVariantClasses()
  ].filter(Boolean).join(' ');

  return (
    <button
      type="button"
      onClick={() => !disabled && onClick()}
      onKeyDown={onKeyDown}
      disabled={disabled}
      className={classes}
      aria-label={ariaLabel}
      aria-expanded={isOpen}
      aria-haspopup="listbox"
    >
      <div className="flex-1 min-w-0">
        {selectedOption ? (
          ((variant === 'withDescription' || variant === 'onAccentWithDescription') && selectedOption.description) ? (
            <div>
              <div className="font-medium truncate">{selectedOption.label}</div>
              <div className="text-caption text-text-secondary truncate mt-spacing-xs">
                {selectedOption.description}
              </div>
            </div>
          ) : (
            <div className="font-medium truncate">{selectedOption.label}</div>
          )
        ) : (
          <div className="text-text-secondary">{placeholder}</div>
        )}
      </div>
      <div className="ml-spacing-sm flex-shrink-0">
        <svg
          className={`w-4 h-4 transition-transform ${isOpen ? 'rotate-180' : ''} ${
            variant === 'default' || variant === 'compact' || variant === 'withDescription' ? 'text-accent' : 'text-primary'
          }`}
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
        </svg>
      </div>
    </button>
  );
};

