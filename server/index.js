import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import { createClient } from '@libsql/client';

dotenv.config();

const app = express();
const port = process.env.PORT || 3001;

// Initialize database
const db = createClient({
  url: process.env.DATABASE_URL || 'file:integration-tokens.db',
});

// Ensure tables exist
async function initDb() {
  try {
    await db.execute(`
      CREATE TABLE IF NOT EXISTS integration_tokens (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        integration_type TEXT NOT NULL,
        access_token TEXT NOT NULL,
        refresh_token TEXT,
        scope TEXT,
        team_id TEXT,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        expires_at DATETIME
      )
    `);
    console.log('Database initialized successfully');
    
    // Verify table exists
    const tables = await db.execute(`
      SELECT name FROM sqlite_master 
      WHERE type='table' AND name='integration_tokens'
    `);
    console.log('Available tables:', tables.rows);
  } catch (error) {
    console.error('Database initialization error:', error);
    process.exit(1);
  }
}

initDb();

const allowedOrigins = [
  process.env.FRONTEND_URL,
  'http://localhost:5173',
  'http://localhost:3000'
];

app.use(cors({
  origin: (origin, callback) => {
    if (!origin || allowedOrigins.includes(origin)) {
      callback(null, true);
    } else {
      callback(new Error('Not allowed by CORS'));
    }
  },
  credentials: true
}));

app.use(express.json());

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({ status: 'healthy' });
});

// Exchange code for token
app.post('/api/slack/oauth', async (req, res) => {
  const { code, redirect_uri } = req.body;
  
  console.log('Received OAuth request:', { code: '***', redirect_uri });
  
  try {
    const params = new URLSearchParams({
      client_id: process.env.SLACK_CLIENT_ID,
      client_secret: process.env.SLACK_CLIENT_SECRET,
      code,
      redirect_uri
    });

    console.log('Requesting Slack token with params:', params.toString());

    const response = await fetch('https://slack.com/api/oauth.v2.access', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: params,
    });

    const data = await response.json();
    console.log('Slack API response:', { 
      ok: data.ok,
      error: data.error,
      team_id: data.team_id,
      scope: data.scope
    });

    if (!data.ok) {
      throw new Error(data.error || 'Failed to exchange code');
    }

    // First, check if we already have a token for this team
    const existing = await db.execute({
      sql: 'SELECT id FROM integration_tokens WHERE integration_type = ? AND team_id = ?',
      args: ['slack', data.team_id]
    });

    if (existing.rows.length > 0) {
      // Update existing token
      await db.execute({
        sql: `
          UPDATE integration_tokens 
          SET access_token = ?, refresh_token = ?, scope = ?, expires_at = DATETIME('now', '+30 days')
          WHERE integration_type = ? AND team_id = ?
        `,
        args: [
          data.access_token,
          data.refresh_token || null,
          data.scope,
          'slack',
          data.team_id
        ]
      });
      console.log('Updated existing Slack token for team:', data.team_id);
    } else {
      // Insert new token
      await db.execute({
        sql: `
          INSERT INTO integration_tokens (
            integration_type, 
            access_token, 
            refresh_token, 
            scope, 
            team_id,
            expires_at
          ) VALUES (?, ?, ?, ?, ?, DATETIME('now', '+30 days'))
        `,
        args: [
          'slack',
          data.access_token,
          data.refresh_token || null,
          data.scope,
          data.team_id
        ]
      });
      console.log('Stored new Slack token for team:', data.team_id);
    }

    // Verify token was stored
    const verification = await db.execute({
      sql: 'SELECT id, team_id, created_at FROM integration_tokens WHERE team_id = ?',
      args: [data.team_id]
    });
    console.log('Token verification:', verification.rows[0]);

    res.json({ success: true });
  } catch (error) {
    console.error('Error in Slack OAuth flow:', error);
    res.status(500).json({ 
      error: error.message,
      details: error.stack
    });
  }
});

// Check connection status
app.get('/api/slack/status', async (req, res) => {
  try {
    const result = await db.execute({
      sql: `
        SELECT COUNT(*) as count 
        FROM integration_tokens 
        WHERE integration_type = ? 
        AND expires_at > DATETIME('now')
      `,
      args: ['slack']
    });
    
    const connected = result.rows[0].count > 0;
    console.log('Slack connection status:', { connected, count: result.rows[0].count });
    res.json({ connected });
  } catch (error) {
    console.error('Error checking Slack connection:', error);
    res.status(500).json({ 
      error: 'Failed to check connection status',
      details: error.message 
    });
  }
});

// Debug endpoint to check tokens (disabled in production)
if (process.env.NODE_ENV !== 'production') {
  app.get('/api/debug/tokens', async (req, res) => {
    try {
      const result = await db.execute(`
        SELECT id, integration_type, team_id, scope, created_at, expires_at 
        FROM integration_tokens
      `);
      console.log('Current tokens:', result.rows);
      res.json(result.rows);
    } catch (error) {
      console.error('Error fetching tokens:', error);
      res.status(500).json({ error: 'Failed to fetch tokens' });
    }
  });
}

app.listen(port, () => {
  console.log(`Backend server running on port ${port}`);
});