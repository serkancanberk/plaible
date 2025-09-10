// src/admin/components/storyEdit/MediaSection.tsx
import React from 'react';
import { Story, MediaBlock, Share } from '../../api';
import { MediaUploader } from './MediaUploader';

interface MediaSectionProps {
  story: Story;
  onUpdate: (updates: Partial<Story>) => void;
  storyId?: string;
}


export const MediaSection: React.FC<MediaSectionProps> = ({ story, onUpdate, storyId }) => {
  const handleAssetsUpdate = (field: keyof MediaBlock, items: string[]) => {
    onUpdate({
      assets: {
        ...story.assets,
        [field]: items
      }
    });
  };

  const handleShareUpdate = (field: keyof Share, items: string[]) => {
    onUpdate({
      share: {
        ...story.share,
        [field]: items
      }
    });
  };

  const handleSaveMediaItem = async (url: string, index: number, mediaType: 'assets' | 'share', mediaField: 'images' | 'videos' | 'ambiance') => {
    // 📦 Detailed payload logging for debugging
    console.log("📦 Saving media item with payload:", {
      storyId,
      mediaType,
      mediaField,
      index: `${index} (type: ${typeof index})`,
      url
    });

    if (!storyId) {
      throw new Error('Story ID is required for saving media items');
    }

    // Validate URL
    if (!url || typeof url !== 'string' || url.trim() === '') {
      throw new Error('Link is not valid or missing required data. Please check and try again.');
    }

    // Validate index
    const numericIndex = Number(index);
    if (isNaN(numericIndex) || numericIndex < 0) {
      throw new Error('Invalid index: must be a valid number >= 0');
    }

    // Basic URL validation
    try {
      new URL(url);
    } catch {
      // If it's not a valid URL, it might be a relative path or filename
      if (!url.startsWith('/') && !url.startsWith('./') && !url.includes('.')) {
        throw new Error('Link is not valid or missing required data. Please check and try again.');
      }
    }

    const requestPayload = {
      mediaType,
      mediaField,
      url: url.trim(),
      index: numericIndex // use the validated numeric index
    };

    // 📦 Enhanced payload logging for debugging
    console.log("📦 Full payload", JSON.stringify(requestPayload, null, 2));
    console.log("📌 index", requestPayload.index, typeof requestPayload.index);
    console.log("📌 mediaField", requestPayload.mediaField, typeof requestPayload.mediaField);
    console.log("📌 mediaType", requestPayload.mediaType, typeof requestPayload.mediaType);
    console.log("📌 url", requestPayload.url, typeof requestPayload.url);

    console.log("🚀 Sending API request to:", `/api/admin/stories/${storyId}/media`);
    console.log("📤 Request payload:", requestPayload);

    const response = await fetch(`/api/admin/stories/${storyId}/media`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
      },
      credentials: 'include',
      body: JSON.stringify(requestPayload)
    });

    console.log("📥 Response status:", response.status, response.statusText);

    if (!response.ok) {
      // Log the entire response object for debugging
      console.error("❌ Save error (Response):", {
        status: response.status,
        statusText: response.statusText,
        headers: Object.fromEntries(response.headers.entries()),
        url: response.url,
        type: response.type,
        redirected: response.redirected
      });

      const errorData = await response.json().catch(() => ({ message: 'Unknown error occurred' }));
      console.log("❌ Error response data:", JSON.stringify(errorData, null, 2));
      throw new Error(errorData.message || 'Failed to save media item');
    }

    const responseData = await response.json();
    console.log("✅ Success response data:", responseData);
    return responseData;
  };

  const handleSingleChange = (field: keyof Share, value: string) => {
    onUpdate({
      share: {
        ...story.share,
        [field]: value
      }
    });
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-semibold text-gray-900 mb-4">🖼️ Media & Sharing</h2>
        <p className="text-sm text-gray-600 mb-6">Manage story assets and sharing configuration with visual previews.</p>
      </div>

      {/* Story Assets */}
      <div className="bg-gray-50 rounded-lg p-6">
        <h3 className="text-lg font-medium text-gray-900 mb-4">Story Assets</h3>
        
        <div className="space-y-6">
          {/* Images */}
          <MediaUploader
            items={story.assets.images}
            onUpdate={(items) => handleAssetsUpdate('images', items)}
            onSaveItem={(url, index) => handleSaveMediaItem(url, index, 'assets', 'images')}
            placeholder="https://example.com/image1.jpg"
            label="Images"
            acceptedFileTypes=".jpg,.jpeg,.png,.gif,.webp,.svg"
            mediaType="image"
          />

          {/* Videos */}
          <MediaUploader
            items={story.assets.videos}
            onUpdate={(items) => handleAssetsUpdate('videos', items)}
            onSaveItem={(url, index) => handleSaveMediaItem(url, index, 'assets', 'videos')}
            placeholder="https://youtube.com/watch?v=... or https://vimeo.com/..."
            label="Videos"
            acceptedFileTypes=".mp4,.webm,.ogg,.avi,.mov"
            mediaType="video"
          />

          {/* Ambiance */}
          <MediaUploader
            items={story.assets.ambiance}
            onUpdate={(items) => handleAssetsUpdate('ambiance', items)}
            onSaveItem={(url, index) => handleSaveMediaItem(url, index, 'assets', 'ambiance')}
            placeholder="https://soundcloud.com/... or https://youtube.com/watch?v=..."
            label="Ambiance (Audio/Atmosphere)"
            acceptedFileTypes=".mp3,.wav,.ogg,.m4a"
            mediaType="audio"
          />
        </div>
      </div>

      {/* Sharing Configuration */}
      <div className="bg-gray-50 rounded-lg p-6">
        <h3 className="text-lg font-medium text-gray-900 mb-4">Sharing Configuration</h3>
        
        <div className="space-y-6">
          {/* Share Link */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Share Link
            </label>
            <input
              type="url"
              value={story.share.link || ''}
              onChange={(e) => handleSingleChange('link', e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="https://plaible.art/stories/..."
            />
          </div>

          {/* Share Text */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Share Text
            </label>
            <textarea
              value={story.share.text || ''}
              onChange={(e) => handleSingleChange('text', e.target.value)}
              rows={3}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="Check out this amazing story..."
            />
          </div>

          {/* Share Images */}
          <MediaUploader
            items={story.share.images}
            onUpdate={(items) => handleShareUpdate('images', items)}
            onSaveItem={(url, index) => handleSaveMediaItem(url, index, 'share', 'images')}
            placeholder="https://example.com/share-image1.jpg"
            label="Share Images"
            acceptedFileTypes=".jpg,.jpeg,.png,.gif,.webp,.svg"
            mediaType="image"
          />

          {/* Share Videos */}
          <MediaUploader
            items={story.share.videos}
            onUpdate={(items) => handleShareUpdate('videos', items)}
            onSaveItem={(url, index) => handleSaveMediaItem(url, index, 'share', 'videos')}
            placeholder="https://youtube.com/watch?v=... or https://vimeo.com/..."
            label="Share Videos"
            acceptedFileTypes=".mp4,.webm,.ogg,.avi,.mov"
            mediaType="video"
          />
        </div>
      </div>

      {/* Upload Information */}
      <div className="bg-green-50 border border-green-200 rounded-lg p-6">
        <h3 className="text-lg font-medium text-green-900 mb-2">✅ File Upload Available</h3>
        <p className="text-sm text-green-700 mb-4">
          You can now upload files directly or add URLs manually. Use the "Upload File" button for each media type above.
        </p>
        <div className="text-sm text-green-600">
          <p><strong>Supported formats:</strong></p>
          <ul className="list-disc list-inside mt-2 space-y-1">
            <li><strong>Images:</strong> JPG, PNG, GIF, WebP, SVG (max 50MB)</li>
            <li><strong>Videos:</strong> MP4, WebM, OGG, AVI, MOV (max 50MB)</li>
            <li><strong>Audio:</strong> MP3, WAV, OGG, M4A (max 50MB)</li>
          </ul>
        </div>
      </div>
    </div>
  );
};
