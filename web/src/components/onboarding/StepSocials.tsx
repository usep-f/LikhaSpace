import React from 'react';
import { StepProps } from './types';
import { Globe } from 'lucide-react';
import { TwitterIcon, LinkedinIcon, GithubIcon } from './BrandIcons';
import { onboardingSchema, sanitizeInput } from '@/lib/validation';

export const StepSocials: React.FC<StepProps> = ({ formData, updateData, onValidityChange }) => {
  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    updateData({ [e.target.name]: sanitizeInput(e.target.value) });
  };

  const socialsSchema = onboardingSchema.pick({
    bio: true,
    title: true,
    github: true,
    linkedin: true,
    twitter: true,
    portfolio: true,
  });

  const isFormValid = socialsSchema.safeParse({
    bio: formData.bio,
    title: formData.title,
    github: formData.github,
    linkedin: formData.linkedin,
    twitter: formData.twitter,
    portfolio: formData.portfolio,
  }).success;

  React.useEffect(() => {
    onValidityChange?.(isFormValid);
  }, [isFormValid, onValidityChange]);

  const isClient = formData.role === 'client';

  return (
    <div className="space-y-6 animate-step-pop">
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
              maxLength={500}
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
                maxLength={100}
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
              <input type="url" name="twitter" maxLength={200} value={formData.twitter} onChange={handleChange} className="flex-1 bg-slate-900 border border-slate-700 rounded-md py-2 px-3 text-white focus:outline-none focus:ring-2 focus:ring-primary transition-all duration-200" placeholder="https://x.com/username" />
            </div>

            <div className="flex items-center gap-3">
              <div className="p-2 bg-slate-800 rounded-md border border-slate-700">
                <LinkedinIcon className="w-5 h-5 text-blue-600" />
              </div>
              <input type="url" name="linkedin" maxLength={200} value={formData.linkedin} onChange={handleChange} className="flex-1 bg-slate-900 border border-slate-700 rounded-md py-2 px-3 text-white focus:outline-none focus:ring-2 focus:ring-primary transition-all duration-200" placeholder="https://linkedin.com/in/username" />
            </div>

            {!isClient && (
              <div className="flex items-center gap-3">
                <div className="p-2 bg-slate-800 rounded-md border border-slate-700">
                  <GithubIcon className="w-5 h-5 text-slate-300" />
                </div>
                <input type="url" name="github" maxLength={200} value={formData.github} onChange={handleChange} className="flex-1 bg-slate-900 border border-slate-700 rounded-md py-2 px-3 text-white focus:outline-none focus:ring-2 focus:ring-primary transition-all duration-200" placeholder="https://github.com/username" />
              </div>
            )}

            <div className="flex items-center gap-3">
              <div className="p-2 bg-slate-800 rounded-md border border-slate-700">
                <Globe className="w-5 h-5 text-emerald-400" />
              </div>
              <input type="url" name="portfolio" maxLength={200} value={formData.portfolio} onChange={handleChange} className="flex-1 bg-slate-900 border border-slate-700 rounded-md py-2 px-3 text-white focus:outline-none focus:ring-2 focus:ring-primary transition-all duration-200" placeholder="https://yourportfolio.com" />
            </div>
          </div>
        </div>
      </div>


    </div>
  );
};
