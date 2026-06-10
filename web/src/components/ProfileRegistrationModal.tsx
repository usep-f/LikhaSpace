'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useWallet } from '../context/WalletContext';
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
  const { address, isRegistered, isConnected, registerProfile, hasAttemptedLogin, selectRole, role } = useWallet();
  const { showToast } = useNotification();

  const [currentStep, setCurrentStep] = useState(1);
  const [formData, setFormData] = useState<OnboardingFormData>({
    role: role || null, // initialize from context if available
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

  // Only show if connected, not registered, and explicit login attempt was made
  if (!isConnected || !address || isRegistered || !hasAttemptedLogin) {
    return null;
  }

  const updateData = (updates: Partial<OnboardingFormData>) => {
    setFormData((prev) => ({ ...prev, ...updates }));
  };

  const handleNext = async () => {
    // If we just completed Step 1 (Role), sync it to the global wallet context
    if (currentStep === 1 && formData.role) {
      selectRole(formData.role);
    }

    // Role-based step skipping logic
    if (currentStep === 2 && formData.role === 'client') {
      setCurrentStep(5); // Skip Category and Path
      return;
    }

    // If we just submitted Step 5, we call registerProfile before moving to Step 6
    if (currentStep === 5) {
      try {
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
      }
      return;
    }

    if (currentStep === 6) {
      // Done! Close or navigate. The modal will naturally disappear because isRegistered becomes true,
      // but if the state hasn't fully synced yet, we can force a navigation to dashboard.
      router.push(`/dashboard/${formData.role}`);
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
    const props = { formData, updateData, onNext: handleNext, onBack: handleBack };
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

  // Calculate progress
  const totalSteps = formData.role === 'client' ? 3 : 5;
  let currentProgressStep = currentStep;
  if (formData.role === 'client') {
    if (currentStep === 5) currentProgressStep = 3;
    if (currentStep === 6) currentProgressStep = 3; // Keep it full at success
  } else {
    if (currentStep === 6) currentProgressStep = 5;
  }
  const progressPercentage = Math.min(100, Math.round(((currentProgressStep - 1) / (totalSteps - 1)) * 100)) || 0;

  return (
    <div className="fixed inset-0 z-[100] bg-obsidian/90 backdrop-blur-md flex items-center justify-center p-4">
      <div className="bg-violet-dark/95 rounded-2xl shadow-2xl w-full max-w-3xl border border-white/10 max-h-[90vh] overflow-hidden flex flex-col relative">
        
        {/* Progress Bar Header */}
        {currentStep < 6 && (
          <div className="absolute top-0 left-0 right-0 h-1 bg-white/5">
            <div 
              className="h-full bg-primary transition-all duration-500 ease-out"
              style={{ width: `${progressPercentage}%` }}
            />
          </div>
        )}

        <div className="flex-1 overflow-y-auto p-6 md:p-10">
          {renderStep()}
        </div>
      </div>
    </div>
  );
}
