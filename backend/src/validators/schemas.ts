import Joi from 'joi';

/*
 Joi Validation Schemas for all API endpoints.
 Used with a validation middleware to sanitize request data.
 */
// AUTH & ONBOARDING VALIDATORS

export const loginSchema = Joi.object({
  email: Joi.string().email().required(),
  password: Joi.string().min(8).required(),
});

export const sendOtpSchema = Joi.object({
  email: Joi.string().email().required(),
});

export const verifyOtpSchema = Joi.object({
  email: Joi.string().email().required(),
  otp: Joi.string().length(6).pattern(/^\d+$/).required(),
});

// USER MANAGEMENT VALIDATORS

export const createUserSchema = Joi.object({
  fullName: Joi.string().min(2).max(255).required(),
  email: Joi.string().email().required(),
  phone: Joi.string().pattern(/^\+?[\d\s-]{10,20}$/).allow(null, ''),
  password: Joi.string().min(8).max(128).required(),
  role: Joi.string().valid('TEACHER', 'STUDENT').required(),
});

export const updateUserSchema = Joi.object({
  fullName: Joi.string().min(2).max(255),
  phone: Joi.string().pattern(/^\+?[\d\s-]{10,20}$/).allow(null, ''),
  role: Joi.string().valid('TEACHER', 'STUDENT'),
}).min(1);

export const bulkUploadStudentsSchema = Joi.object({
  batchId: Joi.string().uuid().required(),
  students: Joi.array().items(
    Joi.object({
      fullName: Joi.string().min(2).max(255).required(),
      email: Joi.string().email().required(),
      phone: Joi.string().allow(null, ''),
      rollNumber: Joi.string().min(1).max(50).required(),
    })
  ).min(1).required(),
});

// TEACHER ASSIGNMENT VALIDATORS

export const assignTeacherSchema = Joi.object({
  userId: Joi.string().uuid().required(),
  subjectId: Joi.string().uuid().required(),
  batchId: Joi.string().uuid().allow(null),
});

// BATCH VALIDATORS

export const createBatchSchema = Joi.object({
  branchId: Joi.string().uuid().required(),
  versionId: Joi.string().uuid().required(),
  name: Joi.string().min(2).max(100).required(),
  startYear: Joi.number().integer().min(2000).max(2100).required(),
  endYear: Joi.number().integer().min(2000).max(2100).required(),
  section: Joi.string().max(10).allow(null, ''),
});

// EXAM VALIDATORS

export const createExamSchema = Joi.object({
  semesterId: Joi.string().uuid().required(),
  name: Joi.string().min(2).max(100).required(),
  examType: Joi.string().valid('mid_sem', 'end_sem', 'internal', 'practical').required(),
  maxMarks: Joi.number().integer().min(1).max(1000).required(),
  weightage: Joi.number().precision(2).min(0).max(100).required(),
  examDate: Joi.date().iso().allow(null),
});

// MARKS VALIDATORS

export const enterMarksSchema = Joi.object({
  subjectId: Joi.string().uuid().required(),
  marks: Joi.array().items(
    Joi.object({
      studentId: Joi.string().uuid().required(),
      marksObtained: Joi.number().precision(2).min(0).required(),
      isAbsent: Joi.boolean().default(false),
    })
  ).min(1).required(),
});

// PAGINATION VALIDATORS

export const paginationSchema = Joi.object({
  page: Joi.number().integer().min(1).default(1),
  limit: Joi.number().integer().min(1).max(100).default(20),
  search: Joi.string().max(255).allow(''),
  role: Joi.string().valid('ADMIN', 'TEACHER', 'STUDENT'),
  sortBy: Joi.string().valid('fullName', 'email', 'createdAt', 'rollNumber').default('createdAt'),
  sortOrder: Joi.string().valid('asc', 'desc').default('desc'),
});
