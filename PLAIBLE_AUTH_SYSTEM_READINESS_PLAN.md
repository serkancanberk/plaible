# 🧭 Plaible Auth System — Readiness & Integration Plan

## System Overview

### Current State Analysis
The Plaible authentication system currently operates in a **dual-mode architecture**:

1. **Admin Dashboard (localhost:5174)** ✅ **FULLY FUNCTIONAL**
   - Google OAuth integration via Passport.js
   - Role-based access control (admin role required)
   - Secure cookie-based session management
   - JWT tokens with 1-hour expiration + refresh tokens
   - Successfully tested with `serkan.caniberk@gmail.com`

2. **Public Frontend (localhost:5173)** ⚠️ **AUTHENTICATION REQUIRED**
   - Currently allows anonymous browsing
   - Authentication barrier at `/api/storyrunner/start` (returns 401)
   - No user context or auth state management
   - Sidebar shows placeholder user icon

### Backend Infrastructure Assessment ✅ **READY FOR REUSE**

**Existing Components (100% Reusable):**
- ✅ **Passport.js Google Strategy** (`auth/passport.js`)
- ✅ **JWT Token Management** (`auth/config.js`)
- ✅ **OAuth Endpoints** (`/api/auth/google`, `/api/auth/google/callback`)
- ✅ **User Model** (supports both admin and regular users)
- ✅ **Session Cookie Middleware** (`authGuard` function)
- ✅ **User Authentication Endpoint** (`/api/auth/me`)

**Backend Auth Flow (Already Implemented):**
```
1. User clicks "Sign in with Google" → /api/auth/google
2. Google OAuth → /api/auth/google/callback
3. User lookup/creation in database
4. JWT token generation with user context
5. Secure cookie setting (plaible_jwt)
6. Redirect to frontend with authentication
```

## Compatibility Check (Admin vs Public Auth)

### ✅ **FULLY COMPATIBLE** - No Conflicts Identified

**Shared Infrastructure:**
- **Same Google OAuth App**: Single Google Client ID/Secret can serve both admin and public users
- **Same User Database**: Single `User` collection handles both roles via `roles` array field
- **Same JWT Secret**: Single JWT secret for token signing/verification
- **Same Cookie Domain**: Both apps run on localhost (development) or same domain (production)

**Role Separation (Already Implemented):**
```javascript
// Admin users get admin_token cookie
if (isAdmin) {
  res.cookie("admin_token", adminToken, { expiresIn: '1h' });
  res.cookie("admin_refresh_token", refreshToken, { expiresIn: '30d' });
}

// Regular users get plaible_jwt cookie  
else {
  res.cookie("plaible_jwt", token, { expiresIn: '7d' });
}
```

**User Model Role Support:**
```javascript
// User schema already supports role-based access
roles: { type: [String], default: ["user"], index: true }
```

## Risk & Role Separation Analysis

### ✅ **ZERO CONFLICTS** - Same Email, Different Sessions

**Scenario: `serkan.caniberk@gmail.com` as both Admin and Public User**

**Technical Implementation:**
1. **Separate Cookie Names**: 
   - Admin: `admin_token` + `admin_refresh_token`
   - Public: `plaible_jwt`
2. **Different Token Payloads**:
   - Admin: `{ sub, email, name, role: 'admin' }`
   - Public: `{ sub }` (minimal payload)
3. **Different Expiration Times**:
   - Admin: 1 hour (high security)
   - Public: 7 days (user convenience)

**Session Isolation:**
- ✅ **No Token Overlap**: Different cookie names prevent conflicts
- ✅ **No Role Confusion**: `authGuard` checks both cookies, prioritizes admin
- ✅ **No Database Conflicts**: Same user record, different session contexts
- ✅ **No Security Issues**: Admin sessions are more restrictive

**Recommended Approach:**
- **Keep existing admin flow unchanged**
- **Add public auth flow alongside**
- **Use same Google OAuth app**
- **Leverage existing user creation logic**

## Proposed Architecture for Frontend Auth

### 🎯 **Minimal Implementation Strategy**

**Design Principle**: "Authentication on Demand" - Only require login when user wants to start a story session.

### Frontend Auth Components

#### 1. **AuthContext Provider** (`src/context/AuthProvider.tsx`)
```typescript
interface AuthContextType {
  user: UserData | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  login: () => void;
  logout: () => Promise<void>;
  refreshUser: () => Promise<void>;
}
```

#### 2. **useAuth Hook** (`src/hooks/useAuth.ts`)
```typescript
export const useAuth = () => {
  const { user, isLoading, login, logout } = useContext(AuthContext);
  return { user, isLoading, login, logout };
};
```

#### 3. **AuthGuard Component** (`src/components/AuthGuard.tsx`)
```typescript
// Wraps StoryRunnerPage to require authentication
<AuthGuard fallback={<LoginPrompt />}>
  <StoryRunnerPage />
</AuthGuard>
```

#### 4. **LoginPrompt Component** (`src/components/LoginPrompt.tsx`)
```typescript
// Shows when user needs to authenticate
<div className="text-center">
  <h2>Sign in to start your story</h2>
  <button onClick={login}>Sign in with Google</button>
</div>
```

### State Management Strategy

**Recommended Approach**: **React Context + useAuth Hook**
- ✅ **Simple**: No external dependencies
- ✅ **Lightweight**: Minimal bundle impact
- ✅ **Consistent**: Matches existing hook patterns
- ✅ **Maintainable**: Easy to understand and modify

**Alternative Considered**: Zustand
- ❌ **Overkill**: Adds complexity for simple auth state
- ❌ **Bundle Size**: Additional dependency
- ❌ **Learning Curve**: Team unfamiliarity

### User State Storage

**Primary**: React Context (in-memory)
**Fallback**: localStorage (for session persistence)
**Backup**: Server-side validation via `/api/auth/me`

## Implementation Steps

### 🚀 **Short-term (Stage 13.1)**

#### Backend Updates (Minimal - Mostly Already Done)
1. **✅ No Changes Required** - Existing auth endpoints support both admin and public users
2. **Optional Enhancement**: Add `redirect` query parameter support to `/api/auth/google`
3. **Optional Enhancement**: Add user role validation in `authGuard`

#### Frontend Implementation
1. **Create AuthContext** (`src/context/AuthProvider.tsx`)
2. **Create useAuth Hook** (`src/hooks/useAuth.ts`)
3. **Create LoginPrompt Component** (`src/components/LoginPrompt.tsx`)
4. **Create AuthGuard Component** (`src/components/AuthGuard.tsx`)
5. **Update AppGridLayout** - Add conditional user display in sidebar
6. **Update StoryRunnerPage** - Wrap with AuthGuard
7. **Update PlayOnboardPage** - Add auth check before "Start to play now"

#### File Structure
```
src/
├── context/
│   └── AuthProvider.tsx
├── hooks/
│   └── useAuth.ts
├── components/
│   ├── AuthGuard.tsx
│   └── LoginPrompt.tsx
└── layouts/
    └── AppGridLayout.tsx (updated)
```

### 🔄 **Long-term (Stage 13.2+)**

#### Enhanced Features
1. **Session Persistence**: localStorage backup for page refreshes
2. **Auto-refresh**: Token renewal before expiration
3. **User Profile**: Basic profile management
4. **Logout Handling**: Proper session cleanup
5. **Error Boundaries**: Auth error handling

#### Advanced Features
1. **Remember Me**: Extended session duration option
2. **Multi-device**: Session management across devices
3. **User Preferences**: Story settings tied to user account
4. **Analytics**: User behavior tracking

## Recommended Next Cursor Prompt

### 🎯 **Stage 13.1 — Implement Public Google Login Flow**

**Goal**: Add minimal Google authentication to the public frontend that only appears when users want to start a story session.

**Tasks**:
1. **Create AuthContext and useAuth hook** for user state management
2. **Create LoginPrompt component** with Google OAuth integration
3. **Create AuthGuard component** to protect story sessions
4. **Update AppGridLayout sidebar** to show user info or login button
5. **Update StoryRunnerPage** to require authentication
6. **Update PlayOnboardPage** to check auth before starting story
7. **Test complete flow** from anonymous browsing to authenticated story session

**Acceptance Criteria**:
- ✅ Anonymous users can browse stories freely
- ✅ "Start to play now" button triggers Google login
- ✅ After login, user can start story sessions
- ✅ Sidebar shows user info when authenticated
- ✅ No conflicts with existing admin authentication
- ✅ Session persists across page refreshes

**Expected Outcome**:
- Seamless transition from anonymous browsing to authenticated story sessions
- No impact on existing admin dashboard functionality
- Clean separation between admin and public user sessions
- Foundation for future user features and personalization

---

## Summary

The Plaible authentication system is **fully ready** for public user integration. The existing backend infrastructure supports both admin and public users without conflicts. The recommended approach is a **minimal, on-demand authentication** that only requires login when users want to start story sessions, maintaining the current anonymous browsing experience while enabling authenticated features.

**Key Advantages**:
- ✅ **Zero Backend Changes Required**
- ✅ **No Conflicts with Admin Auth**
- ✅ **Minimal Frontend Implementation**
- ✅ **Clean User Experience**
- ✅ **Future-Proof Architecture**
