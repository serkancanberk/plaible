// src/admin/components/categoryManager/ConfigPreviewPanel.tsx
import React, { useState } from 'react';
import { CategoryConfigItem } from '../../../config/categoryConfig';

interface ConfigPreviewPanelProps {
  config: CategoryConfigItem[];
}

export const ConfigPreviewPanel: React.FC<ConfigPreviewPanelProps> = ({ config }) => {
  const [isExpanded, setIsExpanded] = useState(false);

  const formatConfig = (config: CategoryConfigItem[]) => {
    return JSON.stringify(config, null, 2);
  };

  const copyToClipboard = async () => {
    try {
      await navigator.clipboard.writeText(formatConfig(config));
      // You could add a toast notification here
    } catch (err) {
      console.error('Failed to copy to clipboard:', err);
    }
  };

  return (
    <div className="bg-white rounded-lg shadow-sm border mb-6">
      <div className="p-4 border-b">
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-medium text-gray-900">Configuration Preview</h3>
          <div className="flex items-center space-x-2">
            <button
              onClick={copyToClipboard}
              className="px-3 py-1 text-sm bg-gray-100 text-gray-700 rounded hover:bg-gray-200"
            >
              Copy JSON
            </button>
            <button
              onClick={() => setIsExpanded(!isExpanded)}
              className="p-1 hover:bg-gray-100 rounded"
            >
              <svg
                className={`w-5 h-5 transform transition-transform ${isExpanded ? 'rotate-180' : ''}`}
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
              </svg>
            </button>
          </div>
        </div>
      </div>
      
      {isExpanded && (
        <div className="p-4">
          <div className="bg-gray-900 rounded-lg p-4 overflow-x-auto">
            <pre className="text-green-400 text-sm font-mono">
              <code>{formatConfig(config)}</code>
            </pre>
          </div>
        </div>
      )}
    </div>
  );
};
