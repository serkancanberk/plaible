import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { useReducedMotion } from '../../hooks/useReducedMotion';

export interface FeedbackData {
  id: string;
  username: string;
  city: string;
  character: string;
  rating: number;
  weeksAgo: number;
  text: string;
  characterImageUrl?: string;
}

interface FeedbackCardProps {
  data: FeedbackData;
  variant?: "default" | "fullWidth";
}

export const FeedbackCard: React.FC<FeedbackCardProps> = ({ data, variant = "default" }) => {
  const [imgError, setImgError] = React.useState(false);
  const [imageLoaded, setImageLoaded] = React.useState(false);
  const [isExpanded, setIsExpanded] = React.useState(false);
  const shouldReduceMotion = useReducedMotion();
  const showFallback = imgError || !data.characterImageUrl;

  // Character limit for text expansion
  const CHAR_LIMIT = 180;
  const shouldShowToggle = data.text.length > CHAR_LIMIT;

  const safeRating = Math.max(0, Math.min(5, Math.round(data.rating)));
  const stars = '★'.repeat(safeRating) + '☆'.repeat(5 - safeRating);
  const timeLabel = `${data.weeksAgo} week${data.weeksAgo === 1 ? '' : 's'} ago`;

  const containerClasses =
    variant === "fullWidth"
      ? "w-full bg-primary rounded-[24px] p-[24px] text-text-tertiary"
      : "max-w-[420px] bg-primary rounded-[24px] p-[24px] text-text-tertiary";

  // Animation variants for reduced motion
  const cardVariants = shouldReduceMotion ? undefined : {
    initial: { opacity: 0, scale: 0.96, y: 10 },
    whileInView: { opacity: 1, scale: 1, y: 0 },
    whileHover: { y: -4, boxShadow: "0px 8px 20px rgba(0,0,0,0.15)" }
  };

  const cardTransition = shouldReduceMotion ? undefined : { 
    duration: 0.4, 
    ease: [0.22, 1, 0.36, 1] as const
  };

  const hoverTransition = shouldReduceMotion ? undefined : { 
    type: "spring" as const, 
    stiffness: 250, 
    damping: 15 
  };

  return (
    <motion.article 
        className={containerClasses}
        variants={cardVariants}
        initial="initial"
        whileInView="whileInView"
        whileHover="whileHover"
        transition={cardTransition}
        viewport={{ once: true }}
      >
        <div className="flex flex-col gap-[16px]">
          {/* Row 1: Profile Section */}
          <div className="flex flex-row items-start gap-[16px]">
            {showFallback ? (
              <motion.div 
                className="w-[60px] h-[60px] rounded-[12px] bg-secondary/40 flex items-center justify-center text-text-tertiary/70 text-body select-none"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ duration: 0.3 }}
              >
                <span role="img" aria-label="avatar">🧑</span>
              </motion.div>
            ) : (
              <motion.img
                src={data.characterImageUrl}
                alt={data.character}
                width={60}
                height={60}
                className={`w-[60px] h-[60px] rounded-[12px] object-cover transition-filter duration-400 ${
                  imageLoaded ? 'blur-0' : 'blur-sm'
                }`}
                loading="lazy"
                onError={() => setImgError(true)}
                onLoad={() => setImageLoaded(true)}
                initial={{ opacity: 0 }}
                animate={{ opacity: imageLoaded ? 1 : 0.7 }}
                transition={{ duration: 0.4 }}
              />
            )}
            <div className="flex-1 min-w-0 flex flex-col justify-center gap-[2px]">
              <p className="font-mono text-caption truncate">
                <span className="truncate" title={data.username}>{data.username}</span>
                <span>{' '}played as{' '}</span>
              </p>
              <p>
                <span className="font-serif text-subheading text-accent whitespace-nowrap">{data.character}</span>
              </p>
            </div>
          </div>

          {/* Info Row: rating / count / time */}
          <div className="text-caption text-text-tertiary/90 flex items-center flex-wrap gap-[8px]">
            <span className="text-accent" aria-hidden="true">{stars}</span>
            <span>({safeRating})</span>
            {data.city ? <span>• {data.city}</span> : null}
            <span>– {timeLabel}</span>
          </div>

          {/* Row 2: Description */}
          <motion.p
            layout
            className="font-mono text-caption text-text-tertiary/90 leading-[1.6] overflow-hidden"
            animate={{ 
              height: isExpanded ? "auto" : "40px",
              transition: shouldReduceMotion ? { duration: 0 } : { duration: 0.35, ease: [0.22, 1, 0.36, 1] }
            }}
          >
            {isExpanded
              ? data.text
              : data.text.slice(0, CHAR_LIMIT) + (data.text.length > CHAR_LIMIT ? "..." : "")}
          </motion.p>

          {/* Row 3: Toggle Button */}
          {shouldShowToggle && (
            <div className="w-full flex justify-start mt-spacing-xs">
              <button
                className="text-accent font-mono text-caption hover:underline transition-colors duration-200"
                onClick={(e) => {
                  e.preventDefault();
                  setIsExpanded(!isExpanded);
                }}
                aria-expanded={isExpanded}
              >
                {isExpanded ? "Read less ←" : "Read more →"}
              </button>
            </div>
          )}
        </div>
      </motion.article>
  );
};

export default FeedbackCard;
