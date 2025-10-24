import React from 'react';
import C2AButton from '../components/C2AButton';

export default function C2AButtonGroupPreview() {
  return (
    <div className="flex flex-col gap-spacing-md">
      <div className="space-y-spacing-sm">
        <h3 className="text-heading text-text-secondary">Button Groups</h3>
        <p className="text-caption text-text-secondary">Common layouts for dialogs and modals using tokenized spacing and responsive wrapping.</p>
      </div>

      {/* Two-button group */}
      <div className="bg-white/5 p-spacing-md rounded-card">
        <p className="text-label mb-spacing-sm">Two Buttons (Cancel / Continue)</p>
        <div className="flex flex-wrap items-center gap-spacing-md">
          <C2AButton variant="secondary" typography="caption">Cancel</C2AButton>
          <C2AButton variant="primary" typography="caption">Continue</C2AButton>
        </div>
      </div>

      {/* Three-button group */}
      <div className="bg-white/5 p-spacing-md rounded-card">
        <p className="text-label mb-spacing-sm">Three Buttons (Back / Skip / Next)</p>
        <div className="flex flex-wrap items-center gap-spacing-md">
          <C2AButton variant="ghost" typography="caption">Back</C2AButton>
          <C2AButton variant="secondary" typography="caption">Skip</C2AButton>
          <C2AButton variant="primary" typography="caption">Next</C2AButton>
        </div>
      </div>

      {/* Full-width group */}
      <div className="bg-white/5 p-spacing-md rounded-card">
        <p className="text-label mb-spacing-sm">Full-Width Buttons</p>
        <div className="flex flex-wrap items-center gap-spacing-sm">
          <C2AButton fullWidth variant="ghost">Back</C2AButton>
          <C2AButton fullWidth variant="secondary">Skip</C2AButton>
          <C2AButton fullWidth variant="primary">Next</C2AButton>
        </div>
      </div>

      {/* Loading in a group */}
      <div className="bg-white/5 p-spacing-md rounded-card">
        <p className="text-label mb-spacing-sm">Loading State in Group</p>
        <div className="flex flex-wrap items-center gap-spacing-md">
          <C2AButton variant="secondary">Cancel</C2AButton>
          <C2AButton variant="primary" loading loadingText="Processing…" />
        </div>
      </div>
    </div>
  );
}


