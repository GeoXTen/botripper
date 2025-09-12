# BotRipper - Discord Forum Monitor

A Discord webhook bot that monitors forum.ripper.store for new posts in the gifts/downloads category and sends formatted notifications with source and download links.

## Features

- 🔍 Monitors forum.ripper.store gifts/downloads category
- 📨 Sends Discord webhook notifications with rich embeds
- 🔗 Extracts source links (Gumroad, Booth.pm, etc.)
- 💾 Extracts download links (PixelDrain, Google Drive, etc.)
- 🗃️ SQLite database to prevent duplicate notifications
- ⚡ Configurable check intervals
- 🚀 Free hosting ready (Railway, Render, Heroku)

## Quick Start

1. **Clone and Install**:
   ```bash
   git clone <your-repo-url>
   cd botripper
   npm install
   ```

2. **Setup Configuration**:
   ```bash
   npm run setup
   ```
   This will guide you through setting up your Discord webhook and configuration.

3. **Test the Bot**:
   ```bash
   npm test
   ```

4. **Start the Bot**:
   ```bash
   npm start
   ```

5. **Deploy for Free**: See [DEPLOYMENT.md](./DEPLOYMENT.md) for hosting options.

## Setup

1. Clone or download this repository
2. Install dependencies:
   ```bash
   npm install
   ```

3. Copy `.env.example` to `.env` and configure:
   ```bash
   cp .env.example .env
   ```

4. Edit `.env` file with your Discord webhook URL:
   ```
   DISCORD_WEBHOOK_URL=https://discord.com/api/webhooks/your/webhook/url
   ```

5. Run the bot:
   ```bash
   npm start
   ```

## Configuration

Edit the `.env` file to customize:

- `DISCORD_WEBHOOK_URL`: Your Discord webhook URL (required)
- `CHECK_INTERVAL_MINUTES`: How often to check for new posts (default: 5)
- `MAX_POSTS_PER_CHECK`: Maximum posts to process per check (default: 10)

## Getting Discord Webhook URL

1. Go to your Discord server
2. Right-click on the channel where you want notifications
3. Select "Edit Channel" → "Integrations" → "Webhooks"
4. Click "New Webhook" or "Create Webhook"
5. Copy the webhook URL

## Free Hosting Options

### Railway
1. Connect your GitHub repository to Railway
2. Add environment variables in Railway dashboard
3. Deploy automatically

### Render
1. Connect your GitHub repository to Render
2. Set environment variables
3. Deploy as a background worker

### Heroku
1. Create a new Heroku app
2. Connect to GitHub repository
3. Set config vars (environment variables)
4. Deploy

## File Structure

```
botripper/
├── index.js           # Main bot file
├── scraper.js         # Forum scraping logic
├── webhook.js         # Discord webhook sender
├── database.js        # SQLite database operations
├── config.js          # Configuration loader
├── package.json       # Dependencies
├── .env.example       # Environment variables template
└── README.md          # This file
```

## License

MIT License - feel free to modify and use as needed.