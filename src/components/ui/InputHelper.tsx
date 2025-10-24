import * as React from 'react';

export interface InputHelperProps {
  id?: string;
  variant?: 'default' | 'onAccent' | 'onAccentWithDescription' | 'onAccentCompact' | 'compact' | 'withDescription';
  className?: string;
  children: React.ReactNode;
}

export const InputHelper: React.FC<InputHelperProps> = ({
  id,
  variant = 'default',
  className,
  children
}) => {
  const getVariantClasses = () => {
    // Match DropdownOption description styling exactly
    if (variant === 'onAccentWithDescription') {
      return 'text-caption text-text-secondary';
    } else {
      return 'text-caption text-accent/70';
    }
  };

  const classes = [
    'block',
    getVariantClasses(),
    className
  ].filter(Boolean).join(' ');

  return (
    <div id={id} className={classes}>
      {children}
    </div>
  );
};
