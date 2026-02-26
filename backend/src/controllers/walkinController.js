const { Candidate, DeploymentLocation } = require('../models');
const TimelineService = require('../services/timelineService');

// Public: Get registration form data (locations, etc.)
exports.getFormData = async (req, res) => {
  try {
    const locations = await DeploymentLocation.find({ isActive: true })
      .select('name city state')
      .sort('name');
    const availableLocations = locations.filter(l => l.remaining > 0);

    res.json({
      company: 'INOVIT Solutions Private Limited',
      position: 'Junior Electrician - Smart Meter Installation',
      locations: availableLocations,
      qualifications: [
        { value: 'ITI_Electrical', label: 'ITI - Electrical' },
        { value: 'ITI_Other', label: 'ITI - Other Trade' },
        { value: 'Diploma_Electrical', label: 'Diploma - Electrical' },
        { value: 'Diploma_Other', label: 'Diploma - Other' },
        { value: 'BTech_Electrical', label: 'B.Tech - Electrical' },
        { value: 'BTech_Other', label: 'B.Tech - Other' },
        { value: 'BSc', label: 'B.Sc' },
        { value: 'HSC', label: '12th / HSC' },
        { value: '10th', label: '10th' },
        { value: 'Other', label: 'Other' },
      ],
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// Public: Submit walk-in registration
exports.register = async (req, res) => {
  try {
    const {
      fullName, phone, qualification, experienceYears,
      currentCity, currentState, preferredLocation,
      hearAboutUs, referralCode, consent
    } = req.body;

    if (!fullName || !phone || !consent) {
      return res.status(400).json({ error: 'Name, phone, and consent are required' });
    }

    // Clean phone
    let cleanPhone = phone.replace(/[\s\-\+\(\)]/g, '');
    if (cleanPhone.startsWith('91') && cleanPhone.length === 12) cleanPhone = cleanPhone.slice(2);
    if (cleanPhone.length !== 10) return res.status(400).json({ error: 'Please enter a valid 10-digit mobile number' });

    // Check duplicate
    const existing = await Candidate.findOne({ phone: cleanPhone });
    if (existing) {
      if (existing.blacklisted) return res.status(400).json({ error: 'This application cannot be processed. Please contact HR.' });
      return res.status(400).json({ error: 'This phone number is already registered. You will receive a WhatsApp message with your status.', candidateId: existing.candidateId });
    }

    // Check referral
    let referredBy = null;
    if (referralCode) {
      const referrer = await Candidate.findOne({ referralCode: referralCode.toUpperCase() });
      if (referrer) referredBy = referrer._id;
    }

    // Walk-in location from query param
    const walkInLocation = req.query.location || req.body.walkInLocation || 'direct-link';

    const candidate = new Candidate({
      fullName,
      phone: cleanPhone,
      qualification: qualification || 'Other',
      experienceYears: parseInt(experienceYears) || 0,
      currentLocation: { city: currentCity || '', state: currentState || '' },
      preferredLocation: preferredLocation || null,
      source: 'Walk_In',
      walkInLocation,
      hearAboutUs,
      referredBy,
      status: 'Walk_In_Registered',
      consentCaptured: true,
      consentCapturedAt: new Date(),
      consentChannel: 'walk_in_form',
    });

    await candidate.save();

    await TimelineService.addEvent(candidate._id, 'system_event', {
      channel: 'system',
      content: `Walk-in registration from ${walkInLocation}`,
    });

    res.status(201).json({
      success: true,
      message: 'Registration successful! You will receive a WhatsApp message shortly.',
      candidateId: candidate.candidateId,
    });
  } catch (err) {
    if (err.code === 11000) return res.status(400).json({ error: 'This phone number is already registered' });
    res.status(500).json({ error: err.message });
  }
};

// Public: Check status by token
exports.checkStatus = async (req, res) => {
  try {
    const { token } = req.params;
    const candidate = await Candidate.findOne({ statusToken: token })
      .select('fullName candidateId status statusHistory interviewScheduled trainingStatus documents panelDecision')
      .populate('preferredLocation', 'name city');

    if (!candidate) return res.status(404).json({ error: 'Invalid status link' });

    const stages = [
      { key: 'application', label: 'Application', icon: '📝' },
      { key: 'screening', label: 'Screening', icon: '🔍' },
      { key: 'interview', label: 'Interview', icon: '🎤' },
      { key: 'selection', label: 'Selection', icon: '✅' },
      { key: 'offer', label: 'Offer', icon: '📨' },
      { key: 'training', label: 'Training', icon: '📚' },
      { key: 'deployment', label: 'Deployment', icon: '🚀' },
    ];

    // Determine current stage
    const statusStageMap = {
      'New': 0, 'Walk_In_Registered': 0, 'Contacted': 0, 'Interested': 1, 'Screening': 1, 'Screened': 1,
      'Portal_Applied': 1, 'Interview_Scheduled': 2, 'Interview_Done': 2,
      'Selected': 3, 'On_Hold': 3, 'Rejected': 3,
      'Offered': 4, 'Offer_Accepted': 4,
      'Onboarding': 5, 'Training': 5, 'Training_Completed': 5,
      'Deployed': 6,
    };

    const currentStage = statusStageMap[candidate.status] ?? 0;
    const docsTotal = 10;
    const docsVerified = (candidate.documents || []).filter(d => d.verified).length;

    res.json({
      name: candidate.fullName,
      candidateId: candidate.candidateId,
      currentStage,
      stages,
      status: candidate.status,
      details: {
        interviewDate: candidate.interviewScheduled,
        trainingStatus: candidate.trainingStatus,
        documentsVerified: `${docsVerified} of ${docsTotal}`,
      },
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};
