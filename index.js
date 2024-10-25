import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';

dotenv.config();

const app = express();
const port = process.env.PORT || 3001;

// In-memory storage (temporary)
const tokens = new Map();

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

    // Store token in memory
    tokens.set(data.team_id, {
      integration_type: 'slack',
      access_token: data.access_token,
      refresh_token: data.refresh_token,
      scope: data.scope,
      team_id: data.team_id,
      created_at: new Date().toISOString(),
      expires_at: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString() // 30 days
    });

    console.log('Token stored for team:', data.team_id);
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
    const now = new Date();
    const validTokens = Array.from(tokens.values()).filter(token => 
      new Date(token.expires_at) > now
    );
    
    const connected = validTokens.length > 0;
    console.log('Slack connection status:', { connected, count: validTokens.length });
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
      const tokenList = Array.from(tokens.values()).map(token => ({
        ...token,
        access_token: '***hidden***'
      }));
      console.log('Current tokens:', tokenList);
      res.json(tokenList);
    } catch (error) {
      console.error('Error fetching tokens:', error);
      res.status(500).json({ error: 'Failed to fetch tokens' });
    }
  });
}

app.listen(port, () => {
  console.log(`Backend server running on port ${port}`);
});