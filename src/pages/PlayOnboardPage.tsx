import React, { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { useStoryBySlug } from '../hooks/useStoryBySlug';
import { useUser } from '../hooks/useUser';
import StorySettingsModal from '../components/ui/StorySettingsModal';
import C2AButton from '../components/C2AButton';
import NavItem from '../components/ui/NavItem';
import { AnimatedTitle } from '../components/ui/AnimatedTitle';
import IconSettings from 'virtual:icons/tabler/settings';

const PlayOnboardPage: React.FC = () => {
  const { storySlug, characterSlug } = useParams<{ storySlug: string; characterSlug: string }>();
  const navigate = useNavigate();
  const { data: story, loading: storyLoading, error: storyError } = useStoryBySlug(storySlug);
  const { data: user, loading: userLoading } = useUser();
  const [isSettingsModalOpen, setSettingsModalOpen] = useState(false);
  const [isStarting, setIsStarting] = useState(false);

  // Find the selected character
  const character = story?.characters?.find(
    c => c.id === characterSlug || c.name.toLowerCase().replace(/\s+/g, '-') === characterSlug
  );

  // Handle start button click with animation
  const handleStart = () => {
    setIsStarting(true);
    // Navigate after animation completes
    setTimeout(() => {
      navigate(`/app/play/session/${storySlug}/${characterSlug}`);
    }, 400);
  };

  // Loading state
  if (storyLoading || userLoading) {
    return (
      <div className="flex flex-col items-center justify-center h-full text-center px-spacing-xl">
        <div className="text-body text-text-tertiary">Loading...</div>
      </div>
    );
  }

  // Error state
  if (storyError || !story) {
    return (
      <div className="flex flex-col items-center justify-center h-full text-center px-spacing-xl">
        <div className="text-body text-text-tertiary">Story not found.</div>
      </div>
    );
  }

  return (
    <div className="flex flex-col items-center justify-center min-h-[calc(100vh-16rem)] text-center px-spacing-xl">
      <AnimatePresence>
        {!isStarting && (
          <motion.div
            key="content"
            initial={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 8 }}
            transition={{ duration: 0.4, ease: "easeInOut" }}
            className="w-full max-w-prose mx-auto"
          >
            {/* Main Content Stack - Vertically Centered with Spacing Tokens */}
            <div className="flex flex-col items-center justify-center text-center gap-spacing-xl md:gap-spacing-2xl">
              {/* Animated Greeting */}
              <AnimatedTitle 
                userName={user?.identity?.firstName || "visitor"}
                characterName={character?.name || "the character"}
              />

              {/* Character Hello Message */}
              {(character as any)?.helloMessage && (
                <p className="font-sans text-body text-text-secondary leading-snug">
                  {(character as any).helloMessage}
                </p>
              )}

              {/* Character Onboarding Text */}
              {(character as any)?.onboardingText && (
                <p className="font-serif text-subheading text-text-tertiary/90 leading-relaxed max-w-[640px] mx-auto text-center">
                  {(character as any).onboardingText}
                </p>
              )}

              {/* Fallback Opening scene text - only show if no character onboarding text */}
              {!(character as any)?.onboardingText && (
                <p className="text-body text-text-tertiary/90 leading-relaxed max-w-[640px] mx-auto text-center">
                  {story?.summary?.original ||
                    story?.description ||
                    'The air is thick with promise, the world holding its breath for your first step.'}
                </p>
              )}
            </div>

            {/* Start Button - Using spacing tokens */}
            <div className="w-full mt-spacing-xl">
              <C2AButton 
                variant="primary" 
                typography="body" 
                fullWidth
                onClick={handleStart}
              >
                Start
              </C2AButton>
            </div>

            {/* Footer Section - Using spacing tokens */}
            <div className="flex flex-col items-center gap-spacing-sm mt-spacing-2xl">
              <p className="font-sans text-label text-text-secondary">
                The stage is set, but you can still make last-second changes.
              </p>
              
              <div className="flex items-center justify-center gap-spacing-lg">
                <NavItem 
                  variant="icon+text-secondary"
                  label="Change Story Settings"
                  icon={
                    <span className="w-8 h-8 flex items-center justify-center rounded-full bg-primary hover:opacity-80">
                      <IconSettings className="w-4 h-4" />
                    </span>
                  }
                  onClick={() => setSettingsModalOpen(true)} 
                />
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Modals */}
      <StorySettingsModal
        open={isSettingsModalOpen}
        onClose={() => setSettingsModalOpen(false)}
      />
    </div>
  );
};

export default PlayOnboardPage;
