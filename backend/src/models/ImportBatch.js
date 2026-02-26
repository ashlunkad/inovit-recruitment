const mongoose = require('mongoose');

const importBatchSchema = new mongoose.Schema({
  fileName: { type: String, required: true },
  fileType: { type: String, enum: ['excel', 'csv', 'gsheet', 'manual'], required: true },
  uploadedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  columnMapping: { type: mongoose.Schema.Types.Mixed }, // user's column mapping choices
  totalRows: { type: Number, default: 0 },
  importedRows: { type: Number, default: 0 },
  duplicateRows: { type: Number, default: 0 },
  errorRows: { type: Number, default: 0 },
  blacklistedRows: { type: Number, default: 0 },
  errors: [{ row: Number, field: String, message: String }],
  status: { type: String, enum: ['uploading', 'mapping', 'processing', 'completed', 'failed'], default: 'uploading' },
  completedAt: Date,
}, { timestamps: true });

module.exports = mongoose.model('ImportBatch', importBatchSchema);
