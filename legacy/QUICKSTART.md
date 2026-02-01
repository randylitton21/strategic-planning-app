# 🚀 Quick Start Guide - Deploy Your Site in 5 Steps

Follow these steps to get your Strategic Planning app online:

---

## Step 1: Install Git (If Not Already Installed)

1. **Download Git for Windows:**
   - Go to: https://git-scm.com/download/win
   - Download the installer (it will auto-detect 64-bit or 32-bit)
   - Run the installer with default settings (just click "Next" through all prompts)

2. **Restart your terminal/PowerShell** after installation

3. **Verify installation:**
   ```powershell
   git --version
   ```
   You should see something like `git version 2.x.x`

---

## Step 2: Create a GitHub Account (If You Don't Have One)

1. Go to: https://github.com/signup
2. Create a free account (username, email, password)
3. Verify your email address

---

## Step 3: Initialize Your Local Git Repository

Open PowerShell in your project folder (you're already here!) and run:

```powershell
# Initialize Git repository
git init

# Add all your files
git add .

# Make your first commit
git commit -m "Initial commit: Strategic Planning workflow app"
```

**What this does:** Sets up version control for your project locally.

---

## Step 4: Create GitHub Repository and Push Your Code

### 4a. Create the Repository on GitHub

1. Go to: https://github.com/new
2. **Repository name:** Choose one of these:
   - **Option A (Recommended):** `yourusername.github.io` 
     - Replace `yourusername` with your actual GitHub username
     - This gives you: `https://yourusername.github.io`
   - **Option B:** Any name like `strategic-planning`
     - This gives you: `https://yourusername.github.io/strategic-planning`
3. **Make it Public** (required for free GitHub Pages)
4. **DO NOT** check "Add a README file" (you already have files)
5. Click **"Create repository"**

### 4b. Connect and Push Your Code

GitHub will show you commands. Use these (replace `YOUR_USERNAME` and `REPO_NAME`):

```powershell
# Connect your local repo to GitHub (replace with your actual username and repo name)
git remote add origin https://github.com/YOUR_USERNAME/REPO_NAME.git

# Rename branch to 'main' (if needed)
git branch -M main

# Push your code to GitHub
git push -u origin main
```

**⚠️ Authentication Note:** GitHub will ask for your username and password. 
- **Username:** Your GitHub username
- **Password:** Use a **Personal Access Token** (not your GitHub password)

**To create a Personal Access Token:**
1. Go to: https://github.com/settings/tokens
2. Click "Generate new token" → "Generate new token (classic)"
3. Name it: "Deploy Script"
4. Check the `repo` scope
5. Click "Generate token"
6. **Copy the token** (you won't see it again!)
7. Use this token as your password when pushing

---

## Step 5: Enable GitHub Pages

1. In your GitHub repository, click **"Settings"** (top menu)
2. Click **"Pages"** (left sidebar)
3. Under **"Source"**, select:
   - **Branch:** `main`
   - **Folder:** `/ (root)`
4. Click **"Save"**

**Wait 2-5 minutes**, then visit your site at:
- `https://YOUR_USERNAME.github.io` (if repo is named `username.github.io`)
- OR `https://YOUR_USERNAME.github.io/REPO_NAME` (if different name)

---

## ✅ You're Done!

Your site is now live! Share the URL with anyone.

---

## 🔄 Making Updates Later

After you make changes to your code, use the deployment script:

```powershell
.\deploy.ps1 "Description of your changes"
```

Or manually:
```powershell
git add .
git commit -m "Your update message"
git push
```

Your site will update automatically in 1-2 minutes!

---

## 🆘 Troubleshooting

### "Git is not recognized"
- Restart PowerShell/terminal after installing Git
- Or restart your computer

### "Authentication failed" when pushing
- Use a Personal Access Token instead of password
- See Step 4b above for how to create one

### Site shows 404 or doesn't load
- Wait 2-5 minutes after enabling Pages (first time takes longer)
- Check Settings → Pages shows "Your site is live at..."
- Make sure repository is **Public**

### Need more help?
- See `DEPLOY.md` for detailed troubleshooting
- GitHub Help: https://docs.github.com/en/pages

---

## 📋 Quick Checklist

- [ ] Git installed
- [ ] GitHub account created
- [ ] `git init` run in project folder
- [ ] Files committed locally
- [ ] GitHub repository created
- [ ] Code pushed to GitHub
- [ ] GitHub Pages enabled
- [ ] Site URL tested and working!

**You've got this! 🎉**

