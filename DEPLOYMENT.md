# Deployment Guide for Free Hosting

## 🚀 Quick Deploy Options

### 1. Railway (Recommended) ⭐
**Why**: Simple setup, generous free tier, automatic deployments

**Steps**:
1. Go to [railway.app](https://railway.app)
2. Sign up with GitHub
3. Click "Deploy from GitHub repo"
4. Select your forked repository
5. Set environment variables in Railway dashboard:
   - `DISCORD_WEBHOOK_URL` = your Discord webhook URL
   - `CHECK_INTERVAL_MINUTES` = 5
   - `MAX_POSTS_PER_CHECK` = 10
6. Deploy automatically!

**Free tier**: 500 hours/month (basically unlimited for a bot)

### 2. Render ❌
**Note**: Render is now paid-only. Not recommended for free hosting.

### 3. Heroku
**Steps**:
1. Go to [heroku.com](https://heroku.com)
2. Create new app
3. Connect to GitHub repository
4. Set config vars (environment variables):
   - `DISCORD_WEBHOOK_URL` = your webhook URL
   - `CHECK_INTERVAL_MINUTES` = 5
5. Enable the worker dyno (not web dyno!)
6. Deploy from GitHub

**Free tier**: 550 hours/month

### 4. Glitch (Alternative Free Option) ⭐
**Steps**:
1. Go to [glitch.com](https://glitch.com)
2. Import from GitHub
3. Set environment variables in `.env` file
4. Keep project active with UptimeRobot (free)

**Free tier**: Unlimited with occasional sleep

### 6. Vercel (Functions)
**Note**: Vercel is designed for serverless functions, not long-running bots. Use only if other options don't work.

## 🔧 Pre-Deployment Setup

### 1. Get Discord Webhook URL
1. Go to your Discord server
2. Right-click on channel → "Edit Channel"
3. Go to "Integrations" → "Webhooks" 
4. Click "New Webhook"
5. Copy the webhook URL

### 2. Fork This Repository
1. Click "Fork" on GitHub
2. Clone your fork to make changes if needed

### 3. Test Locally (Optional)
```bash
# Clone your repository
git clone https://github.com/yourusername/botripper.git
cd botripper

# Install dependencies
npm install

# Copy environment file
cp .env.example .env

# Edit .env with your webhook URL
# Then test locally
npm start
```

## 📊 Monitoring Your Bot

After deployment, your bot will:
- ✅ Send a test message when it starts
- 🔍 Check forum every 5 minutes (configurable)
- 📨 Send notifications for new posts with source/download links
- 🚨 Send error alerts if something goes wrong
- 📈 Send status updates

## 🛠️ Troubleshooting

### Bot not starting?
- Check environment variables are set correctly
- Verify Discord webhook URL is valid
- Check logs in your hosting platform

### No notifications?
- Bot might already be tracking posts in database
- Check if posts have source/download links
- Verify forum structure hasn't changed

### Getting rate limited?
- Increase `CHECK_INTERVAL_MINUTES` to 10 or 15
- Reduce `MAX_POSTS_PER_CHECK` to 5

## 🔄 Updating Your Bot

1. Make changes to your fork on GitHub
2. Your hosting platform will automatically redeploy
3. Or manually redeploy from your hosting dashboard

## 💡 Tips

- **Railway** is the easiest and most reliable for bots (most recommended)
- **Glitch** is good for simple bots with UptimeRobot to keep it active
- **Cyclic** offers generous free tier with 1000 hours
- **Heroku** requires enabling worker dyno (not web dyno)
- **Avoid Render** - now paid only
- Monitor your bot's Discord messages for status updates
- Keep webhook URL secret and secure