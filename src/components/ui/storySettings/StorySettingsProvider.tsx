import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { fetchJson } from '../../../lib/http';

export interface StorySetting {
  id: string;
  displayLabel: string;
  description?: string;
}

export interface StorySettings {
  tone_styles: StorySetting[];
  time_flavors: StorySetting[];
}

export interface UserPreferences {
  preferredToneStyle: string;
  preferredTimeFlavor: string;
}

export interface StorySettingsContextType {
  selectedToneStyle: StorySetting | null;
  selectedTimeFlavor: StorySetting | null;
  availableToneStyles: StorySetting[];
  availableTimeFlavors: StorySetting[];
  savedPreferences: UserPreferences | null;
  isLoading: boolean;
  isSaving: boolean;
  error: string | null;
  setSelectedToneStyle: (style: StorySetting | null) => void;
  setSelectedTimeFlavor: (flavor: StorySetting | null) => void;
  savePreferences: () => Promise<void>;
  loadUserPreferences: () => Promise<void>;
  resetToDefaults: () => void;
}

const StorySettingsContext = createContext<StorySettingsContextType | undefined>(undefined);

export const useStorySettingsContext = () => {
  const context = useContext(StorySettingsContext);
  if (!context) {
    console.warn("⚠️ StorySettingsProvider is missing in the React tree!");
    console.warn("⚠️ Make sure StoryRunnerPage is wrapped with StorySettingsProvider");
    throw new Error('useStorySettingsContext must be used within a StorySettingsProvider');
  }
  return context;
};

interface StorySettingsProviderProps {
  children: ReactNode;
}

export const StorySettingsProvider: React.FC<StorySettingsProviderProps> = ({ children }) => {
  const [selectedToneStyle, setSelectedToneStyle] = useState<StorySetting | null>(null);
  const [selectedTimeFlavor, setSelectedTimeFlavor] = useState<StorySetting | null>(null);
  const [availableToneStyles, setAvailableToneStyles] = useState<StorySetting[]>([]);
  const [availableTimeFlavors, setAvailableTimeFlavors] = useState<StorySetting[]>([]);
  const [savedPreferences, setSavedPreferences] = useState<UserPreferences | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // localStorage helpers
  const STORAGE_KEY = 'storySettings';

  const loadFromLocalStorage = (): UserPreferences | null => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) {
        const parsed = JSON.parse(stored);
        if (parsed.preferredToneStyle && parsed.preferredTimeFlavor) {
          return parsed;
        }
      }
    } catch (err) {
      console.warn('Failed to load story settings from localStorage:', err);
    }
    return null;
  };

  const saveToLocalStorage = (preferences: UserPreferences) => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(preferences));
    } catch (err) {
      console.warn('Failed to save story settings to localStorage:', err);
    }
  };

  const getDefaultPreferences = (): UserPreferences => {
    // Find "original" options from available settings
    const originalToneStyle = availableToneStyles.find(style => 
      style.id.toLowerCase().includes('original') || 
      style.displayLabel.toLowerCase().includes('original')
    );
    const originalTimeFlavor = availableTimeFlavors.find(flavor => 
      flavor.id.toLowerCase().includes('original') || 
      flavor.displayLabel.toLowerCase().includes('original')
    );

    return {
      preferredToneStyle: originalToneStyle?.id || availableToneStyles[0]?.id || 'original',
      preferredTimeFlavor: originalTimeFlavor?.id || availableTimeFlavors[0]?.id || 'original'
    };
  };

  // Load available settings and user preferences on mount
  useEffect(() => {
    loadInitialData();
  }, []);

  const loadInitialData = async () => {
    setIsLoading(true);
    setError(null);

    try {
      // Load available settings (public)
      const settingsResponse = await fetchJson<{ ok: boolean; settings: StorySettings }>('/api/story-settings/settings');
      if (settingsResponse.ok) {
        setAvailableToneStyles(settingsResponse.settings.tone_styles);
        setAvailableTimeFlavors(settingsResponse.settings.time_flavors);
      }

      // Try to load user preferences from backend first
      let backendPreferences: UserPreferences | null = null;
      try {
        const preferencesResponse = await fetchJson<{ ok: boolean; preferences: UserPreferences | null }>('/api/story-settings/user');
        if (preferencesResponse.ok && preferencesResponse.preferences) {
          backendPreferences = preferencesResponse.preferences;
          setSavedPreferences(backendPreferences);
        }
      } catch (prefError) {
        console.log('No backend preferences found or user not authenticated');
      }

      // If no backend preferences, try localStorage
      if (!backendPreferences) {
        const localPreferences = loadFromLocalStorage();
        if (localPreferences) {
          setSavedPreferences(localPreferences);
          backendPreferences = localPreferences;
        }
      }

      // If still no preferences, use defaults
      if (!backendPreferences) {
        const defaultPrefs = getDefaultPreferences();
        setSavedPreferences(defaultPrefs);
        backendPreferences = defaultPrefs;
      }

      // Set selected values based on preferences (backend, localStorage, or defaults)
      if (backendPreferences) {
        const toneStyle = settingsResponse.settings.tone_styles.find(
          style => style.id === backendPreferences.preferredToneStyle
        );
        const timeFlavor = settingsResponse.settings.time_flavors.find(
          flavor => flavor.id === backendPreferences.preferredTimeFlavor
        );
        
        if (toneStyle) setSelectedToneStyle(toneStyle);
        if (timeFlavor) setSelectedTimeFlavor(timeFlavor);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load story settings');
    } finally {
      setIsLoading(false);
    }
  };

  const loadUserPreferences = async () => {
    try {
      const response = await fetchJson<{ ok: boolean; preferences: UserPreferences | null }>('/api/story-settings/user');
      if (response.ok) {
        setSavedPreferences(response.preferences);
        return response.preferences;
      }
    } catch (err) {
      console.error('Failed to load user preferences:', err);
    }
    return null;
  };

  const savePreferences = async () => {
    if (!selectedToneStyle || !selectedTimeFlavor) {
      setError('Please select both tone style and time flavor');
      return;
    }

    setIsSaving(true);
    setError(null);

    const preferences: UserPreferences = {
      preferredToneStyle: selectedToneStyle.id,
      preferredTimeFlavor: selectedTimeFlavor.id
    };

    // Always save to localStorage first (immediate persistence)
    saveToLocalStorage(preferences);
    setSavedPreferences(preferences);

    // Try to save to backend (optional, non-blocking)
    try {
      const response = await fetchJson<{ ok: boolean; preferences: UserPreferences }>('/api/story-settings/user', {
        method: 'PATCH',
        body: JSON.stringify(preferences)
      });

      if (response.ok) {
        // Update with backend response if successful
        setSavedPreferences(response.preferences);
        console.log('Preferences saved to backend successfully');
      } else {
        console.warn('Backend save failed, but preferences saved locally');
      }
    } catch (err) {
      // Backend save failed, but localStorage save succeeded
      console.warn('Backend save failed, but preferences saved locally:', err);
    } finally {
      setIsSaving(false);
    }
  };

  const resetToDefaults = () => {
    const defaultPrefs = getDefaultPreferences();
    
    // Find and set the default options
    const defaultToneStyle = availableToneStyles.find(
      style => style.id === defaultPrefs.preferredToneStyle
    );
    const defaultTimeFlavor = availableTimeFlavors.find(
      flavor => flavor.id === defaultPrefs.preferredTimeFlavor
    );
    
    if (defaultToneStyle) setSelectedToneStyle(defaultToneStyle);
    if (defaultTimeFlavor) setSelectedTimeFlavor(defaultTimeFlavor);
    
    // Update saved preferences and localStorage
    setSavedPreferences(defaultPrefs);
    saveToLocalStorage(defaultPrefs);
  };

  const contextValue: StorySettingsContextType = {
    selectedToneStyle,
    selectedTimeFlavor,
    availableToneStyles,
    availableTimeFlavors,
    savedPreferences,
    isLoading,
    isSaving,
    error,
    setSelectedToneStyle,
    setSelectedTimeFlavor,
    savePreferences,
    loadUserPreferences,
    resetToDefaults
  };

  return (
    <StorySettingsContext.Provider value={contextValue}>
      {children}
    </StorySettingsContext.Provider>
  );
};
