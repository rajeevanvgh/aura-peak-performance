import { z } from 'zod';

// Auth validation schemas
export const signUpSchema = z.object({
  email: z.string().trim().email({ message: 'Invalid email address' }).max(255),
  password: z.string().min(8, { message: 'Password must be at least 8 characters' }).max(100),
  name: z.string().trim().min(1, { message: 'Name is required' }).max(100),
  age: z.number().int().min(18, { message: 'Must be at least 18' }).max(80, { message: 'Must be 80 or younger' }),
  gender: z.enum(['male', 'female', 'other'], { message: 'Please select a gender' }),
  fitnessLevel: z.enum(['beginner', 'intermediate', 'advanced'], { message: 'Please select a fitness level' })
});

export const signInSchema = z.object({
  email: z.string().trim().email({ message: 'Invalid email address' }),
  password: z.string().min(1, { message: 'Password is required' })
});

// Goal validation schema
export const goalSchema = z.object({
  type: z.string().min(1, { message: 'Goal type is required' }),
  title: z.string().trim().min(1, { message: 'Title is required' }).max(100, { message: 'Title must be less than 100 characters' }),
  targetValue: z.number().positive({ message: 'Target value must be greater than 0' }).max(1000000, { message: 'Target value is too large' }),
  unit: z.string().trim().min(1, { message: 'Unit is required' }).max(20, { message: 'Unit must be less than 20 characters' }),
  startDate: z.string().refine(val => !isNaN(Date.parse(val)), { message: 'Invalid start date' }),
  endDate: z.string().refine(val => !isNaN(Date.parse(val)), { message: 'Invalid end date' })
}).refine(data => new Date(data.endDate) >= new Date(data.startDate), {
  message: 'End date cannot be before start date',
  path: ['endDate']
});

// Activity validation schema
export const activitySchema = z.object({
  date: z.string().refine(val => !isNaN(Date.parse(val)), { message: 'Invalid date' }),
  value: z.number().min(1, { message: 'Value must be at least 1' }).max(1000000, { message: 'Value is too large' }),
  notes: z.string().max(1000, { message: 'Notes must be less than 1000 characters' }).optional()
});

export type SignUpData = z.infer<typeof signUpSchema>;
export type SignInData = z.infer<typeof signInSchema>;
export type GoalData = z.infer<typeof goalSchema>;
export type ActivityData = z.infer<typeof activitySchema>;
