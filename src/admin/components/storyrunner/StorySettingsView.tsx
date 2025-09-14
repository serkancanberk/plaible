// src/admin/components/storyrunner/StorySettingsView.tsx
import React, { useState, useEffect } from 'react';
import { Spinner } from '../Spinner';
import { ErrorMessage } from '../ErrorMessage';
import { useToast } from '../Toast';
import { adminApi, StorySettings, StorySetting } from '../../api';

export const StorySettingsView: React.FC = () => {
  const [settings, setSettings] = useState<StorySettings | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [editing, setEditing] = useState(false);
  const [editedSettings, setEditedSettings] = useState<StorySettings | null>(null);
  const { showToast } = useToast();

  useEffect(() => {
    loadSettings();
  }, []);

  const loadSettings = async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await adminApi.getStorySettings();
      if (response.ok) {
        setSettings(response.settings);
        setEditedSettings(response.settings);
      } else {
        setError('Failed to load story settings');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load story settings');
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    if (!editedSettings) return;

    try {
      setLoading(true);
      const response = await adminApi.updateStorySettings(editedSettings);
      if (response.ok) {
        setSettings(response.settings);
        setEditedSettings(response.settings);
        setEditing(false);
        showToast('Story settings updated successfully', 'success');
      } else {
        setError('Failed to update story settings');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to update story settings');
    } finally {
      setLoading(false);
    }
  };

  const handleCancel = () => {
    setEditedSettings(settings);
    setEditing(false);
  };

  const addToneStyle = () => {
    if (!editedSettings) return;
    const newStyle: StorySetting = {
      id: '',
      displayLabel: '',
      description: ''
    };
    setEditedSettings({
      ...editedSettings,
      tone_styles: [...editedSettings.tone_styles, newStyle]
    });
  };

  const removeToneStyle = (index: number) => {
    if (!editedSettings) return;
    setEditedSettings({
      ...editedSettings,
      tone_styles: editedSettings.tone_styles.filter((_, i) => i !== index)
    });
  };

  const updateToneStyle = (index: number, field: keyof StorySetting, value: string) => {
    if (!editedSettings) return;
    const updated = [...editedSettings.tone_styles];
    updated[index] = { ...updated[index], [field]: value };
    setEditedSettings({
      ...editedSettings,
      tone_styles: updated
    });
  };

  const addTimeFlavor = () => {
    if (!editedSettings) return;
    const newFlavor: StorySetting = {
      id: '',
      displayLabel: '',
      description: ''
    };
    setEditedSettings({
      ...editedSettings,
      time_flavors: [...editedSettings.time_flavors, newFlavor]
    });
  };

  const removeTimeFlavor = (index: number) => {
    if (!editedSettings) return;
    setEditedSettings({
      ...editedSettings,
      time_flavors: editedSettings.time_flavors.filter((_, i) => i !== index)
    });
  };

  const updateTimeFlavor = (index: number, field: keyof StorySetting, value: string) => {
    if (!editedSettings) return;
    const updated = [...editedSettings.time_flavors];
    updated[index] = { ...updated[index], [field]: value };
    setEditedSettings({
      ...editedSettings,
      time_flavors: updated
    });
  };

  if (loading && !settings) {
    return <Spinner />;
  }

  if (error) {
    return <ErrorMessage title="Error Loading Settings" message={error} />;
  }

  if (!settings) {
    return <ErrorMessage title="No Settings Found" message="No story settings found" />;
  }

  const currentSettings = editing ? editedSettings! : settings;

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold text-gray-900">Story Settings</h2>
        <div className="flex gap-2">
          {editing ? (
            <>
              <button
                onClick={handleSave}
                disabled={loading}
                className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50"
              >
                {loading ? 'Saving...' : 'Save Changes'}
              </button>
              <button
                onClick={handleCancel}
                disabled={loading}
                className="px-4 py-2 bg-gray-300 text-gray-700 rounded-md hover:bg-gray-400 disabled:opacity-50"
              >
                Cancel
              </button>
            </>
          ) : (
            <button
              onClick={() => setEditing(true)}
              className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
            >
              Edit Settings
            </button>
          )}
        </div>
      </div>

      <div className="bg-white rounded-lg shadow p-6">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Tone Styles */}
          <div>
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-semibold text-gray-900">Tone Styles</h3>
              {editing && (
                <button
                  onClick={addToneStyle}
                  className="px-3 py-1 bg-green-600 text-white text-sm rounded-md hover:bg-green-700"
                >
                  Add Tone Style
                </button>
              )}
            </div>
            <div className="space-y-3">
              {currentSettings.tone_styles.map((style, index) => (
                <div key={index} className="border rounded-lg p-4">
                  <div className="grid grid-cols-1 gap-3">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        ID
                      </label>
                      <input
                        type="text"
                        value={style.id}
                        onChange={(e) => editing && updateToneStyle(index, 'id', e.target.value)}
                        disabled={!editing}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:bg-gray-100"
                        placeholder="e.g., horror, comedy, drama"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Display Label
                      </label>
                      <input
                        type="text"
                        value={style.displayLabel}
                        onChange={(e) => editing && updateToneStyle(index, 'displayLabel', e.target.value)}
                        disabled={!editing}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:bg-gray-100"
                        placeholder="e.g., Horror, Comedy, Drama"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Description
                      </label>
                      <textarea
                        value={style.description || ''}
                        onChange={(e) => editing && updateToneStyle(index, 'description', e.target.value)}
                        disabled={!editing}
                        rows={2}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:bg-gray-100"
                        placeholder="Optional description of this tone style"
                      />
                    </div>
                  </div>
                  {editing && (
                    <div className="mt-3 flex justify-end">
                      <button
                        onClick={() => removeToneStyle(index)}
                        className="px-3 py-1 bg-red-600 text-white text-sm rounded-md hover:bg-red-700"
                      >
                        Remove
                      </button>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>

          {/* Time Flavors */}
          <div>
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-semibold text-gray-900">Time Flavors</h3>
              {editing && (
                <button
                  onClick={addTimeFlavor}
                  className="px-3 py-1 bg-green-600 text-white text-sm rounded-md hover:bg-green-700"
                >
                  Add Time Flavor
                </button>
              )}
            </div>
            <div className="space-y-3">
              {currentSettings.time_flavors.map((flavor, index) => (
                <div key={index} className="border rounded-lg p-4">
                  <div className="grid grid-cols-1 gap-3">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        ID
                      </label>
                      <input
                        type="text"
                        value={flavor.id}
                        onChange={(e) => editing && updateTimeFlavor(index, 'id', e.target.value)}
                        disabled={!editing}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:bg-gray-100"
                        placeholder="e.g., medieval, futuristic, modern"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Display Label
                      </label>
                      <input
                        type="text"
                        value={flavor.displayLabel}
                        onChange={(e) => editing && updateTimeFlavor(index, 'displayLabel', e.target.value)}
                        disabled={!editing}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:bg-gray-100"
                        placeholder="e.g., Medieval, Futuristic, Modern"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Description
                      </label>
                      <textarea
                        value={flavor.description || ''}
                        onChange={(e) => editing && updateTimeFlavor(index, 'description', e.target.value)}
                        disabled={!editing}
                        rows={2}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:bg-gray-100"
                        placeholder="Optional description of this time flavor"
                      />
                    </div>
                  </div>
                  {editing && (
                    <div className="mt-3 flex justify-end">
                      <button
                        onClick={() => removeTimeFlavor(index)}
                        className="px-3 py-1 bg-red-600 text-white text-sm rounded-md hover:bg-red-700"
                      >
                        Remove
                      </button>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Settings Metadata */}
        <div className="mt-8 pt-6 border-t border-gray-200">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Settings Metadata</h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Version
              </label>
              <input
                type="text"
                value={currentSettings.version}
                disabled
                className="w-full px-3 py-2 border border-gray-300 rounded-md bg-gray-100"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Active
              </label>
              <input
                type="checkbox"
                checked={currentSettings.isActive}
                disabled
                className="w-4 h-4 text-blue-600 bg-gray-100 border-gray-300 rounded"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Last Updated
              </label>
              <input
                type="text"
                value={new Date(currentSettings.lastUpdated).toLocaleString()}
                disabled
                className="w-full px-3 py-2 border border-gray-300 rounded-md bg-gray-100"
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
