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
    const testResult = await db.execute('SELECT 1 as test');
    console.log('Database connection test result:', testResult);
    console.log('Database connection successful!');

    console.log('Creating tables if they don\'t exist...');
    await db.execute(`
      CREATE TABLE IF NOT EXISTS oauth_tokens (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        provider TEXT NOT NULL,
        access_token TEXT NOT NULL,
        bot_token TEXT,
        scope TEXT NOT NULL,
        team_id TEXT,
        user_id TEXT NOT NULL,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        expires_at DATETIME NOT NULL,
        UNIQUE(provider, team_id, user_id)
      )
    `);
    
    // Verify table exists
    const tables = await db.execute(`
      SELECT name FROM sqlite_master 
      WHERE type='table' AND name='oauth_tokens'
    `);
    console.log('Verified tables:', tables.rows);
    
    console.log('Database schema initialized successfully');
  } catch (error) {
    console.error('Database initialization failed:', error);
    throw error;
  }
}

// Simplified CORS configuration - allow all origins in development
app.use(cors());

app.use(express.json());

// Health check endpoint with database status and token count
app.get('/health', async (req, res) => {
  try {
    // Test basic connection
    const testResult = await db.execute('SELECT 1 as test');
    console.log('Health check test result:', testResult);
    
    // Get token count
    const countResult = await db.execute({
      sql: 'SELECT COUNT(*) as count FROM oauth_tokens WHERE expires_at > datetime("now")'
    });
    
    const count = countResult.rows?.[0]?.count ?? 0;
    
    res.json({ 
      status: 'healthy',
      database: 'connected',
      activeTokens: count
    });
  } catch (error) {
    console.error('Health check failed:', error);
    res.status(500).json({ 
      status: 'unhealthy',
      database: 'disconnected',
      error: error.message
    });
  }
});

// Test endpoint to list all tokens
app.get('/api/tokens/test', async (req, res) => {
  try {
    console.log('Testing database connection and retrieving tokens...');
    
    // First verify connection
    const testResult = await db.execute('SELECT 1 as test');
    console.log('Database connection verified:', testResult);
    
    // Then retrieve tokens
    const tokensResult = await db.execute(`
      SELECT 
        id,
        provider,
        team_id,
        user_id,
        created_at,
        expires_at
      FROM oauth_tokens 
      WHERE expires_at > datetime('now')
      ORDER BY created_at DESC
    `);
    
    // Ensure we have a valid result
    const tokens = tokensResult.rows ?? [];
    console.log('Retrieved tokens:', tokens);
    
    res.json({ 
      success: true,
      tokens,
      count: tokens.length
    });
  } catch (error) {
    console.error('Error testing database:', error);
    res.status(500).json({ 
      success: false,
      error: 'Database test failed',
      details: error.message
    });
  }
});

// Exchange code for token
app.post('/api/slack/oauth', async (req, res) => {
  const { code, redirect_uri } = req.body;
  
  try {
    console.log('Starting OAuth exchange with code:', code);
    
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
    console.log('Slack OAuth response:', JSON.stringify(data, null, 2));

    if (!data.ok) {
      console.error('Slack OAuth error:', data.error);
      throw new Error(data.error || 'Failed to exchange code');
    }

    // Extract required data from the OAuth response
    const {
      access_token,
      scope,
      team,
      authed_user,
      bot_token
    } = data;

    // Verify we have all required data
    if (!access_token || !scope || !team?.id || !authed_user?.id) {
      throw new Error('Missing required data from Slack OAuth response');
    }

    console.log('Storing token in database...');
    
    // Store token in database with proper data structure
    const result = await db.execute({
      sql: `
        INSERT INTO oauth_tokens (
          provider,
          access_token,
          bot_token,
          scope,
          team_id,
          user_id,
          expires_at
        ) VALUES (?, ?, ?, ?, ?, ?, datetime('now', '+90 days'))
        ON CONFLICT(provider, team_id, user_id) DO UPDATE SET
          access_token = excluded.access_token,
          bot_token = excluded.bot_token,
          scope = excluded.scope,
          expires_at = excluded.expires_at
        RETURNING id
      `,
      args: [
        'slack',
        access_token,
        bot_token || null,
        scope,
        team.id,
        authed_user.id
      ]
    });

    console.log('Database insert result:', result);
    console.log('Slack token stored successfully');
    
    res.json({ 
      success: true,
      team: team.id,
      user: authed_user.id
    });
  } catch (error) {
    console.error('Error in Slack OAuth flow:', error);
    res.status(500).json({ 
      success: false,
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
    
    const count = result.rows?.[0]?.count ?? 0;
    const connected = count > 0;
    
    res.json({ connected });
  } catch (error) {
    console.error('Error checking connection:', error);
    res.status(500).json({ 
      success: false,
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