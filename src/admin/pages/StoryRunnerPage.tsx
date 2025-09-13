// src/admin/pages/StoryRunnerPage.tsx
import React, { useState } from 'react';
import { StorySettingsView } from '../components/storyrunner/StorySettingsView';
import { StorySessionsView } from '../components/storyrunner/StorySessionsView';
import { ChapterViewer } from '../components/storyrunner/ChapterViewer';

type ViewType = 'settings' | 'sessions' | 'chapters';

export const StoryRunnerPage: React.FC = () => {
  const [currentView, setCurrentView] = useState<ViewType>('settings');
  const [selectedSessionId, setSelectedSessionId] = useState<string>('');

  const views = [
    { id: 'settings' as ViewType, label: 'Story Settings', icon: '⚙️' },
    { id: 'sessions' as ViewType, label: 'Story Sessions', icon: '📊' },
    { id: 'chapters' as ViewType, label: 'Chapter Viewer', icon: '📖' }
  ];

  const handleViewChange = (view: ViewType) => {
    setCurrentView(view);
    if (view !== 'chapters') {
      setSelectedSessionId('');
    }
  };

  const handleSessionSelect = (sessionId: string) => {
    setSelectedSessionId(sessionId);
    setCurrentView('chapters');
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">StoryRunner AI Dashboard</h1>
          <p className="mt-2 text-gray-600">
            Manage AI-powered storytelling settings, sessions, and chapters
          </p>
        </div>

        {/* Navigation Tabs */}
        <div className="mb-8">
          <div className="border-b border-gray-200">
            <nav className="-mb-px flex space-x-8">
              {views.map((view) => (
                <button
                  key={view.id}
                  onClick={() => handleViewChange(view.id)}
                  className={`py-2 px-1 border-b-2 font-medium text-sm ${
                    currentView === view.id
                      ? 'border-blue-500 text-blue-600'
                      : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                  }`}
                >
                  <span className="mr-2">{view.icon}</span>
                  {view.label}
                </button>
              ))}
            </nav>
          </div>
        </div>

        {/* View Content */}
        <div className="bg-white rounded-lg shadow">
          {currentView === 'settings' && <StorySettingsView />}
          {currentView === 'sessions' && (
            <div className="p-6">
              <StorySessionsView />
              {selectedSessionId && (
                <div className="mt-6 pt-6 border-t border-gray-200">
                  <div className="flex justify-between items-center mb-4">
                    <h3 className="text-lg font-semibold text-gray-900">
                      Chapters for Session: {selectedSessionId}
                    </h3>
                    <button
                      onClick={() => setSelectedSessionId('')}
                      className="px-3 py-1 bg-gray-300 text-gray-700 text-sm rounded-md hover:bg-gray-400"
                    >
                      Close
                    </button>
                  </div>
                  <ChapterViewer sessionId={selectedSessionId} />
                </div>
              )}
            </div>
          )}
          {currentView === 'chapters' && (
            <div className="p-6">
              {selectedSessionId ? (
                <ChapterViewer sessionId={selectedSessionId} />
              ) : (
                <div className="text-center py-12">
                  <div className="text-gray-500">
                    <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                    </svg>
                    <h3 className="mt-2 text-sm font-medium text-gray-900">No Session Selected</h3>
                    <p className="mt-1 text-sm text-gray-500">
                      Go to the Story Sessions tab to select a session and view its chapters.
                    </p>
                    <div className="mt-6">
                      <button
                        onClick={() => setCurrentView('sessions')}
                        className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700"
                      >
                        View Story Sessions
                      </button>
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
