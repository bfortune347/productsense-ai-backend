export interface Feedback {
  id: string;
  source: 'call' | 'ticket' | 'slack';
  content: string;
  sentiment: 'positive' | 'negative' | 'neutral';
  category: 'security' | 'reliability' | 'performance' | 'usability' | 'value';
  timestamp: string;
  persona: string;
  score: number;
}

export interface MetricCard {
  category: string;
  score: number;
  change: number;
  color: string;
}