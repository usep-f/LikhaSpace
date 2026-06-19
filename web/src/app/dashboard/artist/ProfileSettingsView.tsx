'use client';

import React, { useState } from 'react';
import { useWallet } from '@/context/WalletContext';
import { useNotification } from '@/context/NotificationContext';
import { profileSettingsSchema, sanitizeInput } from '@/lib/validation';

export const ProfileSettingsView: React.FC = () => {
  const { userProfile, registerProfile, deleteProfile } = useWallet();
  const { showToast, showConfirm, showLoading, hideLoading } = useNotification();
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

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
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

    try {
      showLoading('Saving profile...');
      const sanitizedData = {
        ...parsed.data,
        bio: sanitizeInput(parsed.data.bio || ''),
        title: sanitizeInput(parsed.data.title || ''),
        name: sanitizeInput(parsed.data.name),
      };
      await registerProfile(sanitizedData);
      showToast('Profile updated successfully!', 'success');
    } catch (err) {
      console.error(err);
      showToast('Failed to update profile.', 'error');
    } finally {
      hideLoading();
    }
  };

  const handleDelete = () => {
    showConfirm(
      'Delete Account',
      'Are you sure you want to completely delete your account? Your personal data will be erased, but your on-chain transactions will remain safely recorded on the Stellar network under your wallet address.',
      async () => {
        try {
          showLoading('Deleting account...');
          await deleteProfile();
          window.location.href = '/';
        } catch {
          hideLoading();
        }
      }
    );
  };

  return (
    <div className="space-y-6 max-w-2xl">
      <h3 className="font-heading font-bold text-lg text-white">Profile Settings</h3>
      <form onSubmit={handleSave} className="space-y-6 p-6 glass-card rounded-xl border border-white/5">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-slate-300 mb-1">Full Name</label>
            <input required type="text" name="name" value={formData.name} onChange={handleChange} className="w-full bg-slate-900 border border-slate-700 rounded-md py-2 px-3 text-white focus:outline-none focus:ring-2 focus:ring-hotpink transition-colors" />
            {errors.name && <p className="text-red-400 text-xs mt-1">{errors.name}</p>}
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-300 mb-1">Email</label>
            <input required type="email" name="email" value={formData.email} onChange={handleChange} className="w-full bg-slate-900 border border-slate-700 rounded-md py-2 px-3 text-white focus:outline-none focus:ring-2 focus:ring-hotpink transition-colors" />
            {errors.email && <p className="text-red-400 text-xs mt-1">{errors.email}</p>}
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-300 mb-1">Phone</label>
            <input required type="tel" name="phone" value={formData.phone} onChange={handleChange} className="w-full bg-slate-900 border border-slate-700 rounded-md py-2 px-3 text-white focus:outline-none focus:ring-2 focus:ring-hotpink transition-colors" />
            {errors.phone && <p className="text-red-400 text-xs mt-1">{errors.phone}</p>}
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-300 mb-1">Professional Title</label>
            <input type="text" name="title" value={formData.title} onChange={handleChange} className="w-full bg-slate-900 border border-slate-700 rounded-md py-2 px-3 text-white focus:outline-none focus:ring-2 focus:ring-hotpink transition-colors" />
            {errors.title && <p className="text-red-400 text-xs mt-1">{errors.title}</p>}
          </div>
          <div className="md:col-span-2">
            <label className="block text-sm font-medium text-slate-300 mb-1">Bio</label>
            <textarea name="bio" value={formData.bio} onChange={handleChange} rows={3} className="w-full bg-slate-900 border border-slate-700 rounded-md py-2 px-3 text-white focus:outline-none focus:ring-2 focus:ring-hotpink transition-colors" placeholder="Tell us about your services and experience..." />
            {errors.bio && <p className="text-red-400 text-xs mt-1">{errors.bio}</p>}
          </div>
        </div>

        <div className="border-t border-white/5 pt-4 mt-2">
          <h4 className="text-sm font-bold text-white mb-4">Social Links (Optional)</h4>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-slate-300 mb-1">GitHub URL</label>
              <input type="url" name="github" value={formData.github} onChange={handleChange} className="w-full bg-slate-900 border border-slate-700 rounded-md py-2 px-3 text-white focus:outline-none focus:ring-2 focus:ring-hotpink transition-colors" placeholder="https://github.com/..." />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-300 mb-1">LinkedIn URL</label>
              <input type="url" name="linkedin" value={formData.linkedin} onChange={handleChange} className="w-full bg-slate-900 border border-slate-700 rounded-md py-2 px-3 text-white focus:outline-none focus:ring-2 focus:ring-hotpink transition-colors" placeholder="https://linkedin.com/in/..." />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-300 mb-1">Twitter URL</label>
              <input type="url" name="twitter" value={formData.twitter} onChange={handleChange} className="w-full bg-slate-900 border border-slate-700 rounded-md py-2 px-3 text-white focus:outline-none focus:ring-2 focus:ring-hotpink transition-colors" placeholder="https://twitter.com/..." />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-300 mb-1">Portfolio URL</label>
              <input type="url" name="portfolio" value={formData.portfolio} onChange={handleChange} className="w-full bg-slate-900 border border-slate-700 rounded-md py-2 px-3 text-white focus:outline-none focus:ring-2 focus:ring-hotpink transition-colors" placeholder="https://yourwebsite.com" />
            </div>
          </div>
        </div>

        <div className="flex justify-between pt-4 mt-4 border-t border-white/5">
          <button type="button" onClick={handleDelete} className="px-4 py-2 bg-red-500/10 text-red-400 font-bold text-sm rounded hover:bg-red-500/20 transition-colors cursor-pointer">
            Delete Account
          </button>
          <button type="submit" className="px-6 py-2 bg-hotpink text-white font-bold text-sm rounded hover:bg-pink-600 transition-colors cursor-pointer">
            Save Changes
          </button>
        </div>
      </form>
    </div>
  );
};
