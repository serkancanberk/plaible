// src/admin/components/storyEdit/PricingEditor.tsx
import React from 'react';
import { Story } from '../../api';

interface PricingEditorProps {
  story: Story;
  onUpdate: (updates: Partial<Story>) => void;
}

export const PricingEditor: React.FC<PricingEditorProps> = ({ story, onUpdate }) => {
  const handlePricingChange = (field: keyof typeof story.pricing, value: number) => {
    onUpdate({
      pricing: {
        ...story.pricing,
        [field]: value
      }
    });
  };

  const calculateTotalCredits = () => {
    return story.pricing.creditsPerChapter * story.pricing.estimatedChapterCount;
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-semibold text-gray-900 mb-4">💰 Pricing Configuration</h2>
        <p className="text-sm text-gray-600 mb-6">Set the pricing structure for this story.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Credits Per Chapter */}
        <div className="bg-gray-50 rounded-lg p-6">
          <h3 className="text-lg font-medium text-gray-900 mb-4">Credits Per Chapter</h3>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Credits Required
            </label>
            <div className="relative">
              <input
                type="number"
                value={story.pricing.creditsPerChapter}
                onChange={(e) => handlePricingChange('creditsPerChapter', parseInt(e.target.value) || 0)}
                className="w-full px-3 py-2 pr-8 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                min="1"
                max="100"
              />
              <span className="absolute right-3 top-2 text-gray-500 text-sm">credits</span>
            </div>
            <p className="text-xs text-gray-500 mt-2">
              Number of credits users need to spend to access each chapter.
            </p>
          </div>
        </div>

        {/* Estimated Chapter Count */}
        <div className="bg-gray-50 rounded-lg p-6">
          <h3 className="text-lg font-medium text-gray-900 mb-4">Estimated Chapter Count</h3>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Total Chapters
            </label>
            <div className="relative">
              <input
                type="number"
                value={story.pricing.estimatedChapterCount}
                onChange={(e) => handlePricingChange('estimatedChapterCount', parseInt(e.target.value) || 0)}
                className="w-full px-3 py-2 pr-8 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                min="1"
                max="1000"
              />
              <span className="absolute right-3 top-2 text-gray-500 text-sm">chapters</span>
            </div>
            <p className="text-xs text-gray-500 mt-2">
              Estimated total number of chapters in this story.
            </p>
          </div>
        </div>
      </div>

      {/* Pricing Summary */}
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-6">
        <h3 className="text-lg font-medium text-blue-900 mb-4">💰 Pricing Summary</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="bg-white rounded-lg p-4 text-center">
            <div className="text-2xl font-bold text-blue-600">
              {story.pricing.creditsPerChapter}
            </div>
            <div className="text-sm text-gray-600">Credits per Chapter</div>
          </div>
          <div className="bg-white rounded-lg p-4 text-center">
            <div className="text-2xl font-bold text-green-600">
              {story.pricing.estimatedChapterCount}
            </div>
            <div className="text-sm text-gray-600">Total Chapters</div>
          </div>
          <div className="bg-white rounded-lg p-4 text-center">
            <div className="text-2xl font-bold text-purple-600">
              {calculateTotalCredits()}
            </div>
            <div className="text-sm text-gray-600">Total Credits</div>
          </div>
        </div>
        <div className="mt-4 text-center">
          <p className="text-sm text-blue-800">
            Users will need <strong>{calculateTotalCredits()} credits</strong> to access the complete story.
          </p>
        </div>
      </div>

      {/* Pricing Guidelines */}
      <div className="bg-gray-50 rounded-lg p-6">
        <h3 className="text-lg font-medium text-gray-900 mb-4">📊 Pricing Guidelines</h3>
        <div className="space-y-3 text-sm text-gray-700">
          <div className="flex items-start">
            <span className="text-green-500 mr-2">✓</span>
            <p><strong>Credits per Chapter:</strong> Typically ranges from 5-20 credits depending on story length and complexity.</p>
          </div>
          <div className="flex items-start">
            <span className="text-green-500 mr-2">✓</span>
            <p><strong>Chapter Count:</strong> Consider story length, pacing, and user engagement when estimating chapters.</p>
          </div>
          <div className="flex items-start">
            <span className="text-green-500 mr-2">✓</span>
            <p><strong>Total Cost:</strong> Balance accessibility with value - too expensive may reduce engagement.</p>
          </div>
          <div className="flex items-start">
            <span className="text-green-500 mr-2">✓</span>
            <p><strong>Market Research:</strong> Check similar stories' pricing to ensure competitive positioning.</p>
          </div>
        </div>
      </div>

      {/* Pricing Tiers Reference */}
      <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-6">
        <h3 className="text-lg font-medium text-yellow-900 mb-4">💡 Pricing Tiers Reference</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
          <div className="bg-white rounded-lg p-4">
            <h4 className="font-medium text-gray-900 mb-2">Budget Tier</h4>
            <p className="text-gray-600 mb-2">5-10 credits/chapter</p>
            <p className="text-xs text-gray-500">Short stories, simple narratives</p>
          </div>
          <div className="bg-white rounded-lg p-4">
            <h4 className="font-medium text-gray-900 mb-2">Standard Tier</h4>
            <p className="text-gray-600 mb-2">10-15 credits/chapter</p>
            <p className="text-xs text-gray-500">Most stories, balanced complexity</p>
          </div>
          <div className="bg-white rounded-lg p-4">
            <h4 className="font-medium text-gray-900 mb-2">Premium Tier</h4>
            <p className="text-gray-600 mb-2">15-25 credits/chapter</p>
            <p className="text-xs text-gray-500">Complex stories, high production value</p>
          </div>
        </div>
      </div>
    </div>
  );
};
