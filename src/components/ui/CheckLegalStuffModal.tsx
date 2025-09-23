import React from 'react';
import BaseModal from './BaseModal';
import C2AButton from '../../components/C2AButton';

type Props = {
  open: boolean;
  onClose: () => void;
};

const CheckLegalStuffModal: React.FC<Props> = ({ open, onClose }) => {
  const title = 'CHECK THE LEGAL STUFF';
  const heading = 'We keep it simple: your privacy matters';
  const description = 'Take a quick look at our Terms & Privacy Policy to see how we keep things safe and fair.';
  const footerNote = 'Last updated: August 2025';

  return (
    <BaseModal open={open} onClose={onClose} title={title} subtitle={heading} variant="accent" footer={<div className="text-caption text-text-primary/80">{footerNote}</div>}>
      <div className="text-body mb-spacing-md whitespace-pre-line">{description}</div>
      <div className="flex flex-col gap-spacing-lg mt-spacing-xs mb-spacing-md">
        <C2AButton variant="secondary" context="onAccent" fullWidth>
          Terms of Use
        </C2AButton>
        <C2AButton variant="secondary" context="onAccent" fullWidth>
          Privacy Policy
        </C2AButton>
      </div>
    </BaseModal>
  );
};

export default CheckLegalStuffModal;


