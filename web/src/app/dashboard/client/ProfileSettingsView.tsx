'use client';

import React, { useState } from 'react';
import { useWallet } from '@/context/WalletContext';
import { useNotification } from '@/context/NotificationContext';
import { profileSettingsSchema, sanitizeInput } from '@/lib/validation';

export const ProfileSettingsView: React.FC = () => {
  const { userProfile, registerProfile, deleteProfile } = useWallet();
  const { showToast, showConfirm } = useNotification();
  const [formData, setFormData] = useState({
    name: userProfile?.name || '',
    email: userProfile?.email || '',
    phone: userProfile?.phone || '',
    title: userProfile?.title || '',
    bio: userProfile?.bio || '',
    category: userProfile?.category || '',
    careerPath: userProfile?.careerPath || '',
    github: userProfile?.github || '',
    linkedin: userProfile?.linkedin || '',
    twitter: userProfile?.twitter || '',
    portfolio: userProfile?.portfolio || '',
  });

  const [errors, setErrors] = useState<Record<string, string>>({});

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
    if (errors[e.target.name]) {
      setErrors({ ...errors, [e.target.name]: '' });
    }
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrors({});
    
    const parsed = profileSettingsSchema.safeParse(formData);
    if (!parsed.success) {
      const fieldErrors: Record<string, string> = {};
      parsed.error.issues.forEach(err => {
        if (err.path[0]) fieldErrors[err.path[0].toString()] = err.message;
      });
      setErrors(fieldErrors);
      showToast('Please fix the errors in the form.', 'error');
      return;
    }

    const sanitizedData = {
      ...parsed.data,
      bio: sanitizeInput(parsed.data.bio || ''),
      title: sanitizeInput(parsed.data.title || ''),
      name: sanitizeInput(parsed.data.name),
    };

    await registerProfile(sanitizedData);
    showToast('Profile updated successfully!', 'success');
  };

  const handleDelete = () => {
    showConfirm(
      'Delete Account',
      'Are you sure you want to completely delete your account? Your personal data will be erased, but your on-chain transactions will remain safely recorded on the Stellar network under your wallet address.',
      async () => {
        await deleteProfile();
        window.location.href = '/';
      }
    );
  };

  return (
    <div className="space-y-6 max-w-2xl">
      <h3 className="font-heading font-bold text-lg text-white">Profile Settings</h3>
      <form onSubmit={handleSave} className="space-y-4 p-6 glass-card rounded-xl border border-white/5">
        <div>
          <label className="block text-sm font-medium text-slate-300 mb-1">Full Name</label>
          <input required type="text" name="name" value={formData.name} onChange={handleChange} className="w-full bg-slate-900 border border-slate-700 rounded-md py-2 px-3 text-white focus:outline-none focus:ring-2 focus:ring-neoncyan" />
          {errors.name && <p className="text-red-400 text-xs mt-1">{errors.name}</p>}
        </div>
        <div>
          <label className="block text-sm font-medium text-slate-300 mb-1">Email</label>
          <input required type="email" name="email" value={formData.email} onChange={handleChange} className="w-full bg-slate-900 border border-slate-700 rounded-md py-2 px-3 text-white focus:outline-none focus:ring-2 focus:ring-neoncyan" />
          {errors.email && <p className="text-red-400 text-xs mt-1">{errors.email}</p>}
        </div>
        <div>
          <label className="block text-sm font-medium text-slate-300 mb-1">Phone</label>
          <input required type="tel" name="phone" value={formData.phone} onChange={handleChange} className="w-full bg-slate-900 border border-slate-700 rounded-md py-2 px-3 text-white focus:outline-none focus:ring-2 focus:ring-neoncyan" />
          {errors.phone && <p className="text-red-400 text-xs mt-1">{errors.phone}</p>}
        </div>
        <div className="flex justify-between pt-4 mt-4 border-t border-white/5">
          <button type="button" onClick={handleDelete} className="px-4 py-2 bg-red-500/10 text-red-400 font-bold text-sm rounded hover:bg-red-500/20 transition-colors">
            Delete Account
          </button>
          <button type="submit" className="px-6 py-2 bg-neoncyan text-obsidian font-bold text-sm rounded hover:shadow-[0_0_10px_rgba(0,255,255,0.4)] transition-all">
            Save Changes
          </button>
        </div>
      </form>
    </div>
  );
};
