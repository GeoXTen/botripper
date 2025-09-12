const axios = require('axios');
const { config } = require('./config');
const LinkExtractor = require('./linkExtractor');

class DiscordWebhook {
  constructor() {
    this.linkExtractor = new LinkExtractor();
    this.axiosInstance = axios.create({
      timeout: 10000, // 10 seconds timeout
    });
  }

  formatPostEmbed(postData) {
    // Extract and categorize all links
    const links = this.linkExtractor.extractAllLinks(postData);
    
    // Create the main embed
    const embed = {
      title: postData.title || 'New Forum Post',
      url: postData.url,
      color: 0x7289DA, // Discord blue color
      timestamp: new Date().toISOString(),
      footer: {
        text: 'Forum Ripper Store Monitor',
        icon_url: 'https://forum.ripper.store/assets/uploads/system/site-logo.png'
      },
      fields: []
    };

    // Add author information
    if (postData.author) {
      embed.author = {
        name: `🔔 ${postData.author}`,
        icon_url: 'https://cdn.discordapp.com/emojis/1234567890123456789.png' // Generic user icon
      };
    }

    // Add description with content preview
    if (postData.content) {
      const truncatedContent = postData.content.length > 300 
        ? postData.content.substring(0, 300) + '...' 
        : postData.content;
      embed.description = truncatedContent;
    }

    // Add image if available
    if (postData.imageUrl) {
      embed.image = {
        url: postData.imageUrl
      };
    }

    // Add source links field
    if (links.sourceLinks && links.sourceLinks.length > 0) {
      const sourceField = this.linkExtractor.formatLinksForDiscord(links.sourceLinks, '🛒 Source Links');
      if (sourceField) {
        embed.fields.push(sourceField);
      }
    }

    // Add download links field
    if (links.downloadLinks && links.downloadLinks.length > 0) {
      const downloadField = this.linkExtractor.formatLinksForDiscord(links.downloadLinks, '📥 Download Links');
      if (downloadField) {
        embed.fields.push(downloadField);
      }
    }

    // Add post info field
    const postInfo = [];
    if (postData.timestamp) {
      postInfo.push(`⏰ Posted: ${postData.timestamp}`);
    }
    if (postData.id) {
      postInfo.push(`🆔 Post ID: ${postData.id}`);
    }

    if (postInfo.length > 0) {
      embed.fields.push({
        name: '📋 Post Information',
        value: postInfo.join('\n'),
        inline: true
      });
    }

    // Add thumbnail (forum logo or first image)
    embed.thumbnail = {
      url: 'https://forum.ripper.store/assets/uploads/system/site-logo.png'
    };

    return embed;
  }

  createWebhookPayload(postData) {
    const embed = this.formatPostEmbed(postData);
    
    return {
      username: 'Forum Monitor',
      avatar_url: 'https://forum.ripper.store/assets/uploads/system/site-logo.png',
      content: `🚨 **New post in Gifts/Downloads!**`,
      embeds: [embed],
      allowed_mentions: {
        parse: [] // Don't mention anyone
      }
    };
  }

  async sendWebhook(postData) {
    try {
      const payload = this.createWebhookPayload(postData);
      
      console.log(`Sending webhook for post: ${postData.title}`);
      console.log(`Webhook URL: ${config.webhookUrl.substring(0, 50)}...`);

      const response = await this.axiosInstance.post(config.webhookUrl, payload, {
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (response.status === 204) {
        console.log('✅ Webhook sent successfully');
        return true;
      } else {
        console.log(`⚠️ Unexpected response status: ${response.status}`);
        return false;
      }
    } catch (error) {
      console.error('❌ Error sending webhook:', error.message);
      
      if (error.response) {
        console.error('Response status:', error.response.status);
        console.error('Response data:', error.response.data);
        
        // Handle rate limiting
        if (error.response.status === 429) {
          const retryAfter = error.response.headers['retry-after'];
          console.log(`Rate limited. Retry after: ${retryAfter} seconds`);
          return false;
        }
      }
      
      throw error;
    }
  }

  async sendTestMessage() {
    try {
      const testPayload = {
        username: 'Forum Monitor',
        avatar_url: 'https://forum.ripper.store/assets/uploads/system/site-logo.png',
        content: '🧪 **Test Message**',
        embeds: [{
          title: 'Bot Test - Connection Successful!',
          description: 'Your Discord webhook is working correctly. The bot is ready to monitor forum.ripper.store for new posts.',
          color: 0x00ff00, // Green color
          timestamp: new Date().toISOString(),
          footer: {
            text: 'Forum Ripper Store Monitor - Test',
          },
          fields: [
            {
              name: '✅ Status',
              value: 'Bot is online and ready',
              inline: true
            },
            {
              name: '🔍 Monitoring',
              value: 'Gifts/Downloads category',
              inline: true
            },
            {
              name: '⏱️ Check Interval',
              value: `${config.checkIntervalMinutes} minutes`,
              inline: true
            }
          ]
        }]
      };

      const response = await this.axiosInstance.post(config.webhookUrl, testPayload, {
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (response.status === 204) {
        console.log('✅ Test webhook sent successfully');
        return true;
      } else {
        console.log(`⚠️ Unexpected response status: ${response.status}`);
        return false;
      }
    } catch (error) {
      console.error('❌ Error sending test webhook:', error.message);
      if (error.response) {
        console.error('Response status:', error.response.status);
        console.error('Response data:', error.response.data);
      }
      throw error;
    }
  }

  async sendErrorMessage(errorMessage) {
    try {
      const errorPayload = {
        username: 'Forum Monitor',
        avatar_url: 'https://forum.ripper.store/assets/uploads/system/site-logo.png',
        content: '🚨 **Bot Error Alert**',
        embeds: [{
          title: 'Error Occurred',
          description: `The forum monitor bot encountered an error:\n\`\`\`${errorMessage}\`\`\``,
          color: 0xff0000, // Red color
          timestamp: new Date().toISOString(),
          footer: {
            text: 'Forum Ripper Store Monitor - Error',
          }
        }]
      };

      await this.axiosInstance.post(config.webhookUrl, errorPayload, {
        headers: {
          'Content-Type': 'application/json',
        },
      });

      console.log('✅ Error notification sent to Discord');
    } catch (error) {
      console.error('❌ Failed to send error notification:', error.message);
    }
  }

  async sendStatusMessage(status, details = {}) {
    try {
      const statusColors = {
        starting: 0xffaa00, // Orange
        running: 0x00ff00,  // Green
        stopping: 0xff9900, // Yellow
        error: 0xff0000     // Red
      };

      const statusPayload = {
        username: 'Forum Monitor',
        avatar_url: 'https://forum.ripper.store/assets/uploads/system/site-logo.png',
        embeds: [{
          title: `Bot Status: ${status.toUpperCase()}`,
          color: statusColors[status] || 0x7289DA,
          timestamp: new Date().toISOString(),
          footer: {
            text: 'Forum Ripper Store Monitor',
          },
          fields: Object.entries(details).map(([key, value]) => ({
            name: key,
            value: String(value),
            inline: true
          }))
        }]
      };

      await this.axiosInstance.post(config.webhookUrl, statusPayload, {
        headers: {
          'Content-Type': 'application/json',
        },
      });

      console.log(`✅ Status message sent: ${status}`);
    } catch (error) {
      console.error('❌ Failed to send status message:', error.message);
    }
  }
}

module.exports = DiscordWebhook;