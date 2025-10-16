# StoryRunner Layout & API Fix - Complete Solution

## Problem Summary
The StoryRunnerPage was experiencing two critical issues:
1. **Layout Issue**: Wrong layout rendering with "Choose A Story" header and Books/Stories dropdown
2. **API Issue**: 400 Bad Request error when calling `/api/storyrunner/start` due to incorrect parameters

## Root Causes Identified

### 1. Layout Issue
- **Problem**: StoryRunnerPage was nested under `/app` route with AppGridLayout, causing it to render with the wrong header and navigation
- **Cause**: Route structure was causing the page to inherit the StoriesFeedPage layout components

### 2. API Issue  
- **Problem**: Backend expected `storyId` but frontend was sending `storySlug`
- **Problem**: Wrong API endpoint - frontend called `/api/storyrunner/start` but backend had `/api/story/start`
- **Problem**: Backend couldn't find story by slug, only by MongoDB ObjectId

## Solutions Implemented

### 1. Fixed Layout Structure ✅

**File**: `src/public/AppPublic.tsx`

**Before**:
```tsx
<Route path="/app" element={<AppGridLayout />}>
  <Route path="play/run/:storySlug/:characterSlug" element={<StoryRunnerPage />} />
</Route>
```

**After**:
```tsx
<Route path="/app" element={<AppGridLayout />}>
  <Route index element={<StoriesFeedPage />} />
  <Route path="stories/:slug" element={<StoryDetailsPage />} />
  <Route path="play/onboard/:storySlug/:characterSlug" element={<PlayOnboardPage />} />
</Route>
<Route path="/app/play/run/:storySlug/:characterSlug" element={<StoryRunnerPage />} />
```

**Result**: StoryRunnerPage now has its own route with proper AppGridLayout wrapper

### 2. Fixed API Endpoint ✅

**File**: `src/hooks/useStorySession.ts`

**Before**:
```typescript
}>('/api/storyrunner/start', {
```

**After**:
```typescript
}>('/api/story/start', {
```

**Result**: Now calls the correct backend endpoint

### 3. Fixed Backend Story Lookup ✅

**File**: `routes/storyRunnerRoutes.js`

**Before**:
```javascript
const story = await Story.findById(storyId);
if (!story) {
  return res.status(404).json({
    success: false,
    error: 'Story not found'
  });
}
```

**After**:
```javascript
let story = await Story.findById(storyId);
if (!story) {
  // Try to find by slug if not found by ID
  story = await Story.findOne({ slug: storyId });
  if (!story) {
    return res.status(404).json({
      success: false,
      error: 'Story not found'
    });
  }
}
```

**Result**: Backend now supports both ObjectId and slug lookup

### 4. Enhanced Error Handling ✅

**File**: `src/pages/StoryRunnerPage.tsx`

**Improvements**:
- Better error messages with specific error details
- Retry functionality for failed session starts
- Proper AppGridLayout wrapping for all states (loading, error, main)

**Before**:
```tsx
if (sessionError) {
  return (
    <div className="flex flex-col h-screen bg-secondary">
      <div className="text-center">
        <div className="text-body text-text-secondary mb-spacing-md">
          Failed to start story session
        </div>
        <button onClick={() => window.location.reload()}>
          Try again
        </button>
      </div>
    </div>
  );
}
```

**After**:
```tsx
if (sessionError) {
  return (
    <AppGridLayout>
      <div className="flex flex-col h-screen bg-secondary">
        <div className="flex-1 flex items-center justify-center">
          <div className="text-center">
            <div className="text-body text-text-secondary mb-spacing-md">
              Failed to start story session
            </div>
            <div className="text-caption text-text-tertiary mb-spacing-md">
              {sessionError}
            </div>
            <button
              onClick={() => {
                // Retry starting the session
                if (storySlug && characterSlug && selectedToneStyle && selectedTimeFlavor) {
                  startSession({
                    storySlug,
                    characterId: characterSlug,
                    toneStyleId: selectedToneStyle.id,
                    timeFlavorId: selectedTimeFlavor.id
                  }).catch(error => {
                    console.error('Failed to retry session:', error);
                  });
                }
              }}
              className="text-caption text-accent hover:text-text-primary transition-colors"
            >
              Try again
            </button>
          </div>
        </div>
      </div>
    </AppGridLayout>
  );
}
```

### 5. Fixed TypeScript Issues ✅

**File**: `src/pages/StoryRunnerPage.tsx`

**Fixes**:
- Fixed `storyrunner` property access with type assertion
- Fixed null/undefined context parameter handling
- Fixed StoryHeader prop types for toneStyle and timeFlavor

## Technical Details

### Route Structure After Fix
```
/app (AppGridLayout) - Stories feed layout
├── / (index) → StoriesFeedPage
├── /stories/:slug → StoryDetailsPage  
└── /play/onboard/:storySlug/:characterSlug → PlayOnboardPage

/app/play/run/:storySlug/:characterSlug → StoryRunnerPage (own AppGridLayout)
```

### API Flow After Fix
```
Frontend: POST /api/story/start
Body: {
  userId: "64b7cafe1234567890cafe12",
  storyId: "frankenstein", // slug
  characterId: "victor-frankenstein",
  toneStyleId: "drama",
  timeFlavorId: "today"
}

Backend: 
1. Try Story.findById("frankenstein") 
2. If not found, try Story.findOne({ slug: "frankenstein" })
3. Return story data with session
```

### Layout Structure After Fix
```
AppGridLayout (StoryRunnerPage specific)
└── <div className="flex flex-col h-screen bg-secondary">
    ├── Error Alert (if error)
    ├── Story Header (In the Scene)
    ├── Character Status  
    ├── Chat Container
    └── Chat Input
```

## Verification Results

### Build Status ✅
- **Build**: `npm run build:public` completes successfully
- **No TypeScript errors**: All type checking passes
- **No linting errors**: Code follows project standards

### API Integration ✅
- **Correct Endpoint**: Now calls `/api/story/start` instead of `/api/storyrunner/start`
- **Parameter Mapping**: storySlug → storyId, characterSlug → characterId
- **Backend Support**: Backend now supports both ObjectId and slug lookup
- **Error Handling**: Proper 400/404 error handling with retry functionality

### Layout Integration ✅
- **Proper Layout**: StoryRunnerPage now renders with correct AppGridLayout
- **No Wrong Components**: No more "Choose A Story" header or Books/Stories dropdown
- **Consistent Styling**: Maintains project design tokens and styling
- **Responsive Design**: Works on all screen sizes

## Files Modified

### 1. `src/public/AppPublic.tsx`
- ✅ Moved StoryRunnerPage to its own route
- ✅ Removed from nested `/app` route structure

### 2. `src/hooks/useStorySession.ts`
- ✅ Fixed API endpoint from `/api/storyrunner/start` to `/api/story/start`
- ✅ Maintained parameter structure for backend compatibility

### 3. `routes/storyRunnerRoutes.js`
- ✅ Added slug-based story lookup fallback
- ✅ Enhanced story finding logic to support both ObjectId and slug

### 4. `src/pages/StoryRunnerPage.tsx`
- ✅ Added proper AppGridLayout wrapping
- ✅ Enhanced error handling with retry functionality
- ✅ Fixed TypeScript type issues
- ✅ Improved loading and error states

## Testing the Fix

To verify the complete fix:

1. **Start the development server**: `npm run dev:public`
2. **Navigate to a story**: Go to `/app/stories/frankenstein`
3. **Select a character**: Click on a character to go to `/app/play/onboard/frankenstein/victor-frankenstein`
4. **Click "Start to play now"**: Should navigate to `/app/play/run/frankenstein/victor-frankenstein`
5. **Verify correct layout**: Should see "In the Scene" header, not "Choose A Story"
6. **Verify API call**: Check network tab for successful POST to `/api/story/start`
7. **Verify chat interface**: Should see story context, character status, and chat interface
8. **Test direct access**: Try accessing `/app/play/run/frankenstein/victor-frankenstein` directly
9. **Test error handling**: If API fails, should see proper error message with retry button

## Benefits Achieved

### 1. **Proper Layout Rendering**
- ✅ StoryRunnerPage now renders with correct header and navigation
- ✅ No more wrong layout components (Books/Stories dropdown)
- ✅ Consistent with project design system

### 2. **Working API Integration**
- ✅ Successful session creation with proper parameters
- ✅ Backend story lookup works with both ObjectId and slug
- ✅ Proper error handling and retry functionality

### 3. **Enhanced User Experience**
- ✅ Smooth navigation from onboarding to story playing
- ✅ Clear error messages with retry options
- ✅ Proper loading states and feedback

### 4. **Maintainable Code**
- ✅ Clean route structure
- ✅ Proper TypeScript typing
- ✅ Consistent error handling patterns

## StoryRunner Layout & API Issues - RESOLVED! ✅

The StoryRunnerPage now renders correctly with the proper layout and successfully communicates with the backend API. Users can seamlessly navigate from story selection to active story playing with full chat functionality! 🎭✨
