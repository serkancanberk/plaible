import React from 'react';

export type NavItemProps = {
  variant?: 'icon' | 'icon+text' | 'text';
  icon?: React.ReactNode;
  label?: string;
  href?: string;
  onClick?: () => void;
  active?: boolean;
  className?: string;
};

const PlaceholderIcon: React.FC = () => (
  <div className="w-5 h-5 rounded-full bg-text-primary" />
);

export default function NavItem({
  variant = 'icon+text',
  icon,
  label,
  href,
  onClick,
  active = false,
  className,
}: NavItemProps) {
  const baseClasses = [
    'font-mono',
    'text-label',
    'text-text-primary',
    'hover:text-secondary',
    'hover:opacity-50',
    'rounded-md',
    'transition-colors',
    'cursor-pointer',
  ];

  // Apply vertical padding only to icon and icon+text variants
  if (variant !== 'text') {
    baseClasses.push('py-spacing-xs');
  }

  if (active) {
    baseClasses.push('text-accent', 'font-bold');
  }

  if (className) baseClasses.push(className);

  const content = (() => {
    if (variant === 'icon') {
      return (
        <div className="inline-flex items-center justify-center w-full h-full">
          {icon ?? <PlaceholderIcon />}
        </div>
      );
    }

    if (variant === 'text') {
      return (
        <div className="flex items-center justify-start w-full">
          {label}
        </div>
      );
    }

    // icon+text
    return (
      <div className="flex items-center gap-spacing-sm">
        <span className="inline-flex items-center justify-center">{icon ?? <PlaceholderIcon />}</span>
        {label ? <span className="truncate">{label}</span> : null}
      </div>
    );
  })();

  const classes = baseClasses.join(' ');

  if (href) {
    return (
      <a href={href} className={classes}>
        {content}
      </a>
    );
  }

  if (onClick) {
    return (
      <button type="button" onClick={onClick} className={classes}>
        {content}
      </button>
    );
  }

  return (
    <div className={classes}>{content}</div>
  );
}


