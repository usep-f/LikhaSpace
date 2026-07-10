'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useWallet, UserRole } from '../context/WalletContext';
import { useNotification } from '../context/NotificationContext';
import { OnboardingFormData } from './onboarding/types';
import { StepRole } from './onboarding/StepRole';
import { StepDetails } from './onboarding/StepDetails';
import { StepCategory } from './onboarding/StepCategory';
import { StepPath } from './onboarding/StepPath';
import { StepSocials } from './onboarding/StepSocials';
import { StepSuccess } from './onboarding/StepSuccess';

export default function ProfileRegistrationModal() {
  const router = useRouter();
  const { uid, isRegistered, isConnected, registerProfile, hasAttemptedLogin, selectRole, role } = useWallet();
  const { showToast, showLoading, hideLoading } = useNotification();

  const [currentStep, setCurrentStep] = useState(1);
  const [isStep2Valid, setIsStep2Valid] = useState(false);
  const [isStep5Valid, setIsStep5Valid] = useState(true);
  const [formData, setFormData] = useState<OnboardingFormData>({
    role: role || null,
    name: '',
    email: '',
    phone: '',
    category: '',
    careerPath: '',
    bio: '',
    title: '',
    github: '',
    linkedin: '',
    twitter: '',
    portfolio: '',
  });

  if (!isConnected || !uid || isRegistered || !hasAttemptedLogin) {
    return null;
  }

  const updateData = (updates: Partial<OnboardingFormData>) => {
    setFormData((prev) => ({ ...prev, ...updates }));
  };

  const submitRegistration = async () => {
    try {
      showLoading('Saving profile registration...');
      await registerProfile({
        name: formData.name,
        email: formData.email,
        phone: formData.phone,
        title: formData.title,
        bio: formData.bio,
        category: formData.category,
        careerPath: formData.careerPath,
        github: formData.github,
        linkedin: formData.linkedin,
        twitter: formData.twitter,
        portfolio: formData.portfolio,
      });
      setCurrentStep(6);
    } catch (err: unknown) {
      showToast(err instanceof Error ? err.message : 'Registration failed', 'error');
    } finally {
      hideLoading();
    }
  };

  const handleNext = async (roleOverride?: UserRole) => {
    const activeRole = roleOverride || formData.role;
    if (currentStep === 1 && activeRole) {
      selectRole(activeRole);
    }

    if (currentStep === 2 && activeRole === 'client') {
      setCurrentStep(5);
      return;
    }

    if (currentStep === 5) {
      await submitRegistration();
      return;
    }

    if (currentStep === 6) {
      router.push(`/dashboard/${activeRole}`);
      return;
    }

    setCurrentStep((prev) => prev + 1);
  };

  const handleBack = () => {
    if (currentStep === 5 && formData.role === 'client') {
      setCurrentStep(2);
      return;
    }
    setCurrentStep((prev) => Math.max(1, prev - 1));
  };

  const renderStep = () => {
    const props = { 
      formData, 
      updateData, 
      onNext: handleNext, 
      onBack: handleBack,
      onValidityChange: currentStep === 2 ? setIsStep2Valid : currentStep === 5 ? setIsStep5Valid : undefined
    };
    switch (currentStep) {
      case 1: return <StepRole {...props} />;
      case 2: return <StepDetails {...props} />;
      case 3: return <StepCategory {...props} />;
      case 4: return <StepPath {...props} />;
      case 5: return <StepSocials {...props} />;
      case 6: return <StepSuccess {...props} />;
      default: return null;
    }
  };

  const isClient = formData.role === 'client';
  const stepsList = isClient 
    ? [
        { step: 1, label: 'Role' },
        { step: 2, label: 'Details' },
        { step: 5, label: 'Socials' }
      ]
    : [
        { step: 1, label: 'Role' },
        { step: 2, label: 'Details' },
        { step: 3, label: 'Category' },
        { step: 4, label: 'Specialty' },
        { step: 5, label: 'Socials' }
      ];

  const activeIndex = stepsList.findIndex((item) => item.step === currentStep);
  const brandColorClass = isClient ? 'bg-neoncyan' : 'bg-hotpink';
  const brandBorderClass = isClient ? 'border-neoncyan text-neoncyan' : 'border-hotpink text-hotpink';
  const brandGlowClass = isClient ? 'shadow-[0_0_10px_rgba(0,243,255,0.4)]' : 'shadow-[0_0_10px_rgba(255,0,127,0.4)]';

  return (
    <div className="fixed inset-0 z-100 bg-obsidian/90 backdrop-blur-md flex items-center justify-center p-4">
      <div className="bg-violet-dark/95 rounded-2xl shadow-2xl w-full max-w-3xl border border-white/10 min-h-[580px] md:min-h-[600px] max-h-[90vh] overflow-hidden flex flex-col relative">
        
        {/* Header with visual step counter */}
        {currentStep > 1 && currentStep < 6 && (
          <div className="px-6 md:px-10 pt-8 pb-4">
            <div className="relative">
              {/* Background Line */}
              <div className="absolute top-4 left-6 right-6 h-0.5 bg-slate-700 -translate-y-1/2" />
              
              {/* Progress Line */}
              {stepsList.length > 1 && activeIndex >= 0 && (
                <div 
                  className={`absolute top-4 left-6 h-0.5 ${brandColorClass} -translate-y-1/2 transition-all duration-500`}
                  style={{ width: `${(activeIndex / (stepsList.length - 1)) * 100}%`, maxWidth: 'calc(100% - 3rem)' }}
                />
              )}

              {/* Nodes */}
              <div className="relative flex justify-between">
                {stepsList.map((item, idx) => {
                  const isCompleted = item.step < currentStep;
                  const isActive = item.step === currentStep;
                  return (
                    <div key={item.step} className="flex flex-col items-center z-10">
                      <div 
                        className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-sm border transition-all duration-300 ${
                          isCompleted 
                            ? `${brandColorClass} border-transparent text-white`
                            : isActive
                              ? `bg-slate-900 ${brandBorderClass} ${brandGlowClass} border-2`
                              : 'bg-slate-800 border-slate-700 text-slate-500'
                        }`}
                      >
                        {isCompleted ? '✓' : idx + 1}
                      </div>
                      <span className={`text-xs mt-2 font-medium transition-colors duration-200 ${isActive ? 'text-white' : 'text-slate-400'}`}>
                        {item.label}
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        )}

        {/* Content area */}
        <div className="flex-1 overflow-y-auto px-6 md:px-10 py-6 flex flex-col justify-center">
          {renderStep()}
        </div>

        {/* Unified Footer */}
        {currentStep < 6 && (
          <div className="mt-auto px-6 md:px-10 py-6 border-t border-slate-800 flex justify-between bg-violet-dark/50">
            {currentStep > 1 ? (
              <button 
                onClick={handleBack} 
                className="px-6 py-2 rounded-lg border border-slate-600 text-slate-300 hover:bg-slate-800 transition-colors cursor-pointer"
              >
                Back
              </button>
            ) : (
              <div />
            )}
            
            {currentStep === 5 ? (
              <button 
                onClick={() => handleNext()} 
                disabled={!isStep5Valid}
                className={`px-8 py-2 rounded-lg font-semibold transition-all duration-200 cursor-pointer ${
                  !isStep5Valid 
                    ? 'bg-slate-800 text-slate-500 cursor-not-allowed' 
                    : 'bg-primary text-white hover:bg-primary/90 hover:-translate-y-0.5'
                }`}
              >
                Submit Registration
              </button>
            ) : (currentStep === 2) ? (
              <button 
                onClick={() => handleNext()} 
                disabled={!isStep2Valid}
                className={`px-8 py-2 rounded-lg font-semibold transition-all duration-200 cursor-pointer ${
                  !isStep2Valid 
                    ? 'bg-slate-800 text-slate-500 cursor-not-allowed' 
                    : 'bg-primary text-white hover:bg-primary/90 hover:-translate-y-0.5'
                }`}
              >
                Continue
              </button>
            ) : null}
          </div>
        )}

      </div>
    </div>
  );
}
