# 🚨 CRITICAL: System Clock Issue Fix

## **Problem Detected**
Your system clock shows **August 27, 2025** instead of **August 27, 2024**. This is causing:
- JWT tokens to appear "issued in the future"
- Clock skew errors with Clerk authentication
- 401 authentication failures
- Infinite redirect loops

## **Immediate Fix Required**

### **Step 1: Fix System Date (Windows)**

**Method 1: Automatic Time Sync (Recommended)**
```powershell
# Run PowerShell as Administrator
w32tm /config /manualpeerlist:"time.windows.com" /syncfromflags:manual /reliable:YES /update
w32tm /resync
```

**Method 2: Manual Fix**
1. Right-click on the clock in the taskbar
2. Select "Adjust date/time"
3. Turn OFF "Set time automatically"
4. Manually set the correct date: **August 27, 2024**
5. Turn ON "Set time automatically" again
6. Click "Sync now"

**Method 3: Command Line (Run as Administrator)**
```cmd
date 08-27-2024
time 21:30:00
w32tm /resync
```

### **Step 2: Verify Fix**
```powershell
Get-Date
# Should show August 27, 2024, not 2025
```

### **Step 3: Clear Browser Data**
1. Close all browser windows
2. Clear cookies and local storage for localhost:3000
3. Or use incognito/private browsing mode

### **Step 4: Restart Development Server**
```bash
# Stop the current server (Ctrl+C)
npm run dev
```

## **Why This Happens**
- System BIOS/UEFI clock set incorrectly
- Time zone issues
- Virtual machine time sync problems
- Hibernation/sleep recovery issues

## **Verification Steps**
After fixing the clock:

1. **Check system time**: Should show correct year (2024)
2. **Test auth flow**: Sign up/sign in should work without clock skew errors
3. **Check terminal logs**: No more "JWT issued in future" messages
4. **Test restaurant signup**: Should redirect properly without infinite loops

## **If Issues Persist**

### **Environment Variables Check**
Create `.env.local`:
```env
# Use your actual Clerk keys
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=pk_test_your_key_here
CLERK_SECRET_KEY=sk_test_your_key_here

# Ensure these URLs are correct
NEXT_PUBLIC_CLERK_SIGN_IN_URL=/sign-in
NEXT_PUBLIC_CLERK_SIGN_UP_URL=/sign-up
NEXT_PUBLIC_CLERK_AFTER_SIGN_IN_URL=/onboarding
NEXT_PUBLIC_CLERK_AFTER_SIGN_UP_URL=/onboarding

# Database
DATABASE_URL=your_database_url_here

# Optional: Google Maps API for location features
GOOGLE_MAPS_API_KEY=your_google_maps_key_here
```

### **Additional Debugging**
```bash
# Clear Next.js cache
rm -rf .next

# Restart development server
npm run dev
```

## **Testing Checklist**
- [ ] System clock shows 2024 (not 2025)
- [ ] No clock skew errors in terminal
- [ ] Sign up/sign in works without errors
- [ ] Restaurant onboarding completes successfully
- [ ] Automatic redirect to dashboard works
- [ ] Header shows "Restaurant Dashboard" after signup
- [ ] Location-based restaurant discovery works

## **Emergency Workaround**
If you can't fix the system clock immediately:
1. Use a different computer/device with correct time
2. Use a cloud development environment (CodeSandbox, Repl.it)
3. Deploy to Vercel for testing (their servers have correct time)

**This clock issue MUST be fixed before any authentication will work properly!**

