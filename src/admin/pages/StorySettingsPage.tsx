// src/admin/pages/StorySettingsPage.tsx
import React from 'react';
import { StorySettingsManager } from '../components/storySettings/StorySettingsManager';

export const StorySettingsPage: React.FC = () => {
  return (
    <div className="p-6">
      <div className="max-w-7xl mx-auto">
        <div className="mb-6">
          <h1 className="text-3xl font-bold text-gray-900">Story Settings</h1>
          <p className="mt-2 text-gray-600">
            Manage tone styles and time flavors for story generation
          </p>
        </div>
        
        <StorySettingsManager />
      </div>
    </div>
  );
};
