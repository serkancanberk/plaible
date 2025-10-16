import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import { StoryRunnerPage } from '../pages/StoryRunnerPage';
import { StorySettingsProvider } from '../components/ui/storySettings/StorySettingsProvider';

// Mock the hooks
jest.mock('../hooks/useStorySession', () => ({
  useStorySession: () => ({
    session: {
      sessionId: 'test-session',
      story: {
        title: 'Test Story',
        character: {
          name: 'Test Character',
          displayName: 'Test Character'
        },
        storyrunner: {
          storyPrompt: 'You are a creative storyteller.'
        }
      },
      settings: {
        toneStyle: 'original',
        timeFlavor: 'original'
      }
    },
    startSession: jest.fn(),
    isLoading: false,
    error: null
  })
}));

jest.mock('../hooks/useChatMessages', () => ({
  useChatMessages: () => ({
    messages: [
      {
        id: '1',
        role: 'assistant',
        content: 'Welcome to the story!',
        choices: [
          { id: 'choice_1', text: 'Begin adventure' },
          { id: 'choice_2', text: 'Explore surroundings' }
        ],
        metadata: {
          chapter: 1,
          beat: 1,
          tokenUsage: { prompt: 10, completion: 5, total: 15 },
          latency: 1000
        },
        createdAt: new Date()
      }
    ],
    sendMessage: jest.fn(),
    isLoading: false,
    isSending: false,
    error: null
  })
}));

jest.mock('../hooks/useStoryRunner', () => ({
  useStoryRunner: () => ({
    buildSystemPrompt: jest.fn(),
    processTurn: jest.fn(),
    isProcessing: false,
    error: null,
    clearError: jest.fn()
  })
}));

// Mock router
jest.mock('react-router-dom', () => ({
  useParams: () => ({
    storySlug: 'test-story',
    characterSlug: 'test-character'
  }),
  useNavigate: () => jest.fn()
}));

// Mock AppGridLayout
jest.mock('../layouts/AppGridLayout', () => ({
  AppGridLayout: ({ children }: { children: React.ReactNode }) => <div data-testid="app-grid-layout">{children}</div>
}));

describe('StoryContext Integration', () => {
  it('renders story context components correctly', async () => {
    render(
      <StorySettingsProvider>
        <StoryRunnerPage />
      </StorySettingsProvider>
    );

    await waitFor(() => {
      expect(screen.getByText('In the Scene')).toBeInTheDocument();
      expect(screen.getByText(/Playing as Test Character/)).toBeInTheDocument();
      expect(screen.getByText(/Original theme/)).toBeInTheDocument();
      expect(screen.getByText(/Original time/)).toBeInTheDocument();
    });
  });

  it('renders character status component', async () => {
    render(
      <StorySettingsProvider>
        <StoryRunnerPage />
      </StorySettingsProvider>
    );

    await waitFor(() => {
      expect(screen.getByText('🎭 Alignment: Temptation')).toBeInTheDocument();
      expect(screen.getByText('🤝 Relationships: +Trust')).toBeInTheDocument();
      expect(screen.getByText('⏳ Progress: Chapter 3 of 6')).toBeInTheDocument();
    });
  });

  it('displays messages with enhanced choices', async () => {
    render(
      <StorySettingsProvider>
        <StoryRunnerPage />
      </StorySettingsProvider>
    );

    await waitFor(() => {
      expect(screen.getByText('Welcome to the story!')).toBeInTheDocument();
      expect(screen.getByText('1. Begin adventure')).toBeInTheDocument();
      expect(screen.getByText('2. Explore surroundings')).toBeInTheDocument();
    });
  });

  it('shows metadata in messages', async () => {
    render(
      <StorySettingsProvider>
        <StoryRunnerPage />
      </StorySettingsProvider>
    );

    await waitFor(() => {
      expect(screen.getByText('Chapter 1')).toBeInTheDocument();
      expect(screen.getByText('Beat 1')).toBeInTheDocument();
    });
  });
});
