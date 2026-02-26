require('dotenv').config({ path: require('path').join(__dirname, '../../.env') });
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const { User, Candidate, DeploymentLocation, Timeline } = require('../models');

const seed = async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('Connected to MongoDB');

    // Clear existing
    await User.deleteMany({});
    await Candidate.deleteMany({});
    await DeploymentLocation.deleteMany({});
    await Timeline.deleteMany({});
    console.log('Cleared existing data');

    // ── Users ──
    const users = await User.create([
      { name: 'Admin User', email: 'admin@inovit.in', password: 'admin123', role: 'super_admin', team: null, phone: '9999900000', languages: ['en', 'hi'] },
      { name: 'Rajesh Kumar', email: 'rajesh@inovit.in', password: 'pass123', role: 'team_lead', team: 'Alpha', phone: '9999900001', languages: ['hi', 'en'] },
      { name: 'Priya Sharma', email: 'priya@inovit.in', password: 'pass123', role: 'agent', team: 'Alpha', phone: '9999900002', languages: ['hi', 'en'] },
      { name: 'Amit Singh', email: 'amit@inovit.in', password: 'pass123', role: 'agent', team: 'Beta', phone: '9999900003', languages: ['hi'] },
      { name: 'Sunita Patel', email: 'sunita@inovit.in', password: 'pass123', role: 'telecaller', team: 'Alpha', phone: '9999900004', languages: ['hi', 'en'] },
      { name: 'Ravi Verma', email: 'ravi@inovit.in', password: 'pass123', role: 'interviewer', team: null, phone: '9999900005', languages: ['hi', 'en'] },
    ]);
    console.log(`Created ${users.length} users`);

    // ── Deployment Locations ──
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
    console.log(`Created ${locations.length} deployment locations (Total quota: ${locations.reduce((s,l) => s+l.quota, 0)})`);

    // ── Sample Candidates ──
    const statuses = ['New', 'Interested', 'Screening', 'Portal_Applied', 'Interview_Scheduled', 'Interview_Done', 'Selected', 'Rejected', 'Offered', 'Offer_Accepted', 'Onboarding', 'Training', 'Deployed'];
    const quals = ['ITI_Electrical', 'ITI_Other', 'Diploma_Electrical', 'BTech_Electrical', 'HSC', '10th'];
    const sources = ['Excel', 'CSV', 'Walk_In', 'Manual', 'Referral'];
    const firstNames = ['Rahul', 'Vikram', 'Suresh', 'Anil', 'Deepak', 'Manoj', 'Ravi', 'Sanjay', 'Kiran', 'Ajay', 'Vikas', 'Pankaj', 'Rohit', 'Sachin', 'Nitin', 'Gaurav', 'Ashok', 'Ramesh', 'Mohit', 'Tushar', 'Naveen', 'Prakash', 'Dinesh', 'Sunil', 'Rakesh', 'Arvind', 'Sandeep', 'Yogesh', 'Vijay', 'Hemant'];
    const lastNames = ['Kumar', 'Singh', 'Sharma', 'Verma', 'Patel', 'Yadav', 'Mishra', 'Gupta', 'Jha', 'Thakur', 'Das', 'Nair', 'Reddy', 'Tiwari', 'Pandey', 'Chauhan', 'Rajput', 'Dubey', 'Srivastava', 'Saxena'];
    const cities = ['Delhi', 'Mumbai', 'Chennai', 'Kolkata', 'Lucknow', 'Jaipur', 'Pune', 'Hyderabad', 'Bengaluru', 'Ahmedabad', 'Patna', 'Bhopal', 'Indore', 'Nagpur', 'Kanpur'];

    const candidates = [];
    for (let i = 0; i < 75; i++) {
      const fn = firstNames[Math.floor(Math.random() * firstNames.length)];
      const ln = lastNames[Math.floor(Math.random() * lastNames.length)];
      const status = statuses[Math.floor(Math.random() * statuses.length)];
      const qual = quals[Math.floor(Math.random() * quals.length)];
      const exp = Math.floor(Math.random() * 10);
      const city = cities[Math.floor(Math.random() * cities.length)];
      const loc = locations[Math.floor(Math.random() * locations.length)];
      const preScreen = Math.floor(Math.random() * 60) + 30;
      const intScore = status === 'New' || status === 'Interested' || status === 'Screening' ? 0 : Math.floor(Math.random() * 30) + 25;
      const quiz = status === 'New' || status === 'Interested' ? 0 : Math.floor(Math.random() * 15) + 5;

      candidates.push({
        fullName: `${fn} ${ln}`,
        phone: `${7000000000 + i + Math.floor(Math.random() * 999000000)}`.slice(0,10),
        qualification: qual,
        experienceYears: exp,
        electricalTrade: qual.includes('Electrical'),
        currentLocation: { city, state: 'State' },
        preferredLocation: loc._id,
        source: sources[Math.floor(Math.random() * sources.length)],
        status,
        preScreenScore: preScreen,
        interviewScore: intScore,
        quizScore: quiz,
        assignedAgent: users[Math.floor(Math.random() * 3) + 1]._id,
        assignedTeam: ['Alpha', 'Beta'][Math.floor(Math.random() * 2)],
        preferredLanguage: Math.random() > 0.3 ? 'hi' : 'en',
        preferredContact: 'whatsapp',
        consentCaptured: true,
        consentCapturedAt: new Date(Date.now() - Math.floor(Math.random() * 30) * 24 * 60 * 60 * 1000),
        whatsappStatus: ['delivered', 'read', 'sent'][Math.floor(Math.random() * 3)],
        panelDecision: ['Selected', 'Offered', 'Offer_Accepted', 'Deployed', 'Training'].includes(status) ? 'Selected' : ['Rejected'].includes(status) ? 'Rejected' : 'Pending',
      });
    }

    const created = await Candidate.create(candidates);
    console.log(`Created ${created.length} sample candidates`);

    // Add some timeline events for first 10 candidates
    for (let i = 0; i < Math.min(10, created.length); i++) {
      const c = created[i];
      await Timeline.create([
        { candidate: c._id, eventType: 'whatsapp_out', channel: 'whatsapp', direction: 'out', content: 'Outreach template sent', isSystem: true, createdByName: 'System' },
        { candidate: c._id, eventType: 'whatsapp_in', channel: 'whatsapp', direction: 'in', content: 'Yes, I am interested', createdByName: c.fullName },
        { candidate: c._id, eventType: 'status_change', channel: 'system', oldStatus: 'New', newStatus: 'Interested', content: 'Auto-updated by chatbot', isSystem: true, createdByName: 'System' },
      ]);
    }
    console.log('Created sample timeline events');

    console.log('\n✅ Seed complete!');
    console.log('\nLogin credentials:');
    console.log('  Super Admin: admin@inovit.in / admin123');
    console.log('  Team Lead:   rajesh@inovit.in / pass123');
    console.log('  Agent:       priya@inovit.in / pass123');
    console.log('  Telecaller:  sunita@inovit.in / pass123');
    console.log('  Interviewer: ravi@inovit.in / pass123');

    process.exit(0);
  } catch (err) {
    console.error('Seed error:', err);
    process.exit(1);
  }
};

seed();
