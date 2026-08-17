# Requirements Document

## Introduction

This specification defines the UI/UX polish requirements for the Almari fashion marketplace web application. The project focuses on fixing critical layout integration bugs, improving visual consistency, enhancing component polish, and ensuring responsive design across all pages. The scope explicitly excludes backend logic, Supabase queries, and functional behavior changes - all work is purely presentational and visual.

## Glossary

- **System**: The Almari web application frontend (Next.js 14+ with TypeScript)
- **Navbar**: The navigation header component appearing at the top of pages
- **Footer**: The page footer component appearing at the bottom of pages
- **Layout**: The root layout wrapper that contains all page content
- **Full_Layout**: Layout variant with both Navbar and Footer visible
- **Minimal_Layout**: Layout variant with minimal Navbar only (no Footer), used for authentication flows
- **ListingCard**: The reusable card component displaying individual fashion item listings
- **Hero_Section**: The prominent introductory section at the top of the homepage
- **Filter_Sidebar**: The collapsible sidebar on the search page containing filter controls
- **Listing_Detail_Page**: The page showing full details of a single listing
- **Create_Listing_Page**: The page where users create new listings (/sell route)
- **Auth_Pages**: Login and profile setup pages requiring minimal layout
- **Messages_Page**: The page displaying conversation list and chat interface
- **Orders_Page**: The page showing user's order history
- **Profile_Page**: The page displaying user profile information and listings
- **Theme_Tokens**: CSS custom properties defined in globals.css @theme for consistent styling
- **Skeleton_Loader**: Animated placeholder matching content shape during loading states
- **Empty_State**: Informative display when no data exists (icon + message + CTA)
- **Mode_Badge**: Visual indicator showing transaction type (Buy/Rent/Swap)
- **WCAG_AA**: Web Content Accessibility Guidelines Level AA (4.5:1 contrast for normal text)

## Requirements

### Requirement 1: Layout Integration and Navbar/Footer Display

**User Story:** As a user navigating the site, I want to see consistent navigation elements across all pages, so that I can easily move between sections and understand where I am.

#### Acceptance Criteria

1. WHEN a user visits any non-authentication page THEN THE System SHALL display both the Navbar and Footer in the Full_Layout
2. WHEN a user visits the /login or /profile-setup page THEN THE System SHALL display only the minimal Navbar without the Footer in the Minimal_Layout
3. WHEN the root Layout component renders THEN THE System SHALL NOT include Navbar or Footer directly, allowing page-level layout control
4. THE Navbar SHALL have a height of exactly 64 pixels on all screen sizes
5. THE Navbar SHALL use sticky positioning to remain visible during scroll
6. WHEN a user scrolls down the page THEN THE Navbar SHALL remain fixed at the top with appropriate shadow or border for visual separation

### Requirement 2: Color System and Contrast Compliance

**User Story:** As a user with visual needs, I want all text to be readable with sufficient contrast, so that I can comfortably read all content regardless of my vision capabilities.

#### Acceptance Criteria

1. THE System SHALL define a complete theme token set in globals.css @theme including: brand (#FF7A1A), brand-light (#FFF3EA), text-primary (#1A1A1A), text-secondary (#555555), text-muted (#888888), border (#E0E0E0), surface-dark (#1A1A1A), success (#10B981), info (#3B82F6), warning (#F59E0B), error (#EF4444)
2. WHEN text is displayed on light backgrounds THEN THE System SHALL use text-primary (#1A1A1A) or text-secondary (#555555) to meet WCAG AA contrast requirements
3. WHEN text is displayed on dark backgrounds THEN THE System SHALL use white or light colors meeting WCAG AA contrast requirements
4. THE System SHALL NOT use light gray colors (#999999, #AAAAAA, #BBBBBB) for body text
5. THE System SHALL NOT use brand orange (#FF7A1A) as body text color except for emphasis, prices, or interactive elements
6. WHEN displaying metadata or secondary information THEN THE System SHALL use text-muted (#888888) which meets WCAG AA contrast on white backgrounds

### Requirement 3: Navbar Component Polish

**User Story:** As a user browsing the marketplace, I want a polished navigation bar with search and category access, so that I can quickly find what I'm looking for.

#### Acceptance Criteria

1. THE Navbar SHALL display a centered pill-shaped search bar on desktop screens (≥768px width)
2. THE Navbar SHALL display category links horizontally on screens ≥1024px width
3. WHEN screen width is less than 1024px THEN THE Navbar SHALL show a hamburger menu icon replacing category links
4. WHEN the hamburger menu is clicked THEN THE System SHALL display a mobile drawer with categories and navigation
5. WHEN a user is authenticated THEN THE Navbar SHALL display a user account link with icon
6. WHEN a user is not authenticated THEN THE Navbar SHALL display a "Login" button
7. THE search bar SHALL have a search icon positioned on the left inside the input
8. THE Navbar SHALL use the brand color (#FF7A1A) for the logo text
9. THE Navbar SHALL use a white background with a border-bottom using the border theme token

### Requirement 4: Footer Component Styling

**User Story:** As a user seeking information about the platform, I want an organized footer with clear sections, so that I can easily find links to help, policies, and categories.

#### Acceptance Criteria

1. THE Footer SHALL have a dark background color (#1A1A1A) using the surface-dark theme token
2. THE Footer SHALL display exactly 4 columns on desktop screens (≥768px width) with headings: About, Explore, Help, Connect
3. WHEN screen width is less than 768px THEN THE Footer SHALL display columns in a single-column layout stacked vertically
4. THE Footer SHALL display text in white or light colors meeting WCAG AA contrast on the dark background
5. THE Footer SHALL include a copyright notice at the bottom with the current year
6. THE Footer link hover states SHALL transition to the brand color with 150ms duration
7. THE Footer SHALL use proper semantic spacing with padding and margins consistent with the design system

### Requirement 5: ListingCard Component Design

**User Story:** As a user browsing listings, I want visually appealing cards that clearly show the transaction modes and item details, so that I can quickly evaluate items.

#### Acceptance Criteria

1. THE ListingCard SHALL use exactly 12px border-radius on the card container
2. WHEN a user hovers over a ListingCard THEN THE System SHALL apply a hover effect with box-shadow transition over 200ms
3. THE ListingCard SHALL display mode badges (Buy, Rent, or Swap) in the top-left corner of the image
4. WHEN the listing is available for purchase THEN THE System SHALL display a "Buy" badge with success color (#10B981)
5. WHEN the listing is available for rent THEN THE System SHALL display a "Rent" badge with info color (#3B82F6)
6. WHEN the listing is available for exchange THEN THE System SHALL display a "Swap" badge with warning color (#F59E0B)
7. THE ListingCard SHALL display a heart icon button in the top-right corner for favoriting
8. THE ListingCard image SHALL scale up slightly (scale-105) on hover with 300ms transition
9. THE ListingCard SHALL display the title with a line-clamp of 2 lines to prevent overflow

### Requirement 6: Homepage Hero Section Enhancement

**User Story:** As a new visitor to the site, I want an engaging hero section that explains the platform and provides quick category access, so that I understand the value proposition and can start browsing immediately.

#### Acceptance Criteria

1. THE Hero_Section SHALL be full-width spanning the entire viewport width
2. THE Hero_Section SHALL display a headline, subheading, and exactly 2 call-to-action buttons
3. THE Hero_Section SHALL display a horizontal strip of category chips below the CTAs
4. THE category chips SHALL be clickable and navigate to the respective category search pages
5. THE Hero_Section SHALL use a gradient background from brand-light to white
6. THE primary CTA button SHALL use the brand color and secondary CTA SHALL use an outline style
7. THE Hero_Section SHALL be responsive and stack content vertically on screens less than 768px width

### Requirement 7: Search Page Filter Sidebar

**User Story:** As a user searching for items, I want a clear filter sidebar to refine my results, so that I can narrow down listings to exactly what I need.

#### Acceptance Criteria

1. THE Filter_Sidebar SHALL have a width of exactly 240px on desktop screens (≥1024px width)
2. WHEN screen width is less than 1024px THEN THE Filter_Sidebar SHALL display as a drawer overlay that slides in from the left
3. THE Search page SHALL display a filter toggle button on mobile that opens the Filter_Sidebar drawer
4. THE System SHALL display the total results count above the listings grid
5. THE Search page SHALL display pagination controls when results exceed one page
6. THE pagination SHALL show page numbers with Previous and Next buttons
7. THE Filter_Sidebar SHALL include filters for: category, size, price range, condition, city, and transaction modes

### Requirement 8: Listing Detail Page Layout

**User Story:** As a user viewing a listing, I want a clear two-column layout with photos and details, so that I can thoroughly evaluate the item before making a decision.

#### Acceptance Criteria

1. THE Listing_Detail_Page SHALL use a two-column layout on screens ≥768px width
2. THE left column SHALL display a photo gallery allowing navigation through all listing images
3. THE right column SHALL display listing details including title, price, description, and seller information
4. THE Listing_Detail_Page SHALL display mode tabs (Buy/Rent/Swap) when multiple modes are available
5. WHEN a user clicks a mode tab THEN THE System SHALL update the display to show mode-specific pricing and actions
6. THE Listing_Detail_Page SHALL display a seller card component with avatar, name, rating, and message button
7. WHEN screen width is less than 768px THEN THE Listing_Detail_Page SHALL stack content in a single column

### Requirement 9: Create Listing Page Structure

**User Story:** As a seller creating a listing, I want a clear two-column form with photo upload and details entry, so that I can efficiently create my listing.

#### Acceptance Criteria

1. THE Create_Listing_Page SHALL use a two-column layout on screens ≥768px width
2. THE left column SHALL display a photo upload area with drag-and-drop support and upload preview
3. THE right column SHALL display the listing form with fields for title, description, price, category, size, condition, and location
4. THE Create_Listing_Page SHALL use toggle switches for enabling rental and exchange modes
5. WHEN a toggle switch is activated THEN THE System SHALL smoothly reveal additional fields with 200ms transition
6. THE Create_Listing_Page SHALL display a prominent "Publish Listing" button at the bottom
7. WHEN screen width is less than 768px THEN THE Create_Listing_Page SHALL stack content in a single column

### Requirement 10: Authentication Pages Minimal Layout

**User Story:** As a user logging in or setting up my profile, I want a focused layout without distracting navigation elements, so that I can complete the authentication flow efficiently.

#### Acceptance Criteria

1. THE Auth_Pages SHALL display the minimal Navbar variant without category links or search bar
2. THE Auth_Pages SHALL NOT display the Footer component
3. THE login page SHALL display a centered card with maximum width of 448px (max-w-md)
4. THE OTP input SHALL display exactly 6 input boxes styled individually for each digit
5. THE OTP input boxes SHALL have a minimum tap target of 44x44 pixels for mobile accessibility
6. THE Auth_Pages SHALL use a light background color (gray-light) for the page surrounding the centered card
7. THE Auth_Pages card SHALL use white background with rounded corners (12px border-radius) and subtle shadow

### Requirement 11: Messages Page Two-Panel Layout

**User Story:** As a user communicating with other users, I want a two-panel layout showing my conversations and current chat, so that I can efficiently manage multiple conversations.

#### Acceptance Criteria

1. THE Messages_Page SHALL use a two-panel layout on screens ≥768px width
2. THE left panel SHALL display a scrollable list of conversations with avatars and message previews
3. THE right panel SHALL display the active conversation chat interface
4. WHEN screen width is less than 768px THEN THE Messages_Page SHALL show only the conversation list, and clicking a conversation SHALL navigate to a full-screen chat view
5. THE conversation list items SHALL have a minimum height of 72px for comfortable tap targets
6. THE active conversation SHALL be highlighted with a background color in the conversation list
7. THE chat interface SHALL display messages with sender alignment (left for others, right for current user)

### Requirement 12: Orders Page Tabs and Status Badges

**User Story:** As a user managing my orders, I want clear tabs and color-coded status badges, so that I can quickly understand the state of each order.

#### Acceptance Criteria

1. THE Orders_Page SHALL display pill-style tabs for filtering orders by status: All, Active, Completed, Cancelled
2. THE active tab SHALL be highlighted with the brand color background and white text
3. THE inactive tabs SHALL have a transparent background with border and transition on hover
4. THE System SHALL display color-coded status badges for each order: Active (info color), Completed (success color), Cancelled (text-muted), Pending (warning color)
5. WHEN no orders exist for the selected tab THEN THE System SHALL display an Empty_State component
6. THE Empty_State SHALL include an icon, descriptive message, and a call-to-action button
7. THE order list items SHALL display in a card layout with 12px border-radius and consistent spacing

### Requirement 13: Profile Page Layout and Banner

**User Story:** As a user viewing a profile, I want an attractive banner with user info and organized listings grid, so that I can understand the user's reputation and browse their items.

#### Acceptance Criteria

1. THE Profile_Page SHALL display a cover banner at the top with gradient background using brand colors
2. THE cover banner SHALL have a minimum height of 200px
3. THE profile avatar SHALL overlay the cover banner, positioned at the bottom edge, centered or left-aligned
4. THE Profile_Page SHALL display a stats row showing: Total Listings, Rating, and Verified Status
5. THE Profile_Page SHALL display user listings in a responsive grid below the profile information
6. THE listings grid SHALL use 2 columns on mobile, 3 on tablet, and 4 on desktop screens
7. WHEN the profile has no listings THEN THE System SHALL display an Empty_State with appropriate message

### Requirement 14: Loading States with Skeleton Loaders

**User Story:** As a user waiting for content to load, I want skeleton loaders that match the content shape, so that I have a smooth loading experience without jarring layout shifts.

#### Acceptance Criteria

1. THE System SHALL use Skeleton_Loader components instead of spinning indicators for content placeholders
2. THE ListingCard skeleton SHALL match the shape and dimensions of the actual ListingCard
3. THE skeleton loaders SHALL animate with a shimmer effect using CSS animations
4. THE System SHALL display skeleton loaders for: listing grids, profile information, messages list, and order cards
5. WHEN content finishes loading THEN THE System SHALL smoothly transition from skeleton to actual content without layout shift
6. THE skeleton loaders SHALL use neutral gray colors (text-muted with lower opacity)
7. THE skeleton loader animation SHALL loop continuously at approximately 1.5 second intervals

### Requirement 15: Empty States Design

**User Story:** As a user encountering empty lists, I want clear empty state displays with guidance, so that I understand why nothing is shown and what action I can take.

#### Acceptance Criteria

1. THE System SHALL display Empty_State components for all empty lists: search results, messages, orders, profile listings, favorites
2. THE Empty_State SHALL include an icon relevant to the context (search icon for no results, message icon for no messages, etc.)
3. THE Empty_State SHALL include a descriptive message explaining why the list is empty
4. THE Empty_State SHALL include a call-to-action button guiding the user to a relevant action
5. THE Empty_State SHALL be vertically centered within the content area with appropriate padding
6. THE Empty_State icon SHALL use text-muted color and be sized appropriately (64px or larger)
7. THE Empty_State message text SHALL use text-secondary color for readability

### Requirement 16: Mobile Responsiveness Standards

**User Story:** As a mobile user, I want the entire application to work seamlessly on my device with appropriate touch targets, so that I can comfortably use all features on my phone.

#### Acceptance Criteria

1. THE System SHALL be fully functional and visually correct at 375px viewport width (iPhone SE)
2. THE System SHALL be fully functional and visually correct at 768px viewport width (tablet)
3. THE System SHALL use a minimum tap target size of 44x44 pixels for all interactive elements on mobile
4. THE System SHALL use responsive breakpoints at 640px (sm), 768px (md), 1024px (lg), and 1280px (xl)
5. WHEN screen width is less than 768px THEN THE System SHALL stack two-column layouts into single columns
6. THE System SHALL use appropriate font sizes for mobile: minimum 16px for body text to prevent zoom on iOS
7. THE System SHALL handle touch gestures appropriately for mobile interactions (swipe, tap, scroll)

### Requirement 17: Tailwind v4 Theme Configuration

**User Story:** As a developer implementing designs, I want a complete theme configuration in globals.css, so that I can use consistent design tokens throughout the application.

#### Acceptance Criteria

1. THE globals.css file SHALL define all theme tokens using @theme inline syntax (Tailwind v4 CSS-first configuration)
2. THE theme SHALL include color tokens for: brand, brand-light, text-primary, text-secondary, text-muted, border, surface-dark, success, info, warning, error
3. THE theme SHALL include spacing tokens for consistent padding and margins throughout the application
4. THE theme SHALL include border-radius tokens: radius-sm (8px), radius-md (12px), radius-lg (16px)
5. THE theme SHALL include transition timing values: transition-fast (150ms), transition-normal (200ms)
6. THE System SHALL NOT use tailwind.config.ts for theme configuration, using globals.css @theme exclusively
7. THE theme tokens SHALL be accessible via Tailwind utility classes throughout the application

### Requirement 18: Transition and Animation Standards

**User Story:** As a user interacting with the interface, I want smooth transitions and animations, so that the application feels polished and responsive.

#### Acceptance Criteria

1. THE System SHALL apply 150ms transitions to button hover states
2. THE System SHALL apply 200ms transitions to card hover states
3. THE System SHALL apply smooth transitions to mode switch tabs with 200ms duration
4. THE System SHALL use CSS transitions with ease-in-out timing function for all hover effects
5. WHEN a dropdown or drawer opens THEN THE System SHALL animate the appearance with 200ms transition
6. THE System SHALL use transform properties (scale, translate) for animations instead of dimension properties for performance
7. THE System SHALL reduce motion for users with prefers-reduced-motion preference enabled
