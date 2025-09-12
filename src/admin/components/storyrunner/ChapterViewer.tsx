// src/admin/components/storyrunner/ChapterViewer.tsx
import React, { useState, useEffect } from 'react';
import { Spinner } from '../Spinner';
import { ErrorMessage } from '../ErrorMessage';
import { useToast } from '../Toast';
import { adminApi, Chapter, UserStorySession } from '../../api';

interface ChapterViewerProps {
  sessionId: string;
}

export const ChapterViewer: React.FC<ChapterViewerProps> = ({ sessionId }) => {
  const [chapters, setChapters] = useState<Chapter[]>([]);
  const [session, setSession] = useState<UserStorySession | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedChapter, setSelectedChapter] = useState<Chapter | null>(null);
  const { showToast } = useToast();

  useEffect(() => {
    if (sessionId) {
      loadData();
    }
  }, [sessionId]);

  const loadData = async () => {
    try {
      setLoading(true);
      setError(null);

      // Load session and chapters in parallel
      const [sessionResponse, chaptersResponse] = await Promise.all([
        adminApi.getStorySession(sessionId),
        adminApi.getSessionChapters(sessionId)
      ]);

      if (sessionResponse.ok) {
        setSession(sessionResponse.session);
      } else {
        setError('Failed to load session details');
        return;
      }

      if (chaptersResponse.ok) {
        setChapters(chaptersResponse.chapters);
        // Select the first chapter by default
        if (chaptersResponse.chapters.length > 0) {
          setSelectedChapter(chaptersResponse.chapters[0]);
        }
      } else {
        setError('Failed to load chapters');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load data');
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleString();
  };

  const getStatusBadge = (status: string) => {
    const statusClasses = {
      active: 'bg-green-100 text-green-800',
      finished: 'bg-blue-100 text-blue-800',
      abandoned: 'bg-red-100 text-red-800'
    };
    
    return (
      <span className={`px-2 py-1 text-xs font-medium rounded-full ${statusClasses[status as keyof typeof statusClasses] || 'bg-gray-100 text-gray-800'}`}>
        {status.charAt(0).toUpperCase() + status.slice(1)}
      </span>
    );
  };

  if (loading) {
    return <Spinner />;
  }

  if (error) {
    return <ErrorMessage message={error} onRetry={loadData} />;
  }

  if (!session) {
    return <ErrorMessage message="Session not found" />;
  }

  return (
    <div className="space-y-6">
      {/* Session Header */}
      <div className="bg-white rounded-lg shadow p-6">
        <div className="flex justify-between items-start mb-4">
          <div>
            <h2 className="text-2xl font-bold text-gray-900">Chapter Viewer</h2>
            <p className="text-gray-600">Session: {sessionId}</p>
          </div>
          {getStatusBadge(session.status)}
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div>
            <h3 className="text-sm font-medium text-gray-700 mb-2">Session Info</h3>
            <div className="space-y-2 text-sm">
              <div><span className="font-medium">User ID:</span> <span className="font-mono">{session.userId}</span></div>
              <div><span className="font-medium">Story ID:</span> <span className="font-mono">{session.storyId}</span></div>
              <div><span className="font-medium">Tone:</span> <span className="capitalize">{session.toneStyleId}</span></div>
              <div><span className="font-medium">Time:</span> <span className="capitalize">{session.timeFlavorId}</span></div>
            </div>
          </div>

          <div>
            <h3 className="text-sm font-medium text-gray-700 mb-2">Progress</h3>
            <div className="space-y-2 text-sm">
              <div><span className="font-medium">Current Chapter:</span> {session.currentChapter}</div>
              <div><span className="font-medium">Chapters Generated:</span> {session.chaptersGenerated}</div>
              <div><span className="font-medium">Total Chapters:</span> {chapters.length}</div>
            </div>
          </div>

          <div>
            <h3 className="text-sm font-medium text-gray-700 mb-2">Timeline</h3>
            <div className="space-y-2 text-sm">
              <div><span className="font-medium">Started:</span> {formatDate(session.sessionStartedAt)}</div>
              <div><span className="font-medium">Last Activity:</span> {formatDate(session.lastActivityAt)}</div>
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Chapter List */}
        <div className="lg:col-span-1">
          <div className="bg-white rounded-lg shadow">
            <div className="p-4 border-b border-gray-200">
              <h3 className="text-lg font-semibold text-gray-900">Chapters ({chapters.length})</h3>
            </div>
            <div className="max-h-96 overflow-y-auto">
              {chapters.length === 0 ? (
                <div className="p-4 text-center text-gray-500">
                  No chapters found
                </div>
              ) : (
                <div className="divide-y divide-gray-200">
                  {chapters.map((chapter) => (
                    <button
                      key={chapter._id}
                      onClick={() => setSelectedChapter(chapter)}
                      className={`w-full p-4 text-left hover:bg-gray-50 transition-colors ${
                        selectedChapter?._id === chapter._id ? 'bg-blue-50 border-r-4 border-blue-500' : ''
                      }`}
                    >
                      <div className="flex justify-between items-start">
                        <div className="flex-1">
                          <h4 className="font-medium text-gray-900 text-sm">
                            Chapter {chapter.chapterIndex}
                          </h4>
                          <p className="text-xs text-gray-600 mt-1 line-clamp-2">
                            {chapter.title}
                          </p>
                          <p className="text-xs text-gray-500 mt-1">
                            {formatDate(chapter.createdAt)}
                          </p>
                        </div>
                        <div className="ml-2">
                          <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-gray-100 text-gray-800">
                            {chapter.choices.length} choices
                          </span>
                        </div>
                      </div>
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Chapter Content */}
        <div className="lg:col-span-2">
          {selectedChapter ? (
            <div className="bg-white rounded-lg shadow">
              <div className="p-6">
                <div className="mb-6">
                  <h3 className="text-xl font-bold text-gray-900 mb-2">
                    Chapter {selectedChapter.chapterIndex}: {selectedChapter.title}
                  </h3>
                  <div className="flex items-center space-x-4 text-sm text-gray-600">
                    <span>Created: {formatDate(selectedChapter.createdAt)}</span>
                    <span>•</span>
                    <span>{selectedChapter.choices.length} choices</span>
                  </div>
                </div>

                {/* Opening Beat */}
                <div className="mb-6">
                  <h4 className="text-sm font-medium text-gray-700 mb-2">Opening Beat</h4>
                  <div className="bg-gray-50 rounded-lg p-4">
                    <p className="text-gray-800">{selectedChapter.openingBeat}</p>
                  </div>
                </div>

                {/* Chapter Content */}
                <div className="mb-6">
                  <h4 className="text-sm font-medium text-gray-700 mb-2">Content</h4>
                  <div className="prose max-w-none">
                    <div className="whitespace-pre-wrap text-gray-800 leading-relaxed">
                      {selectedChapter.content}
                    </div>
                  </div>
                </div>

                {/* Choices */}
                <div>
                  <h4 className="text-sm font-medium text-gray-700 mb-2">User Choices</h4>
                  <div className="space-y-3">
                    {selectedChapter.choices.map((choice, index) => (
                      <div key={index} className="border rounded-lg p-4">
                        <div className="flex items-start justify-between">
                          <div className="flex-1">
                            <div className="flex items-center mb-2">
                              <span className="inline-flex items-center justify-center w-6 h-6 bg-blue-100 text-blue-800 text-xs font-medium rounded-full mr-3">
                                {index + 1}
                              </span>
                              <span className="font-medium text-gray-900">Choice {index + 1}</span>
                            </div>
                            <p className="text-gray-800 ml-9">{choice.text}</p>
                          </div>
                          {choice.nextChapterId && (
                            <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800 ml-4">
                              Has Next Chapter
                            </span>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* System Prompt Used */}
                <div className="mt-6 pt-6 border-t border-gray-200">
                  <h4 className="text-sm font-medium text-gray-700 mb-2">System Prompt Used</h4>
                  <div className="bg-gray-50 rounded-lg p-4 max-h-32 overflow-y-auto">
                    <p className="text-xs text-gray-600 font-mono whitespace-pre-wrap">
                      {selectedChapter.systemPromptUsed}
                    </p>
                  </div>
                </div>
              </div>
            </div>
          ) : (
            <div className="bg-white rounded-lg shadow p-12 text-center">
              <div className="text-gray-500">
                <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
                <h3 className="mt-2 text-sm font-medium text-gray-900">No Chapter Selected</h3>
                <p className="mt-1 text-sm text-gray-500">
                  Select a chapter from the list to view its content.
                </p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
