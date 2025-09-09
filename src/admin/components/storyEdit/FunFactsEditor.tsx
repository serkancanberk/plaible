// src/admin/components/storyEdit/FunFactsEditor.tsx
import React, { useState } from 'react';
import { Story, FactItem } from '../../api';

interface FunFactsEditorProps {
  story: Story;
  onUpdate: (updates: Partial<Story>) => void;
}

export const FunFactsEditor: React.FC<FunFactsEditorProps> = ({ story, onUpdate }) => {
  const [editingFact, setEditingFact] = useState<{ section: keyof typeof story.funFacts; index: number } | null>(null);

  const addFact = (section: keyof typeof story.funFacts) => {
    const newFact: FactItem = {
      title: '',
      description: ''
    };
    onUpdate({
      funFacts: {
        ...story.funFacts,
        [section]: [...story.funFacts[section], newFact]
      }
    });
    setEditingFact({ section, index: story.funFacts[section].length });
  };

  const updateFact = (section: keyof typeof story.funFacts, index: number, updates: Partial<FactItem>) => {
    const updatedFacts = [...story.funFacts[section]];
    updatedFacts[index] = { ...updatedFacts[index], ...updates };
    onUpdate({
      funFacts: {
        ...story.funFacts,
        [section]: updatedFacts
      }
    });
  };

  const removeFact = (section: keyof typeof story.funFacts, index: number) => {
    const updatedFacts = story.funFacts[section].filter((_, i) => i !== index);
    onUpdate({
      funFacts: {
        ...story.funFacts,
        [section]: updatedFacts
      }
    });
    if (editingFact?.section === section && editingFact?.index === index) {
      setEditingFact(null);
    }
  };

  const renderFactSection = (section: keyof typeof story.funFacts, title: string, description: string) => {
    const facts = story.funFacts[section];
    const isEditing = editingFact?.section === section;

    return (
      <div className="bg-gray-50 rounded-lg p-6">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h3 className="text-lg font-medium text-gray-900">{title}</h3>
            <p className="text-sm text-gray-600">{description}</p>
          </div>
          <button
            onClick={() => addFact(section)}
            className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 text-sm"
          >
            + Add Fact
          </button>
        </div>

        <div className="space-y-4">
          {facts.map((fact, index) => (
            <div key={index} className="bg-white rounded-lg border p-4">
              <div className="flex items-center justify-between mb-3">
                <h4 className="font-medium text-gray-900">
                  {fact.title || `Fact ${index + 1}`}
                </h4>
                <div className="flex space-x-2">
                  <button
                    onClick={() => setEditingFact(
                      isEditing && editingFact?.index === index 
                        ? null 
                        : { section, index }
                    )}
                    className="text-blue-600 hover:text-blue-800 text-sm"
                  >
                    {isEditing && editingFact?.index === index ? 'Collapse' : 'Edit'}
                  </button>
                  <button
                    onClick={() => removeFact(section, index)}
                    className="text-red-600 hover:text-red-800 text-sm"
                  >
                    Remove
                  </button>
                </div>
              </div>

              {isEditing && editingFact?.index === index && (
                <div className="space-y-3">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Title
                    </label>
                    <input
                      type="text"
                      value={fact.title}
                      onChange={(e) => updateFact(section, index, { title: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
                      placeholder="Fact title"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Description
                    </label>
                    <textarea
                      value={fact.description}
                      onChange={(e) => updateFact(section, index, { description: e.target.value })}
                      rows={3}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
                      placeholder="Fact description..."
                    />
                  </div>
                </div>
              )}

              {!(isEditing && editingFact?.index === index) && (
                <div>
                  <p className="text-sm text-gray-600">{fact.description}</p>
                </div>
              )}
            </div>
          ))}

          {facts.length === 0 && (
            <div className="text-center py-8 text-gray-500">
              <p>No {title.toLowerCase()} added yet.</p>
              <p className="text-sm">Click "Add Fact" to create interesting facts.</p>
            </div>
          )}
        </div>
      </div>
    );
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-semibold text-gray-900 mb-4">💡 Fun Facts</h2>
        <p className="text-sm text-gray-600 mb-6">Add interesting facts and trivia to enhance the story experience.</p>
      </div>

      {/* Story Facts */}
      {renderFactSection(
        'storyFacts',
        'Story Facts',
        'Interesting facts about the story itself, its creation, or historical context.'
      )}

      {/* Author Info */}
      {renderFactSection(
        'authorInfo',
        'Author Information',
        'Facts about the author, their life, and their other works.'
      )}

      {/* Modern Echo */}
      {renderFactSection(
        'modernEcho',
        'Modern Echo',
        'How this story resonates with or influences modern culture and media.'
      )}

      {/* Fun Facts Guidelines */}
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-6">
        <h3 className="text-lg font-medium text-blue-900 mb-3">📝 Fun Facts Guidelines</h3>
        <div className="text-sm text-blue-800 space-y-2">
          <p><strong>Story Facts:</strong> Include interesting details about the story's creation, historical context, or unique elements.</p>
          <p><strong>Author Info:</strong> Share biographical details, other works, or interesting facts about the author's life.</p>
          <p><strong>Modern Echo:</strong> Highlight how the story influences or is referenced in modern culture, media, or literature.</p>
          <p><strong>Engagement:</strong> Fun facts help users connect more deeply with the story and its cultural significance.</p>
        </div>
      </div>

      {/* Fun Facts Statistics */}
      <div className="bg-gray-50 rounded-lg p-6">
        <h3 className="text-lg font-medium text-gray-900 mb-4">Fun Facts Statistics</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="bg-white rounded-lg p-4 text-center">
            <div className="text-2xl font-bold text-blue-600">
              {story.funFacts.storyFacts.length}
            </div>
            <div className="text-sm text-gray-600">Story Facts</div>
          </div>
          <div className="bg-white rounded-lg p-4 text-center">
            <div className="text-2xl font-bold text-green-600">
              {story.funFacts.authorInfo.length}
            </div>
            <div className="text-sm text-gray-600">Author Facts</div>
          </div>
          <div className="bg-white rounded-lg p-4 text-center">
            <div className="text-2xl font-bold text-purple-600">
              {story.funFacts.modernEcho.length}
            </div>
            <div className="text-sm text-gray-600">Modern Echo</div>
          </div>
        </div>
        <div className="mt-4 text-center">
          <p className="text-sm text-gray-600">
            Total: <strong>{story.funFacts.storyFacts.length + story.funFacts.authorInfo.length + story.funFacts.modernEcho.length}</strong> fun facts
          </p>
        </div>
      </div>
    </div>
  );
};
