// src/admin/components/storyrunner/BriefTab.tsx
import React, { useState, useEffect } from 'react';
import { adminApi, Brief } from '../../api';
import { Spinner } from '../Spinner';
import { ErrorMessage } from '../ErrorMessage';
import { useToast } from '../Toast';

export const BriefTab: React.FC = () => {
  const { showToast } = useToast();
  
  const [brief, setBrief] = useState<Brief | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  // Form state
  const [whatIsPlaible, setWhatIsPlaible] = useState('');
  const [howToPlay, setHowToPlay] = useState('');
  const [storyrunnerRole, setStoryrunnerRole] = useState('');

  useEffect(() => {
    const loadBrief = async () => {
      try {
        const response = await adminApi.getBrief();
        if (response?.ok && response.brief) {
          setBrief(response.brief);
          setWhatIsPlaible(response.brief.whatIsPlaible);
          setHowToPlay(response.brief.howToPlay);
          setStoryrunnerRole(response.brief.storyrunnerRole);
        } else {
          setError('Failed to load brief data');
        }
      } catch (err: unknown) {
        console.error('Failed to load brief:', err);
        setError((err as Error)?.message || 'Failed to load brief data');
      } finally {
        setLoading(false);
      }
    };

    loadBrief();
  }, []);

  const handleSave = async () => {
    if (!brief) return;

    setSaving(true);
    try {
      const response = await adminApi.updateBrief({
        title: brief.title,
        whatIsPlaible: whatIsPlaible.trim(),
        howToPlay: howToPlay.trim(),
        storyrunnerRole: storyrunnerRole.trim()
      });

      if (response?.ok && response.brief) {
        setBrief(response.brief);
        showToast('Brief updated successfully', 'success');
      } else {
        showToast('Failed to update brief', 'error');
      }
    } catch (err: unknown) {
      console.error('Failed to save brief:', err);
      showToast('Failed to save brief', 'error');
    } finally {
      setSaving(false);
    }
  };

  const handleReset = () => {
    if (brief) {
      setWhatIsPlaible(brief.whatIsPlaible);
      setHowToPlay(brief.howToPlay);
      setStoryrunnerRole(brief.storyrunnerRole);
    }
  };

  const hasChanges = brief && (
    whatIsPlaible !== brief.whatIsPlaible ||
    howToPlay !== brief.howToPlay ||
    storyrunnerRole !== brief.storyrunnerRole
  );

  if (loading) {
    return (
      <div className="p-6">
        <div className="flex items-center justify-center py-12">
          <Spinner />
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-6">
        <ErrorMessage title="Error Loading Brief" message={error} />
      </div>
    );
  }

  return (
    <div className="p-6">
      <div className="mb-6">
        <h2 className="text-xl font-semibold text-gray-900 mb-2">Brief Content</h2>
        <p className="text-gray-600">
          Manage the content that appears in the Brief tab of the StoryRunner AI Dashboard.
        </p>
      </div>

      <div className="space-y-6">
        {/* What's Plaible Section */}
        <div>
          <label htmlFor="whatIsPlaible" className="block text-sm font-medium text-gray-700 mb-2">
            What's Plaible?
          </label>
          <input
            type="text"
            id="whatIsPlaible"
            value={whatIsPlaible}
            onChange={(e) => setWhatIsPlaible(e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            placeholder="Enter a brief description of what Plaible is..."
          />
          <p className="mt-1 text-xs text-gray-500">
            A concise description of what Plaible is and what it does.
          </p>
        </div>

        {/* How to Play Section */}
        <div>
          <label htmlFor="howToPlay" className="block text-sm font-medium text-gray-700 mb-2">
            How to Play?
          </label>
          <input
            type="text"
            id="howToPlay"
            value={howToPlay}
            onChange={(e) => setHowToPlay(e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            placeholder="Enter instructions on how to play..."
          />
          <p className="mt-1 text-xs text-gray-500">
            Simple instructions explaining how users can start playing.
          </p>
        </div>

        {/* Storyrunner Role Section */}
        <div>
          <label htmlFor="storyrunnerRole" className="block text-sm font-medium text-gray-700 mb-2">
            Role of Storyrunner AI
          </label>
          <textarea
            id="storyrunnerRole"
            value={storyrunnerRole}
            onChange={(e) => setStoryrunnerRole(e.target.value)}
            rows={8}
            className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            placeholder="Enter the detailed role description for the Storyrunner AI..."
          />
          <p className="mt-1 text-xs text-gray-500">
            Detailed description of the AI's role, capabilities, and behavior. Supports Markdown formatting.
          </p>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center justify-between pt-6 border-t border-gray-200">
          <div className="flex items-center space-x-3">
            <button
              onClick={handleSave}
              disabled={saving || !hasChanges}
              className="px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {saving ? 'Saving...' : 'Save Changes'}
            </button>
            
            {hasChanges && (
              <button
                onClick={handleReset}
                disabled={saving}
                className="px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50"
              >
                Reset
              </button>
            )}
          </div>

          {brief && (
            <div className="text-xs text-gray-500">
              Last updated: {new Date(brief.lastUpdated).toLocaleString()}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
