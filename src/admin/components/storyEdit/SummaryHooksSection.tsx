// src/admin/components/storyEdit/SummaryHooksSection.tsx
import React, { useState } from 'react';
import { Story, Highlight } from '../../api';
import { HooksTagInput } from './HooksTagInput';

interface SummaryHooksSectionProps {
  story: Story;
  onUpdate: (updates: Partial<Story>) => void;
}

export const SummaryHooksSection: React.FC<SummaryHooksSectionProps> = ({ story, onUpdate }) => {
  const [editingHighlight, setEditingHighlight] = useState<number | null>(null);


  const handleSummaryChange = (field: 'original' | 'modern', value: string) => {
    onUpdate({
      summary: {
        ...story.summary,
        [field]: value
      }
    });
  };

  const addHighlight = () => {
    const newHighlight: Highlight = {
      title: '',
      description: ''
    };
    onUpdate({
      summary: {
        ...story.summary,
        highlights: [...story.summary.highlights, newHighlight]
      }
    });
    setEditingHighlight(story.summary.highlights.length);
  };

  const updateHighlight = (index: number, updates: Partial<Highlight>) => {
    const updatedHighlights = [...story.summary.highlights];
    updatedHighlights[index] = { ...updatedHighlights[index], ...updates };
    onUpdate({
      summary: {
        ...story.summary,
        highlights: updatedHighlights
      }
    });
  };

  const removeHighlight = (index: number) => {
    const updatedHighlights = story.summary.highlights.filter((_, i) => i !== index);
    onUpdate({
      summary: {
        ...story.summary,
        highlights: updatedHighlights
      }
    });
    if (editingHighlight === index) {
      setEditingHighlight(null);
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-semibold text-gray-900 mb-4">💬 Hooks & Summaries</h2>
        <p className="text-sm text-gray-600 mb-6">Define story hooks and create compelling summaries for different audiences.</p>
      </div>

      {/* Story Hooks */}
      <div className="bg-gray-50 rounded-lg p-6">
        <h3 className="text-lg font-medium text-gray-900 mb-4">Story Hooks</h3>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Hooks
          </label>
          <HooksTagInput
            value={story.hooks}
            onChange={(hooks) => onUpdate({ hooks })}
            placeholder="What makes this story compelling? What draws readers in?"
          />
        </div>
      </div>

      {/* Original Summary */}
      <div className="bg-gray-50 rounded-lg p-6">
        <h3 className="text-lg font-medium text-gray-900 mb-4">Original Summary</h3>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Original Story Summary
          </label>
          <textarea
            value={story.summary.original}
            onChange={(e) => handleSummaryChange('original', e.target.value)}
            rows={8}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            placeholder="Write a comprehensive summary of the original story, including key plot points, character arcs, and themes..."
          />
          <p className="text-xs text-gray-500 mt-2">
            A detailed summary of the original story for reference and context.
          </p>
        </div>
      </div>

      {/* Modern Summary */}
      <div className="bg-gray-50 rounded-lg p-6">
        <h3 className="text-lg font-medium text-gray-900 mb-4">Modern Summary</h3>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Modern Adaptation Summary
          </label>
          <textarea
            value={story.summary.modern}
            onChange={(e) => handleSummaryChange('modern', e.target.value)}
            rows={8}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            placeholder="Write a summary of how this story is adapted for modern audiences, highlighting contemporary relevance and appeal..."
          />
          <p className="text-xs text-gray-500 mt-2">
            How this story is adapted or presented for modern audiences.
          </p>
        </div>
      </div>

      {/* Highlights */}
      <div className="bg-gray-50 rounded-lg p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-medium text-gray-900">Story Highlights</h3>
          <button
            onClick={addHighlight}
            className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 text-sm"
          >
            + Add Highlight
          </button>
        </div>

        <div className="space-y-4">
          {story.summary.highlights.map((highlight, index) => (
            <div key={index} className="bg-white rounded-lg border p-4">
              <div className="flex items-center justify-between mb-3">
                <h4 className="font-medium text-gray-900">
                  {highlight.title || `Highlight ${index + 1}`}
                </h4>
                <div className="flex space-x-2">
                  <button
                    onClick={() => setEditingHighlight(editingHighlight === index ? null : index)}
                    className="text-blue-600 hover:text-blue-800 text-sm"
                  >
                    {editingHighlight === index ? 'Collapse' : 'Edit'}
                  </button>
                  <button
                    onClick={() => removeHighlight(index)}
                    className="text-red-600 hover:text-red-800 text-sm"
                  >
                    Remove
                  </button>
                </div>
              </div>

              {editingHighlight === index && (
                <div className="space-y-3">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Title
                    </label>
                    <input
                      type="text"
                      value={highlight.title}
                      onChange={(e) => updateHighlight(index, { title: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
                      placeholder="Highlight title"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Description
                    </label>
                    <textarea
                      value={highlight.description}
                      onChange={(e) => updateHighlight(index, { description: e.target.value })}
                      rows={3}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
                      placeholder="Describe this highlight..."
                    />
                  </div>
                </div>
              )}

              {editingHighlight !== index && (
                <div>
                  <p className="text-sm text-gray-600">{highlight.description}</p>
                </div>
              )}
            </div>
          ))}

          {story.summary.highlights.length === 0 && (
            <div className="text-center py-8 text-gray-500">
              <p>No highlights added yet.</p>
              <p className="text-sm">Click "Add Highlight" to create key story points.</p>
            </div>
          )}
        </div>
      </div>

      {/* Summary Guidelines */}
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-6">
        <h3 className="text-lg font-medium text-blue-900 mb-3">📝 Summary Guidelines</h3>
        <div className="text-sm text-blue-800 space-y-2">
          <p><strong>Original Summary:</strong> Capture the essence of the original work, including major plot points, character development, and thematic elements.</p>
          <p><strong>Modern Summary:</strong> Explain how the story resonates with contemporary audiences, highlighting modern relevance and appeal.</p>
          <p><strong>Highlights:</strong> Create bite-sized, compelling points that showcase the story's best features and unique selling points.</p>
          <p><strong>Hooks:</strong> Identify the emotional and narrative elements that draw readers in and keep them engaged.</p>
        </div>
      </div>
    </div>
  );
};
