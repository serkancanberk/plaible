// src/admin/components/storyEdit/CharacterEditor.tsx
import React, { useState } from 'react';
import { Story, Character, Role, Cast } from '../../api';
import { UnifiedMediaUploader, LAYOUT_CONFIGS } from '../media';
import { HooksTagInput } from './HooksTagInput';

interface CharacterEditorProps {
  story: Story;
  onUpdate: (updates: Partial<Story>) => void;
  storyId?: string;
}

export const CharacterEditor: React.FC<CharacterEditorProps> = ({ story, onUpdate, storyId }) => {
  const [editingCharacter, setEditingCharacter] = useState<number | null>(null);
  const [editingRole, setEditingRole] = useState<number | null>(null);

  const addCharacter = () => {
    const newCharacter: Character = {
      id: `char_${Date.now()}`,
      name: '',
      summary: '',
      hooks: [],
      assets: { images: [], videos: [] }
    };
    onUpdate({
      characters: [...story.characters, newCharacter]
    });
    setEditingCharacter(story.characters.length);
  };

  const updateCharacter = (index: number, updates: Partial<Character>) => {
    const updatedCharacters = [...story.characters];
    updatedCharacters[index] = { ...updatedCharacters[index], ...updates };
    onUpdate({ characters: updatedCharacters });
  };

  const removeCharacter = (index: number) => {
    const updatedCharacters = story.characters.filter((_, i) => i !== index);
    onUpdate({ characters: updatedCharacters });
    if (editingCharacter === index) {
      setEditingCharacter(null);
    }
  };

  const addRole = () => {
    const newRole: Role = {
      id: `role_${Date.now()}`,
      label: ''
    };
    onUpdate({
      roles: [...story.roles, newRole]
    });
    setEditingRole(story.roles.length);
  };

  const updateRole = (index: number, updates: Partial<Role>) => {
    const updatedRoles = [...story.roles];
    updatedRoles[index] = { ...updatedRoles[index], ...updates };
    onUpdate({ roles: updatedRoles });
  };

  const removeRole = (index: number) => {
    const updatedRoles = story.roles.filter((_, i) => i !== index);
    onUpdate({ roles: updatedRoles });
    if (editingRole === index) {
      setEditingRole(null);
    }
  };

  const addCast = () => {
    const newCast: Cast = {
      characterId: story.characters[0]?.id || '',
      roleIds: []
    };
    onUpdate({
      cast: [...story.cast, newCast]
    });
  };

  const updateCast = (index: number, updates: Partial<Cast>) => {
    const updatedCast = [...story.cast];
    updatedCast[index] = { ...updatedCast[index], ...updates };
    onUpdate({ cast: updatedCast });
  };

  const removeCast = (index: number) => {
    const updatedCast = story.cast.filter((_, i) => i !== index);
    onUpdate({ cast: updatedCast });
  };


  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-semibold text-gray-900 mb-4">👥 Characters & Cast</h2>
        <p className="text-sm text-gray-600 mb-6">Define characters, their roles, and how they're cast in the story.</p>
      </div>

      {/* Characters */}
      <div className="bg-gray-50 rounded-lg p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-medium text-gray-900">Characters</h3>
          <button
            onClick={addCharacter}
            className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 text-sm"
          >
            + Add Character
          </button>
        </div>

        <div className="space-y-4">
          {story.characters.map((character, index) => (
            <div key={character.id} className="bg-white rounded-lg border p-4">
              <div className="flex items-center justify-between mb-3">
                <h4 className="font-medium text-gray-900">
                  {character.name || `Character ${index + 1}`}
                </h4>
                <div className="flex space-x-2">
                  <button
                    onClick={() => setEditingCharacter(editingCharacter === index ? null : index)}
                    className="text-blue-600 hover:text-blue-800 text-sm"
                  >
                    {editingCharacter === index ? 'Collapse' : 'Edit'}
                  </button>
                  <button
                    onClick={() => removeCharacter(index)}
                    className="text-red-600 hover:text-red-800 text-sm"
                  >
                    Remove
                  </button>
                </div>
              </div>

              {editingCharacter === index && (
                <div className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Character ID
                      </label>
                      <input
                        type="text"
                        value={character.id}
                        onChange={(e) => updateCharacter(index, { id: e.target.value })}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm font-mono"
                        placeholder="char_hero"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Name
                      </label>
                      <input
                        type="text"
                        value={character.name}
                        onChange={(e) => updateCharacter(index, { name: e.target.value })}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
                        placeholder="Character name"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Summary
                    </label>
                    <textarea
                      value={character.summary}
                      onChange={(e) => updateCharacter(index, { summary: e.target.value })}
                      rows={3}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
                      placeholder="Character description and background..."
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Hooks
                    </label>
                    <HooksTagInput
                      value={character.hooks}
                      onChange={(hooks) => updateCharacter(index, { hooks })}
                      placeholder="Type a hook and press Enter or comma..."
                    />
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                      <UnifiedMediaUploader
                        items={character.assets.images}
                        onUpdate={(images) => updateCharacter(index, { 
                          assets: { 
                            ...character.assets, 
                            images 
                          } 
                        })}
                        placeholder="https://example.com/character.jpg"
                        label="Images"
                        acceptedFileTypes=".jpg,.jpeg,.png,.gif,.webp,.svg"
                        mediaType="image"
                        config={{ layout: 'media-sharing', ...LAYOUT_CONFIGS['media-sharing'], uploadPath: 'character' }}
                        characterId={character.id}
                        storyId={storyId || 'unknown'}
                      />
                    </div>
                    <div>
                      <UnifiedMediaUploader
                        items={character.assets.videos}
                        onUpdate={(videos) => updateCharacter(index, { 
                          assets: { 
                            ...character.assets, 
                            videos 
                          } 
                        })}
                        placeholder="https://youtube.com/watch?v=..."
                        label="Videos"
                        acceptedFileTypes=".mp4,.webm,.ogg,.avi,.mov"
                        mediaType="video"
                        config={{ layout: 'media-sharing', ...LAYOUT_CONFIGS['media-sharing'], uploadPath: 'character' }}
                        characterId={character.id}
                        storyId={storyId || 'unknown'}
                      />
                    </div>
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Roles */}
      <div className="bg-gray-50 rounded-lg p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-medium text-gray-900">Roles</h3>
          <button
            onClick={addRole}
            className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 text-sm"
          >
            + Add Role
          </button>
        </div>

        <div className="space-y-3">
          {story.roles.map((role, index) => (
            <div key={role.id} className="bg-white rounded-lg border p-3">
              <div className="flex items-center justify-between">
                <div className="flex-1 grid grid-cols-1 md:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Role ID
                    </label>
                    <input
                      type="text"
                      value={role.id}
                      onChange={(e) => updateRole(index, { id: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm font-mono"
                      placeholder="role_hero"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Label
                    </label>
                    <input
                      type="text"
                      value={role.label}
                      onChange={(e) => updateRole(index, { label: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
                      placeholder="Hero"
                    />
                  </div>
                </div>
                <button
                  onClick={() => removeRole(index)}
                  className="ml-3 text-red-600 hover:text-red-800 text-sm"
                >
                  Remove
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Cast */}
      <div className="bg-gray-50 rounded-lg p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-medium text-gray-900">Cast</h3>
          <button
            onClick={addCast}
            className="px-4 py-2 bg-purple-600 text-white rounded-md hover:bg-purple-700 text-sm"
          >
            + Add Cast
          </button>
        </div>

        <div className="space-y-3">
          {story.cast.map((cast, index) => (
            <div key={index} className="bg-white rounded-lg border p-3">
              <div className="flex items-center justify-between">
                <div className="flex-1 grid grid-cols-1 md:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Character
                    </label>
                    <select
                      value={cast.characterId}
                      onChange={(e) => updateCast(index, { characterId: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
                    >
                      <option value="">Select character...</option>
                      {story.characters.map((char) => (
                        <option key={char.id} value={char.id}>
                          {char.name || char.id}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Roles
                    </label>
                    <select
                      multiple
                      value={cast.roleIds}
                      onChange={(e) => updateCast(index, { 
                        roleIds: Array.from(e.target.selectedOptions, option => option.value) 
                      })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
                      size={3}
                    >
                      {story.roles.map((role) => (
                        <option key={role.id} value={role.id}>
                          {role.label || role.id}
                        </option>
                      ))}
                    </select>
                    <p className="text-xs text-gray-500 mt-1">Hold Ctrl/Cmd to select multiple</p>
                  </div>
                </div>
                <button
                  onClick={() => removeCast(index)}
                  className="ml-3 text-red-600 hover:text-red-800 text-sm"
                >
                  Remove
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
