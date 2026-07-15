'use client';

import React, { useState, useEffect } from 'react';
import { TeamService, ProjectService } from '@/services/api.service';
import { useAuth } from '@/context/AuthContext';
import { User, Project, Role } from '@/types';
import {
  UserPlus,
  Mail,
  Shield,
  Briefcase,
  CheckSquare,
  Plus,
  Loader2,
  X
} from 'lucide-react';

export default function TeamPage() {
  const { user } = useAuth();
  const isAdmin = user?.role === 'ADMIN';

  const [members, setMembers] = useState<any[]>([]);
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);

  // Invite Modal States
  const [showInviteModal, setShowInviteModal] = useState(false);
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [role, setRole] = useState<Role>('MEMBER');
  const [selectedProjectIds, setSelectedProjectIds] = useState<string[]>([]);
  const [inviting, setInviting] = useState(false);
  const [inviteError, setInviteError] = useState<string | null>(null);

  const fetchTeamData = async () => {
    try {
      setLoading(true);
      const data = await TeamService.getTeamMembers();
      setMembers(data);

      if (isAdmin) {
        const projs = await ProjectService.getProjects();
        setProjects(projs);
      }
    } catch (error) {
      console.error('Failed to load team data:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTeamData();
  }, []);

  const handleInviteSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !email.trim()) return;

    try {
      setInviting(true);
      setInviteError(null);

      await TeamService.inviteMember({
        name,
        email,
        role,
        projectIds: selectedProjectIds
      });

      setShowInviteModal(false);
      setName('');
      setEmail('');
      setRole('MEMBER');
      setSelectedProjectIds([]);
      fetchTeamData();
    } catch (error: any) {
      console.error('Invite member failed:', error);
      setInviteError(error.response?.data?.message || 'Failed to invite member. Please check details.');
    } finally {
      setInviting(false);
    }
  };

  const handleToggleProject = (id: string) => {
    setSelectedProjectIds(prev =>
      prev.includes(id) ? prev.filter(pid => pid !== id) : [...prev, id]
    );
  };

  if (loading) {
    return (
      <div className="flex h-[60vh] items-center justify-center">
        <Loader2 className="w-8 h-8 text-purple-500 animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header section */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-white">Team Members</h1>
          <p className="text-sm text-gray-400">View performance stats and invite project members.</p>
        </div>
        {isAdmin && (
          <button onClick={() => setShowInviteModal(true)} className="glass-btn text-xs font-semibold py-2.5">
            <UserPlus className="w-4 h-4" /> Invite Member
          </button>
        )}
      </div>

      {/* Team Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {members.map((member) => (
          <div key={member.id} className="glass-panel p-5 bg-white/2 border border-white/5 flex flex-col justify-between hover:border-purple-500/10 transition-colors">
            <div className="flex items-start gap-4">
              {/* Photo Avatar */}
              <div className="w-12 h-12 rounded-xl bg-purple-500/20 border border-purple-400/20 flex items-center justify-center font-bold text-white uppercase text-sm shrink-0 overflow-hidden">
                {member.photoUrl ? (
                  <img src={member.photoUrl} alt={member.name} className="w-full h-full object-cover" />
                ) : (
                  member.name.slice(0, 2)
                )}
              </div>

              {/* Details */}
              <div className="overflow-hidden">
                <h3 className="text-sm font-bold text-white truncate">{member.name}</h3>
                <span className="text-[10px] text-gray-400 flex items-center gap-1.5 mt-0.5 truncate">
                  <Mail className="w-3.5 h-3.5" /> {member.email}
                </span>
                <span className={`inline-flex items-center gap-1 text-[9px] font-bold px-2 py-0.5 rounded-full mt-2 border ${
                  member.role === 'ADMIN'
                    ? 'bg-purple-500/10 text-purple-400 border-purple-500/20'
                    : 'bg-blue-500/10 text-blue-400 border-blue-500/20'
                }`}>
                  <Shield className="w-3 h-3" /> {member.role}
                </span>
              </div>
            </div>

            {/* Project & Task stats bar */}
            <div className="grid grid-cols-2 gap-4 mt-6 pt-4 border-t border-white/5 text-center">
              <div className="flex flex-col items-center">
                <span className="text-[10px] text-gray-400 uppercase font-bold tracking-wider flex items-center gap-1">
                  <Briefcase className="w-3 h-3 text-purple-400" /> Projects
                </span>
                <span className="text-lg font-bold text-white mt-1">{member.projectsCount}</span>
              </div>
              <div className="flex flex-col items-center">
                <span className="text-[10px] text-gray-400 uppercase font-bold tracking-wider flex items-center gap-1">
                  <CheckSquare className="w-3 h-3 text-blue-400" /> Assigned
                </span>
                <span className="text-lg font-bold text-white mt-1">{member.tasksAssignedCount}</span>
              </div>
            </div>

            {/* List of active projects names */}
            {member.projectNames && member.projectNames.length > 0 && (
              <div className="mt-4 pt-3 border-t border-white/5">
                <p className="text-[9px] text-gray-400 uppercase font-bold tracking-wider mb-1.5">Projects Assigned</p>
                <div className="flex flex-wrap gap-1">
                  {member.projectNames.map((pn: string) => (
                    <span key={pn} className="text-[8.5px] px-2 py-0.5 rounded bg-white/5 text-gray-300 border border-white/5">
                      {pn}
                    </span>
                  ))}
                </div>
              </div>
            )}
          </div>
        ))}
      </div>

      {/* INVITE MEMBER MODAL */}
      {showInviteModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="fixed inset-0 bg-black/60 backdrop-blur-sm" onClick={() => setShowInviteModal(false)}></div>
          <div className="glass-panel w-full max-w-md p-6 border-white/10 shadow-2xl relative z-10 animate-slide-up max-h-[90vh] overflow-y-auto">
            <button
              onClick={() => setShowInviteModal(false)}
              className="absolute top-4 right-4 text-gray-400 hover:text-white"
            >
              <X className="w-5 h-5" />
            </button>

            <h2 className="text-lg font-bold text-white mb-6">Invite Team Member</h2>

            {inviteError && (
              <div className="mb-4 p-3 rounded bg-red-500/10 border border-red-500/20 text-red-400 text-xs">
                {inviteError}
              </div>
            )}

            <form onSubmit={handleInviteSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-gray-300 uppercase tracking-wider mb-1.5">
                  Full Name
                </label>
                <input
                  type="text"
                  required
                  placeholder="Sarah Jenkins"
                  className="w-full glass-input text-sm"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-300 uppercase tracking-wider mb-1.5">
                  Email Address
                </label>
                <input
                  type="email"
                  required
                  placeholder="sarah@taskflow.com"
                  className="w-full glass-input text-sm"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-300 uppercase tracking-wider mb-1.5">
                  System Role
                </label>
                <select
                  className="w-full glass-input text-sm bg-slate-900"
                  value={role}
                  onChange={(e) => setRole(e.target.value as Role)}
                >
                  <option value="MEMBER">Team Member</option>
                  <option value="ADMIN">Administrator</option>
                </select>
              </div>

              {/* Multi-select Projects list to assign immediately */}
              {projects.length > 0 && (
                <div>
                  <label className="block text-xs font-semibold text-gray-300 uppercase tracking-wider mb-2">
                    Assign to Projects
                  </label>
                  <div className="space-y-1.5 border border-white/5 bg-slate-900/30 p-3 rounded-lg max-h-36 overflow-y-auto">
                    {projects.map((p) => {
                      const isSelected = selectedProjectIds.includes(p.id);
                      return (
                        <button
                          key={p.id}
                          type="button"
                          onClick={() => handleToggleProject(p.id)}
                          className={`w-full flex items-center gap-2 p-2 rounded text-left transition-all ${
                            isSelected
                              ? 'bg-purple-500/10 border border-purple-500/20 text-white'
                              : 'bg-transparent border border-transparent text-gray-400 hover:text-gray-200'
                          }`}
                        >
                          <span className="w-2 h-2 rounded-full shrink-0" style={{ backgroundColor: p.color }}></span>
                          <span className="text-xs truncate">{p.name}</span>
                        </button>
                      );
                    })}
                  </div>
                </div>
              )}

              <div className="flex items-center justify-end gap-3 pt-4 border-t border-white/5">
                <button
                  type="button"
                  onClick={() => setShowInviteModal(false)}
                  className="glass-btn-secondary text-xs"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={inviting}
                  className="glass-btn text-xs font-semibold"
                >
                  {inviting ? (
                    <>
                      <Loader2 className="w-3.5 h-3.5 animate-spin" />
                      Inviting...
                    </>
                  ) : (
                    'Invite Member'
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
