'use client';

import React, { useState, useEffect } from 'react';
import { AnalyticsService, AiService } from '@/services/api.service';
import {
  FolderGit2,
  ListTodo,
  CheckCircle2,
  Clock,
  AlertTriangle,
  Brain,
  Sparkles,
  ArrowRight,
  TrendingUp,
  Activity as ActivityIcon,
  Loader2
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
  Legend
} from 'recharts';

export default function DashboardPage() {
  const [mounted, setMounted] = useState(false);
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState<any>(null);
  const [summary, setSummary] = useState<string>('');
  const [generatingSummary, setGeneratingSummary] = useState(false);

  const fetchStats = async () => {
    try {
      setLoading(true);
      const data = await AnalyticsService.getDashboardStats();
      setStats(data);
    } catch (error) {
      console.error('Failed to load dashboard metrics:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    setMounted(true);
    fetchStats();
  }, []);

  const handleGenerateSummary = async () => {
    try {
      setGeneratingSummary(true);
      const res = await AiService.getDailySummary();
      setSummary(res);
    } catch (error) {
      console.error('AI Summary failed:', error);
      setSummary('Failed to compile progress summary today. Try again later.');
    } finally {
      setGeneratingSummary(false);
    }
  };

  if (loading || !stats) {
    return (
      <div className="flex h-[60vh] items-center justify-center">
        <Loader2 className="w-8 h-8 text-purple-500 animate-spin" />
      </div>
    );
  }

  const kpis = [
    { title: 'Total Projects', value: stats.totalProjects, icon: FolderGit2, color: 'text-purple-400', bg: 'bg-purple-500/10' },
    { title: 'Total Tasks', value: stats.totalTasks, icon: ListTodo, color: 'text-blue-400', bg: 'bg-blue-500/10' },
    { title: 'Completed Tasks', value: stats.completedTasks, icon: CheckCircle2, color: 'text-emerald-400', bg: 'bg-emerald-500/10' },
    { title: 'Pending Tasks', value: stats.pendingTasks, icon: Clock, color: 'text-yellow-400', bg: 'bg-yellow-500/10' },
    { title: 'Overdue Tasks', value: stats.overdueTasks, icon: AlertTriangle, color: 'text-red-400', bg: 'bg-red-500/10' },
  ];

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Top Banner with AI Productivity */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 glass-panel p-6 bg-gradient-to-br from-purple-950/20 via-blue-950/10 to-indigo-950/20 flex flex-col justify-between border-purple-500/10 relative overflow-hidden">
          <div className="absolute right-0 top-0 w-48 h-48 bg-purple-500 rounded-full mix-blend-multiply filter blur-3xl opacity-10 -translate-y-12 translate-x-12"></div>
          <div>
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-purple-500/10 border border-purple-500/20 text-purple-300">
              <Sparkles className="w-3 h-3 text-purple-400" /> Powered by Groq LLM
            </span>
            <h1 className="text-3xl font-extrabold tracking-tight text-white mt-4">Welcome to TaskFlow AI</h1>
            <p className="text-sm text-gray-300 mt-2 max-w-md">
              Harness AI suggestions to plan tasks, estimate deadlines, and draft acceptance logs. Generate your team progress summary instantly.
            </p>
          </div>
          <div className="mt-6 flex flex-wrap gap-3">
            <button
              onClick={handleGenerateSummary}
              disabled={generatingSummary}
              className="glass-btn text-xs font-semibold px-4 py-2.5 flex items-center gap-2"
            >
              {generatingSummary ? (
                <>
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  Generating summary...
                </>
              ) : (
                <>
                  <Brain className="w-3.5 h-3.5 text-white" />
                  Generate Daily Progress Summary
                </>
              )}
            </button>
          </div>
        </div>

        {/* AI Productivity score card */}
        <div className="glass-panel p-6 flex flex-col items-center justify-center text-center relative border-blue-500/10">
          <span className="text-sm font-semibold text-gray-400 mb-2">AI Productivity Score</span>
          <div className="relative flex items-center justify-center">
            {/* Score Ring */}
            <svg className="w-32 h-32 transform -rotate-90">
              <circle
                cx="64"
                cy="64"
                r="50"
                stroke="rgba(255,255,255,0.05)"
                strokeWidth="10"
                fill="transparent"
              />
              <circle
                cx="64"
                cy="64"
                r="50"
                stroke="url(#productivityGrad)"
                strokeWidth="10"
                fill="transparent"
                strokeDasharray="314"
                strokeDashoffset={314 - (314 * stats.aiProductivityScore) / 100}
                className="transition-all duration-1000 ease-out"
              />
              <defs>
                <linearGradient id="productivityGrad" x1="0%" y1="0%" x2="100%" y2="100%">
                  <stop offset="0%" stopColor="#a855f7" />
                  <stop offset="100%" stopColor="#3b82f6" />
                </linearGradient>
              </defs>
            </svg>
            <div className="absolute text-center">
              <span className="text-3xl font-extrabold bg-gradient-to-r from-purple-400 to-blue-400 bg-clip-text text-transparent">
                {stats.aiProductivityScore}%
              </span>
            </div>
          </div>
          <span className="text-xs text-gray-300 mt-3 font-medium">
            {stats.aiProductivityScore > 80
              ? 'Excellent performance! Team is completing tasks efficiently.'
              : stats.aiProductivityScore > 50
              ? 'Good progress. Consider assigning overdue items.'
              : 'Attention needed. Redefine tasks to avoid blockers.'}
          </span>
        </div>
      </div>

      {/* AI Daily Progress summary display box */}
      {summary && (
        <div className="glass-panel p-5 border-purple-500/30 bg-purple-950/5 animate-slide-up">
          <div className="flex items-center gap-2 mb-2">
            <Brain className="w-4 h-4 text-purple-400" />
            <h4 className="text-sm font-semibold text-white">Daily AI Summary</h4>
          </div>
          <p className="text-sm text-gray-300 leading-relaxed font-sans">{summary}</p>
        </div>
      )}

      {/* KPI Cards Grid */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
        {kpis.map((kpi) => (
          <div key={kpi.title} className="glass-panel p-4 flex items-center gap-3 bg-white/2">
            <div className={`p-2.5 rounded-lg ${kpi.bg}`}>
              <kpi.icon className={`w-5 h-5 ${kpi.color}`} />
            </div>
            <div>
              <span className="text-[10px] uppercase font-bold tracking-wider text-gray-400 block">{kpi.title}</span>
              <span className="text-xl font-bold text-white mt-0.5 block">{kpi.value}</span>
            </div>
          </div>
        ))}
      </div>

      {/* Charts Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Weekly Progress Bar Chart */}
        <div className="glass-panel p-6 flex flex-col justify-between">
          <div className="flex items-center justify-between pb-4 border-b border-white/5 mb-4">
            <span className="text-sm font-semibold text-white">Weekly Completed vs Created Tasks</span>
            <TrendingUp className="w-4 h-4 text-blue-400" />
          </div>
          <div className="h-64 w-full">
            {mounted && (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={stats.weeklyProgress}>
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
                  <Bar dataKey="completed" name="Completed" fill="#34d399" radius={[4, 4, 0, 0]} />
                  <Bar dataKey="created" name="Created" fill="#8b5cf6" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            )}
          </div>
        </div>

        {/* Tasks by Status Pie Chart */}
        <div className="glass-panel p-6 flex flex-col justify-between">
          <div className="flex items-center justify-between pb-4 border-b border-white/5 mb-4">
            <span className="text-sm font-semibold text-white">Tasks by Status</span>
            <ListTodo className="w-4 h-4 text-purple-400" />
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 items-center">
            <div className="h-48 md:col-span-2 w-full">
              {mounted && (
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={stats.tasksByStatus}
                      cx="50%"
                      cy="50%"
                      innerRadius={50}
                      outerRadius={70}
                      paddingAngle={3}
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
            {/* Status Legend */}
            <div className="space-y-3">
              {stats.tasksByStatus.map((status: any) => (
                <div key={status.name} className="flex items-center gap-2 text-xs">
                  <span className="w-3 h-3 rounded-full shrink-0" style={{ backgroundColor: status.color }}></span>
                  <span className="text-gray-300 font-medium">{status.name}</span>
                  <span className="text-gray-400 font-bold ml-auto">{status.value}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Deadlines & Activity feed Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Upcoming Deadlines */}
        <div className="glass-panel p-6 flex flex-col">
          <h3 className="text-sm font-semibold text-white pb-3 border-b border-white/5 mb-4">Upcoming Deadlines</h3>
          <div className="space-y-3.5 flex-1 overflow-y-auto max-h-80">
            {stats.upcomingDeadlines.length === 0 ? (
              <div className="text-center py-12 text-sm text-gray-400">
                No upcoming task deadlines
              </div>
            ) : (
              stats.upcomingDeadlines.map((task: any) => (
                <div key={task.id} className="flex items-center justify-between p-3 rounded-xl bg-white/2 border border-white/5">
                  <div className="flex items-center gap-3 overflow-hidden">
                    <span
                      className="w-2.5 h-2.5 rounded-full shrink-0"
                      style={{ backgroundColor: task.project.color }}
                    ></span>
                    <div className="overflow-hidden">
                      <h4 className="text-xs font-semibold text-white truncate">{task.title}</h4>
                      <span className="text-[10px] text-gray-400 truncate block mt-0.5">{task.project.name}</span>
                    </div>
                  </div>
                  <div className="text-right shrink-0">
                    <span className="text-xs text-yellow-400 font-medium px-2 py-0.5 rounded-md bg-yellow-500/10 border border-yellow-500/20">
                      {new Date(task.dueDate).toLocaleDateString()}
                    </span>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Recent Activities */}
        <div className="glass-panel p-6 flex flex-col">
          <div className="flex items-center justify-between pb-3 border-b border-white/5 mb-4">
            <h3 className="text-sm font-semibold text-white">Recent Activities</h3>
            <ActivityIcon className="w-4 h-4 text-purple-400" />
          </div>
          <div className="space-y-4 flex-1 overflow-y-auto max-h-80">
            {stats.recentActivities.length === 0 ? (
              <div className="text-center py-12 text-sm text-gray-400">
                No recent activity logged
              </div>
            ) : (
              stats.recentActivities.map((act: any) => (
                <div key={act.id} className="flex items-start gap-3">
                  <div className="w-7 h-7 rounded-full bg-purple-500/20 flex items-center justify-center font-bold text-xs uppercase text-purple-300 mt-0.5 border border-purple-500/10">
                    {act.user?.name.slice(0, 1) || 'S'}
                  </div>
                  <div>
                    <p className="text-xs text-gray-300">
                      <span className="font-semibold text-white">{act.user?.name || 'System'}</span>{' '}
                      {act.description}
                    </p>
                    <span className="text-[10px] text-gray-500 mt-1 block">
                      {new Date(act.createdAt).toLocaleString()}
                    </span>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
