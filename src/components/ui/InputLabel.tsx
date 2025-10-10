import * as React from 'react';

export interface InputLabelProps {
  htmlFor?: string;
  variant?: 'default' | 'onAccent' | 'onAccentWithDescription' | 'onAccentCompact' | 'compact' | 'withDescription';
  className?: string;
  children: React.ReactNode;
}

export const InputLabel: React.FC<InputLabelProps> = ({
  htmlFor,
  variant = 'default',
  className,
  children
}) => {
  const getVariantClasses = () => {
    // Match StorySettingsModal label styling exactly
    return 'text-caption font-bold text-primary';
  };

  const classes = [
    'block',
    getVariantClasses(),
    className
  ].filter(Boolean).join(' ');

  return (
    <label htmlFor={htmlFor} className={classes}>
      {children}
    </label>
  );
};
