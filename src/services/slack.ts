const API_URL = 'http://localhost:3001/api';

export const initiateSlackAuth = () => {
  const width = 600;
  const height = 800;
  const left = (window.screen.width / 2) - (width / 2);
  const top = (window.screen.height / 2) - (height / 2);

  const redirectUri = `${window.location.origin}/settings`;
  const authUrl = new URL('https://slack.com/oauth/v2/authorize');
  authUrl.searchParams.append('client_id', '7454949507506.7864240382710');
  authUrl.searchParams.append('redirect_uri', redirectUri);
  authUrl.searchParams.append('user_scope', [
    'channels:history',
    'channels:read',
    'groups:history',
    'groups:read',
    'im:history',
    'im:read',
    'mpim:history',
    'mpim:read',
    'users:read'
  ].join(','));
  
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

export const handleSlackCallback = async (code: string): Promise<boolean> => {
  try {
    const response = await fetch(`${API_URL}/slack/oauth`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ 
        code,
        redirect_uri: `${window.location.origin}/settings`
      }),
      credentials: 'include'
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const data = await response.json();
    
    if (data.success) {
      localStorage.setItem('slack_connected', 'true');
      return true;
    }
    
    return false;
  } catch (error) {
    console.error('Error connecting Slack:', error);
    return false;
  }
};

export const checkSlackConnection = async (): Promise<boolean> => {
  try {
    const response = await fetch(`${API_URL}/slack/status`, {
      credentials: 'include'
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const data = await response.json();
    return data.connected;
  } catch (error) {
    console.error('Error checking Slack connection:', error);
    return false;
  }
};