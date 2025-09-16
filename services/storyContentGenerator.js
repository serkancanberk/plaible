// Story Content Generator Service
// Integrates with existing LLM provider for GPT-based story generation
// Provides fallback to mock content if GPT fails

import { selectProvider } from './llmProvider.js';

/**
 * Main orchestrator function that calls GPT or fallback
 * @param {Object} minimalData - Required minimal story data
 * @param {string} minimalData.title - Story title
 * @param {string} minimalData.authorName - Author name
 * @param {number} minimalData.publishedYear - Publication year
 * @param {string} minimalData.mainCategory - Main category (book, story, biography)
 * @returns {Promise<Object>} Generated story content
 */
export async function generateStoryContent(minimalData) {
  let result;
  
  try {
    console.log("🎭 Starting story content generation for:", minimalData.title);
    
    // Try GPT first
    const gptResult = await generateStoryWithGPT(minimalData);
    if (gptResult) {
      console.log("✅ GPT generation successful");
      result = gptResult;
    }
  } catch (error) {
    console.log("⚠️ OpenAI not available, skipping GPT generation");
  }
  
  // Fallback to mock content if GPT failed
  if (!result) {
    console.log("🔄 Falling back to mock content generation");
    result = generateMockStoryContent(minimalData);
    console.log("✅ Mock generation successful");
  }
  
  // Validate against Plaible Story Content Compliance Checklist
  const validationResult = validatePlaibleCompliance(result);
  if (!validationResult.isCompliant) {
    console.log("⚠️ Compliance issues detected:", validationResult.issues);
    // Fix common issues automatically
    result = fixComplianceIssues(result);
    console.log("🔧 Applied compliance fixes");
  } else {
    console.log("✅ Story content is Plaible compliant");
  }
  
  return result;
}

/**
 * Generate story content using GPT API
 * @param {Object} minimalData - Required minimal story data
 * @returns {Promise<Object|null>} Generated story content or null if failed
 */
export async function generateStoryWithGPT(minimalData) {
  try {
    const provider = selectProvider();
    
    if (provider !== 'openai') {
      console.log("⚠️ OpenAI not available, skipping GPT generation");
      return null;
    }
    
    // Dynamic import to avoid loading OpenAI if not needed
    const { default: OpenAI } = await import('openai');
    
    const openai = new OpenAI({
      apiKey: process.env.OPENAI_API_KEY,
      baseURL: process.env.OPENAI_BASE_URL,
    });
    
    const { title, authorName, publishedYear, mainCategory } = minimalData;
    
    // Create comprehensive prompt for story generation
    const systemPrompt = `You are Plaible's Story Content Generator AI.  
Your task is to generate a **complete, DB-ready JSON object** for a new story that perfectly matches the structure, depth, and narrative style of the approved "The Picture of Dorian Gray" story in the Plaible database.  

### CRITICAL REQUIREMENTS - NO SHORTCUTS:
- Always return **valid JSON** only.  
- All required fields from the \`Story\` schema must be present.  
- Use the **exact same tone, depth, and richness** as the Dorian Gray JSON.  
- Output must be **drop-in ready for our database** with zero conflicts.

### CHARACTER REQUIREMENTS (STRICT):
- **CANONICAL NAMES ONLY**: Use real, canonical names from the original work (e.g., Victor Frankenstein, Elizabeth Lavenza, The Creature, Captain Walton).  
- **NEVER use placeholders** like "The Hero", "The Guide", "The Protagonist", or "The Adversary".  
- **Minimum 4 characters** with distinct canonical names and roles.  
- **Character IDs**: Use \`chr_<shortname>\` format (e.g., \`chr_victor\`, \`chr_elizabeth\`, \`chr_creature\`, \`chr_walton\`).  
- **Character summaries**: One-line playable hooks that capture their essence and conflict.  
- **Character hooks**: 3 lowercase strings describing their inner conflicts/motivations.  

### ROLES AND CAST MAPPING:
- Use Plaible's role IDs: \`role_hero\`, \`role_villain\`, \`role_side\`, \`role_other\`.  
- **Allow dual-role characters** when relevant (like Dorian Gray being both hero and villain).  
- **Cast mapping**: Each character must be mapped to appropriate role(s).  

### CONTENT RICHNESS (DORIAN GRAY STANDARD):
- **Genres**: Must be thematic and specific (e.g., \`gothic, horror, philosophical\`), not generic (\`literature, classic, fiction\`).  
- **Tags**: Cover mood, conflict, and setting without duplicating genres.  
- **storySettingTime**: Must be historically accurate and precise (e.g., "1810s", "1890s", "Victorian London"), not vague ("19th century").  
- **Headline**: Single sentence that surfaces a playable conflict (like Dorian Gray's "Beauty without consequence carries the heaviest cost.").  
- **Description**: 2-3 sentences inviting the player into the drama with choices and dilemmas.  

### SUMMARY STRUCTURE (REQUIRED):
- **original**: Faithful to the source material.  
- **modern**: Updated relevance (digital age, AI parallels, contemporary issues).  
- **highlights**: Exactly 3 scene-based dramatic beats with creative titles and descriptions.  

### FUN FACTS STRUCTURE (REQUIRED):
- **storyFacts**: Historical or publication trivia.  
- **authorInfo**: Insights into the author's life and writing style.  
- **modernEcho**: Contemporary parallels and resonance.  

### RE-ENGAGEMENT TEMPLATES (REQUIRED):
- **Must be written in character voices** (like "In Basil's voice: ..." in Dorian Gray).  
- **Minimum 2 templates** with different triggers.  
- **Use canonical character names** in the templates.  

### STORYRUNNER CONFIGURATION (REQUIRED):
- **systemPrompt**: Concise role description for the AI StoryRunner.  
- **storyPrompt**: Complete markdown with all required sections.  
- **guardrails**: Standard Plaible guardrails.  
- **openingBeats**: 3 short scene seeds.  
- **editableFinalPrompt**: Copy of storyPrompt for admin editing.  

### INTERACTIVE FOCUS:
- **Headline and Description**: Must invite the player to embody a character and face dilemmas.  
- **Hooks**: Must describe conflicts and choices, not generic drama.  
- **Character summaries**: Focus on playable tensions and moral dilemmas.  

### OUTPUT FORMAT:
Return a **single JSON object** with the exact schema fields, ready for DB insertion.  
IDs should be generated in kebab-case (e.g. \`story_frankenstein\`, \`chr_victor\`).  

### DORIAN GRAY REFERENCE:
Study the approved "The Picture of Dorian Gray" JSON structure. Your output must match its richness, depth, and quality exactly. No shortcuts, no generic content, no placeholders.`;

    const userPrompt = `Generate a complete Story document for:
- Title: "${title}"
- Author: "${authorName}"
- Published Year: ${publishedYear}
- Main Category: ${mainCategory}

Return the complete JSON object that matches Plaible's Story schema exactly.`;

    const messages = [
      { role: "system", content: systemPrompt },
      { role: "user", content: userPrompt }
    ];
    
    // 15 second timeout for story generation
    const timeoutPromise = new Promise((_, reject) => 
      setTimeout(() => reject(new Error('OpenAI timeout')), 15000)
    );
    
    const completionPromise = openai.chat.completions.create({
      model: process.env.OPENAI_MODEL || "gpt-4o-mini",
      messages,
      max_tokens: 2000,
      temperature: 0.7,
    });
    
    const completion = await Promise.race([completionPromise, timeoutPromise]);
    const response = completion.choices[0]?.message?.content || "";
    
    // Parse JSON response
    try {
      const generatedContent = JSON.parse(response);
      
      // Validate that we have the essential fields
      if (!generatedContent.summary || !generatedContent.storyrunner) {
        throw new Error("Generated content missing essential fields");
      }
      
      return generatedContent;
    } catch (parseError) {
      console.error("❌ Failed to parse GPT response as JSON:", parseError.message);
      console.error("Raw response:", response);
      return null;
    }
    
  } catch (error) {
    console.error("❌ GPT story generation error:", error.message);
    return null;
  }
}

/**
 * Generate mock story content as fallback
 * @param {Object} minimalData - Required minimal story data
 * @returns {Object} Mock story content
 */
export function generateMockStoryContent(minimalData) {
  const { title, authorName, publishedYear, mainCategory } = minimalData;
  
  // Generate slug and ID
  const slug = title.toLowerCase().replace(/[^a-z0-9\s-]/g, '').replace(/\s+/g, '-').replace(/-+/g, '-').trim('-');
  const storyId = `story_${slug.replace(/-/g, '_')}`;
  
  // Generate rich thematic content
  const genres = getRichGenres(title, mainCategory, publishedYear);
  const storySettingTime = getSpecificStorySettingTime(title, publishedYear);
  const subCategory = getSubCategory(mainCategory);
  
  const now = new Date().toISOString();
  
  // Get canonical character data for the story
  const characters = getCanonicalCharacters(title, authorName);
  
  return {
    _id: storyId,
    slug: slug,
    mainCategory: mainCategory,
    subCategory: subCategory,
    title: title,
    authorName: authorName,
    publisher: publishedYear < 1928 ? "Public Domain" : "Unknown",
    genres: genres,
    storySettingTime: storySettingTime,
    publishedYear: publishedYear,
    headline: generateHeadline(title, mainCategory),
    description: generateDescription(title, authorName, mainCategory),
    language: "en",
    license: publishedYear < 1928 ? "public-domain" : "unknown",
    contentRating: "PG-13",
    tags: generateTags(title, mainCategory, publishedYear),
    assets: {
      images: [`https://cdn.plaible.art/stories/${slug}/cover.jpg`],
      videos: [`https://cdn.plaible.art/stories/${slug}/teaser.mp4`],
      ambiance: [`https://www.youtube.com/watch?v=VZ6p_ambient_${slug}`]
    },
    characters: characters.map(char => ({
      id: char.id,
      name: char.name,
      summary: char.summary,
      hooks: char.hooks,
      assets: {
        images: [`https://cdn.plaible.art/stories/${slug}/characters/${char.id.replace('chr_', '')}.jpg`],
        videos: [`https://cdn.plaible.art/stories/${slug}/characters/${char.id.replace('chr_', '')}.mp4`]
      }
    })),
    roles: [
      { id: "role_hero", label: "Hero" },
      { id: "role_villain", label: "Villain" },
      { id: "role_side", label: "Side Character" },
      { id: "role_other", label: "Other" }
    ],
    cast: generateCastMapping(characters),
    hooks: generateHooks(title, mainCategory),
    summary: {
      original: generateOriginalSummary(title, authorName, mainCategory),
      modern: generateModernSummary(title, mainCategory),
      highlights: generateHighlights(title, mainCategory)
    },
    funFacts: generateRichFunFacts(title, authorName, publishedYear),
    stats: {
      totalPlayed: 0,
      totalReviews: 0,
      avgRating: 0,
      savedCount: 0
    },
    share: {
      link: `https://plaible.art/s/${slug}`,
      text: `Step into ${title} and discover what choices await you.`,
      images: [`https://cdn.plaible.art/stories/${slug}/social.jpg`],
      videos: [`https://cdn.plaible.art/stories/${slug}/social-teaser.mp4`]
    },
    feedbacks: [],
    pricing: {
      creditsPerChapter: 10,
      estimatedChapterCount: 10
    },
    relatedStoryIds: [],
    reengagementTemplates: generateReengagementTemplates(characters),
    storyrunner: {
      systemPrompt: `You are Plaible's Storyrunner for ${title}. Keep scenes concise, choices meaningful, tone engaging yet faithful to the original work. Preserve core themes while making the story accessible and interactive.`,
      storyPrompt: `## About Plaible

Plaible is an immersive AI storytelling platform where you step into classic stories and make choices that shape the narrative.

## How to Play

You'll make choices at key moments that determine how the story unfolds. Each decision has consequences that ripple through the narrative.

## StoryRunner AI Role

You are the StoryRunner AI for "${title}" by ${authorName}. Guide players through this interactive ${mainCategory} experience. Present them with meaningful choices that reflect the original story's themes while allowing them to explore alternative paths.

## Story Essentials

- **Title**: "${title}"
- **Author**: ${authorName}
- **Published**: ${publishedYear}
- **Category**: ${mainCategory}
- **Setting**: ${storySettingTime}

## Available Characters

${characters.map(char => `- **${char.name}** - ${char.summary}. Hooks: ${char.hooks.join(', ')}.`).join('\n')}

## Player's Selections

- Character Selection: {Character_Selection}
- Tone Selection: {Tone_Selection}
- Time Selection: {Time_Selection}

## Safety Guardrails

- No explicit sexual content
- No graphic violence
- Respect public-domain boundaries
- Offer choices or accept free-text at each turn

## Instructions

Begin each chapter with an engaging scene that draws the player into the story. Present 2-4 meaningful choices that reflect the original work's themes while allowing for player agency. End each chapter with clear choices that advance the narrative. Maintain thematic integrity with the original work while making it accessible and interactive.`,
      guardrails: [
        "No explicit sexual content",
        "No graphic violence",
        "Respect public-domain boundaries",
        "Offer choices or accept free-text at each turn"
      ],
      openingBeats: [
        `The story begins with a crucial moment in ${title}`,
        `A choice that will determine the course of events`,
        `The weight of decision hangs in the air`
      ],
      editableFinalPrompt: `## About Plaible

Plaible is an immersive AI storytelling platform where you step into classic stories and make choices that shape the narrative.

## How to Play

You'll make choices at key moments that determine how the story unfolds. Each decision has consequences that ripple through the narrative.

## StoryRunner AI Role

You are the StoryRunner AI for "${title}" by ${authorName}. Guide players through this interactive ${mainCategory} experience. Present them with meaningful choices that reflect the original story's themes while allowing them to explore alternative paths.

## Story Essentials

- **Title**: "${title}"
- **Author**: ${authorName}
- **Published**: ${publishedYear}
- **Category**: ${mainCategory}
- **Setting**: ${storySettingTime}

## Available Characters

${characters.map(char => `- **${char.name}** - ${char.summary}. Hooks: ${char.hooks.join(', ')}.`).join('\n')}

## Player's Selections

- Character Selection: {Character_Selection}
- Tone Selection: {Tone_Selection}
- Time Selection: {Time_Selection}

## Safety Guardrails

- No explicit sexual content
- No graphic violence
- Respect public-domain boundaries
- Offer choices or accept free-text at each turn

## Instructions

Begin each chapter with an engaging scene that draws the player into the story. Present 2-4 meaningful choices that reflect the original work's themes while allowing for player agency. End each chapter with clear choices that advance the narrative. Maintain thematic integrity with the original work while making it accessible and interactive.`
    },
    createdAt: now,
    updatedAt: now,
    isActive: true
  };
}

/**
 * Get canonical character data for major works
 * @param {string} title - Story title
 * @param {string} authorName - Author name
 * @returns {Array} Array of canonical character objects
 */
function getCanonicalCharacters(title, authorName) {
  const titleLower = title.toLowerCase();
  const authorLower = authorName.toLowerCase();
  
  // Frankenstein by Mary Shelley
  if (titleLower.includes('frankenstein') || (authorLower.includes('shelley') && titleLower.includes('monster'))) {
    return [
      {
        id: 'chr_victor',
        name: 'Victor Frankenstein',
        summary: 'A brilliant but reckless scientist who creates life and faces its consequences',
        hooks: ['ambition', 'guilt', 'responsibility']
      },
      {
        id: 'chr_creature',
        name: 'The Creature',
        summary: 'A sentient being seeking acceptance and revenge against his creator',
        hooks: ['loneliness', 'revenge', 'humanity']
      },
      {
        id: 'chr_elizabeth',
        name: 'Elizabeth Lavenza',
        summary: 'Victor\'s beloved fiancée who becomes a victim of the creature\'s wrath',
        hooks: ['love', 'innocence', 'sacrifice']
      },
      {
        id: 'chr_walton',
        name: 'Captain Walton',
        summary: 'An Arctic explorer who becomes Victor\'s confidant and witness to his tale',
        hooks: ['exploration', 'friendship', 'warning']
      }
    ];
  }
  
  // Dracula by Bram Stoker
  if (titleLower.includes('dracula') || (authorLower.includes('stoker') && titleLower.includes('vampire'))) {
    return [
      {
        id: 'chr_dracula',
        name: 'Count Dracula',
        summary: 'An ancient vampire seeking to spread his curse to Victorian London',
        hooks: ['power', 'seduction', 'immortality']
      },
      {
        id: 'chr_van_helsing',
        name: 'Professor Van Helsing',
        summary: 'A learned vampire hunter who leads the fight against the undead',
        hooks: ['knowledge', 'duty', 'sacrifice']
      },
      {
        id: 'chr_jonathan',
        name: 'Jonathan Harker',
        summary: 'A young solicitor whose encounter with Dracula begins the nightmare',
        hooks: ['innocence', 'survival', 'love']
      },
      {
        id: 'chr_mina',
        name: 'Mina Murray',
        summary: 'Jonathan\'s fiancée who becomes Dracula\'s target and the group\'s strength',
        hooks: ['love', 'courage', 'transformation']
      }
    ];
  }
  
  // Pride and Prejudice by Jane Austen
  if (titleLower.includes('pride') && titleLower.includes('prejudice') || (authorLower.includes('austen') && titleLower.includes('pride'))) {
    return [
      {
        id: 'chr_elizabeth',
        name: 'Elizabeth Bennet',
        summary: 'An intelligent and independent woman who learns to see beyond first impressions',
        hooks: ['pride', 'prejudice', 'independence']
      },
      {
        id: 'chr_darcy',
        name: 'Mr. Darcy',
        summary: 'A wealthy gentleman whose pride masks a noble heart',
        hooks: ['pride', 'love', 'transformation']
      },
      {
        id: 'chr_jane',
        name: 'Jane Bennet',
        summary: 'Elizabeth\'s gentle sister who sees the best in everyone',
        hooks: ['kindness', 'love', 'patience']
      },
      {
        id: 'chr_wickham',
        name: 'George Wickham',
        summary: 'A charming officer whose true nature threatens the Bennet family',
        hooks: ['deception', 'revenge', 'corruption']
      }
    ];
  }
  
  // The Great Gatsby by F. Scott Fitzgerald
  if (titleLower.includes('gatsby') || (authorLower.includes('fitzgerald') && titleLower.includes('great'))) {
    return [
      {
        id: 'chr_gatsby',
        name: 'Jay Gatsby',
        summary: 'A mysterious millionaire obsessed with recapturing a lost love',
        hooks: ['obsession', 'illusion', 'dreams']
      },
      {
        id: 'chr_nick',
        name: 'Nick Carraway',
        summary: 'A young bond salesman who becomes Gatsby\'s neighbor and confidant',
        hooks: ['observation', 'morality', 'disillusionment']
      },
      {
        id: 'chr_daisy',
        name: 'Daisy Buchanan',
        summary: 'Gatsby\'s lost love, torn between passion and security',
        hooks: ['love', 'choice', 'materialism']
      },
      {
        id: 'chr_tom',
        name: 'Tom Buchanan',
        summary: 'Daisy\'s wealthy husband who represents the old money elite',
        hooks: ['privilege', 'infidelity', 'power']
      }
    ];
  }
  
  // Hamlet by William Shakespeare
  if (titleLower.includes('hamlet') || (authorLower.includes('shakespeare') && titleLower.includes('hamlet'))) {
    return [
      {
        id: 'chr_hamlet',
        name: 'Prince Hamlet',
        summary: 'A Danish prince consumed by grief and the need for revenge',
        hooks: ['madness', 'revenge', 'existentialism']
      },
      {
        id: 'chr_claudius',
        name: 'King Claudius',
        summary: 'Hamlet\'s uncle who murdered his father and married his mother',
        hooks: ['guilt', 'power', 'deception']
      },
      {
        id: 'chr_ophelia',
        name: 'Ophelia',
        summary: 'Hamlet\'s beloved who descends into madness and tragedy',
        hooks: ['love', 'madness', 'innocence']
      },
      {
        id: 'chr_ghost',
        name: 'The Ghost',
        summary: 'Hamlet\'s father\'s spirit who demands vengeance',
        hooks: ['revenge', 'truth', 'supernatural']
      }
    ];
  }
  
  // Macbeth by William Shakespeare
  if (titleLower.includes('macbeth') || (authorLower.includes('shakespeare') && titleLower.includes('macbeth'))) {
    return [
      {
        id: 'chr_macbeth',
        name: 'Macbeth',
        summary: 'A Scottish general whose ambition leads to murder and madness',
        hooks: ['ambition', 'guilt', 'power']
      },
      {
        id: 'chr_lady_macbeth',
        name: 'Lady Macbeth',
        summary: 'Macbeth\'s wife who pushes him toward regicide and pays the price',
        hooks: ['ambition', 'manipulation', 'madness']
      },
      {
        id: 'chr_banquo',
        name: 'Banquo',
        summary: 'Macbeth\'s friend and fellow general who becomes a ghostly reminder',
        hooks: ['loyalty', 'prophecy', 'conscience']
      },
      {
        id: 'chr_duncan',
        name: 'King Duncan',
        summary: 'The virtuous king whose murder sets the tragedy in motion',
        hooks: ['virtue', 'trust', 'sacrifice']
      }
    ];
  }
  
  // Jane Eyre by Charlotte Brontë
  if (titleLower.includes('jane eyre') || (authorLower.includes('brontë') && titleLower.includes('jane'))) {
    return [
      {
        id: 'chr_jane',
        name: 'Jane Eyre',
        summary: 'An orphaned governess who seeks independence and true love',
        hooks: ['independence', 'morality', 'love']
      },
      {
        id: 'chr_rochester',
        name: 'Edward Rochester',
        summary: 'Jane\'s employer whose dark secret threatens their happiness',
        hooks: ['secrets', 'redemption', 'passion']
      },
      {
        id: 'chr_bertha',
        name: 'Bertha Mason',
        summary: 'Rochester\'s mad wife locked in the attic of Thornfield Hall',
        hooks: ['madness', 'confinement', 'colonialism']
      },
      {
        id: 'chr_helen',
        name: 'Helen Burns',
        summary: 'Jane\'s friend at Lowood who teaches her about faith and forgiveness',
        hooks: ['faith', 'sacrifice', 'friendship']
      }
    ];
  }
  
  // Wuthering Heights by Emily Brontë
  if (titleLower.includes('wuthering heights') || (authorLower.includes('brontë') && titleLower.includes('wuthering'))) {
    return [
      {
        id: 'chr_heathcliff',
        name: 'Heathcliff',
        summary: 'A mysterious orphan whose love and revenge consume two generations',
        hooks: ['revenge', 'passion', 'obsession']
      },
      {
        id: 'chr_catherine',
        name: 'Catherine Earnshaw',
        summary: 'Heathcliff\'s soulmate whose choice between love and status destroys them both',
        hooks: ['love', 'ambition', 'identity']
      },
      {
        id: 'chr_edgar',
        name: 'Edgar Linton',
        summary: 'Catherine\'s refined husband who represents social respectability',
        hooks: ['gentility', 'love', 'conflict']
      },
      {
        id: 'chr_nelly',
        name: 'Nelly Dean',
        summary: 'The housekeeper who narrates the tragic tale of the Earnshaw and Linton families',
        hooks: ['observation', 'loyalty', 'wisdom']
      }
    ];
  }
  
  // The Scarlet Letter by Nathaniel Hawthorne
  if (titleLower.includes('scarlet letter') || (authorLower.includes('hawthorne') && titleLower.includes('scarlet'))) {
    return [
      {
        id: 'chr_hester',
        name: 'Hester Prynne',
        summary: 'A woman who bears the scarlet letter A for adultery and finds strength in her shame',
        hooks: ['shame', 'strength', 'redemption']
      },
      {
        id: 'chr_dimmesdale',
        name: 'Arthur Dimmesdale',
        summary: 'The town\'s revered minister who secretly shares Hester\'s sin',
        hooks: ['guilt', 'hypocrisy', 'redemption']
      },
      {
        id: 'chr_chillingworth',
        name: 'Roger Chillingworth',
        summary: 'Hester\'s estranged husband who becomes a vengeful physician',
        hooks: ['revenge', 'obsession', 'corruption']
      },
      {
        id: 'chr_pearl',
        name: 'Pearl',
        summary: 'Hester\'s spirited daughter who embodies both sin and innocence',
        hooks: ['innocence', 'wildness', 'truth']
      }
    ];
  }
  
  // Moby Dick by Herman Melville
  if (titleLower.includes('moby dick') || (authorLower.includes('melville') && titleLower.includes('moby'))) {
    return [
      {
        id: 'chr_ahab',
        name: 'Captain Ahab',
        summary: 'A monomaniacal whaling captain obsessed with hunting the white whale',
        hooks: ['obsession', 'revenge', 'madness']
      },
      {
        id: 'chr_ishmael',
        name: 'Ishmael',
        summary: 'The narrator and only survivor of the Pequod\'s doomed voyage',
        hooks: ['observation', 'survival', 'philosophy']
      },
      {
        id: 'chr_queequeg',
        name: 'Queequeg',
        summary: 'A Polynesian harpooner who becomes Ishmael\'s closest friend',
        hooks: ['friendship', 'culture', 'sacrifice']
      },
      {
        id: 'chr_moby_dick',
        name: 'Moby Dick',
        summary: 'The legendary white whale that represents nature\'s indifference to man',
        hooks: ['nature', 'mystery', 'destiny']
      }
    ];
  }
  
  // Fallback for unknown works - use generic but rich character archetypes
  return [
    {
      id: 'chr_protagonist',
      name: 'The Protagonist',
      summary: 'The central figure whose choices will determine the story\'s outcome',
      hooks: ['moral dilemmas', 'fateful decisions', 'inner conflict']
    },
    {
      id: 'chr_antagonist',
      name: 'The Antagonist',
      summary: 'A compelling force that challenges the protagonist\'s values and beliefs',
      hooks: ['temptation', 'corruption', 'power']
    },
    {
      id: 'chr_mentor',
      name: 'The Mentor',
      summary: 'A wise figure who offers counsel but cannot make the choices for you',
      hooks: ['wisdom', 'guidance', 'sacrifice']
    },
    {
      id: 'chr_companion',
      name: 'The Companion',
      summary: 'A loyal ally whose fate is intertwined with your decisions',
      hooks: ['loyalty', 'friendship', 'shared destiny']
    }
  ];
}

/**
 * Generate cast mapping for characters
 * @param {Array} characters - Array of character objects
 * @returns {Array} Array of cast mapping objects
 */
function generateCastMapping(characters) {
  const cast = [];
  
  // Map first character as hero/villain (dual role like Dorian Gray)
  if (characters.length > 0) {
    cast.push({ characterId: characters[0].id, roleIds: ["role_hero", "role_villain"] });
  }
  
  // Map second character as villain
  if (characters.length > 1) {
    cast.push({ characterId: characters[1].id, roleIds: ["role_villain"] });
  }
  
  // Map remaining characters as side characters
  for (let i = 2; i < characters.length; i++) {
    cast.push({ characterId: characters[i].id, roleIds: ["role_side"] });
  }
  
  return cast;
}

/**
 * Generate reengagement templates in character voices
 * @param {Array} characters - Array of character objects
 * @returns {Array} Array of reengagement template objects
 */
function generateReengagementTemplates(characters) {
  const templates = [];
  
  // First template from a side character
  if (characters.length > 2) {
    templates.push({
      trigger: "inactivity>48h",
      template: `In ${characters[2].name}'s voice: "{displayName}, the story awaits your return. What will you choose next?"`,
      cooldownHours: 72,
      enabled: true
    });
  }
  
  // Second template from the antagonist
  if (characters.length > 1) {
    templates.push({
      trigger: "lowCredits<100",
      template: `In ${characters[1].name}'s voice: "Every choice has its price, {displayName}. Will you pay to continue?"`,
      cooldownHours: 72,
      enabled: true
    });
  }
  
  return templates;
}

/**
 * Generate headline in Dorian Gray style
 * @param {string} title - Story title
 * @param {string} mainCategory - Main category
 * @returns {string} Headline
 */
function generateHeadline(title, mainCategory) {
  const headlines = {
    book: [
      `The price of knowledge carries the weight of consequence.`,
      `Every choice echoes through the corridors of fate.`,
      `In the shadows of ambition, truth waits to be discovered.`
    ],
    story: [
      `A moment's decision shapes an entire destiny.`,
      `The line between hero and villain is drawn by choice.`,
      `In the heart of conflict, character is revealed.`
    ],
    biography: [
      `The weight of legacy rests on every decision.`,
      `History remembers not what was, but what could have been.`,
      `In the footsteps of greatness, your path awaits.`
    ]
  };
  
  const categoryHeadlines = headlines[mainCategory] || headlines.book;
  return categoryHeadlines[Math.floor(Math.random() * categoryHeadlines.length)];
}

/**
 * Generate description in Dorian Gray style
 * @param {string} title - Story title
 * @param {string} authorName - Author name
 * @param {string} mainCategory - Main category
 * @returns {string} Description
 */
function generateDescription(title, authorName, mainCategory) {
  return `Step into the world of ${title} where every choice carries weight and consequence. ${authorName}'s masterpiece becomes your interactive journey as you navigate the complex web of relationships, moral dilemmas, and fateful decisions that define this timeless ${mainCategory}. Will you follow the path of the original story, or forge your own destiny?`;
}

/**
 * Generate rich thematic tags based on story
 * @param {string} title - Story title
 * @param {string} mainCategory - Main category
 * @param {number} publishedYear - Published year
 * @returns {Array} Array of thematic tags
 */
function generateTags(title, mainCategory, publishedYear) {
  const titleLower = title.toLowerCase();
  const tags = ['interactive', 'choices', 'drama'];
  
  // Add thematic tags based on specific works
  if (titleLower.includes('frankenstein')) {
    tags.push('gothic', 'horror', 'philosophical', 'science', 'creation', 'monster', 'isolation');
  } else if (titleLower.includes('dracula')) {
    tags.push('gothic', 'horror', 'vampire', 'supernatural', 'seduction', 'victorian', 'darkness');
  } else if (titleLower.includes('pride') && titleLower.includes('prejudice')) {
    tags.push('romance', 'social', 'class', 'marriage', 'wit', 'society', 'prejudice');
  } else if (titleLower.includes('gatsby')) {
    tags.push('american dream', 'wealth', 'illusion', 'love', 'corruption', 'roaring twenties', 'tragedy');
  } else if (titleLower.includes('hamlet')) {
    tags.push('tragedy', 'revenge', 'madness', 'existential', 'royalty', 'ghost', 'philosophy');
  } else if (titleLower.includes('macbeth')) {
    tags.push('tragedy', 'ambition', 'power', 'supernatural', 'guilt', 'royalty', 'fate');
  } else if (titleLower.includes('jane eyre')) {
    tags.push('gothic', 'romance', 'independence', 'morality', 'secrets', 'governess', 'redemption');
  } else if (titleLower.includes('wuthering heights')) {
    tags.push('gothic', 'romance', 'revenge', 'passion', 'obsession', 'tragedy', 'wildness');
  } else if (titleLower.includes('scarlet letter')) {
    tags.push('puritan', 'sin', 'redemption', 'shame', 'morality', 'colonial', 'hypocrisy');
  } else if (titleLower.includes('moby dick')) {
    tags.push('adventure', 'obsession', 'nature', 'whaling', 'philosophy', 'madness', 'destiny');
  } else {
    // Generic thematic tags
    tags.push('literary', 'classic', 'timeless');
    if (publishedYear < 1900) {
      tags.push('historical', 'victorian', 'gothic');
    } else if (publishedYear < 1950) {
      tags.push('modern', 'sophisticated', 'psychological');
    } else {
      tags.push('contemporary', 'relevant', 'engaging');
    }
  }
  
  return tags;
}

/**
 * Generate hooks in Dorian Gray style
 * @param {string} title - Story title
 * @param {string} mainCategory - Main category
 * @returns {Array} Array of hooks
 */
function generateHooks(title, mainCategory) {
  const hooks = {
    book: [
      'The weight of knowledge and its consequences',
      'Choices that echo through generations',
      'The price of ambition and desire'
    ],
    story: [
      'A moment that changes everything',
      'The thin line between right and wrong',
      'Decisions that define character'
    ],
    biography: [
      'The burden of legacy and expectation',
      'Paths not taken and roads less traveled',
      'The making of history through choice'
    ]
  };
  
  return hooks[mainCategory] || hooks.book;
}

/**
 * Generate original summary based on specific work
 * @param {string} title - Story title
 * @param {string} authorName - Author name
 * @param {string} mainCategory - Main category
 * @returns {string} Original summary
 */
function generateOriginalSummary(title, authorName, mainCategory) {
  const titleLower = title.toLowerCase();
  
  if (titleLower.includes('frankenstein')) {
    return 'Victor Frankenstein creates life from death, but his creation becomes a monster that haunts him across Europe.';
  } else if (titleLower.includes('dracula')) {
    return 'Count Dracula seeks to spread his vampiric curse to Victorian London, but a group of determined hunters stands in his way.';
  } else if (titleLower.includes('pride') && titleLower.includes('prejudice')) {
    return 'Elizabeth Bennet and Mr. Darcy must overcome their pride and prejudice to find true love in Regency England.';
  } else if (titleLower.includes('gatsby')) {
    return 'Jay Gatsby\'s obsession with recapturing the past leads to tragedy in the glittering world of 1920s America.';
  } else if (titleLower.includes('hamlet')) {
    return 'Prince Hamlet struggles with grief, madness, and the need for revenge after his father\'s ghost reveals the truth.';
  } else if (titleLower.includes('macbeth')) {
    return 'Macbeth\'s ambition leads him to murder and madness as he seeks to fulfill a prophecy of kingship.';
  } else if (titleLower.includes('jane eyre')) {
    return 'Jane Eyre, an orphaned governess, finds love and independence despite the dark secrets of Thornfield Hall.';
  } else if (titleLower.includes('wuthering heights')) {
    return 'Heathcliff\'s passionate love for Catherine Earnshaw becomes an obsession that destroys two generations.';
  } else if (titleLower.includes('scarlet letter')) {
    return 'Hester Prynne bears the scarlet letter A for adultery while her secret lover suffers in silence.';
  } else if (titleLower.includes('moby dick')) {
    return 'Captain Ahab\'s monomaniacal quest for the white whale leads to the destruction of his ship and crew.';
  } else {
    return `${authorName}'s ${title} explores the complex interplay of human nature, choice, and consequence in a way that continues to resonate with readers across generations.`;
  }
}

/**
 * Generate modern summary with contemporary relevance
 * @param {string} title - Story title
 * @param {string} mainCategory - Main category
 * @returns {string} Modern summary
 */
function generateModernSummary(title, mainCategory) {
  const titleLower = title.toLowerCase();
  
  if (titleLower.includes('frankenstein')) {
    return 'The ethical dilemmas of artificial intelligence and genetic engineering echo Victor\'s reckless creation of life.';
  } else if (titleLower.includes('dracula')) {
    return 'The seductive power of charismatic leaders and the fear of the "other" remain as relevant as ever.';
  } else if (titleLower.includes('pride') && titleLower.includes('prejudice')) {
    return 'Social media and dating apps have transformed courtship, but first impressions and class divisions persist.';
  } else if (titleLower.includes('gatsby')) {
    return 'The American Dream\'s promise of reinvention and the corrupting influence of wealth continue to shape our society.';
  } else if (titleLower.includes('hamlet')) {
    return 'The paralysis of choice and the weight of moral responsibility resonate in our age of endless options.';
  } else if (titleLower.includes('macbeth')) {
    return 'The corrupting influence of power and the consequences of unchecked ambition remain timeless themes.';
  } else if (titleLower.includes('jane eyre')) {
    return 'The struggle for women\'s independence and the search for authentic love continue to inspire modern readers.';
  } else if (titleLower.includes('wuthering heights')) {
    return 'The destructive power of obsessive love and the cycle of abuse remain painfully relevant today.';
  } else if (titleLower.includes('scarlet letter')) {
    return 'Public shaming and the hypocrisy of moral judgment find new expression in social media and cancel culture.';
  } else if (titleLower.includes('moby dick')) {
    return 'The destructive pursuit of profit and the exploitation of nature continue to threaten our world.';
  } else {
    return `The themes of ${title} find new relevance in our digital age, where every choice is recorded, every decision amplified, and the consequences of our actions ripple through virtual and real worlds alike.`;
  }
}

/**
 * Generate rich highlights based on specific work
 * @param {string} title - Story title
 * @param {string} mainCategory - Main category
 * @returns {Array} Array of highlight objects
 */
function generateHighlights(title, mainCategory) {
  const titleLower = title.toLowerCase();
  
  if (titleLower.includes('frankenstein')) {
    return [
      {
        title: 'The Creation',
        description: 'Victor brings his creature to life in a moment of scientific triumph and moral blindness.'
      },
      {
        title: 'The Monster\'s Education',
        description: 'The creature learns language and philosophy while hiding in the shadows of human society.'
      },
      {
        title: 'The Final Pursuit',
        description: 'Victor and his creation chase each other across the Arctic in a deadly game of cat and mouse.'
      }
    ];
  } else if (titleLower.includes('dracula')) {
    return [
      {
        title: 'The Castle',
        description: 'Jonathan Harker discovers the true nature of his host in the crumbling walls of Castle Dracula.'
      },
      {
        title: 'The Seduction',
        description: 'Dracula\'s influence spreads through London as he preys on the innocent and vulnerable.'
      },
      {
        title: 'The Hunt',
        description: 'Van Helsing and his allies race against time to destroy the vampire before he claims more victims.'
      }
    ];
  } else if (titleLower.includes('pride') && titleLower.includes('prejudice')) {
    return [
      {
        title: 'The First Meeting',
        description: 'Elizabeth and Darcy\'s initial encounter is marked by pride, prejudice, and mutual misunderstanding.'
      },
      {
        title: 'The Proposal',
        description: 'Darcy\'s arrogant proposal forces Elizabeth to confront her own prejudices and assumptions.'
      },
      {
        title: 'The Revelation',
        description: 'The truth about Wickham and Darcy\'s true character transforms Elizabeth\'s understanding of love.'
      }
    ];
  } else {
    // Generic highlights
    return [
      {
        title: 'The Moment of Choice',
        description: 'A pivotal decision that sets the course of events in motion.'
      },
      {
        title: 'The Weight of Consequence',
        description: 'The realization that every action carries its own price.'
      },
      {
        title: 'The Final Reckoning',
        description: 'Where all choices converge and truth is revealed.'
      }
    ];
  }
}

/**
 * Generate rich fun facts based on specific work
 * @param {string} title - Story title
 * @param {string} authorName - Author name
 * @param {number} publishedYear - Published year
 * @returns {Object} Fun facts object
 */
function generateRichFunFacts(title, authorName, publishedYear) {
  const titleLower = title.toLowerCase();
  
  if (titleLower.includes('frankenstein')) {
    return {
      storyFacts: [
        { title: "The Birth of Science Fiction", description: "Frankenstein is considered the first true science fiction novel, written when Mary Shelley was just 18 years old." },
        { title: "The Ghost Story Challenge", description: "The novel was born from a ghost story competition between Mary Shelley, Percy Bysshe Shelley, and Lord Byron during a stormy summer in Switzerland." }
      ],
      authorInfo: [
        { title: "Mary Shelley's Tragedy", description: "Mary Shelley wrote Frankenstein while grieving the loss of her first child, infusing the novel with themes of creation, loss, and responsibility." },
        { title: "A Literary Family", description: "Mary Shelley was the daughter of feminist philosopher Mary Wollstonecraft and political philosopher William Godwin, growing up in an intellectual household." }
      ],
      modernEcho: [
        { title: "AI and Ethics", description: "The ethical questions raised by Victor's creation resonate with modern debates about artificial intelligence and genetic engineering." },
        { title: "The Outsider's Perspective", description: "The creature's struggle for acceptance mirrors contemporary discussions about immigration, disability rights, and social inclusion." }
      ]
    };
  } else if (titleLower.includes('dracula')) {
    return {
      storyFacts: [
        { title: "The Real Dracula", description: "Bram Stoker based his vampire on the historical figure Vlad the Impaler, a 15th-century Romanian prince known for his cruelty." },
        { title: "Epistolary Innovation", description: "Dracula was one of the first novels to use multiple narrators and diary entries to tell its story, creating a sense of authenticity." }
      ],
      authorInfo: [
        { title: "Stoker's Research", description: "Bram Stoker spent seven years researching European folklore and vampire legends before writing his masterpiece." },
        { title: "Theater Manager", description: "Stoker worked as the business manager for the famous actor Henry Irving, which influenced his understanding of dramatic presentation." }
      ],
      modernEcho: [
        { title: "Immigration Fears", description: "Dracula's journey from Transylvania to London reflects Victorian anxieties about Eastern European immigration and cultural invasion." },
        { title: "Sexual Repression", description: "The novel's themes of seduction and forbidden desire continue to resonate in discussions about sexuality and power dynamics." }
      ]
    };
  } else if (titleLower.includes('pride') && titleLower.includes('prejudice')) {
    return {
      storyFacts: [
        { title: "First Impressions", description: "The novel was originally titled 'First Impressions' and was rejected by a publisher before being revised and published as 'Pride and Prejudice'." },
        { title: "Austen's Income", description: "Jane Austen earned only £110 from the first edition of Pride and Prejudice, despite its eventual fame." }
      ],
      authorInfo: [
        { title: "The Anonymous Author", description: "Pride and Prejudice was published anonymously, with the title page simply reading 'By a Lady' - Austen's identity wasn't revealed until after her death." },
        { title: "Austen's Wit", description: "Jane Austen's sharp social commentary and wit made her one of the most influential novelists in English literature, despite writing only six completed novels." }
      ],
      modernEcho: [
        { title: "Social Media Romance", description: "The novel's exploration of first impressions and social judgment finds new relevance in the age of online dating and social media." },
        { title: "Class and Marriage", description: "Austen's critique of marriage as a financial transaction continues to resonate in discussions about modern relationships and economic inequality." }
      ]
    };
  } else {
    // Generic fun facts
    return {
      storyFacts: [
        { title: "Literary Impact", description: `First published in ${publishedYear}, this work has influenced countless other stories in the same genre.` },
        { title: "Cultural Significance", description: "The themes explored continue to resonate with readers across generations." }
      ],
      authorInfo: [
        { title: "About the Author", description: `${authorName} was a significant literary figure whose work continues to be studied and celebrated.` },
        { title: "Writing Legacy", description: "Known for their distinctive voice and ability to capture complex human emotions and societal themes." }
      ],
      modernEcho: [
        { title: "Contemporary Relevance", description: "The story's themes remain strikingly relevant to modern audiences and current social issues." },
        { title: "Digital Age Parallels", description: "The narrative's core conflicts find new expression in our technology-driven world." }
      ]
    };
  }
}

/**
 * Get subcategory based on main category in kebab-case format
 * @param {string} mainCategory - The main category
 * @returns {string} Appropriate subcategory in kebab-case
 */
function getSubCategory(mainCategory) {
  switch (mainCategory) {
    case "book":
      return "classic-novels";
    case "story":
      return "short-fiction";
    case "biography":
      return "historical-figures";
    default:
      return "classic-novels";
  }
}

/**
 * Get rich thematic genres based on story
 * @param {string} title - Story title
 * @param {string} mainCategory - The main category
 * @param {number} publishedYear - Publication year
 * @returns {Array} Array of thematic genres
 */
function getRichGenres(title, mainCategory, publishedYear) {
  const titleLower = title.toLowerCase();
  
  // Specific genres for major works
  if (titleLower.includes('frankenstein')) {
    return ['gothic', 'horror', 'philosophical'];
  } else if (titleLower.includes('dracula')) {
    return ['gothic', 'horror', 'supernatural'];
  } else if (titleLower.includes('pride') && titleLower.includes('prejudice')) {
    return ['romance', 'social', 'comedy'];
  } else if (titleLower.includes('gatsby')) {
    return ['tragedy', 'social', 'psychological'];
  } else if (titleLower.includes('hamlet') || titleLower.includes('macbeth')) {
    return ['tragedy', 'drama', 'philosophical'];
  } else if (titleLower.includes('jane eyre') || titleLower.includes('wuthering heights')) {
    return ['gothic', 'romance', 'psychological'];
  } else if (titleLower.includes('scarlet letter')) {
    return ['drama', 'historical', 'psychological'];
  } else if (titleLower.includes('moby dick')) {
    return ['adventure', 'philosophical', 'tragedy'];
  } else {
    // Generic genres based on category and era
    switch (mainCategory) {
      case "book":
        if (publishedYear < 1900) {
          return ['gothic', 'classic', 'philosophical'];
        } else if (publishedYear < 1950) {
          return ['modern', 'psychological', 'literary'];
        } else {
          return ['contemporary', 'literary', 'drama'];
        }
      case "story":
        return ['fiction', 'narrative', 'drama'];
      case "biography":
        return ['biography', 'historical', 'inspirational'];
      default:
        return ['literary', 'classic', 'drama'];
    }
  }
}

/**
 * Get specific story setting time
 * @param {string} title - Story title
 * @param {number} publishedYear - Publication year
 * @returns {string} Specific time setting
 */
function getSpecificStorySettingTime(title, publishedYear) {
  const titleLower = title.toLowerCase();
  
  // Specific time settings for major works
  if (titleLower.includes('frankenstein')) {
    return '1810s';
  } else if (titleLower.includes('dracula')) {
    return 'Victorian London, 1890s';
  } else if (titleLower.includes('pride') && titleLower.includes('prejudice')) {
    return 'Regency England, 1810s';
  } else if (titleLower.includes('gatsby')) {
    return 'Roaring Twenties, 1920s';
  } else if (titleLower.includes('hamlet')) {
    return 'Medieval Denmark';
  } else if (titleLower.includes('macbeth')) {
    return 'Medieval Scotland';
  } else if (titleLower.includes('jane eyre')) {
    return 'Victorian England, 1840s';
  } else if (titleLower.includes('wuthering heights')) {
    return 'Yorkshire Moors, 1800s';
  } else if (titleLower.includes('scarlet letter')) {
    return 'Puritan Massachusetts, 1640s';
  } else if (titleLower.includes('moby dick')) {
    return 'New England, 1840s';
  } else {
    // Generic time settings based on publication year
    if (publishedYear < 1800) {
      return 'Ancient times';
    } else if (publishedYear < 1900) {
      return '19th century';
    } else if (publishedYear < 1950) {
      return 'Early 20th century';
    } else {
      return 'Modern era';
    }
  }
}

/**
 * Validate story content against Plaible Story Content Compliance Checklist
 * @param {Object} story - Generated story content
 * @returns {Object} Validation result with compliance status and issues
 */
export function validatePlaibleCompliance(story) {
  const issues = [];
  
  // Check canonical characters (no placeholders)
  if (story.characters) {
    const genericNames = ['The Hero', 'The Guide', 'The Protagonist', 'The Adversary', 'The Mentor', 'The Companion'];
    const hasGenericNames = story.characters.some(char => 
      genericNames.some(generic => char.name.includes(generic))
    );
    if (hasGenericNames) {
      issues.push('Contains generic character names (placeholders)');
    }
  }
  
  // Check minimum character count
  if (!story.characters || story.characters.length < 4) {
    issues.push('Insufficient character count (minimum 4 required)');
  }
  
  // Check roles and cast mapping
  if (!story.roles || story.roles.length !== 4) {
    issues.push('Invalid roles structure (must have exactly 4 roles)');
  }
  if (!story.cast || story.cast.length < 4) {
    issues.push('Insufficient cast mapping (minimum 4 required)');
  }
  
  // Check genres (must be thematic, not generic)
  if (story.genres) {
    const genericGenres = ['literature', 'classic', 'fiction', 'general'];
    const hasGenericGenres = story.genres.some(genre => 
      genericGenres.includes(genre.toLowerCase())
    );
    if (hasGenericGenres) {
      issues.push('Contains generic genres (must be thematic)');
    }
  }
  
  // Check storySettingTime (must be specific, not vague)
  if (story.storySettingTime) {
    const vagueSettings = ['19th century', '20th century', 'Modern era', 'Ancient times'];
    if (vagueSettings.includes(story.storySettingTime)) {
      issues.push('Vague storySettingTime (must be specific period)');
    }
  }
  
  // Check summary structure
  if (!story.summary || !story.summary.original || !story.summary.modern || !story.summary.highlights) {
    issues.push('Incomplete summary structure (original, modern, highlights required)');
  } else if (story.summary.highlights.length < 3) {
    issues.push('Insufficient summary highlights (minimum 3 required)');
  }
  
  // Check funFacts structure
  if (!story.funFacts || !story.funFacts.storyFacts || !story.funFacts.authorInfo || !story.funFacts.modernEcho) {
    issues.push('Incomplete funFacts structure (storyFacts, authorInfo, modernEcho required)');
  }
  
  // Check reengagement templates (minimum 2, character voices)
  if (!story.reengagementTemplates || story.reengagementTemplates.length < 2) {
    issues.push('Insufficient reengagement templates (minimum 2 required)');
  } else {
    const hasCharacterVoices = story.reengagementTemplates.some(template => 
      template.template.includes("'s voice")
    );
    if (!hasCharacterVoices) {
      issues.push('Reengagement templates must be written in character voices');
    }
  }
  
  // Check StoryRunner structure
  if (!story.storyrunner || !story.storyrunner.systemPrompt || !story.storyrunner.storyPrompt || 
      !story.storyrunner.editableFinalPrompt || !story.storyrunner.guardrails || !story.storyrunner.openingBeats) {
    issues.push('Incomplete StoryRunner structure');
  }
  
  // Check consistency: storySettingTime should match StoryRunner Setting
  if (story.storySettingTime && story.storyrunner && story.storyrunner.storyPrompt) {
    const storyPromptSetting = story.storyrunner.storyPrompt.match(/- \*\*Setting\*\*: (.+)/);
    if (storyPromptSetting && storyPromptSetting[1] !== story.storySettingTime) {
      issues.push('StoryRunner Setting field does not match storySettingTime');
    }
  }
  
  // Check subCategory casing (must be kebab-case)
  if (story.subCategory) {
    const hasSpaces = story.subCategory.includes(' ');
    const hasCapitalLetters = /[A-Z]/.test(story.subCategory);
    if (hasSpaces || hasCapitalLetters) {
      issues.push('SubCategory must be in kebab-case format');
    }
  }
  
  return {
    isCompliant: issues.length === 0,
    issues: issues
  };
}

/**
 * Fix common compliance issues automatically
 * @param {Object} story - Story content to fix
 * @returns {Object} Fixed story content
 */
function fixComplianceIssues(story) {
  const fixed = { ...story };
  
  // Fix subCategory casing
  if (fixed.subCategory) {
    fixed.subCategory = fixed.subCategory.toLowerCase().replace(/\s+/g, '-');
  }
  
  // Fix StoryRunner Setting consistency
  if (fixed.storySettingTime && fixed.storyrunner) {
    const settingPattern = /- \*\*Setting\*\*: .+/g;
    const replacement = `- **Setting**: ${fixed.storySettingTime}`;
    
    if (fixed.storyrunner.storyPrompt) {
      fixed.storyrunner.storyPrompt = fixed.storyrunner.storyPrompt.replace(settingPattern, replacement);
    }
    if (fixed.storyrunner.editableFinalPrompt) {
      fixed.storyrunner.editableFinalPrompt = fixed.storyrunner.editableFinalPrompt.replace(settingPattern, replacement);
    }
  }
  
  return fixed;
}