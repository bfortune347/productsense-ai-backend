import React from 'react';
import { ArrowUpRight, ArrowDownRight } from 'lucide-react';

interface MetricCardProps {
  category: string;
  score: number;
  change: number;
  color: string;
}

export const MetricCard: React.FC<MetricCardProps> = ({ category, score, change, color }) => {
  return (
    <div className="bg-white rounded-xl p-6 shadow-sm">
      <div className="flex items-center gap-2 mb-2">
        <div className={`w-2 h-2 rounded-full ${color}`} />
        <h3 className="text-gray-600 font-medium">{category}</h3>
      </div>
      <div className="flex items-end gap-3">
        <span className="text-4xl font-bold">{score}</span>
        <div className={`flex items-center ${change >= 0 ? 'text-green-500' : 'text-red-500'} text-sm mb-1`}>
          {change >= 0 ? <ArrowUpRight size={16} /> : <ArrowDownRight size={16} />}
          <span>{Math.abs(change)}%</span>
        </div>
      </div>
    </div>
  );
};