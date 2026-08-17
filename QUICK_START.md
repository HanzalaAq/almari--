# 🚀 Almari - Quick Start (30 Seconds)

## ✅ **GOOD NEWS: Your Dev Server is Already Running!**

I've started the Expo development server for you.

---

## 📱 **Open Your App NOW:**

### **Option 1: Web Browser (Easiest!)**

Open your browser and go to:
```
http://localhost:8081
```

**OR just press `w` in the terminal where Expo is running!**

---

### **Option 2: Physical Phone**

1. Install **Expo Go** app:
   - **iPhone:** https://apps.apple.com/app/expo-go/id982107779
   - **Android:** https://play.google.com/store/apps/details?id=host.exp.exponent

2. Open Expo Go app

3. Scan the QR code shown in your terminal

---

### **Option 3: Emulator**

**iOS Simulator (Mac only):**
- Press `i` in the terminal

**Android Emulator:**
- Open Android Studio → Start an emulator
- Press `a` in the terminal

---

## 🎯 **What You'll See:**

1. **Home Page** - Browse fashion listings
2. **Search** - Filter by category, size, price, etc.
3. **Sell** - Create a listing with photos
4. **Messages** - Real-time chat
5. **Profile** - View stats and wallet

---

## 🔑 **Test the App:**

### **Try This Flow:**

1. **Click "Login"** (top right or tab bar)
   - Enter any phone number (format: 03001234567)
   - Supabase will send an OTP (check your Supabase auth settings)

2. **Browse Listings**
   - Homepage shows all active listings
   - Click categories to filter

3. **Search**
   - Use search bar
   - Apply filters (category, size, price, condition)

4. **Create Listing** (after login)
   - Click "Sell" tab
   - Upload photos
   - Fill in details
   - Toggle Buy/Rent/Exchange options

5. **Messages**
   - View conversations (if any exist)
   - Real-time updates

6. **Profile**
   - View your stats
   - Edit profile
   - Check wallet balance

---

## ⚡ **Making Changes:**

1. Open any file in `app/` or `components/`
2. Edit and save
3. **App reloads automatically!** ✨

Try editing: `app/(tabs)/index.tsx` - Change some text and watch it update!

---

## 🛑 **Stop the Server:**

Press `Ctrl + C` in the terminal where Expo is running

---

## 🔄 **Restart the Server:**

```bash
npx expo start
```

**Or to clear cache:**
```bash
npx expo start -c
```

---

## 📊 **Useful Keyboard Shortcuts:**

In the terminal where Expo is running:

- `w` - Open in web browser
- `i` - Open iOS simulator (Mac)
- `a` - Open Android emulator
- `r` - Reload app
- `m` - Toggle menu
- `?` - Show all commands

---

## ✅ **Everything Working?**

Your app should now be running! 

**Features to test:**
- ✅ Homepage loads
- ✅ Search filters work
- ✅ Create listing form appears
- ✅ Messages page loads
- ✅ Profile page loads
- ✅ Navigation works (tabs on mobile, navbar on web)

---

## 🐛 **If Something's Wrong:**

### **Metro Bundler not starting:**
```bash
# Clear cache and restart
npx expo start -c
```

### **Can't connect:**
- Check `.env.local` has Supabase credentials
- Verify Supabase project is active

### **Build errors:**
```bash
# Reinstall dependencies
npm install
npx expo start
```

---

## 🎉 **You're All Set!**

Your cross-platform fashion marketplace is now running on:
- ✅ Web
- ✅ iOS (if you have Mac)
- ✅ Android (if you have emulator)

**Next Steps:**
1. Test all features
2. Add your seed data to Supabase
3. Customize styles/colors
4. Deploy when ready!

**Happy developing! 🚀**

---

**Need help?** Check `SETUP_GUIDE.md` for detailed instructions.
