import React, { useMemo } from 'react';
import {
  ResponsiveContainer,
  ComposedChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  Scatter,
  Area
} from 'recharts';
import { WeightLog } from '../types';
import { format, parseISO } from 'date-fns';

interface ChartsProps {
  logs: WeightLog[];
  unit: string;
}

export const TrendChart: React.FC<ChartsProps> = ({ logs, unit }) => {
  const data = useMemo(() => {
    if (logs.length === 0) return [];

    // Sort logs by date
    const sorted = [...logs].sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());

    // Calculate Moving Average (Trend)
    const WINDOW_SIZE = 7;
    
    return sorted.map((log, index) => {
      // Get window of past 7 logs (or fewer if at start)
      const start = Math.max(0, index - WINDOW_SIZE + 1);
      const subset = sorted.slice(start, index + 1);
      const sum = subset.reduce((acc, curr) => acc + curr.weight, 0);
      const average = sum / subset.length;

      return {
        date: log.date,
        formattedDate: format(parseISO(log.date), 'MMM d'),
        actual: log.weight,
        trend: parseFloat(average.toFixed(1))
      };
    });
  }, [logs]);

  if (data.length < 2) {
    return (
      <div className="h-64 flex items-center justify-center bg-slate-50 rounded-xl border border-dashed border-slate-300 text-slate-400">
        Log at least 2 days to see trends!
      </div>
    );
  }

  const minWeight = Math.min(...data.map(d => d.actual)) * 0.98;
  const maxWeight = Math.max(...data.map(d => d.actual)) * 1.02;

  return (
    <div className="h-72 w-full">
      <ResponsiveContainer width="100%" height="100%">
        <ComposedChart data={data} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
          <defs>
            <linearGradient id="colorTrend" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="#6366f1" stopOpacity={0.1}/>
              <stop offset="95%" stopColor="#6366f1" stopOpacity={0}/>
            </linearGradient>
          </defs>
          <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
          <XAxis 
            dataKey="formattedDate" 
            tick={{ fontSize: 12, fill: '#64748b' }} 
            axisLine={false}
            tickLine={false}
            interval="preserveStartEnd"
          />
          <YAxis 
            reversed={true} 
            domain={[minWeight, maxWeight]} 
            tick={{ fontSize: 12, fill: '#64748b' }} 
            axisLine={false}
            tickLine={false}
            width={40}
          />
          <Tooltip 
            contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
            labelStyle={{ color: '#64748b', marginBottom: '0.25rem' }}
          />
          
          {/* Trend Area/Line */}
          <Area type="monotone" dataKey="trend" stroke="none" fill="url(#colorTrend)" />
          <Line 
            type="monotone" 
            dataKey="trend" 
            stroke="#6366f1" 
            strokeWidth={3} 
            dot={false}
            name="Trend (7-day)"
            animationDuration={1500}
          />
          
          {/* Actual Data Points */}
          <Scatter 
            dataKey="actual" 
            fill="#cbd5e1" 
            name="Actual"
            r={3}
          />
        </ComposedChart>
      </ResponsiveContainer>
    </div>
  );
};