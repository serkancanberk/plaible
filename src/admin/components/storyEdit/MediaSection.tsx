// src/admin/components/storyEdit/MediaSection.tsx
import React from 'react';
import { Story, MediaBlock, Share } from '../../api';

interface MediaSectionProps {
  story: Story;
  onUpdate: (updates: Partial<Story>) => void;
}

export const MediaSection: React.FC<MediaSectionProps> = ({ story, onUpdate }) => {
  const handleArrayChange = (field: keyof MediaBlock | keyof Share, value: string) => {
    const array = value.split('\n').map(item => item.trim()).filter(item => item);
    
    if (field === 'images' || field === 'videos' || field === 'ambiance') {
      onUpdate({
        assets: {
          ...story.assets,
          [field]: array
        }
      });
    } else if (field === 'link' || field === 'text') {
      onUpdate({
        share: {
          ...story.share,
          [field]: value
        }
      });
    } else {
      onUpdate({
        share: {
          ...story.share,
          [field]: array
        }
      });
    }
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
        <p className="text-sm text-gray-600 mb-6">Manage story assets and sharing configuration.</p>
      </div>

      {/* Story Assets */}
      <div className="bg-gray-50 rounded-lg p-6">
        <h3 className="text-lg font-medium text-gray-900 mb-4">Story Assets</h3>
        
        <div className="space-y-4">
          {/* Images */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Images
            </label>
            <textarea
              value={story.assets.images.join('\n')}
              onChange={(e) => handleArrayChange('images', e.target.value)}
              rows={4}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="https://example.com/image1.jpg&#10;https://example.com/image2.jpg"
            />
            <p className="text-xs text-gray-500 mt-1">One URL per line</p>
          </div>

          {/* Videos */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Videos
            </label>
            <textarea
              value={story.assets.videos.join('\n')}
              onChange={(e) => handleArrayChange('videos', e.target.value)}
              rows={4}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="https://youtube.com/watch?v=...&#10;https://vimeo.com/..."
            />
            <p className="text-xs text-gray-500 mt-1">One URL per line</p>
          </div>

          {/* Ambiance */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Ambiance (Audio/Atmosphere)
            </label>
            <textarea
              value={story.assets.ambiance.join('\n')}
              onChange={(e) => handleArrayChange('ambiance', e.target.value)}
              rows={4}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="https://soundcloud.com/...&#10;https://youtube.com/watch?v=..."
            />
            <p className="text-xs text-gray-500 mt-1">Audio/ambiance URLs, one per line</p>
          </div>
        </div>
      </div>

      {/* Sharing Configuration */}
      <div className="bg-gray-50 rounded-lg p-6">
        <h3 className="text-lg font-medium text-gray-900 mb-4">Sharing Configuration</h3>
        
        <div className="space-y-4">
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
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Share Images
            </label>
            <textarea
              value={story.share.images.join('\n')}
              onChange={(e) => handleArrayChange('images', e.target.value)}
              rows={4}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="https://example.com/share-image1.jpg&#10;https://example.com/share-image2.jpg"
            />
            <p className="text-xs text-gray-500 mt-1">Images for social sharing, one URL per line</p>
          </div>

          {/* Share Videos */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Share Videos
            </label>
            <textarea
              value={story.share.videos.join('\n')}
              onChange={(e) => handleArrayChange('videos', e.target.value)}
              rows={4}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="https://youtube.com/watch?v=...&#10;https://vimeo.com/..."
            />
            <p className="text-xs text-gray-500 mt-1">Videos for social sharing, one URL per line</p>
          </div>
        </div>
      </div>

      {/* File Upload Placeholder */}
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-6">
        <h3 className="text-lg font-medium text-blue-900 mb-2">📁 File Upload</h3>
        <p className="text-sm text-blue-700 mb-4">
          File upload functionality will be implemented in a future update. For now, you can paste URLs directly into the fields above.
        </p>
        <div className="border-2 border-dashed border-blue-300 rounded-lg p-8 text-center">
          <div className="text-blue-400 text-4xl mb-2">📤</div>
          <p className="text-blue-600 font-medium">Drag & drop files here</p>
          <p className="text-blue-500 text-sm">or click to browse</p>
        </div>
      </div>
    </div>
  );
};
