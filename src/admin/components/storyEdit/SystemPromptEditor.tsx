// src/admin/components/storyEdit/SystemPromptEditor.tsx
import React, { useState, useRef, useEffect } from 'react';

interface SystemPromptEditorProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  rows?: number;
  className?: string;
}

// Available interpolation variables
const AVAILABLE_VARIABLES = [
  { name: 'TONE_STYLE', description: 'The selected tone style (e.g., Horror, Comedy, Drama)' },
  { name: 'TIME_FLAVOR', description: 'The selected time flavor (e.g., Medieval, Futuristic, Modern)' },
  { name: 'TONE_DESCRIPTION', description: 'Description of the selected tone style' },
  { name: 'TIME_DESCRIPTION', description: 'Description of the selected time flavor' },
  { name: 'STORY_TITLE', description: 'The title of the story' },
  { name: 'AUTHOR_NAME', description: 'The name of the story author' },
  { name: 'STORY_DESCRIPTION', description: 'The description of the story' },
  { name: 'OPENING_BEATS', description: 'Formatted list of opening beats' },
  { name: 'SAFETY_GUARDRAILS', description: 'Formatted list of safety guardrails' }
];

export const SystemPromptEditor: React.FC<SystemPromptEditorProps> = ({
  value,
  onChange,
  placeholder = "You are an AI storyteller for [Story Title]. Your role is to...",
  rows = 12,
  className = ""
}) => {
  const [showVariables, setShowVariables] = useState(false);
  const [cursorPosition, setCursorPosition] = useState(0);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const [isFocused, setIsFocused] = useState(false);
  // Function to insert variable at cursor position
  const insertVariable = (variableName: string) => {
    const textarea = textareaRef.current;
    if (!textarea) return;

    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;
    const variable = `{{${variableName}}}`;
    
    const newValue = value.substring(0, start) + variable + value.substring(end);
    onChange(newValue);
    
    // Set cursor position after the inserted variable
    setTimeout(() => {
      textarea.focus();
      textarea.setSelectionRange(start + variable.length, start + variable.length);
    }, 0);
    
    setShowVariables(false);
  };

  // Handle textarea changes
  const handleTextareaChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    onChange(e.target.value);
    setCursorPosition(e.target.selectionStart);
  };

  // Handle key events
  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === '{' && e.ctrlKey) {
      e.preventDefault();
      setShowVariables(true);
    }
  };

  // Handle focus events
  const handleFocus = () => setIsFocused(true);
  const handleBlur = () => setIsFocused(false);

  return (
    <div className="relative">
      {/* Label and Help Text */}
      <div className="flex items-center justify-between mb-2">
        <label className="block text-sm font-medium text-gray-700">
          Story Prompt Template*
        </label>
        <div className="flex items-center space-x-2">
          <button
            type="button"
            onClick={() => setShowVariables(!showVariables)}
            className="text-xs text-blue-600 hover:text-blue-800 underline"
          >
            {showVariables ? 'Hide' : 'Show'} Variables
          </button>
          <span className="text-xs text-gray-500">
            Ctrl+{'{'} to insert
          </span>
        </div>
      </div>

      {/* Variables Panel */}
      {showVariables && (
        <div className="mb-4 p-4 bg-gray-50 border border-gray-200 rounded-lg">
          <h4 className="text-sm font-medium text-gray-900 mb-3">Available Variables</h4>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
            {AVAILABLE_VARIABLES.map((variable) => (
              <button
                key={variable.name}
                type="button"
                onClick={() => insertVariable(variable.name)}
                className="text-left p-2 bg-white border border-gray-200 rounded hover:bg-blue-50 hover:border-blue-300 transition-colors"
              >
                <div className="font-mono text-sm text-blue-600">
                  {`{{${variable.name}}}`}
                </div>
                <div className="text-xs text-gray-600 mt-1">
                  {variable.description}
                </div>
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Textarea */}
      <textarea
        ref={textareaRef}
        value={value}
        onChange={handleTextareaChange}
        onKeyDown={handleKeyDown}
        onFocus={handleFocus}
        onBlur={handleBlur}
        rows={rows}
        className={`w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 font-mono text-sm ${className}`}
        placeholder={placeholder}
      />

      {/* Highlighted Preview (shown when focused or has content) */}
      {(isFocused || value) && (
        <div className="mt-2 p-3 bg-gray-50 border border-gray-200 rounded-md">
          <div className="text-xs text-gray-600 mb-2 font-medium">Preview with highlighted variables:</div>
          <div className="font-mono text-sm text-gray-800 whitespace-pre-wrap">
            {value.split(/(\{\{[^}]+\}\})/g).map((part, index) => {
              if (part.match(/^\{\{[^}]+\}\}$/)) {
                return (
                  <span
                    key={index}
                    className="bg-blue-100 text-blue-800 px-1 py-0.5 rounded text-sm font-medium"
                    title={`Interpolation variable: ${part}`}
                  >
                    {part}
                  </span>
                );
              }
              return part;
            })}
            {!value && (
              <span className="text-gray-400 italic">Start typing to see variable highlighting...</span>
            )}
          </div>
        </div>
      )}

      {/* Help Text */}
      <div className="mt-2 space-y-1">
        <p className="text-xs text-gray-500">
          This prompt defines the AI's role, personality, and behavior. It's the core instruction that guides all AI responses.
        </p>
        <p className="text-xs text-blue-600">
          💡 Use variables like <code className="bg-blue-100 px-1 rounded">{'{{TONE_STYLE}}'}</code> and <code className="bg-blue-100 px-1 rounded">{'{{TIME_FLAVOR}}'}</code> to personalize prompts dynamically.
        </p>
      </div>

      {/* Variable Usage Stats */}
      {value && (
        <div className="mt-3 p-3 bg-gray-50 rounded-lg">
          <h5 className="text-xs font-medium text-gray-700 mb-2">Variable Usage</h5>
          <div className="flex flex-wrap gap-2">
            {AVAILABLE_VARIABLES.map((variable) => {
              const variablePattern = `{{${variable.name}}}`;
              const count = (value.match(new RegExp(variablePattern.replace(/[{}]/g, '\\$&'), 'g')) || []).length;
              
              if (count > 0) {
                return (
                  <span
                    key={variable.name}
                    className="inline-flex items-center px-2 py-1 bg-green-100 text-green-800 text-xs rounded-full"
                  >
                    <span className="font-mono">{variablePattern}</span>
                    <span className="ml-1 bg-green-200 text-green-900 px-1 rounded-full text-xs">
                      {count}
                    </span>
                  </span>
                );
              }
              return null;
            })}
            {AVAILABLE_VARIABLES.every(variable => 
              !value.includes(`{{${variable.name}}}`)
            ) && (
              <span className="text-xs text-gray-500 italic">
                No variables used
              </span>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
