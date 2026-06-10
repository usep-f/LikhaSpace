import { UserRole } from '@/context/WalletContext';

export interface OnboardingFormData {
  // Step 1: Role
  role: UserRole | null;
  // Step 2: Credentials
  name: string;
  email: string;
  phone: string;
  // Step 3: Category
  category: string;
  // Step 4: Path
  careerPath: string;
  // Step 5: Socials
  bio: string;
  title: string; // Used if they want a short tagline
  github: string;
  linkedin: string;
  twitter: string;
  portfolio: string;
}

export interface StepProps {
  formData: OnboardingFormData;
  updateData: (updates: Partial<OnboardingFormData>) => void;
  onNext: (roleOverride?: UserRole) => void;
  onBack: () => void;
  onValidityChange?: (isValid: boolean) => void;
}
