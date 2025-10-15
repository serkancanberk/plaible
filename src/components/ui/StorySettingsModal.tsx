import React, { useState, useEffect } from 'react';
import BaseModal from './BaseModal';
import { useStorySettingsContext } from './storySettings/StorySettingsProvider';
import { Dropdown } from './Dropdown';
import C2AButton from '../C2AButton';

type StorySettingsModalProps = {
  open: boolean;
  onClose: () => void;
  onSaveSettings?: (settings: { theme: string; time: string }) => void;
};

const StorySettingsModal: React.FC<StorySettingsModalProps> = ({ open, onClose, onSaveSettings }) => {
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

  // Auto-close modal after 5 seconds when success state is active
  useEffect(() => {
    if (showSuccess) {
      const timeout = setTimeout(() => {
        onClose();
      }, 5000);
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
        
        // Trigger callback AFTER async save completes with latest state values
        onSaveSettings?.({
          theme: selectedTone?.displayLabel || 'Original',
          time: selectedFlavor?.displayLabel || 'Original'
        });
        
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
      subtitle={showSuccess ? "Your story settings preferences saved successfully!" : "Pick your default style for every story."}
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
        <div className="space-y-spacing-lg">
          {/* Show selected values */}
          <div className="space-y-spacing-sm">
            <p className="text-body text-primary">
              Time: {selectedTimeFlavor?.displayLabel}
            </p>
            <p className="text-body text-primary">
              Theme: {selectedToneStyle?.displayLabel}
            </p>
          </div>
        </div>
      ) : (
        <div className="space-y-spacing-xl">
          {/* Time Dropdown */}
          <div className="space-y-spacing-sm">
            <label className="text-caption font-bold text-primary">
              Time
            </label>
            <Dropdown
              options={availableTimeFlavors.map(flavor => ({
                id: flavor.id,
                label: flavor.displayLabel,
                description: flavor.description
              }))}
              selectedId={localTimeFlavor || undefined}
              onSelect={setLocalTimeFlavor}
              placeholder="Select time period"
              disabled={isSaving}
              variant="withDescription"
              ariaLabel="Select Time Flavor"
            />
          </div>

          {/* Theme Dropdown */}
          <div className="space-y-spacing-sm">
            <label className="text-caption font-bold text-primary">
              Theme
            </label>
            <Dropdown
              options={availableToneStyles.map(style => ({
                id: style.id,
                label: style.displayLabel,
                description: style.description
              }))}
              selectedId={localToneStyle || undefined}
              onSelect={setLocalToneStyle}
              placeholder="Select tone style"
              disabled={isSaving}
              variant="withDescription"
              ariaLabel="Select Tone Style"
            />
          </div>
        </div>
      )}

      {/* Footer Actions */}
      <div className="flex items-center justify-between mt-spacing-xl pt-spacing-lg border-t border-primary/20">
        {showSuccess ? (
          <C2AButton
            variant="secondary"
            context="onAccent"
            onClick={handleBackToOptions}
            fullWidth
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
