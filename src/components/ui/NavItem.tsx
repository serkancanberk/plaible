import React from 'react';

export type NavItemProps = {
  variant?:
    | 'icon'
    | 'icon+text'
    | 'text'
    | 'icon-tertiary'
    | 'icon+text-tertiary'
    | 'text-tertiary'
    | 'icon-secondary'
    | 'icon+text-secondary'
    | 'text-secondary'
    | 'text+icon'
    | 'text+icon-tertiary'
    | 'text+icon-secondary';
  icon?: React.ReactNode;
  label?: string;
  href?: string;
  onClick?: () => void;
  active?: boolean;
  className?: string;
  collapsed?: boolean;
};

const PlaceholderIcon: React.FC = () => (
  <div className="w-5 h-5 rounded-full bg-primary" />
);

export default function NavItem({
  variant = 'icon+text',
  icon,
  label,
  href,
  onClick,
  active = false,
  className,
  collapsed = false,
}: NavItemProps) {
  const isTertiary = variant === 'icon-tertiary' || variant === 'icon+text-tertiary' || variant === 'text-tertiary' || variant === 'text+icon-tertiary';
  const isSecondary = variant === 'icon-secondary' || variant === 'icon+text-secondary' || variant === 'text-secondary' || variant === 'text+icon-secondary';
  const isTextOnly = variant === 'text' || variant === 'text-tertiary' || variant === 'text-secondary';
  const isIconOnly = variant === 'icon' || variant === 'icon-tertiary' || variant === 'icon-secondary';
  const isIconText = variant === 'icon+text' || variant === 'icon+text-tertiary' || variant === 'icon+text-secondary';
  const isTextIcon = variant === 'text+icon' || variant === 'text+icon-tertiary' || variant === 'text+icon-secondary';

  const baseClasses = [
    'font-mono',
    'text-label',
    isTertiary ? 'text-text-tertiary' : isSecondary ? 'text-text-secondary' : 'text-text-primary',
    'hover:text-text-secondary',
    'hover:opacity-50',
    'rounded-md',
    'transition-colors',
    'cursor-pointer',
  ];

  // Apply vertical padding only to icon and icon+text variants
  if (!isTextOnly) {
    baseClasses.push('py-spacing-xs');
  }

  if (active) {
    baseClasses.push('text-accent', 'font-bold');
  }

  if (className) baseClasses.push(className);

  const iconWrapperClasses = [
    'w-8', 'h-8', 'flex', 'items-center', 'justify-center', 'rounded-full', 'bg-primary',
    isTertiary
      ? 'text-text-tertiary'
      : isSecondary
        ? 'text-text-secondary'
        : (isIconOnly || isIconText)
          ? 'text-accent'
          : 'text-text-primary',
  ].join(' ');

  const content = (() => {
    // ICON ONLY VARIANTS: always use wrapper for consistency
    if (isIconOnly) {
      return (
        <div className="inline-flex items-center justify-center w-full h-full">
          <span className={iconWrapperClasses}>{icon ?? <PlaceholderIcon />}</span>
        </div>
      );
    }

    // TEXT ONLY VARIANTS: static labels; no transitions by design
    if (isTextOnly) {
      return (
        <div className="flex items-center justify-start w-full">
          <span className={isTertiary ? 'text-text-tertiary' : isSecondary ? 'text-text-secondary' : undefined}>{label}</span>
        </div>
      );
    }

    // TEXT + ICON VARIANTS: label first, trailing icon; label fades/scales, icon uses wrapper
    if (isTextIcon) {
      return (
        <div className="flex items-center gap-spacing-sm">
          {label ? (
            <span
              className={[
                'truncate',
                'transition-opacity', 'transition-transform', 'duration-300', 'ease-in-out',
                collapsed ? 'opacity-0 scale-95' : 'opacity-100 scale-100',
                'origin-left',
                isTertiary ? 'text-text-tertiary' : isSecondary ? 'text-text-secondary' : '',
              ].join(' ')}
            >
              {label}
            </span>
          ) : null}
          <span className={iconWrapperClasses}>{icon ?? <PlaceholderIcon />}</span>
        </div>
      );
    }

    // ICON + TEXT VARIANTS: label fades/scales; icon uses wrapper
    return (
      <div className="flex items-center gap-spacing-sm">
        <span className={iconWrapperClasses}>{icon ?? <PlaceholderIcon />}</span>
        {label ? (
          <span
            className={[
              'truncate',
              'transition-opacity', 'transition-transform', 'duration-300', 'ease-in-out',
              collapsed ? 'opacity-0 scale-95' : 'opacity-100 scale-100',
              'origin-left',
              isTertiary ? 'text-text-tertiary' : isSecondary ? 'text-text-secondary' : '',
            ].join(' ')}
          >
            {label}
          </span>
        ) : null}
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
