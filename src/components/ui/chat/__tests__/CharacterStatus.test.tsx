import React from 'react';
import { render, screen } from '@testing-library/react';
import { CharacterStatus } from '../CharacterStatus';

describe('CharacterStatus', () => {
  it('renders default status correctly', () => {
    render(<CharacterStatus />);
    
    expect(screen.getByText('🎭 Alignment: Neutral')).toBeInTheDocument();
    expect(screen.getByText('🤝 Relationships: Building trust')).toBeInTheDocument();
    expect(screen.getByText('⏳ Progress: Chapter 1 of 6')).toBeInTheDocument();
  });

  it('renders custom status props', () => {
    render(
      <CharacterStatus
        alignment="Temptation"
        relationshipHint="+Trust"
        progress="Chapter 3 of 6"
      />
    );
    
    expect(screen.getByText('🎭 Alignment: Temptation')).toBeInTheDocument();
    expect(screen.getByText('🤝 Relationships: +Trust')).toBeInTheDocument();
    expect(screen.getByText('⏳ Progress: Chapter 3 of 6')).toBeInTheDocument();
  });

  it('applies correct styling classes', () => {
    const { container } = render(<CharacterStatus />);
    
    const statusDiv = container.firstChild as HTMLElement;
    expect(statusDiv).toHaveClass('rounded-card', 'bg-ui-muted', 'p-spacing-md', 'text-text-secondary', 'text-caption');
  });

  it('accepts custom className', () => {
    const { container } = render(
      <CharacterStatus className="custom-class" />
    );
    
    expect(container.firstChild).toHaveClass('custom-class');
  });

  it('renders with proper spacing between items', () => {
    const { container } = render(<CharacterStatus />);
    
    const flexContainer = container.querySelector('.flex.flex-col.gap-spacing-xs');
    expect(flexContainer).toBeInTheDocument();
  });
});
