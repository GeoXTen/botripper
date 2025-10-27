# GitHub Actions Setup Guide

This guide walks you through deploying the BotRipper forum monitor to GitHub Actions for completely free hosting.

## Prerequisites

Before you begin, ensure you have:

- **GitHub account** - Free account at https://github.com
- **Discord webhook URL** - To get one:
  1. Open your Discord server
  2. Go to Server Settings → Integrations → Webhooks
  3. Click "New Webhook"
  4. Choose a channel for notifications
  5. Copy the webhook URL
- **This repository** - Code ready to push to GitHub

## Setup Steps

### Step 1: Push Code to GitHub

1. Create a new repository on GitHub:
   - Go to https://github.com/new
   - Enter repository name (e.g., "botripper")
   - Set to Private or Public (your choice)
   - Do NOT initialize with README (we have our own files)
   - Click "Create repository"

2. Push your local code to GitHub:
   ```bash
   cd /path/to/botripper
   git init
   git add .
   git commit -m "Initial commit"
   git branch -M main
   git remote add origin https://github.com/YOUR_USERNAME/YOUR_REPO.git
   git push -u origin main
   ```

3. Verify all files are present on GitHub, including:
   - `botripper/` directory with all bot files
   - `.github/workflows/monitor.yml` workflow file

### Step 2: Add Discord Webhook Secret

1. Navigate to your repository on GitHub
2. Click **Settings** tab (top navigation)
3. In the left sidebar, go to **Secrets and variables** → **Actions**
4. Click **New repository secret** button
5. Configure the secret:
   - **Name:** `DISCORD_WEBHOOK_URL`
   - **Secret:** Paste your Discord webhook URL (e.g., `https://discord.com/api/webhooks/123456789/abcdef...`)
6. Click **Add secret**

⚠️ **Important:** Never commit your webhook URL directly to code. Always use secrets.

### Step 3: Enable GitHub Actions

1. Go to the **Actions** tab in your repository
2. If prompted, click **I understand my workflows, go ahead and enable them**
3. You should see the "Forum Monitor" workflow listed

### Step 4: Verify Setup

1. In the **Actions** tab, click on **Forum Monitor** workflow
2. Click the **Run workflow** button (on the right)
3. Select branch: **main**
4. Click **Run workflow** button
5. Wait for the workflow to complete (30-60 seconds)
   - Green checkmark = Success ✅
   - Red X = Failed ❌ (check logs for errors)
6. Check your Discord channel for:
   - Bot initialization test message
   - Any new forum post notifications (if new posts exist)

## How It Works

### Automatic Execution
- Workflow runs **every 5 minutes** automatically (no manual intervention needed)
- GitHub Actions scheduler triggers the bot based on cron schedule: `*/5 * * * *`

### Database Persistence
- SQLite database (`posts.db`) persists between runs via GitHub Actions cache
- Database tracks which posts have been notified to prevent duplicates
- Built-in cleanup removes records older than 30 days

### Notification Flow
1. Bot checks forum for new posts
2. Compares posts against database (to find truly new posts)
3. Sends Discord webhook notifications for new posts only
4. Saves new posts to database
5. Exits and waits for next scheduled run

## Monitoring

### View Workflow Runs
1. Go to **Actions** tab in your repository
2. Click on **Forum Monitor** workflow
3. See list of all runs with status (success/failure)
4. Click on any run to view detailed logs

### View Logs
1. Click on a workflow run
2. Click on the **check-forum** job
3. Expand each step to see detailed output:
   - "Run bot (single check)" shows forum checking logs
   - See how many posts were found and notifications sent

### Manual Trigger
- Need to force a check immediately?
- Go to Actions → Forum Monitor → Run workflow
- Useful for testing or checking outside the 5-minute schedule

## Troubleshooting

### Workflow Not Running

**Check Actions are enabled:**
- Go to Settings → Actions → General
- Ensure "Allow all actions and reusable workflows" is selected

**Verify workflow file location:**
- File must be at `.github/workflows/monitor.yml`
- Check the Actions tab for any workflow errors

**Verify secret is set:**
- Settings → Secrets and variables → Actions
- Confirm `DISCORD_WEBHOOK_URL` is listed

### Bot Errors

**View detailed logs:**
- Actions tab → Click failed run → View logs

**Common issues:**

**Invalid DISCORD_WEBHOOK_URL (401/404 errors):**
- Verify webhook URL is correct in repository secrets
- Test webhook URL manually: `curl -X POST <YOUR_WEBHOOK_URL> -d '{"content":"test"}'`
- Regenerate webhook in Discord if needed

**Forum website down (connection errors):**
- `ENOTFOUND` or `ETIMEDOUT` errors in logs
- Forum may be temporarily offline
- Bot will retry on next run (5 minutes)

**Rate limiting (429 errors):**
- Discord rate limits webhook sends
- Bot already has 2-second delays between sends
- If persistent, consider increasing CHECK_INTERVAL_MINUTES in workflow

### No Notifications

**Verify webhook URL:**
- Double-check the Discord webhook URL in secrets
- Test it manually with curl command above

**Check for new posts:**
- Visit https://forum.ripper.store/category/44/gifts-downloads?sort=recently_created
- If no new posts since last run, bot correctly sends no notifications

**Database already has posts:**
- On first run, bot may have tracked existing posts
- Wait for genuinely new posts to appear on forum
- This is normal behavior (prevents spam on initial setup)

### Cache Issues

**Database reset / duplicate notifications:**
- GitHub caches expire after 7 days of no access
- If bot was disabled for >7 days, cache may be lost
- Bot will re-notify recent posts (one time only)
- Normal operation resumes after first run

## Stopping the Bot

### Temporarily Disable
1. Go to **Actions** tab
2. Click **Forum Monitor** workflow
3. Click **...** menu (three dots, top right)
4. Select **Disable workflow**
5. To re-enable: Same menu → **Enable workflow**

### Permanently Stop
Delete the workflow file:
```bash
git rm .github/workflows/monitor.yml
git commit -m "Stop forum monitor"
git push
```

## Support

**Issues with this setup?**
- Check workflow logs in Actions tab first
- Verify all prerequisites are met
- Test webhook URL manually
- Review troubleshooting section above

**Want to customize?**
- Edit `CHECK_INTERVAL_MINUTES` in `.github/workflows/monitor.yml` (change cron schedule)
- Edit forum URL in `botripper/config.js`
- Modify notification format in `botripper/webhook.js`
