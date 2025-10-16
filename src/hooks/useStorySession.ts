import { useState, useCallback } from 'react';
import { useParams } from 'react-router-dom';
import { fetchJson } from '../lib/http';
import { useStorySettingsContext } from '../components/ui/storySettings/StorySettingsProvider';

export interface StorySession {
  sessionId: string;
  firstMessage: {
    id: string;
    role: 'assistant';
    content: string;
    choices?: string[];
    metadata: {
      chapter: number;
      beat: number;
    };
  };
  story: {
    title: string;
    slug: string;
    character: {
      id: string;
      name: string;
      displayName: string;
    };
  };
  settings: {
    toneStyle: string;
    timeFlavor: string;
  };
}

export interface StartSessionParams {
  storySlug: string;
  characterId: string;
  toneStyleId: string;
  timeFlavorId: string;
}

export const useStorySession = () => {
  const [session, setSession] = useState<StorySession | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  // Get route parameters
  const { storySlug, characterSlug } = useParams<{ storySlug: string; characterSlug: string }>();
  
  // Get context values with defensive check
  const { selectedToneStyle, selectedTimeFlavor } = useStorySettingsContext() || {};

  const startSession = useCallback(async () => {
    setIsLoading(true);
    setError(null);

    try {
      // 1️⃣ Resolve story & character IDs first
      const story = await fetchJson(`/api/stories/${storySlug}`);
      
      // Try multiple character lookup methods
      const character =
        story?.characters?.find(c => c.slug === characterSlug) ||
        story?.characters?.find(
          c => c.name.toLowerCase().replace(/\s+/g, '-') === characterSlug
        ) ||
        story?.characters?.find(
          c => c.name.toLowerCase().includes(characterSlug.replace('-', ' '))
        );

      if (!story?._id || !character?.id) {
        const errorMessage = "Story data could not be resolved. Please reselect your character.";
        alert(errorMessage);
        throw new Error(errorMessage);
      }

      // Log which lookup method succeeded for debugging
      const lookupMethod = character.slug ? "slug" : "name fallback";
      console.log(`✅ Character resolved by: ${lookupMethod}`);

      // 2️⃣ Build payload using IDs instead of slugs
      const payload = {
        storySlug,
        characterId: character.id, // Use character.id, not characterSlug
        toneStyleId: selectedToneStyle?.id || "drama",
        timeFlavorId: selectedTimeFlavor?.id || "today",
      };

      console.log("🧠 Starting story session with payload:", payload);

      const response = await fetchJson<{
        ok: boolean;
        sessionId: string;
        firstMessage: {
          id: string;
          role: 'assistant';
          content: string;
          choices?: string[];
          metadata: {
            chapter: number;
            beat: number;
          };
        };
        story: {
          title: string;
          slug: string;
          character: {
            id: string;
            name: string;
            displayName: string;
          };
        };
        settings: {
          toneStyle: string;
          timeFlavor: string;
        };
      }>('/api/storyrunner/start', {
        method: 'POST',
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload)
      });

      if (!response.ok) {
        throw new Error('Failed to start session');
      }

      const sessionData: StorySession = {
        sessionId: response.sessionId,
        firstMessage: response.firstMessage,
        story: response.story,
        settings: response.settings
      };

      setSession(sessionData);
      return sessionData;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to start session';
      setError(errorMessage);
      throw err;
    } finally {
      setIsLoading(false);
    }
  }, [storySlug, characterSlug, selectedToneStyle, selectedTimeFlavor]);

  const clearSession = useCallback(() => {
    setSession(null);
    setError(null);
  }, []);

  return {
    session,
    startSession,
    clearSession,
    isLoading,
    error
  };
};
