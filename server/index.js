const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');

dotenv.config();

const app = express();
const port = process.env.PORT || 3001;

app.use(cors({
  origin: ['http://localhost:5173', 'http://localhost:3000'],
  credentials: true
}));

app.use(express.json());

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({ status: 'healthy' });
});

// Exchange code for token
app.post('/api/slack/oauth', async (req, res) => {
  const { code } = req.body;
  
  try {
    console.log('Exchanging code for token...');
    
    const params = new URLSearchParams({
      client_id: process.env.SLACK_CLIENT_ID,
      client_secret: process.env.SLACK_CLIENT_SECRET,
      code,
    });

    console.log('OAuth params:', params.toString());

    const response = await fetch('https://slack.com/api/oauth.v2.access', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: params,
    });

    const data = await response.json();
    console.log('Slack API response:', data);

    if (!data.ok) {
      throw new Error(data.error || 'Failed to exchange code');
    }

    console.log('Token exchange successful');
    res.json({ success: true });
  } catch (error) {
    console.error('Error exchanging code for token:', error);
    res.status(500).json({ error: error.message });
  }
});

// Check connection status
app.get('/api/slack/status', async (req, res) => {
  // For now, always return not connected since we don't have persistence
  res.json({ connected: false });
});

app.listen(port, '0.0.0.0', () => {
  console.log(`Backend server running on port ${port}`);
});