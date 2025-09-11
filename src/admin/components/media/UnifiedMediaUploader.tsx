// src/admin/components/media/UnifiedMediaUploader.tsx
// Main unified media uploader component with configurable layouts

import React, { useState, useRef } from 'react';
import { UnifiedMediaUploaderProps, InputMode, UploadState, ToastState } from './types';
import { MediaItem } from './MediaItem';
import { MediaPreview } from './MediaPreview';
import {
  getUrlType,
  handleFileUpload,
  handleAddUrl,
  handleRemove,
  handleDragOver,
  handleDragLeave,
  handleDrop,
  getGridClasses,
  getInputModeClasses
} from './mediaUtils';

export const UnifiedMediaUploader: React.FC<UnifiedMediaUploaderProps> = ({
  items,
  onUpdate,
  placeholder,
  label,
  acceptedFileTypes,
  mediaType,
  config,
  storyId,
  characterId
}) => {
  // State management
  const [newUrl, setNewUrl] = useState('');
  const [inputMode, setInputMode] = useState<InputMode>('url');
  const [uploadState, setUploadState] = useState<UploadState>({
    isUploading: false,
    isDragOver: false,
    uploadedItems: new Set(),
    newItems: new Set(),
    showSuccessToast: false,
    showErrorToast: false,
    errorMessage: '',
  });
  const [previewState, setPreviewState] = useState<{
    isOpen: boolean;
    url: string;
    type: string;
  }>({
    isOpen: false,
    url: '',
    type: 'unknown',
  });

  const fileInputRef = useRef<HTMLInputElement>(null);

  // Helper functions for state updates
  const updateUploadState = (updates: Partial<UploadState>) => {
    setUploadState(prev => {
      const newState = { ...prev, ...updates };
      // Ensure Sets are properly maintained
      if (newState.uploadedItems && !(newState.uploadedItems instanceof Set)) {
        newState.uploadedItems = new Set();
      }
      if (newState.newItems && !(newState.newItems instanceof Set)) {
        newState.newItems = new Set();
      }
      return newState;
    });
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      handleAddUrl(
        newUrl,
        onUpdate,
        items,
        setNewUrl,
        (updater) => updateUploadState({ newItems: updater(uploadState.newItems) })
      );
    }
  };

  const handleFileInputChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    await handleFileUpload(
      e,
      config,
      onUpdate,
      items,
      (loading) => updateUploadState({ isUploading: loading }),
      (updater) => updateUploadState({ uploadedItems: updater(uploadState.uploadedItems) }),
      (show) => updateUploadState({ showSuccessToast: show }),
      (show) => updateUploadState({ showErrorToast: show }),
      (message) => updateUploadState({ errorMessage: message }),
      storyId,
      characterId,
      mediaType
    );
  };

  const handleDragOverEvent = (e: React.DragEvent) => {
    handleDragOver(e, (over) => updateUploadState({ isDragOver: over }));
  };

  const handleDragLeaveEvent = (e: React.DragEvent) => {
    handleDragLeave(e, (over) => updateUploadState({ isDragOver: over }));
  };

  const handleDropEvent = (e: React.DragEvent) => {
    handleDrop(
      e,
      config,
      onUpdate,
      items,
      (over) => updateUploadState({ isDragOver: over }),
      (loading) => updateUploadState({ isUploading: loading }),
      (updater) => updateUploadState({ uploadedItems: updater(uploadState.uploadedItems) }),
      (show) => updateUploadState({ showSuccessToast: show }),
      (show) => updateUploadState({ showErrorToast: show }),
      (message) => updateUploadState({ errorMessage: message }),
      storyId,
      characterId,
      mediaType
    );
  };

  const handleRemoveItem = (index: number) => {
    handleRemove(
      index,
      onUpdate,
      items,
      (updater) => updateUploadState({ uploadedItems: updater(uploadState.uploadedItems) })
    );
  };

  const handlePreviewItem = (url: string) => {
    setPreviewState({
      isOpen: true,
      url,
      type: getUrlType(url),
    });
  };

  const closePreview = () => {
    setPreviewState({
      isOpen: false,
      url: '',
      type: 'unknown',
    });
  };

  const gridClasses = getGridClasses(config.layout, config.gridCols);
  const inputModeClasses = getInputModeClasses(inputMode);

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-medium text-gray-900">{label}</h3>
        <div className="text-sm text-gray-500">
          {items.length} item{items.length !== 1 ? 's' : ''}
        </div>
      </div>

      {/* Input Section */}
      <div className="space-y-3">
        {/* Mode Toggle */}
        <div className="flex gap-2">
          <button
            type="button"
            onClick={() => setInputMode('url')}
            className={`px-3 py-2 text-sm font-medium rounded-md transition-colors ${
              inputMode === 'url'
                ? 'bg-blue-100 text-blue-700 border border-blue-300'
                : 'bg-gray-100 text-gray-700 border border-gray-300 hover:bg-gray-200'
            }`}
          >
            Add a link
          </button>
          <button
            type="button"
            onClick={() => setInputMode('upload')}
            className={`px-3 py-2 text-sm font-medium rounded-md transition-colors ${
              inputMode === 'upload'
                ? 'bg-blue-100 text-blue-700 border border-blue-300'
                : 'bg-gray-100 text-gray-700 border border-gray-300 hover:bg-gray-200'
            }`}
          >
            Upload a file
          </button>
        </div>

        {/* Input Field */}
        {inputMode === 'url' ? (
          <div className="flex gap-2">
            <input
              type="url"
              value={newUrl}
              onChange={(e) => setNewUrl(e.target.value)}
              onKeyPress={handleKeyPress}
              placeholder={placeholder}
              className="flex-1 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
            <button
              type="button"
              onClick={() => handleAddUrl(
                newUrl,
                onUpdate,
                items,
                setNewUrl,
                (updater) => updateUploadState({ newItems: updater(uploadState.newItems) })
              )}
              disabled={!newUrl.trim()}
              className="px-4 py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors"
            >
              Add
            </button>
          </div>
        ) : (
          <div
            className={`border-2 border-dashed rounded-lg p-6 text-center transition-colors ${
              uploadState.isDragOver
                ? 'border-blue-400 bg-blue-50'
                : 'border-gray-300 hover:border-gray-400'
            }`}
            onDragOver={handleDragOverEvent}
            onDragLeave={handleDragLeaveEvent}
            onDrop={handleDropEvent}
          >
            <input
              ref={fileInputRef}
              type="file"
              accept={acceptedFileTypes}
              onChange={handleFileInputChange}
              className="hidden"
            />
            <div className="space-y-2">
              <svg className="mx-auto h-12 w-12 text-gray-400" stroke="currentColor" fill="none" viewBox="0 0 48 48">
                <path d="M28 8H12a4 4 0 00-4 4v20m32-12v8m0 0v8a4 4 0 01-4 4H12a4 4 0 01-4-4v-4m32-4l-3.172-3.172a4 4 0 00-5.656 0L28 28M8 32l9.172-9.172a4 4 0 015.656 0L28 28m0 0l4 4m4-24h8m-4-4v8m-12 4h.02" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" />
              </svg>
              <div className="text-sm text-gray-600">
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  className="font-medium text-blue-600 hover:text-blue-500"
                >
                  Click to upload
                </button>
                {' '}or drag and drop
              </div>
              <p className="text-xs text-gray-500">
                {acceptedFileTypes} files accepted
              </p>
            </div>
          </div>
        )}
      </div>

      {/* Media Grid */}
      {items.length > 0 && (
        <div className={gridClasses}>
          {items.map((url, index) => (
            <MediaItem
              key={`${url}-${index}`}
              url={url}
              onRemove={() => handleRemoveItem(index)}
              onPreview={() => handlePreviewItem(url)}
              type={getUrlType(url)}
              isUploadSuccess={uploadState.uploadedItems instanceof Set ? uploadState.uploadedItems.has(url) : false}
              isNew={uploadState.newItems instanceof Set ? uploadState.newItems.has(index) : false}
              thumbnailSize={config.thumbnailSize}
              layout={config.layout}
            />
          ))}
        </div>
      )}

      {/* Empty State */}
      {items.length === 0 && (
        <div className="text-center py-8 text-gray-500">
          <svg className="mx-auto h-12 w-12 text-gray-400 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
          </svg>
          <p>No {mediaType} items yet</p>
          <p className="text-sm">Add some using the options above</p>
        </div>
      )}

      {/* Loading State */}
      {uploadState.isUploading && (
        <div className="flex items-center justify-center py-4">
          <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-500"></div>
          <span className="ml-2 text-sm text-gray-600">Uploading...</span>
        </div>
      )}

      {/* Toast Notifications */}
      {uploadState.showSuccessToast && (
        <div className="fixed top-4 right-4 bg-green-500 text-white px-4 py-2 rounded-md shadow-lg z-50">
          ✅ Upload successful!
        </div>
      )}

      {uploadState.showErrorToast && (
        <div className="fixed top-4 right-4 bg-red-500 text-white px-4 py-2 rounded-md shadow-lg z-50">
          ❌ {uploadState.errorMessage}
        </div>
      )}

      {/* Preview Modal */}
      <MediaPreview
        isOpen={previewState.isOpen}
        onClose={closePreview}
        url={previewState.url}
        type={previewState.type as any}
      />
    </div>
  );
};
