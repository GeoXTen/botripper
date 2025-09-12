#!/usr/bin/env node

const fs = require('fs');
const path = require('path');
const readline = require('readline');

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

function question(prompt) {
  return new Promise((resolve) => {
    rl.question(prompt, resolve);
  });
}

async function setup() {
  console.log('🚀 BotRipper Setup Assistant\n');
  console.log('This will help you configure your Discord forum monitor bot.\n');

  try {
    // Check if .env already exists
    const envPath = path.join(__dirname, '.env');
    if (fs.existsSync(envPath)) {
      const overwrite = await question('⚠️  .env file already exists. Overwrite? (y/N): ');
      if (overwrite.toLowerCase() !== 'y') {
        console.log('✅ Setup cancelled. Your existing .env file is preserved.');
        rl.close();
        return;
      }
    }

    // Get Discord webhook URL
    console.log('📋 Step 1: Discord Webhook Configuration');
    console.log('To get your Discord webhook URL:');
    console.log('1. Go to your Discord server');
    console.log('2. Right-click on the channel where you want notifications');
    console.log('3. Select "Edit Channel" → "Integrations" → "Webhooks"');
    console.log('4. Click "New Webhook" and copy the URL\n');

    let webhookUrl = '';
    while (!webhookUrl || !webhookUrl.includes('discord.com/api/webhooks/')) {
      webhookUrl = await question('Enter your Discord webhook URL: ');
      if (!webhookUrl || !webhookUrl.includes('discord.com/api/webhooks/')) {
        console.log('❌ Invalid webhook URL. Please enter a valid Discord webhook URL.');
      }
    }

    // Get check interval
    console.log('\n⏱️  Step 2: Monitoring Configuration');
    let checkInterval = await question('How often should the bot check for new posts? (minutes, default: 5): ');
    checkInterval = parseInt(checkInterval) || 5;
    if (checkInterval < 1) {
      checkInterval = 5;
      console.log('⚠️  Minimum interval is 1 minute. Set to 5 minutes.');
    }

    // Get max posts per check
    let maxPosts = await question('Maximum posts to check per run? (default: 10): ');
    maxPosts = parseInt(maxPosts) || 10;
    if (maxPosts < 1 || maxPosts > 50) {
      maxPosts = 10;
      console.log('⚠️  Setting to default value of 10 posts.');
    }

    // Create .env file
    const envContent = `# Discord Webhook URL (required)
DISCORD_WEBHOOK_URL=${webhookUrl}

# Forum monitoring settings
FORUM_URL=https://forum.ripper.store/category/44/gifts-downloads?sort=recently_created
CHECK_INTERVAL_MINUTES=${checkInterval}

# Optional settings
USER_AGENT=Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36
MAX_POSTS_PER_CHECK=${maxPosts}`;

    fs.writeFileSync(envPath, envContent);

    console.log('\n✅ Configuration saved to .env file!');
    console.log('\n🧪 Step 3: Testing Configuration');
    
    const testNow = await question('Test the bot configuration now? (Y/n): ');
    if (testNow.toLowerCase() !== 'n') {
      console.log('\nRunning tests...\n');
      
      // Run tests
      const { exec } = require('child_process');
      exec('node test.js', (error, stdout, stderr) => {
        if (error) {
          console.error('❌ Test failed:', error.message);
        } else {
          console.log(stdout);
          if (stderr) console.error(stderr);
        }
        
        console.log('\n🎉 Setup Complete!');
        console.log('\n📚 Next steps:');
        console.log('1. Check your Discord channel for test messages');
        console.log('2. Run "npm start" to start the bot locally');
        console.log('3. See DEPLOYMENT.md for hosting options');
        console.log('4. Monitor the bot status in Discord\n');
        
        rl.close();
      });
    } else {
      console.log('\n🎉 Setup Complete!');
      console.log('\n📚 Next steps:');
      console.log('1. Run "npm test" to test your configuration');
      console.log('2. Run "npm start" to start the bot');
      console.log('3. See DEPLOYMENT.md for hosting options\n');
      
      rl.close();
    }

  } catch (error) {
    console.error('❌ Setup failed:', error.message);
    rl.close();
  }
}

// Run setup if this file is executed directly
if (require.main === module) {
  setup();
}

module.exports = setup;