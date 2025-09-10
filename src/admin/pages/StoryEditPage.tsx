// src/admin/pages/StoryEditPage.tsx
import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { adminApi, Story } from '../api';
import { Spinner } from '../components/Spinner';
import { ErrorMessage } from '../components/ErrorMessage';
import { useToast } from '../components/Toast';
import { BasicInfoForm } from '../components/storyEdit/BasicInfoForm';
import { MediaSection } from '../components/storyEdit/MediaSection';
import { CharacterEditor } from '../components/storyEdit/CharacterEditor';
import { SummaryHooksSection } from '../components/storyEdit/SummaryHooksSection';
import { StoryrunnerConfig } from '../components/storyEdit/StoryrunnerConfig';
import { PricingEditor } from '../components/storyEdit/PricingEditor';
import { TagsEditor } from '../components/storyEdit/TagsEditor';
import { FunFactsEditor } from '../components/storyEdit/FunFactsEditor';
import { ReengagementEditor } from '../components/storyEdit/ReengagementEditor';

export const StoryEditPage: React.FC = () => {
  const { storyId } = useParams<{ storyId: string }>();
  const navigate = useNavigate();
  const { showToast } = useToast();
  
  const [story, setStory] = useState<Story | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState('basic');
  const [hasChanges, setHasChanges] = useState(false);

  // Load story data
  useEffect(() => {
    const loadStory = async () => {
      if (!storyId) {
        setError('No story ID provided');
        setLoading(false);
        return;
      }

      try {
        setLoading(true);
        setError(null);
        const response = await adminApi.getStory(storyId);
        
        if (response.ok && response.story) {
          setStory(response.story);
        } else {
          setError('Failed to load story');
        }
      } catch (err: any) {
        setError(err.message || 'Failed to load story');
      } finally {
        setLoading(false);
      }
    };

    loadStory();
  }, [storyId]);

  // Handle story data updates
  const handleStoryUpdate = (updates: Partial<Story>) => {
    if (!story) return;
    
    setStory(prev => prev ? { ...prev, ...updates } : null);
    setHasChanges(true);
  };

  // Normalize category payload before sending to API
  const normalizeStoryPayload = (storyData: any): Story => {
    const normalized = { ...storyData };

    // Extract .value from category objects if they exist
    if (typeof normalized.mainCategory === 'object' && normalized.mainCategory?.value) {
      normalized.mainCategory = normalized.mainCategory.value;
    }

    if (typeof normalized.subCategory === 'object' && normalized.subCategory?.value) {
      normalized.subCategory = normalized.subCategory.value;
    }

    if (Array.isArray(normalized.genres) && normalized.genres.length > 0 && typeof normalized.genres[0] === 'object') {
      normalized.genres = normalized.genres.map((g: any) => g.value || g);
    }

    // Validate and sanitize license field
    const validLicenses = ['public-domain', 'creative-commons', 'copyrighted', 'fair-use'];
    if (normalized.license && !validLicenses.includes(normalized.license)) {
      console.warn(`⚠️ Invalid license value: "${normalized.license}". Defaulting to "public-domain".`);
      normalized.license = 'public-domain';
    }

    return normalized as Story;
  };

  // Handle save changes
  const handleSave = async () => {
    if (!story || !storyId) return;

    try {
      setSaving(true);
      
      // Normalize the payload before sending
      const normalizedStory = normalizeStoryPayload(story);
      
      // 📦 Enhanced logging for debugging license field issues
      console.log("📦 Story update payload:", JSON.stringify(normalizedStory, null, 2));
      console.log("📌 license field:", normalizedStory.license, typeof normalizedStory.license);
      
      const response = await adminApi.updateStory(storyId, normalizedStory);
      
      if (response.ok) {
        showToast('Story updated successfully', 'success');
        setHasChanges(false);
      } else {
        console.error("❌ Story update failed:", response);
        showToast('Failed to update story', 'error');
      }
    } catch (err: any) {
      // 📦 Enhanced error logging for debugging
      console.error("❌ Story update error:", {
        error: err,
        errorType: typeof err,
        errorMessage: err.message,
        errorStatus: err.status,
        errorStack: err.stack
      });
      showToast(err.message || 'Failed to update story', 'error');
    } finally {
      setSaving(false);
    }
  };

  // Handle cancel
  const handleCancel = () => {
    if (hasChanges) {
      if (confirm('You have unsaved changes. Are you sure you want to leave?')) {
        navigate('/stories');
      }
    } else {
      navigate('/stories');
    }
  };

  // Tab configuration
  const tabs = [
    { id: 'basic', label: 'Basic Information', icon: '📌' },
    { id: 'media', label: 'Media & Sharing', icon: '🖼️' },
    { id: 'characters', label: 'Characters & Cast', icon: '🎭' },
    { id: 'summary', label: 'Hooks & Summaries', icon: '🧠' },
    { id: 'storyrunner', label: 'Storyrunner', icon: '🛠️' },
    { id: 'pricing', label: 'Pricing', icon: '💰' },
    { id: 'tags', label: 'Tags', icon: '🏷️' },
    { id: 'funfacts', label: 'Fun Facts', icon: '🤓' },
    { id: 'reengagement', label: 'Re-engagement', icon: '🔁' },
  ];

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-100 flex items-center justify-center">
        <div className="text-center">
          <Spinner />
          <p className="mt-4 text-gray-600">Loading story details...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-100 flex items-center justify-center">
        <ErrorMessage 
          title="Error Loading Story" 
          message={error} 
          backHref="#/stories"
        />
      </div>
    );
  }

  if (!story) {
    return (
      <div className="min-h-screen bg-gray-100 flex items-center justify-center">
        <ErrorMessage 
          title="Story Not Found" 
          message="The requested story could not be found." 
          backHref="#/stories"
        />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-100">
      {/* Header */}
      <div className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center">
              <button
                onClick={handleCancel}
                className="mr-4 p-2 text-gray-400 hover:text-gray-600"
                title="Back to Stories"
              >
                ←
              </button>
              <div>
                <nav className="flex" aria-label="Breadcrumb">
                  <ol className="flex items-center space-x-2">
                    <li>
                      <span className="text-gray-500">Admin</span>
                    </li>
                    <li>
                      <span className="text-gray-400 mx-2">/</span>
                      <button
                        onClick={() => navigate('/stories')}
                        className="text-blue-600 hover:text-blue-800"
                      >
                        Stories
                      </button>
                    </li>
                    <li>
                      <span className="text-gray-400 mx-2">/</span>
                      <span className="text-gray-900 font-medium">Edit: {story.title}</span>
                    </li>
                  </ol>
                </nav>
              </div>
            </div>
            <div className="flex items-center space-x-3">
              {hasChanges && (
                <span className="text-sm text-orange-600 font-medium">
                  Unsaved changes
                </span>
              )}
              <button
                onClick={handleCancel}
                className="px-4 py-2 text-gray-600 border border-gray-300 rounded-md hover:bg-gray-50"
              >
                Cancel
              </button>
              <button
                onClick={handleSave}
                disabled={saving || !hasChanges}
                className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center"
              >
                {saving && <Spinner />}
                <span className={saving ? 'ml-2' : ''}>Save Changes</span>
              </button>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex flex-col lg:flex-row gap-8">
          {/* Sidebar Navigation */}
          <div className="lg:w-64 flex-shrink-0">
            <div className="bg-white rounded-lg shadow-sm border p-4">
              <h3 className="text-lg font-medium text-gray-900 mb-4">Edit Sections</h3>
              <nav className="space-y-1">
                {tabs.map((tab) => (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id)}
                    className={`w-full text-left px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                      activeTab === tab.id
                        ? 'bg-blue-100 text-blue-700'
                        : 'text-gray-600 hover:bg-gray-100 hover:text-gray-900'
                    }`}
                  >
                    <span className="mr-2">{tab.icon}</span>
                    {tab.label}
                  </button>
                ))}
              </nav>
            </div>
          </div>

          {/* Main Content */}
          <div className="flex-1">
            <div className="bg-white rounded-lg shadow-sm border">
              <div className="p-6">
                {activeTab === 'basic' && (
                  <BasicInfoForm story={story} onUpdate={handleStoryUpdate} />
                )}
                {activeTab === 'media' && (
                  <MediaSection story={story} onUpdate={handleStoryUpdate} storyId={storyId} />
                )}
                {activeTab === 'characters' && (
                  <CharacterEditor story={story} onUpdate={handleStoryUpdate} />
                )}
                {activeTab === 'summary' && (
                  <SummaryHooksSection story={story} onUpdate={handleStoryUpdate} />
                )}
                {activeTab === 'storyrunner' && (
                  <StoryrunnerConfig story={story} onUpdate={handleStoryUpdate} />
                )}
                {activeTab === 'pricing' && (
                  <PricingEditor story={story} onUpdate={handleStoryUpdate} />
                )}
                {activeTab === 'tags' && (
                  <TagsEditor story={story} onUpdate={handleStoryUpdate} />
                )}
                {activeTab === 'funfacts' && (
                  <FunFactsEditor story={story} onUpdate={handleStoryUpdate} />
                )}
                {activeTab === 'reengagement' && (
                  <ReengagementEditor story={story} onUpdate={handleStoryUpdate} />
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
