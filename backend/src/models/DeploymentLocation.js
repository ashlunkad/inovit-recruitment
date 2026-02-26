const mongoose = require('mongoose');

const deploymentLocationSchema = new mongoose.Schema({
  name: { type: String, required: true, unique: true },
  city: { type: String, required: true },
  state: { type: String, required: true },
  address: String,
  coordinates: { lat: Number, lng: Number },
  quota: { type: Number, required: true, min: 0 },
  selected: { type: Number, default: 0 },
  offered: { type: Number, default: 0 },
  accepted: { type: Number, default: 0 },
  inTraining: { type: Number, default: 0 },
  deployed: { type: Number, default: 0 },
  supervisorName: String,
  supervisorPhone: String,
  isActive: { type: Boolean, default: true },
}, { timestamps: true });

deploymentLocationSchema.virtual('remaining').get(function() {
  return this.quota - this.deployed;
});

deploymentLocationSchema.virtual('pipeline').get(function() {
  return this.selected + this.offered + this.accepted + this.inTraining;
});

deploymentLocationSchema.set('toJSON', { virtuals: true });
deploymentLocationSchema.set('toObject', { virtuals: true });

module.exports = mongoose.model('DeploymentLocation', deploymentLocationSchema);
