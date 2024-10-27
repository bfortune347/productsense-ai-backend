import React, { useEffect, useState } from 'react';
import { Video, MessageSquare, Slack, AlertCircle } from 'lucide-react';
import { initiateSlackAuth, checkSlackConnection } from '../services/slack';

interface Token {
  id: number;
  provider: string;
  team_id: string;
  user_id: string;
  created_at: string;
  expires_at: string;
}

interface Integration {
  id: string;
  name: string;
  description: string;
  icon: React.ReactNode;
  connected: boolean;
  onConnect: () => void;
}

export default function Settings() {
  const [integrationStates, setIntegrationStates] = useState({
    slack: false,
    zendesk: true,
    zoom: false
  });
  const [tokens, setTokens] = useState<Token[]>([]);
  const [dbStatus, setDbStatus] = useState<string>('unknown');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  // Test database connection on load
  useEffect(() => {
    const testDatabase = async () => {
      try {
        console.log('Testing database connection...');
        const response = await fetch('https://productsense-ai-backend.onrender.com/api/tokens/test', {
          headers: {
            'Accept': 'application/json',
            'Content-Type': 'application/json',
          },
        });
        
        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }
        
        const data = await response.json();
        console.log('Database response:', data);
        
        if (data.success) {
          setTokens(data.tokens);
          setDbStatus('connected');
          console.log('Database test successful:', data);
        } else {
          setDbStatus('error');
          setError(data.error || 'Database test failed');
        }
      } catch (err) {
        console.error('Database test error:', err);
        setDbStatus('error');
        setError(err instanceof Error ? err.message : 'Failed to connect to database');
      }
    };

    testDatabase();
  }, []);

  // Check initial connection status
  useEffect(() => {
    const checkConnections = async () => {
      try {
        setLoading(true);
        setError(null);
        const connected = await checkSlackConnection();
        setIntegrationStates(prev => ({ ...prev, slack: connected }));
      } catch (err) {
        setError('Failed to check integration status. Please try again later.');
        console.error('Error checking connections:', err);
      } finally {
        setLoading(false);
      }
    };

    checkConnections();
  }, []);

  const handleSlackConnect = async () => {
    if (!integrationStates.slack) {
      try {
        setError(null);
        setLoading(true);
        
        // Initiate OAuth flow
        const result = await initiateSlackAuth();
        
        if (result.success) {
          setIntegrationStates(prev => ({ ...prev, slack: true }));
          // Refresh tokens list
          const response = await fetch('https://productsense-ai-backend.onrender.com/api/tokens/test');
          const data = await response.json();
          if (data.success) {
            setTokens(data.tokens);
          }
        }
      } catch (err) {
        setError('Failed to connect to Slack. Please try again.');
        console.error('Slack auth error:', err);
      } finally {
        setLoading(false);
      }
    }
  };

  const integrations: Integration[] = [
    {
      id: 'zoom',
      name: 'Zoom',
      description: 'Analyze customer calls and meetings automatically',
      icon: <Video className="w-8 h-8 text-blue-500" />,
      connected: integrationStates.zoom,
      onConnect: () => {}
    },
    {
      id: 'zendesk',
      name: 'Zendesk',
      description: 'Import and analyze support ticket conversations',
      icon: <MessageSquare className="w-8 h-8 text-green-500" />,
      connected: integrationStates.zendesk,
      onConnect: () => {}
    },
    {
      id: 'slack',
      name: 'Slack',
      description: 'Monitor customer feedback channels in real-time',
      icon: <Slack className="w-8 h-8 text-purple-500" />,
      connected: integrationStates.slack,
      onConnect: handleSlackConnect
    }
  ];

  return (
    <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="mb-8">
        <h2 className="text-2xl font-bold text-gray-900">Settings</h2>
        <p className="mt-1 text-gray-500">Manage your integrations and preferences</p>
        <p className="mt-1 text-sm text-gray-500">Database Status: {dbStatus}</p>
      </div>

      {error && (
        <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg flex items-center gap-3 text-red-700">
          <AlertCircle className="w-5 h-5 flex-shrink-0" />
          <p>{error}</p>
        </div>
      )}

      <div className="bg-white rounded-xl shadow-sm">
        <div className="px-6 py-5 border-b">
          <h3 className="text-lg font-medium text-gray-900">Integrations</h3>
        </div>
        {loading ? (
          <div className="px-6 py-8 text-center text-gray-500">
            Loading integrations...
          </div>
        ) : (
          <div className="divide-y">
            {integrations.map((integration) => (
              <div key={integration.id} className="px-6 py-5 flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <div className="flex-shrink-0">
                    {integration.icon}
                  </div>
                  <div>
                    <h4 className="text-base font-medium text-gray-900">{integration.name}</h4>
                    <p className="text-sm text-gray-500">{integration.description}</p>
                  </div>
                </div>
                <button
                  onClick={integration.onConnect}
                  className={`btn ${
                    integration.connected
                      ? 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                      : 'btn-primary'
                  }`}
                  disabled={loading}
                >
                  {integration.connected ? 'Connected' : 'Connect'}
                </button>
              </div>
            ))}
          </div>
        )}
      </div>

      {tokens.length > 0 && (
        <div className="mt-8 bg-white rounded-xl shadow-sm">
          <div className="px-6 py-5 border-b">
            <h3 className="text-lg font-medium text-gray-900">Active Tokens</h3>
          </div>
          <div className="p-6">
            <div className="space-y-4">
              {tokens.map((token) => (
                <div key={token.id} className="flex justify-between items-center">
                  <div>
                    <p className="font-medium">{token.provider}</p>
                    <p className="text-sm text-gray-500">Team: {token.team_id}</p>
                    <p className="text-sm text-gray-500">User: {token.user_id}</p>
                  </div>
                  <div className="text-sm text-gray-500">
                    <p>Created: {new Date(token.created_at).toLocaleDateString()}</p>
                    <p>Expires: {new Date(token.expires_at).toLocaleDateString()}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </main>
  );
}