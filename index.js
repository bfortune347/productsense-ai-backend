import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import { createClient } from '@libsql/client';

dotenv.config();

const app = express();
const port = process.env.PORT || 3001;

// Validate required environment variables
const requiredEnvVars = ['TURSO_DATABASE_URL', 'TURSO_AUTH_TOKEN', 'SLACK_CLIENT_ID', 'SLACK_CLIENT_SECRET'];
const missingEnvVars = requiredEnvVars.filter(varName => !process.env[varName]);

if (missingEnvVars.length > 0) {
  console.error('Missing required environment variables:', missingEnvVars);
  process.exit(1);
}

// Initialize Turso database client
console.log('Initializing database connection...');
const db = createClient({
  url: process.env.TURSO_DATABASE_URL,
  authToken: process.env.TURSO_AUTH_TOKEN
});

// Test database connection and initialize schema
async function initDb() {
  try {
    console.log('Testing database connection...');
    
    // Test connection with a simple query
    await db.execute('SELECT 1');
    console.log('Database connection successful!');

    console.log('Creating tables if they don\'t exist...');
    await db.execute(`
      CREATE TABLE IF NOT EXISTS oauth_tokens (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        provider TEXT NOT NULL,
        access_token TEXT NOT NULL,
        scope TEXT NOT NULL,
        team_id TEXT,
        user_id TEXT NOT NULL,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        expires_at DATETIME NOT NULL,
        UNIQUE(provider, user_id)
      )
    `);
    console.log('Database schema initialized successfully');
  } catch (error) {
    console.error('Database initialization failed:', error);
    throw error;
  }
}

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

// Health check endpoint with database status
app.get('/health', async (req, res) => {
  try {
    await db.execute('SELECT 1');
    res.json({ 
      status: 'healthy',
      database: 'connected'
    });
  } catch (error) {
    res.status(500).json({ 
      status: 'unhealthy',
      database: 'disconnected',
      error: error.message
    });
  }
});

// Exchange code for token
app.post('/api/slack/oauth', async (req, res) => {
  const { code, redirect_uri } = req.body;
  
  try {
    const params = new URLSearchParams({
      client_id: process.env.SLACK_CLIENT_ID,
      client_secret: process.env.SLACK_CLIENT_SECRET,
      code,
      redirect_uri
    });

    const response = await fetch('https://slack.com/api/oauth.v2.access', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: params,
    });

    const data = await response.json();

    if (!data.ok) {
      console.error('Slack OAuth error:', data.error);
      throw new Error(data.error || 'Failed to exchange code');
    }

    // Store token in database
    await db.execute({
      sql: `
        INSERT INTO oauth_tokens (
          provider,
          access_token,
          scope,
          team_id,
          user_id,
          expires_at
        ) VALUES (?, ?, ?, ?, ?, datetime('now', '+90 days'))
        ON CONFLICT(provider, user_id) DO UPDATE SET
          access_token = excluded.access_token,
          scope = excluded.scope,
          team_id = excluded.team_id,
          expires_at = excluded.expires_at
      `,
      args: [
        'slack',
        data.authed_user.access_token,
        data.authed_user.scope,
        data.team?.id || null,
        data.authed_user.id
      ]
    });

    console.log('Slack token stored successfully');
    res.json({ success: true });
  } catch (error) {
    console.error('Error in Slack OAuth flow:', error);
    res.status(500).json({ 
      error: 'Failed to complete OAuth flow',
      details: error.message
    });
  }
});

// Check connection status
app.get('/api/slack/status', async (req, res) => {
  try {
    const result = await db.execute({
      sql: `
        SELECT COUNT(*) as count 
        FROM oauth_tokens 
        WHERE provider = ? 
        AND expires_at > datetime('now')
      `,
      args: ['slack']
    });
    
    const connected = result.rows[0].count > 0;
    res.json({ connected });
  } catch (error) {
    console.error('Error checking Slack connection:', error);
    res.status(500).json({ 
      error: 'Failed to check connection status',
      details: error.message 
    });
  }
});

// Initialize database and start server
initDb()
  .then(() => {
    app.listen(port, () => {
      console.log(`Backend server running on port ${port}`);
      console.log(`Health check available at http://localhost:${port}/health`);
    });
  })
  .catch(error => {
    console.error('Failed to initialize database:', error);
    process.exit(1);
  });