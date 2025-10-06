import React from 'react';
import { useParams } from 'react-router-dom';

export const StoryDetailsPage: React.FC = () => {
  const { slug } = useParams<{ slug: string }>();

  return (
    <div className="flex flex-col space-y-12 overflow-y-auto no-scrollbar">
      <div className="mx-auto w-full md:max-w-3xl lg:max-w-5xl px-12 py-8">
        <div className="rounded-card bg-primary/5 text-accent text-lg text-center py-16">
          StoryHeader — StoryTitle, AuthorName, Genres, Year, PlayCount, Rating, Headline, Description
        </div>

        <div className="rounded-card bg-primary/5 text-accent text-lg text-center py-16">
          CharacterCarousel — CharacterCard elements in carousel
        </div>

        <div className="rounded-card bg-primary/5 text-accent text-lg text-center py-16">
          StoryHighlights — “What is the Story?” Original, Modern, etc. collapsible info
        </div>

        <div className="rounded-card bg-primary/5 text-accent text-lg text-center py-16">
          StoryHowToPlay — thematic step-by-step HowToPlayCard components
        </div>

        <div className="rounded-card bg-primary/5 text-accent text-lg text-center py-16">
          WantToPlay — character-based call-to-action section
        </div>

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
