import * as React from 'react';
import { InputLabel } from './InputLabel';
import { InputHelper } from './InputHelper';

export interface InputProps extends Omit<React.InputHTMLAttributes<HTMLInputElement>, 'size'> {
  variant?: 'default' | 'onAccent' | 'onAccentWithDescription' | 'onAccentCompact' | 'compact' | 'withDescription';
  size?: 'sm' | 'md' | 'lg';
  fullWidth?: boolean;
  disabled?: boolean;
  error?: boolean;
  label?: string;
  helperText?: string;
  className?: string;
  as?: 'input' | 'textarea';
  rows?: number;
}

export const Input = React.forwardRef<HTMLInputElement | HTMLTextAreaElement, InputProps>(({
  variant = 'default',
  size = 'md',
  fullWidth = true,
  disabled = false,
  error = false,
  label,
  helperText,
  className,
  id,
  as = 'input',
  rows,
  ...props
}, ref) => {
  const inputId = id || `input-${Math.random().toString(36).substr(2, 9)}`;
  const helperId = helperText ? `${inputId}-helper` : undefined;

  const getBaseClasses = () => {
    const baseClasses = [
      'w-full rounded-card text-left transition-colors duration-200',
      'disabled:opacity-50 disabled:cursor-not-allowed'
    ];

    // Add border and focus ring classes based on variant (exact DropdownTrigger pattern)
    if (variant === 'default' || variant === 'compact' || variant === 'withDescription') {
      baseClasses.push('focus:ring-1 focus:ring-accent focus:ring-offset-1');
    } else if (variant === 'onAccent' || variant === 'onAccentWithDescription' || variant === 'onAccentCompact') {
      baseClasses.push('border border-primary', 'focus:ring-2 focus:ring-primary focus:ring-offset-2');
    } else {
      baseClasses.push('border', 'focus:ring-2 focus:ring-offset-2');
    }

    // Add size classes based on variant (exact DropdownTrigger pattern)
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
    // Match DropdownTrigger variant classes exactly
    const baseVariantClasses = {
      default: [
        'bg-primary text-accent text-body'
      ],
      onAccent: [
        'bg-accent text-primary text-body',
        'hover:bg-accent/90'
      ],
      onAccentWithDescription: [
        'bg-accent text-primary text-body',
        'hover:bg-accent/90'
      ],
      onAccentCompact: [
        'bg-accent text-primary text-label',
        'hover:bg-accent/90'
      ],
      compact: [
        'bg-primary text-accent text-label'
      ],
      withDescription: [
        'bg-primary text-accent text-body'
      ]
    };

    return baseVariantClasses[variant];
  };

  const classes = [
    ...getBaseClasses(),
    ...getVariantClasses(),
    className
  ].filter(Boolean).join(' ');

  return (
    <div className="space-y-spacing-sm">
      {label && (
        <InputLabel htmlFor={inputId} variant={variant}>
          {label}
        </InputLabel>
      )}
      
      {as === 'textarea' ? (
        <textarea
          ref={ref as React.ForwardedRef<HTMLTextAreaElement>}
          id={inputId}
          disabled={disabled}
          className={classes}
          aria-describedby={helperId}
          rows={rows}
          {...(props as React.TextareaHTMLAttributes<HTMLTextAreaElement>)}
        />
      ) : (
        <input
          ref={ref as React.ForwardedRef<HTMLInputElement>}
          id={inputId}
          disabled={disabled}
          className={classes}
          aria-describedby={helperId}
          {...props}
        />
      )}
      
      {helperText && (
        <InputHelper id={helperId} variant={variant}>
          {helperText}
        </InputHelper>
      )}
    </div>
  );
});

Input.displayName = 'Input';