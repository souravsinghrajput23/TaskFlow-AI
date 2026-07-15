'use client';

import React, { useState, useEffect, use } from 'react';
import { ProjectService, TaskService, TeamService, AiService } from '@/services/api.service';
import { useAuth } from '@/context/AuthContext';
import { Project, Task, User, Priority, TaskStatus } from '@/types';
import {
  Sparkles,
  Search,
  Filter,
  Plus,
  Loader2,
  Calendar,
  AlertTriangle,
  Brain,
  Trash2,
  Edit,
  X,
  CheckCircle,
  HelpCircle,
  Clock,
  ArrowRight,
  TrendingUp,
  Activity as ActivityIcon
} from 'lucide-react';

interface ProjectDetailsPageProps {
  params: Promise<{ id: string }>;
}

export default function ProjectDetailsPage({ params }: ProjectDetailsPageProps) {
  const { id } = use(params);
  const { user } = useAuth();
  const isAdmin = user?.role === 'ADMIN';

  // Details States
  const [project, setProject] = useState<Project | null>(null);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [activities, setActivities] = useState<any[]>([]);
  const [projectMembers, setProjectMembers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);

  // Search & Filter States
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('ALL');
  const [priorityFilter, setPriorityFilter] = useState<string>('ALL');
  const [assigneeFilter, setAssigneeFilter] = useState<string>('ALL');

  // Modals
  const [showTaskModal, setShowTaskModal] = useState(false);
  const [editingTask, setEditingTask] = useState<Task | null>(null);
  const [showInsightsModal, setShowInsightsModal] = useState(false);

  // Task Form States
  const [taskTitle, setTaskTitle] = useState('');
  const [taskDescription, setTaskDescription] = useState('');
  const [taskPriority, setTaskPriority] = useState<Priority>('MEDIUM');
  const [taskStatus, setTaskStatus] = useState<TaskStatus>('TODO');
  const [taskDueDate, setTaskDueDate] = useState('');
  const [taskAssignedUserId, setTaskAssignedUserId] = useState('');
  const [isTaskAiGenerated, setIsTaskAiGenerated] = useState(false);

  // AI Helpers loading states
  const [aiGeneratingDescription, setAiGeneratingDescription] = useState(false);
  const [aiGeneratingSubtasks, setAiGeneratingSubtasks] = useState(false);
  const [aiSuggestingDeadline, setAiSuggestingDeadline] = useState(false);
  const [aiDeadlineSuggestion, setAiDeadlineSuggestion] = useState<{ estimatedTime: string; reason: string } | null>(null);

  // Project Insights States
  const [projectInsights, setProjectInsights] = useState<string>('');
  const [generatingInsights, setGeneratingInsights] = useState(false);

  const [savingTask, setSavingTask] = useState(false);

  const fetchProjectData = async () => {
    try {
      setLoading(true);
      const data = await ProjectService.getProjectById(id);
      setProject(data);
      setTasks(data.tasks);
      setActivities(data.activities);

      // Members list for task assignment dropdown
      const members = data.teamMembers ? data.teamMembers.map(tm => tm.user as any as User) : [];
      setProjectMembers(members);
    } catch (error) {
      console.error('Failed to load project details:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProjectData();
  }, [id]);

  const openCreateTaskModal = (initialStatus: TaskStatus = 'TODO') => {
    setEditingTask(null);
    setTaskTitle('');
    setTaskDescription('');
    setTaskPriority('MEDIUM');
    setTaskStatus(initialStatus);
    setTaskDueDate('');
    setTaskAssignedUserId('');
    setIsTaskAiGenerated(false);
    setAiDeadlineSuggestion(null);
    setShowTaskModal(true);
  };

  const openEditTaskModal = (task: Task) => {
    setEditingTask(task);
    setTaskTitle(task.title);
    setTaskDescription(task.description || '');
    setTaskPriority(task.priority);
    setTaskStatus(task.status);
    setTaskDueDate(task.dueDate ? task.dueDate.split('T')[0] : '');
    setTaskAssignedUserId(task.assignedUserId || '');
    setIsTaskAiGenerated(task.isAiGenerated);
    setAiDeadlineSuggestion(null);
    setShowTaskModal(true);
  };

  const handleSaveTask = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!taskTitle.trim()) return;

    try {
      setSavingTask(true);
      const taskPayload = {
        title: taskTitle,
        description: taskDescription,
        priority: taskPriority,
        status: taskStatus,
        dueDate: taskDueDate || null,
        assignedUserId: taskAssignedUserId || null,
        projectId: id,
        isAiGenerated: isTaskAiGenerated
      };

      if (editingTask) {
        await TaskService.updateTask(editingTask.id, taskPayload);
      } else {
        await TaskService.createTask(taskPayload);
      }

      setShowTaskModal(false);
      fetchProjectData();
    } catch (error) {
      console.error('Failed to save task:', error);
    } finally {
      setSavingTask(false);
    }
  };

  const handleDeleteTask = async (taskId: string) => {
    if (!window.confirm('Are you sure you want to delete this task?')) return;
    try {
      await TaskService.deleteTask(taskId);
      setTasks(tasks.filter(t => t.id !== taskId));
    } catch (error) {
      console.error('Failed to delete task:', error);
    }
  };

  // AI Description Helper
  const handleAiDescription = async () => {
    if (!taskTitle.trim()) {
      alert('Please enter a task title first so the AI knows what to write about!');
      return;
    }
    try {
      setAiGeneratingDescription(true);
      const aiText = await AiService.generateDescription(taskTitle);
      setTaskDescription(aiText);
      setIsTaskAiGenerated(true);
    } catch (error) {
      console.error('AI description error:', error);
    } finally {
      setAiGeneratingDescription(false);
    }
  };

  // AI Subtasks Helper
  const handleAiSubtasks = async () => {
    if (!taskTitle.trim()) {
      alert('Please enter a task title first!');
      return;
    }
    try {
      setAiGeneratingSubtasks(true);
      const subtasks = await AiService.generateSubtasks(taskTitle, taskDescription);

      const markdownSubtasks = '\n\n### Acceptance Subtasks\n' + subtasks.map(s => `- [ ] ${s}`).join('\n');
      setTaskDescription(prev => prev + markdownSubtasks);
      setIsTaskAiGenerated(true);
    } catch (error) {
      console.error('AI subtasks error:', error);
    } finally {
      setAiGeneratingSubtasks(false);
    }
  };

  // AI Deadline Estimator
  const handleAiDeadline = async () => {
    if (!taskTitle.trim()) {
      alert('Please enter a task title first!');
      return;
    }
    try {
      setAiSuggestingDeadline(true);
      const res = await AiService.suggestDeadline(taskTitle, taskDescription);
      setAiDeadlineSuggestion(res);
      setIsTaskAiGenerated(true);
    } catch (error) {
      console.error('AI deadline error:', error);
    } finally {
      setAiSuggestingDeadline(false);
    }
  };

  const applySuggestedDeadline = (estDaysStr: string) => {
    const matched = estDaysStr.match(/\d+/);
    if (!matched) return;
    const days = parseInt(matched[0]);
    if (isNaN(days)) return;

    const targetDate = new Date();
    targetDate.setDate(targetDate.getDate() + days);
    setTaskDueDate(targetDate.toISOString().split('T')[0]);
    setAiDeadlineSuggestion(null);
  };

  // AI Project Insights Helper
  const handleProjectInsights = async () => {
    try {
      setShowInsightsModal(true);
      setGeneratingInsights(true);
      const insights = await AiService.getProjectSuggestions(id);
      setProjectInsights(insights);
    } catch (error) {
      console.error('AI insights error:', error);
      setProjectInsights('Failed to fetch project insights.');
    } finally {
      setGeneratingInsights(false);
    }
  };

  // Filter logic
  const filteredTasks = tasks.filter(t => {
    const matchesSearch = t.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (t.description && t.description.toLowerCase().includes(searchQuery.toLowerCase()));

    const matchesStatus = statusFilter === 'ALL' || t.status === statusFilter;
    const matchesPriority = priorityFilter === 'ALL' || t.priority === priorityFilter;
    const matchesAssignee = assigneeFilter === 'ALL' || t.assignedUserId === assigneeFilter;

    return matchesSearch && matchesStatus && matchesPriority && matchesAssignee;
  });

  const todoTasks = filteredTasks.filter(t => t.status === 'TODO');
  const inProgressTasks = filteredTasks.filter(t => t.status === 'IN_PROGRESS');
  const completedTasks = filteredTasks.filter(t => t.status === 'COMPLETED');

  if (loading || !project) {
    return (
      <div className="flex h-[60vh] items-center justify-center">
        <Loader2 className="w-8 h-8 text-purple-500 animate-spin" />
      </div>
    );
  }

  const priorityColors = {
    LOW: 'bg-green-500/10 text-green-400 border border-green-500/20',
    MEDIUM: 'bg-blue-500/10 text-blue-400 border border-blue-500/20',
    HIGH: 'bg-red-500/10 text-red-400 border border-red-500/20',
  };

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Project Banner Info */}
      <div className="glass-panel p-6 bg-white/2 border border-white/5 flex flex-col md:flex-row md:items-center justify-between gap-6 relative overflow-hidden">
        <div className="absolute top-0 left-0 w-2 h-full" style={{ backgroundColor: project.color }}></div>
        <div className="pl-4">
          <div className="flex items-center gap-3">
            <h1 className="text-2xl font-bold text-white">{project.name}</h1>
            <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-purple-500/10 text-purple-400 border border-purple-500/20">
              {project.status}
            </span>
          </div>
          <p className="text-sm text-gray-400 mt-2 max-w-2xl">{project.description || 'No description provided.'}</p>

          <div className="flex flex-wrap gap-4 mt-4 text-xs text-gray-400">
            <span className="flex items-center gap-1.5">
              <Calendar className="w-4 h-4" />
              {project.startDate ? new Date(project.startDate).toLocaleDateString() : 'N/A'} -{' '}
              {project.deadline ? new Date(project.deadline).toLocaleDateString() : 'No deadline'}
            </span>
            <span className="flex items-center gap-1.5">
              <TrendingUp className="w-4 h-4 text-purple-400" />
              Progress: <strong className="text-white">{project.progressPercent}%</strong>
            </span>
          </div>
        </div>

        <button
          onClick={handleProjectInsights}
          className="glass-btn text-xs font-semibold shrink-0 py-2.5 flex items-center gap-2 border border-purple-500/20 self-start md:self-center"
        >
          <Brain className="w-4 h-4 text-purple-300" /> ✨ AI Insights & Recommendations
        </button>
      </div>

      {/* Filters & Board Action Control panel */}
      <div className="flex flex-wrap items-center justify-between gap-4 p-4 rounded-xl bg-white/2 border border-white/5">
        <div className="flex flex-wrap items-center gap-3 flex-1">
          {/* Search */}
          <div className="relative max-w-xs w-full">
            <Search className="absolute left-3 top-2.5 w-4 h-4 text-gray-500" />
            <input
              type="text"
              placeholder="Search tasks..."
              className="w-full pl-9 pr-4 py-2 text-xs glass-input"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>

          {/* Priority Filter */}
          <select
            className="glass-input text-xs py-2 bg-slate-900 cursor-pointer"
            value={priorityFilter}
            onChange={(e) => setPriorityFilter(e.target.value)}
          >
            <option value="ALL">All Priorities</option>
            <option value="LOW">Low</option>
            <option value="MEDIUM">Medium</option>
            <option value="HIGH">High</option>
          </select>

          {/* Assignee Filter */}
          <select
            className="glass-input text-xs py-2 bg-slate-900 cursor-pointer max-w-[150px]"
            value={assigneeFilter}
            onChange={(e) => setAssigneeFilter(e.target.value)}
          >
            <option value="ALL">All Assignees</option>
            {projectMembers.map(m => (
              <option key={m.id} value={m.id}>{m.name}</option>
            ))}
          </select>
        </div>

        <button onClick={() => openCreateTaskModal('TODO')} className="glass-btn text-xs font-semibold py-2">
          <Plus className="w-4 h-4" /> Add Task
        </button>
      </div>

      {/* Kanban Board Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* TODO Column */}
        <div className="flex flex-col h-[70vh]">
          <div className="flex items-center justify-between pb-3 border-b border-white/5 mb-4 shrink-0">
            <div className="flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-purple-400"></span>
              <h3 className="text-sm font-semibold text-white">To Do</h3>
              <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-white/5 text-gray-400">
                {todoTasks.length}
              </span>
            </div>
            <button
              onClick={() => openCreateTaskModal('TODO')}
              className="p-1 rounded text-gray-400 hover:text-white hover:bg-white/5"
            >
              <Plus className="w-4 h-4" />
            </button>
          </div>

          <div className="flex-1 overflow-y-auto space-y-3 pr-1">
            {todoTasks.map((t) => (
              <TaskCard key={t.id} task={t} onEdit={openEditTaskModal} onDelete={handleDeleteTask} />
            ))}
          </div>
        </div>

        {/* IN PROGRESS Column */}
        <div className="flex flex-col h-[70vh]">
          <div className="flex items-center justify-between pb-3 border-b border-white/5 mb-4 shrink-0">
            <div className="flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-blue-400"></span>
              <h3 className="text-sm font-semibold text-white">In Progress</h3>
              <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-white/5 text-gray-400">
                {inProgressTasks.length}
              </span>
            </div>
            <button
              onClick={() => openCreateTaskModal('IN_PROGRESS')}
              className="p-1 rounded text-gray-400 hover:text-white hover:bg-white/5"
            >
              <Plus className="w-4 h-4" />
            </button>
          </div>

          <div className="flex-1 overflow-y-auto space-y-3 pr-1">
            {inProgressTasks.map((t) => (
              <TaskCard key={t.id} task={t} onEdit={openEditTaskModal} onDelete={handleDeleteTask} />
            ))}
          </div>
        </div>

        {/* COMPLETED Column */}
        <div className="flex flex-col h-[70vh]">
          <div className="flex items-center justify-between pb-3 border-b border-white/5 mb-4 shrink-0">
            <div className="flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-400"></span>
              <h3 className="text-sm font-semibold text-white">Completed</h3>
              <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-white/5 text-gray-400">
                {completedTasks.length}
              </span>
            </div>
            <button
              onClick={() => openCreateTaskModal('COMPLETED')}
              className="p-1 rounded text-gray-400 hover:text-white hover:bg-white/5"
            >
              <Plus className="w-4 h-4" />
            </button>
          </div>

          <div className="flex-1 overflow-y-auto space-y-3 pr-1">
            {completedTasks.map((t) => (
              <TaskCard key={t.id} task={t} onEdit={openEditTaskModal} onDelete={handleDeleteTask} />
            ))}
          </div>
        </div>
      </div>

      {/* CREATE/EDIT TASK MODAL */}
      {showTaskModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="fixed inset-0 bg-black/60 backdrop-blur-sm" onClick={() => setShowTaskModal(false)}></div>
          <div className="glass-panel w-full max-w-2xl p-6 border-white/10 shadow-2xl relative z-10 animate-slide-up max-h-[92vh] overflow-y-auto">
            <button
              onClick={() => setShowTaskModal(false)}
              className="absolute top-4 right-4 text-gray-400 hover:text-white"
            >
              <X className="w-5 h-5" />
            </button>

            <h2 className="text-lg font-bold text-white mb-6">
              {editingTask ? 'Edit Task Details' : 'Create Project Task'}
            </h2>

            <form onSubmit={handleSaveTask} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-gray-300 uppercase tracking-wider mb-1.5">
                  Task Title *
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Design Login Page Layout"
                  className="w-full glass-input text-sm"
                  value={taskTitle}
                  onChange={(e) => setTaskTitle(e.target.value)}
                />
              </div>

              {/* Description & AI triggers */}
              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label className="block text-xs font-semibold text-gray-300 uppercase tracking-wider">
                    Description & Acceptance Criteria
                  </label>
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={handleAiDescription}
                      disabled={aiGeneratingDescription}
                      className="text-[10px] text-purple-400 hover:text-purple-300 font-semibold flex items-center gap-1 border border-purple-500/10 px-2 py-0.5 rounded bg-purple-500/5 transition-all"
                    >
                      {aiGeneratingDescription ? (
                        <Loader2 className="w-3 h-3 animate-spin" />
                      ) : (
                        <Sparkles className="w-3 h-3 text-purple-400" />
                      )}
                      AI Description
                    </button>
                    <button
                      type="button"
                      onClick={handleAiSubtasks}
                      disabled={aiGeneratingSubtasks}
                      className="text-[10px] text-blue-400 hover:text-blue-300 font-semibold flex items-center gap-1 border border-blue-500/10 px-2 py-0.5 rounded bg-blue-500/5 transition-all"
                    >
                      {aiGeneratingSubtasks ? (
                        <Loader2 className="w-3 h-3 animate-spin" />
                      ) : (
                        <Brain className="w-3 h-3 text-blue-400" />
                      )}
                      AI Subtasks
                    </button>
                  </div>
                </div>
                <textarea
                  placeholder="Draft details or click 'AI Description' to generate automatically using Task Title..."
                  className="w-full globals-fonts-mono glass-input text-xs h-36 resize-none"
                  value={taskDescription}
                  onChange={(e) => setTaskDescription(e.target.value)}
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {/* Priority */}
                <div>
                  <label className="block text-xs font-semibold text-gray-300 uppercase tracking-wider mb-1.5">
                    Priority
                  </label>
                  <select
                    className="w-full glass-input text-xs bg-slate-900 cursor-pointer"
                    value={taskPriority}
                    onChange={(e) => setTaskPriority(e.target.value as Priority)}
                  >
                    <option value="LOW">Low</option>
                    <option value="MEDIUM">Medium</option>
                    <option value="HIGH">High</option>
                  </select>
                </div>

                {/* Status */}
                <div>
                  <label className="block text-xs font-semibold text-gray-300 uppercase tracking-wider mb-1.5">
                    Status
                  </label>
                  <select
                    className="w-full glass-input text-xs bg-slate-900 cursor-pointer"
                    value={taskStatus}
                    onChange={(e) => setTaskStatus(e.target.value as TaskStatus)}
                  >
                    <option value="TODO">To Do</option>
                    <option value="IN_PROGRESS">In Progress</option>
                    <option value="COMPLETED">Completed</option>
                  </select>
                </div>

                {/* Assignee */}
                <div>
                  <label className="block text-xs font-semibold text-gray-300 uppercase tracking-wider mb-1.5">
                    Assign To
                  </label>
                  <select
                    className="w-full glass-input text-xs bg-slate-900 cursor-pointer"
                    value={taskAssignedUserId}
                    onChange={(e) => setTaskAssignedUserId(e.target.value)}
                  >
                    <option value="">Unassigned</option>
                    {projectMembers.map(m => (
                      <option key={m.id} value={m.id}>{m.name}</option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Due Date & AI suggested deadline estimation bubble */}
              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label className="block text-xs font-semibold text-gray-300 uppercase tracking-wider">
                    Due Date
                  </label>
                  <button
                    type="button"
                    onClick={handleAiDeadline}
                    disabled={aiSuggestingDeadline}
                    className="text-[10px] text-purple-400 hover:text-purple-300 font-semibold flex items-center gap-1 border border-purple-500/10 px-2 py-0.5 rounded bg-purple-500/5 transition-all"
                  >
                    {aiSuggestingDeadline ? (
                      <Loader2 className="w-3 h-3 animate-spin" />
                    ) : (
                      <Clock className="w-3 h-3 text-purple-400" />
                    )}
                    Suggest Deadline
                  </button>
                </div>
                <input
                  type="date"
                  className="w-full glass-input text-sm"
                  value={taskDueDate}
                  onChange={(e) => setTaskDueDate(e.target.value)}
                />

                {/* Suggestion bubble */}
                {aiDeadlineSuggestion && (
                  <div className="mt-3 p-3 rounded-lg bg-indigo-950/40 border border-indigo-500/30 text-xs animate-slide-up">
                    <div className="flex items-start justify-between gap-4">
                      <div>
                        <p className="font-semibold text-indigo-300">
                          Estimated duration: {aiDeadlineSuggestion.estimatedTime}
                        </p>
                        <p className="text-[11px] text-gray-300 mt-1 leading-normal">
                          Reasoning: {aiDeadlineSuggestion.reason}
                        </p>
                      </div>
                      <button
                        type="button"
                        onClick={() => applySuggestedDeadline(aiDeadlineSuggestion.estimatedTime)}
                        className="text-[10px] bg-purple-600 hover:bg-purple-500 text-white font-semibold py-1 px-2.5 rounded shrink-0 transition-colors"
                      >
                        Apply
                      </button>
                    </div>
                  </div>
                )}
              </div>

              <div className="flex items-center justify-end gap-3 pt-4 border-t border-white/5">
                <button
                  type="button"
                  onClick={() => setShowTaskModal(false)}
                  className="glass-btn-secondary text-xs"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={savingTask}
                  className="glass-btn text-xs font-semibold"
                >
                  {savingTask ? (
                    <>
                      <Loader2 className="w-3.5 h-3.5 animate-spin" />
                      Saving...
                    </>
                  ) : (
                    'Save Task'
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* AI PROJECT INSIGHTS RECOMMENDATIONS MODAL */}
      {showInsightsModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="fixed inset-0 bg-black/60 backdrop-blur-sm" onClick={() => setShowInsightsModal(false)}></div>
          <div className="glass-panel w-full max-w-xl p-6 border-white/10 shadow-2xl relative z-10 animate-slide-up max-h-[85vh] overflow-y-auto">
            <button
              onClick={() => setShowInsightsModal(false)}
              className="absolute top-4 right-4 text-gray-400 hover:text-white"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="flex items-center gap-2 mb-4">
              <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-purple-500 to-blue-500 flex items-center justify-center">
                <Brain className="w-4.5 h-4.5 text-white" />
              </div>
              <h2 className="text-base font-bold text-white">Project Improvement Insights</h2>
            </div>

            <div className="border-t border-white/5 pt-4">
              {generatingInsights ? (
                <div className="flex flex-col items-center justify-center py-16">
                  <Loader2 className="w-8 h-8 text-purple-500 animate-spin mb-3" />
                  <span className="text-xs text-gray-400">Analyzing project metrics & generating recommendations...</span>
                </div>
              ) : (
                <div className="prose prose-invert max-w-none text-xs text-gray-300 leading-relaxed space-y-3 font-sans">
                  {projectInsights.split('\n').map((line, idx) => {
                    if (line.startsWith('###')) {
                      return <h3 key={idx} className="text-sm font-bold text-white mt-4">{line.replace('###', '')}</h3>;
                    }
                    if (line.startsWith('-')) {
                      return <li key={idx} className="list-disc pl-2 ml-4 mt-1">{line.replace('-', '').trim()}</li>;
                    }
                    return <p key={idx} className="mt-1">{line}</p>;
                  })}
                </div>
              )}
            </div>

            <div className="flex items-center justify-end mt-6 pt-4 border-t border-white/5">
              <button
                onClick={() => setShowInsightsModal(false)}
                className="glass-btn-secondary text-xs"
              >
                Close Insights
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

/* KANBAN TASK CARD CHILD */
interface TaskCardProps {
  task: Task;
  onEdit: (t: Task) => void;
  onDelete: (id: string) => void;
}

function TaskCard({ task, onEdit, onDelete }: TaskCardProps) {
  const priorityColors = {
    LOW: 'bg-green-500/10 text-green-400 border border-green-500/20',
    MEDIUM: 'bg-blue-500/10 text-blue-400 border border-blue-500/20',
    HIGH: 'bg-red-500/10 text-red-400 border border-red-500/20',
  };

  return (
    <div className="glass-panel p-4 bg-white/2 border border-white/5 relative group hover:border-purple-500/20 transition-all duration-300 animate-fade-in">
      <div className="flex items-center justify-between mb-2">
        <span className={`text-[9px] font-bold px-2 py-0.5 rounded-full ${priorityColors[task.priority]}`}>
          {task.priority}
        </span>
        <div className="flex items-center gap-1">
          {task.isAiGenerated && (
            <span
              title="Generated by AI"
              className="p-1 rounded bg-purple-500/10 border border-purple-500/20 text-purple-400 flex items-center justify-center"
            >
              <Brain className="w-3 h-3" />
            </span>
          )}
          <div className="opacity-0 group-hover:opacity-100 transition-opacity flex items-center gap-0.5">
            <button
              onClick={() => onEdit(task)}
              className="p-1 rounded text-gray-400 hover:text-white hover:bg-white/5"
            >
              <Edit className="w-3 h-3" />
            </button>
            <button
              onClick={() => onDelete(task.id)}
              className="p-1 rounded text-gray-400 hover:text-red-400 hover:bg-red-500/5"
            >
              <Trash2 className="w-3 h-3" />
            </button>
          </div>
        </div>
      </div>

      <h4 className="text-xs font-bold text-white truncate group-hover:text-purple-300 transition-colors">
        {task.title}
      </h4>

      {task.description && (
        <p className="text-[10px] text-gray-400 line-clamp-2 mt-1.5 leading-normal">
          {task.description.replace(/###.*?\n/g, '').replace(/\[.*?\]/g, '')}
        </p>
      )}

      <div className="flex items-center justify-between mt-4 pt-3.5 border-t border-white/5 shrink-0">
        {/* Due date */}
        {task.dueDate ? (
          <span className="flex items-center gap-1 text-[9px] text-gray-400 font-medium">
            <Calendar className="w-3.5 h-3.5" />
            {new Date(task.dueDate).toLocaleDateString()}
          </span>
        ) : (
          <span className="text-[9px] text-gray-500">No deadline</span>
        )}

        {/* Assigned User circle */}
        {task.assignedUser ? (
          <div
            title={task.assignedUser.name}
            className="w-5.5 h-5.5 rounded-full bg-purple-500/25 border border-purple-400/20 flex items-center justify-center font-bold text-[8px] text-white uppercase overflow-hidden"
          >
            {task.assignedUser.photoUrl ? (
              <img src={task.assignedUser.photoUrl} alt={task.assignedUser.name} className="w-full h-full object-cover" />
            ) : (
              task.assignedUser.name.slice(0, 2)
            )}
          </div>
        ) : (
          <span className="text-[9px] text-gray-500 italic">Unassigned</span>
        )}
      </div>
    </div>
  );
}
