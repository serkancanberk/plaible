# Stage 13.13.40 — Credits Flow Unification: Diagnostic & Plan

## 1. Current Rendering Map

### 1.1 AppGridLayout SubNavigation Hiding & Packages Subheader

**Location**: `src/layouts/AppGridLayout.tsx`

**Packages Page Detection** (Lines 101-102):
```typescript
// Check if we're on the packages page
const isPackagesPage = location.pathname.includes('/packages');
```

**Mobile SubNavigation Hiding** (Lines 553-554):
```typescript
{!isStoryDetailsPage && !hideSubNavigation && !isPackagesPage && (
```

**Desktop SubNavigation Hiding** (Lines 1092-1093):
```typescript
{!isStoryDetailsPage && !hideSubNavigation && !isPackagesPage && (
```

**Mobile Packages Subheader** (Lines 697-707):
```typescript
{/* Packages page subheader */}
{isPackagesPage && (
  <div className="flex flex-col items-center text-center mt-spacing-lg mb-spacing-md">
    <div className="text-subheading font-serif text-text-primary">
      Power Up Your Storyline
    </div>
    <p className="text-body text-text-secondary mt-spacing-xs">
      Choose the right package and unlock your next chapter.
    </p>
  </div>
)}
```

**Desktop Packages Subheader** (Lines 1216-1225):
```typescript
{/* Packages page subheader */}
{isPackagesPage && (
  <div className="flex flex-col items-start text-left mt-spacing-lg ml-spacing-lg mb-spacing-sm">
    <div className="text-subheading font-serif text-accent">
      Power Up Your Storyline
    </div>
    <p className="text-body text-text-secondary mt-spacing-xs">
      Choose the right package and unlock your next chapter.
    </p>
  </div>
)}
```

### 1.2 StoryRunnerPage "Your chapter paused for now" DOM Hierarchy

**Location**: `src/pages/StoryRunnerPage.tsx` (Lines 103-155)

**DOM Structure**:
```tsx
<div className="flex flex-1 min-h-0 flex-col bg-secondary">
  <div className="flex flex-col items-start justify-center h-full text-left px-spacing-xl">
    {/* Title */}
    <div className="font-sans text-heading text-accent/75 mb-spacing-lg">
      🌒 Your chapter paused for now
    </div>
    
    {/* Subtitle */}
    <div className="font-sans text-subheading text-text-tertiary/25 max-w-prose mb-spacing-xl">
      Your next chapter is waiting to be written. Add a few credits to continue your story.
    </div>
    
    {/* Package Grid Section */}
    <section className="px-spacing-md py-spacing-lg w-full">
      <div className="mx-auto w-full md:max-w-3xl lg:max-w-5xl mt-spacing-2xs">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-spacing-lg auto-rows-fr">
          {/* Package cards or loading/error states */}
        </div>
      </div>
    </section>
  </div>
</div>
```

### 1.3 PackagesPage Grid Setup

**Location**: `src/pages/PackagesPage.tsx` (Lines 15-54)

**Container Structure**:
```tsx
<section className="px-spacing-md py-spacing-lg">
  <div className="mx-auto w-full md:max-w-3xl lg:max-w-5xl mt-spacing-2xs">
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-spacing-xl auto-rows-fr">
      {/* Grid content */}
    </div>
  </div>
</section>
```

**Grid Configuration**:
- **Container**: `mx-auto w-full md:max-w-3xl lg:max-w-5xl`
- **Grid**: `grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-spacing-xl auto-rows-fr`
- **Skeleton**: 3 loading cards with `animate-pulse`
- **Error State**: `text-alert font-mono` with `col-span-full`
- **Empty State**: `text-ui-muted font-mono` with `col-span-full`

## 2. Content & Behavior Differences

| Aspect | PackagesPage | StoryRunnerPage | AppGridLayout (Packages) |
|--------|-------------|-----------------|--------------------------|
| **Title** | "Buy Credits" (from AppGridLayout) | "🌒 Your chapter paused for now" | "Buy Credits" |
| **Subtitle** | "Power Up Your Storyline" + description | "Your next chapter is waiting to be written..." | "Power Up Your Storyline" + description |
| **Alignment** | Center (mobile), Left (desktop) | Left | Center (mobile), Left (desktop) |
| **Spacing** | `gap-spacing-xl` | `gap-spacing-lg` | N/A |
| **Container Width** | `md:max-w-3xl lg:max-w-5xl` | `md:max-w-3xl lg:max-w-5xl` | N/A |
| **Loading State** | 3 skeleton cards | 3 skeleton cards | N/A |
| **Error State** | `text-center` | `text-left` | N/A |
| **Empty State** | `text-center` | `text-left` | N/A |
| **Logging** | `[PACKAGE_UI][PURCHASE]` | `[STORY_RUNNER][PURCHASE]` | N/A |
| **Accessibility** | `role="status" aria-live="polite"` | `role="status" aria-live="polite"` | N/A |

### 2.1 Token Usage Analysis

**Typography Tokens**:
- `text-heading`: StoryRunner title
- `text-subheading`: AppGridLayout subheader, StoryRunner subtitle
- `text-body`: AppGridLayout description, StoryRunner subtitle
- `text-label`: Empty/error states
- `text-caption`: N/A

**Color Tokens**:
- `text-accent/75`: StoryRunner title
- `text-accent`: AppGridLayout subheader (desktop)
- `text-text-primary`: AppGridLayout subheader (mobile)
- `text-text-secondary`: AppGridLayout description
- `text-text-tertiary/25`: StoryRunner subtitle
- `text-ui-muted`: Empty states
- `text-alert`: Error states

**Spacing Tokens**:
- `px-spacing-xl`: StoryRunner container
- `px-spacing-md`: Grid containers
- `py-spacing-lg`: Grid sections
- `mt-spacing-lg`: Subheader spacing
- `mb-spacing-lg/mb-spacing-xl`: Title/subtitle spacing
- `gap-spacing-xl`: PackagesPage grid
- `gap-spacing-lg`: StoryRunner grid

## 3. Proposed Component API & DOM Tree

### 3.1 CreditsPurchaseSection Component API

```typescript
interface CreditsPurchaseSectionProps {
  variant: 'packages' | 'story-paused';
  title?: string;
  subtitle?: string;
  showHeaderDivider?: boolean;
  containerWidth?: 'default' | 'wide';
  onPurchase?: (packageId: string) => void;
  className?: string;
}
```

### 3.2 Proposed DOM Tree (Pseudo-code)

```tsx
<CreditsPurchaseSection 
  variant="packages"
  containerWidth="default"
  onPurchase={handlePurchase}
>
  {/* Internal structure */}
  <section className="px-spacing-md py-spacing-lg">
    <div className="mx-auto w-full md:max-w-3xl lg:max-w-5xl">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-spacing-xl auto-rows-fr">
        {/* Package cards with unified loading/error/empty states */}
      </div>
    </div>
  </section>
</CreditsPurchaseSection>
```

### 3.3 Internal State Management

```typescript
// Internal to CreditsPurchaseSection
const { packages, loading, error } = usePackages();

// Unified logging
console.log('[CREDITS_UI][LOAD] Packages loading...');
console.log('[CREDITS_UI][ERROR] Failed to load packages:', error);
console.log('[CREDITS_UI][PURCHASE] Package selected:', packageId);
```

## 4. Desktop/Mobile Placement Diagram

### 4.1 AppGridLayout Integration

```
Desktop Branch:
┌─────────────────────────────────────────┐
│ Header: "Buy Credits"                   │
├─────────────────────────────────────────┤
│ Divider                                 │
├─────────────────────────────────────────┤
│ CreditsPurchaseSection                  │
│ ┌─────────────────────────────────────┐ │
│ │ Grid: 3 columns, equal heights     │ │
│ │ ┌─────┐ ┌─────┐ ┌─────┐            │ │
│ │ │Card1│ │Card2│ │Card3│            │ │
│ │ └─────┘ └─────┘ └─────┘            │ │
│ └─────────────────────────────────────┘ │
└─────────────────────────────────────────┘

Mobile Branch:
┌─────────────────────────────────────────┐
│ Header: "Buy Credits"                   │
├─────────────────────────────────────────┤
│ Divider                                 │
├─────────────────────────────────────────┤
│ CreditsPurchaseSection                  │
│ ┌─────────────────────────────────────┐ │
│ │ Grid: 1 column, equal heights      │ │
│ │ ┌─────────────────────────────────┐ │ │
│ │ │           Card1                │ │ │
│ │ └─────────────────────────────────┘ │ │
│ │ ┌─────────────────────────────────┐ │ │
│ │ │           Card2                │ │ │
│ │ └─────────────────────────────────┘ │ │
│ │ ┌─────────────────────────────────┐ │ │
│ │ │           Card3                │ │ │
│ │ └─────────────────────────────────┘ │ │
│ └─────────────────────────────────────┘ │
└─────────────────────────────────────────┘
```

### 4.2 StoryRunner Integration

```
StoryRunner "Paused" Screen:
┌─────────────────────────────────────────┐
│ 🌒 Your chapter paused for now         │
│ Your next chapter is waiting...        │
├─────────────────────────────────────────┤
│ CreditsPurchaseSection                  │
│ ┌─────────────────────────────────────┐ │
│ │ Grid: 3 columns, equal heights     │ │
│ │ ┌─────┐ ┌─────┐ ┌─────┐            │ │
│ │ │Card1│ │Card2│ │Card3│            │ │
│ │ └─────┘ └─────┘ └─────┘            │ │
│ └─────────────────────────────────────┘ │
└─────────────────────────────────────────┘
```

## 5. Step-by-step Refactor Plan

### Phase 1: Create CreditsPurchaseSection Component
**Files to create**: `src/components/ui/CreditsPurchaseSection.tsx`

**Implementation**:
1. Create component with `usePackages()` hook
2. Implement unified loading/error/empty states
3. Add `[CREDITS_UI]` prefixed logging
4. Use only design system tokens
5. Add accessibility attributes (`aria-labelledby`, `role="status"`)

**Test Scenarios**:
- Loading state displays 3 skeleton cards
- Error state shows error message
- Empty state shows "No packages available"
- Purchase click logs with `[CREDITS_UI][PURCHASE]` prefix

### Phase 2: Add Variant Support & Props Override
**Files to modify**: `src/components/ui/CreditsPurchaseSection.tsx`

**Implementation**:
1. Add `variant` prop support
2. Add optional `title` and `subtitle` props
3. Add `containerWidth` prop for responsive behavior
4. Add `showHeaderDivider` prop for visual separation

**Test Scenarios**:
- `variant="packages"` renders without title/subtitle
- `variant="story-paused"` renders with title/subtitle
- Props override works correctly
- Container width changes affect layout

### Phase 3: Replace PackagesPage Implementation
**Files to modify**: `src/pages/PackagesPage.tsx`

**Implementation**:
1. Replace entire grid section with `CreditsPurchaseSection`
2. Remove `usePackages` hook from PackagesPage
3. Remove `handlePurchase` function from PackagesPage
4. Pass `variant="packages"` to component

**Test Scenarios**:
- PackagesPage renders identical grid
- Loading/error/empty states work
- Purchase clicks work
- No visual regression

### Phase 4: Remove AppGridLayout Packages Subheader
**Files to modify**: `src/layouts/AppGridLayout.tsx`

**Implementation**:
1. Remove mobile packages subheader (Lines 697-707)
2. Remove desktop packages subheader (Lines 1216-1225)
3. Keep `isPackagesPage` detection for SubNavigation hiding
4. Ensure CreditsPurchaseSection handles its own content

**Test Scenarios**:
- Packages page shows no subheader from AppGridLayout
- SubNavigation remains hidden on packages page
- No duplicate content appears

### Phase 5: Replace StoryRunner Grid Section
**Files to modify**: `src/pages/StoryRunnerPage.tsx`

**Implementation**:
1. Replace grid section (Lines 112-151) with `CreditsPurchaseSection`
2. Remove `usePackages` hook from StoryRunnerPage
3. Remove `handlePurchase` function from StoryRunnerPage
4. Pass `variant="story-paused"` to component
5. Keep existing title/subtitle in StoryRunnerPage

**Test Scenarios**:
- StoryRunner shows same grid as before
- Title/subtitle remain unchanged
- Left alignment preserved
- Purchase functionality works

### Phase 6: Visual Regression Testing
**Test Scenarios**:
- Desktop: 3-column grid with equal heights
- Mobile: 1-column grid with equal heights
- Loading states identical across pages
- Error states display correctly
- Empty states show proper messaging
- Purchase clicks work on both pages
- No layout shifts or visual differences

## 6. Risks & Mitigations

### 6.1 AppGridLayout Conditional Render Conflicts
**Risk**: Mobile/desktop branches may have conflicting conditional rendering
**Mitigation**: 
- Keep `isPackagesPage` detection in AppGridLayout
- Ensure CreditsPurchaseSection is self-contained
- Test both mobile and desktop branches thoroughly

### 6.2 Package Data Loading Timing
**Risk**: Skeleton loading may appear different between pages
**Mitigation**:
- Use identical skeleton structure in CreditsPurchaseSection
- Ensure `usePackages` hook behavior is consistent
- Test loading states on both pages

### 6.3 Route-based Title Management
**Risk**: Page titles and component titles may conflict
**Mitigation**:
- Keep page-level titles in AppGridLayout
- CreditsPurchaseSection only renders optional title/subtitle
- Ensure no duplicate titles appear

### 6.4 Navigation Consistency
**Risk**: Purchase navigation may not work consistently
**Mitigation**:
- Use shared `handleAddBalanceNavigation` utility
- Ensure all purchase clicks navigate to `/app/packages`
- Test navigation from both contexts

## 7. Acceptance Checklist

### 7.1 Component Unification
- [ ] Single `CreditsPurchaseSection` component used in both scenarios
- [ ] Identical grid layout, loading states, and error handling
- [ ] Same design tokens used throughout
- [ ] No code duplication between PackagesPage and StoryRunnerPage

### 7.2 AppGridLayout Separation of Concerns
- [ ] AppGridLayout no longer renders page-specific subheader content
- [ ] `isPackagesPage` detection only used for SubNavigation hiding
- [ ] No page-specific content in AppGridLayout
- [ ] Clean separation between layout and page content

### 7.3 Design System Compliance
- [ ] Only tokens from `tailwind.config.js` used:
  - Colors: `primary`, `secondary`, `accent`, `text-primary`, `text-secondary`, `text-tertiary`, `ui-muted`
  - Font sizes: `hero`, `heading`, `subheading`, `body`, `label`, `caption`
  - Spacing: `spacing-xs` → `spacing-3xl`
  - Border radius: `card`
- [ ] No arbitrary `px` values or custom tokens
- [ ] Consistent spacing and typography across both pages

### 7.4 Accessibility & Telemetry
- [ ] `aria-labelledby` for section titles
- [ ] `role="status"` and `aria-live="polite"` for state messages
- [ ] `[CREDITS_UI]` prefixed console logs for all actions
- [ ] Consistent logging format across both pages

### 7.5 Navigation Consistency
- [ ] All purchase clicks navigate to `/app/packages`
- [ ] `handleAddBalanceNavigation` utility used consistently
- [ ] No navigation conflicts between pages
- [ ] Route-based title management works correctly

### 7.6 Visual Regression Prevention
- [ ] Desktop: 3-column grid with equal heights
- [ ] Mobile: 1-column grid with equal heights
- [ ] Loading states identical on both pages
- [ ] Error states display correctly
- [ ] Empty states show proper messaging
- [ ] No layout shifts or visual differences
- [ ] Left alignment preserved in StoryRunner
- [ ] Center alignment preserved in PackagesPage (mobile)

### 7.7 Performance & Maintainability
- [ ] Single source of truth for packages grid logic
- [ ] Reduced code duplication
- [ ] Easier maintenance and updates
- [ ] Consistent behavior across all credit purchase flows
- [ ] Future-proof architecture for additional purchase contexts
