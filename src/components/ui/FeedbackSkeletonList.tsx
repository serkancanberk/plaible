import * as React from "react";
import { motion } from "framer-motion";
import { useReducedMotion } from "../../hooks/useReducedMotion";

interface FeedbackSkeletonListProps {
  count?: number;
}

export const FeedbackSkeletonList: React.FC<FeedbackSkeletonListProps> = ({ count = 3 }) => {
  const shouldReduceMotion = useReducedMotion();

  const containerVariants = shouldReduceMotion ? undefined : {
    hidden: { opacity: 0 },
    visible: {
      opacity: [0.6, 1, 0.6],
      transition: {
        type: "tween" as const,
        repeat: Infinity,
        duration: 1.2,
        ease: "easeInOut" as const
      }
    }
  };

  const itemVariants = shouldReduceMotion ? undefined : {
    hidden: { opacity: 0, y: 10 },
    visible: (i: number) => ({
      opacity: 1,
      y: 0,
      transition: {
        delay: i * 0.1,
        duration: 0.4,
        ease: [0.22, 1, 0.36, 1] as const
      }
    })
  };

  return (
    <motion.div 
      className="space-y-spacing-md"
      variants={containerVariants}
      initial="hidden"
      animate="visible"
    >
      {Array.from({ length: count }).map((_, i) => (
        <motion.div
          key={i}
          className="w-full bg-primary rounded-[24px] p-[24px] text-text-tertiary"
          variants={itemVariants}
          initial="hidden"
          animate="visible"
          custom={i}
        >
          <div className="flex items-center gap-4 mb-4">
            <div className="w-[60px] h-[60px] bg-secondary/20 rounded-[12px] flex-shrink-0 animate-pulse" />
            <div className="flex-1 space-y-2">
              <div className="w-1/2 h-4 bg-secondary/20 rounded animate-pulse" />
              <div className="w-1/3 h-3 bg-secondary/20 rounded animate-pulse" />
            </div>
            <div className="flex gap-1">
              {Array.from({ length: 5 }).map((_, starIndex) => (
                <div
                  key={starIndex}
                  className="w-4 h-4 bg-secondary/20 rounded animate-pulse"
                />
              ))}
            </div>
          </div>
          <div className="h-16 bg-secondary/20 rounded mb-4 animate-pulse" />
          <div className="flex justify-between items-center">
            <div className="w-1/4 h-3 bg-secondary/20 rounded animate-pulse" />
            <div className="w-1/6 h-3 bg-secondary/20 rounded animate-pulse" />
          </div>
        </motion.div>
      ))}
    </motion.div>
  );
};
