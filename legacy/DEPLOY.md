# Deployment Guide: Strategic Planning Workflow

This guide will help you deploy your Strategic Planning web app to GitHub Pages for free, making it accessible via a public URL.

## 🚀 Quick Start: GitHub Pages Deployment

### Prerequisites
- A GitHub account (create one at [github.com](https://github.com) if needed)
- Git installed on your computer ([Download Git](https://git-scm.com/downloads))
- Your project files ready (index.html, script.js, styles.css)

---

## Step-by-Step Instructions

### Step 1: Initialize Git Repository (If Not Already Done)

Open a terminal/command prompt in your project folder and run:

```bash
git init
git add .
git commit -m "Initial commit: Strategic Planning workflow app"
```

**Note:** If Git is not installed, download it from [git-scm.com](https://git-scm.com/downloads) and restart your terminal.

---

### Step 2: Create GitHub Repository

1. Go to [GitHub.com](https://github.com) and sign in
2. Click the **"+"** icon in the top right → **"New repository"**
3. **Repository name options:**
   - **Option A (Recommended):** Name it `yourusername.github.io` (replace `yourusername` with your GitHub username)
     - This gives you a URL like: `https://yourusername.github.io`
   - **Option B:** Name it anything (e.g., `strategic-planning`)
     - This gives you a URL like: `https://yourusername.github.io/strategic-planning`
4. **Important settings:**
   - ✅ Make it **Public** (required for free GitHub Pages)
   - ❌ Do NOT initialize with README, .gitignore, or license (you already have files)
5. Click **"Create repository"**

---

### Step 3: Connect and Push Your Code

GitHub will show you commands. Use these (replace `yourusername` and `repository-name`):

```bash
git remote add origin https://github.com/yourusername/repository-name.git
git branch -M main
git push -u origin main
```

**If you get authentication errors:**
- GitHub no longer accepts passwords. Use a **Personal Access Token**:
  1. Go to GitHub → Settings → Developer settings → Personal access tokens → Tokens (classic)
  2. Generate new token with `repo` scope
  3. Use the token as your password when pushing

---

### Step 4: Enable GitHub Pages

1. In your GitHub repository, go to **Settings** (top menu)
2. Scroll down to **Pages** (left sidebar)
3. Under **Source**, select:
   - **Branch:** `main`
   - **Folder:** `/ (root)`
4. Click **Save**

---

### Step 5: Get Your Shareable URL

After a few minutes, your site will be live at:

- **If repo is named `username.github.io`:** 
  - `https://yourusername.github.io`
- **If repo has a different name:**
  - `https://yourusername.github.io/repository-name`

**Check status:** Go to Settings → Pages. You'll see a green checkmark when it's deployed.

---

### Step 6: Test Your Deployment

1. Visit your URL in a browser
2. Test all functionality (form inputs, navigation, etc.)
3. Share the link with others!

---

## 🔄 Updating Your Site

After making changes to your code:

### Option 1: Use the Deployment Script (Easiest)

**Windows (PowerShell):**
```powershell
.\deploy.ps1
```

**Mac/Linux:**
```bash
./deploy.sh
```

### Option 2: Manual Commands

```bash
git add .
git commit -m "Update: describe your changes"
git push
```

Changes will appear on your live site within 1-2 minutes.

---

## 🛠️ Troubleshooting

### Site Not Loading / 404 Error
- **Wait 2-5 minutes** after enabling Pages (first deployment takes time)
- Check Settings → Pages shows "Your site is live at..."
- Verify the branch is `main` (or `master` if you used that)
- Clear browser cache and try incognito mode

### Changes Not Appearing
- Wait 1-2 minutes for GitHub to rebuild
- Hard refresh: `Ctrl+F5` (Windows) or `Cmd+Shift+R` (Mac)
- Check GitHub Actions tab for build errors

### Authentication Errors When Pushing
- Use a Personal Access Token instead of password
- Or set up SSH keys for easier authentication

### JavaScript Not Working
- Check browser console for errors (F12)
- Ensure all file paths are correct (case-sensitive on GitHub)
- Verify `script.js` and `styles.css` are in the root directory

### CORS or Security Issues
- GitHub Pages serves over HTTPS automatically
- If loading external resources, ensure they support HTTPS

---

## 🌐 Alternative Deployment Options

### Netlify (Alternative to GitHub Pages)

**Pros:** Faster deployments, custom domains, form handling, serverless functions

**Steps:**
1. Go to [netlify.com](https://netlify.com) and sign up (free)
2. Drag and drop your project folder onto Netlify dashboard
3. Or connect your GitHub repo for automatic deployments
4. Get instant URL: `yourproject.netlify.app`

**Deploy via CLI:**
```bash
npm install -g netlify-cli
netlify deploy --prod
```

---

### Vercel (Alternative to GitHub Pages)

**Pros:** Great for static sites, automatic HTTPS, global CDN

**Steps:**
1. Go to [vercel.com](https://vercel.com) and sign up (free)
2. Import your GitHub repository
3. Or use Vercel CLI:
   ```bash
   npm install -g vercel
   vercel
   ```
4. Get instant URL: `yourproject.vercel.app`

---

## 📝 Tips for Better Online Viewing

Your HTML already includes:
- ✅ Responsive viewport meta tag
- ✅ Proper charset declaration

**Consider adding (optional):**
- Open Graph meta tags for better social sharing
- Favicon for browser tab icon
- Description meta tag for SEO

These are already included in your `index.html` if you want to enhance social sharing.

---

## 🔗 Your Shareable URL Format

Once deployed, your URL will be:
```
https://yourusername.github.io
```
or
```
https://yourusername.github.io/repository-name
```

**Share this link with anyone!** They can access your Strategic Planning workflow without installing anything.

---

## 📚 Additional Resources

- [GitHub Pages Documentation](https://docs.github.com/en/pages)
- [Git Basics](https://git-scm.com/book/en/v2/Getting-Started-Git-Basics)
- [Netlify Documentation](https://docs.netlify.com/)
- [Vercel Documentation](https://vercel.com/docs)

---

## ✅ Deployment Checklist

- [ ] Git repository initialized
- [ ] Code committed locally
- [ ] GitHub repository created
- [ ] Code pushed to GitHub
- [ ] GitHub Pages enabled in Settings
- [ ] Site URL confirmed working
- [ ] Tested all functionality
- [ ] Shared link with others!

**Need help?** Check the troubleshooting section above or visit GitHub's support forums.

