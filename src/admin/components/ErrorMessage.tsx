// src/admin/components/ErrorMessage.tsx
import React from 'react';

interface ErrorMessageProps {
  title: string;
  message: string;
  backHref?: string;
}

export const ErrorMessage: React.FC<ErrorMessageProps> = ({ title, message, backHref = "#/" }) => {
  return (
    <div className="p-8 text-center">
      <div className="text-red-600 mb-4">
        <h2 className="text-lg font-semibold mb-2">{title}</h2>
        <p>{message}</p>
      </div>
      <a href={backHref} className="text-blue-600 hover:underline">← Back to Home</a>
    </div>
  );
};
