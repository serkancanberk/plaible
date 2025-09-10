// src/utils/validation.js
// Utility functions for validating story data

import { MAIN_CATEGORIES, LANGUAGES, CONTENT_RATINGS, LICENSES, STORY_STATUS, AGE_GROUPS } from '../config/categoryEnums.js';

/**
 * Validate enum field values
 * @param {Object} data - The data object to validate
 * @param {Object} fieldValidators - Object mapping field names to their allowed values
 * @returns {Object} - { isValid: boolean, errors: string[] }
 */
export function validateEnumFields(data, fieldValidators) {
  const errors = [];
  
  for (const [field, allowedValues] of Object.entries(fieldValidators)) {
    if (data[field] && !allowedValues.includes(data[field])) {
      errors.push(`Invalid ${field}: ${data[field]}. Must be one of: ${allowedValues.join(', ')}`);
    }
  }
  
  return {
    isValid: errors.length === 0,
    errors
  };
}

/**
 * Validate story data with all enum fields
 * @param {Object} storyData - The story data to validate
 * @returns {Object} - { isValid: boolean, errors: string[] }
 */
export function validateStoryEnums(storyData) {
  const fieldValidators = {
    mainCategory: MAIN_CATEGORIES,
    language: LANGUAGES,
    license: LICENSES,
    contentRating: CONTENT_RATINGS,
    // Add more fields as needed
  };
  
  return validateEnumFields(storyData, fieldValidators);
}

/**
 * Validate array field
 * @param {any} value - The value to validate
 * @param {string} fieldName - The name of the field for error messages
 * @returns {Object} - { isValid: boolean, error?: string }
 */
export function validateArrayField(value, fieldName) {
  if (value && !Array.isArray(value)) {
    return {
      isValid: false,
      error: `${fieldName} must be an array`
    };
  }
  
  // 🔹 Backend validation: Check if genres array is empty
  if (fieldName === 'genres' && Array.isArray(value) && value.length === 0) {
    return {
      isValid: false,
      error: 'At least one genre must be selected.'
    };
  }
  
  return { isValid: true };
}

/**
 * Validate required fields
 * @param {Object} data - The data object to validate
 * @param {string[]} requiredFields - Array of required field names
 * @returns {Object} - { isValid: boolean, errors: string[] }
 */
export function validateRequiredFields(data, requiredFields) {
  const errors = [];
  
  for (const field of requiredFields) {
    if (!data[field]) {
      errors.push(`Missing required field: ${field}`);
    }
  }
  
  return {
    isValid: errors.length === 0,
    errors
  };
}
