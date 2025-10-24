# Stage 13.13.0 — Authenticated User State Audit Report

## Executive Summary

This comprehensive audit analyzes the authenticated user state management across the Plaible application, examining data flow, security, consistency, and potential improvements. The system demonstrates a sophisticated dual-mode architecture with both admin and public authentication, but reveals several areas for optimization and consolidation.

---

## 1. Authenticated User Data Overview

### 1.1 User Data Types & Storage Locations

| **Data Type** | **Storage Location** | **Fetch Method** | **Components Using** | **Consistency Issues** |
|---------------|---------------------|------------------|---------------------|------------------------|
| **Google Account Info** | MongoDB User model | `/api/auth/me` | AuthProvider, Header, Sidebar | ✅ Single source of truth |
| **Profile Picture** | MongoDB User.profilePictureUrl | `/api/auth/me` | AuthProvider, Header | ✅ Consistent |
| **Wallet Balance** | MongoDB User.wallet.balance | `/api/auth/me` | AuthProvider, Admin Dashboard | ⚠️ Duplicated in WalletTransaction model |
| **Saved Stories** | MongoDB Save collection | `/api/saves` | AuthProvider, StoryCard, Sidebar | ⚠️ Multiple fetch points |
| **Story Settings** | MongoDB StorySettings collection | `/api/storyrunner/settings` | StorySettingsModal, StorySettingsProvider | ⚠️ Global vs User-specific confusion |
| **Recent Sessions** | MongoDB Session collection | `/api/sessions` | AuthProvider, Sidebar | ⚠️ Separate from user object |

### 1.2 Data Flow Analysis

**Primary Flow:**
```
Google OAuth → JWT Token → /api/auth/me → AuthProvider → Components
```

**Secondary Flows:**
```
AuthProvider → useUserSessions → /api/sessions → Sidebar
AuthProvider → useSavedStories → /api/saves → StoryCard
AuthProvider → useSaveStory → /api/saves → StoryCard
```

### 1.3 Single Source of Truth Violations

1. **Wallet Balance**: Stored in both `User.wallet.balance` and calculated from `WalletTransaction` records
2. **Saved Stories**: Fetched independently by `useSavedStories` and `useSaveStory` hooks
3. **User Sessions**: Managed separately from main user object in AuthProvider
4. **Story Settings**: Global settings vs user preferences not clearly separated

---

## 2. Authentication & Session Management

### 2.1 Login/Logout Flow

**Google OAuth Flow:**
```
1. User clicks login → /api/auth/google
2. Google OAuth → /api/auth/google/callback  
3. User lookup/creation → JWT generation
4. Cookie setting → Redirect to frontend
```

**Token Management:**
- **Admin**: `admin_token` (1h) + `admin_refresh_token` (30d)
- **Public**: `plaible_jwt` (7d) + `refreshToken` (30d)

### 2.2 Cookie Security Analysis

**✅ Strengths:**
- `httpOnly: true` prevents XSS attacks
- `secure: true` in production
- `sameSite: 'lax'` for CSRF protection
- Separate cookie names for admin/public isolation

**⚠️ Concerns:**
- Refresh token stored in separate cookie (not in database)
- No token rotation on refresh
- Admin tokens have shorter expiration but same security level

### 2.3 Session Validation

**Middleware Chain:**
```
authGuard → verifyJwt → req.userId → API endpoints
```

**Token Priority:**
1. `plaible_jwt` (public users)
2. `user_token` (legacy)
3. `admin_token` (admin users)

---

## 3. Frontend Context & Data Flow

### 3.1 AuthProvider Architecture

**Current Implementation:**
```typescript
interface UserData {
  _id: string;
  email: string;
  profilePictureUrl?: string;
  identity: { firstName: string; lastName: string; displayName: string };
  wallet: { balance: number };
  sessions?: UserSessionItem[];
  savedStories?: SavedStoryItem[];
}
```

**Data Synchronization:**
- ✅ User profile data centralized in AuthProvider
- ⚠️ Sessions and saved stories fetched separately via hooks
- ⚠️ Multiple state updates can cause race conditions

### 3.2 Context Dependencies

**AuthProvider Dependencies:**
- `useUserSessions` → `/api/sessions`
- `useSavedStories` → `/api/saves`
- `useSaveStory` → `/api/saves` (individual story status)

**Potential Issues:**
- Multiple API calls for related data
- No optimistic updates for saved stories
- Session data not automatically refreshed

### 3.3 State Management Issues

1. **Race Conditions**: Multiple hooks fetching user data simultaneously
2. **Stale Data**: No automatic refresh mechanism for user-bound data
3. **Memory Leaks**: User data not properly cleared on logout
4. **Inconsistent Loading States**: Different loading indicators across components

---

## 4. Backend Structure

### 4.1 Database Models

**User Model (Primary):**
```javascript
{
  _id: ObjectId,
  email: String (unique),
  profilePictureUrl: String,
  identity: { firstName, lastName, displayName },
  wallet: { balance: Number, currency: String },
  roles: [String],
  storySettings: { preferredToneStyle, preferredTimeFlavor }
}
```

**Related Models:**
- `Save` → User saved stories
- `Session` → User story sessions  
- `WalletTransaction` → Wallet audit trail
- `StorySettings` → Global story configuration

### 4.2 API Endpoints Analysis

**User Data Endpoints:**
- `/api/auth/me` → Core user profile
- `/api/sessions` → User story sessions
- `/api/saves` → User saved stories
- `/api/wallet/me` → Wallet balance
- `/api/storyrunner/settings` → Story settings

**Performance Issues:**
- Multiple database queries for user data
- No data aggregation for user dashboard
- Inconsistent response formats

### 4.3 Data Relationships

**User → Save**: One-to-many (userId → Save.userId)
**User → Session**: One-to-many (userId → Session.userId)  
**User → WalletTransaction**: One-to-many (userId → WalletTransaction.userId)

**⚠️ Inconsistencies:**
- Wallet balance stored in User model but calculated from transactions
- Story settings are global, not user-specific
- No user preferences model for individual settings

---

## 5. Security & Consistency Audit

### 5.1 Security Analysis

**✅ Security Strengths:**
- JWT tokens with proper expiration
- HttpOnly cookies prevent XSS
- Secure flag in production
- Role-based access control
- Separate admin/public sessions

**⚠️ Security Concerns:**
- Refresh tokens not stored in database
- No token rotation on refresh
- Admin tokens have same security as public tokens
- No rate limiting on auth endpoints
- Debug logging exposes sensitive data

### 5.2 Data Consistency Issues

**Critical Issues:**
1. **Wallet Balance Duplication**: Stored in User.wallet.balance AND calculated from WalletTransaction
2. **Saved Stories Race Conditions**: Multiple components fetching independently
3. **Session Data Isolation**: User sessions not part of main user object
4. **Story Settings Confusion**: Global vs user-specific settings unclear

**Stale Data Scenarios:**
- User saves story → UI doesn't reflect change immediately
- Wallet balance updated → Multiple components show different values
- Session data changes → Sidebar shows outdated information

### 5.3 Logout & Session Cleanup

**Current Logout Process:**
```javascript
1. Clear all auth cookies
2. Revoke admin refresh tokens
3. Destroy session
4. Redirect to frontend
5. Clear local state
```

**✅ Properly Cleared:**
- All authentication cookies
- Local state in AuthProvider
- Session data

**⚠️ Potential Issues:**
- No server-side session invalidation
- Refresh tokens not revoked from database
- No cleanup of user-bound data

---

## 6. Recommendations

### 6.1 Immediate Improvements (High Priority)

#### 6.1.1 Unify User Data Management
```typescript
// Consolidate all user data in AuthProvider
interface UnifiedUserData {
  profile: UserProfile;
  wallet: WalletData;
  sessions: UserSession[];
  savedStories: SavedStory[];
  preferences: UserPreferences;
}
```

#### 6.1.2 Implement Single API for User Dashboard
```javascript
// New endpoint: /api/user/dashboard
GET /api/user/dashboard
Response: {
  profile: UserProfile,
  wallet: { balance: number, recentTransactions: Transaction[] },
  sessions: UserSession[],
  savedStories: SavedStory[],
  preferences: UserPreferences
}
```

#### 6.1.3 Fix Wallet Balance Consistency
- Remove `User.wallet.balance` field
- Calculate balance from `WalletTransaction` records only
- Implement balance calculation service

### 6.2 Medium Priority Improvements

#### 6.2.1 Implement Optimistic Updates
```typescript
// For saved stories
const optimisticSave = (storySlug: string) => {
  updateUI(storySlug, true); // Immediate UI update
  apiCall(storySlug).catch(() => rollback(storySlug));
};
```

#### 6.2.2 Add Data Refresh Mechanisms
```typescript
// Auto-refresh user data
useEffect(() => {
  const interval = setInterval(refreshUserData, 30000); // 30s
  return () => clearInterval(interval);
}, []);
```

#### 6.2.3 Implement User Preferences Model
```javascript
// New model: UserPreferences
{
  userId: ObjectId,
  storySettings: {
    preferredToneStyle: String,
    preferredTimeFlavor: String
  },
  uiPreferences: {
    theme: String,
    language: String
  }
}
```

### 6.3 Long-term Improvements (Low Priority)

#### 6.3.1 Implement Token Rotation
```javascript
// Rotate refresh tokens on use
const rotateRefreshToken = async (oldToken) => {
  const newToken = generateRefreshToken();
  await revokeToken(oldToken);
  await storeToken(newToken);
  return newToken;
};
```

#### 6.3.2 Add Rate Limiting
```javascript
// Rate limit auth endpoints
const authRateLimit = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 5 // 5 attempts per window
});
```

#### 6.3.3 Implement Data Aggregation
```javascript
// Aggregate user data in single query
const getUserDashboard = async (userId) => {
  const [user, sessions, saves, transactions] = await Promise.all([
    User.findById(userId),
    Session.find({ userId }),
    Save.find({ userId }),
    WalletTransaction.find({ userId })
  ]);
  
  return aggregateUserData(user, sessions, saves, transactions);
};
```

### 6.4 Security Enhancements

#### 6.4.1 Store Refresh Tokens in Database
```javascript
// Store refresh tokens securely
const storeRefreshToken = async (userId, token) => {
  await RefreshToken.create({
    userId,
    token: hashToken(token),
    expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000)
  });
};
```

#### 6.4.2 Implement Session Invalidation
```javascript
// Server-side session management
const invalidateUserSessions = async (userId) => {
  await RefreshToken.deleteMany({ userId });
  await Session.updateMany({ userId }, { status: 'inactive' });
};
```

#### 6.4.3 Add Request Logging
```javascript
// Log authentication events
const logAuthEvent = (event, userId, metadata) => {
  console.log(`[AUTH_EVENT] ${event}`, { userId, timestamp: new Date(), metadata });
};
```

---

## 7. Implementation Priority Matrix

| **Improvement** | **Impact** | **Effort** | **Priority** |
|----------------|------------|------------|--------------|
| Unify User Data Management | High | Medium | 🔴 Critical |
| Fix Wallet Balance Consistency | High | Low | 🔴 Critical |
| Implement Single Dashboard API | High | Medium | 🟡 High |
| Add Optimistic Updates | Medium | Low | 🟡 High |
| Implement Data Refresh | Medium | Low | 🟡 High |
| Add User Preferences Model | Medium | Medium | 🟢 Medium |
| Implement Token Rotation | Low | High | 🟢 Medium |
| Add Rate Limiting | Low | Low | 🟢 Medium |
| Implement Data Aggregation | Low | High | 🔵 Low |

---

## 8. Conclusion

The Plaible authentication system demonstrates a sophisticated architecture with proper security measures, but suffers from data consistency issues and fragmented state management. The primary concerns are:

1. **Data Duplication**: Wallet balance stored in multiple places
2. **Race Conditions**: Multiple components fetching user data independently  
3. **Stale Data**: No automatic refresh mechanisms
4. **Inconsistent State**: User data scattered across multiple hooks

**Recommended Next Steps:**
1. Implement unified user data management in AuthProvider
2. Create single dashboard API endpoint
3. Fix wallet balance consistency by removing User.wallet.balance
4. Add optimistic updates for better UX
5. Implement automatic data refresh mechanisms

These improvements will significantly enhance data consistency, user experience, and system maintainability while preserving the existing security architecture.

---

**Report Generated:** $(date)  
**Audit Scope:** Complete authenticated user state management  
**Files Analyzed:** 25+ components, models, and API endpoints  
**Recommendations:** 12 actionable improvements across 4 priority levels
