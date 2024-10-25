import React from 'react';
import { AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts';
import type { Feedback } from '../types';

interface TrendChartProps {
  data: Feedback[];
}

export const TrendChart: React.FC<TrendChartProps> = ({ data }) => {
  const processedData = data.reduce((acc: any[], curr) => {
    const date = new Date(curr.timestamp).toLocaleDateString();
    const existing = acc.find(item => item.date === date);
    
    if (existing) {
      existing[curr.category] = (existing[curr.category] || 0) + curr.score;
    } else {
      acc.push({
        date,
        [curr.category]: curr.score
      });
    }
    return acc;
  }, []);

  return (
    <div className="bg-white rounded-xl shadow-sm p-6">
      <h2 className="text-xl font-semibold mb-4">Feedback Trends</h2>
      <div className="h-[300px]">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={processedData}>
            <XAxis dataKey="date" />
            <YAxis />
            <Tooltip />
            <Area type="monotone" dataKey="security" stackId="1" stroke="#818cf8" fill="#818cf8" fillOpacity={0.2} />
            <Area type="monotone" dataKey="reliability" stackId="1" stroke="#f87171" fill="#f87171" fillOpacity={0.2} />
            <Area type="monotone" dataKey="performance" stackId="1" stroke="#fbbf24" fill="#fbbf24" fillOpacity={0.2} />
            <Area type="monotone" dataKey="usability" stackId="1" stroke="#34d399" fill="#34d399" fillOpacity={0.2} />
            <Area type="monotone" dataKey="value" stackId="1" stroke="#60a5fa" fill="#60a5fa" fillOpacity={0.2} />
          </AreaChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
};