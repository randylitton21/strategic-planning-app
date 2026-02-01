#!/usr/bin/env node

/**
 * Simple Node.js deployment script for GitHub Pages
 * Usage: npm run deploy
 */

const { execSync } = require('child_process');
const fs = require('fs');

console.log('🚀 Starting deployment to GitHub Pages...\n');

// Check if git is installed
try {
    execSync('git --version', { stdio: 'ignore' });
} catch (error) {
    console.error('❌ Git is not installed. Please install Git first.');
    console.log('Download from: https://git-scm.com/downloads');
    process.exit(1);
}

// Check if we're in a git repository
if (!fs.existsSync('.git')) {
    console.log('⚠️  Not a git repository. Initializing...');
    execSync('git init', { stdio: 'inherit' });
    execSync('git add .', { stdio: 'inherit' });
    console.log('\n✅ Repository initialized. Please set up remote and push manually.');
    console.log('Run: git remote add origin https://github.com/yourusername/repository-name.git');
    console.log('Then: git push -u origin main');
    process.exit(0);
}

// Get commit message
const commitMessage = process.argv[2] || `Update: ${new Date().toISOString().slice(0, 19).replace('T', ' ')}`;

// Check for changes
try {
    const status = execSync('git status --porcelain', { encoding: 'utf8' });
    if (!status.trim()) {
        console.log('⚠️  No changes to commit.');
        process.exit(0);
    }
} catch (error) {
    // Continue if status check fails
}

// Add all changes
console.log('📦 Staging changes...');
execSync('git add .', { stdio: 'inherit' });

// Commit changes
console.log('💾 Committing changes...');
execSync(`git commit -m "${commitMessage}"`, { stdio: 'inherit' });

// Push to GitHub
console.log('🚀 Pushing to GitHub...');
try {
    execSync('git push', { stdio: 'inherit' });
    console.log('\n✅ Successfully deployed!');
    console.log('Your site should update in 1-2 minutes.\n');
    
    // Try to get the remote URL
    try {
        const remoteUrl = execSync('git remote get-url origin', { encoding: 'utf8' }).trim();
        const match = remoteUrl.match(/github\.com[:/](.+?)(?:\.git)?$/);
        if (match) {
            const [username, repo] = match[1].split('/');
            if (repo === `${username}.github.io`) {
                console.log(`🌐 Your site: https://${username}.github.io`);
            } else {
                console.log(`🌐 Your site: https://${username}.github.io/${repo}`);
            }
        }
    } catch (error) {
        // Ignore errors getting remote URL
    }
} catch (error) {
    console.error('\n❌ Failed to push. Check your git remote and authentication.');
    process.exit(1);
}

