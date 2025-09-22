import React from 'react';

export default function ModalWrapper({
  open = false,
  onClose,
  title,
  subtitle,
  children,
}) {
  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4">
      <div className="relative w-[90%] max-w-[560px] bg-accent rounded-[16px] px-spacing-xl py-spacing-2xl text-primary shadow-lg">
        {title ? (
          <div className="mb-spacing-lg">
            <div className="flex items-end justify-between">
              <div className="text-body font-mono">{title}</div>
              <button
                type="button"
                onClick={onClose}
                className="text-caption text-primary hover:opacity-80"
              >
                Close
              </button>
            </div>
            <div className="mt-spacing-sm border-t border-black pt-spacing-sm" />
          </div>
        ) : null}

        {subtitle ? (
          <div className="pt-0 mb-spacing-sm space-y-spacing-xs">
            <div className="text-body font-bold">{subtitle}</div>
            <div className="text-sans-label">{children}</div>
          </div>
        ) : null}
      </div>
    </div>
  );
}
