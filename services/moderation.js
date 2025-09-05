import OpenAI from 'openai';

// Simple heuristic fallback for content moderation
function heuristicModeration(text) {
  if (!text || typeof text !== 'string') {
    return { allowed: true };
  }
  
  const lowerText = text.toLowerCase();
  
  // Block obvious violent/graphic content
  const violentTerms = [
    'kill', 'murder', 'violence', 'blood', 'gore', 'torture', 'rape',
    'suicide', 'self-harm', 'bomb', 'weapon', 'gun', 'knife'
  ];
  
  // Block explicit sexual content
  const sexualTerms = [
    'sex', 'porn', 'nude', 'naked', 'fuck', 'shit', 'bitch', 'whore'
  ];
  
  // Block hate speech
  const hateTerms = [
    'hate', 'racist', 'nazi', 'terrorist', 'bomb', 'attack'
  ];
  
  const allBlockedTerms = [...violentTerms, ...sexualTerms, ...hateTerms];
  
  for (const term of allBlockedTerms) {
    if (lowerText.includes(term)) {
      return { 
        allowed: false, 
        reason: `Content contains potentially inappropriate language: ${term}` 
      };
    }
  }
  
  return { allowed: true };
}

// OpenAI moderation
async function openaiModeration(text) {
  if (!text || typeof text !== 'string') {
    return { allowed: true };
  }
  
  const openai = new OpenAI({
    apiKey: process.env.OPENAI_API_KEY,
  });
  
  try {
    const response = await openai.moderations.create({
      input: text,
    });
    
    const result = response.results[0];
    
    if (result.flagged) {
      const categories = Object.entries(result.categories)
        .filter(([_, flagged]) => flagged)
        .map(([category, _]) => category);
      
      return {
        allowed: false,
        reason: `Content flagged for: ${categories.join(', ')}`
      };
    }
    
    return { allowed: true };
  } catch (error) {
    console.error("OpenAI moderation error:", error);
    // Fallback to heuristic on API error
    return heuristicModeration(text);
  }
}

// Main moderation function
export async function moderateUserText(text) {
  const moderationEnabled = process.env.MODERATION_ENABLED === 'true';
  const hasOpenAIKey = !!process.env.OPENAI_API_KEY;
  
  // If moderation is disabled, always allow
  if (!moderationEnabled) {
    return { allowed: true };
  }
  
  // If OpenAI key exists and moderation is enabled, use OpenAI
  if (hasOpenAIKey && moderationEnabled) {
    return openaiModeration(text);
  }
  
  // Otherwise use heuristic fallback
  return heuristicModeration(text);
}
