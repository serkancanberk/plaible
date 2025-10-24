import React from 'react';
import { fetchJson } from '../lib/http';

export interface StorySetting {
  id: string;
  displayLabel: string;
  description?: string;
}

export interface StorySettings {
  tone_styles: StorySetting[];
  time_flavors: StorySetting[];
}

export interface StorySettingsResponse {
  ok: boolean;
  settings: StorySettings;
}

export interface UserPreferences {
  preferredToneStyle: string;
  preferredTimeFlavor: string;
}

export interface UserPreferencesResponse {
  ok: boolean;
  preferences: UserPreferences | null;
}

export function useStorySettings() {
  const [data, setData] = React.useState<StorySettings | null>(null);
  const [userPreferences, setUserPreferences] = React.useState<UserPreferences | null>(null);
  const [loading, setLoading] = React.useState<boolean>(false);
  const [error, setError] = React.useState<Error | undefined>(undefined);

  React.useEffect(() => {
    const controller = new AbortController();
    setLoading(true);
    setError(undefined);

    // Load available settings
    fetchJson<StorySettingsResponse>('/api/story-settings/settings', {}, controller.signal)
      .then((response) => {
        if (response.ok) {
          setData(response.settings);
        } else {
          throw new Error('Failed to fetch story settings');
        }
      })
      .catch((err) => {
        if ((err as any)?.name === 'AbortError') return;
        setError(err as Error);
      })
      .finally(() => setLoading(false));

    return () => controller.abort();
  }, []);

  const loadUserPreferences = React.useCallback(async () => {
    try {
      const response = await fetchJson<UserPreferencesResponse>('/api/story-settings/user');
      if (response.ok) {
        setUserPreferences(response.preferences);
        return response.preferences;
      }
    } catch (err) {
      console.error('Failed to load user preferences:', err);
    }
    return null;
  }, []);

  const saveUserPreferences = React.useCallback(async (preferredToneStyle: string, preferredTimeFlavor: string) => {
    try {
      const response = await fetchJson<UserPreferencesResponse>('/api/story-settings/user', {
        method: 'PATCH',
        body: JSON.stringify({
          preferredToneStyle,
          preferredTimeFlavor
        })
      });

      if (response.ok) {
        setUserPreferences(response.preferences);
        return response.preferences;
      } else {
        throw new Error('Failed to save preferences');
      }
    } catch (err) {
      console.error('Failed to save user preferences:', err);
      throw err;
    }
  }, []);

  const refetch = React.useCallback(() => {
    // Trigger useEffect by changing a stable key
    setData(null);
    setError(undefined);
  }, []);

  return { 
    tone_styles: data?.tone_styles || [], 
    time_flavors: data?.time_flavors || [], 
    userPreferences,
    loading, 
    error, 
    refetch,
    loadUserPreferences,
    saveUserPreferences
  } as const;
}
