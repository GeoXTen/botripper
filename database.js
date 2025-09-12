const sqlite3 = require('sqlite3').verbose();
const { config } = require('./config');

class Database {
  constructor() {
    this.db = null;
  }

  async init() {
    return new Promise((resolve, reject) => {
      this.db = new sqlite3.Database(config.dbPath, (err) => {
        if (err) {
          console.error('Error opening database:', err.message);
          reject(err);
        } else {
          console.log('Connected to SQLite database');
          this.createTables().then(resolve).catch(reject);
        }
      });
    });
  }

  async createTables() {
    return new Promise((resolve, reject) => {
      const createTableSQL = `
        CREATE TABLE IF NOT EXISTS posted_content (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          post_id TEXT UNIQUE NOT NULL,
          title TEXT NOT NULL,
          author TEXT,
          url TEXT NOT NULL,
          source_links TEXT,
          download_links TEXT,
          posted_at DATETIME DEFAULT CURRENT_TIMESTAMP,
          created_at DATETIME DEFAULT CURRENT_TIMESTAMP
        )
      `;

      this.db.run(createTableSQL, (err) => {
        if (err) {
          console.error('Error creating table:', err.message);
          reject(err);
        } else {
          console.log('Database table ready');
          resolve();
        }
      });
    });
  }

  async isPostAlreadyTracked(postId) {
    return new Promise((resolve, reject) => {
      const sql = 'SELECT id FROM posted_content WHERE post_id = ?';
      
      this.db.get(sql, [postId], (err, row) => {
        if (err) {
          reject(err);
        } else {
          resolve(!!row); // Convert to boolean
        }
      });
    });
  }

  async savePost(postData) {
    return new Promise((resolve, reject) => {
      const sql = `
        INSERT INTO posted_content (post_id, title, author, url, source_links, download_links, posted_at)
        VALUES (?, ?, ?, ?, ?, ?, ?)
      `;
      
      const values = [
        postData.id,
        postData.title,
        postData.author,
        postData.url,
        JSON.stringify(postData.sourceLinks || []),
        JSON.stringify(postData.downloadLinks || []),
        postData.postedAt || new Date().toISOString()
      ];

      this.db.run(sql, values, function(err) {
        if (err) {
          console.error('Error saving post:', err.message);
          reject(err);
        } else {
          console.log(`Post saved with ID: ${this.lastID}`);
          resolve(this.lastID);
        }
      });
    });
  }

  async getRecentPosts(limit = 50) {
    return new Promise((resolve, reject) => {
      const sql = `
        SELECT * FROM posted_content 
        ORDER BY created_at DESC 
        LIMIT ?
      `;
      
      this.db.all(sql, [limit], (err, rows) => {
        if (err) {
          reject(err);
        } else {
          // Parse JSON fields
          const posts = rows.map(row => ({
            ...row,
            sourceLinks: JSON.parse(row.source_links || '[]'),
            downloadLinks: JSON.parse(row.download_links || '[]')
          }));
          resolve(posts);
        }
      });
    });
  }

  async getPostCount() {
    return new Promise((resolve, reject) => {
      const sql = 'SELECT COUNT(*) as count FROM posted_content';
      
      this.db.get(sql, [], (err, row) => {
        if (err) {
          reject(err);
        } else {
          resolve(row.count);
        }
      });
    });
  }

  async cleanup(daysOld = 30) {
    return new Promise((resolve, reject) => {
      const sql = `
        DELETE FROM posted_content 
        WHERE created_at < datetime('now', '-' || ? || ' days')
      `;
      
      this.db.run(sql, [daysOld], function(err) {
        if (err) {
          console.error('Error during cleanup:', err.message);
          reject(err);
        } else {
          console.log(`Cleaned up ${this.changes} old records`);
          resolve(this.changes);
        }
      });
    });
  }

  async close() {
    return new Promise((resolve) => {
      if (this.db) {
        this.db.close((err) => {
          if (err) {
            console.error('Error closing database:', err.message);
          } else {
            console.log('Database connection closed');
          }
          resolve();
        });
      } else {
        resolve();
      }
    });
  }
}

module.exports = Database;