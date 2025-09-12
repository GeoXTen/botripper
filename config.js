require('dotenv').config();

const config = {
  // Discord webhook URL (required)
  webhookUrl: process.env.DISCORD_WEBHOOK_URL,
  
  // Forum settings
  forumUrl: process.env.FORUM_URL || 'https://forum.ripper.store/category/44/gifts-downloads?sort=recently_created',
  
  // Monitoring settings
  checkIntervalMinutes: parseInt(process.env.CHECK_INTERVAL_MINUTES) || 5,
  maxPostsPerCheck: parseInt(process.env.MAX_POSTS_PER_CHECK) || 10,
  
  // Request settings
  userAgent: process.env.USER_AGENT || 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36',
  
  // Database settings
  dbPath: process.env.DB_PATH || './posts.db',
  
  // Link patterns for extraction
  sourcePatterns: [
    /gumroad\.com/i,
    /booth\.pm/i,
    /patreon\.com/i,
    /fanbox\.cc/i,
    /ko-fi\.com/i,
    /artstation\.com/i,
    /itch\.io/i
  ],
  
  downloadPatterns: [
    /pixeldrain\.com/i,
    /drive\.google\.com/i,
    /workupload\.com/i,
    /mediafire\.com/i,
    /mega\.nz/i,
    /mega\.co\.nz/i,
    /dropbox\.com/i,
    /1fichier\.com/i,
    /rapidgator\.net/i,
    /uploaded\.net/i,
    /turbobit\.net/i,
    /nitroflare\.com/i
  ]
};

// Validate required configuration
function validateConfig() {
  const errors = [];
  
  if (!config.webhookUrl) {
    errors.push('DISCORD_WEBHOOK_URL is required');
  }
  
  if (!config.webhookUrl || !config.webhookUrl.includes('discord.com/api/webhooks/')) {
    errors.push('Invalid Discord webhook URL format');
  }
  
  if (config.checkIntervalMinutes < 1) {
    errors.push('CHECK_INTERVAL_MINUTES must be at least 1');
  }
  
  if (errors.length > 0) {
    console.error('Configuration errors:');
    errors.forEach(error => console.error(`  - ${error}`));
    process.exit(1);
  }
}

module.exports = {
  config,
  validateConfig
};