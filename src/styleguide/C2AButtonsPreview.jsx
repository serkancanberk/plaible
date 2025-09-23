import React from 'react';
import C2AButton from '../components/C2AButton';

const IconSparkle = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path d="M12 2l2.3 4.7L19 9l-4.7 2.3L12 16l-2.3-4.7L5 9l4.7-2.3L12 2z" fill="currentColor"/>
  </svg>
);

const IconArrowRight = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path d="M13 5l7 7-7 7" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
    <path d="M20 12H4" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
  </svg>
);

export default function C2AButtonsPreview() {
  return (
    <div className="flex flex-col gap-spacing-md">
      {/* Visual Variants */}
      <div className="bg-white/5 p-spacing-md rounded-card">
        <p className="text-label mb-spacing-sm">Visual Variants</p>
        <div className="flex flex-wrap items-center gap-spacing-md">
          <div>
            <p className="text-caption mb-spacing-xs">Primary + Body</p>
            <C2AButton variant="primary" typography="body">Primary CTA</C2AButton>
          </div>
          <div>
            <p className="text-caption mb-spacing-xs">Secondary + Caption</p>
            <C2AButton variant="secondary" typography="caption">Secondary CTA</C2AButton>
          </div>
          <div>
            <p className="text-caption mb-spacing-xs">Ghost + Label</p>
            <C2AButton variant="ghost" typography="label">Ghost CTA</C2AButton>
          </div>
        </div>
      </div>

      {/* Typography Variants */}
      <div className="bg-white/5 p-spacing-md rounded-card">
        <p className="text-label mb-spacing-sm">Typography Variants</p>
        <div className="flex flex-wrap items-center gap-spacing-md">
          <C2AButton typography="body">Body</C2AButton>
          <C2AButton typography="caption">Caption</C2AButton>
          <C2AButton typography="label">Label</C2AButton>
        </div>
      </div>

      {/* Full Width & className demo */}
      <div className="bg-white/5 p-spacing-md rounded-card">
        <p className="text-label mb-spacing-sm">fullWidth and className</p>
        <div className="flex flex-col gap-spacing-sm">
          <div>
            <p className="text-caption mb-spacing-xs">Ghost + FullWidth</p>
            <C2AButton variant="ghost" fullWidth>Ghost Full Width</C2AButton>
          </div>
          <div>
            <p className="text-caption mb-spacing-xs">Primary + Custom Margin</p>
            <div className="flex items-center">
              <C2AButton className="mt-spacing-md">With Custom Margin</C2AButton>
            </div>
          </div>
        </div>
      </div>

      {/* States */}
      <div className="bg-white/5 p-spacing-md rounded-card">
        <p className="text-label mb-spacing-sm">States</p>
        <div className="flex flex-wrap items-center gap-spacing-md">
          <div>
            <p className="text-caption mb-spacing-xs">Disabled (Primary)</p>
            <C2AButton disabled>Disabled CTA</C2AButton>
          </div>
          <div>
            <p className="text-caption mb-spacing-xs">Loading (Primary)</p>
            <C2AButton loading loadingText="Loading…"/>
          </div>
          <div>
            <p className="text-caption mb-spacing-xs">Focus Ring (tab to see)</p>
            <C2AButton>Focusable CTA</C2AButton>
          </div>
        </div>
      </div>

      {/* Icons */}
      <div className="bg-white/5 p-spacing-md rounded-card">
        <p className="text-label mb-spacing-sm">Icons</p>
        <div className="flex flex-wrap items-center gap-spacing-md">
          <div>
            <p className="text-caption mb-spacing-xs">Google (brand, left)</p>
            <C2AButton icon="google">Continue with Google</C2AButton>
          </div>
          <div>
            <p className="text-caption mb-spacing-xs">Apple (black, left)</p>
            <C2AButton icon="apple" iconColor="black">Continue with Apple</C2AButton>
          </div>
          <div>
            <p className="text-caption mb-spacing-xs">TikTok (white, on accent)</p>
            <div className="bg-accent p-spacing-md rounded-card">
              <C2AButton context="onAccent" variant="secondary" icon="tiktok" iconColor="white">Continue with TikTok</C2AButton>
            </div>
          </div>
          <div>
            <p className="text-caption mb-spacing-xs">Instagram (brand, right)</p>
            <C2AButton icon="instagram" iconPosition="right">Follow on Instagram</C2AButton>
          </div>
          <div>
            <p className="text-caption mb-spacing-xs">App Store (brand, full width)</p>
            <C2AButton icon="appstore" fullWidth>Download On The App Store</C2AButton>
          </div>
          <div>
            <p className="text-caption mb-spacing-xs">Google Play (brand, full width)</p>
            <C2AButton icon="playstore" fullWidth>Get It On Google Play</C2AButton>
          </div>
        </div>
      </div>
    </div>
  );
}


