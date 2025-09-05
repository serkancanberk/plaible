import OpenAI from 'openai';

// Strategy selection logic
function getProvider() {
  const provider = process.env.LLM_PROVIDER?.toLowerCase();
  const hasOpenAIKey = !!process.env.OPENAI_API_KEY;
  
  if (provider === 'openai' || (hasOpenAIKey && !provider)) {
    return 'openai';
  }
  return 'mock';
}

// Mock strategy - keeps current behavior
async function mockGenerateStart({ story, characterId, roleIds }) {
  const character = (story.characters || []).find(c => c.id === characterId);
  const characterName = character?.name || "You";
  const storyTitle = story.title || "Your Story";
  
  const text = `${characterName} in ${storyTitle}: The adventure begins. A new moment unfolds.`.slice(0, 240);
  const choicesPool = [
    "Investigate",
    "Wait and observe", 
    "Ask for help",
    "Take a bold step",
    "Hide and plan",
  ];
  const count = 2 + Math.floor(Math.random() * 3); // 2–4
  const choices = choicesPool.sort(() => 0.5 - Math.random()).slice(0, count);
  
  return { text, choices };
}

async function mockGenerateTurn({ story, session, chosen, freeText }) {
  const character = (story.characters || []).find(c => c.id === session.characterId);
  const characterName = character?.name || "You";
  const storyTitle = story.title || "Your Story";
  const lastContext = (session.log || []).slice(-1)[0]?.content || "the story continues";
  
  const text = `${characterName} in ${storyTitle}: ${lastContext}. A new moment unfolds.`.slice(0, 240);
  const choicesPool = [
    "Investigate",
    "Wait and observe",
    "Ask for help", 
    "Take a bold step",
    "Hide and plan",
  ];
  const count = 2 + Math.floor(Math.random() * 3); // 2–4
  const choices = choicesPool.sort(() => 0.5 - Math.random()).slice(0, count);
  
  return { text, choices };
}

// OpenAI strategy
async function openaiGenerateStart({ story, characterId, roleIds }) {
  const openai = new OpenAI({
    apiKey: process.env.OPENAI_API_KEY,
  });
  
  const character = (story.characters || []).find(c => c.id === characterId);
  const characterName = character?.name || "You";
  const storyTitle = story.title || "Your Story";
  
  const systemPrompt = story.storyrunner?.systemPrompt || "You are a creative story assistant. Keep responses concise and engaging.";
  const guardrails = story.storyrunner?.guardrails || [];
  
  const userPrompt = `Start a new scene for ${characterName} in "${storyTitle}". Create an engaging opening scene with 2-4 meaningful choices. Keep the scene text under 200 characters and make choices short and clear.`;
  
  const messages = [
    { role: "system", content: systemPrompt },
    { role: "user", content: userPrompt }
  ];
  
  if (guardrails.length > 0) {
    messages.push({ role: "system", content: `Guardrails: ${guardrails.join(', ')}` });
  }
  
  try {
    const completion = await openai.chat.completions.create({
      model: process.env.OPENAI_MODEL || "gpt-4o-mini",
      messages,
      max_tokens: 300,
      temperature: 0.8,
    });
    
    const response = completion.choices[0]?.message?.content || "";
    
    // Parse response to extract text and choices
    const lines = response.split('\n').filter(line => line.trim());
    let text = "";
    const choices = [];
    
    for (const line of lines) {
      const trimmed = line.trim();
      if (trimmed && !choices.length && !text) {
        text = trimmed.slice(0, 240);
      } else if (trimmed && (trimmed.startsWith('-') || trimmed.startsWith('•') || trimmed.match(/^\d+\./))) {
        const choice = trimmed.replace(/^[-•\d.\s]+/, '').trim();
        if (choice && choices.length < 4) {
          choices.push(choice);
        }
      }
    }
    
    // Fallback if parsing failed
    if (!text) {
      text = response.slice(0, 240);
    }
    if (choices.length < 2) {
      choices.push("Continue", "Explore", "Wait", "Act");
    }
    
    return { text, choices: choices.slice(0, 4) };
  } catch (error) {
    console.error("OpenAI API error:", error);
    // Fallback to mock on error
    return mockGenerateStart({ story, characterId, roleIds });
  }
}

async function openaiGenerateTurn({ story, session, chosen, freeText }) {
  const openai = new OpenAI({
    apiKey: process.env.OPENAI_API_KEY,
  });
  
  const character = (story.characters || []).find(c => c.id === session.characterId);
  const characterName = character?.name || "You";
  const storyTitle = story.title || "Your Story";
  
  const systemPrompt = story.storyrunner?.systemPrompt || "You are a creative story assistant. Keep responses concise and engaging.";
  const guardrails = story.storyrunner?.guardrails || [];
  
  // Build context from last few log entries
  const recentLogs = (session.log || []).slice(-4);
  const context = recentLogs.map(entry => {
    if (entry.role === 'user') {
      return `User: ${entry.chosen || entry.content || ''}`;
    } else if (entry.role === 'storyrunner') {
      return `Story: ${entry.content || ''}`;
    }
    return '';
  }).filter(Boolean).join('\n');
  
  const userAction = chosen || freeText || "continue";
  const userPrompt = `Continue the story for ${characterName} in "${storyTitle}". 

Previous context:
${context}

User action: ${userAction}

Create the next scene with 2-4 meaningful choices. Keep the scene text under 200 characters and make choices short and clear.`;
  
  const messages = [
    { role: "system", content: systemPrompt },
    { role: "user", content: userPrompt }
  ];
  
  if (guardrails.length > 0) {
    messages.push({ role: "system", content: `Guardrails: ${guardrails.join(', ')}` });
  }
  
  try {
    const completion = await openai.chat.completions.create({
      model: process.env.OPENAI_MODEL || "gpt-4o-mini",
      messages,
      max_tokens: 300,
      temperature: 0.8,
    });
    
    const response = completion.choices[0]?.message?.content || "";
    
    // Parse response to extract text and choices
    const lines = response.split('\n').filter(line => line.trim());
    let text = "";
    const choices = [];
    
    for (const line of lines) {
      const trimmed = line.trim();
      if (trimmed && !choices.length && !text) {
        text = trimmed.slice(0, 240);
      } else if (trimmed && (trimmed.startsWith('-') || trimmed.startsWith('•') || trimmed.match(/^\d+\./))) {
        const choice = trimmed.replace(/^[-•\d.\s]+/, '').trim();
        if (choice && choices.length < 4) {
          choices.push(choice);
        }
      }
    }
    
    // Fallback if parsing failed
    if (!text) {
      text = response.slice(0, 240);
    }
    if (choices.length < 2) {
      choices.push("Continue", "Explore", "Wait", "Act");
    }
    
    return { text, choices: choices.slice(0, 4) };
  } catch (error) {
    console.error("OpenAI API error:", error);
    // Fallback to mock on error
    return mockGenerateTurn({ story, session, chosen, freeText });
  }
}

// Main export functions
export async function generateStart({ story, characterId, roleIds }) {
  const provider = getProvider();
  
  if (provider === 'openai') {
    return openaiGenerateStart({ story, characterId, roleIds });
  } else {
    return mockGenerateStart({ story, characterId, roleIds });
  }
}

export async function generateTurn({ story, session, chosen, freeText }) {
  const provider = getProvider();
  
  if (provider === 'openai') {
    return openaiGenerateTurn({ story, session, chosen, freeText });
  } else {
    return mockGenerateTurn({ story, session, chosen, freeText });
  }
}
