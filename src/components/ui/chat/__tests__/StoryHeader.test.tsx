import React from 'react';
import { render, screen } from '@testing-library/react';
import { StoryHeader } from '../StoryHeader';

const mockProps = {
  story: {
    title: 'Test Story',
    slug: 'test-story'
  },
  character: {
    name: 'Test Character',
    displayName: 'Test Character'
  },
  toneStyle: {
    id: 'original',
    label: 'Original'
  },
  timeFlavor: {
    id: 'original',
    label: 'Original'
  }
};

describe('StoryHeader', () => {
  it('renders story context correctly', () => {
    render(<StoryHeader {...mockProps} />);
    
    expect(screen.getByText('In the Scene')).toBeInTheDocument();
    expect(screen.getByText(/Playing as Test Character/)).toBeInTheDocument();
    expect(screen.getByText(/Original theme/)).toBeInTheDocument();
    expect(screen.getByText(/Original time/)).toBeInTheDocument();
  });

  it('applies correct styling classes', () => {
    const { container } = render(<StoryHeader {...mockProps} />);
    
    const heading = container.querySelector('h1');
    expect(heading).toHaveClass('text-heading', 'text-text-primary');
    
    const paragraph = container.querySelector('p');
    expect(paragraph).toHaveClass('text-label');
  });

  it('highlights character name with accent color', () => {
    render(<StoryHeader {...mockProps} />);
    
    const characterSpan = screen.getByText('Test Character');
    expect(characterSpan).toHaveClass('text-accent', 'font-medium');
  });

  it('accepts custom className', () => {
    const { container } = render(
      <StoryHeader {...mockProps} className="custom-class" />
    );
    
    expect(container.firstChild).toHaveClass('custom-class');
  });
});
