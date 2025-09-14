// src/utils/prompt/generateChatGPTPromptFromTemplate.ts
// Utility to generate final ChatGPT prompt text from JSON template structure

export type StoryPromptTemplate = {
  brief: {
    whatsPlaible: string;
    howToPlay: string;
    roleOfStoryrunnerAI: string[]; // already split into bullet lines
  };
  storyEssentials: {
    title: string;
    author: string;
    publishedYear: number | null;
    publishedEra: string | null;
    category: string;
    subCategory?: string | null;
    genres: string[];
    headline?: string;
    description?: string;
    characters: Array<{
      id: string;
      name: string;
      summary?: string;
      hooks?: string[];
      role?: string; // already resolved by editor page; if missing, omit
    }>;
  };
  storyPersonalization: {
    selectedCharacterId: string;       // placeholder tokens like "Character_Selection"
    selectedCharacterName: string;     // same
    toneStyle: string;                  // e.g. "Tone_Selection"
    timeFlavor: string;                 // e.g. "Time_Selection"
  };
  guardrails: string[];
};

export type PromptGenerationResult = 
  | { ok: true; text: string }
  | { ok: false; error: string };

/**
 * Generates a final ChatGPT prompt text from a JSON template structure
 * @param template - Either a JSON string or parsed StoryPromptTemplate object
 * @returns PromptGenerationResult with generated text or error
 */
export function generateChatGPTPromptFromTemplate(template: string | StoryPromptTemplate): PromptGenerationResult {
  try {
    // Parse template if it's a string
    let parsedTemplate: StoryPromptTemplate;
    if (typeof template === 'string') {
      try {
        parsedTemplate = JSON.parse(template);
      } catch (parseError) {
        return { 
          ok: false, 
          error: `Invalid JSON template: ${parseError instanceof Error ? parseError.message : 'Unknown parse error'}` 
        };
      }
    } else {
      parsedTemplate = template;
    }

    // Validate required fields
    const validationError = validateTemplate(parsedTemplate);
    if (validationError) {
      return { ok: false, error: validationError };
    }

    // Generate the final prompt text
    const promptText = buildPromptText(parsedTemplate);
    
    return { ok: true, text: promptText };

  } catch (error) {
    return { 
      ok: false, 
      error: `Unexpected error generating prompt: ${error instanceof Error ? error.message : 'Unknown error'}` 
    };
  }
}

/**
 * Validates that the template has all required fields
 */
function validateTemplate(template: StoryPromptTemplate): string | null {
  if (!template.brief) return 'Missing brief section';
  if (!template.brief.whatsPlaible) return 'Missing brief.whatsPlaible';
  if (!template.brief.howToPlay) return 'Missing brief.howToPlay';
  if (!template.brief.roleOfStoryrunnerAI || !Array.isArray(template.brief.roleOfStoryrunnerAI)) {
    return 'Missing or invalid brief.roleOfStoryrunnerAI';
  }

  if (!template.storyEssentials) return 'Missing storyEssentials section';
  if (!template.storyEssentials.title) return 'Missing storyEssentials.title';
  if (!template.storyEssentials.author) return 'Missing storyEssentials.author';
  if (!template.storyEssentials.category) return 'Missing storyEssentials.category';

  if (!template.storyPersonalization) return 'Missing storyPersonalization section';
  if (!template.storyPersonalization.selectedCharacterId) return 'Missing storyPersonalization.selectedCharacterId';
  if (!template.storyPersonalization.toneStyle) return 'Missing storyPersonalization.toneStyle';
  if (!template.storyPersonalization.timeFlavor) return 'Missing storyPersonalization.timeFlavor';

  if (!template.guardrails || !Array.isArray(template.guardrails)) {
    return 'Missing or invalid guardrails array';
  }

  return null;
}

/**
 * Builds the final prompt text from the template
 */
function buildPromptText(template: StoryPromptTemplate): string {
  const sections: string[] = [];

  // 1. Role Assignment Section
  sections.push('# StoryRunner AI Role');
  sections.push('');
  sections.push('Your role as Plaible\'s StoryRunner AI:');
  template.brief.roleOfStoryrunnerAI.forEach(role => {
    sections.push(`• ${role}`);
  });
  sections.push('');

  // 2. What's Plaible Section
  sections.push('## About Plaible');
  sections.push(template.brief.whatsPlaible);
  sections.push('');

  // 3. How to Play Section
  sections.push('## How to Play');
  sections.push(template.brief.howToPlay);
  sections.push('');

  // 4. Story Essentials Section
  sections.push('## Story Essentials');
  sections.push(`**Title:** ${template.storyEssentials.title}`);
  sections.push(`**Author:** ${template.storyEssentials.author}`);
  
  if (template.storyEssentials.publishedYear) {
    sections.push(`**Published Year:** ${template.storyEssentials.publishedYear}`);
  }
  
  if (template.storyEssentials.publishedEra) {
    sections.push(`**Published Era:** ${template.storyEssentials.publishedEra}`);
  }
  
  sections.push(`**Category:** ${template.storyEssentials.category}`);
  
  if (template.storyEssentials.subCategory) {
    sections.push(`**Sub-Category:** ${template.storyEssentials.subCategory}`);
  }
  
  if (template.storyEssentials.genres && template.storyEssentials.genres.length > 0) {
    sections.push(`**Genres:** ${template.storyEssentials.genres.join(', ')}`);
  }
  
  if (template.storyEssentials.headline) {
    sections.push(`**Headline:** ${template.storyEssentials.headline}`);
  }
  
  if (template.storyEssentials.description) {
    sections.push(`**Description:** ${template.storyEssentials.description}`);
  }
  
  sections.push('');

  // 5. Characters Section
  if (template.storyEssentials.characters && template.storyEssentials.characters.length > 0) {
    sections.push('## Available Characters');
    template.storyEssentials.characters.forEach(character => {
      sections.push(`### ${character.name}`);
      if (character.role) {
        sections.push(`**Role:** ${character.role}`);
      }
      if (character.summary) {
        sections.push(`**Summary:** ${character.summary}`);
      }
      if (character.hooks && character.hooks.length > 0) {
        sections.push(`**Hooks:** ${character.hooks.join(', ')}`);
      }
      sections.push('');
    });
  }

  // 6. Player's Selections Section (with placeholders)
  sections.push('## Player\'s Selections');
  sections.push(`**Selected Character:** {${template.storyPersonalization.selectedCharacterName}}`);
  sections.push(`**Tone Style:** {${template.storyPersonalization.toneStyle}}`);
  sections.push(`**Time Flavor:** {${template.storyPersonalization.timeFlavor}}`);
  sections.push('');

  // 7. Guardrails Section
  if (template.guardrails && template.guardrails.length > 0) {
    sections.push('## Safety Guardrails');
    template.guardrails.forEach(guardrail => {
      sections.push(`• ${guardrail}`);
    });
    sections.push('');
  }

  // 8. Final Instructions
  sections.push('## Instructions');
  sections.push('Based on the player\'s selections above, create an engaging first chapter that:');
  sections.push('• Opens with a vivid scene that draws the player into the story');
  sections.push('• Reflects the selected tone style and time flavor');
  sections.push('• Allows the player to embody their chosen character');
  sections.push('• Ends with meaningful choices that drive the narrative forward');
  sections.push('• Maintains the story\'s core themes and atmosphere');
  sections.push('');
  sections.push('Remember to stay true to the original work while creating an interactive experience that feels fresh and engaging.');

  return sections.join('\n');
}
