import React from 'react';
import { MessageSquare, AlertCircle, Slack } from 'lucide-react';
import type { Feedback } from '../types';

interface FeedbackListProps {
  feedbacks: Feedback[];
}

export const FeedbackList: React.FC<FeedbackListProps> = ({ feedbacks }) => {
  const getIcon = (source: string) => {
    switch (source) {
      case 'call':
        return <MessageSquare className="text-blue-500" />;
      case 'ticket':
        return <AlertCircle className="text-red-500" />;
      case 'slack':
        return <Slack className="text-purple-500" />;
      default:
        return null;
    }
  };

  return (
    <div className="bg-white rounded-xl shadow-sm p-6">
      <h2 className="text-xl font-semibold mb-4">Recent Feedback</h2>
      <div className="space-y-4">
        {feedbacks.map((feedback) => (
          <div key={feedback.id} className="border-b pb-4">
            <div className="flex items-start gap-3">
              {getIcon(feedback.source)}
              <div>
                <p className="text-gray-800">{feedback.content}</p>
                <div className="flex gap-2 mt-2">
                  <span className="text-sm text-gray-500">{feedback.persona}</span>
                  <span className="text-sm text-gray-500">•</span>
                  <span className="text-sm text-gray-500">{new Date(feedback.timestamp).toLocaleDateString()}</span>
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};