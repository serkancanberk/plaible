import React from 'react';

export type PlaibleLogoProps = {
  variant?: 'original' | 'light' | 'ai-original' | 'ai-light';
  size?: 'sm' | 'md' | 'lg';
};

/**
 * Plaible brand mark with precise typography segmentation.
 * - Emoji + text stay horizontally aligned
 * - Geist for 'Pl' and 'ble'; Geist Mono for 'ai'
 * - Consistent letter spacing and weight across all segments
 */
export default function PlaibleLogo({ variant = 'original', size = 'md' }: PlaibleLogoProps) {
  const sizeClass = size === 'sm' ? 'text-[30px]' : size === 'lg' ? 'text-[54px]' : 'text-[42px]';
  const sharedClass = 'font-semibold tracking-[-0.05em]';
  const gapClass = size === 'sm' ? 'gap-1' : size === 'lg' ? 'gap-[10px]' : 'gap-[6px]';

  const isAi = variant === 'ai-original' || variant === 'ai-light';
  const emoji = isAi ? '🌕' : '🌚';

  const plBleColor =
    variant === 'light' || variant === 'ai-light' ? 'text-text-tertiary' : 'text-text-primary';
  const aiColor = variant === 'ai-original' || variant === 'ai-light' ? 'text-accent' : plBleColor;

  return (
    <span className={`inline-flex items-center ${gapClass} ${sizeClass}`}>
      <span className={`font-sans ${sharedClass}`}>{emoji}</span>
      <span className={`font-sans ${sharedClass} ${plBleColor}`}>
        Pl
        <span className={`font-mono ${sharedClass} ${aiColor}`}>ai</span>
        ble
      </span>
    </span>
  );
}


