// src/admin/components/storyEdit/StoryrunnerConfig.tsx
import React, { useState } from 'react';
import { Story } from '../../api';

interface StoryrunnerConfigProps {
  story: Story;
  onUpdate: (updates: Partial<Story>) => void;
}

export const StoryrunnerConfig: React.FC<StoryrunnerConfigProps> = ({ story, onUpdate }) => {
  const [isExpanded, setIsExpanded] = useState(false);
  const [showWarning, setShowWarning] = useState(true);

  const handleSystemPromptChange = (value: string) => {
    onUpdate({
      storyrunner: {
        ...story.storyrunner,
        systemPrompt: value
      }
    });
  };

  const handleOpeningBeatsChange = (value: string) => {
    const beats = value.split('\n').map(beat => beat.trim()).filter(beat => beat);
    onUpdate({
      storyrunner: {
        ...story.storyrunner,
        openingBeats: beats
      }
    });
  };

  const handleGuardrailsChange = (value: string) => {
    const guardrails = value.split('\n').map(guard => guard.trim()).filter(guard => guard);
    onUpdate({
      storyrunner: {
        ...story.storyrunner,
        guardrails: guardrails
      }
    });
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-semibold text-gray-900 mb-4">🧠 Storyrunner Configuration</h2>
        <p className="text-sm text-gray-600 mb-6">Configure the AI storyrunner behavior and safety settings.</p>
      </div>

      {/* Warning Section */}
      {showWarning && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <div className="flex items-start">
            <div className="flex-shrink-0">
              <div className="text-red-400 text-xl">⚠️</div>
            </div>
            <div className="ml-3 flex-1">
              <h3 className="text-sm font-medium text-red-800">Expert Configuration</h3>
              <p className="text-sm text-red-700 mt-1">
                These settings directly control AI behavior and can significantly impact user experience. 
                Only modify if you understand the implications.
              </p>
            </div>
            <button
              onClick={() => setShowWarning(false)}
              className="ml-3 text-red-400 hover:text-red-600"
            >
              ✕
            </button>
          </div>
        </div>
      )}

      {/* Expandable Expert Section */}
      <div className="border border-gray-200 rounded-lg">
        <button
          onClick={() => setIsExpanded(!isExpanded)}
          className="w-full px-4 py-3 text-left bg-gray-50 hover:bg-gray-100 rounded-t-lg flex items-center justify-between"
        >
          <div className="flex items-center">
            <span className="text-lg mr-2">🔧</span>
            <span className="font-medium text-gray-900">Expert AI Configuration</span>
          </div>
          <span className={`transform transition-transform ${isExpanded ? 'rotate-180' : ''}`}>
            ▼
          </span>
        </button>

        {isExpanded && (
          <div className="p-6 border-t border-gray-200">
            <div className="space-y-6">
              {/* System Prompt */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  System Prompt *
                </label>
                <textarea
                  value={story.storyrunner.systemPrompt}
                  onChange={(e) => handleSystemPromptChange(e.target.value)}
                  rows={12}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 font-mono text-sm"
                  placeholder="You are an AI storyteller for [Story Title]. Your role is to..."
                />
                <p className="text-xs text-gray-500 mt-2">
                  This prompt defines the AI's role, personality, and behavior. It's the core instruction that guides all AI responses.
                </p>
              </div>

              {/* Opening Beats */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Opening Beats
                </label>
                <textarea
                  value={story.storyrunner.openingBeats.join('\n')}
                  onChange={(e) => handleOpeningBeatsChange(e.target.value)}
                  rows={6}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="Opening beat 1&#10;Opening beat 2&#10;Opening beat 3"
                />
                <p className="text-xs text-gray-500 mt-2">
                  Initial story beats that set the tone and direction. One beat per line.
                </p>
              </div>

              {/* Guardrails */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Safety Guardrails
                </label>
                <textarea
                  value={story.storyrunner.guardrails?.join('\n') || ''}
                  onChange={(e) => handleGuardrailsChange(e.target.value)}
                  rows={6}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="Do not include explicit violence&#10;Maintain age-appropriate content&#10;Respect character boundaries"
                />
                <p className="text-xs text-gray-500 mt-2">
                  Safety rules and content boundaries. One rule per line.
                </p>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Quick Settings */}
      <div className="bg-gray-50 rounded-lg p-6">
        <h3 className="text-lg font-medium text-gray-900 mb-4">Quick Settings</h3>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <h4 className="font-medium text-gray-700 mb-2">System Prompt Preview</h4>
            <div className="bg-white border rounded-lg p-3 max-h-32 overflow-y-auto">
              <p className="text-sm text-gray-600 font-mono">
                {story.storyrunner.systemPrompt.substring(0, 200)}
                {story.storyrunner.systemPrompt.length > 200 && '...'}
              </p>
            </div>
          </div>

          <div>
            <h4 className="font-medium text-gray-700 mb-2">Configuration Stats</h4>
            <div className="bg-white border rounded-lg p-3 space-y-2">
              <div className="flex justify-between text-sm">
                <span className="text-gray-600">System Prompt Length:</span>
                <span className="font-medium">{story.storyrunner.systemPrompt.length} chars</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-gray-600">Opening Beats:</span>
                <span className="font-medium">{story.storyrunner.openingBeats.length}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-gray-600">Guardrails:</span>
                <span className="font-medium">{story.storyrunner.guardrails?.length || 0}</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Best Practices */}
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-6">
        <h3 className="text-lg font-medium text-blue-900 mb-3">🎯 Best Practices</h3>
        <div className="text-sm text-blue-800 space-y-2">
          <p><strong>System Prompt:</strong> Be specific about the AI's role, tone, and constraints. Include character information and story context.</p>
          <p><strong>Opening Beats:</strong> Create compelling initial moments that draw users into the story and establish the narrative direction.</p>
          <p><strong>Guardrails:</strong> Define clear boundaries for content, tone, and character behavior to ensure appropriate user experience.</p>
          <p><strong>Testing:</strong> Always test configuration changes with sample interactions before deploying to users.</p>
        </div>
      </div>

      {/* Danger Zone */}
      <div className="bg-red-50 border border-red-200 rounded-lg p-6">
        <h3 className="text-lg font-medium text-red-900 mb-3">🚨 Danger Zone</h3>
        <div className="text-sm text-red-800 space-y-2">
          <p><strong>⚠️ Warning:</strong> Incorrect configuration can lead to inappropriate content, poor user experience, or system instability.</p>
          <p><strong>Backup:</strong> Always backup the current configuration before making changes.</p>
          <p><strong>Review:</strong> Have configuration changes reviewed by a team member before deployment.</p>
        </div>
      </div>
    </div>
  );
};
