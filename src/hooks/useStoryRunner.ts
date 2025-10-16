import { useState, useCallback } from 'react';
import { fetchJson } from '../lib/http';

export interface StoryContext {
  story: {
    title: string;
    storyrunner?: {
      storyPrompt?: string;
    };
  };
  character: {
    name: string;
    displayName: string;
  };
  toneStyle: {
    id: string;
    label: string;
  };
  timeFlavor: {
    id: string;
    label: string;
  };
}

export interface SystemPromptResult {
  systemPrompt: string;
  contextPayload: {
    storyTitle: string;
    characterName: string;
    toneStyle: string;
    timeFlavor: string;
    storyPrompt: string;
  };
}

export interface StoryRunnerResponse {
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

export interface TurnParams {
  sessionId: string;
  userMessage: string;
  choiceId?: string;
  clientTurnId?: string;
  context?: StoryContext;
}

export const useStoryRunner = () => {
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const buildSystemPrompt = useCallback((context: StoryContext): SystemPromptResult => {
    const { story, character, toneStyle, timeFlavor } = context;
    
    const systemPrompt = `You are the StoryRunner AI guiding the player through "${story.title}".
The player is acting as "${character.name}", within a "${toneStyle.label}" tone and "${timeFlavor.label}" time setting.

${story.storyrunner?.storyPrompt || 'Create an engaging interactive story experience.'}

Use narrative beats and provide choices for progression. Maintain the ${toneStyle.label} tone throughout the story.

Output JSON format:
{
  "chapter": number,
  "beat": number,
  "content": string,
  "choices": [{ "id": string, "text": string }]
}`;

    const contextPayload = {
      storyTitle: story.title,
      characterName: character.name,
      toneStyle: toneStyle.label,
      timeFlavor: timeFlavor.label,
      storyPrompt: story.storyrunner?.storyPrompt || ''
    };

    return {
      systemPrompt,
      contextPayload
    };
  }, []);

  const parseGPTResponse = useCallback((content: string) => {
    try {
      // Try to parse JSON response
      const parsed = JSON.parse(content);
      
      // Validate required fields
      if (typeof parsed.chapter !== 'number' || 
          typeof parsed.beat !== 'number' || 
          typeof parsed.content !== 'string') {
        throw new Error('Invalid response format');
      }

      // Ensure choices array exists and is properly formatted
      const choices = Array.isArray(parsed.choices) 
        ? parsed.choices.map((choice: any, index: number) => ({
            id: choice.id || `choice_${index}`,
            text: choice.text || choice
          }))
        : [];

      return {
        chapter: parsed.chapter,
        beat: parsed.beat,
        content: parsed.content,
        choices
      };
    } catch (error) {
      console.warn('Failed to parse GPT response as JSON, using fallback:', error);
      
      // Fallback: treat entire content as story text
      return {
        chapter: 1,
        beat: 1,
        content: content,
        choices: ['Continue', 'Explore', 'Ask questions']
      };
    }
  }, []);

  const processTurn = useCallback(async (params: TurnParams): Promise<StoryRunnerResponse | null> => {
    setIsProcessing(true);
    setError(null);

    try {
      // Build system prompt if context is provided
      let systemPromptData: SystemPromptResult | null = null;
      if (params.context) {
        systemPromptData = buildSystemPrompt(params.context);
      }

      const requestBody: any = {
        sessionId: params.sessionId,
        userMessage: params.userMessage,
        choiceId: params.choiceId,
        clientTurnId: params.clientTurnId || `turn-${Date.now()}`
      };

      // Include context data if available
      if (systemPromptData) {
        requestBody.context = systemPromptData.contextPayload;
        requestBody.systemPrompt = systemPromptData.systemPrompt;
      }

      const response = await fetchJson<StoryRunnerResponse>('/api/storyrunner/turn', {
        method: 'POST',
        credentials: 'include',
        body: JSON.stringify(requestBody)
      });

      if (!response.ok) {
        throw new Error('Failed to process turn');
      }

      // Parse and validate the response
      const parsedResponse = parseGPTResponse(response.assistantMessage.content);
      
      // Update response with parsed data
      const enhancedResponse: StoryRunnerResponse = {
        ...response,
        assistantMessage: {
          ...response.assistantMessage,
          content: parsedResponse.content,
          choices: parsedResponse.choices,
          metadata: {
            ...response.assistantMessage.metadata,
            chapter: parsedResponse.chapter,
            beat: parsedResponse.beat
          }
        },
        progress: {
          ...response.progress,
          chapter: parsedResponse.chapter,
          beat: parsedResponse.beat
        }
      };

      return enhancedResponse;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to process turn';
      setError(errorMessage);
      console.error('Error processing turn:', err);
      return null;
    } finally {
      setIsProcessing(false);
    }
  }, [buildSystemPrompt, parseGPTResponse]);

  const clearError = useCallback(() => {
    setError(null);
  }, []);

  return {
    buildSystemPrompt,
    processTurn,
    isProcessing,
    error,
    clearError
  };
};
