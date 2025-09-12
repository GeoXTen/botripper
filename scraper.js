const axios = require('axios');
const cheerio = require('cheerio');
const { config } = require('./config');

class ForumScraper {
  constructor() {
    this.axiosInstance = axios.create({
      headers: {
        'User-Agent': config.userAgent,
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
        'Accept-Language': 'en-US,en;q=0.5',
        'Accept-Encoding': 'gzip, deflate',
        'Connection': 'keep-alive',
        'Upgrade-Insecure-Requests': '1',
      },
      timeout: 30000, // 30 seconds timeout
    });
  }

  async fetchForumPage() {
    try {
      console.log(`Fetching forum page: ${config.forumUrl}`);
      const response = await this.axiosInstance.get(config.forumUrl);
      return response.data;
    } catch (error) {
      console.error('Error fetching forum page:', error.message);
      throw error;
    }
  }

  async fetchPostContent(postUrl) {
    try {
      console.log(`Fetching post content: ${postUrl}`);
      const response = await this.axiosInstance.get(postUrl);
      return response.data;
    } catch (error) {
      console.error(`Error fetching post content from ${postUrl}:`, error.message);
      return null;
    }
  }

  parseForumPage(html) {
    const $ = cheerio.load(html);
    const posts = [];

    // Find topic items in the forum listing
    $('[data-topic-id]').each((index, element) => {
      if (index >= config.maxPostsPerCheck) return false; // Limit posts per check

      const $post = $(element);
      const topicId = $post.attr('data-topic-id');
      
      if (!topicId) return;

      // Extract basic post information
      const titleElement = $post.find('.topic-title a, h2 a, .title a').first();
      const title = titleElement.text().trim();
      const relativeUrl = titleElement.attr('href');
      
      if (!title || !relativeUrl) return;

      // Construct full URL
      const fullUrl = relativeUrl.startsWith('http') 
        ? relativeUrl 
        : `https://forum.ripper.store${relativeUrl}`;

      // Extract author information
      const authorElement = $post.find('.topic-owner a, .username a, .author a').first();
      const author = authorElement.text().trim() || 'Unknown';

      // Extract timestamp
      const timeElement = $post.find('.timeago, .topic-posted-date, time').first();
      const timestamp = timeElement.attr('title') || timeElement.attr('datetime') || timeElement.text().trim();

      // Extract preview text if available
      const previewElement = $post.find('.topic-excerpt, .preview, .teaser').first();
      const preview = previewElement.text().trim();

      posts.push({
        id: topicId,
        title,
        author,
        url: fullUrl,
        timestamp,
        preview,
        rawHtml: $post.html()
      });
    });

    console.log(`Found ${posts.length} posts on forum page`);
    return posts;
  }

  async parsePostContent(html, postUrl) {
    const $ = cheerio.load(html);
    const links = {
      sourceLinks: [],
      downloadLinks: []
    };

    // Extract all links from the post content
    const postContent = $('.post-content, .topic-content, .content, .post').first();
    
    postContent.find('a').each((index, element) => {
      const link = $(element).attr('href');
      if (!link) return;

      const linkText = $(element).text().trim().toLowerCase();
      const fullLink = link.startsWith('http') ? link : `https://${link}`;

      // Check if it's a source link
      const isSourceLink = config.sourcePatterns.some(pattern => 
        pattern.test(fullLink) || pattern.test(linkText)
      );

      // Check if it's a download link
      const isDownloadLink = config.downloadPatterns.some(pattern => 
        pattern.test(fullLink) || pattern.test(linkText)
      );

      if (isSourceLink) {
        links.sourceLinks.push({
          url: fullLink,
          text: linkText || 'Source Link'
        });
      } else if (isDownloadLink) {
        links.downloadLinks.push({
          url: fullLink,
          text: linkText || 'Download Link'
        });
      }
    });

    // Also check for links in plain text that might not be proper <a> tags
    const textContent = postContent.text();
    const urlRegex = /https?:\/\/[^\s<>"\[\]{}|\\^`]+/gi;
    const foundUrls = textContent.match(urlRegex) || [];

    foundUrls.forEach(url => {
      // Check if it's a source link
      const isSourceLink = config.sourcePatterns.some(pattern => pattern.test(url));
      const isDownloadLink = config.downloadPatterns.some(pattern => pattern.test(url));

      if (isSourceLink && !links.sourceLinks.some(link => link.url === url)) {
        links.sourceLinks.push({
          url: url,
          text: 'Source Link'
        });
      } else if (isDownloadLink && !links.downloadLinks.some(link => link.url === url)) {
        links.downloadLinks.push({
          url: url,
          text: 'Download Link'
        });
      }
    });

    // Extract post image if available
    const imageElement = postContent.find('img').first();
    const imageUrl = imageElement.attr('src');
    const fullImageUrl = imageUrl && imageUrl.startsWith('http') 
      ? imageUrl 
      : imageUrl ? `https://forum.ripper.store${imageUrl}` : null;

    // Extract post text content
    const extractedText = postContent.text().trim();

    console.log(`Extracted ${links.sourceLinks.length} source links and ${links.downloadLinks.length} download links from ${postUrl}`);

    return {
      ...links,
      imageUrl: fullImageUrl,
      content: extractedText.substring(0, 500) // Limit content length
    };
  }

  async scrapeNewPosts() {
    try {
      // Fetch the main forum page
      const forumHtml = await this.fetchForumPage();
      const posts = this.parseForumPage(forumHtml);

      // Fetch detailed content for each post
      const detailedPosts = [];
      
      for (const post of posts) {
        try {
          const postHtml = await this.fetchPostContent(post.url);
          if (postHtml) {
            const postDetails = await this.parsePostContent(postHtml, post.url);
            
            detailedPosts.push({
              ...post,
              ...postDetails,
              postedAt: new Date().toISOString()
            });
          }

          // Add delay between requests to be respectful
          await new Promise(resolve => setTimeout(resolve, 1000));
        } catch (error) {
          console.error(`Error processing post ${post.url}:`, error.message);
          // Continue with next post even if one fails
        }
      }

      return detailedPosts;
    } catch (error) {
      console.error('Error scraping forum:', error.message);
      throw error;
    }
  }
}

module.exports = ForumScraper;