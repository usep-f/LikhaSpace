import React from 'react';
import { StepProps } from './types';
import { Monitor, PenTool, Type, Video, TrendingUp } from 'lucide-react';

export const CATEGORIES = [
  { id: 'tech', label: 'Computer & Tech', icon: Monitor, color: 'text-blue-400', bg: 'bg-blue-400/10' },
  { id: 'design', label: 'Design & Creative', icon: PenTool, color: 'text-hotpink', bg: 'bg-hotpink/10' },
  { id: 'writing', label: 'Writing & Translation', icon: Type, color: 'text-amber-400', bg: 'bg-amber-400/10' },
  { id: 'video', label: 'Video & Audio', icon: Video, color: 'text-purple-400', bg: 'bg-purple-400/10' },
  { id: 'business', label: 'Business & Marketing', icon: TrendingUp, color: 'text-emerald-400', bg: 'bg-emerald-400/10' },
];

export const StepCategory: React.FC<StepProps> = ({ formData, updateData, onNext }) => {
  const selectCategory = (categoryId: string) => {
    // If they change category, we should reset their careerPath
    updateData({ category: categoryId, careerPath: '' });
    onNext();
  };

  return (
    <div className="space-y-6 animate-step-pop">
      <div className="text-center mb-8">
        <h2 className="font-heading text-2xl font-bold text-white mb-2">What is your main field?</h2>
        <p className="text-sm text-gray-400">Select the category that best describes your expertise.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {CATEGORIES.map((cat) => {
          const Icon = cat.icon;
          const isActive = formData.category === cat.id;
          return (
            <button
              key={cat.id}
              onClick={() => selectCategory(cat.id)}
              className={`flex flex-col items-center text-center p-6 rounded-xl glass-card border transition-all duration-300 cursor-pointer hover:scale-[1.02] active:scale-[0.98] ${
                isActive
                  ? 'border-neoncyan shadow-[0_0_15px_rgba(0,243,255,0.4)] bg-white/10'
                  : 'border-white/10 hover:border-white/30'
              }`}
            >
              <div className={`p-4 rounded-full mb-4 ${cat.bg}`}>
                <Icon className={`w-8 h-8 ${cat.color}`} />
              </div>
              <h3 className="font-bold text-white">{cat.label}</h3>
            </button>
          );
        })}
      </div>


    </div>
  );
};
