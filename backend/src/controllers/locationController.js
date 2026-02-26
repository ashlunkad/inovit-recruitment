const { DeploymentLocation, Candidate } = require('../models');

exports.getLocations = async (req, res) => {
  try {
    const locations = await DeploymentLocation.find({ isActive: true }).sort('name');
    res.json({ locations });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

exports.createLocation = async (req, res) => {
  try {
    const location = new DeploymentLocation(req.body);
    await location.save();
    res.status(201).json({ location });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

exports.updateLocation = async (req, res) => {
  try {
    const location = await DeploymentLocation.findByIdAndUpdate(req.params.id, req.body, { new: true });
    if (!location) return res.status(404).json({ error: 'Location not found' });
    res.json({ location });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

exports.getQuotaDashboard = async (req, res) => {
  try {
    const locations = await DeploymentLocation.find({ isActive: true }).sort('name');
    const totalQuota = locations.reduce((s, l) => s + l.quota, 0);
    const totalDeployed = locations.reduce((s, l) => s + l.deployed, 0);
    const totalPipeline = locations.reduce((s, l) => s + l.selected + l.offered + l.accepted + l.inTraining, 0);

    res.json({
      locations,
      summary: { totalQuota, totalDeployed, totalPipeline, remaining: totalQuota - totalDeployed, progressPercent: Math.round((totalDeployed / totalQuota) * 100) },
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};
