import React, { useState } from 'react';
import { Modal } from '../../components/ui/Modal';

export const LandingRightPanel: React.FC = () => {
  const [isModalOpen, setIsModalOpen] = useState(false);

  return (
    <div className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold mb-1">Featured Worlds</h3>
        <button
          onClick={() => setIsModalOpen(true)}
          className="ml-3 inline-flex items-center rounded-md border border-gray-300 bg-white px-2 py-1 text-sm hover:bg-gray-50"
        >
          Open Modal
        </button>
      </div>
      <ul className="list-disc pl-5 text-gray-600">
        <li>Frankenstein</li>
        <li>Dorian Gray</li>
        <li>Wizard Trials</li>
      </ul>

      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title="Demo Modal"
      >
        <p>This is a reusable modal component example.</p>
      </Modal>
    </div>
  );
};


