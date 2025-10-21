# Stage 13.13.41 — Credits Flow Unification: Implementation Blueprint

## 1. Component API Definition

### 1.1 TypeScript Interface

```typescript
export interface CreditsPurchaseSectionProps {
  // Core variant selection
  variant: 'packages' | 'story-paused';
  
  // Optional content overrides
  title?: string;
  subtitle?: string;
  
  // Layout configuration
  containerWidth?: 'default' | 'wide';
  alignment?: 'left' | 'center';
  
  // Visual configuration
  showHeaderDivider?: boolean;
  gapSize?: 'sm' | 'md' | 'lg' | 'xl';
  
  // Event handlers
  onPurchase?: (packageId: string) => void;
  
  // Accessibility
  ariaLabelledBy?: string;
  
  // Styling
  className?: string;
}
```

### 1.2 Default Props Configuration

```typescript
const defaultProps: Partial<CreditsPurchaseSectionProps> = {
  containerWidth: 'default',
  alignment: 'center',
  showHeaderDivider: false,
  gapSize: 'xl',
  onPurchase: () => console.log('[CREDITS_UI][PURCHASE] Default handler called'),
};
```

### 1.3 Variant Mapping

| Variant | Title | Subtitle | Alignment | Gap Size | Container Width |
|---------|-------|----------|-----------|----------|-----------------|
| `packages` | None (handled by AppGridLayout) | None (handled by AppGridLayout) | `center` | `xl` | `default` |
| `story-paused` | "🌒 Your chapter paused for now" | "Your next chapter is waiting to be written. Add a few credits to continue your story." | `left` | `lg` | `default` |

## 2. DOM Structure Specification

### 2.1 Component Hierarchy

```tsx
<CreditsPurchaseSection>
  {/* Optional Header Section */}
  {variant === 'story-paused' && (
    <header className="mb-spacing-xl">
      <h1 className="font-sans text-heading text-accent/75 mb-spacing-lg">
        {title || "🌒 Your chapter paused for now"}
      </h1>
      <p className="font-sans text-subheading text-text-tertiary/25 max-w-prose">
        {subtitle || "Your next chapter is waiting to be written. Add a few credits to continue your story."}
      </p>
    </header>
  )}
  
  {/* Optional Header Divider */}
  {showHeaderDivider && (
    <div className="border-t border-ui-muted mb-spacing-lg" />
  )}
  
  {/* Package Grid Section */}
  <section className="px-spacing-md py-spacing-lg">
    <div className={`mx-auto w-full ${containerWidth === 'wide' ? 'md:max-w-4xl lg:max-w-6xl' : 'md:max-w-3xl lg:max-w-5xl'} mt-spacing-2xs`}>
      <div className={`grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-${gapSize} auto-rows-fr`}>
        {/* Grid Content */}
      </div>
    </div>
  </section>
</CreditsPurchaseSection>
```

### 2.2 Grid Content States

#### Loading State
```tsx
{loading && Array.from({ length: 3 }).map((_, i) => (
  <div key={i} className="w-full rounded-card bg-white border border-ui-muted shadow-sm overflow-hidden animate-pulse">
    <div className="px-spacing-md pt-spacing-md">
      <div className="h-6 w-3/4 bg-ui-muted rounded" />
    </div>
    <div className="px-spacing-md pt-spacing-md pb-spacing-md space-y-spacing-sm">
      <div className="h-8 w-1/2 bg-ui-muted rounded" />
      <div className="h-4 w-3/4 bg-ui-muted rounded" />
      <div className="h-6 w-1/3 bg-ui-muted rounded" />
      <div className="h-4 w-full bg-ui-muted rounded" />
      <div className="h-10 w-full bg-ui-muted rounded-card" />
    </div>
  </div>
))}
```

#### Success State
```tsx
{packages && packages.length > 0 && packages.map((packageData) => (
  <PackageCard
    key={packageData._id}
    package={packageData}
    onPurchase={onPurchase}
  />
))}
```

#### Empty State
```tsx
{!loading && (!packages || packages.length === 0) && (
  <div 
    role="status" 
    aria-live="polite" 
    className={`col-span-full ${alignment === 'left' ? 'text-left' : 'text-center'} font-mono text-label text-ui-muted`}
  >
    No packages available.
  </div>
)}
```

#### Error State
```tsx
{error && (
  <div 
    className={`mt-spacing-md col-span-full ${alignment === 'left' ? 'text-left' : 'text-center'} text-alert font-mono`}
  >
    Failed to load packages.
  </div>
)}
```

## 3. Integration Plan

### 3.1 PackagesPage Integration

**Current Implementation** (Lines 15-54):
```tsx
{/* Package grid */}
<section className="px-spacing-md py-spacing-lg">
  <div className="mx-auto w-full md:max-w-3xl lg:max-w-5xl mt-spacing-2xs">
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-spacing-xl auto-rows-fr">
      {/* Grid content */}
    </div>
  </div>
</section>
```

**Replacement**:
```tsx
import CreditsPurchaseSection from '../components/ui/CreditsPurchaseSection';

export const PackagesPage: React.FC = () => {
  const handlePurchase = (packageId: string) => {
    console.log('[PACKAGE_UI][PURCHASE] Package selected:', packageId);
    // TODO: Implement purchase flow (Stripe/PayPal integration)
  };

  return (
    <CreditsPurchaseSection
      variant="packages"
      onPurchase={handlePurchase}
    />
  );
};
```

### 3.2 StoryRunnerPage Integration

**Current Implementation** (Lines 112-151):
```tsx
{/* Package grid */}
<section className="px-spacing-md py-spacing-lg w-full">
  <div className="mx-auto w-full md:max-w-3xl lg:max-w-5xl mt-spacing-2xs">
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-spacing-lg auto-rows-fr">
      {/* Grid content */}
    </div>
  </div>
</section>
```

**Replacement**:
```tsx
import CreditsPurchaseSection from '../components/ui/CreditsPurchaseSection';

// In the payment error condition:
if (sessionError && (sessionError.includes('402') || sessionError.includes('PAYMENT') || sessionError.includes('INSUFFICIENT_CREDITS'))) {
  return (
    <div className="flex flex-1 min-h-0 flex-col bg-secondary">
      <div className="flex flex-col items-start justify-center h-full text-left px-spacing-xl">
        <CreditsPurchaseSection
          variant="story-paused"
          alignment="left"
          gapSize="lg"
          onPurchase={handlePurchase}
        />
      </div>
    </div>
  );
}
```

### 3.3 AppGridLayout Cleanup

**Remove Mobile Subheader** (Lines 697-707):
```tsx
// REMOVE THIS BLOCK:
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

**Remove Desktop Subheader** (Lines 1216-1225):
```tsx
// REMOVE THIS BLOCK:
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

**Keep SubNavigation Hiding**:
```tsx
// KEEP THESE CONDITIONS:
{!isStoryDetailsPage && !hideSubNavigation && !isPackagesPage && (
  // SubNavigation content
)}
```

## 4. Data Flow Consistency

### 4.1 usePackages Hook Integration

```typescript
// Inside CreditsPurchaseSection component
const { packages, loading, error } = usePackages();

// Unified logging
useEffect(() => {
  if (loading) {
    console.log('[CREDITS_UI][LOAD] Packages loading...');
  } else if (error) {
    console.error('[CREDITS_UI][ERROR] Failed to load packages:', error);
  } else if (packages) {
    console.log('[CREDITS_UI][SUCCESS] Packages loaded:', packages.length);
  }
}, [loading, error, packages]);
```

### 4.2 Purchase Handler Integration

```typescript
const handlePurchase = (packageId: string) => {
  console.log('[CREDITS_UI][PURCHASE] Package selected:', packageId);
  if (onPurchase) {
    onPurchase(packageId);
  }
};
```

### 4.3 State Management Consistency

| State | PackagesPage | StoryRunnerPage | CreditsPurchaseSection |
|-------|-------------|-----------------|----------------------|
| **Loading** | `usePackages().loading` | `usePackages().loading` | `usePackages().loading` |
| **Error** | `usePackages().error` | `usePackages().error` | `usePackages().error` |
| **Data** | `usePackages().packages` | `usePackages().packages` | `usePackages().packages` |
| **Logging** | `[PACKAGE_UI][PURCHASE]` | `[STORY_RUNNER][PURCHASE]` | `[CREDITS_UI][PURCHASE]` |

## 5. Design Token Compliance

### 5.1 Typography Tokens

| Element | Token | Usage |
|---------|-------|-------|
| Title | `text-heading` | StoryRunner variant title |
| Subtitle | `text-subheading` | StoryRunner variant subtitle |
| Empty State | `text-label` | "No packages available" |
| Error State | `text-label` | "Failed to load packages" |
| Font Family | `font-sans` | All text elements |
| Font Family | `font-serif` | AppGridLayout subheader (to be removed) |
| Font Family | `font-mono` | Status messages |

### 5.2 Color Tokens

| Element | Token | Usage |
|---------|-------|-------|
| Title | `text-accent/75` | StoryRunner title |
| Subtitle | `text-text-tertiary/25` | StoryRunner subtitle |
| Empty State | `text-ui-muted` | "No packages available" |
| Error State | `text-alert` | "Failed to load packages" |
| Border | `border-ui-muted` | Skeleton cards |
| Background | `bg-white` | Skeleton cards |
| Background | `bg-ui-muted` | Skeleton elements |

### 5.3 Spacing Tokens

| Element | Token | Usage |
|---------|-------|-------|
| Section Padding | `px-spacing-md py-spacing-lg` | Grid section |
| Container Margin | `mt-spacing-2xs` | Grid container |
| Title Margin | `mb-spacing-lg` | StoryRunner title |
| Subtitle Margin | `mb-spacing-xl` | StoryRunner subtitle |
| Grid Gap | `gap-spacing-xl` | PackagesPage variant |
| Grid Gap | `gap-spacing-lg` | StoryRunner variant |
| Error Margin | `mt-spacing-md` | Error message |

### 5.4 Border Radius Tokens

| Element | Token | Usage |
|---------|-------|-------|
| Cards | `rounded-card` | PackageCard and skeleton |
| Buttons | `rounded-card` | C2AButton (in PackageCard) |
| Skeleton Elements | `rounded` | Individual skeleton elements |

## 6. Final Checklist

### 6.1 Visual Regression Expectations

#### Desktop Layout
- [ ] 3-column grid with equal heights (`auto-rows-fr`)
- [ ] PackagesPage: `gap-spacing-xl` between cards
- [ ] StoryRunner: `gap-spacing-lg` between cards
- [ ] Container width: `md:max-w-3xl lg:max-w-5xl`
- [ ] Loading skeleton: 3 cards with `animate-pulse`
- [ ] Error state: `text-center` for PackagesPage, `text-left` for StoryRunner
- [ ] Empty state: `text-center` for PackagesPage, `text-left` for StoryRunner

#### Mobile Layout
- [ ] 1-column grid with equal heights
- [ ] Same gap spacing as desktop
- [ ] Same container width constraints
- [ ] Same loading/error/empty state behavior

### 6.2 Responsive Alignment

#### PackagesPage (Center Alignment)
- [ ] Mobile: `text-center` for empty/error states
- [ ] Desktop: `text-center` for empty/error states
- [ ] Grid: Centered within container
- [ ] Cards: Equal width within grid columns

#### StoryRunner (Left Alignment)
- [ ] Mobile: `text-left` for empty/error states
- [ ] Desktop: `text-left` for empty/error states
- [ ] Grid: Left-aligned within container
- [ ] Cards: Equal width within grid columns

### 6.3 State Behavior Parity

#### Loading State
- [ ] 3 skeleton cards displayed
- [ ] `animate-pulse` animation active
- [ ] Skeleton structure matches PackageCard layout
- [ ] Loading state consistent across both pages

#### Error State
- [ ] Error message displayed below grid
- [ ] `text-alert` color for error text
- [ ] `font-mono` font family for error text
- [ ] Alignment matches page variant (center/left)

#### Empty State
- [ ] "No packages available" message displayed
- [ ] `text-ui-muted` color for empty text
- [ ] `font-mono` font family for empty text
- [ ] `role="status" aria-live="polite"` attributes
- [ ] Alignment matches page variant (center/left)

#### Success State
- [ ] PackageCard components rendered
- [ ] Equal heights maintained (`auto-rows-fr`)
- [ ] Purchase clicks logged with `[CREDITS_UI][PURCHASE]`
- [ ] Navigation to `/app/packages` on purchase

### 6.4 Accessibility Compliance

#### ARIA Attributes
- [ ] `role="status"` for empty state messages
- [ ] `aria-live="polite"` for dynamic content updates
- [ ] `aria-labelledby` for section titles (if applicable)
- [ ] Semantic HTML structure maintained

#### Keyboard Navigation
- [ ] PackageCard focus states preserved
- [ ] Tab order maintained within grid
- [ ] Focus indicators visible and consistent

### 6.5 Code Quality & Maintainability

#### Component Architecture
- [ ] Single source of truth for packages grid logic
- [ ] No code duplication between pages
- [ ] Consistent prop interface
- [ ] TypeScript types properly defined
- [ ] Default props configuration

#### Logging & Telemetry
- [ ] `[CREDITS_UI]` prefix for all component logs
- [ ] Consistent log format across all actions
- [ ] Error logging includes context
- [ ] Success logging includes package count

#### Design System Compliance
- [ ] Only tokens from `tailwind.config.js` used
- [ ] No arbitrary values or custom tokens
- [ ] Consistent spacing and typography
- [ ] Color tokens used correctly
- [ ] Border radius tokens used correctly

### 6.6 Integration Verification

#### PackagesPage
- [ ] AppGridLayout subheader removed
- [ ] CreditsPurchaseSection renders correctly
- [ ] No visual regression
- [ ] Purchase functionality works
- [ ] Navigation to `/app/packages` works

#### StoryRunnerPage
- [ ] Title and subtitle preserved
- [ ] Left alignment maintained
- [ ] CreditsPurchaseSection renders correctly
- [ ] No visual regression
- [ ] Purchase functionality works

#### AppGridLayout
- [ ] SubNavigation hiding logic preserved
- [ ] Page-specific subheader content removed
- [ ] Clean separation of concerns
- [ ] No duplicate content rendering
