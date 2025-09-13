// utils/storyEngine.js
// Utility functions for AI-powered story generation

import OpenAI from 'openai';
import { UserStorySession } from '../models/UserStorySession.js';
import { Story } from '../models/Story.js';
import { StoryPrompt } from '../src/models/storyPromptModel.js';
import { Chapter } from '../models/Chapter.js';
import { generateStoryPrompt } from '../src/utils/generateStoryPrompt.js';

// Initialize OpenAI client
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

/**
 * Generates the first chapter of a story session using AI
 * @param {string} sessionId - The session ID
 * @returns {Promise<Object|null>} - Chapter data or null if failed
 */
export async function generateFirstChapter(sessionId) {
  try {
    console.log(`🎭 Generating first chapter for session: ${sessionId}`);

    // 1. Fetch the session
    const session = await UserStorySession.findById(sessionId);
    if (!session) {
      console.error('Session not found:', sessionId);
      return null;
    }

    // 2. Get the system prompt from story_prompts or generate it
    let storyPrompt = await StoryPrompt.findBySessionId(sessionId);
    if (!storyPrompt) {
      console.log('No stored prompt found, generating new one...');
      const generatedPrompt = await generateStoryPrompt(sessionId);
      if (!generatedPrompt) {
        console.error('Failed to generate story prompt');
        return null;
      }
      storyPrompt = { finalPrompt: generatedPrompt };
    } else {
      storyPrompt = { finalPrompt: storyPrompt.finalPrompt };
    }

    // 3. Load the corresponding story
    const story = await Story.findById(session.storyId);
    if (!story) {
      console.error('Story not found:', session.storyId);
      return null;
    }

    // 4. Pick a random opening beat
    const openingBeats = story.storyrunner?.openingBeats || [];
    const randomOpeningBeat = openingBeats.length > 0 
      ? openingBeats[Math.floor(Math.random() * openingBeats.length)]
      : 'The story begins with an unexpected turn of events.';

    console.log(`Selected opening beat: ${randomOpeningBeat}`);

    // 5. Format the prompt for OpenAI
    const userPrompt = formatFirstChapterPrompt(story, randomOpeningBeat);

    // 6. Call OpenAI Chat API
    const completion = await openai.chat.completions.create({
      model: process.env.OPENAI_MODEL || 'gpt-4',
      messages: [
        {
          role: 'system',
          content: storyPrompt.finalPrompt
        },
        {
          role: 'user',
          content: userPrompt
        }
      ],
      max_tokens: 1500,
      temperature: 0.8,
      presence_penalty: 0.1,
      frequency_penalty: 0.1
    });

    const aiResponse = completion.choices[0]?.message?.content;
    if (!aiResponse) {
      console.error('No response from OpenAI');
      return null;
    }

    console.log('✅ OpenAI response received');

    // 7. Parse and structure the response
    const chapterData = parseChapterResponse(aiResponse, story.title);
    if (!chapterData) {
      console.error('Failed to parse chapter response');
      return null;
    }

    // 8. Save result to chapters collection
    const chapter = new Chapter({
      sessionId: sessionId,
      chapterIndex: 1,
      storyPromptUsed: storyPrompt.finalPrompt,
      openingBeat: randomOpeningBeat,
      title: chapterData.title,
      content: chapterData.content,
      choices: chapterData.choices
    });

    const savedChapter = await chapter.save();
    console.log(`✅ Chapter saved with ID: ${savedChapter._id}`);

    // 9. Update session with current chapter
    session.currentChapter = 1;
    session.chaptersGenerated = 1;
    session.lastActivityAt = new Date();
    await session.save();

    // 10. Return chapter data
    return {
      id: savedChapter._id,
      sessionId: savedChapter.sessionId,
      chapterIndex: savedChapter.chapterIndex,
      title: savedChapter.title,
      content: savedChapter.content,
      choices: savedChapter.choices,
      openingBeat: savedChapter.openingBeat,
      createdAt: savedChapter.createdAt
    };

  } catch (error) {
    console.error('Error generating first chapter:', error);
    return null;
  }
}

/**
 * Formats the user prompt for the first chapter
 * @param {Object} story - The story object
 * @param {string} openingBeat - The selected opening beat
 * @returns {string} - Formatted prompt
 */
function formatFirstChapterPrompt(story, openingBeat) {
  return `Create the first chapter of "${story.title}" by ${story.authorName || 'Unknown Author'}.

Story Description: ${story.description || 'No description available'}

Opening Beat: ${openingBeat}

Please create a compelling first chapter that:
1. Introduces the main character(s) and setting
2. Establishes the tone and atmosphere
3. Creates intrigue and hooks the reader
4. Ends with 2-4 meaningful choices for the reader

Format your response as follows:

TITLE: [Chapter Title]

CONTENT: [Chapter content - 300-800 words]

CHOICES:
1. [First choice option]
2. [Second choice option]
3. [Third choice option - optional]
4. [Fourth choice option - optional]

Make sure the choices are meaningful and lead to different story paths.`;
}

/**
 * Parses the AI response into structured chapter data
 * @param {string} response - The AI response
 * @param {string} storyTitle - The story title
 * @returns {Object|null} - Parsed chapter data or null if failed
 */
function parseChapterResponse(response, storyTitle) {
  try {
    // Extract title
    const titleMatch = response.match(/TITLE:\s*(.+?)(?:\n|$)/i);
    const title = titleMatch ? titleMatch[1].trim() : `Chapter 1: ${storyTitle}`;

    // Extract content
    const contentMatch = response.match(/CONTENT:\s*([\s\S]+?)(?=CHOICES:|$)/i);
    const content = contentMatch ? contentMatch[1].trim() : response;

    // Extract choices
    const choicesMatch = response.match(/CHOICES:\s*([\s\S]+?)$/i);
    const choicesText = choicesMatch ? choicesMatch[1] : '';
    
    const choices = [];
    const choiceLines = choicesText.split('\n').filter(line => line.trim());
    
    for (const line of choiceLines) {
      const match = line.match(/^\d+\.\s*(.+)$/);
      if (match) {
        choices.push({
          text: match[1].trim(),
          nextChapterId: null
        });
      }
    }

    // Ensure we have at least 2 choices
    if (choices.length < 2) {
      choices.push(
        { text: 'Continue the story', nextChapterId: null },
        { text: 'Take a different approach', nextChapterId: null }
      );
    }

    // Limit to 4 choices maximum
    if (choices.length > 4) {
      choices.splice(4);
    }

    return {
      title,
      content,
      choices
    };

  } catch (error) {
    console.error('Error parsing chapter response:', error);
    return null;
  }
}

/**
 * Generates a subsequent chapter based on user choice
 * @param {string} sessionId - The session ID
 * @param {string} previousChapterId - The previous chapter ID
 * @param {number} choiceIndex - The index of the chosen option
 * @returns {Promise<Object|null>} - New chapter data or null if failed
 */
export async function generateNextChapter(sessionId, previousChapterId, choiceIndex) {
  try {
    console.log(`🎭 Generating next chapter for session: ${sessionId}, choice: ${choiceIndex}`);

    // Get the previous chapter
    const previousChapter = await Chapter.findById(previousChapterId);
    if (!previousChapter) {
      console.error('Previous chapter not found:', previousChapterId);
      return null;
    }

    // Validate choice index
    if (choiceIndex < 0 || choiceIndex >= previousChapter.choices.length) {
      console.error('Invalid choice index:', choiceIndex);
      return null;
    }

    // Get session and story
    const session = await UserStorySession.findById(sessionId);
    const story = await Story.findById(session.storyId);
    
    if (!session || !story) {
      console.error('Session or story not found');
      return null;
    }

    // Get system prompt
    let storyPrompt = await StoryPrompt.findBySessionId(sessionId);
    if (!storyPrompt) {
      console.error('System prompt not found for session');
      return null;
    }

    // Get next chapter index
    const chapterCount = await Chapter.getChapterCount(sessionId);
    const nextChapterIndex = chapterCount + 1;

    // Format prompt for next chapter
    const userPrompt = formatNextChapterPrompt(
      story,
      previousChapter,
      choiceIndex,
      nextChapterIndex
    );

    // Call OpenAI
    const completion = await openai.chat.completions.create({
      model: process.env.OPENAI_MODEL || 'gpt-4',
      messages: [
        {
          role: 'system',
          content: storyPrompt.finalPrompt
        },
        {
          role: 'user',
          content: userPrompt
        }
      ],
      max_tokens: 1500,
      temperature: 0.8,
      presence_penalty: 0.1,
      frequency_penalty: 0.1
    });

    const aiResponse = completion.choices[0]?.message?.content;
    if (!aiResponse) {
      console.error('No response from OpenAI');
      return null;
    }

    // Parse response
    const chapterData = parseChapterResponse(aiResponse, story.title);
    if (!chapterData) {
      console.error('Failed to parse chapter response');
      return null;
    }

    // Save new chapter
    const newChapter = new Chapter({
      sessionId: sessionId,
      chapterIndex: nextChapterIndex,
      storyPromptUsed: storyPrompt.finalPrompt,
      openingBeat: `Based on choice: ${previousChapter.choices[choiceIndex].text}`,
      title: chapterData.title,
      content: chapterData.content,
      choices: chapterData.choices
    });

    const savedChapter = await newChapter.save();

    // Update previous chapter choice with next chapter ID
    await previousChapter.updateChoice(choiceIndex, savedChapter._id);

    // Update session
    session.currentChapter = nextChapterIndex;
    session.chaptersGenerated = nextChapterIndex;
    session.lastActivityAt = new Date();
    await session.save();

    return {
      id: savedChapter._id,
      sessionId: savedChapter.sessionId,
      chapterIndex: savedChapter.chapterIndex,
      title: savedChapter.title,
      content: savedChapter.content,
      choices: savedChapter.choices,
      openingBeat: savedChapter.openingBeat,
      createdAt: savedChapter.createdAt
    };

  } catch (error) {
    console.error('Error generating next chapter:', error);
    return null;
  }
}

/**
 * Formats the user prompt for subsequent chapters
 * @param {Object} story - The story object
 * @param {Object} previousChapter - The previous chapter
 * @param {number} choiceIndex - The chosen option index
 * @param {number} chapterIndex - The new chapter index
 * @returns {string} - Formatted prompt
 */
function formatNextChapterPrompt(story, previousChapter, choiceIndex, chapterIndex) {
  const chosenOption = previousChapter.choices[choiceIndex].text;
  
  return `Continue the story "${story.title}" based on the reader's choice.

Previous Chapter: "${previousChapter.title}"
Previous Chapter Content: ${previousChapter.content.substring(0, 500)}...

Reader's Choice: ${chosenOption}

Please create Chapter ${chapterIndex} that:
1. Naturally follows from the reader's choice
2. Continues the narrative flow
3. Introduces new challenges or developments
4. Maintains consistency with the story's tone and characters
5. Ends with 2-4 meaningful choices for the reader

Format your response as follows:

TITLE: [Chapter Title]

CONTENT: [Chapter content - 300-800 words]

CHOICES:
1. [First choice option]
2. [Second choice option]
3. [Third choice option - optional]
4. [Fourth choice option - optional]

Make sure the choices are meaningful and lead to different story paths.`;
}
