import React from 'react';
import BaseModal from './BaseModal';
import { CharacterCarousel, Character } from '../CharacterCarousel';

interface ChangeCharacterModalProps {
  isOpen: boolean;
  onClose: () => void;
  characters: Character[];
  onCharacterSelect: (characterId: string) => void;
}

const ChangeCharacterModal: React.FC<ChangeCharacterModalProps> = ({ 
  isOpen, 
  onClose, 
  characters, 
  onCharacterSelect 
}) => {
  return (
    <BaseModal
      open={isOpen}
      onClose={onClose}
      title="CHANGE CHARACTER"
      subtitle="Select your character to continue the story."
      variant="accent"
      className="w-full md:max-w-3xl lg:max-w-5xl"
    >
      {characters?.length ? (
        <CharacterCarousel
          characters={characters}
          onPlay={onCharacterSelect}
        />
      ) : (
        <p className="text-caption text-text-secondary">No characters available.</p>
      )}
    </BaseModal>
  );
};

export default ChangeCharacterModal;
