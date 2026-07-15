'use client';

import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { useAuth } from '@/context/AuthContext';
import { User, Mail, ShieldAlert, KeyRound, Image, Loader2, Sparkles, UserCog } from 'lucide-react';

const profileSchema = z.object({
  name: z.string().min(2, 'Name must be at least 2 characters'),
  email: z.string().email('Please enter a valid email address'),
  photoUrl: z.string().url('Please enter a valid image URL').or(z.literal('')),
  password: z.string().min(6, 'Password must be at least 6 characters').optional().or(z.literal('')),
  confirmPassword: z.string().optional().or(z.literal('')),
}).refine(data => {
  if (data.password && data.password !== data.confirmPassword) {
    return false;
  }
  return true;
}, {
  message: "Passwords do not match",
  path: ["confirmPassword"],
});

type ProfileFormData = z.infer<typeof profileSchema>;

export default function ProfilePage() {
  const { user, updateProfile } = useAuth();
  const [successMsg, setSuccessMsg] = useState<string | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    setValue,
    formState: { errors, isSubmitting },
  } = useForm<ProfileFormData>({
    resolver: zodResolver(profileSchema),
    defaultValues: {
      name: user?.name || '',
      email: user?.email || '',
      photoUrl: user?.photoUrl || '',
      password: '',
      confirmPassword: ''
    }
  });

  const onSubmit = async (data: ProfileFormData) => {
    setSuccessMsg(null);
    setErrorMsg(null);
    try {
      const payload: any = {
        name: data.name,
        email: data.email,
        photoUrl: data.photoUrl || '',
      };

      if (data.password) {
        payload.password = data.password;
      }

      await updateProfile(payload);
      setSuccessMsg('Profile settings updated successfully!');
    } catch (err: any) {
      setErrorMsg(err.response?.data?.message || 'Failed to update profile settings. Try again.');
    }
  };

  const handleApplySampleAvatar = (url: string) => {
    setValue('photoUrl', url);
  };

  const sampleAvatars = [
    { name: 'Sarah', url: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&q=80&w=150' },
    { name: 'Alex', url: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&q=80&w=150' },
    { name: 'Jane', url: 'https://images.unsplash.com/photo-1438761681033-6461ffad8d80?auto=format&fit=crop&q=80&w=150' },
    { name: 'Michael', url: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?auto=format&fit=crop&q=80&w=150' }
  ];

  return (
    <div className="space-y-6 animate-fade-in max-w-2xl">
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-white">Profile Settings</h1>
        <p className="text-sm text-gray-400">Manage your avatar, security credentials, and view account roles.</p>
      </div>

      {successMsg && (
        <div className="p-4 rounded-lg bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-sm">
          {successMsg}
        </div>
      )}

      {errorMsg && (
        <div className="p-4 rounded-lg bg-red-500/10 border border-red-500/20 text-red-400 text-sm">
          {errorMsg}
        </div>
      )}

      <div className="glass-panel p-6 bg-white/2 border border-white/5">
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
          {/* Avatar Preview section */}
          <div className="flex items-center gap-4 pb-4 border-b border-white/5">
            <div className="w-16 h-16 rounded-xl bg-purple-500/20 border border-purple-400/20 flex items-center justify-center font-bold text-white uppercase text-lg overflow-hidden shrink-0">
              {user?.photoUrl ? (
                <img src={user.photoUrl} alt={user.name} className="w-full h-full object-cover" />
              ) : (
                user?.name.slice(0, 2)
              )}
            </div>
            <div>
              <h4 className="text-sm font-semibold text-white">{user?.name}</h4>
              <span className="text-[10px] text-purple-300 font-medium px-2 py-0.5 rounded-full bg-purple-500/10 border border-purple-500/20 block w-max mt-1">
                {user?.role} Account
              </span>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Full Name */}
            <div>
              <label className="block text-xs font-semibold text-gray-300 uppercase tracking-wider mb-1.5">
                Full Name
              </label>
              <div className="relative">
                <User className="absolute left-3 top-3 w-5 h-5 text-gray-400" />
                <input
                  type="text"
                  placeholder="Your Name"
                  className="w-full pl-10 glass-input text-sm"
                  {...register('name')}
                />
              </div>
              {errors.name && (
                <span className="text-red-400 text-xs mt-1 block">{errors.name.message}</span>
              )}
            </div>

            {/* Email Address */}
            <div>
              <label className="block text-xs font-semibold text-gray-300 uppercase tracking-wider mb-1.5">
                Email Address
              </label>
              <div className="relative">
                <Mail className="absolute left-3 top-3 w-5 h-5 text-gray-400" />
                <input
                  type="email"
                  placeholder="email@example.com"
                  className="w-full pl-10 glass-input text-sm"
                  {...register('email')}
                />
              </div>
              {errors.email && (
                <span className="text-red-400 text-xs mt-1 block">{errors.email.message}</span>
              )}
            </div>
          </div>

          {/* Photo Avatar URL */}
          <div>
            <label className="block text-xs font-semibold text-gray-300 uppercase tracking-wider mb-1.5">
              Avatar Image URL
            </label>
            <div className="relative">
              <Image className="absolute left-3 top-3 w-5 h-5 text-gray-400" />
              <input
                type="text"
                placeholder="https://images.unsplash.com/photo-..."
                className="w-full pl-10 glass-input text-sm"
                {...register('photoUrl')}
              />
            </div>
            {errors.photoUrl && (
              <span className="text-red-400 text-xs mt-1 block">{errors.photoUrl.message}</span>
            )}
            
            {/* Sample Avatars Preset list */}
            <div className="mt-3 flex items-center gap-2">
              <span className="text-[10px] text-gray-400 uppercase font-bold tracking-wider">Presets:</span>
              <div className="flex gap-2">
                {sampleAvatars.map((av) => (
                  <button
                    key={av.name}
                    type="button"
                    onClick={() => handleApplySampleAvatar(av.url)}
                    className="w-6 h-6 rounded-full overflow-hidden border border-white/10 hover:border-purple-400 hover:scale-105 transition-all shrink-0"
                    title={`Use ${av.name} avatar`}
                  >
                    <img src={av.url} alt={av.name} className="w-full h-full object-cover" />
                  </button>
                ))}
              </div>
            </div>
          </div>

          <div className="border-t border-white/5 pt-4">
            <h3 className="text-sm font-semibold text-white mb-4">Security Credentials</h3>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Password */}
              <div>
                <label className="block text-xs font-semibold text-gray-300 uppercase tracking-wider mb-1.5">
                  New Password (leave empty to keep current)
                </label>
                <div className="relative">
                  <KeyRound className="absolute left-3 top-3 w-5 h-5 text-gray-400" />
                  <input
                    type="password"
                    placeholder="••••••••"
                    className="w-full pl-10 glass-input text-sm"
                    {...register('password')}
                  />
                </div>
                {errors.password && (
                  <span className="text-red-400 text-xs mt-1 block">{errors.password.message}</span>
                )}
              </div>

              {/* Confirm Password */}
              <div>
                <label className="block text-xs font-semibold text-gray-300 uppercase tracking-wider mb-1.5">
                  Confirm Password
                </label>
                <div className="relative">
                  <KeyRound className="absolute left-3 top-3 w-5 h-5 text-gray-400" />
                  <input
                    type="password"
                    placeholder="••••••••"
                    className="w-full pl-10 glass-input text-sm"
                    {...register('confirmPassword')}
                  />
                </div>
                {errors.confirmPassword && (
                  <span className="text-red-400 text-xs mt-1 block">{errors.confirmPassword.message}</span>
                )}
              </div>
            </div>
          </div>

          <div className="flex items-center justify-end gap-3 pt-6 border-t border-white/5">
            <button
              type="submit"
              disabled={isSubmitting}
              className="glass-btn text-xs font-semibold py-2.5"
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  Saving Settings...
                </>
              ) : (
                'Save Profile Settings'
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
