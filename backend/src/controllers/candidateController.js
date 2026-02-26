const { Candidate, DeploymentLocation, Timeline } = require('../models');
const TimelineService = require('../services/timelineService');

// Get all candidates with filters, pagination, sorting
exports.getCandidates = async (req, res) => {
  try {
    const {
      page = 1, limit = 25, sort = '-createdAt',
      status, source, qualification, team, agent,
      search, minScore, maxScore, location, panelDecision,
      fromDate, toDate
    } = req.query;

    const query = {};
    if (status) query.status = Array.isArray(status) ? { $in: status } : status;
    if (source) query.source = source;
    if (qualification) query.qualification = qualification;
    if (team) query.assignedTeam = team;
    if (agent) query.assignedAgent = agent;
    if (panelDecision) query.panelDecision = panelDecision;
    if (location) query.preferredLocation = location;
    if (minScore) query.combinedScore = { ...query.combinedScore, $gte: Number(minScore) };
    if (maxScore) query.combinedScore = { ...query.combinedScore, $lte: Number(maxScore) };
    if (fromDate) query.createdAt = { ...query.createdAt, $gte: new Date(fromDate) };
    if (toDate) query.createdAt = { ...query.createdAt, $lte: new Date(toDate) };
    if (search) {
      query.$or = [
        { fullName: { $regex: search, $options: 'i' } },
        { phone: { $regex: search } },
        { candidateId: { $regex: search, $options: 'i' } },
        { email: { $regex: search, $options: 'i' } },
      ];
    }

    const total = await Candidate.countDocuments(query);
    const candidates = await Candidate.find(query)
      .sort(sort)
      .skip((Number(page) - 1) * Number(limit))
      .limit(Number(limit))
      .populate('preferredLocation', 'name city quota deployed')
      .populate('assignedAgent', 'name')
      .populate('interviewer', 'name')
      .lean();

    res.json({
      candidates,
      pagination: {
        total, page: Number(page), limit: Number(limit),
        pages: Math.ceil(total / Number(limit))
      }
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// Get single candidate with full details
exports.getCandidate = async (req, res) => {
  try {
    const candidate = await Candidate.findById(req.params.id)
      .populate('preferredLocation')
      .populate('offerLocation')
      .populate('deploymentLocation')
      .populate('assignedAgent', 'name email phone')
      .populate('interviewer', 'name email')
      .populate('referredBy', 'fullName phone candidateId');

    if (!candidate) return res.status(404).json({ error: 'Candidate not found' });

    // Get timeline
    const timeline = await TimelineService.getTimeline(candidate._id, { limit: 100 });

    res.json({ candidate, timeline });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// Create candidate (manual entry / walk-in)
exports.createCandidate = async (req, res) => {
  try {
    // Check duplicate phone
    const exists = await Candidate.findOne({ phone: req.body.phone });
    if (exists) return res.status(400).json({ error: 'Phone number already registered', existing: exists.candidateId });

    // Check blacklist
    if (exists?.blacklisted) return res.status(400).json({ error: 'This phone number is blacklisted' });

    const candidate = new Candidate({
      ...req.body,
      consentCaptured: true,
      consentCapturedAt: new Date(),
      consentChannel: req.body.source === 'Walk_In' ? 'walk_in_form' : 'manual_entry',
    });
    await candidate.save();

    await TimelineService.addEvent(candidate._id, 'system_event', {
      channel: 'system',
      content: `Candidate registered via ${candidate.source}`,
      createdByName: req.user?.name || 'System',
    }, req.user?._id);

    res.status(201).json({ candidate });
  } catch (err) {
    if (err.code === 11000) return res.status(400).json({ error: 'Duplicate entry: phone or candidateId already exists' });
    res.status(500).json({ error: err.message });
  }
};

// Update candidate
exports.updateCandidate = async (req, res) => {
  try {
    const old = await Candidate.findById(req.params.id);
    if (!old) return res.status(404).json({ error: 'Candidate not found' });

    // Track status change
    if (req.body.status && req.body.status !== old.status) {
      req.body.statusHistory = [...(old.statusHistory || []), {
        status: req.body.status,
        changedBy: req.user._id,
        changedAt: new Date(),
        reason: req.body.statusChangeReason || ''
      }];
      await TimelineService.statusChange(old._id, old.status, req.body.status, req.user._id, req.user.name, req.body.statusChangeReason);
    }

    const candidate = await Candidate.findByIdAndUpdate(req.params.id, req.body, { new: true, runValidators: true });
    res.json({ candidate });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// Panel decision (Select / Reject / Hold)
exports.panelDecision = async (req, res) => {
  try {
    const { decision, reason, comments, offerSalary, offerLocationId, offerJoiningDate } = req.body;
    const candidate = await Candidate.findById(req.params.id);
    if (!candidate) return res.status(404).json({ error: 'Candidate not found' });

    candidate.panelDecision = decision;
    candidate.panelDecisionBy = req.user._id;
    candidate.panelDecisionAt = new Date();
    candidate.panelDecisionReason = reason;
    candidate.panelDecisionComments = comments;

    if (decision === 'Selected') {
      candidate.status = 'Selected';
      if (offerSalary) candidate.offerSalary = offerSalary;
      if (offerLocationId) {
        candidate.offerLocation = offerLocationId;
        // Update location counter
        await DeploymentLocation.findByIdAndUpdate(offerLocationId, { $inc: { selected: 1 } });
      }
      if (offerJoiningDate) candidate.offerJoiningDate = new Date(offerJoiningDate);
    } else if (decision === 'Rejected') {
      candidate.status = 'Rejected';
    } else if (decision === 'On_Hold') {
      candidate.status = 'On_Hold';
    }

    candidate.statusHistory.push({
      status: candidate.status,
      changedBy: req.user._id,
      changedAt: new Date(),
      reason: `Panel: ${decision} - ${reason || comments}`
    });

    await candidate.save();
    await TimelineService.panelDecision(candidate._id, decision, comments || reason, req.user._id, req.user.name);

    res.json({ candidate });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// Bulk panel decisions
exports.bulkPanelDecision = async (req, res) => {
  try {
    const { candidateIds, decision, reason, comments } = req.body;
    if (!candidateIds?.length) return res.status(400).json({ error: 'No candidates selected' });

    const results = { success: 0, failed: 0, errors: [] };
    for (const id of candidateIds) {
      try {
        const candidate = await Candidate.findById(id);
        if (!candidate) { results.failed++; results.errors.push({ id, error: 'Not found' }); continue; }

        candidate.panelDecision = decision;
        candidate.panelDecisionBy = req.user._id;
        candidate.panelDecisionAt = new Date();
        candidate.panelDecisionReason = reason;
        candidate.panelDecisionComments = comments;
        candidate.status = decision === 'Selected' ? 'Selected' : decision === 'Rejected' ? 'Rejected' : 'On_Hold';
        candidate.statusHistory.push({
          status: candidate.status, changedBy: req.user._id, changedAt: new Date(),
          reason: `Bulk Panel: ${decision} - ${reason || ''}`
        });
        await candidate.save();
        await TimelineService.panelDecision(candidate._id, decision, `Bulk action: ${comments || reason}`, req.user._id, req.user.name);
        results.success++;
      } catch (e) {
        results.failed++;
        results.errors.push({ id, error: e.message });
      }
    }
    res.json(results);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// Interview scoring
exports.scoreInterview = async (req, res) => {
  try {
    const { technical, practical, communication, experience, locationAvailability, quizNormalized, notes } = req.body;
    const candidate = await Candidate.findById(req.params.id);
    if (!candidate) return res.status(404).json({ error: 'Candidate not found' });

    const oldScore = candidate.interviewScore;
    candidate.interviewBreakdown = { technical, practical, communication, experience, locationAvailability, quizNormalized };
    candidate.interviewScore = technical + practical + communication + experience + locationAvailability + quizNormalized;
    candidate.interviewNotes = notes;
    candidate.status = 'Interview_Done';
    candidate.statusHistory.push({
      status: 'Interview_Done', changedBy: req.user._id, changedAt: new Date(),
      reason: `Interview scored: ${candidate.interviewScore}/60`
    });

    await candidate.save();
    await TimelineService.scoreUpdate(candidate._id, 'Interview Score', oldScore, candidate.interviewScore, req.user._id, req.user.name);

    res.json({ candidate });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// Add note
exports.addNote = async (req, res) => {
  try {
    const { content } = req.body;
    if (!content) return res.status(400).json({ error: 'Note content is required' });
    const event = await TimelineService.note(req.params.id, content, req.user._id, req.user.name);
    res.status(201).json({ event });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// Get pipeline stats
exports.getPipelineStats = async (req, res) => {
  try {
    const stats = await Candidate.aggregate([
      { $group: { _id: '$status', count: { $sum: 1 }, avgScore: { $avg: '$combinedScore' } } },
      { $sort: { count: -1 } }
    ]);

    const sourceStats = await Candidate.aggregate([
      { $group: { _id: '$source', count: { $sum: 1 } } }
    ]);

    const totalDeployed = stats.find(s => s._id === 'Deployed')?.count || 0;
    const totalSelected = stats.find(s => s._id === 'Selected')?.count || 0;

    res.json({
      pipeline: stats,
      sources: sourceStats,
      summary: {
        total: await Candidate.countDocuments(),
        deployed: totalDeployed,
        selected: totalSelected,
        target: 500,
        progressPercent: Math.round((totalDeployed / 500) * 100),
      }
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// Search by phone (for telecaller inbound lookup)
exports.searchByPhone = async (req, res) => {
  try {
    const { phone } = req.query;
    if (!phone) return res.status(400).json({ error: 'Phone number required' });
    const cleaned = phone.replace(/[\s\-\+\(\)]/g, '').slice(-10);
    const candidate = await Candidate.findOne({
      $or: [
        { phone: { $regex: cleaned } },
        { alternatePhone: { $regex: cleaned } }
      ]
    }).populate('preferredLocation assignedAgent interviewer');

    if (!candidate) return res.json({ found: false, candidate: null });

    const timeline = await TimelineService.getTimeline(candidate._id, { limit: 20 });
    res.json({ found: true, candidate, timeline });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};
