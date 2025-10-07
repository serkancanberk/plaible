import React, { useState } from 'react';

interface StoryHighlightsProps {
  summary: {
    original: string;
    modern: string;
    highlights: Array<{ title: string; description: string }>;
  };
  hooks?: string[];
  publishedYear: number;
}

export const StoryHighlights: React.FC<StoryHighlightsProps> = ({ summary, hooks, publishedYear }) => {
  const [expandedHighlights, setExpandedHighlights] = useState<Set<number>>(new Set());

  const toggleHighlight = (index: number) => {
    const newExpanded = new Set(expandedHighlights);
    if (newExpanded.has(index)) {
      newExpanded.delete(index);
    } else {
      newExpanded.add(index);
    }
    setExpandedHighlights(newExpanded);
  };

  return (
    <div className="mt-spacing-xl">
      <div className="mt-spacing-lg pb-spacing-md pt-spacing-lg">
      <h2> <span className="font-sans text-heading text-text-tertiary">What is the </span><span className="font-mono text-heading text-accent">story?</span></h2>
      </div>
      {/* Original Summary */}
      <div className="mt-spacing-lg pb-spacing-md">
        <h3 className="font-sans text-body text-accent">Original ({publishedYear})</h3>
        <p className="font-sans text-body text-text-tertiary mt-2 border-b border-primary pb-spacing-sm">{summary.original}</p>
      </div>

      {/* Modern Summary */}
      <div className="mt-spacing-lg pb-spacing-md">
        <h3 className="font-sans text-body text-accent">Modern (Today)</h3>
        <p className="font-sans text-body text-text-tertiary mt-2 border-b border-primary pb-spacing-sm">{summary.modern}</p>
      </div>

      {/* Story Hooks */}
      {hooks && hooks.length > 0 && (
        <div className="mt-spacing-lg pb-spacing-md">
          <p className="font-sans text-body text-accent">Themes & Motifs</p>
          <div className="flex flex-wrap gap-spacing-sm mt-spacing-sm">
            {hooks.map((hook, index) => (
              <span
                key={index}
                className="px-6 py-2 rounded-full bg-text-tertiary/10 font-sans text-label text-text-tertiary border border-text-tertiary/20"
              >
                {hook}
              </span>
            ))}
          </div>
        </div>
      )}

      {/* Highlights */}
      {summary.highlights.length > 0 && (
        <div className="mt-spacing-lg pb-spacing-md">
          <h3 className="font-sans text-body text-accent mb-4">Key Moments</h3>
          <div className="gap-spacing-sm flex flex-col">
            {summary.highlights.map((highlight, index) => (
              <div key={index} className="border-b border-primary">
                <button
                  onClick={() => toggleHighlight(index)}
                  className="w-full py-spacing-sm text-left flex items-center justify-between"
                  aria-expanded={expandedHighlights.has(index)}
                  aria-controls={`highlight-${index}`}
                >
                  <span className="font-sans text-body text-text-tertiary">{highlight.title}</span>
                  <svg
                    className={`w-4 h-4 text-text-tertiary transition-transform duration-200 ${
                      expandedHighlights.has(index) ? 'rotate-180' : ''
                    }`}
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                  </svg>
                </button>
                {expandedHighlights.has(index) && (
                  <div
                    id={`highlight-${index}`}
                    className="px-spacing-sm pb-spacing-sm"
                    role="region"
                    aria-labelledby={`highlight-title-${index}`}
                  >
                    <p className="font-sans text-body text-text-tertiary">{highlight.description}</p>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};
