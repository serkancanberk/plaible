import React from 'react';
import IconGoogle from 'virtual:icons/simple-icons/google';
import IconApple from 'virtual:icons/simple-icons/apple';
import IconTikTok from 'virtual:icons/simple-icons/tiktok';
import IconInstagram from 'virtual:icons/simple-icons/instagram';
import IconAppStore from 'virtual:icons/simple-icons/appstore';
import IconPlayStore from 'virtual:icons/simple-icons/googleplay';
import IconSparkles from 'virtual:icons/tabler/sparkles';

/**
 * C2AButton
 * Token-based, reusable CTA button with visual variants and typography scales.
 *
 * Props:
 * - variant: 'primary' | 'secondary' | 'ghost' (visual). Default: 'primary'
 * - typography: 'body' | 'caption' | 'label'. Default: 'body'
 * - fullWidth: when true, applies w-full and flex. Default: false
 * - className: external class names appended (internal tokens remain authoritative)
 * - iconLeft: optional React node rendered before children
 * - iconRight: optional React node rendered after children
 * - loading: when true, shows spinner and disables the button
 * - loadingText: optional text rendered next to spinner when loading
 * - context: contextual visual treatment (e.g., 'onAccent')
 * - All native button props are supported (onClick, type, disabled, etc.)
 *
 * Usage:
 * - <C2AButton>Start</C2AButton>
 * - <C2AButton variant="secondary" typography="body">Continue</C2AButton>
 * - <C2AButton variant="ghost" fullWidth onClick={...}>Action</C2AButton>
 */

type ButtonVariant = 'primary' | 'secondary' | 'ghost';
type TypographyScale = 'body' | 'caption' | 'label';
type ButtonContext = 'onAccent' | undefined;

export interface C2AButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  children: React.ReactNode;
  variant?: ButtonVariant;
  typography?: TypographyScale;
  fullWidth?: boolean;
  className?: string;
  iconLeft?: React.ReactNode;
  iconRight?: React.ReactNode;
  icon?: 'google' | 'apple' | 'tiktok' | 'instagram' | 'appstore' | 'playstore';
  iconColor?: 'white' | 'black' | 'brand';
  iconPosition?: 'left' | 'right';
  loading?: boolean;
  loadingText?: string;
  context?: ButtonContext;
}

export default function C2AButton({
  children,
  variant = 'primary',
  typography = 'body',
  fullWidth = false,
  className,
  type = 'button',
  iconLeft,
  iconRight,
  icon,
  iconColor = 'brand',
  iconPosition = 'left',
  loading,
  loadingText,
  context,
  ...rest
}: C2AButtonProps) {
  const TYPOGRAPHY_STYLES: Record<TypographyScale, string> = {
    body: 'text-body',
    caption: 'text-caption',
    label: 'text-label',
  };

  const VARIANT_STYLES: Record<ButtonVariant, string> = {
    primary: [
      'bg-accent text-text-primary',
      'hover:bg-accent/80',
      'focus-visible:ring-accent/60',
    ].join(' '),
    secondary: [
      'bg-ui-muted text-text-primary',
      'hover:bg-ui-muted/80',
      'focus-visible:ring-ui-muted/60',
    ].join(' '),
    ghost: [
      'bg-transparent text-text-secondary border border-ui-muted',
      'hover:bg-ui-muted/20 hover:text-text-primary',
      'focus-visible:ring-ui-muted/60',
    ].join(' '),
  };

  const ONACCENT_STYLES: Record<ButtonVariant, string> = {
    primary: [
      'bg-primary text-accent',
      'hover:bg-primary/90',
      'focus-visible:ring-primary/60',
      // Disabled aligns to secondary-onAccent logic
      'disabled:bg-text-tertiary disabled:text-text-primary',
    ].join(' '),
    secondary: [
      'bg-text-tertiary text-text-primary',
      'hover:bg-text-tertiary/90',
      'focus-visible:ring-text-tertiary/60',
    ].join(' '),
    ghost: [
      'bg-transparent text-text-primary border border-text-primary',
      'hover:bg-text-tertiary/20',
      'focus-visible:ring-text-primary/60',
      // Disabled removes border emphasis in onAccent context
      'disabled:border-transparent disabled:bg-text-tertiary disabled:text-text-primary',
    ].join(' '),
  };

  const widthClasses = fullWidth ? 'w-full flex' : 'inline-flex';

  const variantClasses = context === 'onAccent' ? ONACCENT_STYLES[variant] : VARIANT_STYLES[variant];

  const ringOffsetContext = context === 'onAccent' ? 'focus-visible:ring-offset-accent' : '';

  const classes = [
    // External first so internal tokens win in conflicts
    className,
    // Layout
    widthClasses,
    'items-center justify-center',
    'gap-spacing-sm',
    // Shape & spacing via tokens
    'rounded-card',
    'py-spacing-md px-spacing-lg',
    // Typography
    'font-semibold',
    TYPOGRAPHY_STYLES[typography],
    // Variant
    variantClasses,
    // States & transitions
    'transition-colors duration-200',
    'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2',
    ringOffsetContext,
    'disabled:opacity-60 disabled:cursor-not-allowed',
  ]
    .filter(Boolean)
    .join(' ');

  const { disabled: disabledProp, ...restProps } = rest;
  const isDisabled = Boolean(disabledProp || loading);

  const renderIcon = () => {
    if (!icon) return null;
    const sizeClasses = 'h-[20px] w-[20px]';
    const colorClass = iconColor === 'white' ? 'text-white' : iconColor === 'black' ? 'text-black' : '';

    switch (icon) {
      case 'google':
        return <IconGoogle className={`${sizeClasses} ${colorClass}`} />;
      case 'apple':
        return <IconApple className={`${sizeClasses} ${colorClass}`} />;
      case 'tiktok':
        return <IconTikTok className={`${sizeClasses} ${colorClass}`} />;
      case 'instagram':
        return <IconInstagram className={`${sizeClasses} ${colorClass}`} />;
      case 'appstore':
        return <IconAppStore className={`${sizeClasses} ${colorClass}`} />;
      case 'playstore':
        return <IconPlayStore className={`${sizeClasses} ${colorClass}`} />;
      default:
        return <IconSparkles className={`${sizeClasses} ${colorClass}`} />;
    }
  };

  const renderSpinner = () => (
    <div className="inline-flex items-center justify-center gap-spacing-xs">
      <div className="animate-spin h-[20px] w-[20px] border-2 border-current border-t-transparent rounded-full" />
      {loadingText ? <span className="text-inherit">{loadingText}</span> : null}
    </div>
  );

  return (
    <button
      type={type}
      className={classes}
      disabled={isDisabled}
      aria-busy={loading ? 'true' : undefined}
      {...restProps}
    >
      {loading ? (
        renderSpinner()
      ) : (
        <>
          {(iconPosition === 'left' && (iconLeft || icon)) ? (
            <span className="inline-flex items-center justify-center">{iconLeft || renderIcon()}</span>
          ) : null}
          <span className="inline-flex items-center justify-center">{children}</span>
          {(iconPosition === 'right' && (iconRight || icon)) ? (
            <span className="inline-flex items-center justify-center">{iconRight || renderIcon()}</span>
          ) : null}
        </>
      )}
    </button>
  );
}

