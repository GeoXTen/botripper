const { config } = require('./config');

class LinkExtractor {
  constructor() {
    // Define platform emojis for better visual representation
    this.platformEmojis = {
      // Source platforms
      'gumroad.com': '🛒',
      'booth.pm': '🏪',
      'patreon.com': '🎨',
      'fanbox.cc': '📦',
      'ko-fi.com': '☕',
      'artstation.com': '🎭',
      'itch.io': '🎮',
      
      // Download platforms
      'pixeldrain.com': '🗂️',
      'drive.google.com': '📁',
      'workupload.com': '📤',
      'mediafire.com': '📎',
      'mega.nz': '☁️',
      'mega.co.nz': '☁️',
      'dropbox.com': '📋',
      '1fichier.com': '📄',
      'rapidgator.net': '⚡',
      'uploaded.net': '📤',
      'turbobit.net': '🔄',
      'nitroflare.com': '🔥'
    };
  }

  getEmojiForUrl(url) {
    const domain = this.extractDomain(url);
    return this.platformEmojis[domain] || '🔗';
  }

  extractDomain(url) {
    try {
      const urlObj = new URL(url);
      return urlObj.hostname.toLowerCase().replace('www.', '');
    } catch (error) {
      return url.toLowerCase();
    }
  }

  getPlatformName(url) {
    const domain = this.extractDomain(url);
    
    const platformNames = {
      'gumroad.com': 'Gumroad',
      'booth.pm': 'Booth',
      'patreon.com': 'Patreon',
      'fanbox.cc': 'Fanbox',
      'ko-fi.com': 'Ko-fi',
      'artstation.com': 'ArtStation',
      'itch.io': 'itch.io',
      'pixeldrain.com': 'PixelDrain',
      'drive.google.com': 'Google Drive',
      'workupload.com': 'WorkUpload',
      'mediafire.com': 'MediaFire',
      'mega.nz': 'MEGA',
      'mega.co.nz': 'MEGA',
      'dropbox.com': 'Dropbox',
      '1fichier.com': '1fichier',
      'rapidgator.net': 'RapidGator',
      'uploaded.net': 'Uploaded',
      'turbobit.net': 'TurboBit',
      'nitroflare.com': 'NitroFlare'
    };

    return platformNames[domain] || domain;
  }

  categorizeLinks(links) {
    const categorized = {
      sourceLinks: [],
      downloadLinks: [],
      otherLinks: []
    };

    links.forEach(link => {
      const url = typeof link === 'string' ? link : link.url;
      const text = typeof link === 'string' ? '' : (link.text || '');
      
      if (!url) return;

      const isSourceLink = config.sourcePatterns.some(pattern => pattern.test(url));
      const isDownloadLink = config.downloadPatterns.some(pattern => pattern.test(url));

      const linkInfo = {
        url: url,
        text: text || this.getPlatformName(url),
        platform: this.getPlatformName(url),
        emoji: this.getEmojiForUrl(url),
        domain: this.extractDomain(url)
      };

      if (isSourceLink) {
        categorized.sourceLinks.push(linkInfo);
      } else if (isDownloadLink) {
        categorized.downloadLinks.push(linkInfo);
      } else {
        categorized.otherLinks.push(linkInfo);
      }
    });

    return categorized;
  }

  extractLinksFromText(text) {
    const urlRegex = /https?:\/\/[^\s<>"\[\]{}|\\^`]+/gi;
    const urls = text.match(urlRegex) || [];
    
    return urls.map(url => ({
      url: url.trim(),
      text: this.getPlatformName(url),
      platform: this.getPlatformName(url),
      emoji: this.getEmojiForUrl(url),
      domain: this.extractDomain(url)
    }));
  }

  formatLinksForDiscord(links, type = 'Links') {
    if (!links || links.length === 0) {
      return null;
    }

    const formatted = links.map(link => {
      const emoji = link.emoji || this.getEmojiForUrl(link.url);
      const platform = link.platform || this.getPlatformName(link.url);
      return `${emoji} [${platform}](${link.url})`;
    }).join('\n');

    return {
      name: type,
      value: formatted,
      inline: false
    };
  }

  deduplicateLinks(links) {
    const seen = new Set();
    return links.filter(link => {
      const url = typeof link === 'string' ? link : link.url;
      if (seen.has(url)) {
        return false;
      }
      seen.add(url);
      return true;
    });
  }

  validateUrl(url) {
    try {
      new URL(url);
      return true;
    } catch (error) {
      return false;
    }
  }

  cleanUrl(url) {
    try {
      const urlObj = new URL(url);
      // Remove tracking parameters
      const trackingParams = ['utm_source', 'utm_medium', 'utm_campaign', 'utm_term', 'utm_content', 'ref', 'referrer'];
      trackingParams.forEach(param => {
        urlObj.searchParams.delete(param);
      });
      return urlObj.toString();
    } catch (error) {
      return url;
    }
  }

  extractAllLinks(postData) {
    const allLinks = [];

    // Extract from existing categorized links
    if (postData.sourceLinks) {
      allLinks.push(...postData.sourceLinks);
    }
    if (postData.downloadLinks) {
      allLinks.push(...postData.downloadLinks);
    }

    // Extract from content text
    if (postData.content) {
      const textLinks = this.extractLinksFromText(postData.content);
      allLinks.push(...textLinks);
    }

    // Extract from preview text
    if (postData.preview) {
      const previewLinks = this.extractLinksFromText(postData.preview);
      allLinks.push(...previewLinks);
    }

    // Clean and validate URLs
    const cleanedLinks = allLinks
      .map(link => ({
        ...link,
        url: this.cleanUrl(link.url)
      }))
      .filter(link => this.validateUrl(link.url));

    // Remove duplicates
    const deduplicatedLinks = this.deduplicateLinks(cleanedLinks);

    // Categorize all links
    return this.categorizeLinks(deduplicatedLinks);
  }
}

module.exports = LinkExtractor;