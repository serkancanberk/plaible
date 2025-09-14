// src/admin/pages/StoryPromptEditPage.tsx
import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { StoryPromptEditor } from '../components/storyEdit/StoryPromptEditor';
import { Spinner } from '../components/Spinner';
import { ErrorMessage } from '../components/ErrorMessage';
import { useToast } from '../components/Toast';
import { adminApi, Story, StorySettings } from '../api';
import { CollapsibleSection } from '../components/ui/CollapsibleSection';

export const StoryPromptEditPage: React.FC = () => {
  const { storyId } = useParams<{ storyId: string }>();
  const navigate = useNavigate();
  const { showToast } = useToast();
  
  const [story, setStory] = useState<Story | null>(null);
  const [storySettings, setStorySettings] = useState<StorySettings | null>(null);
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

    const loadData = async () => {
      try {
        // Load story and story settings in parallel
        const [storyResponse, settingsResponse] = await Promise.all([
          adminApi.getStory(storyId),
          adminApi.getStorySettings()
        ]);

        if (storyResponse?.ok && storyResponse.story) {
          setStory(storyResponse.story);
          // Use storyPrompt first, fallback to systemPrompt for backward compatibility
          const prompt = storyResponse.story.storyrunner?.storyPrompt || 
                        storyResponse.story.storyrunner?.systemPrompt || '';
          setPromptValue(prompt);
        } else {
          setError('Story not found');
        }

        if (settingsResponse?.ok && settingsResponse.settings) {
          setStorySettings(settingsResponse.settings);
        }
      } catch (err: unknown) {
        console.error('Failed to load data:', err);
        setError((err as Error)?.message || 'Failed to load data');
      } finally {
        setLoading(false);
      }
    };

    loadData();
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
          
          <CollapsibleSection title="Essentials" defaultOpen={true}>
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
                <label className="block text-sm font-medium text-gray-700">Sub Category</label>
                <p className="mt-1 text-sm text-gray-900">{story.subCategory || 'Not specified'}</p>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">Genres</label>
                <p className="mt-1 text-sm text-gray-900">{story.genres && story.genres.length > 0 ? story.genres.join(', ') : 'None'}</p>
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
              <div>
                <label className="block text-sm font-medium text-gray-700">Author Name</label>
                <p className="mt-1 text-sm text-gray-900">{story.authorName || 'Unknown'}</p>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">Published Year</label>
                <p className="mt-1 text-sm text-gray-900">{story.publishedYear || 'Not specified'}</p>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">Published Era</label>
                <p className="mt-1 text-sm text-gray-900">{story.publishedEra || 'Not specified'}</p>
              </div>
            </div>
          </CollapsibleSection>

          {/* Characters & Roles Section */}
          {story.characters && story.characters.length > 0 && (
            <CollapsibleSection title="Selectable Characters" defaultOpen={true} className="mt-6">
              <div className="space-y-3">
                {story.characters.map((character) => {
                  const getCharacterRoles = (characterId: string) => {
                    const castEntry = story.cast?.find(c => c.characterId === characterId);
                    if (!castEntry || !castEntry.roleIds || castEntry.roleIds.length === 0) {
                      return [];
                    }
                    
                    return castEntry.roleIds.map(roleId => 
                      story.roles?.find(r => r.id === roleId)?.label
                    ).filter(Boolean);
                  };

                  const characterRoles = getCharacterRoles(character.id);
                  
                  return (
                    <div key={character.id} className="flex items-start space-x-3">
                      <div className="flex-1">
                        <div className="flex items-center space-x-2">
                          <span className="text-sm font-medium text-gray-900">• {character.name}</span>
                          {characterRoles.length > 0 && (
                            <span className="text-sm text-gray-600">
                              → Role(s): {characterRoles.join(', ')}
                            </span>
                          )}
                        </div>
                        {character.summary && (
                          <p className="text-xs text-gray-500 mt-1 ml-4">{character.summary}</p>
                        )}
                        {character.hooks && character.hooks.length > 0 && (
                          <div className="mt-2 ml-4">
                            <p className="text-xs font-medium text-gray-600 mb-1">Hooks:</p>
                            <ul className="text-xs text-gray-500 space-y-1">
                              {character.hooks.map((hook, index) => (
                                <li key={index}>• {hook}</li>
                              ))}
                            </ul>
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </CollapsibleSection>
          )}

          {/* Selectables Section */}
          <CollapsibleSection title="Selectable Options" defaultOpen={true} className="mt-6">
            {storySettings ? (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                {/* Tone Style Options */}
                <div>
                  <h5 className="text-sm font-medium text-gray-900 mb-3">Tone Styles</h5>
                  <div className="space-y-3">
                    {storySettings.tone_styles.map((style) => (
                      <div key={style.id} className="border-l-2 border-gray-200 pl-3">
                        <p className="text-sm font-medium text-gray-900">{style.displayLabel}</p>
                        <p className="text-xs text-gray-500 mt-1">{style.description}</p>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Time Flavor Options */}
                <div>
                  <h5 className="text-sm font-medium text-gray-900 mb-3">Time Flavors</h5>
                  <div className="space-y-3">
                    {storySettings.time_flavors.map((flavor) => (
                      <div key={flavor.id} className="border-l-2 border-gray-200 pl-3">
                        <p className="text-sm font-medium text-gray-900">{flavor.displayLabel}</p>
                        <p className="text-xs text-gray-500 mt-1">{flavor.description}</p>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            ) : (
              <p className="text-sm text-gray-500 italic">Not available</p>
            )}
          </CollapsibleSection>
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
