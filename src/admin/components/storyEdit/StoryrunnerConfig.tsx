// src/admin/components/storyEdit/StoryrunnerConfig.tsx
import React from 'react';
import { Story } from '../../api';

interface StoryrunnerConfigProps {
  story: Story;
  onUpdate: (updates: Partial<Story>) => void;
}

export const StoryrunnerConfig: React.FC<StoryrunnerConfigProps> = ({ story, onUpdate }) => {
  // Safe fallbacks for backward compatibility with legacy data
  const getStoryPrompt = () => {
    return story?.storyrunner?.storyPrompt || story?.storyrunner?.systemPrompt || '';
  };

  const getOpeningBeats = () => {
    return story?.storyrunner?.openingBeats || [];
  };

  const getGuardrails = () => {
    return story?.storyrunner?.guardrails || [];
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-semibold text-gray-900 mb-4">🛠️ Prompt Template</h2>
        <p className="text-sm text-gray-600 mb-4">Preview the StoryRunner AI behavior and safety settings.</p>
        <div className="mb-6 p-3 bg-blue-50 border border-blue-200 rounded-lg">
          <p className="text-sm text-blue-800">
            💡 <strong>Note:</strong> Advanced prompt management and story session monitoring is available in the 
            <span className="font-semibold"> StoryRunner AI</span> section of the admin dashboard.
          </p>
        </div>
      </div>

      {/* Story Prompt Template Section */}
      <div className="border border-gray-200 rounded-lg p-6">
        <h3 className="text-lg font-medium text-gray-900 mb-4">Story Prompt Template*</h3>
        
        {/* Final Prompt Preview */}
        <div className="mb-6">
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Final Prompt (Preview)
          </label>
          <textarea
            value={getStoryPrompt()}
            readOnly
            className="w-full px-3 py-2 border border-gray-300 rounded-md bg-gray-50 text-sm font-mono resize-none"
            rows={12}
            placeholder="No prompt template configured"
          />
        </div>

        {/* Story Opening Beats */}
        <div className="mb-6">
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Story Opening Beats
          </label>
          <div className="bg-gray-50 border border-gray-300 rounded-md p-3 min-h-[60px]">
            {getOpeningBeats().length > 0 ? (
              <div className="flex flex-wrap gap-2">
                {getOpeningBeats().map((beat, index) => (
                  <span
                    key={index}
                    className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800"
                  >
                    {beat}
                  </span>
                ))}
              </div>
            ) : (
              <p className="text-sm text-gray-500">No opening beats configured</p>
            )}
          </div>
        </div>

        {/* Story Safety Guardrails */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Story Safety Guardrails
          </label>
          <div className="bg-gray-50 border border-gray-300 rounded-md p-3 min-h-[60px]">
            {getGuardrails().length > 0 ? (
              <div className="flex flex-wrap gap-2">
                {getGuardrails().map((guardrail, index) => (
                  <span
                    key={index}
                    className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-800"
                  >
                    {guardrail}
                  </span>
                ))}
              </div>
            ) : (
              <p className="text-sm text-gray-500">No guardrails configured</p>
            )}
          </div>
        </div>
      </div>

      {/* Prompt Stats */}
      <div className="bg-gray-50 rounded-lg p-6">
        <h3 className="text-lg font-medium text-gray-900 mb-4">Prompt Stats</h3>
        
        <div className="bg-white border rounded-lg p-4 space-y-3">
          <div className="flex justify-between text-sm">
            <span className="text-gray-600">Prompt Length:</span>
            <span className="font-medium">{getStoryPrompt().length} chars</span>
          </div>
          <div className="flex justify-between text-sm">
            <span className="text-gray-600">Opening Beats:</span>
            <span className="font-medium">{getOpeningBeats().length}</span>
          </div>
          <div className="flex justify-between text-sm">
            <span className="text-gray-600">Guardrails:</span>
            <span className="font-medium">{getGuardrails().length}</span>
          </div>
          <div className="flex justify-between text-sm">
            <span className="text-gray-600">Variables Used:</span>
            <span className="font-medium">
              {(getStoryPrompt().match(/\{\{[^}]+\}\}/g) || []).length}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
};
