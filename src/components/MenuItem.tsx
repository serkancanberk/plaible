import React from 'react';

type BaseProps = {
  label: string;
  className?: string;
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
  const { label, className = '' } = props;
  const commonClasses = 'w-full flex items-center justify-between text-primary hover:text-secondary font-mono pb-4 hover:opacity-50 transition-colors';

  return (
    <div className={`w-full ${className}`}>
      {'onClick' in props ? (
        <button type="button" onClick={props.onClick} className={`${commonClasses} bg-transparent border-0 text-left cursor-pointer`}>
          <span className="truncate">{label}</span>
          <span aria-hidden="true">→</span>
        </button>
      ) : (
        <a href={props.href} className={commonClasses}>
          <span className="truncate">{label}</span>
          <span aria-hidden="true">→</span>
        </a>
      )}
      <div className="h-px w-full bg-primary" />
    </div>
  );
}
