# Stage 13.13.22 — StoryCard vs CharacterCard vs PackageCard Design Pattern Analysis

## Executive Summary

This report analyzes the visual and structural design patterns across three card components in the Plaible design system: `StoryCard`, `CharacterCard`, and `PackageCard`. The analysis reveals significant design inconsistencies in the newly created `PackageCard` that deviate from established patterns in the existing components.

---

## 1️⃣ StoryCard — Visual Design Summary

### Structure
- **DOM Hierarchy**: Media section → Content section → CTA section
- **Layout System**: Flex column with `flex-grow` content area and `mt-auto` CTA
- **Media Handling**: Complex carousel with touch/swipe navigation, arrows, and dots
- **Content Organization**: Title + Author → Headline + More link → Meta row → CTA

### Typography
- **Title**: `font-serif text-subheading text-accent`
- **Author**: `font-mono text-caption text-text-tertiary/80`
- **Headline**: `font-mono text-caption text-text-tertiary/90`
- **Meta**: `font-mono text-caption text-accent`
- **CTA**: Uses `C2AButton` with `typography="caption"`

### Colors
- **Background**: `bg-primary`
- **Text Primary**: `text-accent` (titles)
- **Text Secondary**: `text-text-tertiary` (metadata)
- **Text Tertiary**: `text-text-tertiary/80` (author)
- **Border**: `border-transparent`
- **Shadow**: `shadow-card`

### Spacing
- **Container**: `px-spacing-md pt-spacing-md` (media), `px-spacing-md pt-spacing-md` (content), `px-spacing-md pb-spacing-md` (CTA)
- **Internal Gaps**: `gap-spacing-2xs` (title/author), `gap-spacing-lg` (meta items), `gap-spacing-xs` (meta icons)
- **Margins**: `mt-spacing-md` (sections), `mb-spacing-md` (meta)

### Interactivity
- **Hover**: `hover:opacity-90` (card), `hover:brightness-110` (links)
- **Focus**: `focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-accent`
- **Transitions**: `transition-opacity duration-200 ease-out`
- **Touch/Swipe**: Full carousel navigation with arrows and dots

### Responsiveness
- **Grid**: `grid-cols-1 md:grid-cols-2 lg:grid-cols-3`
- **Aspect Ratio**: `aspect-[16/9]` for media
- **Min Height**: `min-h-card`

---

## 2️⃣ CharacterCard — Visual Design Summary

### Structure
- **DOM Hierarchy**: Media section → Content section → Hooks + CTA section
- **Layout System**: Flex column with `flex-grow` content area and `mt-auto` bottom section
- **Media Handling**: Identical carousel system to StoryCard
- **Content Organization**: Name + Role → Summary + More link → Hooks → CTA
- **Special Feature**: 3D flip animation with back face content

### Typography
- **Name**: `font-serif text-subheading text-accent`
- **Role**: `font-sans text-caption text-text-tertiary`
- **Summary**: `font-mono text-caption text-text-tertiary/90`
- **Hooks**: `font-mono text-caption text-text-secondary`
- **CTA**: Uses `C2AButton` with `typography="caption"`

### Colors
- **Background**: `bg-primary`
- **Text Primary**: `text-accent` (names)
- **Text Secondary**: `text-text-secondary` (hooks)
- **Text Tertiary**: `text-text-tertiary` (role, summary)
- **Border**: `border-transparent`
- **Shadow**: `shadow-card`

### Spacing
- **Container**: `px-spacing-md pt-spacing-md` (media), `px-spacing-md pt-spacing-md` (content), `px-spacing-md pb-spacing-md` (bottom)
- **Internal Gaps**: `gap-spacing-2xs` (name/role), `gap-spacing-sm` (hooks/CTA)
- **Margins**: `mt-spacing-md` (sections), `mb-spacing-xs` (hooks)

### Interactivity
- **Hover**: `hover:opacity-90` (card), `hover:brightness-110` (links)
- **Focus**: `focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-accent`
- **Transitions**: `transition-opacity duration-200 ease-out`
- **3D Flip**: `motion.div` with `rotateY` animation
- **Touch/Swipe**: Full carousel navigation identical to StoryCard

### Responsiveness
- **Grid**: `grid-cols-1 md:grid-cols-2 lg:grid-cols-3`
- **Aspect Ratio**: `aspect-[16/9]` for media
- **Min Height**: `min-h-card`

---

## 3️⃣ PackageCard — Visual Design Summary

### Structure
- **DOM Hierarchy**: Header section → Content section → CTA section
- **Layout System**: Flex column with `flex-grow` content area and `mt-auto` CTA
- **Media Handling**: **NONE** (no media section)
- **Content Organization**: Name → Credits + Bonus → Price → Description → CTA

### Typography
- **Name**: `font-serif text-subheading text-accent`
- **Credits**: `text-hero font-bold text-accent`
- **Bonus**: `text-body text-accent font-mono`
- **Price**: `text-heading font-bold text-text-primary`
- **Description**: `font-mono text-caption text-text-tertiary`
- **CTA**: Uses `C2AButton` (no typography prop)

### Colors
- **Background**: `bg-white` ⚠️ **INCONSISTENT**
- **Text Primary**: `text-text-primary` (price) ⚠️ **INCONSISTENT**
- **Text Secondary**: `text-text-secondary` (credits label)
- **Text Tertiary**: `text-text-tertiary` (description, total)
- **Border**: `border-ui-muted` ⚠️ **INCONSISTENT**
- **Shadow**: `shadow-sm` ⚠️ **INCONSISTENT**

### Spacing
- **Container**: `px-spacing-md pt-spacing-md` (header), `px-spacing-md pt-spacing-md` (content), `px-spacing-md pb-spacing-md` (CTA)
- **Internal Gaps**: `gap-spacing-2xs` (credits display)
- **Margins**: `mt-spacing-sm` (name), `mt-spacing-md` (sections)

### Interactivity
- **Hover**: `hover:shadow-md` (card only)
- **Focus**: **MISSING** ⚠️ **INCONSISTENT**
- **Transitions**: `transition-shadow duration-200`
- **Touch/Swipe**: **NONE** (no media)

### Responsiveness
- **Grid**: Inherits from parent grid system
- **Aspect Ratio**: **NONE** (no media)
- **Min Height**: **MISSING** ⚠️ **INCONSISTENT**

---

## 4️⃣ Comparative Analysis

| Category | StoryCard | CharacterCard | PackageCard | Status |
|----------|-----------|---------------|-------------|---------|
| **Background** | `bg-primary` | `bg-primary` | `bg-white` | ❌ **INCONSISTENT** |
| **Border** | `border-transparent` | `border-transparent` | `border-ui-muted` | ❌ **INCONSISTENT** |
| **Shadow** | `shadow-card` | `shadow-card` | `shadow-sm` | ❌ **INCONSISTENT** |
| **Min Height** | `min-h-card` | `min-h-card` | **MISSING** | ❌ **INCONSISTENT** |
| **Focus States** | Full focus ring | Full focus ring | **MISSING** | ❌ **INCONSISTENT** |
| **Hover Effects** | `hover:opacity-90` | `hover:opacity-90` | `hover:shadow-md` | ❌ **INCONSISTENT** |
| **Typography Scale** | Consistent tokens | Consistent tokens | Mixed usage | ⚠️ **PARTIAL** |
| **Spacing System** | Full token usage | Full token usage | Full token usage | ✅ **CONSISTENT** |
| **CTA Integration** | `C2AButton` + props | `C2AButton` + props | `C2AButton` only | ⚠️ **PARTIAL** |

---

## 5️⃣ Key Discrepancies & Improvement Priorities

### **Critical Issues (Must Fix)**

1. **Background Color Mismatch**
   - **Issue**: PackageCard uses `bg-white` vs `bg-primary` in reference cards
   - **Impact**: Breaks visual consistency in grid layouts
   - **Fix**: Change to `bg-primary`

2. **Missing Focus States**
   - **Issue**: PackageCard lacks `focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-accent`
   - **Impact**: Accessibility violation, keyboard navigation broken
   - **Fix**: Add focus ring classes

3. **Inconsistent Shadow System**
   - **Issue**: PackageCard uses `shadow-sm` vs `shadow-card` in reference cards
   - **Impact**: Visual hierarchy broken
   - **Fix**: Change to `shadow-card`

4. **Missing Min Height**
   - **Issue**: PackageCard lacks `min-h-card` constraint
   - **Impact**: Inconsistent card heights in grid
   - **Fix**: Add `min-h-card` class

### **Moderate Issues (Should Fix)**

5. **Border Inconsistency**
   - **Issue**: PackageCard uses `border-ui-muted` vs `border-transparent`
   - **Impact**: Visual weight difference
   - **Fix**: Change to `border-transparent`

6. **Hover Effect Mismatch**
   - **Issue**: PackageCard uses `hover:shadow-md` vs `hover:opacity-90`
   - **Impact**: Different interaction feedback
   - **Fix**: Change to `hover:opacity-90`

7. **CTA Typography Missing**
   - **Issue**: PackageCard C2AButton lacks `typography="caption"` prop
   - **Impact**: Typography scale inconsistency
   - **Fix**: Add `typography="caption"` prop

### **Minor Issues (Nice to Fix)**

8. **Text Color Inconsistency**
   - **Issue**: Price uses `text-text-primary` vs `text-accent` pattern
   - **Impact**: Color hierarchy deviation
   - **Fix**: Consider using `text-accent` for price

---

## 6️⃣ Recommended Fixes

### **Priority 1: Critical Fixes**
```tsx
// PackageCard.tsx - Critical fixes
<div className={`
  bg-primary text-text-tertiary rounded-card shadow-card overflow-hidden
  border border-transparent
  focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-accent
  transition-opacity duration-200 ease-out hover:opacity-90
  flex flex-col justify-between h-full min-h-card
  ${className || ''}
`}>
```

### **Priority 2: CTA Fix**
```tsx
<C2AButton
  variant="primary"
  typography="caption"
  fullWidth
  onClick={handlePurchase}
>
  Buy Now
</C2AButton>
```

### **Priority 3: Typography Consistency**
```tsx
// Consider changing price color for consistency
<div className="text-heading font-bold text-accent">
  ${packageData.price.toFixed(2)}
</div>
```

---

## 7️⃣ Summary

The `PackageCard` component deviates significantly from established design patterns in `StoryCard` and `CharacterCard`. The most critical issues are background color, missing focus states, inconsistent shadows, and missing minimum height constraints. These discrepancies break visual consistency and accessibility standards.

**Immediate Action Required**: Implement the critical fixes to align PackageCard with the established design system, ensuring consistent visual hierarchy, accessibility compliance, and user experience across all card components.

**Design System Compliance**: Once fixed, PackageCard will maintain full consistency with the Plaible design system while serving its unique transactional purpose in the credits purchase flow.
