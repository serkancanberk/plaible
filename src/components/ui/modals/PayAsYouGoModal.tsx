import React from 'react';
import BaseModal from './BaseModal';
import C2AButton from '../../C2AButton';

type Props = {
  open: boolean;
  onClose: () => void;
};

const PayAsYouGoModal: React.FC<Props> = ({ open, onClose }) => {
  const title = 'PAY AS YOU GO';
  const heading = 'Pay only for what you play';
  const description = 'No subscriptions. No hidden fees.\nTop up your balance and spend only when you step into a story.\nYour imagination is limitless — your payment isn’t.';
  const footerNote = 'Freedom to play, without commitment.';

  return (
    <BaseModal open={open} onClose={onClose} title={title} subtitle={heading} variant="accent" footer={<div className="text-caption text-text-primary/80">{footerNote}</div>}>
      <div className="text-body mb-spacing-md whitespace-pre-line">{description}</div>
      <div className="flex flex-col gap-spacing-lg mt-spacing-xs mb-spacing-md">
        <C2AButton variant="secondary" context="onAccent" fullWidth>
          Continue
        </C2AButton>
      </div>
    </BaseModal>
  );
};

export default PayAsYouGoModal;


