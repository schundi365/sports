# GitHub Pages Deployment Guide

This application is configured for automatic deployment to GitHub Pages using GitHub Actions.

## 🚀 Quick Setup (One-Time)

### Step 1: Enable GitHub Pages

1. Go to your GitHub repository: `https://github.com/schundi365/cricket-apps`
2. Click **Settings** (top menu)
3. Click **Pages** (left sidebar)
4. Under **Build and deployment**:
   - **Source**: Select **GitHub Actions** (not "Deploy from a branch")
5. Click **Save** if needed

That's it! GitHub Actions is now configured.

### Step 2: Trigger Deployment

The deployment will automatically trigger when you:
- Push to `main` or `master` branch
- Push to `claude/free-database-multi-user-DP78D` branch
- Manually trigger from the Actions tab

**Your changes have already triggered a deployment!**

## 📍 Live URL

Once deployed, your application will be available at:

**https://schundi365.github.io/cricket-apps/**

### Available Pages:
- **Main App**: `https://schundi365.github.io/cricket-apps/`
- **Deposit Tracker**: `https://schundi365.github.io/cricket-apps/deposit-tracker.html`

## 🔄 How to Check Deployment Status

1. Go to your repository on GitHub
2. Click the **Actions** tab (top menu)
3. You'll see the workflow "Deploy to GitHub Pages"
4. Click on the latest run to see:
   - ✅ Build status
   - ✅ Deployment status
   - 📊 Logs for debugging

### Deployment States:
- 🟡 **In Progress** - Building and deploying (2-5 minutes)
- ✅ **Success** - Live at the URL above
- ❌ **Failed** - Check logs for errors

## 🔧 Manual Deployment (Alternative)

If you prefer to deploy manually from your local machine:

```bash
# Build the application
npm run build

# Deploy to gh-pages branch (requires push permissions)
npm run deploy
```

**Note**: Manual deployment may have permission issues. GitHub Actions is recommended.

## 📝 Updating the Deployed Site

Simply push your changes to the branch:

```bash
git add .
git commit -m "Your changes"
git push origin claude/free-database-multi-user-DP78D
```

GitHub Actions will automatically:
1. Build your React application
2. Deploy to GitHub Pages
3. Make it live within 2-5 minutes

## 🌐 Supabase Configuration for Production

After deployment, update your Supabase project:

1. Go to [Supabase Dashboard](https://app.supabase.com)
2. Select your project
3. Go to **Authentication** → **URL Configuration**
4. Add these URLs:

   **Site URL:**
   ```
   https://schundi365.github.io/cricket-apps
   ```

   **Redirect URLs:**
   ```
   https://schundi365.github.io/cricket-apps/**
   ```

5. Click **Save**

This allows authentication to work on your production site.

## 🎯 What Gets Deployed

The GitHub Actions workflow:
- ✅ Installs Node.js 18
- ✅ Installs dependencies (`npm ci`)
- ✅ Builds production version (`npm run build`)
- ✅ Deploys to GitHub Pages
- ✅ Serves from `/cricket-apps/` path

## 📦 Workflow Configuration

The workflow is defined in `.github/workflows/deploy.yml`:

```yaml
Triggers on:
- Push to main, master, or claude/free-database-multi-user-DP78D
- Manual trigger (workflow_dispatch)

Permissions:
- Read repository contents
- Write to GitHub Pages
- Issue tokens for deployment

Jobs:
1. Build - Creates production build
2. Deploy - Publishes to GitHub Pages
```

## 🐛 Troubleshooting

### Issue: "GitHub Pages not showing up"
**Solution**: Make sure you selected "GitHub Actions" as the source in Settings → Pages (not "Deploy from a branch")

### Issue: "Build is failing"
**Solution**:
1. Check the Actions tab for error logs
2. Verify `package.json` has correct dependencies
3. Ensure `homepage` field in `package.json` is set correctly:
   ```json
   "homepage": "https://schundi365.github.io/cricket-apps"
   ```

### Issue: "Site shows 404"
**Solution**:
1. Wait 2-5 minutes after deployment completes
2. Clear browser cache (Ctrl+Shift+R or Cmd+Shift+R)
3. Check the deployment URL is correct

### Issue: "Authentication not working"
**Solution**: Make sure you've updated Supabase URL configuration (see section above)

## 🔄 Workflow Status Badge

Add this to your README to show deployment status:

```markdown
![Deploy Status](https://github.com/schundi365/cricket-apps/actions/workflows/deploy.yml/badge.svg)
```

## 📚 Additional Resources

- [GitHub Pages Documentation](https://docs.github.com/pages)
- [GitHub Actions Documentation](https://docs.github.com/actions)
- [React Deployment Guide](https://create-react-app.dev/docs/deployment/)
- [Supabase Auth Configuration](https://supabase.com/docs/guides/auth)

## ✅ Checklist

- [x] Create `.github/workflows/deploy.yml`
- [x] Push workflow to repository
- [ ] Enable GitHub Pages in repository settings (select "GitHub Actions")
- [ ] Wait for first deployment to complete
- [ ] Verify site is live at the URL
- [ ] Update Supabase authentication URLs
- [ ] Test login/signup on production site

---

**Need Help?** Check the Actions tab for detailed logs or open an issue in the repository.
