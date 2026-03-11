const { z } = require('zod');

// Admin
exports.adminLoginSchema = z.object({
  username: z.string().min(1, 'Username is required').max(100),
  password: z.string().min(1, 'Password is required').max(200),
});

// Elections
exports.electionCreateSchema = z.object({
  title: z.string().min(1, 'Title is required').max(200),
  description: z.string().max(2000).optional().nullable(),
  event_type: z.enum(['src', 'class_rep', 'hall', 'pageant', 'custom']),
  election_scope: z.enum(['institution', 'general']).optional(),
  voting_type: z.enum(['free', 'paid']),
  auth_method: z.enum(['student_id_pin', 'voter_code']),
  price_per_vote: z.number().positive().optional().nullable(),
  currency: z.string().max(10).optional().nullable(),
  code_prefix: z.string().max(20).optional().nullable(),
  start_date: z.string().min(1, 'Start date is required'),
  end_date: z.string().min(1, 'End date is required'),
});

exports.electionUpdateSchema = z.object({
  title: z.string().min(1).max(200).optional().nullable(),
  description: z.string().max(2000).optional().nullable(),
  event_type: z.enum(['src', 'class_rep', 'hall', 'pageant', 'custom']).optional().nullable(),
  election_scope: z.enum(['institution', 'general']).optional().nullable(),
  voting_type: z.enum(['free', 'paid']).optional().nullable(),
  auth_method: z.enum(['student_id_pin', 'voter_code']).optional().nullable(),
  price_per_vote: z.number().positive().optional().nullable(),
  code_prefix: z.string().max(20).optional().nullable(),
  start_date: z.string().optional().nullable(),
  end_date: z.string().optional().nullable(),
  results_public: z.number().int().min(0).max(1).optional().nullable(),
  show_on_landing: z.number().int().min(0).max(1).optional().nullable(),
  ussd_enabled: z.number().int().min(0).max(1).optional().nullable(),
  ussd_service_code: z.string().max(50).optional().nullable(),
});

exports.electionStatusSchema = z.object({
  status: z.enum(['draft', 'active', 'paused', 'completed']),
});

// Positions
exports.positionCreateSchema = z.object({
  title: z.string().min(1, 'Position title is required').max(200),
  description: z.string().max(1000).optional().nullable(),
  max_votes: z.number().int().positive().optional(),
  display_order: z.number().int().min(0).optional(),
});

exports.positionUpdateSchema = z.object({
  title: z.string().min(1).max(200).optional().nullable(),
  description: z.string().max(1000).optional().nullable(),
  max_votes: z.number().int().positive().optional().nullable(),
  display_order: z.number().int().min(0).optional().nullable(),
});

// Candidates
exports.candidateCreateSchema = z.object({
  full_name: z.string().min(1, 'Full name is required').max(200),
  position_id: z.number().int().positive('Position is required'),
  portfolio: z.string().max(5000).optional().nullable(),
  contestant_code: z.string().max(50).optional().nullable(),
  display_order: z.number().int().min(0).optional(),
});

// Voter login
exports.voterLoginSchema = z.object({
  method: z.enum(['student_id_pin', 'voter_code']),
  election_id: z.number({ coerce: true }).int().positive(),
  student_id: z.string().optional(),
  pin: z.string().optional(),
  code: z.string().optional(),
});

// Vote cast (free)
exports.voteCastSchema = z.object({
  selections: z.array(z.object({
    position_id: z.number().int().positive(),
    candidate_id: z.number().int().positive(),
  })).min(1, 'At least one selection is required'),
});

// Vote cast (paid)
exports.paidVoteCastSchema = z.object({
  candidate_id: z.number().int().positive(),
  position_id: z.number().int().positive(),
  vote_count: z.number().int().positive(),
  payment_id: z.number().int().positive(),
});

// Payment initialize
exports.paymentInitSchema = z.object({
  election_id: z.number({ coerce: true }).int().positive(),
  candidate_id: z.number({ coerce: true }).int().positive(),
  position_id: z.number({ coerce: true }).int().positive(),
  vote_count: z.number({ coerce: true }).int().positive().max(10000),
  voter_name: z.string().max(200).optional().nullable(),
  voter_phone: z.string().max(50).optional().nullable(),
  voter_email: z.string().email().optional().nullable(),
  provider: z.string().max(50).optional().nullable(),
});

// Student create
exports.studentCreateSchema = z.object({
  student_id: z.string().min(1, 'Student ID is required').max(50),
  pin: z.string().min(1, 'PIN is required').max(50),
  full_name: z.string().min(1, 'Full name is required').max(200),
  class_name: z.string().max(100).optional().nullable(),
  hall: z.string().max(100).optional().nullable(),
});

// Code generate
exports.codeGenerateSchema = z.object({
  count: z.number({ coerce: true }).int().min(1).max(5000),
  studentNames: z.array(z.string()).optional(),
  assignToStudents: z.boolean().optional(),
});

// Template
exports.templateCreateSchema = z.object({
  name: z.string().min(1, 'Template name is required').max(200),
  description: z.string().max(1000).optional().nullable(),
  config: z.object({
    title: z.string().optional(),
    event_type: z.string().optional(),
    voting_type: z.string().optional(),
    auth_method: z.string().optional(),
    price_per_vote: z.number().optional().nullable(),
    positions: z.array(z.object({
      title: z.string(),
      description: z.string().optional().nullable(),
      max_votes: z.number().int().positive().optional(),
    })).optional(),
  }),
});

// Duplicate election
exports.duplicateElectionSchema = z.object({
  start_date: z.string().min(1, 'Start date is required'),
  end_date: z.string().min(1, 'End date is required'),
});

// Admin user management
exports.adminCreateSchema = z.object({
  username: z.string().min(3, 'Username must be at least 3 characters').max(100),
  password: z.string().min(6, 'Password must be at least 6 characters').max(200),
  full_name: z.string().min(1, 'Full name is required').max(200),
  role: z.enum(['admin', 'super_admin', 'superadmin']),
});

exports.adminUpdateSchema = z.object({
  username: z.string().min(3).max(100).optional(),
  password: z.string().min(6).max(200).optional(),
  full_name: z.string().min(1).max(200).optional(),
  role: z.enum(['admin', 'super_admin', 'superadmin']).optional(),
});

// USSD settings
exports.ussdSettingsSchema = z.object({
  ussd_enabled: z.number().int().min(0).max(1),
  ussd_service_code: z.string().max(50).optional().nullable(),
});
