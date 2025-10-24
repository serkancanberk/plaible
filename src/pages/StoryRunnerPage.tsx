import React, { useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { handleAddBalanceNavigation } from '../utils/navigation';
import { ChatContainer, ChatInput, TypingIndicator } from '../components/ui/chat';
import PlayChatHeader from '../components/ui/chat/PlayChatHeader';
import { useStorySession } from '../hooks/useStorySession';
import { useChatMessages } from '../hooks/useChatMessages';
import { useStoryRunner, StoryContext } from '../hooks/useStoryRunner';
import { useStorySettingsContext } from '../components/ui/storySettings/StorySettingsProvider';
import { AuthGuard } from '../components/AuthGuard';
import { CreditsPurchaseSection } from '../components/credits/CreditsPurchaseSection';
import { useAuth } from '../hooks/useAuth';

const StoryRunnerPage: React.FC = () => {
  const { storySlug, characterSlug } = useParams<{ storySlug: string; characterSlug: string }>();
  const navigate = useNavigate();
  const { selectedToneStyle, selectedTimeFlavor } = useStorySettingsContext();
  const { user, refreshUser, refreshSessions } = useAuth();

  const handlePurchase = (packageId: string) => {
    console.log('[STORY_RUNNER][PURCHASE] Package selected:', packageId);
    // TODO: Implement purchase flow (Stripe/PayPal integration)
  };
  
  // Session management
  const { session, isReady, startSession, isLoading: isSessionLoading, error: sessionError, instanceIdRef } = useStorySession();
  console.log('[STORY_RUNNER][SESSION_STATE]', session);
  React.useEffect(() => {
    if (isReady) {
      console.log('[STORY_RUNNER][SESSION_READY]', {
        story: session?.story?.title,
        character: session?.story?.character?.displayName || session?.story?.character?.name,
      });
    }
  }, [isReady, session]);
  
  // Message management
  const { messages, sendMessage, isSending, error: messageError } = useChatMessages(session?.sessionId || null);
  
  // Story runner with context
  const { processTurn, isProcessing, error: runnerError } = useStoryRunner();

  // Local UI state
  const [headerMenuOpen, setHeaderMenuOpen] = React.useState(false);
  const [chatScrollEl, setChatScrollEl] = React.useState<HTMLDivElement | null>(null);

  // Last assistant message (robust across environments)
  const lastAssistantMessage = React.useMemo(() => {
    const list = messages || [];
    for (let i = list.length - 1; i >= 0; i--) {
      if (list[i]?.role === 'assistant') return list[i];
    }
    return null;
  }, [messages]);

  // Debug selected settings readiness
  React.useEffect(() => {
    console.log('[StoryRunnerPage] settings', {
      hasTone: !!selectedToneStyle,
      hasTime: !!selectedTimeFlavor,
      tone: selectedToneStyle?.displayLabel,
      time: selectedTimeFlavor?.displayLabel,
    });
  }, [selectedToneStyle, selectedTimeFlavor]);

  // Structured data diagnostics for header binding (does not report readiness)
  React.useEffect(() => {
    try {
      try {
        console.log('[STORY_RUNNER][HOOK_REF]', {
          instance: instanceIdRef?.current,
          sessionPresent: !!session,
        });
      } catch {}
      console.log('[STORY_RUNNER_DATA]', {
        session: session ? Object.keys(session) : 'no session',
        story: session?.story || 'no story',
        character: session?.story?.character || 'no character',
        tone: selectedToneStyle || 'no tone',
        time: selectedTimeFlavor || 'no time',
        user: user || 'no user',
        lastAssistantMsg: lastAssistantMessage || 'no assistant messages',
      });
    } catch (e) {
      console.warn('[STORY_RUNNER_REPORT_ERROR]', e);
    }
  }, [session, selectedToneStyle, selectedTimeFlavor, user, lastAssistantMessage]);

  // Readiness report strictly tied to session state changes
  React.useEffect(() => {
    if (!session) return;
    try {
      const report = {
        sessionReady: !!session,
        storyReady: !!session?.story,
        characterReady: !!session?.story?.character,
      } as const;

      console.log('[STORY_RUNNER_REPORT]', {
        '✅ loaded': Object.entries(report).filter(([_, v]) => v).map(([k]) => k),
        '⚠️ missing': Object.entries(report).filter(([_, v]) => !v).map(([k]) => k),
      });

      console.info(
        '[STORY_RUNNER_STATUS]',
        `${session?.story?.title || 'Untitled'} | ${session?.story?.character?.displayName || session?.story?.character?.name || 'Unknown'}`
      );
    } catch (e) {
      console.warn('[STORY_RUNNER_REPORT_ERROR]', e);
    }
  }, [session]);

  // Initialize session on page load
  useEffect(() => {
    if (!session && storySlug && characterSlug && selectedToneStyle && selectedTimeFlavor) {
      startSession().then(() => {
        // Ensure Recent list reflects current session
        try {
          if (typeof (window as any).requestIdleCallback === 'function') {
            (window as any).requestIdleCallback(() => {
              if (refreshSessions) {
                refreshSessions().then(() => console.log('[RECENT_REFRESH_TRIGGERED] after startSession'));
              } else if (refreshUser) {
                refreshUser();
              }
            });
          } else {
            setTimeout(() => {
              if (refreshSessions) {
                refreshSessions().then(() => console.log('[RECENT_REFRESH_TRIGGERED] after startSession'));
              } else if (refreshUser) {
                refreshUser();
              }
            }, 0);
          }
        } catch {}
      }).catch(error => {
        console.error('Failed to start session:', error);
      });
    }
  }, [session, storySlug, characterSlug, selectedToneStyle, selectedTimeFlavor, startSession, refreshSessions, refreshUser]);

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
        <div className="flex flex-col items-start justify-center h-full text-left">
          <CreditsPurchaseSection 
            variant="story-paused"
            onPurchase={handlePurchase}
          />
        </div>
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

        {/* Scroll region with overlay header */}
        {isReady && (
          <div className="flex-1 flex flex-col min-h-0 relative">
            {/* Dynamic header (always visible; no smart visibility yet) */}
            <PlayChatHeader
              characterName={session?.story?.character?.displayName ?? session?.story?.character?.name ?? 'Unknown Character'}
              storyName={session?.story?.title ?? 'Untitled'}
              timeInfo={selectedTimeFlavor?.displayLabel ?? '—'}
              toneInfo={selectedToneStyle?.displayLabel ?? '—'}
              sceneInfo={(messages || []).filter(m => m.role === 'assistant').slice(-1)[0]?.metadata || null}
              playerInfo={user?.identity?.displayName ?? user?.email ?? ''}
              onOpenMenu={() => setHeaderMenuOpen(true)}
              scrollElement={chatScrollEl || null}
              className="absolute top-0 left-0 right-0 z-70"
            />

            {/* Chat Container */}
            <div className="flex-1 flex flex-col min-h-0 pt-16">
              <ChatContainer 
                messages={messages}
                isLoading={isSending || isProcessing}
                onChoiceSelect={handleChoiceSelect}
                className="flex-1"
                onContainerRef={setChatScrollEl}
              />
              
              {/* Typing Indicator */}
              {(isSending || isProcessing) && (
                <div className="px-spacing-md py-spacing-sm">
                  <TypingIndicator isVisible={isSending || isProcessing} />
                </div>
              )}
            </div>
          </div>
        )}

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
