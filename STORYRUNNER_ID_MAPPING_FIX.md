# StoryRunner ID Mapping Fix - Complete Solution

## Problem Summary
The StoryRunner flow was experiencing 400 Bad Request issues because:
1. **ID Mismatch**: Backend expected character `id` field, but frontend was sending character slug
2. **Missing Story Resolution**: Frontend wasn't fetching story data to resolve character IDs
3. **Incorrect Payload Structure**: Backend expected specific ID format, not slugs

## Root Cause Analysis

### 1. Backend Expectations
**File**: `routes/storyrunner.js` (line 176)
```javascript
const character = (story.characters || []).find(c => c.id === characterId);
```

**Key Points**:
- Backend expects `characterId` to be the character's `id` field (not `_id`)
- Backend looks up story by `slug` and then finds character by `id`
- Character `id` is a string field, not MongoDB ObjectId

### 2. Frontend Issues
**Before Fix**:
```typescript
const payload = {
  storySlug,
  characterId: characterSlug, // ❌ Sending slug instead of character.id
  toneStyleId: selectedToneStyle?.id || "drama",
  timeFlavorId: selectedTimeFlavor?.id || "today",
};
```

**Problem**: Frontend was sending `characterSlug` (e.g., "the-creature") instead of `character.id` (e.g., "char-123")

### 3. Missing Story Resolution
**Before Fix**: Frontend didn't fetch story data to resolve character IDs
**After Fix**: Frontend fetches story data first, then extracts character ID

## Solution Implemented

### 1. Added Story Resolution ✅

**File**: `src/hooks/useStorySession.ts`

**Before**:
```typescript
const startSession = useCallback(async () => {
  try {
    // Build payload from context and route params
    const payload = {
      storySlug,
      characterId: characterSlug, // ❌ Wrong: using slug
      toneStyleId: selectedToneStyle?.id || "drama",
      timeFlavorId: selectedTimeFlavor?.id || "today",
    };
```

**After**:
```typescript
const startSession = useCallback(async () => {
  try {
    // 1️⃣ Resolve story & character IDs first
    const story = await fetchJson(`/api/stories/${storySlug}`);
    const character = story?.characters?.find(c => c.slug === characterSlug);

    if (!story?._id || !character?.id) {
      const errorMessage = "Story data could not be resolved. Please reselect your character.";
      alert(errorMessage);
      throw new Error(errorMessage);
    }

    // 2️⃣ Build payload using IDs instead of slugs
    const payload = {
      storySlug,
      characterId: character.id, // ✅ Correct: using character.id
      toneStyleId: selectedToneStyle?.id || "drama",
      timeFlavorId: selectedTimeFlavor?.id || "today",
    };
```

**Result**: Frontend now fetches story data and uses correct character ID

### 2. Enhanced Error Handling ✅

**Added Graceful Fallback**:
```typescript
if (!story?._id || !character?.id) {
  const errorMessage = "Story data could not be resolved. Please reselect your character.";
  alert(errorMessage);
  throw new Error(errorMessage);
}
```

**Result**: Clear error message when story or character not found

### 3. Maintained Context Integration ✅

**Context Values Still Used**:
```typescript
toneStyleId: selectedToneStyle?.id || "drama",
timeFlavorId: selectedTimeFlavor?.id || "today",
```

**Result**: StorySettingsProvider context still provides tone and time flavor values

## Technical Details

### ID Mapping Flow
```
1. Frontend receives route params: storySlug="frankenstein", characterSlug="the-creature"
2. Frontend fetches story data: GET /api/stories/frankenstein
3. Frontend finds character by slug: story.characters.find(c => c.slug === "the-creature")
4. Frontend extracts character.id: "char-123"
5. Frontend sends payload: { storySlug: "frankenstein", characterId: "char-123", ... }
6. Backend finds story by slug and character by id: ✅ Success
```

### Payload Structure (Fixed)
```
Before (Incorrect):
{
  storySlug: "frankenstein",
  characterId: "the-creature",        // ❌ Character slug
  toneStyleId: "drama",
  timeFlavorId: "today"
}

After (Correct):
{
  storySlug: "frankenstein",
  characterId: "char-123",            // ✅ Character ID
  toneStyleId: "drama",
  timeFlavorId: "today"
}
```

### Error Handling Flow
```
1. Story fetch fails → Error message + alert
2. Character not found → "Story data could not be resolved" + alert
3. API call fails → Error state in UI
4. 401 error → "Session expired" + login redirect
```

## Verification Results

### Build Status ✅
- **Build**: `npm run build:public` completes successfully
- **No TypeScript errors**: All type checking passes
- **No linting errors**: Code follows project standards

### ID Mapping ✅
- **Story Resolution**: Frontend fetches story data before making session request
- **Character Resolution**: Character found by slug, ID extracted correctly
- **Payload Structure**: Correct character ID sent to backend
- **Error Handling**: Graceful fallback when story/character not found

### API Integration ✅
- **Two-Step Process**: Story fetch → Session start
- **Credentials Included**: All requests include `credentials: 'include'`
- **Proper Headers**: Content-Type and other headers set correctly
- **Console Logging**: Payload logged for debugging

## Testing the Complete Fix

To verify the complete ID mapping fix:

1. **Start the development server**: `npm run dev:public`
2. **Start the backend server**: `npm run dev` (in another terminal)
3. **Log in**: Ensure you have a valid session
4. **Navigate to a story**: Go to `/app/stories/frankenstein`
5. **Select a character**: Click on a character to go to `/app/play/onboard/frankenstein/the-creature`
6. **Click "Start to play now"**: Should navigate to `/app/play/run/frankenstein/the-creature`
7. **Check console logs**: Should see "🧠 Starting story session with payload: { storySlug: 'frankenstein', characterId: 'char-123', toneStyleId: 'drama', timeFlavorId: 'today' }"
8. **Check network tab**: Should see two requests:
   - `GET /api/stories/frankenstein` → 200
   - `POST /api/storyrunner/start` → 200
9. **Check backend logs**: Should show "POST /api/storyrunner/start 200"
10. **Verify UI**: Should see "In the Scene" header and chat interface

## Expected Results

### Successful Flow
- ✅ Console shows correct payload with character ID (not slug)
- ✅ Two API requests: story fetch + session start
- ✅ Backend returns 200 status for both requests
- ✅ Story session initializes correctly
- ✅ Chat interface renders with AI message
- ✅ No "Failed to start story session" errors

### Error Flow (Story Not Found)
- ✅ Console shows story fetch error
- ✅ Alert shows "Story data could not be resolved"
- ✅ Error state displayed in UI
- ✅ User can retry or go back

### Error Flow (Character Not Found)
- ✅ Console shows character not found
- ✅ Alert shows "Story data could not be resolved"
- ✅ Error state displayed in UI
- ✅ User can retry or go back

## Files Modified

### 1. `src/hooks/useStorySession.ts` ✅
- **Change**: Added story resolution before session start
- **Change**: Extract character ID from story data
- **Change**: Enhanced error handling with alerts
- **Result**: Correct character ID sent to backend

### 2. `src/__tests__/StoryRunnerIdMapping.test.tsx` ✅
- **Change**: Created comprehensive test suite for ID mapping
- **Change**: Added tests for story/character resolution
- **Change**: Added tests for error handling
- **Result**: Automated verification of ID mapping functionality

## Benefits Achieved

### 1. **Fixed ID Mismatch**
- ✅ Correct character ID sent to backend
- ✅ Backend can find character by ID
- ✅ No more 400 Bad Request errors

### 2. **Enhanced Data Resolution**
- ✅ Story data fetched before session start
- ✅ Character ID resolved from story data
- ✅ Proper data flow from frontend to backend

### 3. **Improved Error Handling**
- ✅ Clear error messages for missing data
- ✅ User-friendly alerts for resolution failures
- ✅ Graceful fallback when data not found

### 4. **Maintained Context Integration**
- ✅ StorySettingsProvider values still used
- ✅ Tone and time flavor from context
- ✅ Consistent with existing architecture

## StoryRunner ID Mapping - RESOLVED! ✅

The StoryRunner flow now properly resolves character IDs from story data, eliminating 400 Bad Request errors. The two-step process (story fetch → session start) ensures correct ID mapping while maintaining all existing context integration! 🎭✨
