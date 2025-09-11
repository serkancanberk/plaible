// src/admin/components/media/MediaItem.tsx
// Individual media item component with preview and remove functionality

import React, { useState, useEffect } from 'react';
import { MediaItemProps, MediaItemState } from './types';
import { getYouTubeVideoId, getYouTubeThumbnail, validateYouTubeVideo } from './mediaUtils';
import { getThumbnailClasses } from './mediaUtils';

export const MediaItem: React.FC<MediaItemProps> = ({
  url,
  onRemove,
  onPreview,
  type,
  isUploadSuccess = false,
  isNew = false,
  thumbnailSize = 'small',
  layout = 'compact'
}) => {
  const [itemState, setItemState] = useState<MediaItemState>({
    thumbnailLoading: false,
    thumbnailError: false,
    videoValidated: false,
  });

  // Validate YouTube videos on mount
  useEffect(() => {
    if (type === 'youtube') {
      const videoId = getYouTubeVideoId(url);
      if (videoId) {
        setItemState(prev => ({ ...prev, thumbnailLoading: true }));
        validateYouTubeVideo(videoId)
          .then(valid => {
            setItemState(prev => ({ 
              ...prev, 
              videoValidated: valid,
              thumbnailLoading: false,
              thumbnailError: !valid
            }));
          })
          .catch(() => {
            setItemState(prev => ({ 
              ...prev, 
              videoValidated: false,
              thumbnailLoading: false,
              thumbnailError: true
            }));
          });
      }
    }
  }, [url, type]);

  const handleRemove = () => {
    if (window.confirm('Are you sure you want to remove this media item?')) {
      onRemove();
    }
  };

  const handlePreviewClick = () => {
    if (onPreview) {
      onPreview();
    }
  };

  const renderPreview = () => {
    const thumbnailClasses = getThumbnailClasses(thumbnailSize, layout);
    
    switch (type) {
      case 'image':
        return (
          <img
            src={url}
            alt="Media preview"
            className={`${thumbnailClasses} cursor-pointer hover:opacity-80 transition-opacity`}
            onClick={handlePreviewClick}
            onError={() => setItemState(prev => ({ ...prev, thumbnailError: true }))}
          />
        );
      
      case 'video':
        return (
          <div 
            className={`${thumbnailClasses} bg-gray-100 flex items-center justify-center cursor-pointer hover:opacity-80 transition-opacity`}
            onClick={handlePreviewClick}
          >
            <div className="text-center">
              <div className="w-8 h-8 bg-black bg-opacity-50 rounded-full flex items-center justify-center mb-2 mx-auto">
                <svg className="w-4 h-4 text-white ml-1" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M8 5v14l11-7z"/>
                </svg>
              </div>
              <span className="text-xs text-gray-600">Video</span>
            </div>
          </div>
        );
      
      case 'youtube':
        const videoId = getYouTubeVideoId(url);
        if (itemState.thumbnailLoading) {
          return (
            <div className={`${thumbnailClasses} bg-gray-100 flex items-center justify-center`}>
              <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-500"></div>
            </div>
          );
        }
        
        if (itemState.thumbnailError || !videoId) {
          return (
            <div 
              className={`${thumbnailClasses} bg-gray-100 flex items-center justify-center cursor-pointer hover:opacity-80 transition-opacity`}
              onClick={handlePreviewClick}
            >
              <div className="text-center">
                <div className="w-8 h-8 bg-red-100 rounded-full flex items-center justify-center mb-2 mx-auto">
                  <svg className="w-4 h-4 text-red-500" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z"/>
                  </svg>
                </div>
                <span className="text-xs text-red-600">Invalid Video</span>
              </div>
            </div>
          );
        }
        
        return (
          <img
            src={getYouTubeThumbnail(videoId)}
            alt="YouTube video thumbnail"
            className={`${thumbnailClasses} cursor-pointer hover:opacity-80 transition-opacity`}
            onClick={handlePreviewClick}
            onError={() => setItemState(prev => ({ ...prev, thumbnailError: true }))}
          />
        );
      
      case 'audio':
        return (
          <div 
            className={`${thumbnailClasses} bg-gray-100 flex items-center justify-center cursor-pointer hover:opacity-80 transition-opacity`}
            onClick={handlePreviewClick}
          >
            <div className="text-center">
              <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center mb-2 mx-auto">
                <svg className="w-4 h-4 text-blue-500" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M12 3v10.55c-.59-.34-1.27-.55-2-.55-2.21 0-4 1.79-4 4s1.79 4 4 4 4-1.79 4-4V7h4V3h-6z"/>
                </svg>
              </div>
              <span className="text-xs text-gray-600">Audio</span>
            </div>
          </div>
        );
      
      default:
        return (
          <div 
            className={`${thumbnailClasses} bg-gray-100 flex items-center justify-center cursor-pointer hover:opacity-80 transition-opacity`}
            onClick={handlePreviewClick}
          >
            <div className="text-center">
              <div className="w-8 h-8 bg-gray-200 rounded-full flex items-center justify-center mb-2 mx-auto">
                <svg className="w-4 h-4 text-gray-500" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M14,2H6A2,2 0 0,0 4,4V20A2,2 0 0,0 6,22H18A2,2 0 0,0 20,20V8L14,2M18,20H6V4H13V9H18V20Z"/>
                </svg>
              </div>
              <span className="text-xs text-gray-600">File</span>
            </div>
          </div>
        );
    }
  };

  return (
    <div className="relative group">
      <div className="relative">
        {renderPreview()}
        
        {/* Status badges */}
        <div className="absolute top-2 left-2 flex gap-1">
          {isUploadSuccess && (
            <span className="bg-green-500 text-white text-xs px-2 py-1 rounded-full">
              ✅
            </span>
          )}
          {isNew && (
            <span className="bg-blue-500 text-white text-xs px-2 py-1 rounded-full">
              New
            </span>
          )}
        </div>
        
        {/* Action buttons */}
        <div className="absolute top-2 right-2 flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
          <button
            onClick={handlePreviewClick}
            className="bg-white bg-opacity-90 text-gray-700 text-xs px-2 py-1 rounded hover:bg-opacity-100 transition-colors"
            title="Preview"
          >
            👁️
          </button>
          <button
            onClick={handleRemove}
            className="bg-red-500 bg-opacity-90 text-white text-xs px-2 py-1 rounded hover:bg-opacity-100 transition-colors"
            title="Remove"
          >
            ✖
          </button>
        </div>
      </div>
      
      {/* URL display */}
      <div className="mt-2 text-xs text-gray-600 truncate" title={url}>
        {url.length > 30 ? `${url.substring(0, 30)}...` : url}
      </div>
    </div>
  );
};
