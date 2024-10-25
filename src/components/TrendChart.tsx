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
      existing.total = (existing.total || 0) + curr.score;
    } else {
      acc.push({
        date,
        [curr.category]: curr.score,
        total: curr.score
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
            <defs>
              <linearGradient id="colorSecurity" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#818cf8" stopOpacity={0.1}/>
                <stop offset="95%" stopColor="#818cf8" stopOpacity={0}/>
              </linearGradient>
              <linearGradient id="colorReliability" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#f87171" stopOpacity={0.1}/>
                <stop offset="95%" stopColor="#f87171" stopOpacity={0}/>
              </linearGradient>
              <linearGradient id="colorPerformance" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#fbbf24" stopOpacity={0.1}/>
                <stop offset="95%" stopColor="#fbbf24" stopOpacity={0}/>
              </linearGradient>
            </defs>
            <XAxis 
              dataKey="date" 
              tick={{ fill: '#6b7280', fontSize: 12 }}
              tickLine={{ stroke: '#e5e7eb' }}
            />
            <YAxis 
              tick={{ fill: '#6b7280', fontSize: 12 }}
              tickLine={{ stroke: '#e5e7eb' }}
            />
            <Tooltip />
            <Area 
              type="monotone" 
              dataKey="security" 
              stroke="#818cf8" 
              fill="url(#colorSecurity)"
              strokeWidth={2}
            />
            <Area 
              type="monotone" 
              dataKey="reliability" 
              stroke="#f87171" 
              fill="url(#colorReliability)"
              strokeWidth={2}
            />
            <Area 
              type="monotone" 
              dataKey="performance" 
              stroke="#fbbf24" 
              fill="url(#colorPerformance)"
              strokeWidth={2}
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
};