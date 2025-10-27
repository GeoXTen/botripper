const ForumBot = require('./index');

/**
 * Single-execution entry point for GitHub Actions
 * Runs one forum check and exits (does not use continuous cron scheduling)
 */
async function main() {
  let bot = null;

  try {
    console.log('🚀 Initializing Forum Monitor Bot...');

    // Create bot instance
    bot = new ForumBot();

    // Initialize database and test webhook
    await bot.init();

    // Perform single forum check (do not call bot.start() - that runs continuously)
    await bot.checkForNewPosts();

    // Close database connection
    await bot.database.close();
    console.log('✅ Database connection closed');

    console.log('✅ Run complete - exiting');
    process.exit(0);

  } catch (error) {
    console.error('❌ Error during execution:', error.message);

    // Attempt to close database connection on error
    if (bot && bot.database) {
      try {
        await bot.database.close();
      } catch (closeError) {
        console.error('❌ Error closing database:', closeError.message);
      }
    }

    process.exit(1);
  }
}

// Run main function
main();
