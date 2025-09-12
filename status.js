#!/usr/bin/env node

const Database = require('./database');
const { config } = require('./config');

async function showStatus() {
  console.log('📊 BotRipper Status Report\n');

  try {
    // Database stats
    const db = new Database();
    await db.init();
    
    const postCount = await db.getPostCount();
    const recentPosts = await db.getRecentPosts(5);
    
    console.log('💾 Database Status:');
    console.log(`   Total posts tracked: ${postCount}`);
    console.log(`   Recent posts: ${recentPosts.length}`);
    
    if (recentPosts.length > 0) {
      console.log('\n📝 Latest Posts:');
      recentPosts.forEach((post, index) => {
        console.log(`   ${index + 1}. ${post.title.substring(0, 50)}${post.title.length > 50 ? '...' : ''}`);
        console.log(`      By: ${post.author} | Posted: ${new Date(post.created_at).toLocaleString()}`);
      });
    }
    
    await db.close();
    
    // Configuration status
    console.log('\n⚙️  Configuration:');
    console.log(`   Webhook URL: ${config.webhookUrl ? '✅ Configured' : '❌ Not set'}`);
    console.log(`   Check interval: ${config.checkIntervalMinutes} minutes`);
    console.log(`   Max posts per check: ${config.maxPostsPerCheck}`);
    console.log(`   Forum URL: ${config.forumUrl}`);
    
    // Link pattern status
    console.log('\n🔗 Link Detection:');
    console.log(`   Source platforms: ${config.sourcePatterns.length} patterns`);
    console.log(`   Download platforms: ${config.downloadPatterns.length} patterns`);
    
    console.log('\n✅ Status check complete!');
    
  } catch (error) {
    console.error('❌ Error checking status:', error.message);
  }
}

if (require.main === module) {
  showStatus();
}

module.exports = showStatus;