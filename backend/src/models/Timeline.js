const mongoose = require('mongoose');
const { TIMELINE_EVENT } = require('../config/constants');

const timelineSchema = new mongoose.Schema({
  candidate: { type: mongoose.Schema.Types.ObjectId, ref: 'Candidate', required: true, index: true },
  eventType: { type: String, enum: TIMELINE_EVENT, required: true },
  channel: { type: String, enum: ['whatsapp', 'call', 'sms', 'email', 'portal', 'system', 'manual'] },
  direction: { type: String, enum: ['in', 'out', null] },
  content: { type: String }, // message text, note text, etc.
  metadata: { type: mongoose.Schema.Types.Mixed, default: {} },
  // For calls
  callDuration: Number,
  callRecordingUrl: String,
  callOutcome: String,
  // For status changes
  oldStatus: String,
  newStatus: String,
  // For documents
  documentType: String,
  documentAction: String,
  // For scores
  scoreType: String,
  oldValue: mongoose.Schema.Types.Mixed,
  newValue: mongoose.Schema.Types.Mixed,
  // Actor
  createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  createdByName: String,
  isSystem: { type: Boolean, default: false },
  isPinned: { type: Boolean, default: false },
}, { timestamps: true });

timelineSchema.index({ candidate: 1, createdAt: -1 });
timelineSchema.index({ candidate: 1, eventType: 1 });

module.exports = mongoose.model('Timeline', timelineSchema);
