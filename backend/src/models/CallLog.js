const mongoose = require('mongoose');
const { CALL_DIRECTION, CALL_OUTCOME, CALL_FOLLOWUP } = require('../config/constants');

const callLogSchema = new mongoose.Schema({
  candidate: { type: mongoose.Schema.Types.ObjectId, ref: 'Candidate', index: true },
  agent: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  direction: { type: String, enum: CALL_DIRECTION, required: true },
  phoneDialed: { type: String, required: true },
  startedAt: { type: Date, default: Date.now },
  endedAt: Date,
  durationSeconds: { type: Number, default: 0 },
  recordingUrl: String,
  outcome: { type: String, enum: CALL_OUTCOME },
  summary: { type: String },
  followUpAction: { type: String, enum: CALL_FOLLOWUP },
  callbackAt: Date,
  interviewScheduledAt: Date,
  queueReason: String, // why this call was in queue
  // For unknown callers
  isUnknownCaller: { type: Boolean, default: false },
  unknownCallerName: String,
  unknownCallerNotes: String,
}, { timestamps: true });

callLogSchema.index({ agent: 1, createdAt: -1 });
callLogSchema.index({ candidate: 1, createdAt: -1 });

module.exports = mongoose.model('CallLog', callLogSchema);
