import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { ChatContainer } from '../components/ui/chat/ChatContainer';
import { useChatMessages } from '../hooks/useChatMessages';
import { fetchJson } from '../lib/http';

// Mock the fetchJson utility
jest.mock('../lib/http', () => ({
  fetchJson: jest.fn(),
}));

const mockFetchJson = fetchJson as jest.Mock;

// Mock component to test the hook
function TestComponent() {
  const { messages, isLoading, error, fetchMessages } = useChatMessages('test-session-123');
  
  return (
    <div>
      <button onClick={fetchMessages} disabled={isLoading}>
        {isLoading ? 'Loading...' : 'Fetch Messages'}
      </button>
      {error && <div data-testid="error">{error}</div>}
      <ChatContainer messages={messages} isLoading={isLoading} />
    </div>
  );
}

describe('Message Endpoint Integration', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should handle empty message list gracefully', async () => {
    // Mock empty messages response
    const mockEmptyResponse = {
      sessionId: 'test-session-123',
      messages: []
    };

    mockFetchJson.mockResolvedValueOnce(mockEmptyResponse);

    render(
      <BrowserRouter>
        <Routes>
          <Route path="/app/play/run/:storySlug/:characterSlug" element={<TestComponent />} />
        </Routes>
      </BrowserRouter>
    );

    const fetchButton = screen.getByText('Fetch Messages');
    fetchButton.click();

    await waitFor(() => {
      expect(screen.getByText('No messages yet. Your story will begin soon.')).toBeInTheDocument();
    });

    // Should not show error for empty messages
    expect(screen.queryByTestId('error')).not.toBeInTheDocument();
  });

  it('should display messages when they exist', async () => {
    // Mock messages response with content
    const mockMessagesResponse = {
      sessionId: 'test-session-123',
      messages: [
        {
          role: 'storyrunner',
          content: 'Welcome to the story!',
          choices: ['Begin your journey', 'Learn more about the world'],
          ts: '2024-01-01T00:00:00.000Z'
        },
        {
          role: 'user',
          content: 'I want to begin my journey',
          ts: '2024-01-01T00:01:00.000Z'
        }
      ]
    };

    mockFetchJson.mockResolvedValueOnce(mockMessagesResponse);

    render(
      <BrowserRouter>
        <Routes>
          <Route path="/app/play/run/:storySlug/:characterSlug" element={<TestComponent />} />
        </Routes>
      </BrowserRouter>
    );

    const fetchButton = screen.getByText('Fetch Messages');
    fetchButton.click();

    await waitFor(() => {
      expect(screen.getByText('Welcome to the story!')).toBeInTheDocument();
      expect(screen.getByText('I want to begin my journey')).toBeInTheDocument();
      expect(screen.getByText('1. Begin your journey')).toBeInTheDocument();
      expect(screen.getByText('2. Learn more about the world')).toBeInTheDocument();
    });

    // Should not show empty state when messages exist
    expect(screen.queryByText('No messages yet. Your story will begin soon.')).not.toBeInTheDocument();
  });

  it('should handle session not found error gracefully', async () => {
    // Mock 404 error response
    const notFoundError = new Error('Session not found');
    (notFoundError as any).status = 404;
    (notFoundError as any).response = {
      error: 'SESSION_NOT_FOUND',
      message: 'The requested story session does not exist.'
    };

    mockFetchJson.mockRejectedValueOnce(notFoundError);

    render(
      <BrowserRouter>
        <Routes>
          <Route path="/app/play/run/:storySlug/:characterSlug" element={<TestComponent />} />
        </Routes>
      </BrowserRouter>
    );

    const fetchButton = screen.getByText('Fetch Messages');
    fetchButton.click();

    await waitFor(() => {
      expect(screen.getByText('No messages yet. Your story will begin soon.')).toBeInTheDocument();
    });

    // Should not show error for 404 (graceful fallback)
    expect(screen.queryByTestId('error')).not.toBeInTheDocument();
  });

  it('should handle server error gracefully', async () => {
    // Mock 500 error response
    const serverError = new Error('Internal Server Error');
    (serverError as any).status = 500;
    (serverError as any).response = {
      error: 'SERVER_ERROR',
      message: 'Internal Server Error'
    };

    mockFetchJson.mockRejectedValueOnce(serverError);

    render(
      <BrowserRouter>
        <Routes>
          <Route path="/app/play/run/:storySlug/:characterSlug" element={<TestComponent />} />
        </Routes>
      </BrowserRouter>
    );

    const fetchButton = screen.getByText('Fetch Messages');
    fetchButton.click();

    await waitFor(() => {
      expect(screen.getByText('No messages yet. Your story will begin soon.')).toBeInTheDocument();
    });

    // Should not show error for server errors (graceful fallback)
    expect(screen.queryByTestId('error')).not.toBeInTheDocument();
  });

  it('should handle malformed response gracefully', async () => {
    // Mock malformed response
    const malformedResponse = {
      sessionId: 'test-session-123'
      // Missing messages array
    };

    mockFetchJson.mockResolvedValueOnce(malformedResponse);

    render(
      <BrowserRouter>
        <Routes>
          <Route path="/app/play/run/:storySlug/:characterSlug" element={<TestComponent />} />
        </Routes>
      </BrowserRouter>
    );

    const fetchButton = screen.getByText('Fetch Messages');
    fetchButton.click();

    await waitFor(() => {
      expect(screen.getByText('No messages yet. Your story will begin soon.')).toBeInTheDocument();
    });

    // Should not show error for malformed responses
    expect(screen.queryByTestId('error')).not.toBeInTheDocument();
  });

  it('should handle loading state correctly', async () => {
    // Mock delayed response
    const mockMessagesResponse = {
      sessionId: 'test-session-123',
      messages: [
        {
          role: 'storyrunner',
          content: 'Welcome to the story!',
          ts: '2024-01-01T00:00:00.000Z'
        }
      ]
    };

    // Create a promise that resolves after a delay
    const delayedPromise = new Promise(resolve => {
      setTimeout(() => resolve(mockMessagesResponse), 100);
    });

    mockFetchJson.mockReturnValueOnce(delayedPromise);

    render(
      <BrowserRouter>
        <Routes>
          <Route path="/app/play/run/:storySlug/:characterSlug" element={<TestComponent />} />
        </Routes>
      </BrowserRouter>
    );

    const fetchButton = screen.getByText('Fetch Messages');
    fetchButton.click();

    // Should show loading state initially
    expect(screen.getByText('Loading...')).toBeInTheDocument();

    await waitFor(() => {
      expect(screen.getByText('Welcome to the story!')).toBeInTheDocument();
    });

    // Should not show loading state after completion
    expect(screen.queryByText('Loading...')).not.toBeInTheDocument();
  });

  it('should format message choices correctly', async () => {
    // Mock messages response with choices
    const mockMessagesResponse = {
      sessionId: 'test-session-123',
      messages: [
        {
          role: 'storyrunner',
          content: 'What would you like to do?',
          choices: ['Option 1', 'Option 2', 'Option 3'],
          ts: '2024-01-01T00:00:00.000Z'
        }
      ]
    };

    mockFetchJson.mockResolvedValueOnce(mockMessagesResponse);

    render(
      <BrowserRouter>
        <Routes>
          <Route path="/app/play/run/:storySlug/:characterSlug" element={<TestComponent />} />
        </Routes>
      </BrowserRouter>
    );

    const fetchButton = screen.getByText('Fetch Messages');
    fetchButton.click();

    await waitFor(() => {
      expect(screen.getByText('What would you like to do?')).toBeInTheDocument();
      expect(screen.getByText('1. Option 1')).toBeInTheDocument();
      expect(screen.getByText('2. Option 2')).toBeInTheDocument();
      expect(screen.getByText('3. Option 3')).toBeInTheDocument();
    });
  });
});
