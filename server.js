// ============================================
// TIME CAPSULE - BACKEND SERVER
// Node.js + Express + SQLite
// ============================================

const express = require('express');
const cors = require('cors');
const sqlite3 = require('sqlite3').verbose();
const bodyParser = require('body-parser');

const app = express();
const PORT = process.env.PORT || 3000;

// ============================================
// MIDDLEWARE
// ============================================
app.use(cors());
app.use(bodyParser.json({ limit: '10mb' })); // Per supportare base64 media
app.use(bodyParser.urlencoded({ extended: true, limit: '10mb' }));

// ============================================
// DATABASE SETUP
// ============================================
const db = new sqlite3.Database('./timecapsule.db', (err) => {
  if (err) {
    console.error('Error opening database:', err);
  } else {
    console.log('✅ Database connected');
    initDatabase();
  }
});

function initDatabase() {
  db.run(`
    CREATE TABLE IF NOT EXISTS messages (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      title TEXT NOT NULL,
      coords TEXT NOT NULL UNIQUE,
      text TEXT NOT NULL,
      category TEXT NOT NULL,
      date TEXT NOT NULL,
      photo TEXT,
      audio TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )
  `, (err) => {
    if (err) {
      console.error('Error creating table:', err);
    } else {
      console.log('✅ Database table ready');
    }
  });
}

// ============================================
// API ROUTES
// ============================================

// Health check
app.get('/api/health', (req, res) => {
  res.json({ 
    status: 'ok', 
    message: 'Time Capsule backend is running',
    timestamp: new Date().toISOString()
  });
});

// Get all messages
app.get('/api/messages', (req, res) => {
  const category = req.query.category;
  
  let query = 'SELECT * FROM messages ORDER BY created_at DESC';
  let params = [];
  
  if (category) {
    query = 'SELECT * FROM messages WHERE category = ? ORDER BY created_at DESC';
    params = [category];
  }
  
  db.all(query, params, (err, rows) => {
    if (err) {
      console.error('Error fetching messages:', err);
      return res.status(500).json({ error: 'Failed to fetch messages' });
    }
    
    res.json({ 
      messages: rows,
      count: rows.length 
    });
  });
});

// Get message count
app.get('/api/messages/count', (req, res) => {
  db.get('SELECT COUNT(*) as count FROM messages', (err, row) => {
    if (err) {
      console.error('Error counting messages:', err);
      return res.status(500).json({ error: 'Failed to count messages' });
    }
    
    res.json({ count: row.count });
  });
});

// Get message by coordinates
app.get('/api/messages/:coords', (req, res) => {
  const coords = decodeURIComponent(req.params.coords);
  
  db.get('SELECT * FROM messages WHERE coords = ?', [coords], (err, row) => {
    if (err) {
      console.error('Error fetching message:', err);
      return res.status(500).json({ error: 'Failed to fetch message' });
    }
    
    if (!row) {
      return res.status(404).json({ error: 'Message not found' });
    }
    
    res.json({ message: row });
  });
});

// Create new message
app.post('/api/messages', (req, res) => {
  const { title, coords, text, category, date, photo, audio } = req.body;
  
  // Validation
  if (!title || !coords || !text || !category || !date) {
    return res.status(400).json({ 
      error: 'Missing required fields: title, coords, text, category, date' 
    });
  }
  
  const validCategories = ['memory', 'memorial', 'love', 'family', 'joy'];
  if (!validCategories.includes(category)) {
    return res.status(400).json({ 
      error: 'Invalid category. Must be one of: ' + validCategories.join(', ')
    });
  }
  
  const query = `
    INSERT INTO messages (title, coords, text, category, date, photo, audio)
    VALUES (?, ?, ?, ?, ?, ?, ?)
  `;
  
  db.run(query, [title, coords, text, category, date, photo, audio], function(err) {
    if (err) {
      if (err.message.includes('UNIQUE')) {
        return res.status(409).json({ 
          error: 'A message already exists at these coordinates' 
        });
      }
      console.error('Error saving message:', err);
      return res.status(500).json({ error: 'Failed to save message' });
    }
    
    // Get total count
    db.get('SELECT COUNT(*) as count FROM messages', (err, row) => {
      res.status(201).json({ 
        id: this.lastID,
        count: row ? row.count : 1,
        message: 'Message saved successfully'
      });
    });
  });
});

// Delete message (admin only - in production add authentication)
app.delete('/api/messages/:coords', (req, res) => {
  const coords = decodeURIComponent(req.params.coords);
  
  db.run('DELETE FROM messages WHERE coords = ?', [coords], function(err) {
    if (err) {
      console.error('Error deleting message:', err);
      return res.status(500).json({ error: 'Failed to delete message' });
    }
    
    if (this.changes === 0) {
      return res.status(404).json({ error: 'Message not found' });
    }
    
    res.json({ message: 'Message deleted successfully' });
  });
});

// Get messages by category
app.get('/api/categories/:category', (req, res) => {
  const category = req.params.category;
  const validCategories = ['memory', 'memorial', 'love', 'family', 'joy'];
  
  if (!validCategories.includes(category)) {
    return res.status(400).json({ error: 'Invalid category' });
  }
  
  db.all(
    'SELECT * FROM messages WHERE category = ? ORDER BY created_at DESC',
    [category],
    (err, rows) => {
      if (err) {
        console.error('Error fetching messages:', err);
        return res.status(500).json({ error: 'Failed to fetch messages' });
      }
      
      res.json({ 
        category,
        messages: rows,
        count: rows.length 
      });
    }
  );
});

// Get statistics
app.get('/api/stats', (req, res) => {
  const queries = [
    'SELECT COUNT(*) as total FROM messages',
    `SELECT category, COUNT(*) as count FROM messages GROUP BY category`
  ];
  
  db.get(queries[0], (err, totalRow) => {
    if (err) {
      console.error('Error fetching stats:', err);
      return res.status(500).json({ error: 'Failed to fetch stats' });
    }
    
    db.all(queries[1], (err, categoryRows) => {
      if (err) {
        console.error('Error fetching category stats:', err);
        return res.status(500).json({ error: 'Failed to fetch stats' });
      }
      
      const categoryStats = {};
      categoryRows.forEach(row => {
        categoryStats[row.category] = row.count;
      });
      
      res.json({
        total: totalRow.total,
        byCategory: categoryStats
      });
    });
  });
});

// ============================================
// ERROR HANDLING
// ============================================
app.use((err, req, res, next) => {
  console.error('Unhandled error:', err);
  res.status(500).json({ error: 'Internal server error' });
});

// ============================================
// START SERVER
// ============================================
app.listen(PORT, () => {
  console.log(`
🟢 Time Capsule Backend Server
================================
Port: ${PORT}
Database: ./timecapsule.db
Status: Running

API Endpoints:
- GET  /api/health
- GET  /api/messages
- GET  /api/messages/count
- GET  /api/messages/:coords
- POST /api/messages
- GET  /api/categories/:category
- GET  /api/stats
================================
  `);
});

// Graceful shutdown
process.on('SIGINT', () => {
  console.log('\n\n🔴 Shutting down server...');
  db.close((err) => {
    if (err) {
      console.error('Error closing database:', err);
    } else {
      console.log('✅ Database closed');
    }
    process.exit(0);
  });
});
