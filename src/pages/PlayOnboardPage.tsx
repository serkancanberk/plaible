import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { useStoryBySlug } from '../hooks/useStoryBySlug';
import { useUser } from '../hooks/useUser';
import StorySettingsModal from '../components/ui/modals/StorySettingsModal';
import ChangeCharacterModal from '../components/ui/modals/ChangeCharacterModal';
import C2AButton from '../components/C2AButton';
import NavItem from '../components/ui/NavItem';
import { AnimatedTitle } from '../components/ui/AnimatedTitle';
import CharacterCard from '../components/ui/CharacterCard';
import { CharacterCarousel } from '../components/ui/CharacterCarousel';
import IconSettings from 'virtual:icons/tabler/settings';
import { useStorySettingsContext } from '../components/ui/storySettings/StorySettingsProvider';

const PlayOnboardPage: React.FC = () => {
  const { storySlug, characterSlug } = useParams<{ storySlug: string; characterSlug: string }>();
  const navigate = useNavigate();
  const { data: story, loading: storyLoading, error: storyError } = useStoryBySlug(storySlug);
  const { data: user, loading: userLoading } = useUser();
  const { selectedToneStyle, selectedTimeFlavor } = useStorySettingsContext();
  const [isSettingsModalOpen, setSettingsModalOpen] = useState(false);
  const [showCharacterModal, setShowCharacterModal] = useState(false);
  const [showCharacterOverlay, setShowCharacterOverlay] = useState(false);
  const [isStarting, setIsStarting] = useState(false);
  
  // Derive settings from context
  const selectedSettings = {
    theme: selectedToneStyle?.displayLabel || 'Original',
    time: selectedTimeFlavor?.displayLabel || 'Original'
  };

  // Settings are now managed by StorySettingsProvider context


  // Handle ESC key for overlay
  useEffect(() => {
    const handleEsc = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setShowCharacterOverlay(false);
      }
    };
    window.addEventListener('keydown', handleEsc);
    return () => window.removeEventListener('keydown', handleEsc);
  }, []);

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

  const handleCharacterSelect = (characterId: string) => {
    setShowCharacterModal(false);
    setTimeout(() => {
      navigate(`/app/play/onboard/${storySlug}/${characterId}`);
    }, 150);
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
    <div className="flex flex-col justify-center items-center min-h-[calc(100vh-96px)] px-spacing-lg py-spacing-md">
      <AnimatePresence>
        {!isStarting && (
          <motion.div
            key="content"
            initial={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 8 }}
            transition={{ duration: 0.4, ease: "easeInOut" }}
          >
            {/* Main Grid Content - Height-Synchronized Layout */}
            <div className="grid grid-cols-1 md:grid-cols-[300px_1fr] items-stretch gap-spacing-lg md:gap-spacing-xl max-w-[1024px] mx-auto px-spacing-xl py-spacing-xl">
              {/* Left Column - Character Image */}
              <div className="flex justify-center md:justify-center items-stretch">
                <div className="w-[300px] h-full">
                  {/* Card uses canonical character name */}
                  <CharacterCard
                    id={character?.id || ''}
                    name={character?.name || 'Unknown Character'}
                    assets={character?.assets}
                    variant="image"
                  />
                </div>
              </div>

              {/* Right Column - Vertically Justified Content */}
              <div className="flex flex-col justify-between h-full py-spacing-md transition-all duration-300 ease-in-out">
                {/* Top Section: Title and Content */}
                <div className="flex flex-col gap-spacing-md">
                  {/* AnimatedTitle uses user-facing display name */}
                  <AnimatedTitle
                    userName={user?.identity?.firstName || "visitor"}
                    characterName={(character as any)?.displayName || character?.name || "the character"}
                  />

                  {(character as any)?.helloMessage && (
                    <p className="font-sans text-body text-text-secondary leading-snug">
                      {(character as any).helloMessage}
                    </p>
                  )}

                  {/* Story Content */}
                  {(character as any)?.onboardingText && (
                    <p className="font-serif text-subheading text-text-tertiary/90 leading-relaxed">
                      {(character as any).onboardingText}
                    </p>
                  )}

                  {!((character as any)?.onboardingText) && (
                    <p className="text-body text-text-tertiary/90 leading-relaxed">
                      {story?.summary?.original ||
                        story?.description ||
                        'The air is thick with promise, the world holding its breath for your first step.'}
                    </p>
                  )}
                </div>

                {/* Bottom Section: CTA and Summary */}
                <div className="flex flex-col gap-spacing-sm">
                  <C2AButton
                    variant="primary"
                    typography="body"
                    fullWidth
                    onClick={handleStart}
                  >
                    Start to play now
                  </C2AButton>

                  {/* Combined contextual information */}
                  <div className="text-caption text-text-secondary text-left mt-spacing-md space-y-spacing-sm">
                    <p>
                      You're about to experience this story as 
                      <span className="text-accent"> {character?.displayName || character?.name}</span>, 
                      in the <span className="text-accent">{selectedSettings.theme} Theme</span>, 
                      set in <span className="text-accent">{selectedSettings.time} Time</span>.
                    </p>
                    <p>
                      Want to change 
                      <button
                        onClick={() => setShowCharacterModal(true)}
                        className="ml-1 font-sans text-accent text-caption underline hover:brightness-110 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-accent"
                      >character</button> or 
                      <button
                        onClick={() => setSettingsModalOpen(true)}
                        className="ml-1 font-sans text-accent text-caption underline hover:brightness-110 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-accent"
                      >story settings</button> before starting?
                    </p>
                  </div>
                </div>
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
      
      {showCharacterModal && (
        <ChangeCharacterModal
          isOpen={showCharacterModal}
          onClose={() => setShowCharacterModal(false)}
          characters={story?.characters || []}
          onCharacterSelect={handleCharacterSelect}
        />
      )}

    </div>
  );
};

export default PlayOnboardPage;
