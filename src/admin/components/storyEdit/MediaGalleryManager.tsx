// src/admin/components/storyEdit/MediaGalleryManager.tsx
import React, { useState, useRef, useEffect } from 'react';

interface MediaGalleryManagerProps {
  items: string[];
  onUpdate: (items: string[]) => void;
  placeholder: string;
  label: string;
  acceptedFileTypes: string;
  mediaType: 'image' | 'video' | 'audio';
  storyId?: string;
  gridCols?: number; // Allow customization of grid columns
}

// Helper function to detect URL type
const getUrlType = (url: string): 'image' | 'video' | 'audio' | 'youtube' | 'unknown' => {
  const lowerUrl = url.toLowerCase();
  
  if (lowerUrl.includes('youtube.com') || lowerUrl.includes('youtu.be')) {
    return 'youtube';
  }
  
  if (lowerUrl.match(/\.(jpg|jpeg|png|gif|webp|svg)$/)) {
    return 'image';
  }
  
  if (lowerUrl.match(/\.(mp4|webm|ogg|avi|mov)$/) || lowerUrl.includes('vimeo.com')) {
    return 'video';
  }
  
  if (lowerUrl.match(/\.(mp3|wav|ogg|m4a)$/) || lowerUrl.includes('soundcloud.com')) {
    return 'audio';
  }
  
  return 'unknown';
};

// Component for displaying individual media items in grid
const MediaGalleryItem: React.FC<{
  url: string;
  onRemove: () => void;
  type: 'image' | 'video' | 'audio' | 'youtube' | 'unknown';
  isUploadSuccess?: boolean;
  isNew?: boolean;
}> = ({ url, onRemove, type, isUploadSuccess = false, isNew = false }) => {
  const [imageError, setImageError] = useState(false);
  const [showPreviewModal, setShowPreviewModal] = useState(false);
  const [showConfirmModal, setShowConfirmModal] = useState(false);

  // Add CSS animation for fade-in effect
  useEffect(() => {
    if (isNew) {
      const style = document.createElement('style');
      style.textContent = `
        @keyframes fadeIn {
          from { opacity: 0; transform: translateY(10px); }
          to { opacity: 1; transform: translateY(0); }
        }
      `;
      document.head.appendChild(style);
      return () => {
        document.head.removeChild(style);
      };
    }
  }, [isNew]);
  
  const handlePreviewClick = () => {
    if (type === 'image' || type === 'video' || type === 'youtube') {
      setShowPreviewModal(true);
    }
  };
  
  const renderPreview = () => {
    switch (type) {
      case 'image':
        return (
          <div className="relative group">
            {!imageError ? (
              <div 
                className="cursor-pointer transition-transform duration-200 hover:scale-105 hover:shadow-lg"
                onClick={handlePreviewClick}
                title="Click to view larger preview"
              >
                <img
                  src={url}
                  alt="Media preview"
                  className="w-full aspect-square object-cover rounded-md"
                  onError={() => setImageError(true)}
                />
                <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-10 transition-all duration-200 rounded-md flex items-center justify-center">
                  <div className="opacity-0 group-hover:opacity-100 transition-opacity duration-200 bg-white bg-opacity-90 rounded-full p-2">
                    <svg className="w-6 h-6 text-gray-700" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0zM10 7v3m0 0v3m0-3h3m-3 0H7" />
                    </svg>
                  </div>
                </div>
              </div>
            ) : (
              <div className="w-full aspect-square bg-gray-200 rounded-md flex items-center justify-center">
                <span className="text-gray-500 text-sm">Failed to load image</span>
              </div>
            )}
          </div>
        );
        
      case 'video':
        return (
          <div className="relative group">
            <div 
              className="cursor-pointer transition-transform duration-200 hover:scale-105 hover:shadow-lg"
              onClick={handlePreviewClick}
              title="Click to view larger preview"
            >
              <video
                src={url}
                className="w-full aspect-square object-cover rounded-md"
                controls
                preload="metadata"
                onClick={(e) => e.stopPropagation()}
              />
              <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-10 transition-all duration-200 rounded-md flex items-center justify-center pointer-events-none">
                <div className="opacity-0 group-hover:opacity-100 transition-opacity duration-200 bg-white bg-opacity-90 rounded-full p-2">
                  <svg className="w-6 h-6 text-gray-700" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                  </svg>
                </div>
              </div>
            </div>
          </div>
        );
        
      case 'youtube':
        const videoId = url.includes('youtu.be') 
          ? url.split('youtu.be/')[1]?.split('?')[0]
          : url.split('v=')[1]?.split('&')[0];
        
        return videoId ? (
          <div 
            className="cursor-pointer transition-transform duration-200 hover:scale-105 hover:shadow-lg"
            onClick={handlePreviewClick}
            title="Click to view larger preview"
          >
            <iframe
              src={`https://www.youtube.com/embed/${videoId}`}
              className="w-full aspect-square rounded-md"
              frameBorder="0"
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
              allowFullScreen
            />
          </div>
        ) : (
          <div className="w-full aspect-square bg-gray-200 rounded-md flex items-center justify-center">
            <span className="text-gray-500 text-sm">Invalid YouTube URL</span>
          </div>
        );
        
      case 'audio':
        return (
          <div className="w-full aspect-square bg-gray-100 rounded-md flex items-center justify-center">
            <audio src={url} controls className="w-full" />
          </div>
        );
        
      default:
        return (
          <div className="w-full aspect-square bg-gray-200 rounded-md flex items-center justify-center">
            <span className="text-gray-500 text-sm">🔗 {url}</span>
          </div>
        );
    }
  };

  const handleRemoveClick = () => {
    setShowConfirmModal(true);
  };

  const handleConfirmRemove = () => {
    onRemove();
    setShowConfirmModal(false);
  };

  return (
    <div className={`bg-white border border-gray-200 rounded-lg p-3 transition-all duration-1000 ${
      isNew ? 'opacity-0 animate-pulse' : 'opacity-100'
    }`} style={isNew ? { animation: 'fadeIn 1s ease-in-out forwards' } : {}}>
      <div className="flex justify-between items-start mb-2">
        <div className="flex-1 min-w-0 flex items-center gap-2">
          <p className="text-xs text-gray-600 truncate" title={url}>
            {url}
          </p>
          {isNew && (
            <span className="bg-blue-100 text-blue-800 text-xs px-2 py-1 rounded-full font-medium" title="New item - will be saved when you click Save Changes">
              New
            </span>
          )}
          {isUploadSuccess && (
            <span className="text-green-500 text-sm" title="Upload successful">
              ✅
            </span>
          )}
        </div>
      </div>
      
      {/* Media Preview with Hover Buttons */}
      <div className="relative w-full aspect-square group">
        {renderPreview()}
        
        {/* Hover Action Buttons */}
        <div className="absolute top-2 right-2 flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity duration-200">
          <button
            onClick={handleRemoveClick}
            className="bg-white text-red-600 hover:bg-red-50 text-xs rounded px-2 py-1 shadow-md border border-red-200 transition-colors duration-200"
            title="Remove this media item"
          >
            ✖ Remove
          </button>
        </div>
      </div>

      {/* Preview Modal */}
      {showPreviewModal && (
        <div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50" onClick={() => setShowPreviewModal(false)}>
          <div className="relative max-w-4xl max-h-[90vh] bg-white rounded-lg overflow-hidden" onClick={(e) => e.stopPropagation()}>
            <div className="flex justify-between items-center p-4 border-b">
              <h3 className="text-lg font-medium">Media Preview</h3>
              <button
                onClick={() => setShowPreviewModal(false)}
                className="text-gray-400 hover:text-gray-600 transition-colors"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            <div className="p-4">
              {type === 'image' && (
                <img
                  src={url}
                  alt="Media preview"
                  className="max-w-full max-h-[70vh] object-contain mx-auto"
                />
              )}
              {type === 'video' && (
                <video
                  src={url}
                  controls
                  className="max-w-full max-h-[70vh] mx-auto"
                />
              )}
              {type === 'youtube' && (
                <div className="aspect-video w-full">
                  <iframe
                    src={url.includes('youtu.be') 
                      ? `https://www.youtube.com/embed/${url.split('youtu.be/')[1]?.split('?')[0]}`
                      : `https://www.youtube.com/embed/${url.split('v=')[1]?.split('&')[0]}`
                    }
                    className="w-full h-full"
                    frameBorder="0"
                    allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                    allowFullScreen
                  />
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Confirmation Modal */}
      {showConfirmModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50" onClick={() => setShowConfirmModal(false)}>
          <div className="bg-white rounded-lg p-6 max-w-md mx-4" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center mb-4">
              <div className="flex-shrink-0 w-10 h-10 mx-auto bg-red-100 rounded-full flex items-center justify-center">
                <svg className="w-6 h-6 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
                </svg>
              </div>
            </div>
            <div className="text-center">
              <h3 className="text-lg font-medium text-gray-900 mb-2">Remove Media Item</h3>
              <p className="text-sm text-gray-500 mb-6">
                Are you sure you want to remove this media item? This action cannot be undone.
              </p>
              <div className="flex gap-3 justify-center">
                <button
                  onClick={() => setShowConfirmModal(false)}
                  className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                >
                  Cancel
                </button>
                <button
                  onClick={handleConfirmRemove}
                  className="px-4 py-2 text-sm font-medium text-white bg-red-600 border border-transparent rounded-md hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500"
                >
                  Remove
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export const MediaGalleryManager: React.FC<MediaGalleryManagerProps> = ({
  items,
  onUpdate,
  placeholder,
  label,
  acceptedFileTypes,
  mediaType,
  storyId,
  gridCols = 3 // Default to 3 columns for better layout
}) => {
  const [newUrl, setNewUrl] = useState('');
  const [isUploading, setIsUploading] = useState(false);
  const [inputMode, setInputMode] = useState<'url' | 'upload'>('url');
  const [isDragOver, setIsDragOver] = useState(false);
  const [uploadedItems, setUploadedItems] = useState<Set<string>>(new Set());
  const [showSuccessToast, setShowSuccessToast] = useState(false);
  const [showErrorToast, setShowErrorToast] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [newItems, setNewItems] = useState<Set<number>>(new Set());
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleAddUrl = () => {
    if (newUrl.trim()) {
      const newIndex = items.length;
      onUpdate([...items, newUrl.trim()]);
      setNewUrl('');
      // Mark as new item for animation
      setNewItems(prev => new Set(Array.from(prev).concat(newIndex)));
      // Remove from new items after animation
      setTimeout(() => {
        setNewItems(prev => {
          const newSet = new Set(prev);
          newSet.delete(newIndex);
          return newSet;
        });
      }, 1000);
    }
  };

  const handleRemove = (index: number) => {
    const removedUrl = items[index];
    onUpdate(items.filter((_, i) => i !== index));
    // Remove from uploaded items if it was uploaded
    setUploadedItems(prev => {
      const newSet = new Set(prev);
      newSet.delete(removedUrl);
      return newSet;
    });
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      handleAddUrl();
    }
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsUploading(true);
    setErrorMessage('');

    try {
      const formData = new FormData();
      formData.append('file', file);
      
      // Generate a story-specific path
      const path = `stories/${storyId || 'unknown'}/${mediaType}s/${Date.now()}-${file.name}`;
      formData.append('path', path);

      const response = await fetch('/api/upload/media', {
        method: 'POST',
        credentials: 'include',
        body: formData
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ message: 'Upload failed' }));
        throw new Error(errorData.message || 'Upload failed');
      }

      const result = await response.json();
      const uploadedUrl = result.url;

      // Add the uploaded URL to the items
      const newIndex = items.length;
      onUpdate([...items, uploadedUrl]);
      
      // Mark as uploaded and show success
      setUploadedItems(prev => new Set(Array.from(prev).concat(uploadedUrl)));
      setShowSuccessToast(true);
      setTimeout(() => setShowSuccessToast(false), 3000);

      // Mark as new item for animation
      setNewItems(prev => new Set(Array.from(prev).concat(newIndex)));
      setTimeout(() => {
        setNewItems(prev => {
          const newSet = new Set(prev);
          newSet.delete(newIndex);
          return newSet;
        });
      }, 1000);

    } catch (error) {
      console.error('File upload error:', error);
      setErrorMessage(error instanceof Error ? error.message : 'Upload failed');
      setShowErrorToast(true);
      setTimeout(() => setShowErrorToast(false), 5000);
    } finally {
      setIsUploading(false);
      // Reset file input
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  const handleUploadClick = () => {
    fileInputRef.current?.click();
  };

  // Drag and drop handlers
  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragOver(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragOver(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragOver(false);

    const files = Array.from(e.dataTransfer.files);
    if (files.length > 0) {
      const file = files[0]; // Only handle the first file
      handleFileUpload({ target: { files: [file] } } as any);
    }
  };

  return (
    <div>
      <label className="block text-sm font-medium text-gray-700 mb-2">
        {label}
      </label>
      
      {/* Success Toast */}
      {showSuccessToast && (
        <div className="fixed top-4 right-4 bg-green-500 text-white px-4 py-2 rounded-md shadow-lg z-50 flex items-center gap-2">
          <span>✅</span>
          <span>Upload successful!</span>
        </div>
      )}

      {/* Error Toast */}
      {showErrorToast && (
        <div className="fixed top-4 right-4 bg-red-500 text-white px-4 py-2 rounded-md shadow-lg z-50 flex items-center gap-2 max-w-md">
          <span>❌</span>
          <span>{errorMessage}</span>
        </div>
      )}

      {/* Existing items in grid layout */}
      {items.length > 0 && (
        <div className={`grid gap-3 mb-4`} style={{ gridTemplateColumns: `repeat(${gridCols}, 1fr)` }}>
          {items.map((url, index) => (
            <MediaGalleryItem
              key={index}
              url={url}
              type={getUrlType(url)}
              onRemove={() => handleRemove(index)}
              isUploadSuccess={uploadedItems.has(url)}
              isNew={newItems.has(index)}
            />
          ))}
        </div>
      )}
      
      {/* Input mode selector */}
      <div className="flex gap-2 mb-3">
        <button
          onClick={() => setInputMode('url')}
          className={`px-3 py-1 text-sm rounded-md border ${
            inputMode === 'url'
              ? 'bg-blue-500 text-white border-blue-500'
              : 'bg-white text-gray-700 border-gray-300 hover:bg-gray-50'
          }`}
        >
          🔗 Add Link
        </button>
        <button
          onClick={() => setInputMode('upload')}
          className={`px-3 py-1 text-sm rounded-md border ${
            inputMode === 'upload'
              ? 'bg-blue-500 text-white border-blue-500'
              : 'bg-white text-gray-700 border-gray-300 hover:bg-gray-50'
          }`}
        >
          📁 Upload File
        </button>
      </div>

      {/* URL Input Mode */}
      {inputMode === 'url' && (
        <div className="flex gap-2">
          <input
            type="url"
            value={newUrl}
            onChange={(e) => setNewUrl(e.target.value)}
            onKeyPress={handleKeyPress}
            placeholder={placeholder}
            className="flex-1 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
          <button
            onClick={handleAddUrl}
            disabled={!newUrl.trim()}
            className="px-4 py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600 disabled:bg-gray-300 disabled:cursor-not-allowed"
          >
            ➕ Add
          </button>
        </div>
      )}

      {/* File Upload Mode */}
      {inputMode === 'upload' && (
        <div className="space-y-2">
          <input
            ref={fileInputRef}
            type="file"
            accept={acceptedFileTypes}
            onChange={handleFileUpload}
            className="hidden"
          />
          <div
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onDrop={handleDrop}
            className={`border-2 border-dashed rounded-lg p-6 text-center transition-colors ${
              isDragOver 
                ? 'border-blue-400 bg-blue-50' 
                : 'border-gray-300 hover:border-gray-400'
            }`}
          >
            <div className="text-gray-600">
              <div className="text-2xl mb-2">📁</div>
              <p className="text-sm mb-2">
                {isUploading ? 'Uploading...' : 'Drag & drop a file here or click to browse'}
              </p>
              <button
                onClick={handleUploadClick}
                disabled={isUploading}
                className="px-4 py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600 disabled:bg-gray-300 disabled:cursor-not-allowed"
              >
                {isUploading ? 'Uploading...' : 'Choose File'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* CSS Animation */}
      <style>{`
        @keyframes fadeIn {
          from { opacity: 0; transform: translateY(10px); }
          to { opacity: 1; transform: translateY(0); }
        }
      `}</style>
    </div>
  );
};
