// src/admin/components/storyEdit/ReengagementEditor.tsx
import React, { useState } from 'react';
import { Story, ReengagementTemplate } from '../../api';

interface ReengagementEditorProps {
  story: Story;
  onUpdate: (updates: Partial<Story>) => void;
}

export const ReengagementEditor: React.FC<ReengagementEditorProps> = ({ story, onUpdate }) => {
  const [editingTemplate, setEditingTemplate] = useState<number | null>(null);

  const addTemplate = () => {
    const newTemplate: ReengagementTemplate = {
      trigger: '',
      template: '',
      cooldownHours: 72,
      enabled: true
    };
    onUpdate({
      reengagementTemplates: [...story.reengagementTemplates, newTemplate]
    });
    setEditingTemplate(story.reengagementTemplates.length);
  };

  const updateTemplate = (index: number, updates: Partial<ReengagementTemplate>) => {
    const updatedTemplates = [...story.reengagementTemplates];
    updatedTemplates[index] = { ...updatedTemplates[index], ...updates };
    onUpdate({ reengagementTemplates: updatedTemplates });
  };

  const removeTemplate = (index: number) => {
    const updatedTemplates = story.reengagementTemplates.filter((_, i) => i !== index);
    onUpdate({ reengagementTemplates: updatedTemplates });
    if (editingTemplate === index) {
      setEditingTemplate(null);
    }
  };

  const toggleTemplate = (index: number) => {
    updateTemplate(index, { enabled: !story.reengagementTemplates[index].enabled });
  };

  const commonTriggers = [
    'inactivity>24h',
    'inactivity>48h',
    'inactivity>72h',
    'lowCredits<50',
    'lowCredits<100',
    'storyNotStarted>7d',
    'storyIncomplete>3d',
    'noActivity>14d'
  ];

  const addSuggestedTrigger = (trigger: string) => {
    const newTemplate: ReengagementTemplate = {
      trigger,
      template: `Hey! We noticed you haven't been active recently. Come back and continue your story adventure!`,
      cooldownHours: 72,
      enabled: true
    };
    onUpdate({
      reengagementTemplates: [...story.reengagementTemplates, newTemplate]
    });
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-semibold text-gray-900 mb-4">🔁 Re-engagement Templates</h2>
        <p className="text-sm text-gray-600 mb-6">Configure automated messages to re-engage users who haven't been active.</p>
      </div>

      {/* Current Templates */}
      <div className="bg-gray-50 rounded-lg p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-medium text-gray-900">Re-engagement Templates</h3>
          <button
            onClick={addTemplate}
            className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 text-sm"
          >
            + Add Template
          </button>
        </div>

        <div className="space-y-4">
          {story.reengagementTemplates.map((template, index) => (
            <div key={index} className="bg-white rounded-lg border p-4">
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center space-x-3">
                  <button
                    onClick={() => toggleTemplate(index)}
                    className={`w-4 h-4 rounded border-2 flex items-center justify-center ${
                      template.enabled 
                        ? 'bg-green-500 border-green-500' 
                        : 'border-gray-300'
                    }`}
                  >
                    {template.enabled && <span className="text-white text-xs">✓</span>}
                  </button>
                  <h4 className="font-medium text-gray-900">
                    {template.trigger || `Template ${index + 1}`}
                  </h4>
                  <span className={`px-2 py-1 text-xs rounded-full ${
                    template.enabled 
                      ? 'bg-green-100 text-green-800' 
                      : 'bg-gray-100 text-gray-800'
                  }`}>
                    {template.enabled ? 'Enabled' : 'Disabled'}
                  </span>
                </div>
                <div className="flex space-x-2">
                  <button
                    onClick={() => setEditingTemplate(editingTemplate === index ? null : index)}
                    className="text-blue-600 hover:text-blue-800 text-sm"
                  >
                    {editingTemplate === index ? 'Collapse' : 'Edit'}
                  </button>
                  <button
                    onClick={() => removeTemplate(index)}
                    className="text-red-600 hover:text-red-800 text-sm"
                  >
                    Remove
                  </button>
                </div>
              </div>

              {editingTemplate === index && (
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Trigger Condition
                    </label>
                    <input
                      type="text"
                      value={template.trigger}
                      onChange={(e) => updateTemplate(index, { trigger: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm font-mono"
                      placeholder="inactivity&gt;48h"
                    />
                    <p className="text-xs text-gray-500 mt-1">
                      Examples: inactivity&gt;24h, lowCredits&lt;50, storyNotStarted&gt;7d
                    </p>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Message Template
                    </label>
                    <textarea
                      value={template.template}
                      onChange={(e) => updateTemplate(index, { template: e.target.value })}
                      rows={4}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
                      placeholder="Hey! We noticed you haven't been active recently. Come back and continue your story adventure!"
                    />
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Cooldown (Hours)
                      </label>
                      <input
                        type="number"
                        value={template.cooldownHours}
                        onChange={(e) => updateTemplate(index, { cooldownHours: parseInt(e.target.value) || 0 })}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
                        min="1"
                        max="168"
                      />
                      <p className="text-xs text-gray-500 mt-1">
                        Minimum time between messages (1-168 hours)
                      </p>
                    </div>

                    <div className="flex items-center">
                      <input
                        type="checkbox"
                        id={`enabled-${index}`}
                        checked={template.enabled}
                        onChange={(e) => updateTemplate(index, { enabled: e.target.checked })}
                        className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                      />
                      <label htmlFor={`enabled-${index}`} className="ml-2 text-sm text-gray-700">
                        Template enabled
                      </label>
                    </div>
                  </div>
                </div>
              )}

              {editingTemplate !== index && (
                <div className="space-y-2">
                  <p className="text-sm text-gray-600">
                    <strong>Trigger:</strong> {template.trigger}
                  </p>
                  <p className="text-sm text-gray-600">
                    <strong>Message:</strong> {template.template}
                  </p>
                  <p className="text-sm text-gray-600">
                    <strong>Cooldown:</strong> {template.cooldownHours} hours
                  </p>
                </div>
              )}
            </div>
          ))}

          {story.reengagementTemplates.length === 0 && (
            <div className="text-center py-8 text-gray-500">
              <p>No re-engagement templates added yet.</p>
              <p className="text-sm">Click "Add Template" to create automated re-engagement messages.</p>
            </div>
          )}
        </div>
      </div>

      {/* Suggested Triggers */}
      <div className="bg-gray-50 rounded-lg p-6">
        <h3 className="text-lg font-medium text-gray-900 mb-4">Suggested Triggers</h3>
        <p className="text-sm text-gray-600 mb-4">Click on any trigger below to create a template with that condition.</p>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {commonTriggers.map((trigger) => (
            <button
              key={trigger}
              onClick={() => addSuggestedTrigger(trigger)}
              className="text-left p-3 bg-white border border-gray-300 rounded-lg hover:bg-blue-50 hover:border-blue-300 transition-colors"
            >
              <div className="font-mono text-sm text-gray-900">{trigger}</div>
              <div className="text-xs text-gray-500 mt-1">
                {trigger.includes('inactivity') && 'User hasn\'t been active for specified time'}
                {trigger.includes('lowCredits') && 'User has low credit balance'}
                {trigger.includes('storyNotStarted') && 'User hasn\'t started the story'}
                {trigger.includes('storyIncomplete') && 'User started but didn\'t finish'}
                {trigger.includes('noActivity') && 'User has been inactive for extended period'}
              </div>
            </button>
          ))}
        </div>
      </div>

      {/* Re-engagement Guidelines */}
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-6">
        <h3 className="text-lg font-medium text-blue-900 mb-3">📝 Re-engagement Guidelines</h3>
        <div className="text-sm text-blue-800 space-y-2">
          <p><strong>Trigger Conditions:</strong> Use clear, specific conditions like "inactivity&gt;48h" or "lowCredits&lt;50".</p>
          <p><strong>Message Tone:</strong> Keep messages friendly, encouraging, and non-intrusive.</p>
          <p><strong>Cooldown Periods:</strong> Set appropriate cooldowns to avoid spamming users (typically 24-72 hours).</p>
          <p><strong>Testing:</strong> Test templates with different user segments to ensure effectiveness.</p>
          <p><strong>Compliance:</strong> Ensure messages comply with privacy regulations and user preferences.</p>
        </div>
      </div>

      {/* Template Statistics */}
      <div className="bg-gray-50 rounded-lg p-6">
        <h3 className="text-lg font-medium text-gray-900 mb-4">Template Statistics</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="bg-white rounded-lg p-4 text-center">
            <div className="text-2xl font-bold text-blue-600">
              {story.reengagementTemplates.length}
            </div>
            <div className="text-sm text-gray-600">Total Templates</div>
          </div>
          <div className="bg-white rounded-lg p-4 text-center">
            <div className="text-2xl font-bold text-green-600">
              {story.reengagementTemplates.filter(t => t.enabled).length}
            </div>
            <div className="text-sm text-gray-600">Active Templates</div>
          </div>
          <div className="bg-white rounded-lg p-4 text-center">
            <div className="text-2xl font-bold text-purple-600">
              {story.reengagementTemplates.filter(t => !t.enabled).length}
            </div>
            <div className="text-sm text-gray-600">Disabled Templates</div>
          </div>
        </div>
      </div>
    </div>
  );
};
