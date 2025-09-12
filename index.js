const cron = require('node-cron');
const { config, validateConfig } = require('./config');
const Database = require('./database');
const ForumScraper = require('./scraper');
const DiscordWebhook = require('./webhook');

class ForumBot {
  constructor() {
    this.database = new Database();
    this.scraper = new ForumScraper();
    this.webhook = new DiscordWebhook();
    this.isRunning = false;
    this.consecutiveErrors = 0;
    this.maxConsecutiveErrors = 5;
    this.lastCheck = null;
    this.stats = {
      totalPosts: 0,
      sentNotifications: 0,
      errors: 0,
      startTime: new Date()
    };
  }

  async init() {
    try {
      console.log('🚀 Initializing Forum Monitor Bot...');
      
      // Validate configuration
      validateConfig();
      console.log('✅ Configuration validated');

      // Initialize database
      await this.database.init();
      console.log('✅ Database initialized');

      // Test Discord webhook
      await this.webhook.sendTestMessage();
      console.log('✅ Discord webhook tested successfully');

      // Send startup status
      await this.webhook.sendStatusMessage('starting', {
        'Check Interval': `${config.checkIntervalMinutes} minutes`,
        'Forum URL': config.forumUrl.substring(0, 50) + '...',
        'Max Posts': config.maxPostsPerCheck
      });

      console.log('✅ Bot initialization complete');
      return true;
    } catch (error) {
      console.error('❌ Bot initialization failed:', error.message);
      await this.webhook.sendErrorMessage(`Bot initialization failed: ${error.message}`);
      throw error;
    }
  }

  async checkForNewPosts() {
    try {
      console.log(`🔍 Checking for new posts... (${new Date().toISOString()})`);
      this.lastCheck = new Date();

      // Scrape forum for new posts
      const posts = await this.scraper.scrapeNewPosts();
      console.log(`Found ${posts.length} posts on forum`);

      let newPostsCount = 0;
      let notificationsSent = 0;

      for (const post of posts) {
        try {
          // Check if we've already processed this post
          const alreadyTracked = await this.database.isPostAlreadyTracked(post.id);
          
          if (!alreadyTracked) {
            newPostsCount++;
            console.log(`📝 New post found: ${post.title}`);

            // Save to database first
            await this.database.savePost(post);

            // Send Discord notification
            await this.webhook.sendWebhook(post);
            notificationsSent++;

            console.log(`✅ Notification sent for: ${post.title}`);

            // Add delay between webhook sends to avoid rate limits
            if (notificationsSent < posts.length) {
              await this.sleep(2000); // 2 second delay
            }
          }
        } catch (error) {
          console.error(`❌ Error processing post ${post.id}:`, error.message);
          this.stats.errors++;
        }
      }

      // Update statistics
      this.stats.totalPosts += posts.length;
      this.stats.sentNotifications += notificationsSent;

      console.log(`✅ Check complete. New posts: ${newPostsCount}, Notifications sent: ${notificationsSent}`);

      // Reset consecutive error counter on success
      this.consecutiveErrors = 0;

      // Periodic cleanup (once a day)
      if (this.shouldPerformCleanup()) {
        await this.performCleanup();
      }

      return { newPosts: newPostsCount, notificationsSent };
    } catch (error) {
      this.consecutiveErrors++;
      this.stats.errors++;
      
      console.error(`❌ Error during forum check (${this.consecutiveErrors}/${this.maxConsecutiveErrors}):`, error.message);

      // Send error notification after multiple consecutive failures
      if (this.consecutiveErrors >= 3) {
        await this.webhook.sendErrorMessage(`Forum check failed ${this.consecutiveErrors} times: ${error.message}`);
      }

      // Stop bot if too many consecutive errors
      if (this.consecutiveErrors >= this.maxConsecutiveErrors) {
        console.error('🚨 Too many consecutive errors. Stopping bot.');
        await this.webhook.sendStatusMessage('error', {
          'Consecutive Errors': this.consecutiveErrors,
          'Last Error': error.message,
          'Action': 'Bot stopped'
        });
        this.stop();
      }

      throw error;
    }
  }

  shouldPerformCleanup() {
    // Perform cleanup once every 24 hours
    const now = new Date();
    const hoursSinceStart = (now - this.stats.startTime) / (1000 * 60 * 60);
    return hoursSinceStart >= 24 && now.getHours() === 3; // Cleanup at 3 AM
  }

  async performCleanup() {
    try {
      console.log('🧹 Performing database cleanup...');
      const deletedCount = await this.database.cleanup(30); // Remove posts older than 30 days
      console.log(`✅ Cleanup complete. Removed ${deletedCount} old records`);
    } catch (error) {
      console.error('❌ Cleanup failed:', error.message);
    }
  }

  start() {
    if (this.isRunning) {
      console.log('⚠️ Bot is already running');
      return;
    }

    this.isRunning = true;
    console.log(`🚀 Starting forum monitor with ${config.checkIntervalMinutes} minute intervals`);

    // Create cron schedule
    const cronExpression = `*/${config.checkIntervalMinutes} * * * *`;
    
    this.cronJob = cron.schedule(cronExpression, async () => {
      if (this.isRunning) {
        try {
          await this.checkForNewPosts();
        } catch (error) {
          // Error already handled in checkForNewPosts
        }
      }
    }, {
      scheduled: false // Don't start immediately
    });

    // Start the cron job
    this.cronJob.start();

    // Send initial status
    this.webhook.sendStatusMessage('running', {
      'Status': 'Bot started successfully',
      'Check Interval': `${config.checkIntervalMinutes} minutes`,
      'Next Check': 'In progress...'
    });

    // Perform initial check
    setTimeout(async () => {
      try {
        await this.checkForNewPosts();
      } catch (error) {
        // Error already handled in checkForNewPosts
      }
    }, 5000); // Wait 5 seconds before first check

    console.log('✅ Bot started successfully');
  }

  stop() {
    if (!this.isRunning) {
      console.log('⚠️ Bot is not running');
      return;
    }

    this.isRunning = false;
    
    if (this.cronJob) {
      this.cronJob.stop();
      this.cronJob.destroy();
    }

    console.log('🛑 Bot stopped');
    
    // Send stop status
    this.webhook.sendStatusMessage('stopping', {
      'Status': 'Bot stopped',
      'Total Posts Checked': this.stats.totalPosts,
      'Notifications Sent': this.stats.sentNotifications,
      'Errors': this.stats.errors,
      'Uptime': this.getUptime()
    });
  }

  getStatus() {
    return {
      isRunning: this.isRunning,
      lastCheck: this.lastCheck,
      consecutiveErrors: this.consecutiveErrors,
      stats: {
        ...this.stats,
        uptime: this.getUptime()
      }
    };
  }

  getUptime() {
    const uptimeMs = Date.now() - this.stats.startTime.getTime();
    const hours = Math.floor(uptimeMs / (1000 * 60 * 60));
    const minutes = Math.floor((uptimeMs % (1000 * 60 * 60)) / (1000 * 60));
    return `${hours}h ${minutes}m`;
  }

  sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  async shutdown() {
    console.log('🔄 Shutting down bot gracefully...');
    
    this.stop();
    
    try {
      await this.database.close();
      console.log('✅ Database connection closed');
    } catch (error) {
      console.error('❌ Error closing database:', error.message);
    }

    console.log('✅ Bot shutdown complete');
  }
}

// Handle process termination gracefully
let bot = null;

async function startBot() {
  try {
    bot = new ForumBot();
    await bot.init();
    bot.start();

    // Handle graceful shutdown
    process.on('SIGINT', async () => {
      console.log('\n🔄 Received SIGINT, shutting down gracefully...');
      if (bot) {
        await bot.shutdown();
      }
      process.exit(0);
    });

    process.on('SIGTERM', async () => {
      console.log('\n🔄 Received SIGTERM, shutting down gracefully...');
      if (bot) {
        await bot.shutdown();
      }
      process.exit(0);
    });

  } catch (error) {
    console.error('❌ Failed to start bot:', error.message);
    process.exit(1);
  }
}

// Start the bot if this file is run directly
if (require.main === module) {
  startBot();
}

module.exports = ForumBot;