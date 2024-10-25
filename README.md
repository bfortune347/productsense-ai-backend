# ProductSense.ai Backend

Backend service for ProductSense.ai, handling Slack integration and feedback analysis.

## Setup

1. Install dependencies:
```bash
npm install
```

2. Create `.env` file:
```env
SLACK_CLIENT_ID=your_slack_client_id
SLACK_CLIENT_SECRET=your_slack_client_secret
FRONTEND_URL=your_frontend_url
DATABASE_URL=your_database_url
PORT=3001
```

3. Start the server:
```bash
npm start
```

## API Endpoints

- `GET /health` - Health check endpoint
- `POST /api/slack/oauth` - Handle Slack OAuth flow
- `GET /api/slack/status` - Check Slack connection status

## Development

```bash
npm run dev
```

## Production

```bash
npm start
```