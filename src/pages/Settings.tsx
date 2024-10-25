import React, { useEffect, useState } from 'react';
import { Video, MessageSquare, Slack, AlertCircle } from 'lucide-react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { initiateSlackAuth, handleSlackCallback, checkSlackConnection } from '../services/slack';

interface Integration {
  id: string;
  name: string;
  description: string;
  icon: React.ReactNode;
  connected: boolean;
  onConnect: () => void;
}

export default function Settings() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const [integrationStates, setIntegrationStates] = useState({
    slack: false,
    zendesk: true,
    zoom: false
  });
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

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

  // Handle OAuth callback
  useEffect(() => {
    const code = searchParams.get('code');
    const state = searchParams.get('state');

    if (code && state) {
      const processOAuth = async () => {
        try {
          setError(null);
          setLoading(true);
          const success = await handleSlackCallback(code, state);
          if (success) {
            setIntegrationStates(prev => ({ ...prev, slack: true }));
            // Clear URL parameters after successful OAuth
            navigate('/settings', { replace: true });
          } else {
            setError('Failed to connect to Slack. Please try again.');
          }
        } catch (err) {
          setError('Failed to connect to Slack. Please try again.');
          console.error('OAuth error:', err);
        } finally {
          setLoading(false);
        }
      };

      processOAuth();
    }
  }, [searchParams, navigate]);

  const handleSlackConnect = () => {
    if (!integrationStates.slack) {
      try {
        setError(null);
        initiateSlackAuth();
      } catch (err) {
        setError('Failed to initiate Slack connection. Please try again.');
        console.error('Slack auth error:', err);
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
    </main>
  );
}