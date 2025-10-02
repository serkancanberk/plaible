import React from 'react';
import { render, screen } from '@testing-library/react';
import ColorCard from '../ColorCard';

describe('ColorCard', () => {
  test('renders background color token correctly', () => {
    const props = {
      label: 'Primary',
      token: 'bg-primary',
      hex: '#192233'
    };
    
    render(<ColorCard {...props} />);
    
    // Check that the token name is displayed
    expect(screen.getByText('bg-primary')).toBeInTheDocument();
    expect(screen.getByText('Primary')).toBeInTheDocument();
    expect(screen.getByText('#192233')).toBeInTheDocument();
  });

  test('renders text color token correctly', () => {
    const props = {
      label: 'Primary',
      token: 'text-text-primary',
      hex: '#192233'
    };
    
    render(<ColorCard {...props} />);
    
    // Check that the token name is displayed
    expect(screen.getByText('text-text-primary')).toBeInTheDocument();
    expect(screen.getByText('Primary')).toBeInTheDocument();
    expect(screen.getByText('#192233')).toBeInTheDocument();
  });

  test('applies correct CSS classes for background tokens', () => {
    const props = {
      label: 'Primary',
      token: 'bg-primary',
      hex: '#192233'
    };
    
    const { container } = render(<ColorCard {...props} />);
    
    // Check that the swatch has the correct background class
    const swatch = container.querySelector('.bg-primary');
    expect(swatch).toBeInTheDocument();
  });

  test('applies correct CSS classes for text tokens', () => {
    const props = {
      label: 'Primary',
      token: 'text-text-primary',
      hex: '#192233'
    };
    
    const { container } = render(<ColorCard {...props} />);
    
    // Check that the text has the correct text color class
    const textElement = container.querySelector('.text-text-primary');
    expect(textElement).toBeInTheDocument();
  });
});
