import React from 'react';
import { render, screen } from '@testing-library/react';
import { ChatContainer, Message } from '../ChatContainer';

const mockMessages: Message[] = [
  {
    id: '1',
    role: 'assistant',
    content: 'Welcome to your story adventure!',
    choices: ['Enter the forest', 'Look around'],
    metadata: {
      chapter: 1,
      beat: 1,
      tokenUsage: { prompt: 50, completion: 30, total: 80 },
      latency: 1200
    },
    createdAt: new Date()
  },
  {
    id: '2',
    role: 'user',
    content: 'I want to enter the forest',
    metadata: {
      chapter: 1,
      beat: 1,
      tokenUsage: { prompt: 0, completion: 0, total: 0 },
      latency: 0
    },
    createdAt: new Date()
  }
];

describe('ChatContainer', () => {
  it('renders messages correctly', () => {
    render(<ChatContainer messages={mockMessages} />);
    
    expect(screen.getByText('Welcome to your story adventure!')).toBeInTheDocument();
    expect(screen.getByText('I want to enter the forest')).toBeInTheDocument();
  });

  it('renders choices for assistant messages', () => {
    render(<ChatContainer messages={mockMessages} />);
    
    expect(screen.getByText('1. Enter the forest')).toBeInTheDocument();
    expect(screen.getByText('2. Look around')).toBeInTheDocument();
  });

  it('shows typing indicator when isTyping is true', () => {
    render(<ChatContainer messages={mockMessages} isTyping={true} />);
    
    expect(screen.getByText('AI is typing')).toBeInTheDocument();
  });

  it('does not show typing indicator when isTyping is false', () => {
    render(<ChatContainer messages={mockMessages} isTyping={false} />);
    
    expect(screen.queryByText('AI is typing')).not.toBeInTheDocument();
  });
});
