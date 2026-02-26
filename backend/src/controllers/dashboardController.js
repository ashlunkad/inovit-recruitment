const { Candidate, CallLog, Timeline, DeploymentLocation } = require('../models');

exports.getDashboardStats = async (req, res) => {
  try {
    const total = await Candidate.countDocuments();
    const today = new Date(); today.setHours(0,0,0,0);
    const todayNew = await Candidate.countDocuments({ createdAt: { $gte: today } });

    // Pipeline funnel
    const pipeline = await Candidate.aggregate([
      { $group: { _id: '$status', count: { $sum: 1 } } },
      { $sort: { count: -1 } }
    ]);

    // Source breakdown
    const sources = await Candidate.aggregate([
      { $group: { _id: '$source', count: { $sum: 1 } } }
    ]);

    // Today's activity
    const todayCalls = await CallLog.countDocuments({ createdAt: { $gte: today } });
    const todayMessages = await Timeline.countDocuments({
      createdAt: { $gte: today },
      eventType: { $in: ['whatsapp_out', 'whatsapp_in'] }
    });

    // Deployment progress
    const locations = await DeploymentLocation.find({ isActive: true });
    const totalQuota = locations.reduce((s, l) => s + l.quota, 0);
    const totalDeployed = locations.reduce((s, l) => s + l.deployed, 0);

    // Score distribution
    const scoreDistribution = await Candidate.aggregate([
      { $match: { combinedScore: { $gt: 0 } } },
      { $bucket: {
        groupBy: '$combinedScore',
        boundaries: [0, 30, 50, 60, 70, 80, 90, 101],
        default: 'Other',
        output: { count: { $sum: 1 } }
      }}
    ]);

    // WhatsApp delivery stats
    const whatsappStats = await Candidate.aggregate([
      { $group: { _id: '$whatsappStatus', count: { $sum: 1 } } }
    ]);

    // Recent activity (last 10)
    const recentActivity = await Timeline.find()
      .sort('-createdAt')
      .limit(10)
      .populate('candidate', 'fullName candidateId')
      .populate('createdBy', 'name');

    res.json({
      overview: { total, todayNew, target: 500, deployed: totalDeployed, progressPercent: Math.round((totalDeployed / 500) * 100) },
      pipeline,
      sources,
      activity: { todayCalls, todayMessages },
      locations,
      scoreDistribution,
      whatsappStats,
      recentActivity,
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};
