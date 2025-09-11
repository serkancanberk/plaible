// src/admin/components/media/types.ts
// Centralized TypeScript interfaces for media components

export type MediaType = 'image' | 'video' | 'audio' | 'youtube' | 'unknown';
export type LayoutType = 'compact' | 'gallery' | 'character' | 'media-sharing';
export type UploadPath = 'story' | 'character';
export type ThumbnailSize = 'small' | 'medium' | 'large' | 'xlarge' | 'xxlarge';
export type InputMode = 'url' | 'upload';

export interface MediaUploaderConfig {
  layout: LayoutType;
  gridCols?: number;
  uploadPath: UploadPath;
  showSaveButtons?: boolean;
  thumbnailSize?: ThumbnailSize;
}

export interface UnifiedMediaUploaderProps {
  items: string[];
  onUpdate: (items: string[]) => void;
  placeholder: string;
  label: string;
  acceptedFileTypes: string;
  mediaType: 'image' | 'video' | 'audio';
  config: MediaUploaderConfig;
  storyId?: string;
  characterId?: string;
}

export interface MediaItemProps {
  url: string;
  onRemove: () => void;
  onPreview?: () => void;
  type: MediaType;
  isUploadSuccess?: boolean;
  isNew?: boolean;
  thumbnailSize?: ThumbnailSize;
  layout?: LayoutType;
}

export interface MediaPreviewProps {
  isOpen: boolean;
  onClose: () => void;
  url: string;
  type: MediaType;
}

export interface UploadState {
  isUploading: boolean;
  isDragOver: boolean;
  uploadedItems: Set<string>;
  newItems: Set<number>;
  showSuccessToast: boolean;
  showErrorToast: boolean;
  errorMessage: string;
}

export interface ToastState {
  showSuccessToast: boolean;
  showErrorToast: boolean;
  errorMessage: string;
}

// Helper type for media item state
export interface MediaItemState {
  thumbnailLoading: boolean;
  thumbnailError: boolean;
  videoValidated: boolean;
}

// Configuration presets for different use cases
export const LAYOUT_CONFIGS: Record<LayoutType, Partial<MediaUploaderConfig>> = {
  compact: {
    layout: 'compact',
    gridCols: 2,
    thumbnailSize: 'small',
    showSaveButtons: false,
  },
  gallery: {
    layout: 'gallery',
    gridCols: 3,
    thumbnailSize: 'medium',
    showSaveButtons: false,
  },
  character: {
    layout: 'character',
    gridCols: 2,
    thumbnailSize: 'small',
    showSaveButtons: false,
  },
  'media-sharing': {
    layout: 'media-sharing',
    gridCols: 2,
    thumbnailSize: 'xlarge',
    showSaveButtons: false,
  },
};

// Default configuration
export const DEFAULT_CONFIG: MediaUploaderConfig = {
  layout: 'compact',
  gridCols: 2,
  uploadPath: 'story',
  showSaveButtons: false,
  thumbnailSize: 'small',
};
