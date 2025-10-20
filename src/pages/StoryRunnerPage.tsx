import React, { useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { handleAddBalanceNavigation } from '../utils/navigation';
import { ChatContainer, ChatInput, TypingIndicator, StoryHeader, CharacterStatus } from '../components/ui/chat';
import { useStorySession } from '../hooks/useStorySession';
import { useChatMessages } from '../hooks/useChatMessages';
import { useStoryRunner, StoryContext } from '../hooks/useStoryRunner';
import { useStorySettingsContext } from '../components/ui/storySettings/StorySettingsProvider';
import { AuthGuard } from '../components/AuthGuard';
import StoryPaymentPrompt from '../components/StoryPaymentPrompt';

const StoryRunnerPage: React.FC = () => {
  const { storySlug, characterSlug } = useParams<{ storySlug: string; characterSlug: string }>();
  const navigate = useNavigate();
  const { selectedToneStyle, selectedTimeFlavor } = useStorySettingsContext();
  
  // Session management
  const { session, startSession, isLoading: isSessionLoading, error: sessionError } = useStorySession();
  
  // Message management
  const { messages, sendMessage, isSending, error: messageError } = useChatMessages(session?.sessionId || null);
  
  // Story runner with context
  const { processTurn, isProcessing, error: runnerError } = useStoryRunner();

  // Initialize session on page load
  useEffect(() => {
    if (!session && storySlug && characterSlug && selectedToneStyle && selectedTimeFlavor) {
      startSession().catch(error => {
        console.error('Failed to start session:', error);
      });
    }
  }, [session, storySlug, characterSlug, selectedToneStyle, selectedTimeFlavor, startSession]);

  // Build story context for enhanced prompts
  const buildStoryContext = (): StoryContext | null => {
    if (!session || !selectedToneStyle || !selectedTimeFlavor) return null;
    
    return {
      story: {
        title: session.story.title,
        storyrunner: {
          storyPrompt: (session.story as any).storyrunner?.storyPrompt
        }
      },
      character: {
        name: session.story.character.name,
        displayName: session.story.character.displayName
      },
      toneStyle: {
        id: selectedToneStyle.id,
        label: selectedToneStyle.displayLabel
      },
      timeFlavor: {
        id: selectedTimeFlavor.id,
        label: selectedTimeFlavor.displayLabel
      }
    };
  };

  const handleSendMessage = async (message: string) => {
    if (!message.trim() || !session) return;
    
    try {
      const context = buildStoryContext();
      await sendMessage(message, undefined, context || undefined);
    } catch (error) {
      console.error('Failed to send message:', error);
    }
  };

  const handleChoiceSelect = async (choice: string, index: number) => {
    if (!session) return;
    
    try {
      const context = buildStoryContext();
      await sendMessage(`I choose: ${choice}`, `choice_${index}`, context || undefined);
    } catch (error) {
      console.error('Failed to send choice:', error);
    }
  };

  // Show loading state while session is being created
  if (isSessionLoading) {
    return (
      <div className="flex flex-1 min-h-0 flex-col bg-secondary">
        <div className="flex-1 flex items-center justify-center">
          <div className="text-body text-text-secondary">Starting your story session...</div>
        </div>
      </div>
    );
  }

  // Show payment prompt for HTTP 402 errors
  if (sessionError && (sessionError.includes('402') || sessionError.includes('PAYMENT') || sessionError.includes('INSUFFICIENT_CREDITS'))) {
    return (
      <div className="flex flex-1 min-h-0 flex-col bg-secondary">
        <StoryPaymentPrompt
          onAddCredits={() => {
            // Navigate to packages page for credits purchase using shared helper
            handleAddBalanceNavigation(navigate, 'story-runner');
          }}
          onTryAgain={() => {
            if (storySlug && characterSlug && selectedToneStyle && selectedTimeFlavor) {
              startSession().catch(error => {
                console.error('Failed to retry session:', error);
              });
            }
          }}
        />
      </div>
    );
  }

  // Show message error if it exists
  const hasError = sessionError || messageError || runnerError;
  const errorMessage = sessionError || messageError || runnerError;

  return (
    <AuthGuard>
      <div className="flex flex-1 min-h-0 flex-col bg-secondary">
        {/* Error Alert */}
        {hasError && (
          <div className="text-center mt-spacing-lg">
            <div className="text-body text-text-secondary mb-spacing-sm">
              {sessionError?.includes("401")
                ? "Session expired. Please sign in again."
                : "Failed to start story session."}
            </div>
            <button
              className="text-accent hover:underline"
              onClick={
                sessionError?.includes("401")
                  ? () => (window.location.href = "/login")
                  : () => {
                      if (storySlug && characterSlug && selectedToneStyle && selectedTimeFlavor) {
                        startSession().catch(error => {
                          console.error('Failed to retry session:', error);
                        });
                      }
                    }
              }
            >
              {sessionError?.includes("401") ? "Go to Login" : "Try again"}
            </button>
          </div>
        )}

        {/* Story Header */}
        <div className="px-spacing-md py-spacing-sm border-b border-ui-muted">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-spacing-sm">
              <div className="w-2 h-2 bg-accent rounded-full"></div>
              <h1 className="text-subheading font-serif text-accent">
                {session?.story.title || 'Loading Story...'}
              </h1>
            </div>
            <div className="flex items-center space-x-spacing-md">
              <button 
                onClick={() => navigate(-1)}
                className="text-caption text-text-tertiary hover:text-text-secondary transition-colors"
              >
                Back
              </button>
              <button className="text-caption text-text-tertiary hover:text-text-secondary transition-colors">
                Search
              </button>
              <button className="text-caption text-text-tertiary hover:text-text-secondary transition-colors">
                Share
              </button>
              <button className="text-caption text-text-tertiary hover:text-text-secondary transition-colors">
                ⋯
              </button>
            </div>
          </div>
        </div>

        {/* Story Context Header */}
        {session && selectedToneStyle && selectedTimeFlavor && (
          <div className="px-spacing-md py-spacing-sm border-b border-ui-muted">
            <StoryHeader
              story={session.story}
              character={session.story.character}
              toneStyle={{
                id: selectedToneStyle.id,
                label: selectedToneStyle.displayLabel
              }}
              timeFlavor={{
                id: selectedTimeFlavor.id,
                label: selectedTimeFlavor.displayLabel
              }}
            />
          </div>
        )}

        {/* Character Status */}
        {session && (
          <div className="px-spacing-md py-spacing-sm border-b border-ui-muted">
            <CharacterStatus 
              alignment="Temptation"
              relationshipHint="+Trust"
              progress="Chapter 3 of 6"
            />
          </div>
        )}

        {/* Chat Container */}
        <div className="flex-1 flex flex-col min-h-0">
          <ChatContainer 
            messages={messages}
            isLoading={isSending || isProcessing}
            onChoiceSelect={handleChoiceSelect}
            className="flex-1"
          />
          
          {/* Typing Indicator */}
          {(isSending || isProcessing) && (
            <div className="px-spacing-md py-spacing-sm">
              <TypingIndicator isVisible={isSending || isProcessing} />
            </div>
          )}
        </div>

        {/* Chat Input */}
        <ChatInput
          onSendMessage={handleSendMessage}
          disabled={isSending || isProcessing || !session}
          placeholder={session ? "Type your answer here" : "Starting session..."}
        />
      </div>
    </AuthGuard>
  );
};

export default StoryRunnerPage;
