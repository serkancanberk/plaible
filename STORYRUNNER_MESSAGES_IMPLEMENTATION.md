# StoryRunner Message Persistence Implementation

## Overview
This implementation adds full message persistence to the StoryRunner AI backend, enabling real chat-based story progression for the frontend's upcoming StoryRunnerPage.

## Files Created/Modified

### 1. New Model: `models/StoryRunnerMessage.js`
- **Purpose**: Stores individual messages in the conversation
- **Key Fields**:
  - `sessionId`: Reference to UserStorySession
  - `role`: "system", "assistant", or "user"
  - `content`: Message text content
  - `choices`: Array of available choices for user
  - `metadata`: Token usage, timing, model info
- **Indexes**: Optimized for session queries and role filtering
- **Methods**: Static methods for pagination and message retrieval

### 2. Enhanced Model: `models/UserStorySession.js`
- **New Fields Added**:
  - `messageCount`: Total messages in session
  - `totalTokensUsed`: Cumulative token usage
  - `lastMessageAt`: Timestamp of last message
  - `conversationContext`: Recent messages and context summary
  - `progress`: Enhanced progress tracking with choices
- **New Methods**:
  - `addMessage()`: Track message and update counters
  - `recordChoice()`: Record user choices made
  - `advanceBeat()`: Progress through story beats
  - `advanceChapter()`: Progress through chapters

### 3. Updated Routes: `routes/storyRunnerRoutes.js`
- **Enhanced `/start` endpoint**:
  - Creates initial assistant message
  - Returns structured message format
  - Includes story and character metadata
- **New `/turn` endpoint**:
  - Accepts user messages and choices
  - Persists both user and assistant messages
  - Updates session progress and tracking
- **New `/session/:id/messages` endpoint**:
  - Retrieves conversation history
  - Supports pagination with limit/offset
  - Returns structured message data

## API Endpoints

### POST `/api/storyrunner/start`
**Request:**
```json
{
  "userId": "string",
  "storyId": "string", 
  "toneStyleId": "string",
  "timeFlavorId": "string",
  "characterId": "string"
}
```

**Response:**
```json
{
  "ok": true,
  "sessionId": "string",
  "firstMessage": {
    "id": "string",
    "role": "assistant",
    "content": "string",
    "choices": ["string"],
    "metadata": {
      "chapter": 1,
      "beat": 1
    }
  },
  "story": {
    "title": "string",
    "slug": "string",
    "character": {
      "id": "string",
      "name": "string",
      "displayName": "string"
    }
  },
  "settings": {
    "toneStyle": "string",
    "timeFlavor": "string"
  }
}
```

### POST `/api/storyrunner/turn`
**Request:**
```json
{
  "sessionId": "string",
  "userMessage": "string",
  "choiceId": "string (optional)",
  "clientTurnId": "string (optional)"
}
```

**Response:**
```json
{
  "ok": true,
  "sessionId": "string",
  "assistantMessage": {
    "id": "string",
    "role": "assistant", 
    "content": "string",
    "choices": ["string"],
    "metadata": {
      "chapter": 1,
      "beat": 1,
      "tokenUsage": {
        "prompt": 0,
        "completion": 0,
        "total": 0
      },
      "latency": 1200
    }
  },
  "progress": {
    "chapter": 1,
    "beat": 1,
    "completed": false
  }
}
```

### GET `/api/storyrunner/session/:id/messages`
**Query Parameters:**
- `limit`: Number of messages to return (default: 50)
- `offset`: Number of messages to skip (default: 0)

**Response:**
```json
{
  "ok": true,
  "messages": [
    {
      "id": "string",
      "role": "assistant|user",
      "content": "string",
      "choices": ["string"],
      "metadata": {},
      "createdAt": "2024-01-01T00:00:00.000Z"
    }
  ],
  "pagination": {
    "total": 10,
    "limit": 50,
    "offset": 0,
    "hasMore": false
  }
}
```

## Database Schema

### StoryRunnerMessage Collection
```javascript
{
  _id: ObjectId,
  sessionId: ObjectId (ref: UserStorySession),
  role: String (enum: ["system", "assistant", "user"]),
  content: String,
  choices: [{
    text: String,
    choiceId: String,
    nextMessageId: ObjectId
  }],
  metadata: {
    chapter: Number,
    beat: Number,
    tokenUsage: {
      prompt: Number,
      completion: Number,
      total: Number
    },
    model: String,
    finishReason: String,
    latency: Number
  },
  createdAt: Date,
  updatedAt: Date
}
```

### Enhanced UserStorySession Collection
```javascript
{
  // ... existing fields ...
  
  // New message tracking fields
  messageCount: Number (default: 0),
  totalTokensUsed: Number (default: 0),
  lastMessageAt: Date,
  
  // Conversation context
  conversationContext: {
    recentMessages: [ObjectId],
    contextSummary: String,
    lastContextUpdate: Date
  },
  
  // Enhanced progress tracking
  progress: {
    currentChapter: Number (default: 1),
    currentBeat: Number (default: 1),
    choicesMade: [{
      messageId: ObjectId,
      choiceId: String,
      timestamp: Date
    }],
    completed: Boolean (default: false)
  }
}
```

## Testing

### Database Test
Run the database test to verify model functionality:
```bash
node test-storyrunner-messages.js
```

### API Test
Run the API test to verify endpoint functionality:
```bash
node test-storyrunner-api.js
```

## Key Features

1. **Message Persistence**: All user and assistant messages are stored in MongoDB
2. **Session Tracking**: Enhanced session tracking with message counts and token usage
3. **Progress Management**: Chapter and beat progression with choice history
4. **Pagination**: Efficient message retrieval with pagination support
5. **Context Management**: Recent message tracking for conversation context
6. **Metadata Tracking**: Token usage, latency, and model information per message

## Next Steps

This implementation provides the foundation for:
- **BE-12.2**: Prompt Templates & Token Tracking
- **BE-12.3**: Streaming & Real-time Features  
- **BE-12.4**: Admin Integration & Analytics
- **BE-12.5**: Production Readiness

The message persistence system is now ready to support the frontend StoryRunnerPage implementation.
