# Almari - Pre-Loved Fashion Marketplace

Almari is a Pakistani marketplace for buying, selling, renting, and exchanging pre-loved clothing, similar to Vinted. This is Phase 3 (Complete) of a 3-phase project.

## Tech Stack

- **Frontend**: Next.js 14+ (App Router), TypeScript, Tailwind CSS
- **Backend & Database**: Supabase (Postgres, Auth, Storage, Realtime)
- **Auth**: Supabase Auth with phone number + OTP sign-in
- **Deployment**: Vercel (frontend), Supabase Cloud (backend)

## Phase 1, 2 & 3 Features (Complete MVP)

### ✅ Built in Phase 1

- **Authentication**: Phone number + OTP signup/login via Supabase Auth
- **Profile Setup**: Name, city, and profile photo upload after first login
- **Homepage**: 
  - Hero section with marketplace value proposition
  - Infinite-scroll grid of listing cards (cursor-based pagination, 20 per page)
  - Category navigation (Women, Men, Kids, Traditional, Western, Accessories)
- **Database Schema**: Complete schema for users, listings, orders, exchange_proposals, reviews, messages
- **Row Level Security (RLS)**: Policies to prevent cross-user data access
- **Seed Data**: 50 sample listings for testing
- **Design System**: Orange/white theme with Tailwind tokens

### ✅ Built in Phase 2

- **Create Listing Page** (`/sell`):
  - Multi-photo upload (up to 8 images) to Supabase Storage
  - Drag-and-drop interface with cover photo selection
  - Form fields: Title, Description, Category, Size, Brand, Condition, City
  - Listing type toggles: Buy, Rent, Exchange
  - Price fields for each transaction type
  - Authentication required (redirects to login if not authenticated)
- **Listing Detail Page** (`/listing/[id]`):
  - Photo gallery with thumbnails and main image swap
  - Title, brand, size, condition tag, price in PKR
  - Seller info card with photo, name, city, rating (computed from reviews)
  - Mode tabs showing only supported transaction types (Buy/Rent/Exchange)
  - Action buttons: Buy Now, Rent This, Propose Exchange
  - Message Seller button
  - Owner controls: Edit, Delete, Pause/Activate listing
- **Search & Browse Page** (`/search`):
  - Filter sidebar: Category, Size, Price Range, Condition, Transaction Type, City
  - Sort dropdown: Newest First, Price Low to High, Price High to Low
  - Numbered pagination (Page 1, 2, 3...) with cursor-based queries
  - URL query params for shareable results
  - Homepage search bar wired to navigate here with query
- **Edit Listing Page** (`/listing/[id]/edit`):
  - Same form as Create Listing, pre-filled with existing data
  - Only accessible to listing owner (enforced via RLS + client-side check)
  - Add/remove images functionality
- **Database Enhancements**:
  - Search indexes for efficient filtering (category, city, status, price, condition)
  - Postgres functions for seller rating calculation
  - Expanded seed data to 100+ listings for search testing

### ✅ Built in Phase 3

- **Buy Now Flow** (`/listing/[id]/buy`):
  - Order summary with item price and platform fee (PKR 50 for orders < PKR 2,000, PKR 100 otherwise)
  - Mocked payment service (escrow hold/release/refund) - ready for Aasaan Pay integration
  - On payment success: creates order, marks listing as sold, redirects to orders page
  - Buyer protection info displayed
- **Rent Booking Flow** (`/listing/[id]/rent`):
  - Date range calendar picker for rental start/end dates
  - Price breakdown: rental price × days, security deposit (50%), platform fee, total
  - Mocked payment service to hold funds in escrow
  - Creates order with rental dates and deposit amount
- **Exchange Proposal Flow** (`/listing/[id]/exchange`):
  - Two-card layout: "Their item" and "Your item" (dropdown of user's active listings)
  - Optional top-up amount field in PKR
  - Creates exchange_proposals row with pending status
  - Exchange proposal review UI integrated into orders page (accept/counter-offer/decline)
- **Messages Page** (`/messages`):
  - Two-panel layout: conversation list (avatar, name, last message, unread count, listing thumbnail) and active chat thread
  - Supabase Realtime integration for live message updates without refresh
  - Mobile-responsive with back navigation
  - "Message Seller" button from listing detail page wired to start conversations
- **Orders Page** (`/orders`):
  - Tabs: Active, Completed, Rentals, Exchanges
  - Order cards with status (Pending → Shipped → Delivered → Confirmed), dates, and other party info
  - Buyer can mark "Order Received" (triggers escrow release)
  - Seller can mark "Shipped"
  - For rentals: "Confirm Return" action triggers deposit refund
  - Admin button to process auto-release (simulates cron job for orders shipped 5+ days ago)
- **Public Profile Page** (`/profile/[username]`):
  - Photo, name, city, rating (avg from reviews), stats (Listings, Sold, Rented, Exchanged counts)
  - Grid of user's active listings
  - Message button for non-own profiles
- **Private Account Page** (`/account`):
  - Wallet balance (sum of released payments minus 10% commission)
  - "Withdraw" button (mocked - shows confirmation, no real payout)
  - Order history
  - Account settings (edit name/city/photo, logout)
  - Stats display (Sold, Rented, Exchanged counts)
- **Review System**:
  - Review modal appears after order completion (confirmed/delivered status)
  - 1-5 star rating + optional comment
  - Reviews stored in database and used for seller rating calculation
  - One review per order per user
- **Escrow Auto-Release**:
  - Postgres function `process_auto_release()` to auto-release payments 5 days after shipping
  - Admin button on orders page to trigger this function (simulates cron job)
  - In production, this would be a scheduled function/cron job

### 🔧 Mocked Components (Production Hardening Required)

- **Payment Service** (`lib/payments/escrow.ts`):
  - Currently mocked with in-memory storage and logging
  - Ready for Aasaan Pay API integration
  - Functions: `hold()`, `release()`, `refund()`
- **SMS/OTP**: Supabase Auth in development mode (check dashboard logs for OTP)
- **Delivery Tracking**: Manual status updates (no real courier integration)
- **Withdrawals**: Mocked confirmation only (no real bank transfer)
- **Auto-Release**: Manual admin button instead of automated cron job

## Setup Instructions

### 1. Prerequisites

- Node.js 18+ installed
- A Supabase account (free tier works)

### 2. Supabase Project Setup

1. Go to [supabase.com](https://supabase.com) and create a new project
2. Wait for your project to be ready (2-3 minutes)
3. Navigate to Project Settings → API
4. Copy your project URL and anon key

### 3. Environment Variables

Create a `.env.local` file in the project root:

```bash
NEXT_PUBLIC_SUPABASE_URL=your-supabase-project-url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-supabase-anon-key
```

### 4. Database Setup

Run the SQL migrations in order:

1. **Initial Schema**: Go to Supabase Dashboard → SQL Editor
2. Copy and run the contents of `supabase/migrations/001_initial_schema.sql`
3. **RLS Policies**: Copy and run `supabase/migrations/002_rls_policies.sql`
4. **Seed Data**: Copy and run `supabase/migrations/003_seed_listings.sql`
5. **Search Indexes**: Copy and run `supabase/migrations/004_search_indexes.sql`
6. **Seller Rating Function**: Copy and run `supabase/migrations/005_seller_rating_function.sql`
7. **Expanded Seed Data**: Copy and run `supabase/migrations/006_expand_seed_data.sql` (optional, adds 50 more listings for testing)
8. **Phase 3 Order Updates**: Copy and run `supabase/migrations/007_phase3_order_updates.sql` (adds rental fields, auto-release logic)
9. **Conversations Function**: Copy and run `supabase/migrations/008_conversations_function.sql` (for messages page)

### 5. Storage Setup

#### Profile Pictures Bucket

1. Go to Supabase Dashboard → Storage
2. Create a new bucket named `profile-pictures`
3. Make it public (for profile picture URLs to work)
4. Enable RLS on the bucket with policies allowing users to upload their own pictures

#### Listing Images Bucket (Required for Phase 2)

1. Go to Supabase Dashboard → Storage
2. Create a new bucket named `listing-images`
3. Make it public (for listing image URLs to work)
4. Enable RLS on the bucket with policies allowing authenticated users to upload images
5. Example RLS policy for uploads:
   ```sql
   CREATE POLICY "Users can upload listing images"
   ON storage.objects FOR INSERT
   TO authenticated
   WITH CHECK (bucket_id = 'listing-images');
   
   CREATE POLICY "Public can view listing images"
   ON storage.objects FOR SELECT
   TO public
   USING (bucket_id = 'listing-images');
   ```

### 6. Install Dependencies

```bash
npm install
```

### 7. Run the Development Server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

## Testing the Application

### Test Authentication

1. Click "Login" in the navbar
2. Enter a phone number (format: 03001234567 or +923001234567)
3. You'll receive an OTP (in development, check your Supabase dashboard logs)
4. Enter the OTP to verify
5. Complete your profile setup (name, city, optional photo)
6. You'll be redirected to the homepage

### Test Infinite Scroll

1. Scroll down on the homepage
2. You should see 20 listings initially
3. As you scroll, more listings load automatically
4. The pagination uses cursor-based fetching (id) for efficiency

### Test Create Listing (Phase 2)

1. Log in to your account
2. Click "Start Selling" in the hero section or navigate to `/sell`
3. Upload at least one image (drag and drop or click to select)
4. Fill in the required fields: Title, Description, Category, Condition, City
5. Enable at least one listing type (Buy, Rent, or Exchange)
6. Fill in the relevant price fields
7. Click "Publish Listing"
8. You should be redirected to the homepage and see your new listing

### Test Search & Filters (Phase 2)

1. Navigate to `/search` or use the search bar in the navbar
2. Try different search queries
3. Use the filter sidebar to filter by category, size, price range, condition, city, and transaction type
4. Test the sort options (Newest First, Price Low to High, Price High to Low)
5. Verify numbered pagination works correctly
6. Share a search result URL and verify filters persist

### Test Listing Detail Page (Phase 2)

1. Click on any listing card to view its detail page
2. Verify the photo gallery works (click thumbnails to swap main image)
3. Check seller info card displays correctly with rating
4. Verify only supported transaction modes are shown
5. Test action buttons (they navigate to transaction flows)
6. If you're the listing owner, verify Edit, Delete, and Pause/Activate buttons appear

### Test Buy Flow (Phase 3)

1. Navigate to a listing detail page
2. Click "Buy Now" button
3. Review order summary with item price and platform fee
4. Click "Pay Now" (mocked payment - will simulate payment processing)
5. Verify order is created and listing is marked as sold
6. Redirect to orders page and verify the new order appears

### Test Rent Flow (Phase 3)

1. Navigate to a rentable listing detail page
2. Click "Rent This" button
3. Select rental start and end dates
4. Review price breakdown (rental cost, deposit, platform fee)
5. Click "Confirm & Pay" (mocked payment)
6. Verify order is created with rental dates and deposit
7. Redirect to orders page

### Test Exchange Flow (Phase 3)

1. Navigate to an exchangeable listing detail page
2. Click "Propose Exchange" button
3. Select one of your active listings to offer
4. Optionally add a top-up amount
5. Click "Send Exchange Offer"
6. Verify exchange proposal is created
7. Redirect to orders page

### Test Messages (Phase 3)

1. Navigate to `/messages`
2. View conversation list with last message previews
3. Click on a conversation to open chat thread
4. Send a message and verify it appears immediately
5. Open the page in another browser/tab and verify real-time updates
6. Test mobile responsiveness

### Test Orders (Phase 3)

1. Navigate to `/orders`
2. View different tabs: Active, Completed, Rentals, Exchanges
3. As seller: Mark an order as "Shipped"
4. As buyer: Mark a shipped order as "Received" (triggers escrow release)
5. For rentals: Confirm return to trigger deposit refund
6. Click "Process Auto-Release" admin button to simulate cron job
7. Leave a review on completed orders

### Test Profile & Wallet (Phase 3)

1. Navigate to `/account` to view your private account page
2. Verify wallet balance reflects released payments minus commission
3. Click "Withdraw" (mocked - shows confirmation)
4. Edit your profile (name, city)
5. Navigate to `/profile/[username]` to view public profile
6. Verify stats display correctly (Listings, Sold, Rented, Exchanged)
7. View user's active listings grid

### Test RLS Policies

To verify RLS is working:

1. Log in as User A
2. Try to access User B's data directly via Supabase client - it should be blocked
3. Users can only view their own data in users, listings, orders, and messages tables
4. Active listings are visible to everyone for the marketplace to function

## Project Structure

```
almari-web/
├── app/
│   ├── login/              # Phone OTP login page
│   ├── profile-setup/      # Profile completion after signup
│   ├── sell/               # Create listing page (Phase 2)
│   ├── search/             # Search & browse page (Phase 2)
│   ├── messages/           # Messages page with Realtime (Phase 3)
│   ├── orders/             # Orders page with tabs (Phase 3)
│   ├── account/            # Private account page with wallet (Phase 3)
│   ├── profile/
│   │   └── [username]/     # Public profile page (Phase 3)
│   ├── listing/
│   │   └── [id]/           # Listing detail page (Phase 2)
│   │       ├── buy/        # Buy flow page (Phase 3)
│   │       ├── rent/       # Rent flow page (Phase 3)
│   │       ├── exchange/   # Exchange proposal page (Phase 3)
│   │       └── edit/       # Edit listing page (Phase 2)
│   ├── globals.css         # Tailwind theme configuration
│   ├── layout.tsx          # Root layout with metadata
│   └── page.tsx            # Homepage
├── components/
│   ├── home/
│   │   ├── HeroSection.tsx # Hero banner
│   │   └── ListingsGrid.tsx # Infinite scroll listings
│   ├── layout/
│   │   ├── Navbar.tsx      # Top navigation (with search wired)
│   │   └── Footer.tsx      # Footer
│   ├── listings/
│   │   └── ListingCard.tsx # Individual listing card
│   └── ui/
│       ├── Button.tsx      # Reusable button
│       ├── Modal.tsx       # Reusable modal
│       ├── LoadingSpinner.tsx # Loading indicator
│       └── ReviewModal.tsx # Review submission modal (Phase 3)
├── lib/
│   ├── payments/
│   │   └── escrow.ts       # Mocked payment service (Phase 3)
│   └── supabase/
│       ├── client.ts       # Browser Supabase client
│       ├── server.ts       # Server Supabase client
│       └── supabase-config.ts # Config management
└── supabase/
    └── migrations/
        ├── 001_initial_schema.sql
        ├── 002_rls_policies.sql
        ├── 003_seed_listings.sql
        ├── 004_search_indexes.sql (Phase 2)
        ├── 005_seller_rating_function.sql (Phase 2)
        ├── 006_expand_seed_data.sql (Phase 2)
        ├── 007_phase3_order_updates.sql (Phase 3)
        └── 008_conversations_function.sql (Phase 3)
```

## Design System

- **Primary Color**: Orange (#FF7A1A)
- **Background**: White (#FFFFFF), Light Gray (#F7F7F7)
- **Text**: Dark Gray (#1A1A1A)
- **Typography**: Inter (via Geist Sans)
- **Border Radius**: 12px (cards), 16px (large components)
- **Shadows**: Subtle, clean aesthetic

## Deployment

### Vercel (Frontend)

1. Push your code to GitHub
2. Import the project in Vercel
3. Add environment variables in Vercel dashboard
4. Deploy

### Supabase (Backend)

Your Supabase project is already hosted. Just ensure:
- RLS policies are enabled
- Storage buckets are configured
- Environment variables point to your production Supabase project

## Troubleshooting

**OTP not received**: In development, check Supabase Dashboard → Auth → Users to see the verification code in logs.

**Images not loading**: Ensure the `profile-pictures` and `listing-images` storage buckets are public and RLS policies allow read access.

**Infinite scroll not working**: Check browser console for errors. Ensure Supabase connection is working and listings exist in the database.

**RLS blocking legitimate access**: Review policies in `002_rls_policies.sql`. The marketplace needs public read access to active listings.

**Messages not updating in real-time**: Ensure Supabase Realtime is enabled for your project and the `messages` table has replication enabled.

**Payment/escrow not working**: The payment service is mocked. Check browser console for logs showing the simulated payment flow.

**Auto-release not triggering**: Use the "Process Auto-Release" admin button on the orders page to simulate the cron job functionality.

**Exchange proposals not showing**: Ensure both users have active listings marked as exchangeable. Check the `exchange_proposals` table for pending proposals.

## License

This project is for demonstration purposes.
