const { config, validateConfig } = require('./config');
const Database = require('./database');
const ForumScraper = require('./scraper');
const DiscordWebhook = require('./webhook');

/**
 * Single-execution entry point for GitHub Actions
 * Simplified version that skips optional status messages
 */
async function main() {
  const database = new Database();
  const scraper = new ForumScraper();
  const webhook = new DiscordWebhook();

  try {
    console.log('🚀 Starting forum check...');

    // Validate configuration
    validateConfig();
    console.log('✅ Configuration validated');

    // Initialize database
    await database.init();
    console.log('✅ Database initialized');

    // Scrape forum for new posts
    console.log('🔍 Checking for new posts...');
    const posts = await scraper.scrapeNewPosts();
    console.log(`Found ${posts.length} posts on forum`);

    let newPostsCount = 0;
    let notificationsSent = 0;

    for (const post of posts) {
      try {
        // Check if already tracked
        const alreadyTracked = await database.isPostAlreadyTracked(post.id);

        if (!alreadyTracked) {
          newPostsCount++;
          console.log(`📝 New post found: ${post.title}`);

          // Save to database first
          await database.savePost(post);

          // Send Discord notification
          await webhook.sendWebhook(post);
          notificationsSent++;

          console.log(`✅ Notification sent for: ${post.title}`);

          // Delay between sends to avoid rate limits
          if (notificationsSent < posts.length) {
            await new Promise(resolve => setTimeout(resolve, 2000));
          }
        }
      } catch (error) {
        console.error(`❌ Error processing post ${post.id}:`, error.message);
      }
    }

    console.log(`✅ Check complete. New posts: ${newPostsCount}, Notifications sent: ${notificationsSent}`);

    // Close database
    await database.close();
    console.log('✅ Database closed');

    process.exit(0);

  } catch (error) {
    console.error('❌ Error during execution:', error.message);
    console.error(error.stack);

    // Attempt to close database
    try {
      await database.close();
    } catch (closeError) {
      console.error('❌ Error closing database:', closeError.message);
    }

    process.exit(1);
  }
}

// Run main function
main();
