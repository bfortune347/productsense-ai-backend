import React from 'react';
import { MessageSquare, Video, Slack } from 'lucide-react';
import type { Feedback } from '../types';

interface FeedbackListProps {
  feedbacks: Feedback[];
}

export const FeedbackList: React.FC<FeedbackListProps> = ({ feedbacks }) => {
  const getIcon = (source: string) => {
    switch (source) {
      case 'call':
        return <Video className="w-5 h-5 text-blue-500" />;
      case 'ticket':
        return <MessageSquare className="w-5 h-5 text-red-500" />;
      case 'slack':
        return <Slack className="w-5 h-5 text-purple-500" />;
      default:
        return null;
    }
  };

  return (
    <div className="bg-white rounded-xl shadow-sm p-6">
      <h2 className="text-xl font-semibold mb-4">Recent Feedback</h2>
      <div className="space-y-4">
        {feedbacks.map((feedback) => (
          <div key={feedback.id} className="border-b pb-4 last:border-b-0 last:pb-0">
            <div className="flex items-start gap-3">
              <div className="flex-shrink-0 mt-1">
                {getIcon(feedback.source)}
              </div>
              <div>
                <p className="text-gray-800">{feedback.content}</p>
                <div className="flex gap-2 mt-2">
                  <span className="text-sm text-gray-500">{feedback.persona}</span>
                  <span className="text-sm text-gray-500">•</span>
                  <span className="text-sm text-gray-500">
                    {new Date(feedback.timestamp).toLocaleDateString()}
                  </span>
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};