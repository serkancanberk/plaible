import React from 'react';
import BaseModal from './BaseModal';
import C2AButton from '../../C2AButton';

type Props = {
  open: boolean;
  onClose: () => void;
};

const KeepInTouchModal: React.FC<Props> = ({ open, onClose }) => {
  const title = 'KEEP IN TOUCH';
  const heading = 'We’re just a message away — reach out anytime.';
  const description = 'Follow us for updates, new releases, and behind-the-scenes magic.';
  const footerNote = 'We read everything. Seriously.';

  return (
    <BaseModal open={open} onClose={onClose} title={title} subtitle={heading} variant="accent" footer={<div className="text-caption text-text-primary/80">{footerNote}</div>}>
      <div className="text-body mb-spacing-md whitespace-pre-line">{description}</div>
      <div className="flex flex-col gap-spacing-lg mt-spacing-xs mb-spacing-md">
        <C2AButton icon="instagram" variant="secondary" context="onAccent" fullWidth>
          Plaible On Instagram
        </C2AButton>
        <C2AButton icon="tiktok" variant="secondary" context="onAccent" fullWidth>
          Plaible On TikTok
        </C2AButton>
        <C2AButton variant="secondary" context="onAccent" fullWidth>
          Plaible On YouTube
        </C2AButton>
        <C2AButton variant="secondary" context="onAccent" fullWidth>
          Plaible On LinkedIn
        </C2AButton>
        <C2AButton variant="secondary" context="onAccent" fullWidth>
          Send an email to Plaible
        </C2AButton>
      </div>
    </BaseModal>
  );
};

export default KeepInTouchModal;


