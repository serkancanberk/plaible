import { useState, useCallback, useRef, useEffect } from 'react';
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

// Minimal response shape for fetching a story by slug
interface StoryDetailsResponse {
  _id?: string;
  characters?: Array<{
    id?: string;
    _id?: string;
    slug?: string;
    name: string;
    displayName?: string;
  }>;
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
  const apiCalledRef = useRef(false);
  const apiSuccessRef = useRef(false);
  const instanceIdRef = useRef<string>(`useStorySession#${Math.random().toString(36).slice(2)}`);
  
  // Get route parameters
  const { storySlug, characterSlug } = useParams<{ storySlug: string; characterSlug: string }>();
  
  // Get context values with defensive check
  const { selectedToneStyle, selectedTimeFlavor } = useStorySettingsContext() || {};

  const startSession = useCallback(async () => {
    setIsLoading(true);
    setError(null);

    try {
      console.log('[SESSION_TRACE][START_CALL]', {
        storySlug,
        characterSlug,
        toneStyle: selectedToneStyle?.id,
        timeFlavor: selectedTimeFlavor?.id,
      });
      apiCalledRef.current = true;
      // Ensure required route params exist before proceeding
      if (!storySlug || !characterSlug) {
        const missingMsg = 'Missing story or character in the URL. Please navigate from the story page.';
        alert(missingMsg);
        throw new Error(missingMsg);
      }
      // 1️⃣ Resolve story & character IDs first
      const story = await fetchJson<StoryDetailsResponse>(`/api/stories/${storySlug}`);
      try {
        console.log('[SESSION_TRACE][FETCH_STORY_RESPONSE]', {
          type: typeof story,
          keys: story && typeof story === 'object' ? Object.keys(story as any) : [],
          hasCharacters: Array.isArray((story as any)?.characters),
          charactersCount: Array.isArray((story as any)?.characters) ? (story as any).characters.length : 0,
        });
      } catch {}
      
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

      try {
        console.log('[SESSION_TRACE][START_RESPONSE_BODY]', response);
      } catch {}

      // Normalize potential nested API shapes like { data: {...} } or { result: {...} }
      const normalized: any = (response as any)?.data ?? (response as any)?.result ?? response;

      console.log('[SESSION_TRACE][API_RESPONSE]', {
        hasData: !!(response as any)?.data,
        hasResult: !!(response as any)?.result,
        normalizedKeys: Object.keys(normalized || {}),
      });

      if (!normalized?.ok) {
        throw new Error('Failed to start session');
      }

      // Diagnostics: log response keys and structure
      try {
        console.log('[USE_STORY_SESSION][START_RESPONSE]', {
          keys: Object.keys(normalized || {}),
          storyKeys: Object.keys(normalized?.story || {}),
          hasCharacterInStory: !!(normalized as any)?.story?.character,
        });
      } catch {}

      // Fallback mapping: ensure story.character exists even if API omits it
      const responseStory = normalized.story || ({ title: '', slug: '' } as any);
      const fallbackCharacter = ((): { id: string; name: string; displayName: string } | undefined => {
        if ((responseStory as any)?.character) return (responseStory as any).character;
        const c: any = character;
        if (c) {
          return {
            id: String(c.id || c._id || ''),
            name: String(c.name || ''),
            displayName: String(c.displayName || c.name || ''),
          };
        }
        return { id: 'unknown', name: 'Unknown', displayName: 'Unknown' };
      })();

      try {
        const usedResponseCharacter = !!(responseStory as any)?.character;
        const usedLookupCharacter = !usedResponseCharacter && !!character;
        const usedUnknownCharacter = !usedResponseCharacter && !character;
        if (usedLookupCharacter || usedUnknownCharacter) {
          console.log('[SESSION_TRACE][CHARACTER_FALLBACK_USED]', {
            usedLookupCharacter,
            usedUnknownCharacter,
          });
        }
      } catch {}

      const sessionData: StorySession = {
        sessionId: normalized.sessionId,
        firstMessage: normalized.firstMessage,
        story: {
          ...(responseStory as any),
          character: fallbackCharacter as any,
        },
        settings: normalized.settings
      };

      setSession(sessionData);
      apiSuccessRef.current = true;
      try {
        console.log('[SESSION_TRACE][SET_SESSION]', {
          title: sessionData?.story?.title,
          character: sessionData?.story?.character,
          keys: Object.keys(sessionData || {}),
        });
      } catch {}
      return sessionData;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to start session';
      setError(errorMessage);
      apiSuccessRef.current = false;
      throw err;
    } finally {
      setIsLoading(false);
    }
  }, [storySlug, characterSlug, selectedToneStyle, selectedTimeFlavor]);

  // Observe session state commits
  useEffect(() => {
    try {
      if (session) {
        console.log('[SESSION_TRACE][SESSION_STATE_AFTER_SET]', {
          instance: instanceIdRef.current,
          sessionId: session?.sessionId,
          storyTitle: session?.story?.title,
          characterDisplayName: session?.story?.character?.displayName,
        });
      }
    } catch {}
  }, [session]);

  const clearSession = useCallback(() => {
    setSession(null);
    setError(null);
  }, []);

  return {
    session,
    startSession,
    clearSession,
    isLoading,
    error,
    isReady: !!session?.story?.character,
    instanceIdRef,
  };
};

// Hydration summary logging whenever session changes inside this module's hook instances
export const __logSessionHydration = (session: StorySession | null, apiCalled: boolean, apiSuccess: boolean) => {
  console.log('[SESSION_HYDRATION_REPORT]', {
    apiCalled,
    apiSuccess,
    sessionSet: !!session,
    storyExists: !!session?.story,
    characterExists: !!session?.story?.character,
  });
};
