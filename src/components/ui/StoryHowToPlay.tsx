import React from 'react';
import HowToPlayCard from './HowToPlayCard';

export const StoryHowToPlay: React.FC = () => {
  return (
    <div className="mt-spacing-xl">
      <div className="mt-spacing-lg pb-spacing-md pt-spacing-lg">
        <h2>
          <span className="font-sans text-heading text-text-tertiary">How to </span>
          <span className="font-mono text-heading text-accent">play?</span>
        </h2>
      </div>

      <div className="mt-spacing-lg pb-spacing-md">
        <h3 className="font-sans text-body text-accent">Step into the story, one choice at a time.</h3>
        <p className="font-sans text-body text-text-tertiary mt-2 border-b border-primary pb-spacing-sm">
          Pick a role, type your choices, and watch the world bend around your words. Every turn is a new path. No repeats. No limits.
        </p>
      </div>

      <div className="mt-spacing-lg pb-spacing-md">
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-spacing-lg">
          <HowToPlayCard
            image="/assets/howtoplay/HowToPlay_Female_01.png"
            title="Pick a Role"
            description="Choose who you want to be: hero, villain, or someone in between."
            step={1}
            className="h-full"
          />

          <HowToPlayCard
            image="/assets/howtoplay/HowToPlay_Female_02.png"
            title="Shape the World"
            description="Every word you type expands the story and changes what happens next."
            step={2}
            className="h-full"
          />

          <HowToPlayCard
            image="/assets/howtoplay/HowToPlay_Female_03.png"
            title="Live your Epilogue"
            description="The Storyrunner AI adapts, the world reacts, and no two journeys are ever the same."
            step={3}
            className="h-full"
          />
        </div>
      </div>
    </div>
  );
};
