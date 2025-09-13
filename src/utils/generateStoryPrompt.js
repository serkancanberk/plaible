// src/utils/generateStoryPrompt.js
// Utility function to dynamically generate story prompts for user story sessions

import mongoose from 'mongoose';
import { UserStorySession } from '../../models/UserStorySession.js';
import { Story } from '../../models/Story.js';
import { StorySettings } from '../../models/StorySettings.js';

/**
 * Generates a dynamic system prompt for a user's story session
 * @param {string} sessionId - The ObjectId of the user story session
 * @returns {Promise<string|null>} - The generated system prompt or null if data is missing
 */
export async function generateStoryPrompt(sessionId) {
  try {
    // Validate sessionId
    if (!sessionId || !mongoose.Types.ObjectId.isValid(sessionId)) {
      console.error('Invalid sessionId provided:', sessionId);
      return null;
    }

    // Load the user story session
    const session = await UserStorySession.findById(sessionId);
    if (!session) {
      console.error('User story session not found:', sessionId);
      return null;
    }

    // Load the associated story
    const story = await Story.findById(session.storyId);
    if (!story) {
      console.error('Story not found:', session.storyId);
      return null;
    }

    // Get the story settings to fetch tone and time flavor details
    const storySettings = await StorySettings.getDefaultSettings();
    if (!storySettings) {
      console.error('Story settings not found');
      return null;
    }

    // Find the selected tone style and time flavor
    const selectedToneStyle = storySettings.tone_styles.find(
      style => style.id === session.toneStyleId
    );
    const selectedTimeFlavor = storySettings.time_flavors.find(
      flavor => flavor.id === session.timeFlavorId
    );

    if (!selectedToneStyle) {
      console.error('Tone style not found:', session.toneStyleId);
      return null;
    }

    if (!selectedTimeFlavor) {
      console.error('Time flavor not found:', session.timeFlavorId);
      return null;
    }

    // Get the base prompt from the story
    const basePrompt = story.storyrunner?.storyPrompt;
    if (!basePrompt) {
      console.error('Base system prompt not found in story:', session.storyId);
      return null;
    }

    // Generate the final system prompt by interpolating placeholders
    const finalPrompt = interpolatePrompt(basePrompt, {
      TONE_STYLE: selectedToneStyle.displayLabel,
      TIME_FLAVOR: selectedTimeFlavor.displayLabel,
      TONE_DESCRIPTION: selectedToneStyle.description || '',
      TIME_DESCRIPTION: selectedTimeFlavor.description || '',
      STORY_TITLE: story.title,
      AUTHOR_NAME: story.authorName || 'Unknown Author',
      STORY_DESCRIPTION: story.description || '',
      OPENING_BEATS: formatOpeningBeats(story.storyrunner?.openingBeats || []),
      SAFETY_GUARDRAILS: formatGuardrails(story.storyrunner?.guardrails || [])
    });

    return finalPrompt;

  } catch (error) {
    console.error('Error generating system prompt:', error);
    return null;
  }
}

/**
 * Interpolates placeholders in a prompt template
 * @param {string} template - The prompt template with placeholders
 * @param {Object} replacements - Object mapping placeholder names to values
 * @returns {string} - The interpolated prompt
 */
function interpolatePrompt(template, replacements) {
  let result = template;
  
  // Replace all placeholders in the format {{PLACEHOLDER}}
  for (const [key, value] of Object.entries(replacements)) {
    const placeholder = `{{${key}}}`;
    result = result.replace(new RegExp(placeholder, 'g'), value);
  }
  
  // Clean up any remaining placeholders that weren't replaced
  result = result.replace(/\{\{[^}]+\}\}/g, '[MISSING_DATA]');
  
  return result;
}

/**
 * Formats opening beats into a readable string
 * @param {string[]} openingBeats - Array of opening beat strings
 * @returns {string} - Formatted opening beats
 */
function formatOpeningBeats(openingBeats) {
  if (!openingBeats || openingBeats.length === 0) {
    return 'No specific opening beats defined.';
  }
  
  return openingBeats
    .map((beat, index) => `${index + 1}. ${beat}`)
    .join('\n');
}

/**
 * Formats guardrails into a readable string
 * @param {string[]} guardrails - Array of guardrail strings
 * @returns {string} - Formatted guardrails
 */
function formatGuardrails(guardrails) {
  if (!guardrails || guardrails.length === 0) {
    return 'No specific safety guardrails defined.';
  }
  
  return guardrails
    .map((guardrail, index) => `${index + 1}. ${guardrail}`)
    .join('\n');
}

/**
 * Generates a system prompt for a new session (without existing sessionId)
 * @param {string} storyId - The story ID
 * @param {string} toneStyleId - The tone style ID
 * @param {string} timeFlavorId - The time flavor ID
 * @returns {Promise<string|null>} - The generated system prompt or null if data is missing
 */
export async function generateStoryPromptForNewSession(storyId, toneStyleId, timeFlavorId) {
  try {
    // Validate inputs
    if (!storyId || !toneStyleId || !timeFlavorId) {
      console.error('Missing required parameters:', { storyId, toneStyleId, timeFlavorId });
      return null;
    }

    // Load the story
    const story = await Story.findById(storyId);
    if (!story) {
      console.error('Story not found:', storyId);
      return null;
    }

    // Get the story settings
    const storySettings = await StorySettings.getDefaultSettings();
    if (!storySettings) {
      console.error('Story settings not found');
      return null;
    }

    // Find the selected tone style and time flavor
    const selectedToneStyle = storySettings.tone_styles.find(
      style => style.id === toneStyleId
    );
    const selectedTimeFlavor = storySettings.time_flavors.find(
      flavor => flavor.id === timeFlavorId
    );

    if (!selectedToneStyle) {
      console.error('Tone style not found:', toneStyleId);
      return null;
    }

    if (!selectedTimeFlavor) {
      console.error('Time flavor not found:', timeFlavorId);
      return null;
    }

    // Get the base prompt from the story
    const basePrompt = story.storyrunner?.storyPrompt;
    if (!basePrompt) {
      console.error('Base system prompt not found in story:', storyId);
      return null;
    }

    // Generate the final system prompt
    const finalPrompt = interpolatePrompt(basePrompt, {
      TONE_STYLE: selectedToneStyle.displayLabel,
      TIME_FLAVOR: selectedTimeFlavor.displayLabel,
      TONE_DESCRIPTION: selectedToneStyle.description || '',
      TIME_DESCRIPTION: selectedTimeFlavor.description || '',
      STORY_TITLE: story.title,
      AUTHOR_NAME: story.authorName || 'Unknown Author',
      STORY_DESCRIPTION: story.description || '',
      OPENING_BEATS: formatOpeningBeats(story.storyrunner?.openingBeats || []),
      SAFETY_GUARDRAILS: formatGuardrails(story.storyrunner?.guardrails || [])
    });

    return finalPrompt;

  } catch (error) {
    console.error('Error generating system prompt for new session:', error);
    return null;
  }
}

/**
 * Validates that a system prompt can be generated for the given parameters
 * @param {string} storyId - The story ID
 * @param {string} toneStyleId - The tone style ID
 * @param {string} timeFlavorId - The time flavor ID
 * @returns {Promise<Object>} - Validation result with isValid boolean and errors array
 */
export async function validateStoryPromptGeneration(storyId, toneStyleId, timeFlavorId) {
  const errors = [];
  
  try {
    // Check if story exists
    const story = await Story.findById(storyId);
    if (!story) {
      errors.push(`Story not found: ${storyId}`);
    } else if (!story.storyrunner?.storyPrompt) {
      errors.push(`Story has no base system prompt: ${storyId}`);
    }

    // Check if tone style is valid
    const isValidTone = await StorySettings.isValidToneStyle(toneStyleId);
    if (!isValidTone) {
      errors.push(`Invalid tone style: ${toneStyleId}`);
    }

    // Check if time flavor is valid
    const isValidTime = await StorySettings.isValidTimeFlavor(timeFlavorId);
    if (!isValidTime) {
      errors.push(`Invalid time flavor: ${timeFlavorId}`);
    }

    return {
      isValid: errors.length === 0,
      errors
    };

  } catch (error) {
    return {
      isValid: false,
      errors: [`Validation error: ${error.message}`]
    };
  }
}
