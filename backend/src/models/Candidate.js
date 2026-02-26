const mongoose = require('mongoose');
const { CANDIDATE_STATUS, QUALIFICATION, SOURCE, PANEL_DECISION, TRAINING_STATUS, BGV_STATUS, PREFERRED_LANGUAGE, PREFERRED_CONTACT } = require('../config/constants');

const candidateSchema = new mongoose.Schema({
  // ── Core Identity ──
  candidateId: { type: String, unique: true }, // auto-generated: INV-2026-00001
  fullName: { type: String, required: true, trim: true },
  firstName: { type: String, trim: true },
  lastName: { type: String, trim: true },
  phone: { type: String, required: true, unique: true, index: true },
  alternatePhone: { type: String },
  email: { type: String, lowercase: true, trim: true },
  dateOfBirth: Date,
  gender: { type: String, enum: ['Male', 'Female', 'Other'] },
  photo: { type: String }, // S3/local URL

  // ── Qualification & Experience ──
  qualification: { type: String, enum: QUALIFICATION },
  qualificationDetail: String, // e.g., "ITI from Govt Polytechnic, Lucknow"
  electricalTrade: { type: Boolean, default: false },
  experienceYears: { type: Number, default: 0, min: 0, max: 30 },
  smartMeterExperience: { type: Boolean, default: false },
  certifications: [String],
  resumeUrl: String,

  // ── Location ──
  currentLocation: {
    city: String,
    state: String,
    pincode: String,
    coordinates: { lat: Number, lng: Number }
  },
  preferredLocation: { type: mongoose.Schema.Types.ObjectId, ref: 'DeploymentLocation' },
  relocationWilling: { type: Boolean },

  // ── Source & Registration ──
  source: { type: String, enum: SOURCE, required: true },
  sourceDetail: String, // filename for Excel/CSV, sheet URL for GSheet
  walkInLocation: String, // e.g., "delhi-office-1"
  hearAboutUs: String,
  referredBy: { type: mongoose.Schema.Types.ObjectId, ref: 'Candidate' },
  referralCode: { type: String, unique: true, sparse: true },

  // ── Pipeline Status ──
  status: { type: String, enum: CANDIDATE_STATUS, default: 'New', index: true },
  statusHistory: [{
    status: String,
    changedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    changedAt: { type: Date, default: Date.now },
    reason: String
  }],

  // ── WhatsApp ──
  whatsappAvailable: { type: Boolean, default: true },
  whatsappStatus: { type: String, enum: ['pending', 'sent', 'delivered', 'read', 'failed_1', 'failed_2', 'opted_out'], default: 'pending' },
  whatsappSessionExpiry: Date,
  optedOut: { type: Boolean, default: false },

  // ── Chatbot Progress ──
  chatbotModule: { type: Number, default: 0, min: 0, max: 9 },
  chatbotCompleted: { type: Boolean, default: false },
  chatbotData: { type: mongoose.Schema.Types.Mixed, default: {} },

  // ── Scores ──
  preScreenScore: { type: Number, min: 0, max: 100, default: 0 },
  preScreenBreakdown: {
    qualification: { type: Number, default: 0 },
    experience: { type: Number, default: 0 },
    locationMatch: { type: Number, default: 0 },
    availability: { type: Number, default: 0 },
    certifications: { type: Number, default: 0 }
  },
  interviewScore: { type: Number, min: 0, max: 60, default: 0 },
  interviewBreakdown: {
    technical: { type: Number, default: 0, max: 10 },
    practical: { type: Number, default: 0, max: 10 },
    communication: { type: Number, default: 0, max: 10 },
    experience: { type: Number, default: 0, max: 10 },
    locationAvailability: { type: Number, default: 0, max: 10 },
    quizNormalized: { type: Number, default: 0, max: 10 }
  },
  quizScore: { type: Number, min: 0, max: 20, default: 0 },
  combinedScore: { type: Number, min: 0, max: 100, default: 0 },

  // ── Interview ──
  interviewScheduled: Date,
  interviewType: { type: String, enum: ['virtual', 'physical', null] },
  interviewLink: String,
  interviewer: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  interviewRecording: String,
  interviewNotes: String,
  rescheduleCount: { type: Number, default: 0 },

  // ── Panel Decision ──
  panelDecision: { type: String, enum: PANEL_DECISION, default: 'Pending' },
  panelDecisionBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  panelDecisionAt: Date,
  panelDecisionReason: String,
  panelDecisionComments: String,

  // ── Offer ──
  offerSalary: Number,
  offerLocation: { type: mongoose.Schema.Types.ObjectId, ref: 'DeploymentLocation' },
  offerJoiningDate: Date,
  offerSentAt: Date,
  offerExpiresAt: Date,
  offerAcceptedAt: Date,
  offerDeclinedAt: Date,
  offerDeclineReason: String,

  // ── Onboarding & Documents ──
  documents: [{
    type: { type: String }, // aadhaar_front, aadhaar_back, pan, qualification, etc.
    url: String,
    uploadedAt: Date,
    verified: { type: Boolean, default: false },
    verifiedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    verifiedAt: Date,
    ocrData: mongoose.Schema.Types.Mixed,
    status: { type: String, enum: ['pending', 'verified', 'rejected', 'reupload'], default: 'pending' }
  }],

  // ── Training ──
  trainingStatus: { type: String, enum: TRAINING_STATUS, default: 'Not_Assigned' },
  trainingBatch: { type: mongoose.Schema.Types.ObjectId, ref: 'TrainingBatch' },
  trainingAttendance: {
    day1: { type: Boolean, default: false },
    day2: { type: Boolean, default: false },
    day3: { type: Boolean, default: false }
  },
  trainingScores: {
    safetyQuiz: { type: Number, min: 0, max: 100 },
    practicalDay2: { type: String, enum: ['pass', 'fail', null] },
    writtenFinal: { type: Number, min: 0, max: 100 },
    practicalFinal: { type: String, enum: ['pass', 'fail', null] }
  },

  // ── BGV ──
  bgvStatus: { type: String, enum: BGV_STATUS, default: 'Not_Started' },
  bgvReport: String,
  bgvCompletedAt: Date,

  // ── Deployment ──
  deploymentLocation: { type: mongoose.Schema.Types.ObjectId, ref: 'DeploymentLocation' },
  deployedAt: Date,
  supervisorName: String,
  supervisorPhone: String,

  // ── Preferences ──
  preferredLanguage: { type: String, enum: PREFERRED_LANGUAGE, default: 'hi' },
  preferredContact: { type: String, enum: PREFERRED_CONTACT, default: 'whatsapp' },
  availability: { type: String, enum: ['7_days', '15_days', '30_days', '30_plus'] },
  currentlyEmployed: Boolean,
  noticePeriod: String,

  // ── Compliance ──
  consentCaptured: { type: Boolean, default: false },
  consentCapturedAt: Date,
  consentChannel: String,
  dataDeletionRequested: { type: Boolean, default: false },

  // ── Blacklist ──
  blacklisted: { type: Boolean, default: false, index: true },
  blacklistReason: String,
  blacklistedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  blacklistedAt: Date,

  // ── Assignment ──
  assignedAgent: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  assignedTeam: { type: String, enum: ['Alpha', 'Beta', 'Gamma', 'Delta'] },

  // ── Status Link ──
  statusToken: { type: String, unique: true, sparse: true },

  // ── Import tracking ──
  importBatchId: String,
  importRowNumber: Number,
  isDuplicate: { type: Boolean, default: false },
  duplicateOf: { type: mongoose.Schema.Types.ObjectId, ref: 'Candidate' },

}, { timestamps: true });

// Auto-generate candidateId before save
candidateSchema.pre('save', async function(next) {
  if (!this.candidateId) {
    const count = await this.constructor.countDocuments();
    const year = new Date().getFullYear();
    this.candidateId = `INV-${year}-${String(count + 1).padStart(5, '0')}`;
  }
  // Split name
  if (this.fullName && !this.firstName) {
    const parts = this.fullName.trim().split(/\s+/);
    this.firstName = parts[0];
    this.lastName = parts.slice(1).join(' ') || '';
  }
  // Generate referral code
  if (!this.referralCode && this.firstName) {
    const rand = Math.floor(1000 + Math.random() * 9000);
    this.referralCode = `REF-${this.firstName.toUpperCase().slice(0,4)}-${rand}`;
  }
  // Generate status token
  if (!this.statusToken) {
    this.statusToken = require('crypto').randomBytes(20).toString('hex');
  }
  // Calculate combined score
  const preNorm = this.preScreenScore || 0;
  const intNorm = this.interviewScore ? (this.interviewScore / 60) * 100 : 0;
  const quizNorm = this.quizScore ? (this.quizScore / 20) * 100 : 0;
  this.combinedScore = Math.round(preNorm * 0.3 + intNorm * 0.5 + quizNorm * 0.2);
  next();
});

// Indexes for performance
candidateSchema.index({ status: 1, assignedTeam: 1 });
candidateSchema.index({ combinedScore: -1 });
candidateSchema.index({ 'currentLocation.city': 1 });
candidateSchema.index({ source: 1 });
candidateSchema.index({ createdAt: -1 });
candidateSchema.index({ panelDecision: 1, combinedScore: -1 });

module.exports = mongoose.model('Candidate', candidateSchema);
