// src/admin/components/storyEdit/CompactMediaUploader.tsx
import React, { useState, useRef } from 'react';

interface CompactMediaUploaderProps {
  items: string[];
  onUpdate: (items: string[]) => void;
  placeholder: string;
  label: string;
  acceptedFileTypes: string;
  mediaType: 'image' | 'video' | 'audio';
  storyId?: string;
}

// Helper function to detect URL type
const getUrlType = (url: string): 'image' | 'video' | 'youtube' | 'audio' | 'unknown' => {
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

// Helper function to extract YouTube video ID
const getYouTubeVideoId = (url: string): string | null => {
  // More comprehensive patterns to handle various YouTube URL formats
  const patterns = [
    // youtu.be/VIDEO_ID
    /youtu\.be\/([a-zA-Z0-9_-]{11})/,
    // youtube.com/watch?v=VIDEO_ID
    /youtube\.com\/watch\?v=([a-zA-Z0-9_-]{11})/,
    // youtube.com/embed/VIDEO_ID
    /youtube\.com\/embed\/([a-zA-Z0-9_-]{11})/,
    // youtube.com/v/VIDEO_ID
    /youtube\.com\/v\/([a-zA-Z0-9_-]{11})/,
    // youtube.com/watch?other_params&v=VIDEO_ID
    /[?&]v=([a-zA-Z0-9_-]{11})/,
    // youtube.com/shorts/VIDEO_ID
    /youtube\.com\/shorts\/([a-zA-Z0-9_-]{11})/
  ];
  
  for (const pattern of patterns) {
    const match = url.match(pattern);
    if (match && match[1]) {
      return match[1];
    }
  }
  
  return null;
};

// Helper function to get YouTube thumbnail URL
const getYouTubeThumbnail = (videoId: string, quality: 'default' | 'medium' | 'high' | 'standard' | 'maxres' = 'medium'): string => {
  return `https://img.youtube.com/vi/${videoId}/${quality}default.jpg`;
};

// Helper function to validate YouTube video using oEmbed API
const validateYouTubeVideo = async (videoId: string): Promise<boolean> => {
  try {
    // Use a timeout to prevent hanging requests
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 5000); // 5 second timeout
    
    const response = await fetch(
      `https://www.youtube.com/oembed?url=https://www.youtube.com/watch?v=${videoId}&format=json`,
      {
        signal: controller.signal,
        method: 'GET',
        headers: {
          'Accept': 'application/json',
        }
      }
    );
    
    clearTimeout(timeoutId);
    
    if (response.ok) {
      const data = await response.json();
      // Additional check: ensure we got valid oEmbed data
      return data && data.type === 'video' && data.provider_name === 'YouTube';
    }
    
    return false;
  } catch (error: unknown) {
    if (error instanceof Error && error.name === 'AbortError') {
      console.warn('YouTube validation timed out for video:', videoId);
    } else {
      console.warn('YouTube validation failed:', error);
    }
    return false;
  }
};

// Component for displaying individual media items (matching CharacterEditor exactly)
const CompactMediaItem: React.FC<{
  url: string;
  onRemove: () => void;
  type: 'image' | 'video' | 'youtube' | 'audio' | 'unknown';
  isUploadSuccess?: boolean;
  isNew?: boolean;
}> = ({ url, onRemove, type, isUploadSuccess = false, isNew = false }) => {
  const [imageError, setImageError] = useState(false);
  const [showPreviewModal, setShowPreviewModal] = useState(false);
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [thumbnailLoading, setThumbnailLoading] = useState(true);
  const [thumbnailError, setThumbnailError] = useState(false);
  const [videoValidated, setVideoValidated] = useState(false);

  // Validate YouTube video on mount
  React.useEffect(() => {
    if (type === 'youtube') {
      const videoId = getYouTubeVideoId(url);
      if (videoId) {
        // Reset states
        setThumbnailLoading(true);
        setThumbnailError(false);
        setVideoValidated(false);
        
        validateYouTubeVideo(videoId).then(isValid => {
          setVideoValidated(isValid);
          if (!isValid) {
            setThumbnailError(true);
            setThumbnailLoading(false);
          }
          // Don't set thumbnailLoading to false here - let the image onLoad handle it
        }).catch((error: unknown) => {
          console.warn('YouTube validation failed:', error);
          setThumbnailError(true);
          setThumbnailLoading(false);
          setVideoValidated(false);
        });
      } else {
        setThumbnailError(true);
        setThumbnailLoading(false);
        setVideoValidated(false);
      }
    } else {
      setThumbnailLoading(false);
    }
  }, [url, type]);

  const handleRemoveClick = () => {
    setShowConfirmModal(true);
  };

  const handleConfirmRemove = () => {
    onRemove();
    setShowConfirmModal(false);
  };

  const renderPreview = () => {
    if (type === 'image' && !imageError) {
      return (
        <img
          src={url}
          alt="Media preview"
          className="w-full h-full object-cover rounded cursor-pointer"
          onError={() => setImageError(true)}
          onClick={() => setShowPreviewModal(true)}
        />
      );
    } else if (type === 'youtube') {
      const videoId = getYouTubeVideoId(url);
      
      if (!videoId) {
        return (
          <div 
            className="w-full h-full bg-gray-100 flex items-center justify-center cursor-pointer"
            onClick={() => setShowPreviewModal(true)}
          >
            <div className="text-center">
              <div className="text-4xl mb-2">❌</div>
              <div className="text-xs text-gray-600">Invalid YouTube URL</div>
            </div>
          </div>
        );
      }

      if (thumbnailError || !videoValidated) {
        return (
          <div 
            className="w-full h-full bg-gray-100 flex items-center justify-center cursor-pointer"
            onClick={() => setShowPreviewModal(true)}
          >
            <div className="text-center">
              <div className="text-4xl mb-2">⚠️</div>
              <div className="text-xs text-gray-600">Video not found</div>
            </div>
          </div>
        );
      }

      return (
        <div 
          className="w-full h-full bg-gray-100 flex items-center justify-center cursor-pointer relative group"
          onClick={() => setShowPreviewModal(true)}
        >
          {/* Loading state - show while validating or loading thumbnail */}
          {(thumbnailLoading || !videoValidated) && (
            <div className="absolute inset-0 bg-gray-100 flex items-center justify-center">
              <div className="text-center">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-red-600 mx-auto mb-2"></div>
                <div className="text-xs text-gray-600">
                  {!videoValidated ? 'Validating...' : 'Loading...'}
                </div>
              </div>
            </div>
          )}
          
          {/* Thumbnail - only show after validation is complete */}
          {videoValidated && (
            <img
              src={getYouTubeThumbnail(videoId)}
              alt="YouTube video thumbnail"
              className={`w-full h-full object-cover rounded transition-opacity duration-300 ${
                thumbnailLoading ? 'opacity-0' : 'opacity-100'
              }`}
              onLoad={() => {
                setThumbnailLoading(false);
                setThumbnailError(false);
              }}
              onError={() => {
                setThumbnailLoading(false);
                setThumbnailError(true);
              }}
            />
          )}
          
          {/* Play button overlay - only show when thumbnail is loaded */}
          {videoValidated && !thumbnailLoading && (
            <div className="absolute inset-0 flex items-center justify-center bg-black bg-opacity-0 group-hover:bg-opacity-20 transition-all duration-200">
              <div className="bg-red-600 text-white rounded-full p-2 opacity-0 group-hover:opacity-100 transition-opacity duration-200">
                <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M8 5v14l11-7z"/>
                </svg>
              </div>
            </div>
          )}
        </div>
      );
    } else if (type === 'video') {
      return (
        <div 
          className="w-full h-full bg-gray-100 flex items-center justify-center cursor-pointer"
          onClick={() => setShowPreviewModal(true)}
        >
          <div className="text-center">
            <div className="text-4xl mb-2">🎥</div>
            <div className="text-xs text-gray-600">Click to preview</div>
          </div>
        </div>
      );
    } else if (type === 'audio') {
      return (
        <div className="w-full h-full bg-gray-100 flex items-center justify-center">
          <div className="text-center">
            <div className="text-4xl mb-2">🎵</div>
            <div className="text-xs text-gray-600">Audio</div>
          </div>
        </div>
      );
    } else {
      return (
        <div className="w-full h-full bg-gray-100 flex items-center justify-center">
          <div className="text-center">
            <div className="text-4xl mb-2">📁</div>
            <div className="text-xs text-gray-600">Unknown type</div>
          </div>
        </div>
      );
    }
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
          <div className="max-w-4xl max-h-full p-4" onClick={(e) => e.stopPropagation()}>
            {type === 'image' && (
              <img src={url} alt="Media preview" className="max-w-full max-h-full object-contain" />
            )}
            {type === 'youtube' && (() => {
              const videoId = getYouTubeVideoId(url);
              if (!videoId) {
                return (
                  <div className="bg-white p-4 rounded-lg">
                    <h3 className="text-lg font-medium mb-2">Invalid YouTube URL</h3>
                    <p className="text-sm text-gray-600 mb-4">URL: {url}</p>
                    <div className="text-center">
                      <div className="text-6xl mb-4">❌</div>
                      <p className="text-gray-600">Could not extract video ID from URL</p>
                    </div>
                  </div>
                );
              }
              
              if (thumbnailError || !videoValidated) {
                return (
                  <div className="bg-white p-4 rounded-lg">
                    <h3 className="text-lg font-medium mb-2">Video Not Found</h3>
                    <p className="text-sm text-gray-600 mb-4">URL: {url}</p>
                    <div className="text-center">
                      <div className="text-6xl mb-4">⚠️</div>
                      <p className="text-gray-600">This YouTube video could not be found or is not available</p>
                      <p className="text-sm text-gray-500 mt-2">The video may be private, deleted, or the URL may be incorrect</p>
                    </div>
                  </div>
                );
              }
              
              return (
                <div className="bg-white rounded-lg overflow-hidden">
                  <div className="aspect-video w-full">
                    <iframe
                      src={`https://www.youtube.com/embed/${videoId}`}
                      className="w-full h-full"
                      frameBorder="0"
                      allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                      allowFullScreen
                      title="YouTube video player"
                    />
                  </div>
                  <div className="p-4">
                    <h3 className="text-lg font-medium mb-2">YouTube Video</h3>
                    <p className="text-sm text-gray-600 break-all">{url}</p>
                  </div>
                </div>
              );
            })()}
            {type === 'video' && (
              <div className="bg-white p-4 rounded-lg">
                <h3 className="text-lg font-medium mb-2">Video Preview</h3>
                <p className="text-sm text-gray-600 mb-4">URL: {url}</p>
                <div className="aspect-video w-full bg-gray-100 rounded-lg flex items-center justify-center">
                  <video
                    src={url}
                    controls
                    className="max-w-full max-h-full"
                    preload="metadata"
                  >
                    Your browser does not support the video tag.
                  </video>
                </div>
              </div>
            )}
            <button
              onClick={() => setShowPreviewModal(false)}
              className="absolute top-4 right-4 text-white bg-black bg-opacity-50 rounded-full w-8 h-8 flex items-center justify-center hover:bg-opacity-75"
            >
              ✕
            </button>
          </div>
        </div>
      )}

      {/* Confirmation Modal */}
      {showConfirmModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-sm mx-4">
            <h3 className="text-lg font-medium text-gray-900 mb-2">Remove Media Item</h3>
            <p className="text-sm text-gray-600 mb-4">
              Are you sure you want to remove this media item? This action cannot be undone.
            </p>
            <div className="flex space-x-3">
              <button
                onClick={handleConfirmRemove}
                className="flex-1 bg-red-600 text-white py-2 px-4 rounded-md hover:bg-red-700 text-sm"
              >
                Remove
              </button>
              <button
                onClick={() => setShowConfirmModal(false)}
                className="flex-1 bg-gray-300 text-gray-700 py-2 px-4 rounded-md hover:bg-gray-400 text-sm"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export const CompactMediaUploader: React.FC<CompactMediaUploaderProps> = ({
  items,
  onUpdate,
  placeholder,
  label,
  acceptedFileTypes,
  mediaType,
  storyId
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

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
    
    const files = Array.from(e.dataTransfer.files);
    if (files.length > 0) {
      const file = files[0];
      // Create a fake event to reuse the upload logic
      const fakeEvent = {
        target: { files: [file] }
      } as unknown as React.ChangeEvent<HTMLInputElement>;
      handleFileUpload(fakeEvent);
    }
  };

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <label className="block text-sm font-medium text-gray-700">
          {label}
        </label>
        <div className="flex space-x-2">
          <button
            onClick={() => setInputMode('url')}
            className={`px-3 py-1 text-xs rounded ${
              inputMode === 'url' 
                ? 'bg-blue-100 text-blue-800' 
                : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
            }`}
          >
            URL
          </button>
          <button
            onClick={() => setInputMode('upload')}
            className={`px-3 py-1 text-xs rounded ${
              inputMode === 'upload' 
                ? 'bg-blue-100 text-blue-800' 
                : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
            }`}
          >
            Upload
          </button>
        </div>
      </div>

      {/* Existing items - 2-column grid like CharacterEditor */}
      {items.length > 0 && (
        <div className="grid grid-cols-2 gap-3 mb-3">
          {items.map((url, index) => (
            <CompactMediaItem
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
      {inputMode === 'url' && (
        <div className="flex gap-2">
          <input
            type="url"
            value={newUrl}
            onChange={(e) => setNewUrl(e.target.value)}
            onKeyPress={handleKeyPress}
            placeholder={placeholder}
            className="flex-1 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
          />
          <button
            onClick={handleAddUrl}
            disabled={!newUrl.trim()}
            className="px-4 py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600 disabled:bg-gray-300 disabled:cursor-not-allowed text-sm"
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
                onClick={() => fileInputRef.current?.click()}
                disabled={isUploading}
                className="px-4 py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600 disabled:bg-gray-300 disabled:cursor-not-allowed text-sm"
              >
                {isUploading ? 'Uploading...' : 'Choose File'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Success Toast */}
      {showSuccessToast && (
        <div className="fixed top-4 right-4 bg-green-500 text-white px-4 py-2 rounded-md shadow-lg z-50">
          ✅ Upload successful!
        </div>
      )}

      {/* Error Toast */}
      {showErrorToast && (
        <div className="fixed top-4 right-4 bg-red-500 text-white px-4 py-2 rounded-md shadow-lg z-50">
          ❌ {errorMessage}
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
