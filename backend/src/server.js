require('dotenv').config();
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const path = require('path');
const http = require('http');
const { Server } = require('socket.io');
const connectDB = require('./config/db');
const routes = require('./routes');

const app = express();
const server = http.createServer(app);

// Socket.io for real-time updates
const io = new Server(server, {
  cors: { origin: '*', methods: ['GET', 'POST'] }
});

// Middleware
app.use(helmet({ crossOriginResourcePolicy: { policy: 'cross-origin' } }));
// CORS - allow frontend origins
const allowedOrigins = [
  process.env.CLIENT_URL || 'http://localhost:5173',
  'http://localhost:5173',
  'http://localhost:3000',
].filter(Boolean);

app.use(cors({ 
  origin: function(origin, callback) {
    if (!origin || allowedOrigins.some(o => origin.startsWith(o)) || origin.includes('onrender.com') || origin.includes('vercel.app') || origin.includes('netlify.app')) {
      callback(null, true);
    } else {
      callback(null, true); // Allow all in production for now
    }
  },
  credentials: true 
}));
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));
app.use(morgan('dev'));

// Static files for uploads
app.use('/uploads', express.static(path.join(__dirname, '../uploads')));

// API Routes
app.use('/api', routes);

// Health check
app.get('/health', (req, res) => res.json({ status: 'ok', timestamp: new Date() }));

// Seed endpoint (one-time use to populate demo data via browser)
app.get('/api/seed-demo-data', async (req, res) => {
  try {
    const { User, Candidate, DeploymentLocation, Timeline } = require('./models');
    const existing = await User.countDocuments();
    if (existing > 0) return res.json({ message: 'Data already seeded. Delete collections first to re-seed.', users: existing });

    // Create users
    const users = await User.create([
      { name: 'Admin User', email: 'admin@inovit.in', password: 'admin123', role: 'super_admin', team: null, phone: '9999900000', languages: ['en', 'hi'] },
      { name: 'Rajesh Kumar', email: 'rajesh@inovit.in', password: 'pass123', role: 'team_lead', team: 'Alpha', phone: '9999900001', languages: ['hi', 'en'] },
      { name: 'Priya Sharma', email: 'priya@inovit.in', password: 'pass123', role: 'agent', team: 'Alpha', phone: '9999900002', languages: ['hi', 'en'] },
      { name: 'Amit Singh', email: 'amit@inovit.in', password: 'pass123', role: 'agent', team: 'Beta', phone: '9999900003', languages: ['hi'] },
      { name: 'Sunita Patel', email: 'sunita@inovit.in', password: 'pass123', role: 'telecaller', team: 'Alpha', phone: '9999900004', languages: ['hi', 'en'] },
      { name: 'Ravi Verma', email: 'ravi@inovit.in', password: 'pass123', role: 'interviewer', team: null, phone: '9999900005', languages: ['hi', 'en'] },
    ]);

    const locations = await DeploymentLocation.create([
      { name: 'Delhi NCR', city: 'New Delhi', state: 'Delhi', quota: 80, deployed: 12, accepted: 8, offered: 5, selected: 10 },
      { name: 'Mumbai', city: 'Mumbai', state: 'Maharashtra', quota: 70, deployed: 8, accepted: 5, offered: 3, selected: 7 },
      { name: 'Chennai', city: 'Chennai', state: 'Tamil Nadu', quota: 60, deployed: 5, accepted: 3, offered: 4, selected: 6 },
      { name: 'Bengaluru', city: 'Bengaluru', state: 'Karnataka', quota: 55, deployed: 4, accepted: 4, offered: 2, selected: 5 },
      { name: 'Hyderabad', city: 'Hyderabad', state: 'Telangana', quota: 50, deployed: 3, accepted: 2, offered: 3, selected: 4 },
      { name: 'Kolkata', city: 'Kolkata', state: 'West Bengal', quota: 45, deployed: 2, accepted: 2, offered: 1, selected: 3 },
      { name: 'Pune', city: 'Pune', state: 'Maharashtra', quota: 40, deployed: 3, accepted: 1, offered: 2, selected: 2 },
      { name: 'Lucknow', city: 'Lucknow', state: 'Uttar Pradesh', quota: 35, deployed: 1, accepted: 1, offered: 1, selected: 2 },
      { name: 'Jaipur', city: 'Jaipur', state: 'Rajasthan', quota: 35, deployed: 0, accepted: 1, offered: 1, selected: 1 },
      { name: 'Ahmedabad', city: 'Ahmedabad', state: 'Gujarat', quota: 30, deployed: 0, accepted: 0, offered: 1, selected: 1 },
    ]);

    const statuses = ['New','Interested','Screening','Portal_Applied','Interview_Scheduled','Interview_Done','Selected','Rejected','Offered','Offer_Accepted','Onboarding','Training','Deployed'];
    const quals = ['ITI_Electrical','ITI_Other','Diploma_Electrical','BTech_Electrical','HSC','10th'];
    const sources = ['Excel','CSV','Walk_In','Manual','Referral'];
    const fNames = ['Rahul','Vikram','Suresh','Anil','Deepak','Manoj','Ravi','Sanjay','Kiran','Ajay','Vikas','Pankaj','Rohit','Sachin','Nitin','Gaurav','Ashok','Ramesh','Mohit','Tushar'];
    const lNames = ['Kumar','Singh','Sharma','Verma','Patel','Yadav','Mishra','Gupta','Jha','Thakur'];
    const cities = ['Delhi','Mumbai','Chennai','Kolkata','Lucknow','Jaipur','Pune','Hyderabad','Bengaluru','Ahmedabad'];

    const candidates = [];
    for (let i = 0; i < 75; i++) {
      const fn = fNames[i % fNames.length], ln = lNames[i % lNames.length];
      const status = statuses[Math.floor(Math.random()*statuses.length)];
      const preScreen = Math.floor(Math.random()*60)+30;
      const intScore = ['New','Interested','Screening'].includes(status) ? 0 : Math.floor(Math.random()*30)+25;
      const quiz = ['New','Interested'].includes(status) ? 0 : Math.floor(Math.random()*15)+5;
      candidates.push({
        fullName: `${fn} ${ln}`, phone: `${7000000000+i}`,
        qualification: quals[i%quals.length], experienceYears: Math.floor(Math.random()*10),
        electricalTrade: i%3===0, currentLocation: { city: cities[i%cities.length], state: 'State' },
        preferredLocation: locations[i%locations.length]._id, source: sources[i%sources.length],
        status, preScreenScore: preScreen, interviewScore: intScore, quizScore: quiz,
        assignedAgent: users[i%3+1]._id, assignedTeam: i%2===0?'Alpha':'Beta',
        preferredLanguage: 'hi', preferredContact: 'whatsapp', consentCaptured: true,
        whatsappStatus: ['delivered','read','sent'][i%3],
        panelDecision: ['Selected','Offered','Offer_Accepted','Deployed','Training'].includes(status)?'Selected':status==='Rejected'?'Rejected':'Pending',
      });
    }
    await Candidate.create(candidates);

    res.json({ success: true, message: 'Demo data loaded!', users: users.length, locations: locations.length, candidates: candidates.length });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Socket.io connections
io.on('connection', (socket) => {
  console.log('Client connected:', socket.id);

  socket.on('join-candidate', (candidateId) => {
    socket.join(`candidate-${candidateId}`);
  });

  socket.on('leave-candidate', (candidateId) => {
    socket.leave(`candidate-${candidateId}`);
  });

  socket.on('disconnect', () => {
    console.log('Client disconnected:', socket.id);
  });
});

// Make io accessible to routes
app.set('io', io);

// Error handler
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ error: 'Internal server error' });
});

// Start
const PORT = process.env.PORT || 5000;
connectDB().then(() => {
  server.listen(PORT, () => {
    console.log(`\n🚀 INOVIT Recruitment Server running on port ${PORT}`);
    console.log(`   API: http://localhost:${PORT}/api`);
    console.log(`   Health: http://localhost:${PORT}/health\n`);
  });
});
