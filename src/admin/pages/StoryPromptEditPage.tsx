// src/admin/pages/StoryPromptEditPage.tsx
import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { StoryPromptEditor } from '../components/storyEdit/StoryPromptEditor';
import { Spinner } from '../components/Spinner';
import { ErrorMessage } from '../components/ErrorMessage';
import { useToast } from '../components/Toast';
import { adminApi, Story, StorySettings, Brief } from '../api';
import { CollapsibleSection } from '../components/ui/CollapsibleSection';
import { generateChatGPTPromptFromTemplate, StoryPromptTemplate } from '../../utils/prompt/generateChatGPTPromptFromTemplate';

// Helper function to generate the story prompt JSON structure
const generateStoryPromptJSON = (story: Story, brief: Brief): string => {
  // Helper function to resolve character roles
  const resolveCharacterRoles = (characterId: string): string[] => {
    const castEntry = story.cast?.find(c => c.characterId === characterId);
    if (!castEntry || !castEntry.roleIds || castEntry.roleIds.length === 0) {
      return [];
    }
    
    return castEntry.roleIds.map(roleId => 
      story.roles?.find(r => r.id === roleId)?.label
    ).filter((label): label is string => Boolean(label));
  };

  // Helper function to convert storyrunnerRole string to array
  const convertRoleToArray = (roleString: string): string[] => {
    return roleString.split('\n').filter(line => line.trim()).map(line => line.trim());
  };

  // Map characters with resolved roles
  const mappedCharacters = story.characters.map(character => {
    const roles = resolveCharacterRoles(character.id);
    return {
      id: character.id,
      name: character.name,
      summary: character.summary,
      hooks: character.hooks,
      role: roles.length > 0 ? roles[0] : 'Character' // Use first role or default
    };
  });

  const jsonStructure = {
    brief: {
      whatsPlaible: brief.whatIsPlaible,
      howToPlay: brief.howToPlay,
      roleOfStoryrunnerAI: convertRoleToArray(brief.storyrunnerRole)
    },
    storyEssentials: {
      title: story.title,
      author: story.authorName || 'Unknown',
      publishedYear: story.publishedYear || null,
      publishedEra: story.publishedEra || 'Unknown',
      category: story.mainCategory,
      subCategory: story.subCategory || null,
      genres: story.genres || [],
      headline: story.headline || '',
      description: story.description || '',
      characters: mappedCharacters
    },
    storyPersonalization: {
      selectedCharacterId: "Character_Selection",
      selectedCharacterName: "Character_Selection",
      toneStyle: "Tone_Selection",
      timeFlavor: "Time_Selection"
    },
    guardrails: story.storyrunner?.guardrails || []
  };

  return JSON.stringify(jsonStructure, null, 2);
};

export const StoryPromptEditPage: React.FC = () => {
  const { storyId } = useParams<{ storyId: string }>();
  const navigate = useNavigate();
  const { showToast } = useToast();
  
  const [story, setStory] = useState<Story | null>(null);
  const [storySettings, setStorySettings] = useState<StorySettings | null>(null);
  const [brief, setBrief] = useState<Brief | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [promptValue, setPromptValue] = useState('');
  const [viewMode, setViewMode] = useState<'json' | 'preview'>('json');
  const [previewText, setPreviewText] = useState('');
  const [previewError, setPreviewError] = useState<string | null>(null);

  useEffect(() => {
    if (!storyId) {
      setError('Story ID is required');
      setLoading(false);
      return;
    }

    const loadData = async () => {
      try {
        // Load story, story settings, and brief in parallel
        const [storyResponse, settingsResponse, briefResponse] = await Promise.all([
          adminApi.getStory(storyId),
          adminApi.getStorySettings(),
          adminApi.getBrief()
        ]);

        if (storyResponse?.ok && storyResponse.story) {
          setStory(storyResponse.story);
        } else {
          setError('Story not found');
          return;
        }

        if (settingsResponse?.ok && settingsResponse.settings) {
          setStorySettings(settingsResponse.settings);
        }

        if (briefResponse?.ok && briefResponse.brief) {
          setBrief(briefResponse.brief);
        }

        // Generate JSON structure if we have all required data
        if (storyResponse?.ok && storyResponse.story && briefResponse?.ok && briefResponse.brief) {
          const jsonStructure = generateStoryPromptJSON(
            storyResponse.story, 
            briefResponse.brief
          );
          setPromptValue(jsonStructure);
        } else {
          // Fallback to existing prompt if JSON generation fails
          const prompt = storyResponse.story.storyrunner?.storyPrompt || 
                        storyResponse.story.storyrunner?.systemPrompt || '';
          setPromptValue(prompt);
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

  // Handle preview generation when promptValue or viewMode changes
  useEffect(() => {
    if (viewMode === 'preview') {
      const result = generateChatGPTPromptFromTemplate(promptValue);
      if (result.ok) {
        setPreviewText(result.text);
        setPreviewError(null);
      } else {
        setPreviewText('');
        setPreviewError(result.error);
      }
    } else {
      // Clear preview when not in preview mode
      setPreviewText('');
      setPreviewError(null);
    }
  }, [promptValue, viewMode]);

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

  // Copy final prompt to clipboard
  const handleCopyPrompt = async () => {
    if (previewText) {
      try {
        await navigator.clipboard.writeText(previewText);
        showToast('Final prompt copied to clipboard', 'success');
      } catch (err) {
        console.error('Failed to copy to clipboard:', err);
        showToast('Failed to copy to clipboard', 'error');
      }
    }
  };

  // Check if current prompt is valid JSON
  const isValidJSON = (): boolean => {
    try {
      JSON.parse(promptValue);
      return true;
    } catch {
      return false;
    }
  };

  // Wrap legacy text in JSON skeleton
  const wrapInJSONSkeleton = () => {
    if (!story || !brief) return;
    
    const jsonStructure = generateStoryPromptJSON(story, brief);
    setPromptValue(jsonStructure);
    setViewMode('json');
    showToast('Legacy prompt wrapped in JSON structure', 'success');
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
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-medium text-gray-900">Story Prompt Template</h3>
            
            {/* View Toggle */}
            <div className="flex items-center space-x-2">
              <div className="flex rounded-md shadow-sm">
                <button
                  type="button"
                  onClick={() => setViewMode('json')}
                  className={`px-3 py-2 text-sm font-medium rounded-l-md border ${
                    viewMode === 'json'
                      ? 'bg-blue-600 text-white border-blue-600'
                      : 'bg-white text-gray-700 border-gray-300 hover:bg-gray-50'
                  }`}
                >
                  JSON Template
                </button>
                <button
                  type="button"
                  onClick={() => setViewMode('preview')}
                  className={`px-3 py-2 text-sm font-medium rounded-r-md border-t border-r border-b ${
                    viewMode === 'preview'
                      ? 'bg-blue-600 text-white border-blue-600'
                      : 'bg-white text-gray-700 border-gray-300 hover:bg-gray-50'
                  }`}
                >
                  Final Prompt (Preview)
                </button>
              </div>
              
              {/* Copy Button (only in preview mode) */}
              {viewMode === 'preview' && (
                <button
                  type="button"
                  onClick={handleCopyPrompt}
                  className="px-3 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                >
                  Copy Final Prompt
                </button>
              )}
            </div>
          </div>

          {/* Legacy Text Warning and Helper */}
          {!isValidJSON() && viewMode === 'json' && (
            <div className="mb-4 p-4 bg-yellow-50 border border-yellow-200 rounded-md">
              <div className="flex items-start">
                <div className="flex-shrink-0">
                  <svg className="h-5 w-5 text-yellow-400" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                  </svg>
                </div>
                <div className="ml-3 flex-1">
                  <h3 className="text-sm font-medium text-yellow-800">
                    Legacy Text Prompt Detected
                  </h3>
                  <div className="mt-2 text-sm text-yellow-700">
                    <p>This appears to be a legacy text prompt. To use the new JSON template system, click the button below to wrap it in a JSON structure.</p>
                  </div>
                  <div className="mt-3">
                    <button
                      type="button"
                      onClick={wrapInJSONSkeleton}
                      className="bg-yellow-100 px-3 py-2 rounded-md text-sm font-medium text-yellow-800 hover:bg-yellow-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-yellow-500"
                    >
                      Wrap in JSON Skeleton
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Preview Error */}
          {viewMode === 'preview' && previewError && (
            <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-md">
              <div className="flex">
                <div className="flex-shrink-0">
                  <svg className="h-5 w-5 text-red-400" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                  </svg>
                </div>
                <div className="ml-3">
                  <h3 className="text-sm font-medium text-red-800">
                    Template JSON is Invalid
                  </h3>
                  <div className="mt-2 text-sm text-red-700">
                    <p>{previewError}</p>
                    <p className="mt-1">Fix the JSON in the JSON Template view to see the preview.</p>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Editor */}
          <StoryPromptEditor
            value={viewMode === 'json' ? promptValue : previewText}
            onChange={viewMode === 'json' ? setPromptValue : undefined}
            placeholder={viewMode === 'json' ? "You are an AI storyteller for this story. Your role is to..." : "Preview will appear here..."}
            rows={15}
            readOnly={viewMode === 'preview'}
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
