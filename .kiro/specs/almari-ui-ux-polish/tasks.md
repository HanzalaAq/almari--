# Implementation Plan: Almari UI/UX Polish

## Overview

This implementation plan transforms the Almari fashion marketplace UI/UX through a phased approach focusing on visual consistency, responsive design, and component polish. All work is presentational-only with no backend or functional behavior changes.

**Technology Stack**: Next.js 14+, React, TypeScript, Tailwind CSS v4

**Implementation Strategy**: 
1. Establish foundation (theme system, base components)
2. Integrate layout components across all pages
3. Polish individual pages with responsive patterns
4. Add loading states, empty states, and mobile refinements

---

## Phase 1: Critical Setup (Foundation)

### Task 1: Configure Tailwind v4 Theme System in globals.css

- Implement CSS-first theme configuration using @theme inline directive in `app/globals.css`
- Define all color tokens: brand (#FF7A1A), brand-light (#FFF3EA), brand-hover (#E66A15), text-primary, text-secondary, text-muted, border, surface-dark, success, info, warning, error, gray variants
- Define spacing tokens (xs through 2xl)
- Define border-radius tokens (radius-sm: 8px, radius-md: 12px, radius-lg: 16px, radius-xl: 20px, radius-full: 9999px)
- Define transition timing tokens (transition-fast: 150ms, transition-normal: 200ms, transition-slow: 300ms)
- Add shimmer keyframe animation for skeleton loaders
- Add prefers-reduced-motion media query to disable animations for accessibility
- _Requirements: 17.1, 17.2, 17.3, 17.4, 17.5, 17.6, 2.1, 18.7_

### Task 2: Create Skeleton Loader Component

- Create `components/ui/Skeleton.tsx` with TypeScript interface
- Implement three variants: text, rectangular, circular
- Add shimmer animation using CSS gradient with 1.5s duration
- Support custom width, height, and className props
- Use bg-gray-200 base color with appropriate border-radius per variant
- _Requirements: 14.1, 14.3, 14.6, 14.7_

### Task 3: Create Empty State Component

- Create `components/ui/EmptyState.tsx` with TypeScript interface
- Accept props: icon (React component), title, description, actionLabel, actionHref
- Implement flex column layout with vertical and horizontal centering
- Icon size: 64px (w-16 h-16) with text-muted color
- Title: text-lg font-semibold text-text-primary
- Description: text-sm text-text-secondary max-w-sm text-center
- Include optional action button (primary variant) shown only if actionLabel provided
- Use space-y-4 spacing between elements
- _Requirements: 15.1, 15.2, 15.3, 15.4, 15.5, 15.6, 15.7_

### Task 4: Update Navbar Component with Variants

- Modify `components/layout/Navbar.tsx` to accept minimal prop (optional boolean, default false)
- Implement full mode: Logo + Search Bar (desktop) + Category Links (≥1024px) + Auth Actions
- Implement minimal mode: Logo + Auth Actions only
- Set height to h-16 (64px) for both modes with sticky positioning (sticky top-0 z-40)
- Add bg-white background with border-b border-border
- Search bar: centered, pill-shaped, max-w-lg on desktop, with search icon on left
- Category links: horizontal display on screens ≥1024px
- Hamburger menu: shown on screens <1024px (replaces category links)
- Logo text uses brand color (#FF7A1A)
- Display user account link with icon when authenticated, "Login" button when not authenticated
- _Requirements: 1.2, 1.4, 1.5, 1.6, 3.1, 3.2, 3.3, 3.4, 3.5, 3.6, 3.7, 3.8, 3.9_

### Task 5: Update Footer Component with Dark Theme

- Modify `components/layout/Footer.tsx` to use dark background
- Background: bg-surface-dark (#1A1A1A) with text-white
- Desktop layout (≥768px): grid grid-cols-4 gap-8 with 4 columns (About, Explore, Help, Connect)
- Mobile layout (<768px): flex flex-col gap-8 (single column stack)
- Link hover states: transition to text-brand with 150ms duration
- Include logo + tagline at top
- Add border-t border-gray-700 divider before copyright
- Copyright notice: centered at bottom with current year
- Use py-12 padding top/bottom with responsive horizontal padding
- _Requirements: 4.1, 4.2, 4.3, 4.4, 4.5, 4.6, 4.7_

### Task 6: Enhance ListingCard Component with Badges and Hover Effects

- Modify `components/listings/ListingCard.tsx` to add visual enhancements
- Set border-radius to rounded-radius-md (12px)
- Base shadow: shadow-sm, Hover shadow: shadow-lg with transition-normal (200ms)
- Image: aspect-square with hover scale-105 transform over 300ms
- Add mode badges positioned absolute top-2 left-2 in flex column with gap-1
  - Buy badge: bg-success (#10B981) text-white
  - Rent badge: bg-info (#3B82F6) text-white
  - Swap badge: bg-warning (#F59E0B) text-white
  - Badge typography: text-xs font-semibold px-2 py-1 rounded-md
- Add heart icon (favorite button) absolute top-2 right-2
  - Button: w-8 h-8 rounded-full bg-white/90 backdrop-blur-sm
  - Heart icon from lucide-react
  - Hover: scale-110 with 150ms transition
- Title display: text-sm font-semibold text-text-primary with line-clamp-2 and min-h-[2.5rem]
- Price: text-lg font-bold text-brand
- Rental price (if applicable): text-xs text-text-muted below primary price
- _Requirements: 5.1, 5.2, 5.3, 5.4, 5.5, 5.6, 5.7, 5.8, 5.9_

### Task 7: Create ListingCard Skeleton Component

- Create `components/listings/ListingCardSkeleton.tsx`
- Use Skeleton component from Task 2
- Match ListingCard structure: rectangular skeleton for image (aspect-square), text skeletons for title (2 lines), and price
- Container: rounded-radius-md overflow-hidden shadow-sm with p-4 space-y-2
- _Requirements: 14.2, 14.5_

---

## Phase 2: Layout Integration (Navbar + Footer)

### Task 8: Integrate Full Layout on Homepage

- Modify `app/page.tsx` to include Navbar and Footer
- Wrap page with: `<div className="min-h-screen flex flex-col"><Navbar /><main className="flex-1">{content}</main><Footer /></div>`
- Ensure Navbar uses default (full) mode
- _Requirements: 1.1, 1.3_

### Task 9: Integrate Full Layout on Search Page

- Modify `app/search/page.tsx` to include Navbar and Footer
- Use same wrapper pattern as Task 8
- _Requirements: 1.1, 1.3_

### Task 10: Integrate Full Layout on Listing Detail Page

- Modify `app/listing/[id]/page.tsx` to include Navbar and Footer
- Use same wrapper pattern as Task 8
- _Requirements: 1.1, 1.3_

### Task 11: Integrate Full Layout on Messages Page

- Modify `app/messages/page.tsx` to include Navbar and Footer
- Use same wrapper pattern as Task 8
- _Requirements: 1.1, 1.3_

### Task 12: Integrate Full Layout on Orders Page

- Modify `app/orders/page.tsx` to include Navbar and Footer
- Use same wrapper pattern as Task 8
- _Requirements: 1.1, 1.3_

### Task 13: Integrate Full Layout on Profile Page

- Modify `app/profile/[username]/page.tsx` to include Navbar and Footer
- Use same wrapper pattern as Task 8
- _Requirements: 1.1, 1.3_

### Task 14: Integrate Full Layout on Create Listing Page

- Modify `app/sell/page.tsx` to include Navbar and Footer
- Use same wrapper pattern as Task 8
- _Requirements: 1.1, 1.3_

### Task 15: Integrate Minimal Layout on Login Page

- Modify `app/login/page.tsx` to include minimal Navbar only
- Wrap page with: `<div className="min-h-screen flex flex-col bg-gray-50"><Navbar minimal /><main className="flex-1 flex items-center justify-center py-12 px-4">{content}</main></div>`
- Do NOT include Footer
- _Requirements: 1.2, 1.3, 10.1, 10.2, 10.6_

### Task 16: Integrate Minimal Layout on Profile Setup Page

- Modify `app/profile-setup/page.tsx` to include minimal Navbar only
- Use same wrapper pattern as Task 15
- Do NOT include Footer
- _Requirements: 1.2, 1.3, 10.1, 10.2, 10.6_

---

## Phase 3: Page-by-Page Polish

### Task 17: Polish Homepage Hero Section

- Modify `components/home/HeroSection.tsx` for visual enhancements
- Make section full-width (w-full) spanning viewport
- Background: bg-gradient-to-b from-brand-light to-white
- Padding: py-16 md:py-24
- Headline: text-3xl md:text-5xl font-bold text-text-primary
- Subheading: text-lg md:text-xl text-text-secondary
- Display exactly 2 CTAs: primary button (brand color) and secondary button (outline style)
- Category chips: horizontal strip below CTAs with flex gap-2 overflow-x-auto pb-2 (scrollable on mobile)
- Category chips are clickable and navigate to respective search pages
- Stack content vertically on screens <768px
- _Requirements: 6.1, 6.2, 6.3, 6.4, 6.5, 6.6, 6.7_

### Task 18: Polish Homepage Listings Grid

- Modify `components/home/ListingsGrid.tsx` for responsive grid
- Container: max-w-7xl mx-auto with responsive padding
- Grid: grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4
- Use enhanced ListingCard from Task 6
- _Requirements: 16.4, 16.5_

### Task 19: Implement Search Page Filter Sidebar

- Modify `app/search/page.tsx` to add filter sidebar
- Desktop layout (≥1024px): flex with sidebar (w-60 sticky top-20) and results area (flex-1)
- Mobile layout (<1024px): filter sidebar as drawer overlay (slides from left)
- Add filter toggle button on mobile (sticky below navbar)
- Display total results count above listings grid
- Filters include: Category, Size, Price Range (dual slider), Condition, City, Transaction Modes (checkboxes)
- Results grid: grid-cols-2 md:grid-cols-3 gap-4
- _Requirements: 7.1, 7.2, 7.3, 7.4, 7.7_

### Task 20: Add Pagination to Search Page

- Add pagination controls to `app/search/page.tsx`
- Display when results exceed one page
- Show page numbers with Previous and Next buttons
- Position below listings grid
- _Requirements: 7.5, 7.6_

### Task 21: Polish Listing Detail Page Layout

- Modify `app/listing/[id]/page.tsx` for two-column layout
- Desktop (≥768px): grid grid-cols-2 gap-8 within max-w-7xl container
- Left column: Photo gallery with main image (aspect-square or aspect-[3/4]) and thumbnail grid (grid-cols-4 gap-2)
- Right column: Title + Price + Mode Tabs + Description + Metadata + Seller Card + Action Buttons
- Mobile (<768px): single column stack (photo gallery, then details)
- Photo gallery: thumbnails clickable to change main image
- Mobile: swipeable carousel with dots indicator
- _Requirements: 8.1, 8.2, 8.3, 8.7_

### Task 22: Implement Mode Tabs on Listing Detail Page

- Add mode tabs to listing detail page (display only if multiple modes available)
- Pill-style tabs with active state
- Active tab: bg-brand text-white
- Inactive tab: border border-border text-text-secondary hover:border-brand
- Transition: transition-fast (150ms)
- Clicking tab updates display to show mode-specific pricing and actions
- _Requirements: 8.4, 8.5_

### Task 23: Create Seller Card Component for Listing Detail Page

- Create seller card component or section within listing detail page
- Display: Avatar (circular, 48px) + Name + Verification badge (if verified) + Rating stars + Review count + "Message Seller" button
- Container: border border-border rounded-radius-md p-4
- _Requirements: 8.6_

### Task 24: Polish Create Listing Page Layout

- Modify `app/sell/page.tsx` for two-column layout
- Desktop (≥768px): grid grid-cols-2 gap-8 within max-w-7xl container
- Left column: Photo upload area with drag-and-drop zone
  - Height: min-h-[300px]
  - Border: border-2 border-dashed border-border
  - Hover: border-brand bg-brand-light
  - Icon: Upload cloud icon (48px)
  - Text: "Drag & drop photos here or click to browse"
  - Image preview grid: grid-cols-3 gap-2 below upload zone
- Right column: Listing form fields (Title, Category, Description, Pricing, Size, Condition, Location)
- Mobile (<768px): single column stack
- _Requirements: 9.1, 9.2, 9.3_

### Task 25: Implement Mode Toggles on Create Listing Page

- Add toggle switches for Rent and Swap modes in create listing form
- Style: iOS-style toggles with w-11 h-6 switch background and w-5 h-5 knob
- Colors: Inactive bg-gray-200, Active bg-brand
- Transition: transition-fast for background, transition-normal for knob movement
- When toggle activated, smoothly reveal additional fields with 200ms height animation
- "Publish Listing" button: prominent, positioned at bottom
- Mobile: sticky bottom positioning for publish button
- _Requirements: 9.4, 9.5, 9.6, 9.7_

### Task 26: Polish Authentication Pages UI

- Modify login and profile-setup pages for centered card layout
- Auth card: max-w-md (448px) centered with bg-white rounded-radius-md shadow-lg p-8
- Page background: bg-gray-50 (light background for contrast)
- Include logo/icon at top of card
- Form fields with proper spacing
- Submit button: full-width
- Helper links with appropriate styling
- _Requirements: 10.3, 10.6, 10.7_

### Task 27: Implement OTP Input on Authentication Pages

- Add OTP input for login verification (6 digits)
- Layout: grid grid-cols-6 gap-2
- Each input: w-full aspect-square (square boxes)
- Typography: text-2xl font-bold text-center
- Border: border-2 border-border focus:border-brand
- Minimum tap target: 44x44px (satisfied by aspect-square)
- _Requirements: 10.4, 10.5_

### Task 28: Implement Messages Page Two-Panel Layout

- Modify `app/messages/page.tsx` for two-panel layout
- Desktop (≥768px): grid grid-cols-[320px_1fr] within max-w-7xl container
  - Left panel: scrollable conversations list
  - Right panel: active chat interface
- Mobile (<768px): show conversations list only, clicking navigates to full-screen chat
- Conversation list items: min-h-[72px] with Avatar (48px) + Name + Preview + Timestamp
- Active conversation: bg-brand-light border-l-4 border-brand
- Hover: bg-gray-50 with transition-fast
- _Requirements: 11.1, 11.2, 11.3, 11.4, 11.5, 11.6_

### Task 29: Implement Chat Interface on Messages Page

- Add chat message display with appropriate alignment
- Sent messages: ml-auto bg-brand text-white rounded-[18px_18px_4px_18px]
- Received messages: mr-auto bg-gray-100 text-text-primary rounded-[18px_18px_18px_4px]
- Message bubbles: max-w-[70%] px-4 py-2
- Input area: sticky bottom with border-top, textarea + send button
- _Requirements: 11.7_

### Task 30: Implement Orders Page Tabs and Status Badges

- Modify `app/orders/page.tsx` to add pill-style tabs
- Tabs: All, Active, Completed, Cancelled
- Active tab: bg-brand text-white
- Inactive tabs: bg-transparent border border-border text-text-secondary hover:border-brand
- Typography: text-sm font-medium px-4 py-2
- Border radius: rounded-full
- Transition: transition-fast (150ms)
- _Requirements: 12.1, 12.2, 12.3_

### Task 31: Implement Order Cards with Status Badges

- Create order card component for orders page
- Layout: grid showing thumbnail + details + status badge
- Border: border border-border rounded-radius-md p-4
- Hover: hover:shadow-md transition-normal
- Status badges:
  - Active: bg-info text-white
  - Completed: bg-success text-white
  - Cancelled: bg-gray-200 text-text-muted
  - Pending: bg-warning text-white
- Badge typography: text-xs font-medium px-2 py-1 rounded-md
- _Requirements: 12.4, 12.7_

### Task 32: Polish Profile Page Cover Banner and Avatar

- Modify `app/profile/[username]/page.tsx` for cover banner layout
- Cover banner: full-width, min-h-[200px], bg-gradient-to-r from-brand to-orange-600
- Avatar: w-32 h-32 (128px), relative -mt-16 (overlaps banner by 64px)
- Avatar border: border-4 border-white with shadow-lg and rounded-full
- Display name + verification badge below avatar
- Bio section with appropriate typography
- _Requirements: 13.1, 13.2, 13.3_

### Task 33: Implement Profile Stats Row

- Add stats row to profile page showing: Total Listings, Rating, Member Since
- Layout: grid grid-cols-3 gap-4 md:flex md:gap-8
- Each stat: center-aligned with number (text-2xl font-bold) + label (text-sm text-muted)
- _Requirements: 13.4_

### Task 34: Implement Profile Listings Grid with Tabs

- Add listings tabs to profile page: Active Listings, Sold Items
- Tabs: pill-style similar to orders tabs with brand color for active
- Listings grid: grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4
- Use enhanced ListingCard from Task 6
- _Requirements: 13.5, 13.6_

---

## Phase 4: Final Polish (Loading States, Empty States, Mobile)

### Task 35: Add Skeleton Loaders to Homepage Listings

- Modify `components/home/ListingsGrid.tsx` to show skeletons during loading
- Display grid of ListingCardSkeleton components (8 skeletons)
- Transition smoothly from skeleton to actual content without layout shift
- _Requirements: 14.1, 14.2, 14.4, 14.5_

### Task 36: Add Skeleton Loaders to Search Page

- Modify `app/search/page.tsx` to show skeletons during loading
- Display grid of ListingCardSkeleton components
- _Requirements: 14.1, 14.2, 14.4, 14.5_

### Task 37: Add Skeleton Loaders to Profile Page

- Modify profile page to show skeletons during loading
- Profile info skeleton: rectangular skeletons for avatar, name, stats
- Listings grid skeleton: ListingCardSkeleton components
- _Requirements: 14.1, 14.4, 14.5_

### Task 38: Add Skeleton Loaders to Messages Page

- Modify messages page to show skeletons during loading
- Conversations list: rectangular skeletons matching conversation item structure
- _Requirements: 14.1, 14.4, 14.5_

### Task 39: Add Skeleton Loaders to Orders Page

- Modify orders page to show skeletons during loading
- Order cards: rectangular skeletons matching order card structure
- _Requirements: 14.1, 14.4, 14.5_

### Task 40: Add Empty State to Search Page

- Modify search page to display EmptyState when no results
- Icon: MagnifyingGlass (from lucide-react)
- Title: "No items match your search"
- Description: "Try adjusting your filters or search terms"
- Action: "Clear filters" button
- _Requirements: 15.1, 15.2, 15.3, 15.4_

### Task 41: Add Empty State to Messages Page

- Modify messages page to display EmptyState when no conversations
- Icon: MessageSquare (from lucide-react)
- Title: "No conversations yet"
- Description: "Start browsing to connect with sellers"
- Action: "Browse Listings" button
- _Requirements: 15.1, 15.2, 15.3, 15.4_

### Task 42: Add Empty State to Orders Page (Per Tab)

- Modify orders page to display context-appropriate EmptyState per tab
- Icon: ShoppingBag (from lucide-react)
- Title: "No {status} orders" (varies by active tab)
- Description: Context-appropriate message per tab
- Action: "Browse Listings" button (only for 'All' and 'Completed' tabs)
- _Requirements: 12.5, 12.6, 15.1, 15.2, 15.3, 15.4_

### Task 43: Add Empty State to Profile Page

- Modify profile page to display EmptyState when user has no listings
- Icon: Package (from lucide-react)
- Title: "No listings yet"
- Description: "This user hasn't posted any items"
- No action button for viewing other users' profiles
- _Requirements: 13.7, 15.1, 15.2, 15.3, 15.4_

### Task 44: Add Empty State to Favorites (if applicable)

- If favorites feature exists, add EmptyState component
- Icon: Heart (from lucide-react)
- Title: "No favorites yet"
- Description: "Items you favorite will appear here"
- Action: "Explore Listings" button
- _Requirements: 15.1, 15.2, 15.3, 15.4_

### Task 45: Verify Mobile Responsiveness at 375px Breakpoint

- Test all pages at 375px viewport width (iPhone SE)
- Verify two-column layouts stack to single column
- Verify minimum 16px font size for body text to prevent iOS zoom
- Verify all interactive elements meet 44x44px minimum tap target
- Test touch gestures (swipe, tap, scroll)
- _Requirements: 16.1, 16.3, 16.5, 16.6, 16.7_

### Task 46: Verify Mobile Responsiveness at 768px Breakpoint

- Test all pages at 768px viewport width (tablet)
- Verify two-column layouts activate appropriately
- Verify hamburger menu appears correctly below 1024px
- _Requirements: 16.2, 16.4_

### Task 47: Implement Smooth Transitions for Interactive Elements

- Verify all buttons have 150ms transitions on hover
- Verify all cards have 200ms transitions on hover
- Verify mode tabs have 200ms transitions
- Verify dropdowns/drawers animate with 200ms transition
- Use ease-in-out timing function for all hover effects
- Use transform properties (scale, translate) instead of dimension properties
- _Requirements: 18.1, 18.2, 18.3, 18.4, 18.5, 18.6_

### Task 48: Test Color Contrast Compliance (WCAG AA)

- Verify text-primary (#1A1A1A) on white meets WCAG AA (12.6:1 ratio)
- Verify text-secondary (#555555) on white meets WCAG AA (7.4:1 ratio)
- Verify text-muted (#888888) on white meets WCAG AA (4.6:1 ratio)
- Verify white text on surface-dark (#1A1A1A) meets WCAG AA
- Verify no light gray (#999, #AAA, #BBB) used for body text
- Verify brand orange not used for paragraph text (only prices, CTAs, emphasis)
- _Requirements: 2.2, 2.3, 2.4, 2.5, 2.6_

### Task 49: Implement Image Loading Error Handling

- Add onError handler to all Image components
- Fallback to placeholder image at `/public/placeholder-image.jpg`
- Create placeholder image: neutral gray with icon
- _Requirements: Error handling for presentational degradation_

### Task 50: Implement Mobile Drawer State Management

- Verify mobile drawers (filters, categories) close on navigation
- Use Next.js router events or close drawer on link click
- Test drawer close behavior on all relevant pages
- _Requirements: Responsive behavior and user experience_

### Task 51: Final Cross-Browser Testing

- Test in Chrome, Safari, Firefox, Edge (latest versions)
- Verify all visual enhancements work consistently
- Test sticky navbar behavior across browsers
- Verify gradient backgrounds render correctly
- Test smooth scrolling performance
- _Requirements: Cross-browser compatibility_

### Task 52: Checkpoint - Final Verification

- Ensure all tests pass and no console errors
- Verify all pages render correctly at all breakpoints (375px, 768px, 1024px, 1280px)
- Verify Navbar/Footer integration on all appropriate pages
- Verify skeleton loaders and empty states work correctly
- Verify color contrast compliance throughout
- Ask the user if questions arise or if ready to deploy

---

## Notes

- All tasks focus exclusively on presentational changes (CSS, markup, component composition)
- No backend logic, Supabase queries, or functional behavior modifications
- Tasks reference specific requirements for traceability
- Responsive breakpoints: 640px (sm), 768px (md), 1024px (lg), 1280px (xl)
- Theme tokens defined in globals.css using Tailwind v4 @theme inline syntax
- All components use TypeScript with proper type definitions
- Accessibility considerations: WCAG AA contrast, 44x44px touch targets, reduced motion support
- Testing is manual visual verification across devices and browsers
