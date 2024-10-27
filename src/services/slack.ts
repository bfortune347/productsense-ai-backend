const API_URL = 'https://productsense-ai-backend.onrender.com';

interface SlackAuthResponse {
  success: boolean;
  team?: string;
  user?: string;
}

export const initiateSlackAuth = (): Promise<SlackAuthResponse> => {
  const width = 600;
  const height = 800;
  const left = (window.screen.width / 2) - (width / 2);
  const top = (window.screen.height / 2) - (height / 2);

  const state = Math.random().toString(36).substring(7);
  sessionStorage.setItem('slackOAuthState', state);

  return new Promise((resolve, reject) => {
    // Function to handle the OAuth callback
    const handleCallback = async (event: MessageEvent) => {
      if (event.origin !== window.location.origin) return;

      try {
        const { code, state: returnedState } = event.data;
        
        if (!code || !returnedState) return;
        if (returnedState !== state) {
          throw new Error('Invalid state parameter');
        }

        // Exchange code for token
        const response = await fetch(`${API_URL}/api/slack/oauth`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ 
            code,
            redirect_uri: `${window.location.origin}/slack/callback.html`
          }),
        });

        if (!response.ok) {
          throw new Error('Failed to exchange code');
        }

        const data = await response.json() as SlackAuthResponse;
        resolve(data);
      } catch (error) {
        reject(error);
      } finally {
        window.removeEventListener('message', handleCallback);
      }
    };

    // Add message listener before opening popup
    window.addEventListener('message', handleCallback);

    // Open popup
    const authUrl = new URL('https://slack.com/oauth/v2/authorize');
    authUrl.searchParams.append('client_id', '7454949507506.7864240382710');
    authUrl.searchParams.append('user_scope', 'channels:history,channels:read');
    authUrl.searchParams.append('redirect_uri', `${window.location.origin}/slack/callback.html`);
    authUrl.searchParams.append('state', state);
    
    const popup = window.open(
      authUrl.toString(),
      'SlackAuth',
      `width=${width},height=${height},left=${left},top=${top}`
    );

    if (!popup) {
      window.removeEventListener('message', handleCallback);
      reject(new Error('Failed to open popup. Please allow popups for this site.'));
      return;
    }

    // Poll popup state
    const pollTimer = setInterval(() => {
      if (popup.closed) {
        clearInterval(pollTimer);
        window.removeEventListener('message', handleCallback);
        reject(new Error('Authentication cancelled'));
      }
    }, 500);
  });
};

export const checkSlackConnection = async (): Promise<boolean> => {
  try {
    const response = await fetch(`${API_URL}/api/slack/status`);
    if (!response.ok) {
      throw new Error('Failed to check connection status');
    }
    const data = await response.json() as { connected: boolean };
    return data.connected;
  } catch (error) {
    console.error('Error checking connection:', error);
    throw error;
  }
};