# 🚨 Firebase Sync Not Working - Troubleshooting Guide

## 🔥 Most Common Causes & Fixes

### **1️⃣ Vercel Environment Variables Lost** (Most Likely!)

**Symptoms:** App loads but no sync, console shows "Firebase not configured"

**Check:** Go to [Vercel Dashboard](https://vercel.com/dashboard) → Your Project → Settings → Environment Variables

**Fix:** Re-add these 6 variables (select "All Environments"):
```
NEXT_PUBLIC_FIREBASE_API_KEY=AIzaSyCOxqTtg-7JuHgpEShyxj6hrTKsyhkiZoE
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=strategic-planning-app-7a910.firebaseapp.com
NEXT_PUBLIC_FIREBASE_PROJECT_ID=strategic-planning-app-7a910
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=strategic-planning-app-7a910.firebasestorage.app
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=215896487847
NEXT_PUBLIC_FIREBASE_APP_ID=1:215896487847:web:c04ae0fdae71adb1e96882
```

**Then:** Redeploy Vercel (Deployments tab → ⋮ → Redeploy)

---

### **2️⃣ Firestore Security Rules** (Second Most Likely!)

**Symptoms:** Console shows "permission-denied" errors

**Check:** [Firebase Console](https://console.firebase.google.com/project/strategic-planning-app-7a910/firestore/rules)

**Fix:** Update rules to:
```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    match /users/{userId} {
      allow read, write: if request.auth != null && request.auth.uid == userId;

      match /tools/{toolId} {
        allow read, write: if request.auth != null && request.auth.uid == userId;
      }
    }
  }
}
```

---

### **3️⃣ Firebase Project Issues**

**Symptoms:** All Firebase operations fail

**Check:** [Firebase Console](https://console.firebase.google.com/project/strategic-planning-app-7a910)
- Is Firestore enabled?
- Is Authentication enabled?
- Project still exists?

---

### **4️⃣ Vercel Deployment Issues**

**Symptoms:** App loads but Firebase doesn't work

**Check:** Vercel Deployments → Click latest deployment → Check build logs

**Fix:** If build failed, redeploy. If env vars missing, re-add them.

---

## 🔍 Debug Steps

### **Step 1: Open Browser Console (F12)**
Look for these errors:
- `Firebase not configured` → Environment variables missing
- `permission-denied` → Firestore rules issue
- `unavailable` → Network/internet issue
- `not-found` → Firestore database not created

### **Step 2: Test Firebase Connection**
Visit: `https://your-vercel-url.com/debug-sync`

This page will run automatic tests and show exactly what's wrong.

### **Step 3: Test Device-to-Device Sync**
1. **Device A:** Sign in, go to Strategic Planning, type "Test from A"
2. **Device A:** Wait for "Save completed successfully" log
3. **Device B:** Sign in with same account, go to Strategic Planning
4. **Device B:** Should see "Test from A" immediately

---

## 📱 Mobile-Specific Issues

**Symptoms:** Works on desktop, not on mobile

**Possible Causes:**
- Mobile browser caching old version
- Different network/firewall rules
- Mobile Firebase SDK issues

**Fix:** Clear mobile browser cache, try incognito mode

---

## 🛠️ Quick Fixes

### **Fix 1: Hard Refresh**
- Press `Ctrl+Shift+R` (or `Cmd+Shift+R` on Mac)
- Or: Open incognito/private window

### **Fix 2: Sign Out & Back In**
- Sign out completely
- Clear browser data (optional)
- Sign back in
- Try sync again

### **Fix 3: Check Firebase Status**
- Visit: https://status.firebase.google.com/
- Make sure all services are green

---

## 🔧 Advanced Debugging

### **Check Network Tab (F12)**
1. Open Network tab
2. Try to save data
3. Look for failed requests to `firestore.googleapis.com`
4. Check response codes and error messages

### **Check Console Logs**
Look for these success logs when saving:
```
[CLOUDTOOLFRAME] localStorage changed, scheduling save
[CLOUDTOOLFRAME] Saving to Firestore...
[CLOUDTOOLFRAME] Save completed successfully
```

### **Check Console Logs**
Look for these when loading on another device:
```
[CLOUDTOOLFRAME] Firestore data changed, updating localStorage
[CLOUDTOOLFRAME] Sent DATA_READY signal to iframe
[PROTOTYPE] DATA_READY received, loading from localStorage
```

---

## 📞 Need Help?

**Run the diagnostic page:** `https://your-vercel-url.com/debug-sync`

**Share these details:**
1. Browser console errors (F12 → Console tab)
2. Network tab failed requests (F12 → Network tab)
3. Diagnostic page results
4. What device/browser you're using
5. When it last worked

---

## 🎯 Prevention

**After fixing:**
1. ✅ Double-check Vercel env vars are saved
2. ✅ Verify Firestore rules are published
3. ✅ Test sync across 2 devices
4. ✅ Save this troubleshooting guide for next time

---

## 📋 Checklist

- [ ] Vercel env vars set correctly
- [ ] Firestore rules allow authenticated access
- [ ] Firebase project has Firestore enabled
- [ ] Vercel deployment successful
- [ ] Browser cache cleared
- [ ] Tested on multiple devices
- [ ] Console shows success logs