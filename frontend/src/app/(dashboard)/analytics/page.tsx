'use client';

import React, { useState, useEffect } from 'react';
import { AnalyticsService } from '@/services/api.service';
import {
  TrendingUp,
  Clock,
  AlertTriangle,
  Loader2,
  Calendar,
  CheckCircle2,
  PieChart as PieIcon,
  BarChart as BarIcon,
  LineChart as LineIcon
} from 'lucide-react';
import {
  PieChart,
  Pie,
  Cell,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  LineChart,
  Line,
  Legend,
  CartesianGrid
} from 'recharts';

export default function AnalyticsPage() {
  const [mounted, setMounted] = useState(false);
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState<any>(null);

  useEffect(() => {
    setMounted(true);
    const fetchAnalytics = async () => {
      try {
        const data = await AnalyticsService.getDashboardStats();
        setStats(data);
      } catch (error) {
        console.error('Failed to load analytics:', error);
      } finally {
        setLoading(false);
      }
    };
    fetchAnalytics();
  }, []);

  if (loading || !stats) {
    return (
      <div className="flex h-[60vh] items-center justify-center">
        <Loader2 className="w-8 h-8 text-purple-500 animate-spin" />
      </div>
    );
  }

  // Calculate completion rate
  const totalTasks = stats.totalTasks;
  const completedTasks = stats.completedTasks;
  const completionRate = totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0;

  const cards = [
    { title: 'Task Completion Rate', value: `${completionRate}%`, subText: `${completedTasks} of ${totalTasks} tasks completed`, icon: CheckCircle2, color: 'text-emerald-400', bg: 'bg-emerald-500/10' },
    { title: 'Pending Backlog', value: stats.pendingTasks, subText: 'Tasks active in sprint', icon: Clock, color: 'text-yellow-400', bg: 'bg-yellow-500/10' },
    { title: 'Overdue Bottlenecks', value: stats.overdueTasks, subText: 'Missed target due dates', icon: AlertTriangle, color: 'text-red-400', bg: 'bg-red-500/10' },
  ];

  return (
    <div className="space-y-6 animate-fade-in">
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-white">Analytics</h1>
        <p className="text-sm text-gray-400">View team velocity metrics and project delivery reports.</p>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {cards.map((card) => (
          <div key={card.title} className="glass-panel p-5 flex items-center justify-between bg-white/2">
            <div>
              <span className="text-xs text-gray-400 font-semibold block">{card.title}</span>
              <span className="text-3xl font-extrabold text-white mt-2 block">{card.value}</span>
              <span className="text-[10px] text-gray-400 mt-1 block">{card.subText}</span>
            </div>
            <div className={`p-3 rounded-xl shrink-0 ${card.bg}`}>
              <card.icon className={`w-6 h-6 ${card.color}`} />
            </div>
          </div>
        ))}
      </div>

      {/* Charts Panel Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Weekly Completion Progress */}
        <div className="lg:col-span-2 glass-panel p-6 flex flex-col justify-between">
          <div className="flex items-center justify-between pb-4 border-b border-white/5 mb-6">
            <span className="text-sm font-semibold text-white flex items-center gap-2">
              <BarIcon className="w-4.5 h-4.5 text-purple-400" /> Weekly Velocity Chart
            </span>
            <TrendingUp className="w-4 h-4 text-emerald-400" />
          </div>
          <div className="h-72 w-full">
            {mounted && (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={stats.weeklyProgress}>
                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" vertical={false} />
                  <XAxis dataKey="day" stroke="#6b7280" fontSize={11} tickLine={false} />
                  <YAxis stroke="#6b7280" fontSize={11} tickLine={false} />
                  <Tooltip
                    contentStyle={{
                      background: 'rgba(15,12,35,0.95)',
                      border: '1px solid rgba(255,255,255,0.1)',
                      borderRadius: '8px',
                    }}
                  />
                  <Legend fontSize={10} wrapperStyle={{ paddingTop: 10 }} />
                  <Bar name="Tasks Completed" dataKey="completed" fill="#34D399" radius={[4, 4, 0, 0]} />
                  <Bar name="Tasks Created" dataKey="created" fill="#8B5CF6" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            )}
          </div>
        </div>

        {/* Tasks by status Pie Chart */}
        <div className="glass-panel p-6 flex flex-col justify-between">
          <div className="flex items-center justify-between pb-4 border-b border-white/5 mb-6">
            <span className="text-sm font-semibold text-white flex items-center gap-2">
              <PieIcon className="w-4.5 h-4.5 text-blue-400" /> Tasks Status Breakdown
            </span>
          </div>
          <div className="h-56 w-full flex items-center justify-center">
            {mounted && (
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={stats.tasksByStatus}
                    cx="50%"
                    cy="50%"
                    innerRadius={55}
                    outerRadius={75}
                    paddingAngle={4}
                    dataKey="value"
                  >
                    {stats.tasksByStatus.map((entry: any, index: number) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip
                    contentStyle={{
                      background: 'rgba(15,12,35,0.95)',
                      border: '1px solid rgba(255,255,255,0.1)',
                      borderRadius: '8px',
                    }}
                  />
                </PieChart>
              </ResponsiveContainer>
            )}
          </div>
          <div className="space-y-2 mt-4 pt-3 border-t border-white/5">
            {stats.tasksByStatus.map((item: any) => (
              <div key={item.name} className="flex items-center justify-between text-xs">
                <div className="flex items-center gap-2">
                  <span className="w-2.5 h-2.5 rounded-full shrink-0" style={{ backgroundColor: item.color }}></span>
                  <span className="text-gray-300">{item.name}</span>
                </div>
                <span className="text-white font-bold">{item.value}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Completed Tasks Trend Line Chart */}
      <div className="glass-panel p-6 flex flex-col justify-between">
        <div className="flex items-center justify-between pb-4 border-b border-white/5 mb-6">
          <span className="text-sm font-semibold text-white flex items-center gap-2">
            <LineIcon className="w-4.5 h-4.5 text-emerald-400" /> Completed Tasks Delivery Trend
          </span>
          <Calendar className="w-4 h-4 text-purple-400" />
        </div>
        <div className="h-64 w-full">
          {mounted && (
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={stats.weeklyProgress}>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
                <XAxis dataKey="day" stroke="#6b7280" fontSize={11} tickLine={false} />
                <YAxis stroke="#6b7280" fontSize={11} tickLine={false} />
                <Tooltip
                  contentStyle={{
                    background: 'rgba(15,12,35,0.95)',
                    border: '1px solid rgba(255,255,255,0.1)',
                    borderRadius: '8px',
                  }}
                />
                <Legend fontSize={10} wrapperStyle={{ paddingTop: 10 }} />
                <Line
                  name="Tasks Completed"
                  type="monotone"
                  dataKey="completed"
                  stroke="#34d399"
                  strokeWidth={2.5}
                  dot={{ r: 4, strokeWidth: 1.5, fill: '#090714' }}
                  activeDot={{ r: 6 }}
                />
              </LineChart>
            </ResponsiveContainer>
          )}
        </div>
      </div>
    </div>
  );
}
