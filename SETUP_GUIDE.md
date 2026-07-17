# Almari - Complete Setup & Run Guide

**Cross-Platform Fashion Marketplace**  
Built with: Expo Router + React Native + Supabase + NativeWind

---

## 📋 Prerequisites

Before starting, ensure you have:

### **Required:**
- ✅ **Node.js** (v18 or higher) - [Download](https://nodejs.org/)
- ✅ **npm** or **yarn** (comes with Node.js)
- ✅ **Git** - [Download](https://git-scm.com/)

### **For Mobile Development (Optional):**
- **iOS Development (Mac only):**
  - Xcode (from Mac App Store)
  - iOS Simulator (included with Xcode)
  
- **Android Development:**
  - Android Studio - [Download](https://developer.android.com/studio)
  - Android SDK & Emulator (configured in Android Studio)

---

## 🚀 Quick Start (5 Minutes)

### **Step 1: Install Dependencies**

Open terminal in project directory and run:

```bash
npm install
```

This will install all required packages (Expo, React Native, Supabase, etc.)

---

### **Step 2: Set Up Environment Variables**

Your `.env.local` file should already exist. Verify it has:

```env
NEXT_PUBLIC_SUPABASE_URL=your-supabase-url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-supabase-anon-key
```

**If missing, create `.env.local` in project root with your Supabase credentials.**

---

### **Step 3: Start Development Server**

```bash
npx expo start
```

This starts the Expo development server. You'll see:

```
Metro waiting on exp://192.168.x.x:8081
› Press w │ open in browser (web)
› Press a │ open in Android emulator  
› Press i │ open in iOS simulator
› Press r │ reload app
```

---

### **Step 4: Choose Your Platform**

#### **🌐 Web (Easiest - Start Here!)**
Press `w` or open: http://localhost:8081

Your app will open in your default browser!

#### **📱 iOS Simulator (Mac Only)**
1. Ensure Xcode is installed
2. Press `i` in terminal
3. Simulator will open automatically

#### **🤖 Android Emulator**
1. Open Android Studio → Device Manager
2. Start an emulator (Pixel 5 recommended)
3. Press `a` in terminal
4. App installs and opens automatically

#### **📲 Physical Device (via Expo Go)**
1. Install **Expo Go** app on your phone:
   - [iOS App Store](https://apps.apple.com/app/expo-go/id982107779)
   - [Google Play Store](https://play.google.com/store/apps/details?id=host.exp.exponent)
2. Scan QR code shown in terminal
3. App opens in Expo Go

---

## 🗄️ Database Setup (Supabase)

### **If You Already Have Supabase Configured:**
✅ Skip this section - your database is ready!

### **If Starting Fresh:**

1. **Go to [Supabase.com](https://supabase.com/)**
2. **Create a new project** (free tier available)
3. **Run migrations** (from `supabase/migrations/` folder):

```bash
# Install Supabase CLI
npm install -g supabase

# Link to your project
supabase link --project-ref your-project-ref

# Run all migrations
supabase db push
```

4. **Get your credentials:**
   - Go to Project Settings → API
   - Copy `URL` and `anon/public` key
   - Add to `.env.local`

---

## 📱 Testing on Different Platforms

### **Web (Recommended First):**
```bash
npx expo start --web
```
Opens directly in browser at http://localhost:8081

### **iOS Simulator:**
```bash
npx expo start --ios
```
Requires Xcode (Mac only)

### **Android Emulator:**
```bash
npx expo start --android
```
Requires Android Studio + emulator running

---

## 🔧 Common Issues & Fixes

### **Issue: "Metro bundler failed to start"**
**Fix:**
```bash
# Clear cache and restart
npx expo start -c
```

### **Issue: "Module not found"**
**Fix:**
```bash
# Reinstall dependencies
rm -rf node_modules
npm install
```

### **Issue: "Can't connect to Supabase"**
**Fix:**
- Check `.env.local` has correct credentials
- Verify Supabase project is active
- Check internet connection

### **Issue: "iOS build fails"**
**Fix:**
```bash
# Clean iOS build
cd ios
pod install --repo-update
cd ..
npx expo start --ios
```

### **Issue: "Android build fails"**
**Fix:**
- Ensure Android Studio SDK is installed
- Check emulator is running
- Try: `npx expo start --android --clear`

### **Issue: "Changes not reflecting"**
**Fix:**
```bash
# Press 'r' in terminal to reload
# Or press 'Shift + r' for full reload
```

---

## 📂 Project Structure

```
almari-web/
├── app/                      # Expo Router pages
│   ├── (auth)/              # Auth screens (login, setup)
│   ├── (tabs)/              # Tab navigation screens
│   ├── listing/             # Listing detail & flows
│   ├── orders/              # Orders screen
│   └── _layout.tsx          # Root layout
│
├── components/              # Reusable components
│   ├── layout/             # Navigation (WebNavbar, MobileTabBar)
│   └── ui/                 # UI components (Button, etc)
│
├── lib/                    # Utilities
│   └── supabase/           # Supabase client
│
├── store/                  # Zustand state management
│   └── useAuthStore.ts     # Auth state
│
├── supabase/              # Database
│   └── migrations/        # SQL migrations
│
├── .env.local             # Environment variables
├── global.css             # NativeWind styles
├── tailwind.config.js     # Tailwind configuration
└── package.json           # Dependencies
```

---

## 🎨 Development Workflow

### **1. Start Dev Server:**
```bash
npx expo start
```

### **2. Make Changes:**
- Edit any file in `app/` or `components/`
- Save the file
- App auto-reloads instantly!

### **3. Check Logs:**
- Terminal shows Metro bundler logs
- Browser console (web) shows errors
- Device logs appear in terminal

### **4. Test Features:**
- ✅ Homepage feed
- ✅ Search & filters
- ✅ Create listing (with photo upload)
- ✅ Messages (realtime chat)
- ✅ Profile & wallet
- ✅ Orders management

---

## 🚀 Deployment

### **Web Deployment (Vercel):**

```bash
# Build for web
npx expo export --platform web

# Deploy to Vercel
npm install -g vercel
vercel
```

### **iOS Deployment (TestFlight/App Store):**

```bash
# Install EAS CLI
npm install -g eas-cli

# Configure EAS
eas build:configure

# Build for iOS
eas build --platform ios

# Submit to App Store
eas submit --platform ios
```

### **Android Deployment (Play Store):**

```bash
# Build for Android
eas build --platform android

# Submit to Play Store
eas submit --platform android
```

---

## 📱 Key Features to Test

### **1. Authentication:**
- Phone number + OTP login
- Profile setup on first login

### **2. Home Feed:**
- Browse listings
- Filter by category
- Infinite scroll (load more)

### **3. Search:**
- Text search
- Filter by: category, size, condition, city, price
- Works on web (sidebar) and mobile (drawer)

### **4. Create Listing:**
- Upload photos (multi-select)
- Toggle Buy/Rent/Exchange modes
- Form validation

### **5. Messages:**
- Real-time chat
- Conversation list
- Two-panel on web, stack on mobile

### **6. Profile:**
- View stats
- Edit profile
- Upload photo
- Wallet balance
- View listings

### **7. Orders:**
- View all orders
- Filter: Active, Completed, Rentals, Exchanges
- Update order status
- Seller & buyer actions

---

## 🔐 Test Accounts

Create test accounts to try:

1. **Seller Account:**
   - Create listing
   - Manage orders
   - Check wallet

2. **Buyer Account:**
   - Browse listings
   - Place order
   - Send messages

3. **Both:**
   - Test chat between accounts
   - Test order flow end-to-end

---

## 📊 Performance Tips

### **For Development:**
- Use web first (fastest reload)
- Enable Fast Refresh (enabled by default)
- Use React DevTools (web)

### **For Production:**
- Optimize images (compress before upload)
- Use pagination (already implemented)
- Cache with TanStack Query (already configured)
- Enable Hermes JS engine (Android - already enabled)

---

## 🐛 Debugging

### **Web:**
```bash
# Open browser DevTools (F12)
# Check Console for errors
# Use React DevTools extension
```

### **iOS:**
```bash
# Safari → Develop → Simulator → [Your App]
# Or use React Native Debugger
```

### **Android:**
```bash
# Chrome DevTools
# chrome://inspect
# Or shake device → "Debug"
```

### **View Logs:**
```bash
# In terminal where expo is running
# All platform logs appear here
```

---

## ✅ Checklist Before First Run

- [ ] Node.js installed (v18+)
- [ ] Dependencies installed (`npm install`)
- [ ] `.env.local` file exists with Supabase credentials
- [ ] Supabase project is active
- [ ] Database migrations applied
- [ ] Dev server starts without errors (`npx expo start`)

---

## 🆘 Get Help

### **Expo Docs:**
- [Expo Router](https://docs.expo.dev/router/introduction/)
- [Expo DevTools](https://docs.expo.dev/debugging/devtools/)

### **Supabase Docs:**
- [Supabase with Expo](https://supabase.com/docs/guides/getting-started/tutorials/with-expo-react-native)

### **Common Commands:**
```bash
# Start dev server
npx expo start

# Clear cache
npx expo start -c

# Install dependencies
npm install

# Check Expo version
npx expo --version

# Update Expo
npx expo install expo@latest

# Check for outdated packages
npm outdated
```

---

## 🎉 Ready to Go!

Your setup is complete! Start with:

```bash
npx expo start
```

Then press `w` to open in browser and explore your app!

**Happy coding! 🚀**
