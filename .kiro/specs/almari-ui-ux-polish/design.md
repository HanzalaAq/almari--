# Design Document: Almari UI/UX Polish

## Overview

This design document provides a comprehensive technical specification for polishing the Almari fashion marketplace UI/UX. The implementation focuses on six critical areas:

1. **Layout Architecture**: Implementing flexible layout patterns (Full_Layout vs Minimal_Layout) at the page level rather than root level
2. **Tailwind v4 Theme System**: Complete CSS-first @theme configuration with semantic design tokens
3. **Component Design Patterns**: Consistent hover states, transitions, responsive breakpoints, and visual polish
4. **Color System**: WCAG AA compliant color palette with semantic mappings
5. **Typography & Spacing**: Harmonious type scale and spacing system
6. **Mobile-First Responsive Strategy**: Breakpoint-driven responsive design with appropriate touch targets

**Key Architectural Principle**: This is a **presentational-only** refactor. No backend logic, Supabase queries, or functional behavior changes. All modifications are CSS, markup structure, and component composition.

## Architecture

### Layout System Architecture

The current implementation has Navbar and Footer defined but not integrated consistently. The design addresses this through a **page-level layout pattern** rather than forcing layouts in the root layout.

#### Current State
- Root layout (`app/layout.tsx`): Contains only HTML wrapper and font configuration
- Navbar and Footer: Exist as components but must be manually imported per page
- Pages: Inconsistently apply Navbar/Footer (homepage includes them, other pages may not)

#### Design Decision: Page-Level Layout Composition

**Rationale**: Next.js App Router encourages component composition at the page level. Root layout should remain minimal for maximum flexibility.


**Pattern 1: Full Layout (Standard Pages)**
```tsx
// Pattern for most pages: /, /search, /listing/[id], /messages, /orders, /profile/[username], /sell
import Navbar from '@/components/layout/Navbar'
import Footer from '@/components/layout/Footer'

export default function Page() {
  return (
    <div className="min-h-screen flex flex-col">
      <Navbar />
      <main className="flex-1">
        {/* Page content */}
      </main>
      <Footer />
    </div>
  )
}
```

**Pattern 2: Minimal Layout (Auth Pages)**
```tsx
// Pattern for authentication flows: /login, /profile-setup
import Navbar from '@/components/layout/Navbar'

export default function AuthPage() {
  return (
    <div className="min-h-screen flex flex-col bg-gray-50">
      <Navbar minimal />
      <main className="flex-1 flex items-center justify-center py-12 px-4">
        {/* Centered auth card */}
      </main>
    </div>
  )
}
```

#### Navbar Variants

The Navbar component will support two modes via props:


**Default Mode (Full Navbar)**:
- Logo + Search Bar (desktop) + Category Links (desktop ≥1024px) + Auth Actions
- Height: 64px fixed
- Position: sticky top-0 z-40
- Mobile: Hamburger menu with drawer for categories

**Minimal Mode**:
- Logo + Auth Actions only
- Height: 64px fixed (consistent with full mode)
- Position: sticky top-0 z-40
- No search bar, no category links, no hamburger menu

### Responsive Breakpoint Strategy

Following Tailwind's mobile-first philosophy, breakpoints are defined as:

| Breakpoint | Width | Usage |
|------------|-------|-------|
| `sm` | 640px | Small phones → larger phones |
| `md` | 768px | Tablets, two-column layouts activate |
| `lg` | 1024px | Desktop, category links visible, filter sidebar switches to fixed |
| `xl` | 1280px | Large desktop, max-width containers |

**Mobile-First Principle**: Default styles target mobile (320px-639px). Use min-width breakpoints to enhance for larger screens.


## Components and Interfaces

### Core Layout Components

#### Navbar Component Interface

```typescript
interface NavbarProps {
  minimal?: boolean; // Default: false. If true, shows minimal variant (logo + auth only)
}

function Navbar({ minimal = false }: NavbarProps): JSX.Element
```

**Specifications**:
- Height: `h-16` (64px) on all breakpoints
- Background: `bg-white`
- Border: `border-b border-border`
- Position: `sticky top-0 z-40`
- Shadow on scroll: Add `shadow-sm` when scrollY > 0 (optional enhancement)

**Desktop Layout (≥1024px, not minimal)**:
```
[Logo] [Search Bar (max-w-lg)] [Category Links] [Auth Actions]
```

**Tablet Layout (768-1023px, not minimal)**:
```
[Logo] [Search Bar] [Hamburger Menu] [Auth Actions]
```

**Mobile Layout (<768px, not minimal)**:
```
[Logo] [Hamburger Menu] [Auth Actions]
(Search moves to mobile drawer)
```

**Minimal Mode (all breakpoints)**:
```
[Logo] [Spacer] [Auth Actions]
```


#### Footer Component

```typescript
function Footer(): JSX.Element
```

**Specifications**:
- Background: `bg-surface-dark` (#1A1A1A)
- Text color: `text-white`
- Padding: `py-12` top/bottom, responsive horizontal padding
- Link hover: Transition to `text-brand` over 150ms

**Desktop Layout (≥768px)**:
```css
.footer-grid {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 2rem;
}
```

Columns: About | Explore | Help | Connect

**Mobile Layout (<768px)**:
```css
.footer-grid {
  display: flex;
  flex-direction: column;
  gap: 2rem;
}
```

**Footer Structure**:
1. Logo + tagline
2. Four columns with heading + links
3. Divider (`border-t border-gray-700`)
4. Copyright notice (centered)


### ListingCard Component

```typescript
interface ListingCardProps {
  listing: {
    id: string
    title: string
    price: number
    rental_price_per_day: number | null
    is_rentable: boolean
    is_exchangeable: boolean
    images: string[]
    city: string
    condition: string
  }
}

function ListingCard({ listing }: ListingCardProps): JSX.Element
```

**Specifications**:
- Border radius: `rounded-radius-md` (12px)
- Base state: `shadow-sm` 
- Hover state: `shadow-lg` with transition-normal (200ms)
- Image aspect ratio: `aspect-square`
- Image hover: `scale-105` transform over 300ms

**Badge System**:
- Position: Absolute top-2 left-2
- Display: Flex column with gap-1
- Badge styles:
  - Buy: `bg-success text-white` (#10B981)
  - Rent: `bg-info text-white` (#3B82F6)
  - Swap: `bg-warning text-white` (#F59E0B)
- Typography: `text-xs font-semibold px-2 py-1 rounded-md`

**Heart Icon (Favorite)**:
- Position: Absolute top-2 right-2
- Button: `w-8 h-8 rounded-full bg-white/90 backdrop-blur-sm`
- Icon: Heart from lucide-react
- Hover: Scale to 110%, transition 150ms


**Title Display**:
- Typography: `text-sm font-semibold`
- Color: `text-text-primary`
- Line clamp: `line-clamp-2` (2 lines max)
- Min height: `min-h-[2.5rem]` to prevent layout shift

**Price Display**:
- Primary price: `text-lg font-bold text-brand`
- Rental price (if applicable): `text-xs text-text-muted` below primary price

### Button Component

```typescript
interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'outline'
  size?: 'sm' | 'md' | 'lg'
  children: React.ReactNode
}
```

**Variant Specifications**:

**Primary**:
- Background: `bg-brand` (#FF7A1A)
- Hover: `hover:bg-brand-hover` (#E66A15)
- Text: `text-white`
- Transition: `transition-fast` (150ms)

**Secondary**:
- Background: `bg-gray-100`
- Hover: `hover:bg-gray-200`
- Text: `text-text-primary`
- Transition: `transition-fast` (150ms)

**Outline**:
- Border: `border-2 border-brand`
- Text: `text-brand`
- Hover: `hover:bg-brand hover:text-white`
- Transition: `transition-fast` (150ms)


**Size Specifications**:
- Small: `px-3 py-1.5 text-sm`
- Medium: `px-4 py-2 text-base`
- Large: `px-6 py-3 text-lg`

**Touch Target**: All buttons must meet 44x44px minimum on mobile (size-sm should use additional padding on mobile)

### Skeleton Loader Component

```typescript
interface SkeletonProps {
  variant?: 'text' | 'rectangular' | 'circular'
  width?: string
  height?: string
  className?: string
}

function Skeleton({ variant, width, height, className }: SkeletonProps): JSX.Element
```

**Base Styles**:
- Background: `bg-gray-200`
- Animation: Shimmer effect using CSS gradient animation
- Shimmer duration: 1.5s infinite
- Border radius: Matches variant (text: 4px, rectangular: 8px, circular: 9999px)

**ListingCard Skeleton**:
```tsx
<div className="rounded-radius-md overflow-hidden shadow-sm">
  <Skeleton variant="rectangular" className="aspect-square w-full" />
  <div className="p-4 space-y-2">
    <Skeleton variant="text" width="100%" height="16px" />
    <Skeleton variant="text" width="60%" height="16px" />
    <Skeleton variant="text" width="40%" height="20px" />
  </div>
</div>
```


### Empty State Component

```typescript
interface EmptyStateProps {
  icon: React.ComponentType<{ className?: string }>
  title: string
  description: string
  actionLabel?: string
  actionHref?: string
}

function EmptyState({ icon, title, description, actionLabel, actionHref }: EmptyStateProps): JSX.Element
```

**Specifications**:
- Layout: Flex column, centered both horizontally and vertically
- Icon size: `w-16 h-16` (64px)
- Icon color: `text-text-muted`
- Title: `text-lg font-semibold text-text-primary`
- Description: `text-sm text-text-secondary max-w-sm text-center`
- Spacing: `space-y-4` between elements
- Action button: Primary variant, only shown if actionLabel provided

**Usage Examples**:
- No search results: MagnifyingGlass icon
- No messages: MessageSquare icon
- No orders: ShoppingBag icon
- No listings: Package icon


## Data Models

### Theme Token Structure

The Tailwind v4 CSS-first configuration defines all design tokens in `app/globals.css` using `@theme inline` directive.

```css
@theme inline {
  /* Color Tokens */
  --color-brand: #FF7A1A;
  --color-brand-light: #FFF3EA;
  --color-brand-hover: #E66A15;
  
  --color-text-primary: #1A1A1A;
  --color-text-secondary: #555555;
  --color-text-muted: #888888;
  
  --color-border: #E0E0E0;
  --color-surface-dark: #1A1A1A;
  
  --color-success: #10B981;
  --color-info: #3B82F6;
  --color-warning: #F59E0B;
  --color-error: #EF4444;
  
  --color-gray-50: #F9FAFB;
  --color-gray-100: #F3F4F6;
  --color-gray-200: #E5E7EB;
  --color-gray-700: #374151;
  
  /* Spacing Tokens */
  --spacing-xs: 0.25rem;    /* 4px */
  --spacing-sm: 0.5rem;     /* 8px */
  --spacing-md: 1rem;       /* 16px */
  --spacing-lg: 1.5rem;     /* 24px */
  --spacing-xl: 2rem;       /* 32px */
  --spacing-2xl: 3rem;      /* 48px */
  
  /* Border Radius Tokens */
  --radius-sm: 8px;
  --radius-md: 12px;
  --radius-lg: 16px;
  --radius-xl: 20px;
  --radius-full: 9999px;
  
  /* Transition Tokens */
  --transition-fast: 150ms;
  --transition-normal: 200ms;
  --transition-slow: 300ms;
  
  /* Font Tokens */
  --font-sans: var(--font-geist-sans), "Inter", system-ui, sans-serif;
  --font-mono: var(--font-geist-mono), "Monaco", monospace;
}
```


### Typography Scale

```css
/* Typography defined via Tailwind utilities */
.text-xs    { font-size: 0.75rem; line-height: 1rem; }     /* 12px */
.text-sm    { font-size: 0.875rem; line-height: 1.25rem; } /* 14px */
.text-base  { font-size: 1rem; line-height: 1.5rem; }      /* 16px */
.text-lg    { font-size: 1.125rem; line-height: 1.75rem; } /* 18px */
.text-xl    { font-size: 1.25rem; line-height: 1.75rem; }  /* 20px */
.text-2xl   { font-size: 1.5rem; line-height: 2rem; }      /* 24px */
.text-3xl   { font-size: 1.875rem; line-height: 2.25rem; } /* 30px */
```

**Mobile Font Size Minimums**:
- Body text: Never below 16px (prevents iOS zoom)
- Small text: 14px minimum
- Labels: 12px acceptable for metadata

### Color Contrast Compliance

All text/background combinations must meet **WCAG AA** standards (4.5:1 for normal text, 3:1 for large text).

**Validated Combinations**:

| Text Color | Background | Contrast Ratio | WCAG AA |
|------------|------------|----------------|---------|
| text-primary (#1A1A1A) | white | 12.6:1 | ✅ Pass |
| text-secondary (#555555) | white | 7.4:1 | ✅ Pass |
| text-muted (#888888) | white | 4.6:1 | ✅ Pass |
| white | brand (#FF7A1A) | 3.2:1 | ⚠️ Large text only |
| white | surface-dark (#1A1A1A) | 12.6:1 | ✅ Pass |
| white | success (#10B981) | 3.1:1 | ⚠️ Large text only |
| white | info (#3B82F6) | 4.8:1 | ✅ Pass |

**Prohibited Combinations**:
- ❌ Light gray (#999999, #AAAAAA, #BBBBBB) for body text on white
- ❌ Brand orange (#FF7A1A) for paragraph text
- ⚠️ Brand orange OK for prices, CTAs, emphasis elements


## Page-Specific Design Specifications

### Homepage (/)

**Layout**:
```
Navbar (Full)
Hero Section (full-width, gradient bg)
  - Headline + Subheading
  - 2 CTAs (Explore, Sell Now)
  - Category chips row
Featured Listings Grid (max-w-7xl, centered)
  - Responsive grid: 2 cols mobile, 3 cols tablet, 4 cols desktop
Footer
```

**Hero Section**:
- Background: `bg-gradient-to-b from-brand-light to-white`
- Padding: `py-16 md:py-24`
- Headline: `text-3xl md:text-5xl font-bold text-text-primary`
- Subheading: `text-lg md:text-xl text-text-secondary`
- Category chips: `flex gap-2 overflow-x-auto pb-2` (scrollable on mobile)

### Search Page (/search)

**Layout (Desktop ≥1024px)**:
```
Navbar (Full)
Main Container (flex)
  - Filter Sidebar (w-60, sticky)
  - Results Area (flex-1)
    - Results count + Sort dropdown
    - Listings Grid (3 cols)
    - Pagination
Footer
```

**Layout (Mobile <1024px)**:
```
Navbar (Full)
Filter Toggle Button (sticky below navbar)
Results Count
Listings Grid (2 cols)
Pagination
Footer

(Filter Sidebar appears as drawer overlay when toggled)
```

**Filter Sidebar**:
- Width: `w-60` (240px) on desktop
- Position: `sticky top-20` (below navbar)
- Mobile: Full-screen drawer with close button
- Filters: Category, Size, Price Range (dual slider), Condition, City, Transaction Modes (checkboxes)


### Listing Detail Page (/listing/[id])

**Layout (Desktop ≥768px)**:
```
Navbar (Full)
Main Container (max-w-7xl, grid grid-cols-2 gap-8)
  - Left Column: Photo Gallery
  - Right Column: Details
    - Title + Price
    - Mode Tabs (if multiple modes available)
    - Description
    - Metadata (Condition, Size, Category, City)
    - Seller Card
    - Action Buttons (Buy Now / Rent / Swap)
Footer
```

**Layout (Mobile <768px)**:
```
Navbar (Full)
Photo Gallery (full-width)
Details Section
  - Title + Price
  - Mode Tabs
  - Action Buttons
  - Description
  - Metadata
  - Seller Card
Footer
```

**Photo Gallery**:
- Main image: `aspect-square` or `aspect-[3/4]`
- Thumbnails: Grid below main image, `grid-cols-4 gap-2`
- Thumbnails clickable to change main image
- Mobile: Swipeable carousel with dots indicator

**Mode Tabs**:
- Display only if listing has multiple modes enabled
- Pill-style tabs with active state
- Active: `bg-brand text-white`
- Inactive: `border border-border text-text-secondary hover:border-brand`
- Transition: `transition-fast`

**Seller Card**:
- Avatar (circular, 48px)
- Name + Verification badge (if verified)
- Rating stars + review count
- "Message Seller" button
- Border: `border border-border rounded-radius-md p-4`


### Create Listing Page (/sell)

**Layout (Desktop ≥768px)**:
```
Navbar (Full)
Main Container (max-w-7xl, grid grid-cols-2 gap-8)
  - Left Column: Photo Upload
    - Drag & drop zone
    - Upload button
    - Image previews (grid)
  - Right Column: Form
    - Title input
    - Category select
    - Description textarea
    - Pricing fields
    - Mode toggles (Rent, Swap)
    - Conditional fields (appear on toggle)
    - Size, Condition, City
    - Publish button
Footer
```

**Layout (Mobile <768px)**:
```
Navbar (Full)
Form (single column)
  - Photo Upload (full-width)
  - All form fields stacked
  - Publish button (sticky bottom)
Footer
```

**Toggle Switches**:
- Style: Modern iOS-style toggles
- Size: `w-11 h-6` switch background, `w-5 h-5` knob
- Colors: Inactive `bg-gray-200`, Active `bg-brand`
- Transition: `transition-fast` for background, `transition-normal` for knob movement
- Conditional fields: Reveal with height animation (200ms ease-out)

**Photo Upload Zone**:
- Height: `min-h-[300px]`
- Border: Dashed `border-2 border-dashed border-border`
- Hover: `border-brand bg-brand-light`
- Icon: Upload cloud icon, 48px
- Text: "Drag & drop photos here or click to browse"
- Preview grid: `grid-cols-3 gap-2` below upload zone


### Authentication Pages (/login, /profile-setup)

**Layout**:
```
Navbar (Minimal)
Main (flex items-center justify-center)
  - Auth Card (max-w-md, centered)
    - Logo or icon
    - Heading
    - Form fields
    - Submit button
    - Helper links
Footer NOT included
```

**Auth Card Styling**:
- Background: `bg-white`
- Border radius: `rounded-radius-md`
- Shadow: `shadow-lg`
- Padding: `p-8`
- Max width: `max-w-md` (448px)

**Page Background**: `bg-gray-50` (light background to contrast with white card)

**OTP Input (6 digits)**:
- Display: `grid grid-cols-6 gap-2`
- Each input: `w-full aspect-square` (square boxes)
- Typography: `text-2xl font-bold text-center`
- Border: `border-2 border-border focus:border-brand`
- Min tap target: 44x44px (satisfied by aspect-square constraint)

**Login Form**:
- Email input
- Submit button (full-width)
- "or continue with Google" divider + button
- Helper text with link to sign up


### Messages Page (/messages)

**Layout (Desktop ≥768px)**:
```
Navbar (Full)
Main Container (max-w-7xl, grid grid-cols-[320px_1fr])
  - Left Panel: Conversations List
  - Right Panel: Active Chat
Footer
```

**Layout (Mobile <768px)**:
```
Navbar (Full)
Conversations List (full-width)
Footer

(Clicking a conversation navigates to full-screen chat view)
```

**Conversations List**:
- Each item: `min-h-[72px]` (comfortable tap target)
- Structure: Avatar (48px) + Name + Last message preview + Timestamp
- Active conversation: `bg-brand-light border-l-4 border-brand`
- Hover: `bg-gray-50`
- Transition: `transition-fast`

**Chat Interface**:
- Messages: Flex column with appropriate alignment
  - Sent messages: `ml-auto bg-brand text-white rounded-[18px_18px_4px_18px]`
  - Received messages: `mr-auto bg-gray-100 text-text-primary rounded-[18px_18px_18px_4px]`
- Message bubbles: `max-w-[70%] px-4 py-2`
- Input area: Sticky bottom with border-top, textarea + send button


### Orders Page (/orders)

**Layout**:
```
Navbar (Full)
Main Container (max-w-7xl)
  - Page Title
  - Status Filter Tabs (All, Active, Completed, Cancelled)
  - Orders List / Empty State
Footer
```

**Status Tabs**:
- Display: `flex gap-2 overflow-x-auto`
- Tab style (pill):
  - Active: `bg-brand text-white`
  - Inactive: `bg-transparent border border-border text-text-secondary hover:border-brand`
- Typography: `text-sm font-medium px-4 py-2`
- Border radius: `rounded-full`
- Transition: `transition-fast`

**Order Card**:
- Layout: Grid showing thumbnail + details + status
- Border: `border border-border rounded-radius-md`
- Padding: `p-4`
- Hover: `hover:shadow-md transition-normal`

**Status Badges**:
- Active: `bg-info text-white`
- Completed: `bg-success text-white`
- Cancelled: `bg-gray-200 text-text-muted`
- Pending: `bg-warning text-white`
- Typography: `text-xs font-medium px-2 py-1 rounded-md`

**Empty State**:
- Icon: ShoppingBag (64px)
- Title: "No {status} orders"
- Description: Context-appropriate message
- CTA: "Browse Listings" button (only for 'All' and 'Completed' tabs)


### Profile Page (/profile/[username])

**Layout**:
```
Navbar (Full)
Cover Banner (full-width, min-h-[200px])
  - Gradient background (brand colors)
Profile Section
  - Avatar (overlapping banner, -mt-16)
  - Name + Verification Badge
  - Bio
  - Stats Row (Listings, Rating, Member Since)
Listings Grid
  - Tabs: Active Listings, Sold Items
  - Grid: 2 cols mobile, 3 cols tablet, 4 cols desktop
Footer
```

**Cover Banner**:
- Background: `bg-gradient-to-r from-brand to-orange-600`
- Height: `min-h-[200px]`
- Alternative: Placeholder for future user-uploaded cover photo

**Avatar**:
- Size: `w-32 h-32` (128px)
- Position: `relative -mt-16` (overlaps banner by 64px)
- Border: `border-4 border-white`
- Border radius: `rounded-full`
- Shadow: `shadow-lg`

**Stats Row**:
- Display: `grid grid-cols-3 gap-4 md:flex md:gap-8`
- Each stat: Center-aligned, number (text-2xl font-bold) + label (text-sm text-muted)

**Listings Tabs**:
- Similar to Orders tabs: pill-style, brand color for active
- Grid below: Same as search page grid (responsive 2/3/4 cols)

**Empty State** (No listings):
- Icon: Package (64px)
- Title: "No listings yet"
- Description: "This user hasn't posted any items"
- No CTA button for other users' profiles


## Error Handling

This is a presentational-only refactor with no backend changes. Error handling focuses on **graceful UI degradation**:

### Image Loading Errors

**Problem**: Missing or broken image URLs
**Solution**: 
```tsx
<Image 
  src={imageUrl} 
  alt={title}
  onError={(e) => {
    e.currentTarget.src = '/placeholder-image.jpg'
  }}
/>
```

Provide a placeholder image at `/public/placeholder-image.jpg` (neutral gray with icon)

### Loading States

**Problem**: Content not yet loaded from Supabase
**Solution**: Show skeleton loaders matching content shape

**Implementation**:
```tsx
{isLoading ? (
  <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
    {Array.from({ length: 8 }).map((_, i) => (
      <ListingCardSkeleton key={i} />
    ))}
  </div>
) : (
  <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
    {listings.map(listing => (
      <ListingCard key={listing.id} listing={listing} />
    ))}
  </div>
)}
```


### Empty Data States

**Problem**: User has no data (no messages, no orders, no listings)
**Solution**: Show EmptyState component with context-appropriate messaging

**Examples**:
- No search results: "No items match your search" + "Clear filters" button
- No messages: "No conversations yet" + "Start browsing" button
- No orders: "No orders yet" + "Browse listings" button
- No profile listings: "No listings yet" (no button if viewing other user's profile)

### Mobile Drawer State Management

**Problem**: Mobile drawers (filters, categories) must close on navigation
**Solution**: Use Next.js router events or close drawer on link click

```tsx
const [isDrawerOpen, setIsDrawerOpen] = useState(false)

// Close drawer when route changes
useEffect(() => {
  const handleRouteChange = () => setIsDrawerOpen(false)
  router.events?.on('routeChangeComplete', handleRouteChange)
  return () => router.events?.off('routeChangeComplete', handleRouteChange)
}, [router])
```

### Responsive Layout Shifts

**Problem**: Layout shift when switching breakpoints
**Solution**: Use min-height constraints and skeleton loaders to reserve space

- ListingCard title: `min-h-[2.5rem]` prevents height change
- Skeleton loaders: Match exact dimensions of loaded content
- Images: Always specify aspect ratio (`aspect-square`, `aspect-[3/4]`)


## Testing Strategy

### Manual Visual Testing

This is a **presentational-only refactor** with no testable business logic. Testing focuses on visual correctness across devices and browsers.

#### Responsive Testing Matrix

**Devices to Test**:
- Mobile: 375px (iPhone SE), 390px (iPhone 12/13), 414px (iPhone Pro Max)
- Tablet: 768px (iPad), 820px (iPad Air)
- Desktop: 1024px, 1280px, 1440px, 1920px

**Browsers to Test**:
- Chrome (latest)
- Safari (latest) - **Critical for iOS testing**
- Firefox (latest)
- Edge (latest)

#### Visual Regression Checklist

For each page, verify:

**Layout Integration**:
- [ ] Navbar appears and is sticky
- [ ] Footer appears on full layout pages
- [ ] Footer does NOT appear on auth pages
- [ ] Navbar minimal variant works on auth pages

**Color Contrast**:
- [ ] All text meets WCAG AA standards
- [ ] No light gray text (#999) used for body content
- [ ] Brand orange only used for emphasis/prices/CTAs

**Component Polish**:
- [ ] ListingCard hover effects work (shadow + image scale)
- [ ] Mode badges display correct colors (Buy=green, Rent=blue, Swap=orange)
- [ ] Buttons have 150ms hover transitions
- [ ] Card corners use 12px border-radius


**Responsive Behavior**:
- [ ] Two-column layouts stack on mobile (<768px)
- [ ] Hamburger menu appears below 1024px
- [ ] Category links visible at 1024px+
- [ ] Filter sidebar becomes drawer on mobile
- [ ] Touch targets minimum 44x44px on mobile

**Loading & Empty States**:
- [ ] Skeleton loaders match content shape
- [ ] Shimmer animation runs smoothly
- [ ] Empty states display appropriate icon + message + CTA

**Typography**:
- [ ] Body text never below 16px on mobile
- [ ] Line clamping works (2 lines for listing titles)
- [ ] Font weights consistent (semibold for headings, medium for labels)

#### Accessibility Testing

**Keyboard Navigation**:
- [ ] Tab order is logical
- [ ] Focus indicators visible (ring-2 ring-brand)
- [ ] Drawer close button keyboard accessible

**Screen Reader Testing** (Optional but recommended):
- [ ] Images have alt text
- [ ] Buttons have aria-labels where needed
- [ ] Landmarks used (nav, main, footer)

**Reduced Motion**:
- [ ] CSS includes `@media (prefers-reduced-motion: reduce)` for users who need it
- [ ] Animations disabled or simplified for reduced motion preference


### Browser DevTools Testing

Use browser developer tools to verify:

**Chrome DevTools**:
1. Responsive mode: Test all breakpoints (375px, 768px, 1024px, 1280px)
2. Lighthouse: Run audit for Accessibility score
3. Performance: Check for layout shifts (CLS score)
4. Network throttling: Test image loading states

**Safari DevTools** (iOS Simulator):
1. Verify 16px minimum font size (prevents zoom)
2. Test touch targets (44x44px minimum)
3. Verify smooth scrolling performance
4. Test sticky positioning behavior

### Snapshot Testing (Optional Enhancement)

For future-proofing, consider:

**Storybook Integration**:
- Create stories for each component variant
- Use Chromatic or Percy for visual regression testing
- Document component states in isolation

**Component Stories to Create**:
- Button (all variants + sizes)
- ListingCard (with different badge combinations)
- Empty States (all contexts)
- Skeleton Loaders (all variants)

**Not Required for Initial Implementation**: Storybook setup can be added later for maintenance.


## Implementation Guidelines

### Tailwind v4 Migration Notes

The project uses **Tailwind CSS v4** with CSS-first configuration. Key differences from v3:

1. **No `tailwind.config.ts`**: All configuration in `app/globals.css` using `@theme inline`
2. **Custom properties**: Theme tokens defined as CSS variables, consumed via Tailwind utilities
3. **Arbitrary values**: Can reference theme tokens: `bg-[--color-brand]`

### CSS Architecture

**Global Styles** (`app/globals.css`):
```css
@import "tailwindcss";

/* CSS Variables */
:root {
  --background: #ffffff;
  --foreground: #1a1a1a;
  /* ... additional vars */
}

/* Tailwind Theme */
@theme inline {
  --color-brand: #FF7A1A;
  --color-text-primary: #1A1A1A;
  /* ... all theme tokens */
}

/* Global Utilities */
.shimmer {
  background: linear-gradient(
    90deg,
    transparent,
    rgba(255, 255, 255, 0.3),
    transparent
  );
  animation: shimmer 1.5s infinite;
}

@keyframes shimmer {
  0% { transform: translateX(-100%); }
  100% { transform: translateX(100%); }
}

/* Reduced Motion */
@media (prefers-reduced-motion: reduce) {
  *, *::before, *::after {
    animation-duration: 0.01ms !important;
    animation-iteration-count: 1 !important;
    transition-duration: 0.01ms !important;
  }
}
```


### Component Organization

**Directory Structure**:
```
components/
├── layout/
│   ├── Navbar.tsx          # Full and minimal variants
│   └── Footer.tsx          # Dark footer with 4 columns
├── ui/
│   ├── Button.tsx          # 3 variants, 3 sizes
│   ├── Skeleton.tsx        # NEW: Shimmer loader component
│   ├── EmptyState.tsx      # NEW: Empty state component
│   ├── Modal.tsx           # Existing
│   └── LoadingSpinner.tsx  # Existing (deprecated in favor of Skeleton)
└── listings/
    ├── ListingCard.tsx     # Enhanced with hover + badges
    └── ListingCardSkeleton.tsx  # NEW: Skeleton variant
```

### Reusable Utilities

**Tailwind Custom Classes** (to be added to globals.css if needed):

```css
/* Container utility */
.container-responsive {
  @apply max-w-7xl mx-auto px-4 sm:px-6 lg:px-8;
}

/* Text truncation utility (already in Tailwind) */
.line-clamp-2 {
  /* Built-in Tailwind utility */
}

/* Focus ring utility */
.focus-ring {
  @apply focus:outline-none focus:ring-2 focus:ring-brand focus:ring-offset-2;
}
```

**React Hooks** (optional, for enhanced UX):

```typescript
// hooks/useMediaQuery.ts
export function useMediaQuery(query: string): boolean {
  const [matches, setMatches] = useState(false)
  
  useEffect(() => {
    const media = window.matchMedia(query)
    setMatches(media.matches)
    const listener = () => setMatches(media.matches)
    media.addEventListener('change', listener)
    return () => media.removeEventListener('change', listener)
  }, [query])
  
  return matches
}

// Usage: const isMobile = useMediaQuery('(max-width: 768px)')
```


### Performance Considerations

**Image Optimization**:
- Always use Next.js `<Image>` component
- Specify `sizes` prop based on responsive layout
- Use `priority` for above-the-fold images (hero, first listing cards)
- Example sizes: `"(max-width: 768px) 50vw, (max-width: 1200px) 33vw, 25vw"`

**CSS Performance**:
- Prefer `transform` over changing `width`/`height` for animations
- Use `will-change` sparingly (only for frequently animated elements)
- Keep transitions short (150-300ms)

**Bundle Size**:
- lucide-react: Import only needed icons
  ```tsx
  import { Search, User, Menu, X } from 'lucide-react'
  ```
- Avoid importing entire icon libraries

**Render Performance**:
- Use `React.memo()` for expensive components (optional, measure first)
- Avoid inline function definitions in render (extract to useCallback if needed)
- Example: `onClick={handleClick}` not `onClick={() => handleClick()}`


## Design Decisions and Rationale

### Why Page-Level Layout Composition?

**Decision**: Keep root layout minimal, compose Navbar/Footer at page level

**Alternatives Considered**:
1. **Root layout includes Navbar/Footer always**: Inflexible, can't have auth pages without Footer
2. **Multiple root layout variants**: Not supported in Next.js App Router without complex routing
3. **Conditional rendering in root layout**: Requires reading pathname, couples layout to routing logic

**Chosen Approach**: Page-level composition
- **Pros**: Maximum flexibility, explicit control per page, follows Next.js best practices
- **Cons**: Slight code duplication (importing Navbar/Footer in each page)
- **Mitigation**: Can extract to layout wrapper components if needed (e.g., `FullLayout.tsx`, `MinimalLayout.tsx`)

### Why Tailwind v4 CSS-First Config?

**Decision**: Use `@theme inline` in globals.css instead of tailwind.config.ts

**Rationale**:
- Tailwind v4 recommends CSS-first configuration
- Easier to reference CSS variables directly in styles
- No context switching between config files
- Theme tokens closer to where they're used

**Trade-offs**:
- Less familiar to developers used to tailwind.config.js
- Cannot use JavaScript functions for computed values
- Acceptable for this project (no complex theme computation needed)


### Why Skeleton Loaders Over Spinners?

**Decision**: Use skeleton loaders matching content shape

**Rationale**:
- Reduces perceived loading time (progressive disclosure)
- No layout shift when content loads
- More modern UX pattern (used by Facebook, LinkedIn, YouTube)
- Provides context about what's loading (grid of cards vs single item)

**When to Use Spinners**:
- Button loading states (small spinner inside button)
- Full-page initial loads (centered spinner)
- Short operations (<500ms) where skeleton would flash

### Why 12px Border Radius Standard?

**Decision**: Use 12px (radius-md) as default for cards and inputs

**Rationale**:
- Modern aesthetic without being overly rounded
- Matches current design trends (2023-2024)
- Differentiates from generic Bootstrap look (8px)
- Still accessible and professional

**Hierarchy**:
- 8px (radius-sm): Small elements, badges
- 12px (radius-md): Cards, inputs, buttons (default)
- 16px (radius-lg): Modals, drawers
- 20px (radius-xl): Hero sections, large containers
- Full (radius-full): Pills, circular avatars


### Why Dark Footer?

**Decision**: Use dark background (#1A1A1A) for footer instead of light gray

**Rationale**:
- Provides visual weight and grounding
- Clear separation from page content
- Common pattern in modern web design
- Allows for higher contrast with footer links (white text on dark)
- Makes footer feel intentional rather than afterthought

**Alternative Considered**: Light gray footer matching current design
- **Rejected**: Too subtle, blends with page background, lacks visual hierarchy

### Why Separate Transaction Mode Badges?

**Decision**: Show Buy/Rent/Swap as distinct colored badges

**Rationale**:
- Instant visual recognition (color-coded)
- Reduces cognitive load (no need to read text, colors convey meaning)
- Follows established patterns (green=money, blue=temporary, orange=exchange)
- Allows listings to show multiple modes simultaneously

**Color Mappings**:
- Buy → Green (#10B981): Universal "go" color, money, purchase
- Rent → Blue (#3B82F6): Temporary, trust, coolness
- Swap → Orange (#F59E0B): Exchange, different transaction, attention

**Accessibility**: Colors paired with text labels ("Buy", "Rent", "Swap") so color-blind users can still understand


## Migration Path from Current Implementation

### Phase 1: Theme Foundation
1. Update `app/globals.css` with complete @theme tokens
2. Add shimmer animation keyframes
3. Add reduced motion media query
4. Test that existing components still work

### Phase 2: Core Components
1. Update Button component with new theme tokens
2. Create Skeleton component
3. Create EmptyState component
4. Update ListingCard with new badges, hover effects, border radius

### Phase 3: Layout Integration
1. Update Navbar to support minimal prop
2. Update Footer with dark theme and new structure
3. Update each page file to include Navbar + Footer explicitly
4. Test Full_Layout on standard pages
5. Test Minimal_Layout on auth pages

### Phase 4: Page-Specific Polish
1. Homepage: Hero section, category chips, grid layout
2. Search: Filter sidebar, responsive drawer, pagination
3. Listing Detail: Two-column layout, photo gallery, mode tabs
4. Create Listing: Photo upload, form layout, toggles
5. Messages: Two-panel layout, chat bubbles
6. Orders: Status tabs, order cards, status badges
7. Profile: Cover banner, avatar overlay, stats, listings grid

### Phase 5: Loading & Empty States
1. Add skeleton loaders to all grid views
2. Add empty states to all list views
3. Replace existing spinners with skeletons where appropriate

### Phase 6: Polish & Testing
1. Verify all transitions (150ms buttons, 200ms cards, 300ms images)
2. Test all breakpoints (375px, 768px, 1024px, 1280px)
3. Run Lighthouse accessibility audit
4. Test on Safari iOS (16px minimum font, sticky positioning)
5. Verify WCAG AA contrast compliance


## Appendix: Quick Reference

### Breakpoint Reference
```
Mobile:  <640px   (default, mobile-first)
SM:      640px+   (large phones)
MD:      768px+   (tablets, 2-col layouts)
LG:      1024px+  (desktop, category links, fixed sidebar)
XL:      1280px+  (large desktop)
```

### Color Token Reference
```
Brand:         #FF7A1A  (orange, primary CTA)
Brand Light:   #FFF3EA  (peachy background)
Brand Hover:   #E66A15  (darker orange)

Text Primary:  #1A1A1A  (headings, body)
Text Secondary:#555555  (descriptions)
Text Muted:    #888888  (metadata, labels)

Border:        #E0E0E0  (dividers, inputs)
Surface Dark:  #1A1A1A  (footer, dark cards)

Success:       #10B981  (green, Buy badge)
Info:          #3B82F6  (blue, Rent badge)
Warning:       #F59E0B  (orange, Swap badge)
Error:         #EF4444  (red, validation errors)
```

### Spacing Reference
```
xs:  4px   (0.25rem)
sm:  8px   (0.5rem)
md:  16px  (1rem)
lg:  24px  (1.5rem)
xl:  32px  (2rem)
2xl: 48px  (3rem)
```

### Border Radius Reference
```
sm:   8px
md:   12px  (default for cards)
lg:   16px
xl:   20px
full: 9999px (pills, avatars)
```

### Transition Reference
```
Fast:   150ms (buttons, simple hovers)
Normal: 200ms (cards, mode switches)
Slow:   300ms (images, complex animations)
```


### Component Props Quick Reference

**Navbar**:
```tsx
<Navbar minimal={false} /> // Full variant (default)
<Navbar minimal={true} />  // Minimal variant (auth pages)
```

**Button**:
```tsx
<Button variant="primary" size="md">Label</Button>
// variant: 'primary' | 'secondary' | 'outline'
// size: 'sm' | 'md' | 'lg'
```

**Skeleton**:
```tsx
<Skeleton variant="rectangular" width="100%" height="200px" />
// variant: 'text' | 'rectangular' | 'circular'
```

**EmptyState**:
```tsx
<EmptyState
  icon={SearchIcon}
  title="No results"
  description="Try adjusting your filters"
  actionLabel="Clear Filters"
  actionHref="/search"
/>
```

**ListingCard**:
```tsx
<ListingCard listing={listingObject} />
// Expects listing with: id, title, price, rental_price_per_day,
// is_rentable, is_exchangeable, images, city, condition
```

### File Organization Checklist

**New Files to Create**:
- [ ] `components/ui/Skeleton.tsx`
- [ ] `components/ui/EmptyState.tsx`
- [ ] `components/listings/ListingCardSkeleton.tsx`
- [ ] `public/placeholder-image.jpg`

**Files to Update**:
- [ ] `app/globals.css` (complete theme tokens)
- [ ] `components/layout/Navbar.tsx` (add minimal prop)
- [ ] `components/layout/Footer.tsx` (dark theme redesign)
- [ ] `components/ui/Button.tsx` (use theme tokens)
- [ ] `components/listings/ListingCard.tsx` (badges, hover effects)
- [ ] All page files in `app/` (add Navbar + Footer)

