import { z } from 'zod';

// Sanitization helper to strip potentially malicious HTML tags (XSS Prevention)
export const sanitizeInput = (val: string): string => {
  return val
    .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '') // Strip script tags
    .replace(/[<>]/g, ''); // Strip bracket characters to prevent rendering HTML tags
};

// Zod Schema to validate onboarding form inputs
export const onboardingSchema = z.object({
  role: z.enum(['artist', 'client'], {
    error: 'Please select a valid role.',
  }),
  name: z
    .string()
    .trim()
    .min(1, 'Name is required.')
    .max(50, 'Name must not exceed 50 characters.')
    .regex(/^[a-zA-Z\s.-]+$/, 'Name can only contain letters, spaces, dots, or hyphens.'),
  email: z
    .string()
    .trim()
    .min(1, 'Email is required.')
    .max(100, 'Email must not exceed 100 characters.')
    .email('Please enter a valid email address.'),
  phone: z
    .string()
    .trim()
    .min(1, 'Phone number is required.')
    .max(20, 'Phone number must not exceed 20 characters.')
    .regex(/^\+?[0-9\s.-]+$/, 'Phone number can only contain numbers, spaces, hyphens, and a leading plus.'),
  category: z.string().max(50).default(''),
  careerPath: z.string().max(50).default(''),
  bio: z
    .string()
    .trim()
    .max(500, 'Bio must not exceed 500 characters.')
    .default(''),
  title: z
    .string()
    .trim()
    .max(100, 'Title/Tagline must not exceed 100 characters.')
    .default(''),
  github: z
    .string()
    .trim()
    .max(200, 'GitHub URL must not exceed 200 characters.')
    .url('Please enter a valid GitHub URL.')
    .or(z.literal(''))
    .default(''),
  linkedin: z
    .string()
    .trim()
    .max(200, 'LinkedIn URL must not exceed 200 characters.')
    .url('Please enter a valid LinkedIn URL.')
    .or(z.literal(''))
    .default(''),
  twitter: z
    .string()
    .trim()
    .max(200, 'Twitter URL must not exceed 200 characters.')
    .url('Please enter a valid Twitter URL.')
    .or(z.literal(''))
    .default(''),
  portfolio: z
    .string()
    .trim()
    .max(200, 'Portfolio URL must not exceed 200 characters.')
    .url('Please enter a valid Portfolio URL.')
    .or(z.literal(''))
    .default(''),
});

export type OnboardingInput = z.infer<typeof onboardingSchema>;
