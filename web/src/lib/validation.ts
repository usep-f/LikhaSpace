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

// Profile Settings Schema (same as onboarding but without role requirement)
export const profileSettingsSchema = onboardingSchema.omit({ role: true });

// Gig Listing Schema
export const gigSchema = z.object({
  title: z.string().trim().min(5, 'Title must be at least 5 characters').max(100, 'Title must not exceed 100 characters'),
  category: z.enum(['design', 'dev', 'music', 'copywriting']),
  description: z.string().trim().min(10, 'Description must be at least 10 characters').max(2000, 'Description is too long'),
  priceUSD: z.number().min(1, 'Price must be at least $1'),
  tags: z.array(z.string().trim().max(30)).max(10, 'Maximum 10 tags allowed'),
  status: z.enum(['active', 'paused', 'occupied']),
  milestones: z.array(z.object({
    title: z.string().trim().min(1, 'Milestone title is required').max(100),
    payoutUSD: z.number().min(1, 'Payout must be at least $1'),
    maxRevisions: z.number().min(0, 'Revisions cannot be negative'),
  })).max(10, 'Maximum 10 milestones allowed'),
}).refine(data => {
  if (data.milestones.length === 0) return true;
  const totalAllocated = data.milestones.reduce((acc, m) => acc + m.payoutUSD, 0);
  return Math.abs(totalAllocated - data.priceUSD) < 0.01;
}, {
  message: 'The sum of all milestone payouts must exactly equal the total price.',
  path: ['milestones'], // Attach error to the milestones array
});

export type GigInput = z.infer<typeof gigSchema>;

// Booking Message Schema
export const bookingMessageSchema = z.object({
  message: z.string().trim().max(1000, 'Message cannot exceed 1000 characters').optional(),
});



// Deliverable Schema
export const deliverableSchema = z.object({
  link: z.string().trim().url('Please enter a valid URL').or(z.literal('')).optional(),
  notes: z.string().trim().max(2000, 'Notes cannot exceed 2000 characters').optional(),
});

// Denial Message Schema
export const denialMessageSchema = z.object({
  message: z.string().trim().max(1000, 'Message cannot exceed 1000 characters').optional(),
});

// Chat Message Schema
export const chatMessageSchema = z.object({
  text: z.string().trim()
    .min(1, 'Message cannot be empty.')
    .max(2000, 'Message cannot exceed 2000 characters.')
    .transform(sanitizeInput),
});
