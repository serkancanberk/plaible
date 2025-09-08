# Admin Dashboard

A minimal React admin dashboard for the Plaible backend API.

## Structure

```
src/admin/
├── AppAdmin.tsx              # Main admin app with routing
├── api.ts                    # API client with credentials
├── components/
│   ├── Sidebar.tsx          # Navigation sidebar
│   ├── Topbar.tsx           # Top navigation bar
│   ├── Table.tsx            # Reusable data table
│   ├── Toast.tsx            # Toast notifications
│   └── Spinner.tsx          # Loading spinner
├── pages/
│   ├── UsersPage.tsx        # Users management
│   ├── StoriesPage.tsx      # Stories management
│   └── FeedbacksPage.tsx    # Feedbacks management
└── index.html               # Test HTML file
```

## Features

- **Users Management**: List, filter, and toggle user status
- **Stories Management**: List, filter, and toggle story active status
- **Feedbacks Management**: List, filter, and manage feedback visibility
- **Authentication**: Cookie-based auth with 401/403 handling
- **Responsive Design**: Tailwind CSS for styling
- **Error Handling**: Graceful error states and loading indicators

## API Integration

All API calls include `credentials: 'include'` for cookie-based authentication and handle:
- 401 Unauthorized → Show "Not authorized" message
- 403 Forbidden → Show "Not authorized" message
- Other errors → Show generic error message

## Integration with Main App

To integrate with your existing React app:

1. **Add routes to your main router:**
```tsx
import { lazy, Suspense } from 'react';
import { Routes, Route } from 'react-router-dom';

const AdminApp = lazy(() => import('./admin/AppAdmin'));

// In your main router:
<Routes>
  {/* Your existing routes */}
  <Route path="/admin/*" element={
    <Suspense fallback={<div>Loading admin...</div>}>
      <AdminApp />
    </Suspense>
  } />
</Routes>
```

2. **Ensure React Router is set up** with BrowserRouter or HashRouter

3. **Add Tailwind CSS** if not already present:
```bash
npm install -D tailwindcss
```

## Smoke Test Checklist

### Browser Console Tests

1. **Test API Endpoints:**
```javascript
// Test users endpoint
fetch('/api/admin/users', { credentials: 'include' })
  .then(r => console.log('Users:', r.status))
  .catch(e => console.log('Users error:', e));

// Test stories endpoint  
fetch('/api/admin/stories', { credentials: 'include' })
  .then(r => console.log('Stories:', r.status))
  .catch(e => console.log('Stories error:', e));

// Test feedbacks endpoint
fetch('/api/admin/feedbacks', { credentials: 'include' })
  .then(r => console.log('Feedbacks:', r.status))
  .catch(e => console.log('Feedbacks error:', e));
```

2. **Test User Status Toggle:**
```javascript
// Replace USER_ID with actual user ID
fetch('/api/admin/users/USER_ID/status', {
  method: 'PATCH',
  credentials: 'include',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ status: 'disabled' })
})
.then(r => console.log('Toggle status:', r.status));
```

3. **Test Story Status Toggle:**
```javascript
// Replace STORY_ID with actual story ID
fetch('/api/admin/stories/STORY_ID/status', {
  method: 'PATCH', 
  credentials: 'include',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ isActive: false })
})
.then(r => console.log('Toggle story:', r.status));
```

4. **Test Feedback Status Toggle:**
```javascript
// Replace FEEDBACK_ID with actual feedback ID
fetch('/api/admin/feedbacks/FEEDBACK_ID/status', {
  method: 'PATCH',
  credentials: 'include', 
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ status: 'hidden' })
})
.then(r => console.log('Toggle feedback:', r.status));
```

### Expected Results

- **As Admin**: All endpoints return 200 OK with data
- **As Non-Admin**: All endpoints return 401 Unauthorized
- **Status Toggles**: Should return 200 OK and update the resource
- **UI Navigation**: Should work between /admin/users, /admin/stories, /admin/feedbacks
- **Error Handling**: Should show "Not authorized" message for 401/403

### Manual UI Tests

1. Navigate to `/admin/users` - should show users table with filters
2. Navigate to `/admin/stories` - should show stories table with filters  
3. Navigate to `/admin/feedbacks` - should show feedbacks table with filters
4. Try toggling user status - should update and refresh table
5. Try toggling story status - should update and refresh table
6. Try toggling feedback visibility - should update and refresh table
7. Test filters on each page - should filter results
8. Test as non-admin user - should show "Not authorized" message

## Dependencies

- React 18+
- React Router DOM 6+
- Tailwind CSS (for styling)
- TypeScript (optional, but recommended)

## Notes

- All API calls use the existing backend endpoints
- No backend changes required
- Designed to be minimal and incremental
- Can be lazy-loaded to reduce bundle size
- Uses existing authentication system
