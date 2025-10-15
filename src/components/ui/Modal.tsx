import React from 'react';
import BaseModal from './modals/BaseModal';

type ModalProps = {
  isOpen: boolean;
  onClose: () => void;
  title?: string;
  children: React.ReactNode;
};

// Backwards-compatible export that wraps the new BaseModal with the "plain" variant.
export const Modal: React.FC<ModalProps> = ({ isOpen, onClose, title, children }) => {
  return (
    <BaseModal open={isOpen} onClose={onClose} title={title} variant="plain">
      {children}
    </BaseModal>
  );
};

export default Modal;
