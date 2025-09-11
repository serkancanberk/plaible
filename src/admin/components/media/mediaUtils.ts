// src/admin/components/media/mediaUtils.ts
// Shared utility functions for media components

import { MediaType, MediaUploaderConfig, UploadPath } from './types';

// Helper function to detect URL type
export const getUrlType = (url: string): MediaType => {
  const lowerUrl = url.toLowerCase();
  
  if (lowerUrl.includes('youtube.com') || lowerUrl.includes('youtu.be')) {
    return 'youtube';
  }
  
  if (lowerUrl.match(/\.(jpg|jpeg|png|gif|webp|svg|bmp|ico)$/)) {
    return 'image';
  }
  
  if (lowerUrl.match(/\.(mp4|webm|ogg|avi|mov|wmv|flv|mkv)$/)) {
    return 'video';
  }
  
  if (lowerUrl.match(/\.(mp3|wav|ogg|aac|flac|m4a|wma)$/)) {
    return 'audio';
  }
  
  return 'unknown';
};

// Helper function to extract YouTube video ID from various URL formats
export const getYouTubeVideoId = (url: string): string | null => {
  const patterns = [
    /(?:youtube\.com\/watch\?v=|youtu\.be\/|youtube\.com\/embed\/)([^&\n?#]+)/,
    /youtube\.com\/watch\?.*v=([^&\n?#]+)/,
    /youtube\.com\/v\/([^&\n?#]+)/,
    /youtube\.com\/embed\/([^&\n?#]+)/,
    /youtube\.com\/shorts\/([^&\n?#]+)/,
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
export const getYouTubeThumbnail = (videoId: string): string => {
  return `https://img.youtube.com/vi/${videoId}/hqdefault.jpg`;
};

// Helper function to validate YouTube video using oEmbed API
export const validateYouTubeVideo = async (videoId: string): Promise<boolean> => {
  try {
    const response = await fetch(
      `https://www.youtube.com/oembed?url=https://www.youtube.com/watch?v=${videoId}&format=json`,
      { 
        method: 'GET',
        signal: AbortSignal.timeout(5000) // 5 second timeout
      }
    );
    return response.ok;
  } catch (error) {
    console.warn('YouTube validation failed:', error);
    return false;
  }
};

// Helper function to get upload path based on configuration
export const getUploadPath = (config: MediaUploaderConfig): string => {
  // Both story and character uploads use the same endpoint
  // The backend handles the path differentiation via the 'path' form field
  return '/api/upload/media';
};

// Helper function to handle file upload
export const handleFileUpload = async (
  event: React.ChangeEvent<HTMLInputElement>,
  config: MediaUploaderConfig,
  onUpdate: (items: string[]) => void,
  items: string[],
  setIsUploading: (loading: boolean) => void,
  setUploadedItems: (updater: (prev: Set<string>) => Set<string>) => void,
  setShowSuccessToast: (show: boolean) => void,
  setShowErrorToast: (show: boolean) => void,
  setErrorMessage: (message: string) => void,
  storyId?: string,
  characterId?: string,
  mediaType?: string
): Promise<void> => {
  const file = event.target.files?.[0];
  if (!file) return;

  setIsUploading(true);
  
  try {
    const formData = new FormData();
    formData.append('file', file);
    
    // Generate path based on upload type
    let path: string;
    if (config.uploadPath === 'character' && characterId) {
      path = `characters/${storyId || 'unknown'}/${characterId}/${mediaType || 'media'}s/${Date.now()}-${file.name}`;
    } else {
      path = `stories/${storyId || 'unknown'}/${mediaType || 'media'}s/${Date.now()}-${file.name}`;
    }
    formData.append('path', path);
    
    const uploadPath = getUploadPath(config);
    const response = await fetch(uploadPath, {
      method: 'POST',
      body: formData,
      credentials: 'include',
    });

    if (!response.ok) {
      throw new Error(`Upload failed: ${response.statusText}`);
    }

    const result = await response.json();
    const newUrl = result.url || result.fileUrl;
    
    if (newUrl) {
      const newItems = [...items, newUrl];
      onUpdate(newItems);
      
      // Mark as uploaded item
      setUploadedItems(prev => {
        const newSet = new Set(prev);
        newSet.add(newUrl);
        return newSet;
      });
      
      setShowSuccessToast(true);
      setTimeout(() => setShowSuccessToast(false), 3000);
    } else {
      throw new Error('No URL returned from upload');
    }
  } catch (error) {
    console.error('Upload error:', error);
    setErrorMessage(error instanceof Error ? error.message : 'Upload failed');
    setShowErrorToast(true);
    setTimeout(() => setShowErrorToast(false), 5000);
  } finally {
    setIsUploading(false);
    // Reset file input
    if (event.target) {
      event.target.value = '';
    }
  }
};

// Helper function to handle URL addition
export const handleAddUrl = (
  newUrl: string,
  onUpdate: (items: string[]) => void,
  items: string[],
  setNewUrl: (url: string) => void,
  setNewItems: (updater: (prev: Set<number>) => Set<number>) => void
): void => {
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

// Helper function to handle item removal
export const handleRemove = (
  index: number,
  onUpdate: (items: string[]) => void,
  items: string[],
  setUploadedItems: (updater: (prev: Set<string>) => Set<string>) => void
): void => {
  const removedUrl = items[index];
  onUpdate(items.filter((_, i) => i !== index));
  
  // Remove from uploaded items if it was uploaded
  setUploadedItems(prev => {
    const newSet = new Set(prev);
    newSet.delete(removedUrl);
    return newSet;
  });
};

// Helper function to handle drag and drop
export const handleDragOver = (e: React.DragEvent, setIsDragOver: (over: boolean) => void): void => {
  e.preventDefault();
  setIsDragOver(true);
};

export const handleDragLeave = (e: React.DragEvent, setIsDragOver: (over: boolean) => void): void => {
  e.preventDefault();
  setIsDragOver(false);
};

export const handleDrop = (
  e: React.DragEvent,
  config: MediaUploaderConfig,
  onUpdate: (items: string[]) => void,
  items: string[],
  setIsDragOver: (over: boolean) => void,
  setIsUploading: (loading: boolean) => void,
  setUploadedItems: (updater: (prev: Set<string>) => Set<string>) => void,
  setShowSuccessToast: (show: boolean) => void,
  setShowErrorToast: (show: boolean) => void,
  setErrorMessage: (message: string) => void,
  storyId?: string,
  characterId?: string,
  mediaType?: string
): void => {
  e.preventDefault();
  setIsDragOver(false);
  
  const files = Array.from(e.dataTransfer.files);
  if (files.length > 0) {
    // Create a fake event for the file upload handler
    const fakeEvent = {
      target: {
        files: files,
        value: ''
      }
    } as unknown as React.ChangeEvent<HTMLInputElement>;
    
    handleFileUpload(
      fakeEvent,
      config,
      onUpdate,
      items,
      setIsUploading,
      setUploadedItems,
      setShowSuccessToast,
      setShowErrorToast,
      setErrorMessage,
      storyId,
      characterId,
      mediaType
    );
  }
};

// Helper function to get grid classes based on layout
export const getGridClasses = (layout: string, gridCols?: number): string => {
  switch (layout) {
    case 'compact':
    case 'character':
      return 'grid grid-cols-2 gap-3';
    case 'gallery':
      const cols = gridCols || 3;
      return `grid grid-cols-${cols} gap-4`;
    case 'media-sharing':
      return 'grid grid-cols-2 gap-4';
    default:
      return 'grid grid-cols-2 gap-3';
  }
};

// Helper function to get thumbnail size classes
export const getThumbnailClasses = (size: string, layout: string): string => {
  // Use aspect-square for consistent 1:1 ratio, let width determine the size
  const baseClasses = 'w-full aspect-square object-cover rounded-md';
  
  switch (size) {
    case 'small':
      return `${baseClasses} w-20`;
    case 'medium':
      return `${baseClasses} w-32`;
    case 'large':
      return `${baseClasses} w-40`;
    case 'xlarge':
      return `${baseClasses} w-48`;
    case 'xxlarge':
      return `${baseClasses} w-56`;
    default:
      return `${baseClasses} w-20`;
  }
};

// Helper function to get input mode classes
export const getInputModeClasses = (mode: string): string => {
  return mode === 'upload' 
    ? 'bg-blue-50 border-blue-300 text-blue-700' 
    : 'bg-gray-50 border-gray-300 text-gray-700';
};
