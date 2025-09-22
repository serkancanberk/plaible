import React from 'react';

export default function MenuItem({ label, href, className = '' }) {
  return (
    <div className={`w-full ${className}`}>
      <a href={href} className="w-full flex items-center justify-between text-primary font-mono text-body pb-4">
        <span className="truncate">{label}</span>
        <span aria-hidden="true">→</span>
      </a>
      <div className="h-px w-full bg-primary" />
    </div>
  );
}


