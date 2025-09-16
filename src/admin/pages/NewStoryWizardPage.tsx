// src/admin/pages/NewStoryWizardPage.tsx
import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useToast } from '../components/Toast';
import { Spinner } from '../components/Spinner';
import { adminApi } from '../api';

interface FormData {
  title: string;
  authorName: string;
  publishedYear: number;
  mainCategory: 'book' | 'story' | 'biography';
}

const currentYear = new Date().getFullYear();

export const NewStoryWizardPage: React.FC = () => {
  const navigate = useNavigate();
  const { showToast } = useToast();
  const [step, setStep] = useState<1 | 2>(1);
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState<FormData>({
    title: '',
    authorName: '',
    publishedYear: currentYear,
    mainCategory: 'book'
  });
  const [jsonEditorValue, setJsonEditorValue] = useState('');
  const [lastGeneratedJSON, setLastGeneratedJSON] = useState<any>(null);
  const [validationErrors, setValidationErrors] = useState<string[]>([]);
  const [errors, setErrors] = useState<Partial<FormData>>({});
  const [complianceResult, setComplianceResult] = useState<{
    isCompliant: boolean;
    issues: string[];
    score: number;
  } | null>(null);

  // Form validation
  const validateForm = (): boolean => {
    const newErrors: Partial<FormData> = {};

    if (!formData.title.trim()) {
      newErrors.title = 'Title is required';
    }

    if (!formData.authorName.trim()) {
      newErrors.authorName = 'Author name is required';
    }

    if (!formData.publishedYear || formData.publishedYear < 1800 || formData.publishedYear > currentYear) {
      newErrors.publishedYear = `Published year must be between 1800 and ${currentYear}`;
    }

    if (!formData.mainCategory) {
      newErrors.mainCategory = 'Main category is required';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  // Check if form is valid for enabling the Generate button
  const isFormValid = formData.title.trim() && 
                     formData.authorName.trim() && 
                     formData.publishedYear >= 1800 && 
                     formData.publishedYear <= currentYear && 
                     formData.mainCategory;

  const handleInputChange = (field: keyof FormData, value: string | number) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    // Clear error when user starts typing
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: undefined }));
    }
  };

  const validateJSON = (jsonString: string): { isValid: boolean; errors: string[]; parsed?: any } => {
    const errors: string[] = [];
    
    try {
      const parsed = JSON.parse(jsonString);
      
      // Basic structure validation
      const requiredFields = [
        '_id', 'slug', 'mainCategory', 'subCategory', 'title', 'authorName', 
        'genres', 'storySettingTime', 'publishedYear', 'headline', 'description',
        'language', 'license', 'contentRating', 'tags', 'assets', 'characters',
        'roles', 'cast', 'hooks', 'summary', 'funFacts', 'stats', 'share',
        'feedbacks', 'pricing', 'relatedStoryIds', 'reengagementTemplates',
        'storyrunner', 'createdAt', 'updatedAt', 'isActive'
      ];
      
      const missingFields = requiredFields.filter(field => !(field in parsed));
      if (missingFields.length > 0) {
        errors.push(`Missing required fields: ${missingFields.join(', ')}`);
      }
      
      // Validate specific structures
      if (parsed.characters && !Array.isArray(parsed.characters)) {
        errors.push('characters must be an array');
      }
      
      if (parsed.roles && !Array.isArray(parsed.roles)) {
        errors.push('roles must be an array');
      }
      
      if (parsed.cast && !Array.isArray(parsed.cast)) {
        errors.push('cast must be an array');
      }
      
      if (parsed.storyrunner && typeof parsed.storyrunner !== 'object') {
        errors.push('storyrunner must be an object');
      }
      
      // Validate role IDs
      if (parsed.roles && parsed.cast) {
        const roleIds = new Set(parsed.roles.map((r: any) => r.id));
        const characterIds = new Set(parsed.characters?.map((c: any) => c.id) || []);
        
        for (const castItem of parsed.cast) {
          if (!characterIds.has(castItem.characterId)) {
            errors.push(`cast references unknown character: ${castItem.characterId}`);
          }
          for (const roleId of castItem.roleIds || []) {
            if (!roleIds.has(roleId)) {
              errors.push(`cast references unknown role: ${roleId}`);
            }
          }
        }
      }
      
      return { isValid: errors.length === 0, errors, parsed };
    } catch (error) {
      return { isValid: false, errors: ['Invalid JSON syntax'] };
    }
  };

  const handleGenerate = async () => {
    if (!validateForm()) {
      showToast('Please fix the form errors before generating', 'error');
      return;
    }

    setLoading(true);
    try {
      console.log('🎭 Generating story DB JSON:', formData);
      
      const response = await adminApi.generateStoryDBJSON(formData);
      
      if (response?.ok && response.story) {
        const jsonString = JSON.stringify(response.story, null, 2);
        setJsonEditorValue(jsonString);
        setLastGeneratedJSON(response.story);
        setStep(2);
        setValidationErrors([]);
        showToast('Story JSON generated successfully!', 'success');
        // Validate compliance automatically
        await validateCompliance(response.story);
      } else {
        throw new Error(response?.error || 'Failed to generate story JSON');
      }
    } catch (error: any) {
      console.error('❌ Story generation failed:', error);
      showToast(
        error?.message || 'Failed to generate story JSON. Please try again.',
        'error'
      );
    } finally {
      setLoading(false);
    }
  };

  const handleRegenerate = async () => {
    if (!window.confirm('Regenerating will replace the JSON in the editor. Continue?')) {
      return;
    }

    setLoading(true);
    try {
      console.log('🔄 Regenerating story DB JSON:', formData);
      
      const response = await adminApi.generateStoryDBJSON(formData);
      
      if (response?.ok && response.story) {
        const jsonString = JSON.stringify(response.story, null, 2);
        setJsonEditorValue(jsonString);
        setLastGeneratedJSON(response.story);
        setValidationErrors([]);
        showToast('Story JSON regenerated successfully!', 'success');
        // Validate compliance automatically
        await validateCompliance(response.story);
      } else {
        throw new Error(response?.error || 'Failed to regenerate story JSON');
      }
    } catch (error: any) {
      console.error('❌ Story regeneration failed:', error);
      showToast(
        error?.message || 'Failed to regenerate story JSON. Please try again.',
        'error'
      );
    } finally {
      setLoading(false);
    }
  };

  const validateCompliance = async (storyData: any) => {
    try {
      const response = await adminApi.validateStoryCompliance(storyData);
      if (response?.ok && response.validation) {
        const score = 11 - response.validation.issues.length;
        setComplianceResult({
          isCompliant: response.validation.isCompliant,
          issues: response.validation.issues,
          score: Math.max(0, score)
        });
      }
    } catch (error) {
      console.error('Compliance validation failed:', error);
    }
  };

  const handleValidateJSON = async () => {
    const validation = validateJSON(jsonEditorValue);
    setValidationErrors(validation.errors);
    
    if (validation.isValid && validation.parsed) {
      showToast('JSON is valid!', 'success');
      // Also validate compliance
      await validateCompliance(validation.parsed);
    } else {
      showToast(`JSON validation failed: ${validation.errors.length} error(s)`, 'error');
      setComplianceResult(null);
    }
  };

  const handleConfirm = async () => {
    const validation = validateJSON(jsonEditorValue);
    
    if (!validation.isValid) {
      setValidationErrors(validation.errors);
      showToast('Please fix JSON validation errors before saving', 'error');
      return;
    }

    setLoading(true);
    try {
      console.log('💾 Saving story from JSON:', validation.parsed);
      
      const response = await adminApi.createStoryFromDBJSON(validation.parsed);
      
      if (response?.ok && response.storyId) {
        showToast('Story saved successfully!', 'success');
        // Navigate to the story prompt edit page
        navigate(`/storyrunner/prompts/edit/${response.storyId}`);
      } else {
        throw new Error(response?.error || 'Failed to save story');
      }
    } catch (error: any) {
      console.error('❌ Story save failed:', error);
      showToast(
        error?.message || 'Failed to save story. Please try again.',
        'error'
      );
    } finally {
      setLoading(false);
    }
  };

  const handleCancel = () => {
    navigate('/storyrunner');
  };

  const handleBackToForm = () => {
    setStep(1);
    setComplianceResult(null);
  };

  const isJSONValid = validationErrors.length === 0 && jsonEditorValue.trim() !== '';

  return (
    <div className="p-6">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">New Story Wizard</h1>
          <p className="text-gray-600">
            Create a new story with AI-powered content generation. Provide minimal information and let our AI generate a complete database-ready JSON document.
          </p>
        </div>

        {/* Step Indicator */}
        <div className="mb-8">
          <div className="flex items-center justify-center space-x-4">
            <div className={`flex items-center ${step >= 1 ? 'text-blue-600' : 'text-gray-400'}`}>
              <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium ${
                step >= 1 ? 'bg-blue-600 text-white' : 'bg-gray-200 text-gray-500'
              }`}>
                1
              </div>
              <span className="ml-2 text-sm font-medium">Basic Info</span>
            </div>
            <div className={`w-8 h-0.5 ${step >= 2 ? 'bg-blue-600' : 'bg-gray-200'}`} />
            <div className={`flex items-center ${step >= 2 ? 'text-blue-600' : 'text-gray-400'}`}>
              <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium ${
                step >= 2 ? 'bg-blue-600 text-white' : 'bg-gray-200 text-gray-500'
              }`}>
                2
              </div>
              <span className="ml-2 text-sm font-medium">DB JSON Preview</span>
            </div>
          </div>
        </div>

        {/* Step 1: Form */}
        {step === 1 && (
          <div className="bg-white rounded-lg shadow-lg p-8">
            <div className="space-y-6">
              {/* Title Field */}
              <div>
                <label htmlFor="title" className="block text-sm font-medium text-gray-700 mb-2">
                  Story Title *
                </label>
                <input
                  type="text"
                  id="title"
                  value={formData.title}
                  onChange={(e) => handleInputChange('title', e.target.value)}
                  className={`w-full px-3 py-2 border rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${
                    errors.title ? 'border-red-300' : 'border-gray-300'
                  }`}
                  placeholder="Enter the story title"
                  disabled={loading}
                />
                {errors.title && (
                  <p className="mt-1 text-sm text-red-600">{errors.title}</p>
                )}
              </div>

              {/* Author Name Field */}
              <div>
                <label htmlFor="authorName" className="block text-sm font-medium text-gray-700 mb-2">
                  Author Name *
                </label>
                <input
                  type="text"
                  id="authorName"
                  value={formData.authorName}
                  onChange={(e) => handleInputChange('authorName', e.target.value)}
                  className={`w-full px-3 py-2 border rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${
                    errors.authorName ? 'border-red-300' : 'border-gray-300'
                  }`}
                  placeholder="Enter the author's name"
                  disabled={loading}
                />
                {errors.authorName && (
                  <p className="mt-1 text-sm text-red-600">{errors.authorName}</p>
                )}
              </div>

              {/* Published Year Field */}
              <div>
                <label htmlFor="publishedYear" className="block text-sm font-medium text-gray-700 mb-2">
                  Published Year *
                </label>
                <input
                  type="number"
                  id="publishedYear"
                  value={formData.publishedYear}
                  onChange={(e) => handleInputChange('publishedYear', parseInt(e.target.value) || currentYear)}
                  min="1800"
                  max={currentYear}
                  className={`w-full px-3 py-2 border rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${
                    errors.publishedYear ? 'border-red-300' : 'border-gray-300'
                  }`}
                  placeholder="Enter publication year"
                  disabled={loading}
                />
                {errors.publishedYear && (
                  <p className="mt-1 text-sm text-red-600">{errors.publishedYear}</p>
                )}
                <p className="mt-1 text-xs text-gray-500">
                  Must be between 1800 and {currentYear}
                </p>
              </div>

              {/* Main Category Field */}
              <div>
                <label htmlFor="mainCategory" className="block text-sm font-medium text-gray-700 mb-2">
                  Main Category *
                </label>
                <select
                  id="mainCategory"
                  value={formData.mainCategory}
                  onChange={(e) => handleInputChange('mainCategory', e.target.value as 'book' | 'story' | 'biography')}
                  className={`w-full px-3 py-2 border rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${
                    errors.mainCategory ? 'border-red-300' : 'border-gray-300'
                  }`}
                  disabled={loading}
                >
                  <option value="book">Book</option>
                  <option value="story">Story</option>
                  <option value="biography">Biography</option>
                </select>
                {errors.mainCategory && (
                  <p className="mt-1 text-sm text-red-600">{errors.mainCategory}</p>
                )}
              </div>

              {/* Info Box */}
              <div className="bg-blue-50 border border-blue-200 rounded-md p-4">
                <div className="flex">
                  <div className="flex-shrink-0">
                    <svg className="h-5 w-5 text-blue-400" viewBox="0 0 20 20" fill="currentColor">
                      <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
                    </svg>
                  </div>
                  <div className="ml-3">
                    <h3 className="text-sm font-medium text-blue-800">
                      AI-Powered Generation
                    </h3>
                    <div className="mt-2 text-sm text-blue-700">
                      <p>
                        Our AI will generate a complete database-ready JSON document including:
                      </p>
                      <ul className="mt-1 list-disc list-inside space-y-1">
                        <li>Complete Story schema with all required fields</li>
                        <li>Characters, roles, and cast mappings</li>
                        <li>StoryRunner prompts and guardrails</li>
                        <li>Interactive content focused on player choices</li>
                      </ul>
                    </div>
                  </div>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex justify-end space-x-4 pt-6 border-t border-gray-200">
                <button
                  type="button"
                  onClick={handleCancel}
                  className="px-6 py-2 border border-gray-300 rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
                  disabled={loading}
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={handleGenerate}
                  disabled={!isFormValid || loading}
                  className="px-6 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed flex items-center space-x-2"
                >
                  {loading ? (
                    <>
                      <Spinner size="sm" className="text-white" />
                      <span>Generating...</span>
                    </>
                  ) : (
                    <span>Generate Story</span>
                  )}
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Step 2: JSON Editor */}
        {step === 2 && (
          <div className="space-y-6">
            {/* Plaible Compliance Meter */}
            {complianceResult && (
              <div className="bg-white rounded-lg shadow-lg p-6">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-lg font-semibold text-gray-900">Plaible Compliance Checklist</h3>
                  <div className={`px-3 py-1 rounded-full text-sm font-medium ${
                    complianceResult.score === 11 
                      ? 'bg-green-100 text-green-800' 
                      : complianceResult.score >= 9 
                        ? 'bg-yellow-100 text-yellow-800'
                        : 'bg-red-100 text-red-800'
                  }`}>
                    {complianceResult.score === 11 ? '✅' : complianceResult.score >= 9 ? '⚠️' : '❌'} {complianceResult.score}/11 Passed
                  </div>
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-sm">
                  {/* Checklist Items */}
                  <div className="space-y-2">
                    <div className="flex items-center space-x-2">
                      <span className={complianceResult.issues.some(issue => issue.includes('generic character names')) ? 'text-red-500' : 'text-green-500'}>
                        {complianceResult.issues.some(issue => issue.includes('generic character names')) ? '❌' : '✅'}
                      </span>
                      <span className="text-gray-700">Canonical Characters</span>
                    </div>
                    <div className="flex items-center space-x-2">
                      <span className={complianceResult.issues.some(issue => issue.includes('character count')) ? 'text-red-500' : 'text-green-500'}>
                        {complianceResult.issues.some(issue => issue.includes('character count')) ? '❌' : '✅'}
                      </span>
                      <span className="text-gray-700">4+ Characters</span>
                    </div>
                    <div className="flex items-center space-x-2">
                      <span className={complianceResult.issues.some(issue => issue.includes('roles structure')) ? 'text-red-500' : 'text-green-500'}>
                        {complianceResult.issues.some(issue => issue.includes('roles structure')) ? '❌' : '✅'}
                      </span>
                      <span className="text-gray-700">Roles & Cast Mapping</span>
                    </div>
                    <div className="flex items-center space-x-2">
                      <span className={complianceResult.issues.some(issue => issue.includes('generic genres')) ? 'text-red-500' : 'text-green-500'}>
                        {complianceResult.issues.some(issue => issue.includes('generic genres')) ? '❌' : '✅'}
                      </span>
                      <span className="text-gray-700">Thematic Genres</span>
                    </div>
                    <div className="flex items-center space-x-2">
                      <span className={complianceResult.issues.some(issue => issue.includes('storySettingTime')) ? 'text-red-500' : 'text-green-500'}>
                        {complianceResult.issues.some(issue => issue.includes('storySettingTime')) ? '❌' : '✅'}
                      </span>
                      <span className="text-gray-700">Specific Time Setting</span>
                    </div>
                    <div className="flex items-center space-x-2">
                      <span className={complianceResult.issues.some(issue => issue.includes('summary structure')) ? 'text-red-500' : 'text-green-500'}>
                        {complianceResult.issues.some(issue => issue.includes('summary structure')) ? '❌' : '✅'}
                      </span>
                      <span className="text-gray-700">Complete Summary</span>
                    </div>
                  </div>
                  
                  <div className="space-y-2">
                    <div className="flex items-center space-x-2">
                      <span className={complianceResult.issues.some(issue => issue.includes('funFacts structure')) ? 'text-red-500' : 'text-green-500'}>
                        {complianceResult.issues.some(issue => issue.includes('funFacts structure')) ? '❌' : '✅'}
                      </span>
                      <span className="text-gray-700">Fun Facts Structure</span>
                    </div>
                    <div className="flex items-center space-x-2">
                      <span className={complianceResult.issues.some(issue => issue.includes('reengagement templates')) ? 'text-red-500' : 'text-green-500'}>
                        {complianceResult.issues.some(issue => issue.includes('reengagement templates')) ? '❌' : '✅'}
                      </span>
                      <span className="text-gray-700">Character Voice Templates</span>
                    </div>
                    <div className="flex items-center space-x-2">
                      <span className={complianceResult.issues.some(issue => issue.includes('StoryRunner structure')) ? 'text-red-500' : 'text-green-500'}>
                        {complianceResult.issues.some(issue => issue.includes('StoryRunner structure')) ? '❌' : '✅'}
                      </span>
                      <span className="text-gray-700">Complete StoryRunner</span>
                    </div>
                    <div className="flex items-center space-x-2">
                      <span className={complianceResult.issues.some(issue => issue.includes('Setting field does not match')) ? 'text-red-500' : 'text-green-500'}>
                        {complianceResult.issues.some(issue => issue.includes('Setting field does not match')) ? '❌' : '✅'}
                      </span>
                      <span className="text-gray-700">Setting Consistency</span>
                    </div>
                    <div className="flex items-center space-x-2">
                      <span className={complianceResult.issues.some(issue => issue.includes('kebab-case format')) ? 'text-red-500' : 'text-green-500'}>
                        {complianceResult.issues.some(issue => issue.includes('kebab-case format')) ? '❌' : '✅'}
                      </span>
                      <span className="text-gray-700">SubCategory Format</span>
                    </div>
                    <div className="flex items-center space-x-2">
                      <span className={complianceResult.issues.some(issue => issue.includes('highlights')) ? 'text-red-500' : 'text-green-500'}>
                        {complianceResult.issues.some(issue => issue.includes('highlights')) ? '❌' : '✅'}
                      </span>
                      <span className="text-gray-700">3+ Summary Highlights</span>
                    </div>
                  </div>
                </div>
                
                {/* Issues List */}
                {complianceResult.issues.length > 0 && (
                  <div className="mt-4 p-3 bg-red-50 border border-red-200 rounded-md">
                    <h4 className="text-sm font-medium text-red-800 mb-2">Compliance Issues:</h4>
                    <ul className="text-sm text-red-700 space-y-1">
                      {complianceResult.issues.map((issue, index) => (
                        <li key={index}>• {issue}</li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
            )}

            {/* JSON Editor Header */}
            <div className="bg-white rounded-lg shadow-lg p-6">
              <div className="flex justify-between items-start">
                <div>
                  <h2 className="text-2xl font-bold text-gray-900 mb-2">Database JSON Preview</h2>
                  <p className="text-gray-600">
                    This is your DB document. You can tweak the text values before saving.
                  </p>
                  <p className="text-sm text-gray-500 mt-1">
                    This JSON is the exact document that will be stored in the database. Edit text values if needed; keep keys and structure intact.
                  </p>
                </div>
                <button
                  type="button"
                  onClick={handleBackToForm}
                  className="px-4 py-2 text-sm text-gray-600 hover:text-gray-800 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 rounded-md"
                  disabled={loading}
                >
                  ← Back to Form
                </button>
              </div>
            </div>

            {/* JSON Editor */}
            <div className="bg-white rounded-lg shadow-lg p-6">
              <div className="mb-4">
                <label htmlFor="jsonEditor" className="block text-sm font-medium text-gray-700 mb-2">
                  Story JSON Document
                </label>
                <textarea
                  id="jsonEditor"
                  value={jsonEditorValue}
                  onChange={(e) => setJsonEditorValue(e.target.value)}
                  className="w-full h-96 px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 font-mono text-sm"
                  placeholder="JSON will appear here after generation..."
                  disabled={loading}
                />
              </div>

              {/* Validation Errors */}
              {validationErrors.length > 0 && (
                <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-md">
                  <h4 className="text-sm font-medium text-red-800 mb-2">Validation Errors:</h4>
                  <ul className="text-sm text-red-700 space-y-1">
                    {validationErrors.map((error, index) => (
                      <li key={index}>• {error}</li>
                    ))}
                  </ul>
                </div>
              )}

              {/* Action Buttons */}
              <div className="flex justify-between items-center">
                <button
                  type="button"
                  onClick={handleCancel}
                  className="px-6 py-2 text-gray-600 hover:text-gray-800 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 rounded-md"
                  disabled={loading}
                >
                  Cancel
                </button>
                <div className="flex space-x-4">
                  <button
                    type="button"
                    onClick={handleValidateJSON}
                    disabled={loading || !jsonEditorValue.trim()}
                    className="px-6 py-2 border border-gray-300 rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 disabled:opacity-50 disabled:cursor-not-allowed flex items-center space-x-2"
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    <span>Validate JSON</span>
                  </button>
                  <button
                    type="button"
                    onClick={handleRegenerate}
                    disabled={loading}
                    className="px-6 py-2 border border-gray-300 rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 disabled:opacity-50 disabled:cursor-not-allowed flex items-center space-x-2"
                  >
                    {loading ? (
                      <>
                        <Spinner size="sm" />
                        <span>Regenerating...</span>
                      </>
                    ) : (
                      <>
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                        </svg>
                        <span>Regenerate</span>
                      </>
                    )}
                  </button>
                  <button
                    type="button"
                    onClick={handleConfirm}
                    disabled={loading || !isJSONValid}
                    className="px-6 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed flex items-center space-x-2"
                  >
                    {loading ? (
                      <>
                        <Spinner size="sm" className="text-white" />
                        <span>Saving...</span>
                      </>
                    ) : (
                      <>
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                        </svg>
                        <span>Confirm & Save</span>
                      </>
                    )}
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};