import React, { useState } from 'react';
import { ChevronDown } from 'lucide-react';
import { MetricCard } from '../components/MetricCard';
import { FeedbackList } from '../components/FeedbackList';
import { TrendChart } from '../components/TrendChart';
import type { Feedback, MetricCard as MetricCardType } from '../types';

const mockMetrics: MetricCardType[] = [
  { category: 'Security', score: 90, change: 12, color: 'bg-indigo-400' },
  { category: 'Reliability', score: 29, change: -25, color: 'bg-red-400' },
  { category: 'Performance', score: 66, change: -1, color: 'bg-yellow-400' },
  { category: 'Usability', score: 64, change: 12, color: 'bg-emerald-400' },
  { category: 'Value', score: 81, change: 0, color: 'bg-blue-400' }
];

const mockFeedback: Feedback[] = [
  {
    id: '1',
    source: 'call',
    content: 'The security features are impressive but the UI needs work.',
    sentiment: 'positive',
    category: 'security',
    timestamp: '2024-02-26T10:00:00Z',
    persona: 'Enterprise CTO',
    score: 85
  },
  {
    id: '2',
    source: 'ticket',
    content: 'System was down for 2 hours today. This is unacceptable.',
    sentiment: 'negative',
    category: 'reliability',
    timestamp: '2024-02-26T11:30:00Z',
    persona: 'Product Manager',
    score: 20
  },
  {
    id: '3',
    source: 'slack',
    content: 'Love the new analytics dashboard!',
    sentiment: 'positive',
    category: 'usability',
    timestamp: '2024-02-26T14:15:00Z',
    persona: 'Data Analyst',
    score: 95
  }
];

export default function Dashboard() {
  const [timeRange] = useState('Last 7 days');

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Dashboard Overview</h1>
          <p className="mt-1 text-sm text-gray-500">Track and analyze customer feedback across all channels</p>
        </div>
        <button className="flex items-center gap-2 px-4 py-2 bg-white border rounded-lg text-sm text-gray-600 hover:bg-gray-50 shadow-sm">
          {timeRange}
          <ChevronDown className="w-4 h-4" />
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-5 gap-4 mb-8">
        {mockMetrics.map((metric) => (
          <MetricCard key={metric.category} {...metric} />
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <TrendChart data={mockFeedback} />
        <FeedbackList feedbacks={mockFeedback} />
      </div>
    </div>
  );
}