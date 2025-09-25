import React from 'react';
import BaseModal from './BaseModal';
import C2AButton from '../../components/C2AButton';

type StartToPlayNowModalProps = {
  open: boolean;
  onClose: () => void;
};

const StartToPlayNowModal: React.FC<StartToPlayNowModalProps> = ({ open, onClose }) => {
  return (
    <BaseModal
      open={open}
      onClose={onClose}
      title="START TO PLAY NOW"
      subtitle="Sign up for free and start your story."
      variant="accent"
    >
      <div className="text-body mb-spacing-md">Play as you go, pay only as you continue your journey.</div>

      <div className="flex flex-col gap-spacing-lg mt-spacing-xs mb-spacing-md">
        <C2AButton icon="google" variant="secondary" context="onAccent" fullWidth>
          Continue with Google
        </C2AButton>
      </div>

      <div className="space-y-spacing-xs">
        <p className="text-caption">
          By continuing you agree to the <a href="#" className="underline text-primary">Terms Of Use</a> and <a href="#" className="underline text-primary">Privacy Policy</a>.
        </p>
        <p className="text-caption">
          Find all details in the <a href="#" className="underline text-primary">Legal</a> page.
        </p>
      </div>
    </BaseModal>
  );
};

export default StartToPlayNowModal;


