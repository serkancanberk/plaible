import React, { useEffect, useCallback } from 'react';
import { createPortal } from 'react-dom';

type BaseModalProps = {
  open: boolean;
  onClose: () => void;
  title?: string;
  subtitle?: string;
  children: React.ReactNode;
  footer?: React.ReactNode;
  variant?: 'accent' | 'plain';
  className?: string;
};

export const BaseModal: React.FC<BaseModalProps> = ({
  open,
  onClose,
  title,
  subtitle,
  children,
  footer,
  variant = 'plain',
  className,
}) => {
  const onKeyDown = useCallback(
    (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    },
    [onClose]
  );

  useEffect(() => {
    if (!open) return;
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [open, onKeyDown]);

  if (!open) return null;

  if (variant === 'accent') {
    return createPortal(
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4" role="dialog" aria-modal="true">
        <div className="absolute inset-0 bg-black/60" onClick={onClose} />
        <div className={`relative z-10 w-[90%] ${className || 'max-w-[560px]'} bg-accent rounded-[16px] px-spacing-xl py-spacing-2xl text-primary shadow-lg`}>
          {title ? (
            <div className="mb-spacing-lg">
              <div className="flex items-end justify-between">
                <div className="text-body font-mono">{title}</div>
                <button type="button" onClick={onClose} className="text-caption text-primary hover:opacity-80" aria-label="Close">
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
          ) : (
            <div className="text-sans-label">{children}</div>
          )}

          {footer ? <div className="mt-spacing-md">{footer}</div> : null}
        </div>
      </div>,
      document.body
    );
  }

  // plain variant
  return createPortal(
    <div className="fixed inset-0 z-50 flex items-center justify-center" role="dialog" aria-modal="true">
      <div className="absolute inset-0 bg-black/40 backdrop-blur-sm opacity-100 transition-opacity" onClick={onClose} />

      <div className="relative z-10 w-full max-w-lg scale-100 transform rounded-xl bg-white p-6 shadow-xl transition-all">
        <div className="flex items-start justify-between gap-4">
          {title ? <h3 className="text-lg font-semibold text-gray-900">{title}</h3> : <span />}
          <button onClick={onClose} aria-label="Close" className="inline-flex h-8 w-8 items-center justify-center rounded-md text-gray-500 hover:bg-gray-100 hover:text-gray-700">
            ×
          </button>
        </div>

        {subtitle ? <div className="mt-spacing-xs text-body text-text-secondary">{subtitle}</div> : null}

        <div className="mt-4 text-gray-700">{children}</div>

        {footer ? <div className="mt-spacing-md">{footer}</div> : null}
      </div>
    </div>,
    document.body
  );
};

export default BaseModal;


