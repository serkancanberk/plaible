import React from 'react';

export type PlaibleLogoProps = {
  variant?: 'original' | 'light' | 'ai-original' | 'ai-light' | 'emoji-logo';
  size?: 'sm' | 'md' | 'lg' | 'xl';
};

/**
 * Plaible brand mark with precise typography segmentation.
 * - Emoji + text stay horizontally aligned
 * - Geist for 'Pl' and 'ble'; Geist Mono for 'ai'
 * - Consistent letter spacing and weight across all segments
 */
export default function PlaibleLogo({ variant = 'original', size = 'md' }: PlaibleLogoProps) {
  // Size classes for full logo (existing behavior)
  const fullLogoSizeClass =
    size === 'sm' ? 'text-[30px]'
    : size === 'lg' ? 'text-[54px]'
    : size === 'xl' ? 'text-[81px]'
    : 'text-[42px]';
  const sharedClass = 'font-semibold tracking-[-0.05em]';
  const gapClass = size === 'sm' ? 'gap-[10px]' : size === 'lg' ? 'gap-[18px]' : 'gap-[14px]';

  // Emoji-only variant sizing per requirements
  const emojiOnlySizeClass =
    size === 'sm' ? 'text-xl'
    : size === 'lg' ? 'text-3xl'
    : size === 'xl' ? 'text-5xl'
    : 'text-2xl';

  if (variant === 'emoji-logo') {
    return (
      <span className={`inline-flex items-center ${emojiOnlySizeClass}`}>
        <span className={`font-sans ${sharedClass}`}>🌚</span>
      </span>
    );
  }

  const isAi = variant === 'ai-original' || variant === 'ai-light';
  const emoji = isAi ? '🌕' : '🌚';

  const plBleColor =
    variant === 'light' || variant === 'ai-light' ? 'text-text-tertiary' : 'text-text-primary';
  const aiColor = variant === 'ai-original' || variant === 'ai-light' ? 'text-accent' : plBleColor;

  return (
    <span className={`inline-flex items-center ${gapClass} ${fullLogoSizeClass}`}>
      <span className={`font-sans ${sharedClass}`}>{emoji}</span>
      <span className={`font-sans ${sharedClass} ${plBleColor}`}>
        Pl
        <span className={`font-mono ${sharedClass} ${aiColor}`}>ai</span>
        ble
      </span>
    </span>
  );
}


