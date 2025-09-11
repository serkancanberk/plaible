// src/admin/components/storyEdit/MediaSection.tsx
import React from 'react';
import { Story, MediaBlock, Share } from '../../api';
import { CompactMediaUploader } from './CompactMediaUploader';

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
          <CompactMediaUploader
            items={story.assets.images}
            onUpdate={(items) => handleAssetsUpdate('images', items)}
            placeholder="https://example.com/image1.jpg"
            label="Images"
            acceptedFileTypes=".jpg,.jpeg,.png,.gif,.webp,.svg"
            mediaType="image"
            storyId={storyId}
          />

          {/* Videos */}
          <CompactMediaUploader
            items={story.assets.videos}
            onUpdate={(items) => handleAssetsUpdate('videos', items)}
            placeholder="https://youtube.com/watch?v=... or https://vimeo.com/..."
            label="Videos"
            acceptedFileTypes=".mp4,.webm,.ogg,.avi,.mov"
            mediaType="video"
            storyId={storyId}
          />

          {/* Ambiance */}
          <CompactMediaUploader
            items={story.assets.ambiance}
            onUpdate={(items) => handleAssetsUpdate('ambiance', items)}
            placeholder="https://soundcloud.com/... or https://youtube.com/watch?v=..."
            label="Ambiance (Audio/Atmosphere)"
            acceptedFileTypes=".mp3,.wav,.ogg,.m4a"
            mediaType="audio"
            storyId={storyId}
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
          <CompactMediaUploader
            items={story.share.images}
            onUpdate={(items) => handleShareUpdate('images', items)}
            placeholder="https://example.com/share-image1.jpg"
            label="Share Images"
            acceptedFileTypes=".jpg,.jpeg,.png,.gif,.webp,.svg"
            mediaType="image"
            storyId={storyId}
          />

          {/* Share Videos */}
          <CompactMediaUploader
            items={story.share.videos}
            onUpdate={(items) => handleShareUpdate('videos', items)}
            placeholder="https://youtube.com/watch?v=... or https://vimeo.com/..."
            label="Share Videos"
            acceptedFileTypes=".mp4,.webm,.ogg,.avi,.mov"
            mediaType="video"
            storyId={storyId}
          />
        </div>
      </div>

      {/* Upload Information */}
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-6">
        <h3 className="text-lg font-medium text-blue-900 mb-2">📝 Unified Save Behavior</h3>
        <p className="text-sm text-blue-700 mb-4">
          All media changes (adding, removing, or modifying items) are saved together when you click the "Save Changes" button at the top of the page. New items are marked with a "New" badge until saved.
        </p>
        <div className="text-sm text-blue-600">
          <p><strong>How it works:</strong></p>
          <ul className="list-disc list-inside mt-2 space-y-1">
            <li>✅ Add media items using URLs or file uploads</li>
            <li>🗑️ Remove items using the "Remove" button on hover</li>
            <li>💾 All changes are saved when you click "Save Changes"</li>
            <li>🆕 New items show a "New" badge until saved</li>
          </ul>
        </div>
      </div>
    </div>
  );
};
