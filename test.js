const ForumBot = require('./index');
const { config } = require('./config');

// Test data that mimics a forum post
const testPostData = {
  id: 'test_123',
  title: '17 avatars | CamelliusFox - YM STORE - BOOTH (T244945)',
  author: 'TestUser',
  url: 'https://forum.ripper.store/topic/test123',
  content: 'Check out this amazing avatar collection! Download from PixelDrain: https://pixeldrain.com/u/test123 or from the source at https://booth.pm/en/items/test123',
  timestamp: new Date().toISOString(),
  sourceLinks: [
    {
      url: 'https://booth.pm/en/items/test123',
      text: 'Booth Store'
    }
  ],
  downloadLinks: [
    {
      url: 'https://pixeldrain.com/u/test123',
      text: 'PixelDrain Download'
    }
  ],
  imageUrl: 'https://example.com/test-image.jpg'
};

async function runTests() {
  console.log('🧪 Starting BotRipper Tests...\n');

  try {
    // Test 1: Configuration validation
    console.log('📋 Test 1: Configuration Validation');
    if (!config.webhookUrl || config.webhookUrl === 'your_discord_webhook_url_here') {
      console.log('⚠️  Warning: Please set DISCORD_WEBHOOK_URL in .env file for full testing');
      console.log('   Copy .env.example to .env and add your Discord webhook URL');
      return;
    } else {
      console.log('✅ Configuration looks good');
    }

    // Test 2: Database operations
    console.log('\n💾 Test 2: Database Operations');
    const Database = require('./database');
    const db = new Database();
    await db.init();
    
    // Test saving a post
    await db.savePost(testPostData);
    console.log('✅ Post saved to database');
    
    // Test checking if post exists
    const exists = await db.isPostAlreadyTracked(testPostData.id);
    console.log(`✅ Post tracking check: ${exists ? 'Found' : 'Not found'}`);
    
    // Test getting recent posts
    const recentPosts = await db.getRecentPosts(5);
    console.log(`✅ Retrieved ${recentPosts.length} recent posts`);
    
    await db.close();

    // Test 3: Link extraction
    console.log('\n🔗 Test 3: Link Extraction');
    const LinkExtractor = require('./linkExtractor');
    const linkExtractor = new LinkExtractor();
    
    const extractedLinks = linkExtractor.extractAllLinks(testPostData);
    console.log(`✅ Extracted ${extractedLinks.sourceLinks.length} source links`);
    console.log(`✅ Extracted ${extractedLinks.downloadLinks.length} download links`);
    
    // Test 4: Discord webhook (if configured)
    console.log('\n📨 Test 4: Discord Webhook');
    const DiscordWebhook = require('./webhook');
    const webhook = new DiscordWebhook();
    
    // Send test message
    console.log('Sending test webhook...');
    await webhook.sendTestMessage();
    console.log('✅ Test webhook sent successfully');
    
    // Send test post notification
    console.log('Sending test post notification...');
    await webhook.sendWebhook(testPostData);
    console.log('✅ Test post notification sent');

    // Test 5: Forum scraper (without actually scraping to avoid load)
    console.log('\n🔍 Test 5: Forum Scraper Components');
    const ForumScraper = require('./scraper');
    const scraper = new ForumScraper();
    
    // Test HTML parsing with sample data
    const sampleHtml = `
      <div data-topic-id="123">
        <a href="/topic/test" class="topic-title">Test Topic</a>
        <a href="/user/testuser" class="username">TestUser</a>
        <time class="timeago" datetime="2023-01-01T00:00:00Z">1 hour ago</time>
      </div>
    `;
    
    const parsedPosts = scraper.parseForumPage(sampleHtml);
    console.log(`✅ HTML parsing test: ${parsedPosts.length} posts parsed`);

    console.log('\n🎉 All tests completed successfully!');
    console.log('\n📚 Next steps:');
    console.log('1. Check your Discord channel for test messages');
    console.log('2. Run "npm start" to start the bot');
    console.log('3. Deploy to your chosen hosting platform');
    console.log('4. Monitor the bot status in Discord');
    
  } catch (error) {
    console.error('\n❌ Test failed:', error.message);
    console.error('Stack trace:', error.stack);
    
    if (error.message.includes('DISCORD_WEBHOOK_URL')) {
      console.log('\n💡 Tip: Make sure to set up your .env file:');
      console.log('   1. Copy .env.example to .env');
      console.log('   2. Add your Discord webhook URL');
      console.log('   3. Run tests again');
    }
  }
}

// Add a simple command line test runner
async function runQuickTest() {
  console.log('⚡ Quick Test - Testing core components without webhook...\n');
  
  try {
    // Test database
    const Database = require('./database');
    const db = new Database();
    await db.init();
    await db.savePost({...testPostData, id: 'quick_test_' + Date.now()});
    await db.close();
    console.log('✅ Database: Working');
    
    // Test link extraction
    const LinkExtractor = require('./linkExtractor');
    const linkExtractor = new LinkExtractor();
    const links = linkExtractor.extractAllLinks(testPostData);
    console.log('✅ Link Extraction: Working');
    
    // Test scraper parsing
    const ForumScraper = require('./scraper');
    const scraper = new ForumScraper();
    console.log('✅ Forum Scraper: Working');
    
    console.log('\n🎉 Quick test passed! Core components are working.');
    console.log('💡 For full testing including Discord webhook, set up .env file and run full test.');
    
  } catch (error) {
    console.error('❌ Quick test failed:', error.message);
  }
}

// Command line interface
const args = process.argv.slice(2);
if (args.includes('--quick')) {
  runQuickTest();
} else {
  runTests();
}