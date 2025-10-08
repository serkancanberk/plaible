import React from 'react';
import { useParams } from 'react-router-dom';
import StoryHeader from '../components/StoryHeader';
import { CharacterCarousel } from '../components/ui/CharacterCarousel';
import { StoryHighlights } from '../components/ui/StoryHighlights';
import { StoryHowToPlay } from '../components/ui/StoryHowToPlay';
import { useStoryBySlug } from '../hooks/useStoryBySlug';

export const StoryDetailsPage: React.FC = () => {
  const { slug } = useParams<{ slug: string }>();
  const { data: story, loading, error } = useStoryBySlug(slug);

  if (loading) return <p className="text-body text-text-tertiary">Loading story...</p>;
  if (error) return <p className="text-body text-text-tertiary">Error loading story.</p>;
  if (!story) return <p className="text-body text-text-tertiary">Story not found.</p>;

  return (
    <div className="flex flex-col space-y-12 overflow-y-auto no-scrollbar">
      <div className="mx-auto w-full md:max-w-3xl lg:max-w-5xl px-4 py-8">
        <StoryHeader />

        <CharacterCarousel
          characters={(story.characters || []) as any}
          onPlay={(id) => console.log('Play as character:', id)}
        />

        <StoryHighlights
          summary={story.summary}
          hooks={story.hooks}
          publishedYear={story.publishedYear}
        />

        <StoryHowToPlay />

        {/* WantToPlay Section */}
        <section className="mt-spacing-xl">
          <div className="mt-spacing-lg pb-spacing-md pt-spacing-lg">
            <h2>
              <span className="font-sans text-heading text-text-tertiary">Want to </span>
              <span className="font-mono text-heading text-accent">play?</span>
            </h2>
          </div>

          <div className="mt-spacing-lg pb-spacing-md">
            <h3 className="font-sans text-body text-accent">Your turn to take the story forward.</h3>
            <p className="font-sans text-body text-text-tertiary mt-2 border-b border-primary pb-spacing-sm">
              Heroes, villains, dreamers, rebels. Who will you become this time?
            </p>
          </div>

          <div className="mt-spacing-lg pb-spacing-md">
            <CharacterCarousel
              characters={(story.characters || []) as any}
              onPlay={(id) => console.log('Play as character:', id)}
            />
          </div>
        </section>

        <div className="rounded-card bg-primary/5 text-accent text-lg text-center py-16">
          WhatPeopleAreSaying — user feedbacks in chronological order
        </div>

        <div className="rounded-card bg-primary/5 text-accent text-lg text-center py-16">
          ReadyToPlay — similar to WantToPlay section (variant)
        </div>

        <div className="rounded-card bg-primary/5 text-accent text-lg text-center py-16">
          StoryFunFacts — fun facts from database about the story
        </div>

        <div className="rounded-card bg-primary/5 text-accent text-lg text-center py-16">
          ReadyToPlay
        </div>

        <div className="rounded-card bg-primary/5 text-accent text-lg text-center py-16">
          StoryExploreMore — suggestions for similar stories by genre/category
        </div>
      </div>
    </div>
  );
};
