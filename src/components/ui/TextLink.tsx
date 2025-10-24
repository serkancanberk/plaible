import React from 'react';

type TextLinkProps = React.AnchorHTMLAttributes<HTMLAnchorElement> & {
  href: string;
  children: React.ReactNode;
  iconLeft?: React.ReactNode;
  iconRight?: React.ReactNode;
  context?: 'onDark' | 'default';
  muted?: boolean;
  selected?: boolean;
  className?: string;
};

const TextLink: React.FC<TextLinkProps> = ({
  href,
  children,
  iconLeft,
  iconRight,
  context = 'default',
  muted = false,
  selected = false,
  className,
  ...props
}) => {
  const contextClasses = context === 'onDark' ? 'text-text-primary' : '';
  const stateClasses = [
    muted ? 'text-ui-muted' : '',
    selected ? 'font-semibold ring-2 ring-offset-2 ring-accent' : '',
  ].filter(Boolean).join(' ');

  const classes = [
    'text-link-mono-accent',
    contextClasses,
    stateClasses,
    className,
  ]
    .filter(Boolean)
    .join(' ');

  return (
    <a href={href} className={classes} {...props}>
      {iconLeft ? <span className="inline-flex items-center mr-1">{iconLeft}</span> : null}
      <span className="inline-flex items-center">{children}</span>
      {iconRight ? <span className="ml-1 inline-flex items-center">{iconRight}</span> : null}
    </a>
  );
};

export default TextLink;


