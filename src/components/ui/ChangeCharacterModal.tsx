interface ChangeCharacterModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function ChangeCharacterModal({ isOpen, onClose }: ChangeCharacterModalProps) {
  if (!isOpen) return null;
  
  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 max-w-md mx-4">
        <h2 className="text-lg font-semibold mb-4">Change Character</h2>
        <p className="text-gray-600 mb-4">Character selection modal coming soon...</p>
        <button
          onClick={onClose}
          className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
        >
          Close
        </button>
      </div>
    </div>
  );
}
