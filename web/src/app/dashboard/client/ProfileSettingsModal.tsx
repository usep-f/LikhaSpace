import React, { useState } from 'react';
import { useWallet } from '@/context/WalletContext';
import { useNotification } from '@/context/NotificationContext';
import { profileSettingsSchema, sanitizeInput } from '@/lib/validation';
import { X, Wallet, ShieldCheck } from 'lucide-react';

export interface ProfileSettingsModalProps {
  onClose: () => void;
}

export const ProfileSettingsModal: React.FC<ProfileSettingsModalProps> = ({ onClose }) => {
  const { userProfile, registerProfile, deleteProfile, uid, address, linkWallet } = useWallet();
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
      onClose();
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
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-obsidian border border-white/10 rounded-2xl w-full max-w-2xl shadow-2xl flex flex-col max-h-[90vh]">
        
        <div className="flex items-center justify-between p-6 border-b border-white/5 shrink-0">
          <h3 className="font-heading font-bold text-xl text-white">Edit Profile</h3>
          <button 
            onClick={onClose}
            className="p-2 text-gray-400 hover:text-white rounded-full hover:bg-white/5 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-6 overflow-y-auto">
          <form id="profile-form" onSubmit={handleSave} className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-1">Full Name</label>
                <input required type="text" name="name" value={formData.name} onChange={handleChange} className="w-full bg-slate-900 border border-slate-700 rounded-md py-2 px-3 text-white focus:outline-none focus:ring-2 focus:ring-neoncyan transition-colors" />
                {errors.name && <p className="text-red-400 text-xs mt-1">{errors.name}</p>}
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-1">Email</label>
                <input required type="email" name="email" value={formData.email} onChange={handleChange} className="w-full bg-slate-900 border border-slate-700 rounded-md py-2 px-3 text-white focus:outline-none focus:ring-2 focus:ring-neoncyan transition-colors" />
                {errors.email && <p className="text-red-400 text-xs mt-1">{errors.email}</p>}
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-1">Phone</label>
                <input required type="tel" name="phone" value={formData.phone} onChange={handleChange} className="w-full bg-slate-900 border border-slate-700 rounded-md py-2 px-3 text-white focus:outline-none focus:ring-2 focus:ring-neoncyan transition-colors" />
                {errors.phone && <p className="text-red-400 text-xs mt-1">{errors.phone}</p>}
              </div>
              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-slate-300 mb-1">Bio</label>
                <textarea name="bio" value={formData.bio} onChange={handleChange} rows={3} className="w-full bg-slate-900 border border-slate-700 rounded-md py-2 px-3 text-white focus:outline-none focus:ring-2 focus:ring-neoncyan transition-colors" placeholder="Tell us about your business or projects..." />
                {errors.bio && <p className="text-red-400 text-xs mt-1">{errors.bio}</p>}
              </div>
            </div>

            <div className="border-t border-white/5 pt-4 mt-2">
              <h4 className="text-sm font-bold text-white mb-4">Social Links (Optional)</h4>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-1">GitHub URL</label>
                  <input type="url" name="github" value={formData.github} onChange={handleChange} className="w-full bg-slate-900 border border-slate-700 rounded-md py-2 px-3 text-white focus:outline-none focus:ring-2 focus:ring-neoncyan transition-colors" placeholder="https://github.com/..." />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-1">LinkedIn URL</label>
                  <input type="url" name="linkedin" value={formData.linkedin} onChange={handleChange} className="w-full bg-slate-900 border border-slate-700 rounded-md py-2 px-3 text-white focus:outline-none focus:ring-2 focus:ring-neoncyan transition-colors" placeholder="https://linkedin.com/in/..." />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-1">Twitter URL</label>
                  <input type="url" name="twitter" value={formData.twitter} onChange={handleChange} className="w-full bg-slate-900 border border-slate-700 rounded-md py-2 px-3 text-white focus:outline-none focus:ring-2 focus:ring-neoncyan transition-colors" placeholder="https://twitter.com/..." />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-1">Portfolio URL</label>
                  <input type="url" name="portfolio" value={formData.portfolio} onChange={handleChange} className="w-full bg-slate-900 border border-slate-700 rounded-md py-2 px-3 text-white focus:outline-none focus:ring-2 focus:ring-neoncyan transition-colors" placeholder="https://yourwebsite.com" />
                </div>
              </div>
            </div>

            <div className="border-t border-white/5 pt-4 mt-6">
              <h4 className="text-sm font-bold text-white mb-4">Stellar Integration</h4>
              {uid && uid.startsWith('G') && uid.length === 56 ? (
                <div className="bg-violet-dark/30 border border-[#eab308]/20 p-4 rounded-lg flex items-center gap-3">
                  <div className="p-2 bg-[#eab308]/10 rounded-lg">
                    <Wallet className="w-5 h-5 text-[#eab308]" />
                  </div>
                  <div>
                    <p className="text-xs font-bold text-white">Authenticated via Stellar Wallet</p>
                    <p className="text-[10px] text-gray-400 font-mono mt-0.5">{address}</p>
                  </div>
                </div>
              ) : address ? (
                <div className="bg-violet-dark/30 border border-neongreen/20 p-4 rounded-lg flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-neongreen/10 rounded-lg">
                      <ShieldCheck className="w-5 h-5 text-neongreen" />
                    </div>
                    <div>
                      <p className="text-xs font-bold text-white">Linked Stellar Wallet</p>
                      <p className="text-[10px] text-gray-400 font-mono mt-0.5">
                        {address.slice(0, 8)}...{address.slice(-8)}
                      </p>
                    </div>
                  </div>
                  <span className="text-[10px] uppercase font-bold tracking-widest text-neongreen bg-neongreen/10 px-2 py-1 rounded border border-neongreen/20">
                    Verified
                  </span>
                </div>
              ) : (
                <div className="bg-violet-dark/30 border border-white/5 p-4 rounded-lg flex flex-col md:flex-row md:items-center justify-between gap-4">
                  <div className="flex items-start gap-3">
                    <div className="p-2 bg-white/5 rounded-lg shrink-0 mt-0.5">
                      <Wallet className="w-5 h-5 text-gray-400" />
                    </div>
                    <div>
                      <p className="text-xs font-bold text-white">No Stellar Wallet Linked</p>
                      <p className="text-[10px] text-gray-400 mt-0.5">
                        Link a Freighter wallet to pay or receive payouts directly on-chain.
                      </p>
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={async () => {
                      try {
                        await linkWallet();
                      } catch {
                        // error is already toasted inside linkWallet
                      }
                    }}
                    className="px-4 py-2 bg-neoncyan/10 border border-neoncyan/30 text-neoncyan font-bold text-xs rounded hover:bg-neoncyan/20 transition-all cursor-pointer whitespace-nowrap"
                  >
                    Link Wallet
                  </button>
                </div>
              )}
            </div>
          </form>
        </div>

        <div className="flex justify-between items-center p-6 border-t border-white/5 shrink-0 bg-white/[0.02]">
          <button type="button" onClick={handleDelete} className="px-4 py-2 bg-red-500/10 text-red-400 font-bold text-sm rounded hover:bg-red-500/20 transition-colors cursor-pointer">
            Delete Account
          </button>
          <div className="flex space-x-3">
            <button type="button" onClick={onClose} className="px-4 py-2 text-gray-300 font-bold text-sm rounded hover:bg-white/5 transition-colors cursor-pointer">
              Cancel
            </button>
            <button type="submit" form="profile-form" className="px-6 py-2 bg-neoncyan text-obsidian font-bold text-sm rounded hover:shadow-[0_0_10px_rgba(0,255,255,0.4)] transition-all cursor-pointer">
              Save Changes
            </button>
          </div>
        </div>

      </div>
    </div>
  );
};
