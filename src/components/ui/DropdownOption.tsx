import React from 'react';

export interface DropdownOption {
  id: string;
  label: string;
  description?: string;
  disabled?: boolean;
  icon?: React.ReactNode;
}

export interface DropdownOptionProps {
  option: DropdownOption;
  isSelected: boolean;
  isFocused: boolean;
  onClick: (id: string) => void;
  onKeyDown: (event: React.KeyboardEvent, id: string) => void;
  variant: 'default' | 'onAccent' | 'onAccentWithDescription' | 'onAccentCompact' | 'compact' | 'withDescription';
}

export const DropdownOption: React.FC<DropdownOptionProps> = ({
  option,
  isSelected,
  isFocused,
  onClick,
  onKeyDown,
  variant
}) => {
  const getBaseClasses = () => {
    const baseClasses = [
      'w-full text-left transition-colors duration-200',
      'focus:outline-none disabled:opacity-50 disabled:cursor-not-allowed'
    ];

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
        'text-accent text-body',
        'hover:bg-secondary/40',
        isFocused ? 'bg-secondary/40' : '',
        isSelected ? 'bg-secondary/60 font-medium' : ''
      ],
      onAccent: [
        'text-primary text-body bg-accent',
        'hover:bg-primary/10',
        isFocused ? 'bg-primary/10' : '',
        isSelected ? 'bg-primary/20 font-medium' : ''
      ],
      onAccentWithDescription: [
        'text-primary text-body bg-accent',
        'hover:bg-primary/10',
        isFocused ? 'bg-primary/10' : '',
        isSelected ? 'bg-primary/20 font-medium' : ''
      ],
      onAccentCompact: [
        'text-primary text-label bg-accent',
        'hover:bg-primary/10',
        isFocused ? 'bg-primary/10' : '',
        isSelected ? 'bg-primary/20 font-medium' : ''
      ],
      compact: [
        'text-accent text-label',
        'hover:bg-secondary/40',
        isFocused ? 'bg-secondary/40' : '',
        isSelected ? 'bg-secondary/60 font-medium' : ''
      ],
      withDescription: [
        'text-accent text-body',
        'hover:bg-secondary/40',
        isFocused ? 'bg-secondary/40' : '',
        isSelected ? 'bg-secondary/60 font-medium' : ''
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
      onClick={() => !option.disabled && onClick(option.id)}
      onKeyDown={(e) => onKeyDown(e, option.id)}
      disabled={option.disabled}
      className={classes}
      role="option"
      aria-selected={isSelected}
      aria-disabled={option.disabled}
    >
      {variant === 'withDescription' || variant === 'onAccentWithDescription' ? (
        <div>
          <div className="font-medium">{option.label}</div>
          {option.description && (
            <div className={`text-caption mt-spacing-xs ${
              variant === 'onAccentWithDescription' ? 'text-text-secondary' : 'text-accent/70'
            }`}>
              {option.description}
            </div>
          )}
        </div>
      ) : (
        <div className="font-medium">{option.label}</div>
      )}
    </button>
  );
};

