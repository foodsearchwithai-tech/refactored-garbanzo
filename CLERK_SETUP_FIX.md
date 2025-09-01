# Clerk Configuration Fix

## Common Issues and Solutions

### 1. Clock Skew Detected
**Error**: `JWT issued at date claim (iat) is in the future`

**Solutions**:
1. **Check System Time**: Ensure your system clock is accurate
   - Windows: Settings > Time & Language > Date & Time > Sync now
   - macOS: System Preferences > Date & Time > Set date and time automatically
   - Linux: `sudo ntpdate -s time.nist.gov`

2. **Restart Development Server**: After fixing system time
   ```bash
   # Stop the server (Ctrl+C)
   npm run dev
   ```

### 2. Infinite Redirect Loop
**Error**: `Refreshing the session token resulted in an infinite redirect loop`

**Solutions**:
1. **Verify Clerk Keys**: Ensure publishable and secret keys match
   ```env
   # .env.local
   NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=pk_test_your_correct_key
   CLERK_SECRET_KEY=sk_test_your_correct_key
   ```

2. **Check Clerk Dashboard URLs**: Verify redirect URLs in Clerk Dashboard
   - Sign-in URL: `/sign-in`
   - Sign-up URL: `/sign-up`
   - After sign-in URL: `/onboarding`
   - After sign-up URL: `/onboarding`

3. **Clear Browser Data**: Clear cookies and local storage
   - Chrome: Dev Tools > Application > Clear Storage
   - Or use incognito mode for testing

### 3. 401 Unauthorized Errors

**Solutions**:
1. **Middleware Configuration**: Ensure routes are properly protected
2. **API Route Auth**: Verify `auth()` is called correctly in API routes
3. **Session Sync**: Allow time for Clerk session to sync after signup

### 4. Restaurant Dashboard Not Loading

**Symptoms**:
- 404 errors on `/restaurant-dashboard`
- Header still shows "Become a Restaurant" after signup

**Solutions**:
1. **Complete Onboarding**: Ensure restaurant onboarding is fully completed
2. **User Metadata**: Verify user metadata includes `userType: 'restaurant_owner'`
3. **Database Records**: Check that restaurant record is created in database

## Environment Variables Checklist

Create/verify `.env.local`:

```env
# Clerk Authentication
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=pk_test_xxxxxxxxxxxxx
CLERK_SECRET_KEY=sk_test_xxxxxxxxxxxxx

# Clerk URLs (should match your domain)
NEXT_PUBLIC_CLERK_SIGN_IN_URL=/sign-in
NEXT_PUBLIC_CLERK_SIGN_UP_URL=/sign-up
NEXT_PUBLIC_CLERK_AFTER_SIGN_IN_URL=/onboarding
NEXT_PUBLIC_CLERK_AFTER_SIGN_UP_URL=/onboarding

# Database
DATABASE_URL=postgresql://username:password@host/database

# Vercel Blob (for image uploads)
BLOB_READ_WRITE_TOKEN=your_blob_token

# Geocoding (optional)
GEOCODING_API_KEY=your_geocoding_key
```

## Testing the Fix

1. **Clear Browser Data**: Use incognito or clear cookies
2. **Restart Server**: `npm run dev`
3. **Test Flow**:
   - Visit `/restaurant-signup`
   - Complete signup/signin
   - Complete restaurant onboarding
   - Verify redirect to `/restaurant-dashboard?welcome=true`
   - Check header shows "Restaurant Dashboard" instead of "Become a Restaurant"

## Debug Steps

1. **Check Console**: Look for specific error messages
2. **Network Tab**: Monitor API calls and responses
3. **Clerk User Data**: Verify `user.unsafeMetadata` contains correct values
4. **Database**: Confirm restaurant record exists with correct `ownerId`

## If Issues Persist

1. **Regenerate Clerk Keys**: Create new application in Clerk Dashboard
2. **Database Reset**: Clear and recreate user/restaurant records
3. **Cache Clear**: Clear Next.js cache (`rm -rf .next`)

