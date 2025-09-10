// src/admin/components/storyEdit/MediaUploader.tsx
import React, { useState, useRef } from 'react';

interface MediaUploaderProps {
  items: string[];
  onUpdate: (items: string[]) => void;
  placeholder: string;
  label: string;
  acceptedFileTypes: string;
  mediaType: 'image' | 'video' | 'audio';
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

// Component for displaying individual media items
const MediaItem: React.FC<{
  url: string;
  onRemove: () => void;
  type: 'image' | 'video' | 'audio' | 'youtube' | 'unknown';
  isUploadSuccess?: boolean;
}> = ({ url, onRemove, type, isUploadSuccess = false }) => {
  const [imageError, setImageError] = useState(false);
  
  const handlePreviewClick = () => {
    if (type === 'image' || type === 'video') {
      window.open(url, '_blank');
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
                title="Click to open in new tab"
              >
                <img
                  src={url}
                  alt="Media preview"
                  className="w-full h-32 object-cover rounded-md"
                  onError={() => setImageError(true)}
                />
                <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-10 transition-all duration-200 rounded-md flex items-center justify-center">
                  <div className="opacity-0 group-hover:opacity-100 transition-opacity duration-200 bg-white bg-opacity-90 rounded-full p-2">
                    <svg className="w-6 h-6 text-gray-700" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                    </svg>
                  </div>
                </div>
              </div>
            ) : (
              <div className="w-full h-32 bg-gray-200 rounded-md flex items-center justify-center">
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
              title="Click to open in new tab"
            >
              <video
                src={url}
                className="w-full h-32 object-cover rounded-md"
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
          <iframe
            src={`https://www.youtube.com/embed/${videoId}`}
            className="w-full h-32 rounded-md"
            frameBorder="0"
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
            allowFullScreen
          />
        ) : (
          <div className="w-full h-32 bg-gray-200 rounded-md flex items-center justify-center">
            <span className="text-gray-500 text-sm">Invalid YouTube URL</span>
          </div>
        );
        
      case 'audio':
        return (
          <div className="w-full h-32 bg-gray-100 rounded-md flex items-center justify-center">
            <audio src={url} controls className="w-full" />
          </div>
        );
        
      default:
        return (
          <div className="w-full h-32 bg-gray-200 rounded-md flex items-center justify-center">
            <span className="text-gray-500 text-sm">🔗 {url}</span>
          </div>
        );
    }
  };

  const handleRemoveClick = () => {
    if (window.confirm('Are you sure you want to remove this media item?')) {
      onRemove();
    }
  };

  return (
    <div className="bg-white border border-gray-200 rounded-lg p-4">
      <div className="flex justify-between items-start mb-3">
        <div className="flex-1 min-w-0 flex items-center gap-2">
          <p className="text-sm text-gray-600 truncate" title={url}>
            {url}
          </p>
          {isUploadSuccess && (
            <span className="text-green-500 text-sm" title="Upload successful">
              ✅
            </span>
          )}
        </div>
        <button
          onClick={handleRemoveClick}
          className="ml-2 text-red-500 hover:text-red-700 text-sm font-medium transition-colors duration-200"
        >
          ❌ Remove
        </button>
      </div>
      {renderPreview()}
    </div>
  );
};

export const MediaUploader: React.FC<MediaUploaderProps> = ({
  items,
  onUpdate,
  placeholder,
  label,
  acceptedFileTypes,
  mediaType
}) => {
  const [newUrl, setNewUrl] = useState('');
  const [isUploading, setIsUploading] = useState(false);
  const [inputMode, setInputMode] = useState<'url' | 'upload'>('url');
  const [isDragOver, setIsDragOver] = useState(false);
  const [uploadedItems, setUploadedItems] = useState<Set<string>>(new Set());
  const [showSuccessToast, setShowSuccessToast] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleAddUrl = () => {
    if (newUrl.trim()) {
      onUpdate([...items, newUrl.trim()]);
      setNewUrl('');
    }
  };

  const handleRemove = (index: number) => {
    const removedUrl = items[index];
    onUpdate(items.filter((_, i) => i !== index));
    // Remove from uploaded items set
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

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    setIsUploading(true);
    
    try {
      const formData = new FormData();
      formData.append('file', file);

      const response = await fetch('/api/upload/media', {
        method: 'POST',
        body: formData,
        credentials: 'include', // Include cookies for authentication
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Upload failed');
      }

      const result = await response.json();
      
      if (result.ok && result.url) {
        onUpdate([...items, result.url]);
        // Mark this item as successfully uploaded
        setUploadedItems(prev => new Set([...prev, result.url]));
        // Show success toast
        setShowSuccessToast(true);
        setTimeout(() => setShowSuccessToast(false), 3000);
        // Reset file input
        if (fileInputRef.current) {
          fileInputRef.current.value = '';
        }
      } else {
        throw new Error('Invalid response from server');
      }
    } catch (error) {
      console.error('Upload error:', error);
      alert(`Upload failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    } finally {
      setIsUploading(false);
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

      {/* Existing items */}
      {items.length > 0 && (
        <div className="space-y-3 mb-4">
          {items.map((url, index) => (
            <MediaItem
              key={index}
              url={url}
              type={getUrlType(url)}
              onRemove={() => handleRemove(index)}
              isUploadSuccess={uploadedItems.has(url)}
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
          
          {/* Drag and Drop Area */}
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
            <div className="text-4xl mb-2">📤</div>
            <p className="text-gray-600 font-medium mb-2">
              {isDragOver ? 'Drop file here to upload' : 'Drag & drop file here'}
            </p>
            <p className="text-gray-500 text-sm mb-4">or</p>
            <button
              onClick={handleUploadClick}
              disabled={isUploading}
              className="px-4 py-2 bg-green-500 text-white rounded-md hover:bg-green-600 disabled:bg-gray-300 disabled:cursor-not-allowed"
            >
              {isUploading ? '⏳ Uploading...' : '📁 Choose File to Upload'}
            </button>
          </div>
          
          <p className="text-xs text-gray-500">
            Accepted formats: {acceptedFileTypes.replace(/\./g, '').replace(/,/g, ', ')}
          </p>
        </div>
      )}
    </div>
  );
};
