import React from 'react';
import { useParams } from 'react-router-dom';
import { useStoryBySlug } from '../hooks/useStoryBySlug';
import { useSaveStory } from '../hooks/useSaveStory';
import { useAuth } from '../hooks/useAuth';

export const StoryHeader: React.FC = () => {
  const { slug } = useParams<{ slug: string }>();
  const { data: story, loading, error } = useStoryBySlug(slug);
  const { isSaved, loading: saveLoading, toggleSave, ToastComponent } = useSaveStory(slug || '');
  const { user } = useAuth();

  if (loading) return <p className="text-body text-text-tertiary">Loading story...</p>;
  if (error) return <p className="text-body text-text-tertiary">Error loading story.</p>;
  if (!story) return <p className="text-body text-text-tertiary">Story not found.</p>;

  return (
    <>
      <div className="flex flex-col space-y-8 text-left md:text-left">
      {/* Upper Section: Title + Metadata */}
      <div className="flex flex-col space-y-2">
        {/* Title */}
        <h1 className="font-serif text-hero text-accent">
          {story.title}
        </h1>

        {/* Metadata Row */}
        <div className="flex flex-wrap items-center justify-left md:justify-start gap-x-4 gap-y-4 md:gap-x-12 md:gap-y-4">
          <div className="font-mono text-label text-text-tertiary flex items-center gap-2">
            <span>✍️</span>
            <span className="font-mono text-caption text-text-tertiary">
              by {story.authorName}
            </span>
          </div>

          <div className="font-mono text-label text-text-tertiary flex items-center gap-2">
            <span>🎭</span>
            <span className="font-mono text-caption text-text-tertiary">
              {story.genres.join(', ')}
            </span>
          </div>

          <div className="font-mono text-label text-text-tertiary flex items-center gap-2">
            <span>📒</span>
            <span className="font-mono text-caption text-text-tertiary">
              {story.publishedYear}
            </span>
          </div>

          <div className="font-mono text-label text-text-tertiary flex items-center gap-2">
            <span className="inline-block transform scale-x-[-1]">👀</span>
            <span className="font-mono text-caption text-text-tertiary">
              {story.stats.totalPlayed.toLocaleString()}
            </span>
          </div>

          <div className="font-mono text-label text-text-accent flex items-center gap-2">
            <span className="text-accent font-sans text-body">★</span>
            <span className="font-mono text-caption text-text-tertiary">
              {story.stats.avgRating}
            </span>
          </div>

          {/* Save toggle */}
          {/* 👀 Hidden for visitors (requires auth) */}
          {user && (
            <button
              onClick={toggleSave}
              disabled={saveLoading}
              className="font-mono text-caption text-text-tertiary flex items-center gap-2 hover:text-text-tertiary/50 transition-all duration-150 disabled:opacity-50"
              title={isSaved ? "Remove from saved stories" : "Save this story"}
            >
              <span className="transition-transform duration-200">
                🔖
              </span>
              <span className="font-mono text-caption text-text-tertiary hover:text-text-tertiary/50 transition-all duration-150 disabled:opacity-50">
                {isSaved ? "Saved" : "Save"}
              </span>
            </button>
          )}

          <span
            className="font-mono text-caption text-text-tertiary flex items-center gap-2 hover:text-text-tertiary/50 transition-colors duration-150 cursor-pointer"
            title="Share this story"
          >
            <span className="transition-transform duration-200">🔗</span>
            <span>Share</span>
          </span>
        </div>
      </div>

      {/* Lower Section: Headline + Description */}
      <div className="flex flex-col space-y-2">
        <p className="font-sans text-heading text-text-tertiary">
          {story.headline}
        </p>
        <p className="font-sans text-body text-text-tertiary">
          {story.description}
        </p>
      </div>
      {ToastComponent}
      </div>
    </>
  );
};

export default StoryHeader;
