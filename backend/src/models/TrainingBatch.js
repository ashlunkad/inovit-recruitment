const mongoose = require('mongoose');

const trainingBatchSchema = new mongoose.Schema({
  batchCode: { type: String, unique: true }, // e.g., TB-DEL-001
  location: { type: mongoose.Schema.Types.ObjectId, ref: 'DeploymentLocation', required: true },
  startDate: { type: Date, required: true },
  endDate: { type: Date, required: true },
  trainerName: String,
  trainerPhone: String,
  venue: String,
  maxCapacity: { type: Number, default: 30 },
  candidates: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Candidate' }],
  status: { type: String, enum: ['upcoming', 'in_progress', 'completed', 'cancelled'], default: 'upcoming' },
  results: {
    totalEnrolled: { type: Number, default: 0 },
    day1Attendance: { type: Number, default: 0 },
    day2Attendance: { type: Number, default: 0 },
    day3Attendance: { type: Number, default: 0 },
    passed: { type: Number, default: 0 },
    failed: { type: Number, default: 0 },
  }
}, { timestamps: true });

module.exports = mongoose.model('TrainingBatch', trainingBatchSchema);
