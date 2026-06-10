import React from 'react';
import { StepProps } from './types';
import { CATEGORIES } from './StepCategory';

const CAREER_PATHS: Record<string, string[]> = {
  tech: ['App Developer', 'UI/UX Designer', 'Web Developer', 'Fullstack Engineer', 'DevOps Engineer'],
  design: ['Graphic Designer', '3D Illustrator', 'Brand Designer', 'Motion Animator', 'Game Artist'],
  writing: ['Content Writer', 'Copywriter', 'Technical Writer', 'Translator', 'SEO Specialist'],
  video: ['Video Editor', 'Audio Engineer', 'Voice Actor', 'Music Producer', 'Animator'],
  business: ['Social Media Manager', 'Digital Marketer', 'Virtual Assistant', 'Project Manager', 'SEO Consultant'],
};

export const StepPath: React.FC<StepProps> = ({ formData, updateData, onNext, onBack }) => {
  const paths = CAREER_PATHS[formData.category] || [];
  const selectedCategoryLabel = CATEGORIES.find(c => c.id === formData.category)?.label || '';

  const selectPath = (path: string) => {
    updateData({ careerPath: path, title: path }); // Also set title as a default
    onNext();
  };

  return (
    <div className="space-y-6 animate-in fade-in zoom-in duration-300">
      <div className="text-center mb-8">
        <h2 className="font-heading text-2xl font-bold text-white mb-2">What is your specialty?</h2>
        <p className="text-sm text-gray-400">Select your specific career path in {selectedCategoryLabel}.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 max-h-[50vh] overflow-y-auto p-2">
        {paths.map((path) => {
          const isActive = formData.careerPath === path;
          return (
            <button
              key={path}
              onClick={() => selectPath(path)}
              className={`text-left p-4 rounded-xl glass-card border transition-all duration-300 cursor-pointer hover:scale-[1.02] active:scale-[0.98] ${
                isActive
                  ? 'border-neoncyan shadow-[0_0_15px_rgba(0,243,255,0.4)] bg-white/10'
                  : 'border-white/10 hover:border-neoncyan/50 hover:bg-white/5'
              }`}
            >
              <h3 className="font-bold text-white">{path}</h3>
            </button>
          );
        })}
      </div>

      <div className="flex justify-between pt-6 border-t border-slate-700 mt-6">
        <button onClick={onBack} className="px-6 py-2 rounded-lg border border-slate-600 text-slate-300 hover:bg-slate-800 transition-colors">
          Back
        </button>
      </div>
    </div>
  );
};
