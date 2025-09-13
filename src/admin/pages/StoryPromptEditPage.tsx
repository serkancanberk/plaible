// src/admin/pages/StoryPromptEditPage.tsx
import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { StoryPromptEditor } from '../components/storyEdit/StoryPromptEditor';
import { Spinner } from '../components/Spinner';
import { ErrorMessage } from '../components/ErrorMessage';
import { useToast } from '../components/Toast';
import { adminApi, AdminStory } from '../api';

export const StoryPromptEditPage: React.FC = () => {
  const { storyId } = useParams<{ storyId: string }>();
  const navigate = useNavigate();
  const { showToast } = useToast();
  
  const [story, setStory] = useState<AdminStory | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [promptValue, setPromptValue] = useState('');

  useEffect(() => {
    if (!storyId) {
      setError('Story ID is required');
      setLoading(false);
      return;
    }

    const loadStory = async () => {
      try {
        const response = await adminApi.getStory(storyId);
        if (response?.ok && response.story) {
          setStory(response.story);
          // Use storyPrompt first, fallback to systemPrompt for backward compatibility
          const prompt = response.story.storyrunner?.storyPrompt || 
                        response.story.storyrunner?.systemPrompt || '';
          setPromptValue(prompt);
        } else {
          setError('Story not found');
        }
      } catch (err: unknown) {
        console.error('Failed to load story:', err);
        setError((err as Error)?.message || 'Failed to load story');
      } finally {
        setLoading(false);
      }
    };

    loadStory();
  }, [storyId]);

  const handleSave = async () => {
    if (!story || !storyId) return;

    setSaving(true);
    try {
      await adminApi.updateStory(storyId, {
        storyrunner: {
          ...story.storyrunner,
          storyPrompt: promptValue,
          systemPrompt: promptValue // Keep both for backward compatibility
        }
      });
      
      showToast('Story prompt updated successfully', 'success');
      navigate('/storyrunner');
    } catch (err: unknown) {
      console.error('Failed to save story prompt:', err);
      showToast('Failed to save story prompt', 'error');
    } finally {
      setSaving(false);
    }
  };

  const handleCancel = () => {
    navigate('/storyrunner');
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <Spinner />
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <ErrorMessage title="Error" message={error} />
      </div>
    );
  }

  if (!story) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <ErrorMessage title="Story Not Found" message="The requested story could not be found." />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Edit Story Prompt</h1>
              <p className="mt-2 text-gray-600">
                Editing prompt template for: <span className="font-medium">{story.title}</span>
              </p>
            </div>
            <div className="flex space-x-3">
              <button
                onClick={handleCancel}
                disabled={saving}
                className="px-4 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50"
              >
                Cancel
              </button>
              <button
                onClick={handleSave}
                disabled={saving}
                className="px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50"
              >
                {saving ? 'Saving...' : 'Save Changes'}
              </button>
            </div>
          </div>
        </div>

        {/* Story Info */}
        <div className="mb-6 bg-white rounded-lg shadow p-6">
          <h3 className="text-lg font-medium text-gray-900 mb-4">Story Information</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700">Story ID</label>
              <p className="mt-1 text-sm text-gray-900 font-mono">{story._id}</p>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">Title</label>
              <p className="mt-1 text-sm text-gray-900">{story.title}</p>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">Category</label>
              <p className="mt-1 text-sm text-gray-900">{story.mainCategory}</p>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">Status</label>
              <p className="mt-1 text-sm text-gray-900">
                <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                  story.isActive 
                    ? 'bg-green-100 text-green-800' 
                    : 'bg-gray-100 text-gray-800'
                }`}>
                  {story.isActive ? 'Active' : 'Inactive'}
                </span>
              </p>
            </div>
          </div>
        </div>

        {/* Prompt Editor */}
        <div className="bg-white rounded-lg shadow p-6">
          <h3 className="text-lg font-medium text-gray-900 mb-4">Story Prompt Template</h3>
          <StoryPromptEditor
            value={promptValue}
            onChange={setPromptValue}
            placeholder="You are an AI storyteller for this story. Your role is to..."
            rows={15}
          />
        </div>

        {/* Current Prompt Info */}
        {story.storyrunner && (
          <div className="mt-6 bg-white rounded-lg shadow p-6">
            <h3 className="text-lg font-medium text-gray-900 mb-4">Current Configuration</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Opening Beats</label>
                <div className="text-sm text-gray-900">
                  {story.storyrunner.openingBeats && story.storyrunner.openingBeats.length > 0 ? (
                    <ul className="list-disc list-inside space-y-1">
                      {story.storyrunner.openingBeats.map((beat, index) => (
                        <li key={index}>{beat}</li>
                      ))}
                    </ul>
                  ) : (
                    <span className="text-gray-500 italic">No opening beats configured</span>
                  )}
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Guardrails</label>
                <div className="text-sm text-gray-900">
                  {story.storyrunner.guardrails && story.storyrunner.guardrails.length > 0 ? (
                    <ul className="list-disc list-inside space-y-1">
                      {story.storyrunner.guardrails.map((guardrail, index) => (
                        <li key={index}>{guardrail}</li>
                      ))}
                    </ul>
                  ) : (
                    <span className="text-gray-500 italic">No guardrails configured</span>
                  )}
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
