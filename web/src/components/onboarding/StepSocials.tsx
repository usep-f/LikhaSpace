import React from 'react';
import { StepProps } from './types';
import { Globe } from 'lucide-react';
import { TwitterIcon, LinkedinIcon, GithubIcon } from './BrandIcons';

export const StepSocials: React.FC<StepProps> = ({ formData, updateData, onNext, onBack }) => {
  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    updateData({ [e.target.name]: e.target.value });
  };

  const isClient = formData.role === 'client';

  return (
    <div className="space-y-6 animate-in fade-in zoom-in duration-300">
      <div className="text-center mb-6">
        <h2 className="font-heading text-2xl font-bold text-white mb-2">Final Touches</h2>
        <p className="text-sm text-gray-400">Tell us a bit about yourself and connect your professional links.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-slate-300 mb-1">
              {isClient ? 'Company / Project Bio' : 'Professional Bio'}
            </label>
            <textarea
              name="bio"
              value={formData.bio}
              onChange={handleChange}
              rows={5}
              className="w-full bg-slate-900 border border-slate-700 rounded-md py-3 px-4 text-white focus:outline-none focus:ring-2 focus:ring-primary transition-all duration-200 resize-none"
              placeholder={isClient ? "Tell freelancers about your projects..." : "Highlight your experience, skills, and past successes..."}
            />
          </div>
          {!isClient && (
            <div>
              <label className="block text-sm font-medium text-slate-300 mb-1">Professional Title</label>
              <input
                type="text"
                name="title"
                value={formData.title}
                onChange={handleChange}
                className="w-full bg-slate-900 border border-slate-700 rounded-md py-2 px-3 text-white focus:outline-none focus:ring-2 focus:ring-primary transition-all duration-200"
                placeholder="e.g. Senior App Developer"
              />
            </div>
          )}
        </div>

        <div className="space-y-4">
          <h3 className="text-sm font-medium text-slate-300">Social Links</h3>
          <div className="space-y-3">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-slate-800 rounded-md border border-slate-700">
                <TwitterIcon className="w-5 h-5 text-blue-400" />
              </div>
              <input type="url" name="twitter" value={formData.twitter} onChange={handleChange} className="flex-1 bg-slate-900 border border-slate-700 rounded-md py-2 px-3 text-white focus:outline-none focus:ring-2 focus:ring-primary transition-all duration-200" placeholder="https://x.com/username" />
            </div>

            <div className="flex items-center gap-3">
              <div className="p-2 bg-slate-800 rounded-md border border-slate-700">
                <LinkedinIcon className="w-5 h-5 text-blue-600" />
              </div>
              <input type="url" name="linkedin" value={formData.linkedin} onChange={handleChange} className="flex-1 bg-slate-900 border border-slate-700 rounded-md py-2 px-3 text-white focus:outline-none focus:ring-2 focus:ring-primary transition-all duration-200" placeholder="https://linkedin.com/in/username" />
            </div>

            {!isClient && (
              <div className="flex items-center gap-3">
                <div className="p-2 bg-slate-800 rounded-md border border-slate-700">
                  <GithubIcon className="w-5 h-5 text-slate-300" />
                </div>
                <input type="url" name="github" value={formData.github} onChange={handleChange} className="flex-1 bg-slate-900 border border-slate-700 rounded-md py-2 px-3 text-white focus:outline-none focus:ring-2 focus:ring-primary transition-all duration-200" placeholder="https://github.com/username" />
              </div>
            )}

            <div className="flex items-center gap-3">
              <div className="p-2 bg-slate-800 rounded-md border border-slate-700">
                <Globe className="w-5 h-5 text-emerald-400" />
              </div>
              <input type="url" name="portfolio" value={formData.portfolio} onChange={handleChange} className="flex-1 bg-slate-900 border border-slate-700 rounded-md py-2 px-3 text-white focus:outline-none focus:ring-2 focus:ring-primary transition-all duration-200" placeholder="https://yourportfolio.com" />
            </div>
          </div>
        </div>
      </div>

      <div className="flex justify-between pt-6 border-t border-slate-700 mt-6">
        <button onClick={onBack} className="px-6 py-2 rounded-lg border border-slate-600 text-slate-300 hover:bg-slate-800 transition-colors">
          Back
        </button>
        <button 
          onClick={onNext} 
          className="px-8 py-2 rounded-lg font-semibold bg-primary text-white hover:bg-primary/90 hover:-translate-y-0.5 transition-all duration-200"
        >
          Submit Registration
        </button>
      </div>
    </div>
  );
};
