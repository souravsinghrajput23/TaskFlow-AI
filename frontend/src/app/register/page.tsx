'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { useAuth } from '@/context/AuthContext';
import {
  User,
  KeyRound,
  Mail,
  Loader2,
  KanbanSquare,
  ShieldAlert,
  Sparkles,
  CheckCircle2,
  Layers,
  BrainCircuit
} from 'lucide-react';
import { Role } from '@/types';

const registerSchema = z.object({
  name: z.string().min(2, 'Name must be at least 2 characters'),
  email: z.string().email('Please enter a valid email address'),
  password: z.string().min(6, 'Password must be at least 6 characters'),
  role: z.enum(['ADMIN', 'MEMBER'] as const).default('MEMBER'),
});

type RegisterFormData = z.infer<typeof registerSchema>;

export default function RegisterPage() {
  const { register: authRegister } = useAuth();
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    watch,
    formState: { errors, isSubmitting },
  } = useForm<RegisterFormData>({
    resolver: zodResolver(registerSchema),
    defaultValues: {
      role: 'MEMBER'
    }
  });

  const passwordVal = watch('password', '');

  const onSubmit = async (data: RegisterFormData) => {
    setErrorMsg(null);
    try {
      await authRegister(data.name, data.email, data.password, data.role as Role);
    } catch (err: any) {
      setErrorMsg(err.response?.data?.message || 'Registration failed. Please try again.');
    }
  };

  return (
    <div className="min-h-screen flex bg-[#06040d] text-white overflow-hidden relative">
      {/* Decorative background nodes */}
      <div className="absolute top-[-10%] right-[-10%] w-[50vw] h-[50vw] bg-purple-900/10 rounded-full blur-[120px] pointer-events-none"></div>
      <div className="absolute bottom-[-10%] left-[-10%] w-[50vw] h-[50vw] bg-blue-900/10 rounded-full blur-[120px] pointer-events-none"></div>

      {/* LEFT PANE: FEATURE PREVIEW & MARKETING WIDGET (Hidden on small screens) */}
      <div className="hidden lg:flex lg:w-1/2 flex-col justify-between p-12 relative border-r border-white/5 bg-radial-gradient">
        {/* Brand logo */}
        <div className="flex items-center gap-2 relative z-10">
          <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-purple-500 to-blue-500 flex items-center justify-center shadow-lg shadow-purple-500/25">
            <KanbanSquare className="w-5 h-5 text-white" />
          </div>
          <span className="font-extrabold text-xl tracking-wide bg-gradient-to-r from-purple-400 to-blue-400 bg-clip-text text-transparent">
            TaskFlow AI
          </span>
        </div>

        {/* Dynamic SaaS Showcase Widget */}
        <div className="max-w-md mx-auto space-y-8 my-auto relative z-10">
          <div className="space-y-4">
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-purple-500/10 border border-purple-500/20 text-purple-300">
              <Sparkles className="w-3.5 h-3.5 text-purple-400" /> Supercharged by Groq LLM
            </span>
            <h2 className="text-4xl font-extrabold tracking-tight leading-tight text-white">
              Supercharge your sprints with AI management
            </h2>
            <p className="text-gray-400 text-sm leading-relaxed">
              TaskFlow AI combines a modern Kanban board and charts with deep LLM assistance to automate task lists and suggest estimates.
            </p>
          </div>

          {/* Interactive Floating Glass Card */}
          <div className="glass-panel p-5 border border-purple-500/20 bg-purple-950/5 relative shadow-2xl transition-all duration-300 hover:scale-[1.02] hover:-rotate-1">
            <div className="flex items-center justify-between mb-3.5">
              <span className="text-[10px] uppercase font-bold text-purple-400 tracking-wider flex items-center gap-1 bg-purple-500/10 px-2 py-0.5 rounded border border-purple-500/20">
                <BrainCircuit className="w-3 h-3" /> AI Assisted Task
              </span>
              <span className="text-[10px] text-gray-500 font-medium">Sprint 1</span>
            </div>
            
            <h4 className="text-sm font-bold text-white">Setup Groq SDK Integration</h4>
            <p className="text-xs text-gray-400 mt-2 leading-relaxed">
              Configure Groq client and create services for Task description prompt generator and subtask parser controllers.
            </p>

            {/* Generated Subtasks Checklist */}
            <div className="mt-4 space-y-2 border-t border-white/5 pt-3.5">
              <div className="flex items-center gap-2 text-xs text-gray-300">
                <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                <span>Setup Express controller API endpoints</span>
              </div>
              <div className="flex items-center gap-2 text-xs text-gray-300">
                <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                <span>Verify estimate duration logic prompts</span>
              </div>
              <div className="flex items-center gap-2 text-xs text-gray-500 line-through">
                <CheckCircle2 className="w-4 h-4 text-gray-600 shrink-0" />
                <span>Write backend client tests schema</span>
              </div>
            </div>
          </div>
        </div>

        {/* Footer info */}
        <div className="text-xs text-gray-500 relative z-10 flex items-center gap-2">
          <Layers className="w-4 h-4" /> Clean & Interview-Friendly Design System
        </div>
      </div>

      {/* RIGHT PANE: REGISTRATION FORM */}
      <div className="w-full lg:w-1/2 flex items-center justify-center p-6 sm:p-12 relative z-10">
        <div className="w-full max-w-md glass-panel p-8 md:p-10 bg-white/2 border border-white/5 animate-slide-up">
          
          {/* Logo on mobile only */}
          <div className="flex items-center gap-2 justify-center lg:hidden mb-6">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-purple-500 to-blue-500 flex items-center justify-center">
              <KanbanSquare className="w-4.5 h-4.5 text-white" />
            </div>
            <span className="font-extrabold text-lg tracking-wide text-white">TaskFlow AI</span>
          </div>

          <div className="text-center lg:text-left mb-8">
            <h1 className="text-2xl font-bold tracking-tight text-white">Create Account</h1>
            <p className="text-xs text-gray-400 mt-1.5">Sign up to get started with TaskFlow AI sprints</p>
          </div>

          {errorMsg && (
            <div className="mb-5 p-3.5 rounded-lg bg-red-500/10 border border-red-500/20 text-red-400 text-xs">
              {errorMsg}
            </div>
          )}

          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4.5">
            {/* Name */}
            <div>
              <label className="block text-[10px] font-bold text-gray-300 uppercase tracking-wider mb-1.5">
                Full Name
              </label>
              <div className="relative">
                <User className="absolute left-3 top-3 w-4.5 h-4.5 text-gray-500" />
                <input
                  type="text"
                  placeholder="Sarah Jenkins"
                  className="w-full pl-10 glass-input text-xs"
                  {...register('name')}
                />
              </div>
              {errors.name && (
                <span className="text-red-400 text-[10px] mt-1 block">{errors.name.message}</span>
              )}
            </div>

            {/* Email */}
            <div>
              <label className="block text-[10px] font-bold text-gray-300 uppercase tracking-wider mb-1.5">
                Email Address
              </label>
              <div className="relative">
                <Mail className="absolute left-3 top-3 w-4.5 h-4.5 text-gray-500" />
                <input
                  type="email"
                  placeholder="sarah@example.com"
                  className="w-full pl-10 glass-input text-xs"
                  {...register('email')}
                />
              </div>
              {errors.email && (
                <span className="text-red-400 text-[10px] mt-1 block">{errors.email.message}</span>
              )}
            </div>

            {/* Password */}
            <div>
              <label className="block text-[10px] font-bold text-gray-300 uppercase tracking-wider mb-1.5">
                Password
              </label>
              <div className="relative">
                <KeyRound className="absolute left-3 top-3 w-4.5 h-4.5 text-gray-500" />
                <input
                  type="password"
                  placeholder="••••••••"
                  className="w-full pl-10 glass-input text-xs"
                  {...register('password')}
                />
              </div>
              {errors.password && (
                <span className="text-red-400 text-[10px] mt-1 block">{errors.password.message}</span>
              )}
              {/* Micro-validator condition text */}
              {passwordVal.length > 0 && passwordVal.length < 6 && (
                <span className="text-yellow-400 text-[9px] mt-1 block">Must be at least 6 characters</span>
              )}
            </div>

            {/* Role selector */}
            <div>
              <label className="block text-[10px] font-bold text-gray-300 uppercase tracking-wider mb-1.5">
                Onboarding Role
              </label>
              <div className="relative">
                <ShieldAlert className="absolute left-3 top-3 w-4.5 h-4.5 text-gray-500" />
                <select
                  className="w-full pl-10 glass-input text-xs appearance-none bg-indigo-950/40 text-white cursor-pointer"
                  {...register('role')}
                >
                  <option value="MEMBER" className="bg-slate-950 text-white text-xs">Team Member (assigned projects & task logs)</option>
                  <option value="ADMIN" className="bg-slate-950 text-white text-xs">Admin (full project creation & stats control)</option>
                </select>
              </div>
              {errors.role && (
                <span className="text-red-400 text-[10px] mt-1 block">{errors.role.message}</span>
              )}
            </div>

            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full glass-btn py-3 mt-6 text-xs font-bold tracking-wide"
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  Creating Account...
                </>
              ) : (
                'Create Account & Start'
              )}
            </button>
          </form>

          <div className="mt-8 text-center border-t border-white/5 pt-6 text-xs">
            <p className="text-gray-400">
              Already have an account?{' '}
              <Link href="/login" className="text-purple-400 hover:text-purple-300 font-semibold transition-colors">
                Sign in
              </Link>
            </p>
          </div>

        </div>
      </div>
    </div>
  );
}
