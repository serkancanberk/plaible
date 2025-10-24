import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { motion } from 'framer-motion';

export type PlayChatHeaderProps = {
  characterName: string;
  storyName: string;
  timeInfo: string;
  toneInfo: string;
  sceneInfo?: { chapter?: number; beat?: number } | null;
  playerInfo?: string;
  onOpenMenu?: () => void;
  className?: string;
  /** Optional scroll target to drive smart visibility. If not provided, header stays visible. */
  scrollElement?: HTMLElement | null;
};

export const PlayChatHeader: React.FC<PlayChatHeaderProps> = ({
  characterName,
  storyName,
  timeInfo,
  toneInfo,
  sceneInfo,
  playerInfo,
  onOpenMenu,
  className = '',
  scrollElement,
}) => {
  const SMART_VISIBILITY_ENABLED = false;
  const prefersReducedMotion = useMemo(() =>
    typeof window !== 'undefined' && window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches,
  []);

  const [isVisible, setIsVisible] = useState(true);
  const idleTimerRef = useRef<number | null>(null);
  const lastScrollTopRef = useRef<number>(0);
  const accumulatedUpRef = useRef<number>(0);
  const accumulatedDownRef = useRef<number>(0);

  const clearIdle = () => {
    if (idleTimerRef.current) {
      window.clearTimeout(idleTimerRef.current);
      idleTimerRef.current = null;
    }
  };

  const armIdle = useCallback(() => {
    clearIdle();
    idleTimerRef.current = window.setTimeout(() => {
      setIsVisible(false);
    }, 2500);
  }, []);

  const reveal = useCallback(() => {
    setIsVisible(true);
    armIdle();
  }, [armIdle]);

  useEffect(() => {
    if (!SMART_VISIBILITY_ENABLED) {
      setIsVisible(true);
      return;
    }
    if (prefersReducedMotion) {
      setIsVisible(true);
      clearIdle();
      return;
    }

    // Idle based on user input
    const onAnyInput = () => {
      setIsVisible(true);
      armIdle();
    };
    window.addEventListener('mousemove', onAnyInput, { passive: true });
    window.addEventListener('keydown', onAnyInput);

    // Ensure visible on mount before arming idle
    setIsVisible(true);
    const id = window.setTimeout(() => armIdle(), 0);
    return () => {
      window.removeEventListener('mousemove', onAnyInput as any);
      window.removeEventListener('keydown', onAnyInput as any);
      window.clearTimeout(id);
      clearIdle();
    };
  }, [armIdle, prefersReducedMotion]);

  // Scroll visibility behavior
  useEffect(() => {
    if (!SMART_VISIBILITY_ENABLED) return;
    if (prefersReducedMotion) return;
    if (!scrollElement) return;

    // Initialize last known position to avoid treating initial programmatic scroll as user scroll
    lastScrollTopRef.current = scrollElement.scrollTop;
    let firstEventIgnored = false;

    const onScroll = () => {
      // Ignore the very first scroll event post-attach (often caused by auto-scroll)
      if (!firstEventIgnored) {
        firstEventIgnored = true;
        lastScrollTopRef.current = scrollElement.scrollTop;
        return;
      }
      const currentTop = scrollElement.scrollTop;
      const delta = currentTop - (lastScrollTopRef.current || 0);

      if (delta > 0) {
        // scrolling down
        accumulatedDownRef.current += delta;
        accumulatedUpRef.current = 0;
        if (accumulatedDownRef.current > 24) {
          setIsVisible(false);
        }
      } else if (delta < 0) {
        // scrolling up
        accumulatedUpRef.current += Math.abs(delta);
        accumulatedDownRef.current = 0;
        if (accumulatedUpRef.current > 16) {
          reveal();
        }
      }

      lastScrollTopRef.current = currentTop <= 0 ? 0 : currentTop;
    };

    scrollElement.addEventListener('scroll', onScroll, { passive: true });
    return () => {
      scrollElement.removeEventListener('scroll', onScroll as any);
    };
  }, [scrollElement, reveal, prefersReducedMotion]);

  // Hover zone at top (56px) to reveal header
  useEffect(() => {
    if (!SMART_VISIBILITY_ENABLED) return;
    if (prefersReducedMotion) return;

    const hoverZone = document.createElement('div');
    hoverZone.setAttribute('aria-hidden', 'true');
    hoverZone.style.position = 'fixed';
    hoverZone.style.top = '0';
    hoverZone.style.left = '0';
    hoverZone.style.right = '0';
    hoverZone.style.height = '56px';
    hoverZone.style.zIndex = '50';
    hoverZone.style.pointerEvents = 'auto';
    hoverZone.style.background = 'transparent';
    hoverZone.style.userSelect = 'none';

    const onEnter = () => reveal();
    hoverZone.addEventListener('pointerenter', onEnter);

    document.body.appendChild(hoverZone);
    return () => {
      hoverZone.removeEventListener('pointerenter', onEnter as any);
      if (hoverZone.parentElement) hoverZone.parentElement.removeChild(hoverZone);
    };
  }, [prefersReducedMotion, reveal]);

  const sceneText = useMemo(() => {
    const parts: string[] = [];
    if (typeof sceneInfo?.chapter === 'number') parts.push(`Chapter ${sceneInfo!.chapter}`);
    if (typeof sceneInfo?.beat === 'number') parts.push(`Beat ${sceneInfo!.beat}`);
    return parts.join(' · ');
  }, [sceneInfo?.chapter, sceneInfo?.beat]);

  return (
    <motion.header
      initial={{ opacity: 1, y: 0 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0 }}
      className={`sticky top-0 z-70 border-b border-ui-muted bg-secondary/95 ${className}`}
      aria-label="Play header"
    >
      <div className="px-spacing-md py-spacing-sm flex items-center justify-between">
        <div className="flex items-center gap-spacing-sm min-w-0">
          <div className="truncate">
            <div>
            <span className="font-serif text-body text-accent px-spacing-xs py-spacing-xs">🌕</span> 
            <span className="font-serif text-body text-accent">Playing as “{characterName}” in “{storyName}”</span>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-spacing-lg">
          <div className="hidden sm:flex items-center gap-spacing-xl font-mono text-label text-text-secondary">
            <span className="truncate" title={timeInfo}>Time: {timeInfo}</span>
            <span className="truncate" title={toneInfo}>Tone: {toneInfo}</span>
            {sceneText ? <span className="truncate" title={sceneText}>Scene: {sceneText}</span> : null}
          </div>

          <button
            type="button"
            aria-haspopup="menu"
            aria-label="Open header menu"
            onClick={onOpenMenu}
            className="inline-flex h-8 w-8 items-center justify-center rounded-full border border-text-secondary/30 bg-secondary text-text-secondary hover:bg-primary/10"
          >
            ⋮
          </button>
        </div>
      </div>
    </motion.header>
  );
};

export default PlayChatHeader;


