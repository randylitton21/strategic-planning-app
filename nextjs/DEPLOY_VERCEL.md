## What you’re deploying
This is the Next.js rewrite (beta) located in `StrategicPlanningApp_Rewrite/nextjs`.

It includes:
- Public pages: `/`, `/pricing`, `/about`, `/contact`
- App routes: `/app/*`
- Legacy tools embedded (beta bridge): `/app/<tool>` loads `/public/legacy/*.html` in an iframe
- Firebase Auth + Firestore sync (per user, per tool)

---

## 1) Create your Firebase project
In Firebase Console:
- Create a new project (ex: `strategic-planning-suite-beta`)
- **Authentication → Sign-in method**: enable **Email/Password**
- **Firestore Database**: create a database (production mode is fine)

Then go to **Project settings → General → Your apps**:
- Add a **Web app**
- Copy the Firebase config values

---

## 2) Add env vars (local + Vercel)
### Local
Create `nextjs/.env.local` (do NOT commit it) and paste:

```
NEXT_PUBLIC_FIREBASE_API_KEY=...
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=...
NEXT_PUBLIC_FIREBASE_PROJECT_ID=...
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=...
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=...
NEXT_PUBLIC_FIREBASE_APP_ID=...
```

### Vercel
In Vercel Project Settings → Environment Variables, add the same values.

---

## 3) Lock down Firestore access (rules)
In Firebase Console → Firestore → Rules, paste `nextjs/firestore.rules`.

This setup only lets a signed-in user read/write their own docs under:
- `users/{uid}`
- `users/{uid}/tools/{toolId}`

---

## 4) Add your Vercel URL to Firebase (required for login)
In Firebase Console → **Authentication** → **Settings** → **Authorized domains**:
- Add your Vercel domain, e.g. `your-project.vercel.app` (and `your-project-*.vercel.app` if you use preview URLs).
- Without this, sign-in will be blocked on the deployed site.

---

## 5) Deploy to Vercel (fastest path)
In Vercel:
- “Add New Project”
- Import from Git (recommended), or deploy from local
- **Root Directory**: `nextjs`
- Build command: `npm run build`
- Output: (leave default; Next.js handles it)
- Add the six **Environment Variables** (same as `.env.local`) in Project Settings → Environment Variables for **Production** (and Preview if you want login on preview deploys).

After deploy, visit:
- `/app/login` to create an account
- `/app` to open tools

---

## 6) Quick beta verification checklist
- Create **two test accounts**
- Verify for each account:
  - Sign in / sign out works
  - Open a tool and enter a few fields
  - Refresh the page: data returns
  - Open the same tool on another device/browser: data syncs

---

## Optional: test on your phone right now (same Wi‑Fi)
When running `npm run dev`, Next prints a Network URL like:
- `http://<your-ip>:3000`

Open that URL on your phone while on the same Wi‑Fi.

