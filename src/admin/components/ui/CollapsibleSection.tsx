// src/admin/components/ui/CollapsibleSection.tsx
import React, { useState } from 'react';

interface CollapsibleSectionProps {
  title: string;
  defaultOpen?: boolean;
  children: React.ReactNode;
  className?: string;
}

export const CollapsibleSection: React.FC<CollapsibleSectionProps> = ({
  title,
  defaultOpen = true,
  children,
  className = ''
}) => {
  const [isOpen, setIsOpen] = useState(defaultOpen);

  const toggleOpen = () => {
    setIsOpen(!isOpen);
  };

  return (
    <div className={`border-t border-gray-200 ${className}`}>
      <button
        onClick={toggleOpen}
        className="w-full flex items-center justify-between py-4 text-left focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 rounded-md"
        aria-expanded={isOpen}
      >
        <h4 className="text-md font-medium text-gray-900">{title}</h4>
        <div className="flex-shrink-0 ml-4">
          <svg
            className={`w-5 h-5 text-gray-500 transition-transform duration-200 ${
              isOpen ? 'rotate-180' : ''
            }`}
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M19 9l-7 7-7-7"
            />
          </svg>
        </div>
      </button>
      
      {isOpen && (
        <div className="pb-4">
          {children}
        </div>
      )}
    </div>
  );
};
