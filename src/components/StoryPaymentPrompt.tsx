import React from 'react';
import { motion } from 'framer-motion';
import C2AButton from './C2AButton';

type StoryPaymentPromptProps = {
  onAddCredits: () => void;
  onTryAgain: () => void;
};

export const StoryPaymentPrompt: React.FC<StoryPaymentPromptProps> = ({ onAddCredits, onTryAgain }) => {
  return (
    <div className="w-full h-full flex items-center justify-center">
      <motion.div
        initial={{ opacity: 0, y: 40 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.25, ease: 'easeOut' }}
        className="flex flex-col items-center text-center gap-spacing-lg p-spacing-xl"
      >
        <div className="font-sans text-heading text-accent/75">🌒 Your chapter paused for now</div>
        <div className="font-sans text-subheading text-text-tertiary/25 max-w-prose">
          Your next chapter is waiting to be written. Add a few credits to continue your story.
        </div>

        <div className="mt-spacing-lg flex items-center gap-spacing-md">
          <C2AButton variant="primary" onClick={onAddCredits}>Add Credits to Continue</C2AButton>
        </div>
      </motion.div>
    </div>
  );
};

export default StoryPaymentPrompt;


