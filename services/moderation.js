// Moderation Service with safe fallbacks
// Never throws - always returns safe { ok: true/false, code? }

// Simple local ruleset for basic content filtering
function localModeration(text) {
  if (!text || typeof text !== 'string') {
    return { ok: true };
  }
  
  const lowerText = text.toLowerCase();
  
  // Very small set of obvious violations
  const blockedTerms = [
    'kill yourself',
    'suicide',
    'rape',
    'child porn',
    'nazi',
    'terrorist attack',
    'bomb threat'
  ];
  
  for (const term of blockedTerms) {
    if (lowerText.includes(term)) {
      return { 
        ok: false, 
        code: "MODERATION_BLOCKED" 
      };
    }
  }
  
  return { ok: true };
}

// OpenAI moderation with timeout and fallback
async function openaiModeration(text) {
  try {
    if (!text || typeof text !== 'string') {
      return { ok: true };
    }
    
    // Dynamic import to avoid loading OpenAI if not needed
    const { default: OpenAI } = await import('openai');
    
    const openai = new OpenAI({
      apiKey: process.env.OPENAI_API_KEY,
      baseURL: process.env.OPENAI_BASE_URL,
    });
    
    // 8 second timeout for moderation
    const timeoutPromise = new Promise((_, reject) => 
      setTimeout(() => reject(new Error('Moderation timeout')), 8000)
    );
    
    const moderationPromise = openai.moderations.create({
      input: text,
    });
    
    const response = await Promise.race([moderationPromise, timeoutPromise]);
    const result = response.results[0];
    
    if (result.flagged) {
      const categories = Object.entries(result.categories)
        .filter(([_, flagged]) => flagged)
        .map(([category, _]) => category);
      
      // Only block on serious violations
      const seriousCategories = ['sexual/minors', 'hate', 'violence/graphic', 'self-harm'];
      const hasSeriousViolation = categories.some(cat => seriousCategories.includes(cat));
      
      if (hasSeriousViolation) {
        return {
          ok: false,
          code: "MODERATION_BLOCKED"
        };
      }
    }
    
    return { ok: true };
  } catch (error) {
    console.error("OpenAI moderation error:", error.message);
    // Fallback to local moderation
    return localModeration(text);
  }
}

// Main moderation function
export async function moderateUserInput(text) {
  const moderationEnabled = process.env.MODERATION_ENABLED !== 'false';
  const hasOpenAIKey = !!process.env.OPENAI_API_KEY;
  const provider = process.env.MODERATION_PROVIDER?.toLowerCase() || 'openai';
  
  // If moderation is disabled, always allow
  if (!moderationEnabled) {
    return { ok: true };
  }
  
  // If OpenAI key exists and provider is openai, use OpenAI
  if (hasOpenAIKey && provider === 'openai') {
    return openaiModeration(text);
  }
  
  // Otherwise use local moderation
  return localModeration(text);
}