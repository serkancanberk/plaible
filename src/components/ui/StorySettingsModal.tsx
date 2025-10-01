import React, { useState, useEffect } from 'react';
import BaseModal from './BaseModal';
import { useStorySettingsContext } from './storySettings/StorySettingsProvider';
import { StorySettingsDropdown } from './storySettings/StorySettingsDropdown';
import C2AButton from '../C2AButton';

type StorySettingsModalProps = {
  open: boolean;
  onClose: () => void;
};

const StorySettingsModal: React.FC<StorySettingsModalProps> = ({ open, onClose }) => {
  const {
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
    resetToDefaults
  } = useStorySettingsContext();

  const [localToneStyle, setLocalToneStyle] = useState<string | null>(null);
  const [localTimeFlavor, setLocalTimeFlavor] = useState<string | null>(null);
  const [showSuccess, setShowSuccess] = useState(false);
  const [autoCloseTimeout, setAutoCloseTimeout] = useState<NodeJS.Timeout | null>(null);

  // Initialize local state when modal opens
  useEffect(() => {
    if (open) {
      setLocalToneStyle(selectedToneStyle?.id || null);
      setLocalTimeFlavor(selectedTimeFlavor?.id || null);
      setShowSuccess(false);
    }
  }, [open, selectedToneStyle, selectedTimeFlavor]);

  // Auto-close modal after 3 seconds when success state is active
  useEffect(() => {
    if (showSuccess) {
      const timeout = setTimeout(() => {
        onClose();
      }, 3000);
      setAutoCloseTimeout(timeout);
      
      return () => {
        if (timeout) {
          clearTimeout(timeout);
        }
      };
    } else {
      // Clear timeout if success state is cleared
      if (autoCloseTimeout) {
        clearTimeout(autoCloseTimeout);
        setAutoCloseTimeout(null);
      }
    }
  }, [showSuccess, onClose]);

  // Cleanup timeout on unmount
  useEffect(() => {
    return () => {
      if (autoCloseTimeout) {
        clearTimeout(autoCloseTimeout);
      }
    };
  }, [autoCloseTimeout]);

  // Check if current selections differ from saved/default values
  const hasChanges = () => {
    const savedToneStyle = savedPreferences?.preferredToneStyle || availableToneStyles[0]?.id;
    const savedTimeFlavor = savedPreferences?.preferredTimeFlavor || availableTimeFlavors[0]?.id;
    
    return localToneStyle !== savedToneStyle || localTimeFlavor !== savedTimeFlavor;
  };

  const handleSave = async () => {
    if (localToneStyle && localTimeFlavor) {
      const selectedTone = availableToneStyles.find(style => style.id === localToneStyle);
      const selectedFlavor = availableTimeFlavors.find(flavor => flavor.id === localTimeFlavor);
      
      if (selectedTone) setSelectedToneStyle(selectedTone);
      if (selectedFlavor) setSelectedTimeFlavor(selectedFlavor);
      
      try {
        await savePreferences();
        setShowSuccess(true);
      } catch (error) {
        console.error('Failed to save preferences:', error);
      }
    }
  };

  const handleBackToOptions = () => {
    // Clear auto-close timeout
    if (autoCloseTimeout) {
      clearTimeout(autoCloseTimeout);
      setAutoCloseTimeout(null);
    }
    // Return to options screen
    setShowSuccess(false);
  };

  const handleReset = () => {
    // Reset to "Original" values (first option in each list)
    if (availableToneStyles.length > 0) {
      setLocalToneStyle(availableToneStyles[0].id);
    }
    if (availableTimeFlavors.length > 0) {
      setLocalTimeFlavor(availableTimeFlavors[0].id);
    }
  };

  return (
    <BaseModal
      open={open}
      onClose={onClose}
      title="STORY SETTINGS"
      subtitle="Pick your default style for every story."
      variant="accent"
    >
      {isLoading ? (
        <div className="flex items-center justify-center py-spacing-2xl">
          <div className="text-body text-primary">Loading settings...</div>
        </div>
      ) : error ? (
        <div className="p-spacing-md text-body text-alert bg-alert/10 rounded-card">
          Error loading settings: {error}
        </div>
      ) : showSuccess ? (
        <div className="space-y-spacing-md">
          <div className="p-spacing-md text-body text-success bg-success/10 rounded-card">
            Preferences saved successfully!
          </div>
          
          {/* Show selected values */}
          <div className="space-y-spacing-sm">
            <p className="text-body text-text-primary mt-spacing-sm">
              Time: {selectedTimeFlavor?.displayLabel}
            </p>
            <p className="text-body text-text-primary mt-spacing-sm">
              Theme: {selectedToneStyle?.displayLabel}
            </p>
          </div>
        </div>
      ) : (
        <div className="space-y-spacing-xl">
          {/* Time Dropdown */}
          <StorySettingsDropdown
            label="Time"
            options={availableTimeFlavors}
            selectedValue={localTimeFlavor}
            onSelect={setLocalTimeFlavor}
            placeholder="Select time period"
            disabled={isSaving}
            ariaLabel="Select Time Flavor"
          />

          {/* Theme Dropdown */}
          <StorySettingsDropdown
            label="Theme"
            options={availableToneStyles}
            selectedValue={localToneStyle}
            onSelect={setLocalToneStyle}
            placeholder="Select tone style"
            disabled={isSaving}
            ariaLabel="Select Tone Style"
          />
        </div>
      )}

      {/* Footer Actions */}
      <div className="flex items-center justify-between mt-spacing-xl pt-spacing-lg border-t border-primary/20">
        {showSuccess ? (
          <C2AButton
            variant="secondary"
            context="onAccent"
            onClick={handleBackToOptions}
            aria-label="Back to Time and Theme Options"
          >
            Back to Time and Theme Options
          </C2AButton>
        ) : (
          <>
            <C2AButton
              variant="ghost"
              context="onAccent"
              onClick={handleReset}
              disabled={isSaving}
              aria-label="Reset to Original"
            >
              Reset
            </C2AButton>
            
            <C2AButton
              variant={hasChanges() ? "primary" : "secondary"}
              context="onAccent"
              onClick={handleSave}
              disabled={isSaving || !hasChanges()}
              fullWidth
              className="ml-spacing-md"
              aria-label="Save Story Settings"
            >
              {isSaving ? 'Saving...' : 'Save'}
            </C2AButton>
          </>
        )}
      </div>
    </BaseModal>
  );
};

export default StorySettingsModal;
