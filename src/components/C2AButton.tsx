import React from 'react';

export type C2AButtonProps = {
  children: React.ReactNode;
  variant?: 'subheading' | 'body';
  onClick?: () => void;
  type?: 'button' | 'submit' | 'reset';
};

export default function C2AButton({
  children,
  variant = 'subheading',
  onClick,
  type = 'button',
}: C2AButtonProps) {
  const typographyClass = variant === 'subheading' ? 'text-subheading' : 'text-body';

  return (
    <button
      type={type}
      onClick={onClick}
      className={[
        'inline-flex items-center justify-center',
        'rounded-[10px] py-[12px] px-[24px] gap-[12px]',
        'bg-accent text-text-primary',
        'font-semibold',
        'transition-colors hover:bg-accent/80',
        'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent/60 focus-visible:ring-offset-2',
        'disabled:opacity-60 disabled:cursor-not-allowed',
        typographyClass,
      ].join(' ')}
    >
      {children}
    </button>
  );
}


