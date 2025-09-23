import React from 'react';
import BaseModal from './BaseModal';
import C2AButton from '../../components/C2AButton';

type GetTheAppModalProps = {
  open: boolean;
  onClose: () => void;
};

const GetTheAppModal: React.FC<GetTheAppModalProps> = ({ open, onClose }) => {
  return (
    <BaseModal
      open={open}
      onClose={onClose}
      title="GET THE PLAIBLE APP"
      subtitle="It's coming soon"
      variant="accent"
      footer={<div className="text-caption">Stay tuned — we’re almost there.</div>}
    >
      <div className="text-body mb-spacing-md">Live epic stories anywhere. Your choices go with you.</div>

      <div className="flex flex-col gap-spacing-lg mt-spacing-xs mb-spacing-md">
        <C2AButton icon="appstore" variant="secondary" context="onAccent" fullWidth>
          Download On The App Store (soon)
        </C2AButton>
        <C2AButton icon="playstore" variant="secondary" context="onAccent" fullWidth>
          Get It On Google Play (soon)
        </C2AButton>
      </div>
    </BaseModal>
  );
};

export default GetTheAppModal;


