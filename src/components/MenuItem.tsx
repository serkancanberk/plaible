import React from 'react';

type BaseProps = {
  label: string;
  className?: string;
  showArrow?: boolean;
  variant?: 'default' | 'mobileHeader' | 'SearchRecents' | 'icon+text';
  icon?: React.ReactNode;
};

type ClickableProps = BaseProps & {
  onClick: () => void;
  href?: never;
};

type LinkProps = BaseProps & {
  href: string;
  onClick?: undefined;
};

type MenuItemProps = ClickableProps | LinkProps;

export default function MenuItem(props: MenuItemProps) {
  const { label, className = '', showArrow, variant = 'default', icon } = props;
  
  // Default variant classes (landing page style)
  const defaultClasses = 'w-full flex items-center justify-between text-primary hover:text-secondary font-mono pt-spacing-md pb-spacing-xs hover:opacity-50 transition-colors';
  
  // Mobile header variant classes
  const mobileHeaderClasses = 'w-full flex items-center justify-between text-text-tertiary hover:text-accent font-mono text-caption pt-spacing-md pb-spacing-xs transition-colors';
  
  // SearchRecents variant classes (same layout as mobileHeader but different colors)
  const searchRecentsClasses = 'w-full flex items-center justify-between text-text-primary hover:text-text-secondary active:text-text-tertiary font-mono text-caption pt-spacing-md pb-spacing-xs transition-colors';
  
  // Icon+text variant classes (similar to NavItem icon+text)
  const iconTextClasses = 'w-full flex items-center gap-spacing-sm text-text-primary hover:text-text-secondary active:text-text-tertiary font-mono text-label py-spacing-xs px-spacing-md transition-colors';
  
  const commonClasses = variant === 'mobileHeader' ? mobileHeaderClasses : 
                       variant === 'SearchRecents' ? searchRecentsClasses : 
                       variant === 'icon+text' ? iconTextClasses :
                       defaultClasses;

  return (
    <div className={`w-full ${className}`}>
      {'onClick' in props ? (
        <button type="button" onClick={props.onClick} className={`${commonClasses} bg-transparent border-0 text-left cursor-pointer`}>
          {variant === 'icon+text' && icon && (
            <span className="w-4 h-4 flex items-center justify-center text-text-primary">
              {icon}
            </span>
          )}
          <span className="truncate">{label}</span>
          {showArrow !== false && <span aria-hidden="true">→</span>}
        </button>
      ) : (
        <a href={props.href} className={commonClasses}>
          {variant === 'icon+text' && icon && (
            <span className="w-4 h-4 flex items-center justify-center text-text-primary">
              {icon}
            </span>
          )}
          <span className="truncate">{label}</span>
          {showArrow !== false && <span aria-hidden="true">→</span>}
        </a>
      )}
      {variant === 'mobileHeader' || variant === 'SearchRecents' ? (
        <div className="h-px w-full bg-text-secondary/25" />
      ) : variant === 'icon+text' ? (
        <div className="h-px w-full bg-ui-muted/25" />
      ) : (
        <div className="h-px w-full bg-primary" />
      )}
    </div>
  );
}
