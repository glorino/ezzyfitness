import { z } from "zod";

// Auth schemas
export const loginSchema = z.object({
  email: z.string().email("Invalid email address"),
  password: z.string().min(6, "Password must be at least 6 characters"),
});

export const registerStaffSchema = z.object({
  fullName: z.string().min(2, "Full name is required"),
  email: z.string().email("Invalid email address"),
  phone: z.string().optional(),
  role: z.enum(["admin", "trainer", "frontdesk"]),
  password: z.string().min(6).optional(),
});

// Member schemas
export const memberSchema = z.object({
  fullName: z.string().min(2, "Full name is required"),
  email: z.string().email("Invalid email address"),
  phone: z.string().min(7, "Phone number is required"),
  planId: z.number().nullable().optional(),
  gender: z.enum(["male", "female", "other"]).optional(),
  dateOfBirth: z.string().optional(),
  goals: z.string().optional(),
  emergencyName: z.string().optional(),
  emergencyPhone: z.string().optional(),
  notes: z.string().optional(),
  password: z.string().min(6).optional(),
});

// Payment schemas
export const paymentSchema = z.object({
  memberId: z.number().positive("Member ID is required"),
  planId: z.number().nullable().optional(),
  amount: z.number().positive("Amount must be positive"),
  method: z.enum(["cash", "transfer", "pos", "card", "other"]),
  reference: z.string().max(60).optional(),
  notes: z.string().max(500).optional(),
  extend: z.boolean().default(true),
});

// Attendance schemas
export const attendanceEntrySchema = z.object({
  memberId: z.number().positive(),
  status: z.enum(["present", "absent", "late", "cancelled"]),
});

export const attendanceSchema = z.object({
  classId: z.number().positive("Class ID is required"),
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Invalid date format"),
  entries: z.array(attendanceEntrySchema).min(1, "At least one entry required"),
});

// Contact schemas
export const contactSchema = z.object({
  name: z.string().min(2, "Name is required"),
  email: z.string().email("Invalid email address"),
  phone: z.string().optional(),
  dateOfBirth: z.string().optional(),
  subject: z.string().max(160).optional(),
  message: z.string().min(10, "Message must be at least 10 characters"),
});

export const contactReplySchema = z.object({
  id: z.number().positive(),
  response: z.string().min(1, "Reply text is required"),
});

// Class schemas
export const classSchema = z.object({
  name: z.string().min(2, "Class name is required"),
  category: z.string().min(2, "Category is required"),
  description: z.string().optional(),
  trainerId: z.number().nullable().optional(),
  dayOfWeek: z.number().min(0).max(6),
  startTime: z.string().regex(/^\d{2}:\d{2}$/, "Invalid time format"),
  endTime: z.string().regex(/^\d{2}:\d{2}$/, "Invalid time format"),
  capacity: z.number().positive().default(20),
  location: z.string().optional(),
  intensity: z.enum(["Low", "Medium", "High"]).default("Medium"),
});

// Plan schemas
export const planSchema = z.object({
  name: z.string().min(2, "Plan name is required"),
  tagline: z.string().optional(),
  priceNgn: z.number().positive("Price must be positive"),
  durationDays: z.number().positive("Duration must be positive"),
  features: z.array(z.string()).optional(),
  isPopular: z.boolean().default(false),
  isActive: z.boolean().default(true),
});

// Profile update schema
export const profileUpdateSchema = z.object({
  fullName: z.string().min(2).optional(),
  phone: z.string().optional(),
  goals: z.string().optional(),
  emergencyName: z.string().optional(),
  emergencyPhone: z.string().optional(),
});

export const passwordChangeSchema = z.object({
  currentPassword: z.string().min(6),
  newPassword: z.string().min(6, "New password must be at least 6 characters"),
});
