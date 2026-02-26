const { CallLog, Candidate } = require('../models');
const TimelineService = require('../services/timelineService');

// Log a call (outbound or inbound)
exports.logCall = async (req, res) => {
  try {
    const {
      candidateId, direction, phoneDialed, outcome, summary,
      followUpAction, callbackAt, interviewScheduledAt,
      durationSeconds, recordingUrl, isUnknownCaller,
      unknownCallerName, unknownCallerNotes
    } = req.body;

    const callLog = new CallLog({
      candidate: candidateId || null,
      agent: req.user._id,
      direction,
      phoneDialed,
      durationSeconds: durationSeconds || 0,
      recordingUrl,
      outcome,
      summary,
      followUpAction,
      callbackAt: callbackAt ? new Date(callbackAt) : null,
      interviewScheduledAt: interviewScheduledAt ? new Date(interviewScheduledAt) : null,
      isUnknownCaller: isUnknownCaller || false,
      unknownCallerName,
      unknownCallerNotes,
    });
    await callLog.save();

    // Add to candidate timeline if candidate exists
    if (candidateId) {
      if (direction === 'outbound') {
        await TimelineService.callOutbound(candidateId, {
          summary, durationSeconds, recordingUrl, outcome
        }, req.user._id, req.user.name);
      } else {
        await TimelineService.callInbound(candidateId, {
          summary, durationSeconds, recordingUrl, outcome
        }, req.user._id, req.user.name);
      }

      // Update candidate status if needed
      if (followUpAction === 'Schedule_Interview' && interviewScheduledAt) {
        await Candidate.findByIdAndUpdate(candidateId, {
          interviewScheduled: new Date(interviewScheduledAt),
          status: 'Interview_Scheduled',
          $push: { statusHistory: {
            status: 'Interview_Scheduled',
            changedBy: req.user._id,
            changedAt: new Date(),
            reason: `Interview scheduled via ${direction} call`
          }}
        });
      }
    }

    res.status(201).json({ callLog });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// Get call queue for telecaller
exports.getCallQueue = async (req, res) => {
  try {
    // Build queue from different sources
    const now = new Date();

    // 1. Scheduled callbacks for today
    const callbacks = await CallLog.find({
      agent: req.user._id,
      followUpAction: 'Callback_Scheduled',
      callbackAt: { $lte: new Date(now.getTime() + 24 * 60 * 60 * 1000), $gte: new Date(now.setHours(0,0,0,0)) }
    }).populate('candidate', 'fullName phone status candidateId');

    // 2. WhatsApp failed candidates
    const whatsappFailed = await Candidate.find({
      whatsappStatus: 'failed_2',
      status: { $nin: ['Rejected', 'Blacklisted', 'Archived', 'Deployed'] },
      assignedTeam: req.user.team,
    }).select('fullName phone status candidateId').limit(20);

    // 3. Offer follow-ups (offered 24h+ ago, no acceptance)
    const offerFollowups = await Candidate.find({
      status: 'Offered',
      offerSentAt: { $lte: new Date(Date.now() - 24 * 60 * 60 * 1000) },
    }).select('fullName phone status candidateId offerSentAt').limit(20);

    // 4. No WhatsApp response for 48h+
    const noResponse = await Candidate.find({
      status: { $in: ['Contacted', 'Interested'] },
      whatsappStatus: { $in: ['delivered', 'read'] },
      updatedAt: { $lte: new Date(Date.now() - 48 * 60 * 60 * 1000) },
      assignedTeam: req.user.team,
    }).select('fullName phone status candidateId').limit(20);

    // 5. Document reminders
    const docReminders = await Candidate.find({
      status: 'Onboarding',
      'documents.status': 'pending',
      updatedAt: { $lte: new Date(Date.now() - 48 * 60 * 60 * 1000) },
    }).select('fullName phone status candidateId').limit(10);

    const queue = [
      ...callbacks.map(c => ({ ...c.toObject(), priority: 1, reason: 'Scheduled Callback', queueTime: c.callbackAt })),
      ...offerFollowups.map(c => ({ ...c.toObject(), priority: 2, reason: 'Offer Follow-up' })),
      ...whatsappFailed.map(c => ({ ...c.toObject(), priority: 3, reason: 'WhatsApp Failed (2x)' })),
      ...noResponse.map(c => ({ ...c.toObject(), priority: 4, reason: 'No Response 48h+' })),
      ...docReminders.map(c => ({ ...c.toObject(), priority: 5, reason: 'Document Reminder' })),
    ];

    res.json({ queue, counts: {
      callbacks: callbacks.length,
      offerFollowups: offerFollowups.length,
      whatsappFailed: whatsappFailed.length,
      noResponse: noResponse.length,
      docReminders: docReminders.length,
      total: queue.length,
    }});
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// Get call history for an agent
exports.getAgentCalls = async (req, res) => {
  try {
    const { page = 1, limit = 25, direction, outcome } = req.query;
    const query = { agent: req.user._id };
    if (direction) query.direction = direction;
    if (outcome) query.outcome = outcome;

    const total = await CallLog.countDocuments(query);
    const calls = await CallLog.find(query)
      .sort('-createdAt')
      .skip((page - 1) * limit)
      .limit(Number(limit))
      .populate('candidate', 'fullName phone candidateId status');

    res.json({ calls, pagination: { total, page: Number(page), limit: Number(limit), pages: Math.ceil(total / limit) } });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// Get telecaller stats
exports.getTelecallerStats = async (req, res) => {
  try {
    const today = new Date(); today.setHours(0,0,0,0);
    const agentId = req.params.agentId || req.user._id;

    const todayCalls = await CallLog.countDocuments({ agent: agentId, createdAt: { $gte: today } });
    const todayConnected = await CallLog.countDocuments({
      agent: agentId, createdAt: { $gte: today },
      outcome: { $in: ['Connected_Positive', 'Connected_Negative', 'Connected_Callback', 'Connected_Info', 'Connected_Escalation'] }
    });
    const avgDuration = await CallLog.aggregate([
      { $match: { agent: agentId, createdAt: { $gte: today }, durationSeconds: { $gt: 0 } } },
      { $group: { _id: null, avg: { $avg: '$durationSeconds' } } }
    ]);

    const outcomeBreakdown = await CallLog.aggregate([
      { $match: { agent: agentId, createdAt: { $gte: today } } },
      { $group: { _id: '$outcome', count: { $sum: 1 } } }
    ]);

    res.json({
      todayCalls,
      todayConnected,
      connectRate: todayCalls ? Math.round((todayConnected / todayCalls) * 100) : 0,
      avgDurationSeconds: Math.round(avgDuration[0]?.avg || 0),
      outcomeBreakdown,
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};
