import React, { useEffect, useState } from 'react';
import { Video, MessageSquare, Slack } from 'lucide-react';
import { useSearchParams } from 'react-router-dom';
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
  const [integrationStates, setIntegrationStates] = useState({
    slack: false,
    zendesk: true,
    zoom: false
  });

  // Check initial connection status
  useEffect(() => {
    checkSlackConnection().then(connected => {
      setIntegrationStates(prev => ({ ...prev, slack: connected }));
    });
  }, []);

  // Listen for Slack auth success message
  useEffect(() => {
    const handleAuthSuccess = (event: MessageEvent) => {
      if (event.origin !== window.location.origin) return;
      if (event.data.type === 'SLACK_AUTH_SUCCESS') {
        setIntegrationStates(prev => ({ ...prev, slack: true }));
      }
    };

    window.addEventListener('message', handleAuthSuccess);
    return () => window.removeEventListener('message', handleAuthSuccess);
  }, []);

  // Handle OAuth callback
  useEffect(() => {
    const code = searchParams.get('code');
    if (code) {
      handleSlackCallback(code).then((success) => {
        if (success) {
          setIntegrationStates(prev => ({ ...prev, slack: true }));
        }
      });
    }
  }, [searchParams]);

  const handleSlackConnect = () => {
    if (!integrationStates.slack) {
      initiateSlackAuth();
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

      <div className="bg-white rounded-xl shadow-sm">
        <div className="px-6 py-5 border-b">
          <h3 className="text-lg font-medium text-gray-900">Integrations</h3>
        </div>
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
              >
                {integration.connected ? 'Connected' : 'Connect'}
              </button>
            </div>
          ))}
        </div>
      </div>
    </main>
  );
}