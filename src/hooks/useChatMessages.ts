import { useState, useEffect, useCallback } from 'react';
import { fetchJson } from '../lib/http';
import { Message } from '../components/ui/chat';
import { StoryContext } from './useStoryRunner';

export interface ChatMessagesResponse {
  ok: boolean;
  messages: Array<{
    id: string;
    role: 'assistant' | 'user' | 'system';
    content: string;
    choices?: Array<{
      id: string;
      text: string;
    }>;
    metadata?: {
      chapter?: number;
      beat?: number;
      tokenUsage?: {
        prompt: number;
        completion: number;
        total: number;
      };
      latency?: number;
    };
    createdAt: string;
  }>;
  pagination: {
    total: number;
    limit: number;
    offset: number;
    hasMore: boolean;
  };
}

export interface TurnResponse {
  ok: boolean;
  sessionId: string;
  assistantMessage: {
    id: string;
    role: 'assistant';
    content: string;
    choices?: Array<{
      id: string;
      text: string;
    }>;
    metadata: {
      chapter: number;
      beat: number;
      tokenUsage: {
        prompt: number;
        completion: number;
        total: number;
      };
      latency: number;
    };
  };
  progress: {
    chapter: number;
    beat: number;
    completed: boolean;
  };
}

export const useChatMessages = (sessionId: string | null) => {
  const [messages, setMessages] = useState<Message[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isSending, setIsSending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Fetch messages for the session
  const fetchMessages = useCallback(async () => {
    if (!sessionId) return;

    setIsLoading(true);
    setError(null);

    try {
      const data = await fetchJson<{
        sessionId: string;
        messages: Array<{
          role: string;
          content: string;
          choices?: string[];
          ts: string;
        }>;
      }>(`/api/storyrunner/session/${sessionId}/messages`, {
        credentials: 'include'
      });

      if (!data || !Array.isArray(data.messages)) {
        console.warn('⚠️ No messages found, returning empty array.');
        setMessages([]);
        return;
      }

      const formattedMessages: Message[] = data.messages.map((msg, index) => ({
        id: `msg-${index}-${Date.now()}`,
        role: msg.role as 'assistant' | 'user' | 'system',
        content: msg.content,
        choices: msg.choices?.map((choice, choiceIndex) => ({
          id: `choice-${choiceIndex}`,
          text: choice
        })),
        metadata: msg.metadata ?? {
          chapter: 1,
          beat: index + 1,
          tokenUsage: { prompt: 0, completion: 0, total: 0 },
          latency: 0
        },
        createdAt: new Date(msg.ts)
      }));

      setMessages(formattedMessages);
    } catch (err) {
      console.error('Error fetching messages:', err);
      
      // Graceful fallback: return empty array instead of throwing
      console.warn('⚠️ Error fetching messages, returning empty array.');
      setMessages([]);
      setError(null); // Don't show error for empty message lists
    } finally {
      setIsLoading(false);
    }
  }, [sessionId]);

  // Send a message to the session
  const sendMessage = useCallback(async (userMessage: string, choiceId?: string, context?: StoryContext) => {
    if (!sessionId || !userMessage.trim()) return;

    setIsSending(true);
    setError(null);

    // Optimistic update: add user message immediately
    const userMessageObj: Message = {
      id: `temp-${Date.now()}`,
      role: 'user',
      content: userMessage,
      metadata: {
        chapter: 1,
        beat: 1,
        tokenUsage: { prompt: 0, completion: 0, total: 0 },
        latency: 0
      },
      createdAt: new Date()
    };

    setMessages(prev => [...prev, userMessageObj]);

    try {
      const requestBody: any = {
        sessionId,
        userMessage,
        choiceId,
        clientTurnId: `turn-${Date.now()}`
      };

      // Include context if provided
      if (context) {
        requestBody.context = context;
      }

      const response = await fetchJson<TurnResponse>('/api/storyrunner/turn', {
        method: 'POST',
        credentials: 'include',
        body: JSON.stringify(requestBody)
      });

      if (!response.ok) {
        throw new Error('Failed to send message');
      }

      // Add assistant response
      const assistantMessage: Message = {
        id: response.assistantMessage.id,
        role: 'assistant',
        content: response.assistantMessage.content,
        choices: response.assistantMessage.choices,
        metadata: response.assistantMessage.metadata ?? {
          chapter: 1,
          beat: (Date.now() % 1000),
          tokenUsage: { prompt: 0, completion: 0, total: 0 },
          latency: 0
        },
        createdAt: new Date()
      };

      setMessages(prev => [...prev, assistantMessage]);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to send message';
      setError(errorMessage);
      console.error('Error sending message:', err);
      
      // Remove the optimistic user message on error
      setMessages(prev => prev.filter(msg => msg.id !== userMessageObj.id));
    } finally {
      setIsSending(false);
    }
  }, [sessionId]);

  // Load messages when sessionId changes
  useEffect(() => {
    if (sessionId) {
      fetchMessages();
    } else {
      setMessages([]);
    }
  }, [sessionId, fetchMessages]);

  return {
    messages,
    sendMessage,
    fetchMessages,
    isLoading,
    isSending,
    error
  };
};
