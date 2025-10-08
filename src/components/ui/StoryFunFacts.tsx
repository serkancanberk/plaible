import React, { useState } from "react";

// Types for fun facts
export type FactItem = { title: string; description: string };

export type FunFacts = {
  storyFacts: FactItem[];
  authorInfo: FactItem[];
  modernEcho: FactItem[];
};

type Props = { funFacts?: FunFacts };

const SectionRow: React.FC<{
  id: string;
  title: string;
  facts: FactItem[] | undefined;
  defaultOpen?: boolean;
}> = ({ id, title, facts, defaultOpen = true }) => {
  const [expandedFacts, setExpandedFacts] = useState<Set<number>>(new Set());
  const hasFacts = !!facts && facts.length > 0;

  const toggleFact = (index: number) => {
    const newExpanded = new Set(expandedFacts);
    if (newExpanded.has(index)) {
      newExpanded.delete(index);
    } else {
      newExpanded.add(index);
    }
    setExpandedFacts(newExpanded);
  };

  return (
    <div className="mt-spacing-lg pb-spacing-md">
      <h3 className="font-sans text-body text-accent mb-4">{title}</h3>
      <div className="gap-spacing-sm flex flex-col">
        {hasFacts ? (
          facts!.map((fact, index) => (
            <div key={`${id}-${index}`} className="border-b border-primary">
              <button
                onClick={() => toggleFact(index)}
                className="w-full py-spacing-sm text-left flex items-center justify-between"
                aria-expanded={expandedFacts.has(index)}
                aria-controls={`${id}-${index}`}
              >
                <span className="font-sans text-body text-text-tertiary">{fact.title}</span>
                <svg
                  className={`w-4 h-4 text-text-tertiary transition-transform duration-200 ${
                    expandedFacts.has(index) ? 'rotate-180' : ''
                  }`}
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                </svg>
              </button>
              {expandedFacts.has(index) && (
                <div
                  id={`${id}-${index}`}
                  className="px-spacing-sm pb-spacing-sm"
                  role="region"
                  aria-labelledby={`${id}-title-${index}`}
                >
                  <p className="font-sans text-body text-text-tertiary">{fact.description}</p>
                </div>
              )}
            </div>
          ))
        ) : (
          <div className="font-sans text-body text-text-tertiary/70">
            No facts yet.
          </div>
        )}
      </div>
    </div>
  );
};

const StoryFunFacts: React.FC<Props> = ({ funFacts }) => {
  // Defensive defaults
  const facts = funFacts ?? {
    storyFacts: [],
    authorInfo: [],
    modernEcho: [],
  };

  return (
    <div className="mt-spacing-xl">
      {/* Heading */}
      <div className="mt-spacing-lg pb-spacing-md pt-spacing-lg">
        <h2>
          <span className="font-sans text-heading text-text-tertiary">
            Do you{" "}
          </span>
          <span className="font-mono text-heading text-accent">know?</span>
        </h2>
      </div>

      {/* Subheading + Description */}
      <div className="mt-spacing-lg pb-spacing-md">
        <h3 className="font-sans text-body text-accent">
          Uncover What's Beneath the Lines
        </h3>
        <p className="font-sans text-body text-text-tertiary mt-2 border-b border-primary pb-spacing-sm">
          Look closer. Each tale carries secrets, insights, and meanings that
          reveal themselves only to curious readers like you.
        </p>
      </div>

      {/* Story Facts */}
      <SectionRow
        id="story-facts"
        title="Story Facts"
        facts={facts.storyFacts}
        defaultOpen
      />

      {/* Author Information */}
      <SectionRow
        id="author-info"
        title="Author Information"
        facts={facts.authorInfo}
      />

      {/* Modern Echo */}
      <SectionRow
        id="modern-echo"
        title="Modern Echo"
        facts={facts.modernEcho}
      />
    </div>
  );
};

export default StoryFunFacts;
