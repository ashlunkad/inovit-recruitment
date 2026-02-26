const express = require('express');
const router = express.Router();
const { auth, authorize } = require('../middleware/auth');
const { uploadImport, uploadDocument } = require('../middleware/upload');

const authCtrl = require('../controllers/authController');
const candidateCtrl = require('../controllers/candidateController');
const importCtrl = require('../controllers/importController');
const callCtrl = require('../controllers/callController');
const locationCtrl = require('../controllers/locationController');
const dashboardCtrl = require('../controllers/dashboardController');
const walkinCtrl = require('../controllers/walkinController');

// ── Auth ──
router.post('/auth/login', authCtrl.login);
router.post('/auth/register', auth, authorize('super_admin'), authCtrl.register);
router.get('/auth/me', auth, authCtrl.getMe);
router.put('/auth/profile', auth, authCtrl.updateProfile);
router.get('/users', auth, authorize('super_admin', 'team_lead'), authCtrl.getUsers);
router.put('/users/:id', auth, authorize('super_admin'), authCtrl.updateUser);

// ── Dashboard ──
router.get('/dashboard/stats', auth, dashboardCtrl.getDashboardStats);

// ── Candidates ──
router.get('/candidates', auth, candidateCtrl.getCandidates);
router.get('/candidates/search-phone', auth, candidateCtrl.searchByPhone);
router.get('/candidates/pipeline-stats', auth, candidateCtrl.getPipelineStats);
router.get('/candidates/:id', auth, candidateCtrl.getCandidate);
router.post('/candidates', auth, candidateCtrl.createCandidate);
router.put('/candidates/:id', auth, candidateCtrl.updateCandidate);
router.post('/candidates/:id/panel-decision', auth, authorize('super_admin', 'team_lead'), candidateCtrl.panelDecision);
router.post('/candidates/:id/score-interview', auth, authorize('super_admin', 'team_lead', 'interviewer'), candidateCtrl.scoreInterview);
router.post('/candidates/:id/notes', auth, candidateCtrl.addNote);
router.post('/candidates/bulk-decision', auth, authorize('super_admin', 'team_lead'), candidateCtrl.bulkPanelDecision);

// ── Import ──
router.post('/import/upload', auth, uploadImport.single('file'), importCtrl.uploadFile);
router.post('/import/process', auth, importCtrl.processImport);
router.get('/import/history', auth, importCtrl.getImports);

// ── Telecalling ──
router.post('/calls/log', auth, callCtrl.logCall);
router.get('/calls/queue', auth, callCtrl.getCallQueue);
router.get('/calls/history', auth, callCtrl.getAgentCalls);
router.get('/calls/stats/:agentId?', auth, callCtrl.getTelecallerStats);

// ── Locations ──
router.get('/locations', auth, locationCtrl.getLocations);
router.post('/locations', auth, authorize('super_admin'), locationCtrl.createLocation);
router.put('/locations/:id', auth, authorize('super_admin'), locationCtrl.updateLocation);
router.get('/locations/quota-dashboard', auth, locationCtrl.getQuotaDashboard);

// ── Walk-In (Public routes) ──
router.get('/walkin/form-data', walkinCtrl.getFormData);
router.post('/walkin/register', walkinCtrl.register);
router.get('/status/:token', walkinCtrl.checkStatus);

module.exports = router;
