const API_URL = 'https://productsense-ai-backend.onrender.com';

export const initiateSlackAuth = () => {
  const width = 600;
  const height = 800;
  const left = (window.screen.width / 2) - (width / 2);
  const top = (window.screen.height / 2) - (height / 2);

  const redirectUri = `${window.location.origin}/settings`;
  const state = Math.random().toString(36).substring(7);
  
  // Store state in sessionStorage for verification
  sessionStorage.setItem('slackOAuthState', state);

  const authUrl = new URL('https://slack.com/oauth/v2/authorize');
  authUrl.searchParams.append('client_id', '7454949507506.7864240382710');
  authUrl.searchParams.append('user_scope', 'channels:history,channels:read');
  authUrl.searchParams.append('redirect_uri', redirectUri);
  authUrl.searchParams.append('state', state);
  
  const popup = window.open(
    authUrl.toString(),
    'SlackAuth',
    `width=${width},height=${height},left=${left},top=${top}`
  );

  if (popup) {
    const checkPopup = setInterval(() => {
      if (popup.closed) {
        clearInterval(checkPopup);
        checkSlackConnection().then(connected => {
          if (connected) {
            window.location.reload();
          }
        });
      }
    }, 500);
  }
};

export const handleSlackCallback = async (code: string, state: string): Promise<boolean> => {
  const storedState = sessionStorage.getItem('slackOAuthState');
  
  if (!storedState || storedState !== state) {
    throw new Error('Invalid state parameter');
  }
  
  sessionStorage.removeItem('slackOAuthState');

  try {
    const response = await fetch(`${API_URL}/api/slack/oauth`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ 
        code,
        redirect_uri: `${window.location.origin}/settings`
      }),
    });

    if (!response.ok) {
      throw new Error('Failed to exchange code');
    }

    const data = await response.json();
    return data.success;
  } catch (error) {
    console.error('Error connecting Slack:', error);
    throw error;
  }
};

export const checkSlackConnection = async (): Promise<boolean> => {
  try {
    const response = await fetch(`${API_URL}/api/slack/status`);
    if (!response.ok) {
      throw new Error('Failed to check connection status');
    }
    const data = await response.json();
    return data.connected;
  } catch (error) {
    console.error('Error checking connection:', error);
    throw error;
  }
};