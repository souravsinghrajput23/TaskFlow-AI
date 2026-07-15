'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { ProjectService, TeamService } from '@/services/api.service';
import { useAuth } from '@/context/AuthContext';
import { Project, User, Priority, ProjectStatus } from '@/types';
import {
  Plus,
  FolderKanban,
  Calendar,
  AlertCircle,
  Trash2,
  Edit,
  Loader2,
  X,
  UserPlus
} from 'lucide-react';

export default function ProjectsPage() {
  const { user } = useAuth();
  const isAdmin = user?.role === 'ADMIN';

  const [projects, setProjects] = useState<Project[]>([]);
  const [teamMembers, setTeamMembers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);

  // Modal States
  const [showModal, setShowModal] = useState(false);
  const [editingProject, setEditingProject] = useState<Project | null>(null);

  // Form Fields State
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [priority, setPriority] = useState<Priority>('MEDIUM');
  const [startDate, setStartDate] = useState('');
  const [deadline, setDeadline] = useState('');
  const [status, setStatus] = useState<ProjectStatus>('ACTIVE');
  const [color, setColor] = useState('#8B5CF6');
  const [assignedMembers, setAssignedMembers] = useState<string[]>([]);

  const [saving, setSaving] = useState(false);

  const fetchProjects = async () => {
    try {
      setLoading(true);
      const data = await ProjectService.getProjects();
      setProjects(data);
    } catch (error) {
      console.error('Failed to fetch projects:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchTeam = async () => {
    if (!isAdmin) return;
    try {
      const data = await TeamService.getTeamMembers();
      setTeamMembers(data);
    } catch (error) {
      console.error('Failed to fetch team members:', error);
    }
  };

  useEffect(() => {
    fetchProjects();
    fetchTeam();
  }, []);

  const openCreateModal = () => {
    setEditingProject(null);
    setName('');
    setDescription('');
    setPriority('MEDIUM');
    setStartDate('');
    setDeadline('');
    setStatus('ACTIVE');
    setColor('#8B5CF6');
    setAssignedMembers([]);
    setShowModal(true);
  };

  const openEditModal = (p: Project) => {
    setEditingProject(p);
    setName(p.name);
    setDescription(p.description || '');
    setPriority(p.priority);
    setStartDate(p.startDate ? p.startDate.split('T')[0] : '');
    setDeadline(p.deadline ? p.deadline.split('T')[0] : '');
    setStatus(p.status);
    setColor(p.color);
    setAssignedMembers(p.teamMembers ? p.teamMembers.map(tm => tm.userId) : []);
    setShowModal(true);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;

    try {
      setSaving(true);
      const projectPayload = {
        name,
        description,
        priority,
        startDate: startDate || undefined,
        deadline: deadline || undefined,
        status,
        color,
        assignedMembers
      };

      if (editingProject) {
        await ProjectService.updateProject(editingProject.id, projectPayload);
      } else {
        await ProjectService.createProject(projectPayload);
      }

      setShowModal(false);
      fetchProjects();
    } catch (error) {
      console.error('Failed to save project:', error);
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!window.confirm('Are you sure you want to delete this project? All associated tasks will be permanently removed.')) {
      return;
    }

    try {
      await ProjectService.deleteProject(id);
      setProjects(projects.filter(p => p.id !== id));
    } catch (error) {
      console.error('Failed to delete project:', error);
    }
  };

  const toggleMemberSelection = (userId: string) => {
    setAssignedMembers(prev =>
      prev.includes(userId) ? prev.filter(id => id !== userId) : [...prev, userId]
    );
  };

  if (loading) {
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

  const statusColors = {
    ACTIVE: 'bg-purple-500/10 text-purple-400 border border-purple-500/20',
    COMPLETED: 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20',
    ARCHIVED: 'bg-gray-500/10 text-gray-400 border border-gray-500/20',
  };

  const colorPresets = ['#8B5CF6', '#3B82F6', '#EF4444', '#10B981', '#F59E0B', '#EC4899', '#14B8A6'];

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header section */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-white">Projects</h1>
          <p className="text-sm text-gray-400">View and manage workspace projects.</p>
        </div>
        {isAdmin && (
          <button onClick={openCreateModal} className="glass-btn text-xs font-semibold py-2.5">
            <Plus className="w-4 h-4" /> Create Project
          </button>
        )}
      </div>

      {projects.length === 0 ? (
        <div className="glass-panel p-12 text-center flex flex-col items-center justify-center">
          <FolderKanban className="w-12 h-12 text-gray-500 mb-3" />
          <h3 className="text-lg font-semibold text-white">No Projects Found</h3>
          <p className="text-sm text-gray-400 max-w-sm mt-1">
            {isAdmin
              ? 'Get started by creating your first project container.'
              : 'You are not assigned to any projects currently.'}
          </p>
          {isAdmin && (
            <button onClick={openCreateModal} className="glass-btn text-xs font-semibold py-2.5 mt-4">
              <Plus className="w-4 h-4" /> Create Project
            </button>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {projects.map((p) => (
            <div key={p.id} className="glass-panel p-5 bg-white/2 border border-white/5 flex flex-col justify-between relative overflow-hidden group">
              {/* Colored Side Bar Accent */}
              <div className="absolute top-0 left-0 w-1.5 h-full" style={{ backgroundColor: p.color }}></div>

              <div className="pl-2">
                <div className="flex items-center justify-between mb-3">
                  <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${priorityColors[p.priority]}`}>
                    {p.priority}
                  </span>
                  <div className="flex items-center gap-1.5">
                    <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${statusColors[p.status]}`}>
                      {p.status}
                    </span>
                    {isAdmin && (
                      <div className="opacity-0 group-hover:opacity-100 transition-opacity flex items-center gap-1">
                        <button
                          onClick={() => openEditModal(p)}
                          className="p-1 rounded text-gray-400 hover:text-white hover:bg-white/5"
                        >
                          <Edit className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() => handleDelete(p.id)}
                          className="p-1 rounded text-gray-400 hover:text-red-400 hover:bg-red-500/5"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    )}
                  </div>
                </div>

                <Link href={`/projects/${p.id}`} className="block hover:underline">
                  <h3 className="text-base font-bold text-white truncate">{p.name}</h3>
                </Link>
                <p className="text-xs text-gray-400 line-clamp-2 mt-2 leading-relaxed h-8">
                  {p.description || 'No description provided.'}
                </p>

                {/* Date Fields */}
                <div className="flex items-center gap-2 mt-4 text-[10px] text-gray-400">
                  <Calendar className="w-3.5 h-3.5" />
                  <span>
                    {p.startDate ? new Date(p.startDate).toLocaleDateString() : 'N/A'} -{' '}
                    {p.deadline ? new Date(p.deadline).toLocaleDateString() : 'No deadline'}
                  </span>
                </div>

                {/* Progress bar */}
                <div className="mt-4 pt-4 border-t border-white/5">
                  <div className="flex items-center justify-between text-xs text-gray-400 mb-1">
                    <span>Task Progress</span>
                    <span className="font-semibold text-white">{p.progressPercent}%</span>
                  </div>
                  <div className="w-full bg-white/5 rounded-full h-1.5 overflow-hidden">
                    <div
                      className="h-full rounded-full transition-all duration-500"
                      style={{ width: `${p.progressPercent}%`, backgroundColor: p.color }}
                    ></div>
                  </div>
                </div>

                {/* Assignees avatars list */}
                <div className="flex items-center justify-between mt-5 pt-3 border-t border-white/5">
                  <span className="text-[10px] text-gray-400 uppercase font-bold tracking-wider">
                    {p.teamMembers ? p.teamMembers.length : 0} members
                  </span>
                  <div className="flex -space-x-2">
                    {p.teamMembers?.slice(0, 4).map((tm) => (
                      <div
                        key={tm.id}
                        title={tm.user.name}
                        className="w-6.5 h-6.5 rounded-full bg-slate-800 border-2 border-slate-900 flex items-center justify-center font-bold text-[9px] text-white uppercase overflow-hidden"
                      >
                        {tm.user.photoUrl ? (
                          <img src={tm.user.photoUrl} alt={tm.user.name} className="w-full h-full object-cover" />
                        ) : (
                          tm.user.name.slice(0, 2)
                        )}
                      </div>
                    ))}
                    {p.teamMembers && p.teamMembers.length > 4 && (
                      <div className="w-6.5 h-6.5 rounded-full bg-slate-800 border-2 border-slate-900 flex items-center justify-center font-bold text-[9px] text-purple-300">
                        +{p.teamMembers.length - 4}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* CREATE/EDIT MODAL OVERLAY */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="fixed inset-0 bg-black/60 backdrop-blur-sm" onClick={() => setShowModal(false)}></div>
          <div className="glass-panel w-full max-w-xl p-6 border-white/10 shadow-2xl relative z-10 animate-slide-up max-h-[90vh] overflow-y-auto">
            <button
              onClick={() => setShowModal(false)}
              className="absolute top-4 right-4 text-gray-400 hover:text-white"
            >
              <X className="w-5 h-5" />
            </button>

            <h2 className="text-xl font-bold text-white mb-6">
              {editingProject ? 'Edit Project Details' : 'Create New Project'}
            </h2>

            <form onSubmit={handleSave} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-gray-300 uppercase tracking-wider mb-1.5">
                  Project Name *
                </label>
                <input
                  type="text"
                  required
                  placeholder="TaskFlow AI Mobile"
                  className="w-full glass-input text-sm"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-300 uppercase tracking-wider mb-1.5">
                  Description
                </label>
                <textarea
                  placeholder="Summarize the project goals, scopes..."
                  className="w-full glass-input text-sm h-20 resize-none"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-gray-300 uppercase tracking-wider mb-1.5">
                    Priority
                  </label>
                  <select
                    className="w-full glass-input text-sm bg-slate-900"
                    value={priority}
                    onChange={(e) => setPriority(e.target.value as Priority)}
                  >
                    <option value="LOW">Low</option>
                    <option value="MEDIUM">Medium</option>
                    <option value="HIGH">High</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-gray-300 uppercase tracking-wider mb-1.5">
                    Project Status
                  </label>
                  <select
                    className="w-full glass-input text-sm bg-slate-900"
                    value={status}
                    onChange={(e) => setStatus(e.target.value as ProjectStatus)}
                  >
                    <option value="ACTIVE">Active</option>
                    <option value="COMPLETED">Completed</option>
                    <option value="ARCHIVED">Archived</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-gray-300 uppercase tracking-wider mb-1.5">
                    Start Date
                  </label>
                  <input
                    type="date"
                    className="w-full glass-input text-sm"
                    value={startDate}
                    onChange={(e) => setStartDate(e.target.value)}
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-gray-300 uppercase tracking-wider mb-1.5">
                    Deadline Date
                  </label>
                  <input
                    type="date"
                    className="w-full glass-input text-sm"
                    value={deadline}
                    onChange={(e) => setDeadline(e.target.value)}
                  />
                </div>
              </div>

              {/* Color Selector */}
              <div>
                <label className="block text-xs font-semibold text-gray-300 uppercase tracking-wider mb-2">
                  Theme Color (Visual Accent)
                </label>
                <div className="flex items-center gap-3">
                  {colorPresets.map((preset) => (
                    <button
                      key={preset}
                      type="button"
                      onClick={() => setColor(preset)}
                      className={`w-6 h-6 rounded-full border-2 transition-all ${
                        color === preset ? 'border-white scale-110 shadow-md shadow-white/20' : 'border-transparent'
                      }`}
                      style={{ backgroundColor: preset }}
                    ></button>
                  ))}
                  <input
                    type="color"
                    className="w-8 h-8 rounded cursor-pointer bg-transparent border-0"
                    value={color}
                    onChange={(e) => setColor(e.target.value)}
                  />
                </div>
              </div>

              {/* Team Members Assignment List */}
              {teamMembers.length > 0 && (
                <div>
                  <label className="block text-xs font-semibold text-gray-300 uppercase tracking-wider mb-2">
                    Assign Team Members
                  </label>
                  <div className="grid grid-cols-2 gap-2 border border-white/5 bg-slate-900/30 p-3 rounded-lg max-h-36 overflow-y-auto">
                    {teamMembers.map((member) => {
                      const isAssigned = assignedMembers.includes(member.id);
                      return (
                        <button
                          key={member.id}
                          type="button"
                          onClick={() => toggleMemberSelection(member.id)}
                          className={`flex items-center gap-2 p-2 rounded-md text-left transition-all ${
                            isAssigned
                              ? 'bg-purple-500/10 border border-purple-500/20 text-white'
                              : 'bg-transparent border border-transparent text-gray-400 hover:text-gray-200'
                          }`}
                        >
                          <div className="w-5 h-5 rounded bg-purple-500/30 flex items-center justify-center font-bold text-[8px] uppercase text-white shrink-0">
                            {member.name.slice(0, 2)}
                          </div>
                          <span className="text-xs truncate">{member.name}</span>
                        </button>
                      );
                    })}
                  </div>
                </div>
              )}

              <div className="flex items-center justify-end gap-3 pt-4 border-t border-white/5">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="glass-btn-secondary text-xs"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={saving}
                  className="glass-btn text-xs font-semibold"
                >
                  {saving ? (
                    <>
                      <Loader2 className="w-3.5 h-3.5 animate-spin" />
                      Saving...
                    </>
                  ) : (
                    'Save Project'
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
