# INOVIT Recruitment Platform v3.0

**WhatsApp-Integrated Recruitment & Onboarding System**  
Deploy 500 Junior Electricians for Smart Meter Installation

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Frontend | React 18 + Vite + Tailwind CSS |
| Backend | Node.js + Express.js |
| Database | MongoDB (Atlas or Local) |
| WhatsApp | WATI Sandbox API |
| Real-time | Socket.io |
| Charts | Recharts |

## Quick Start

### Prerequisites
- Node.js 18+
- MongoDB (local or Atlas URI)

### 1. Install

```bash
cd inovit-recruitment
cd backend && npm install
cd ../frontend && npm install
cd ..
```

### 2. Configure Environment

```bash
cp .env.example backend/.env
```

Edit `backend/.env`:
```
MONGODB_URI=mongodb://localhost:27017/inovit_recruitment
JWT_SECRET=your-secret-key-change-this
WATI_API_URL=https://live-server-XXXXX.wati.io
WATI_API_TOKEN=your-wati-token
```

### 3. Seed Demo Data

```bash
cd backend && npm run seed
```

Creates: 6 HR users, 10 deployment locations (500 total quota), 75 sample candidates, timeline events.

### 4. Run

```bash
# Terminal 1: Backend
cd backend && npm run dev

# Terminal 2: Frontend  
cd frontend && npm run dev
```

Open **http://localhost:5173**

### Demo Logins

| Role | Email | Password |
|------|-------|----------|
| Super Admin | admin@inovit.in | admin123 |
| Team Lead | rajesh@inovit.in | pass123 |
| Agent | priya@inovit.in | pass123 |
| Telecaller | sunita@inovit.in | pass123 |
| Interviewer | ravi@inovit.in | pass123 |

## Modules

### 1. Dashboard (`/`)
- Deployment progress bar (X/500)
- Pipeline overview with status badges
- Location quota bar chart
- Source distribution pie chart
- Today's activity stats (messages, calls)
- Recent activity feed

### 2. Candidates (`/candidates`)
- Full candidate list with search, filters, pagination
- Filter by status, source, qualification
- Click any row to view detailed profile

### 3. Candidate Detail (`/candidates/:id`)
- Complete profile with all scores (pre-screen, interview breakdown, quiz, combined)
- **Unified Timeline** — ALL interactions in one chronological view:
  - 📤📩 WhatsApp messages (in/out)
  - 📞📲 Call logs (outbound/inbound) with duration & outcome
  - 📱 SMS notifications
  - 📝 Internal notes (add notes inline)
  - 🔄 Status changes
  - 📄 Document events
  - 🎯 Score updates
  - ✅ Panel decisions
- Filter timeline by: All | WhatsApp | Calls | Notes | System

### 4. Import Data (`/import`)
- Drag-drop Excel (.xlsx/.xls) or CSV upload
- Auto-detect columns with preview of first 10 rows
- Column mapping wizard (auto-maps obvious columns)
- Import with: dedup by phone, blacklist check, qualification normalization
- Results summary: imported / duplicates / errors / blacklisted

### 5. Selection Panel (`/selection`)
- All interviewed candidates in sortable table
- Columns: Name, Qualification, Pre-Screen, Interview (/60), Quiz (/20), Combined Score, Location, Decision
- Sort by any score column (click header)
- Color-coded scores: 80+ green, 70+ light green, 60+ yellow, <60 red
- **Actions per candidate**: ✅ Select | ❌ Reject | ⏸ Hold
- Select modal: set offer salary (₹15K-22K)
- Reject modal: mandatory reason dropdown + comments
- Hold modal: reason + comments
- **Bulk actions**: Checkbox select → Bulk Select / Bulk Reject
- Stats bar: Total interviewed, Pending, Selected/500, Deployed/500 with progress bar
- Full audit trail (every decision logged in timeline)

### 6. Telecalling (`/telecalling`)
- **Call Queue tab**: Auto-populated priority queue
  - P1: Scheduled callbacks (time-sensitive)
  - P2: Offer follow-ups (24h+ no response)
  - P3: WhatsApp failed (2x)
  - P4: No response 48h+
  - P5: Document reminders
- Click candidate → Active call screen with profile
- **Mandatory Disposition Form**:
  - Outcome: 10 options (Connected-Positive/Negative/Callback/Info/Escalation, No Answer, Busy, etc.)
  - Summary: Required for connected calls (min 20 chars)
  - Follow-up action: Schedule Interview / Send Portal Link / Callback / Escalate / etc.
  - Callback scheduler with date/time picker
- **Inbound Call tab**: 
  - Search by phone number (candidate calls helpline)
  - Profile auto-pulled if found
  - "Not found" → Quick-add option
  - Same disposition form for inbound calls
- Agent stats: Calls today, Connected, Connect rate %, Avg duration

### 7. Locations & Quota (`/locations`)
- All deployment locations with quota tracking
- Table: Location | Quota | Selected | Offered | Accepted | Training | Deployed | Remaining | Progress bar
- ⚠️ Warning when <5 remaining, ⛔ blocked when 0
- Bar chart: Quota vs Deployed vs Pipeline per location
- Add new location button (admin only)
- Summary cards: Total Quota, Deployed, In Pipeline, Remaining

### 8. Walk-In Registration (`/register`)
- **Public page** — no login required
- Mobile-optimized registration form
- Fields: Name, Phone, Qualification, Experience, City, Preferred Location, Referral Code, Consent
- QR code support via URL param: `/register?location=delhi-office-1`
- Duplicate phone detection
- Blacklist check
- Success screen with Application ID

### 9. Status Tracker (`/status/:token`)
- **Public page** — candidate-facing
- Visual progress bar: Application → Screening → Interview → Selection → Offer → Training → Deployment
- Current stage highlighted with details (interview date, training status, docs verified)
- WhatsApp contact button
- Linked from WhatsApp chatbot within 24h session window

## API Endpoints

### Auth
- `POST /api/auth/login` — Login
- `POST /api/auth/register` — Register user (admin only)
- `GET /api/auth/me` — Current user

### Candidates
- `GET /api/candidates` — List with filters/pagination
- `GET /api/candidates/:id` — Detail + timeline
- `POST /api/candidates` — Create (manual/walk-in)
- `PUT /api/candidates/:id` — Update
- `GET /api/candidates/search-phone?phone=` — Telecaller phone lookup
- `POST /api/candidates/:id/panel-decision` — Select/Reject/Hold
- `POST /api/candidates/bulk-decision` — Bulk panel action
- `POST /api/candidates/:id/score-interview` — Score interview
- `POST /api/candidates/:id/notes` — Add timeline note

### Import
- `POST /api/import/upload` — Upload file, get headers + preview
- `POST /api/import/process` — Process with column mapping
- `GET /api/import/history` — Past imports

### Telecalling
- `POST /api/calls/log` — Log call with disposition
- `GET /api/calls/queue` — Get agent's call queue
- `GET /api/calls/history` — Agent call history
- `GET /api/calls/stats` — Agent performance stats

### Locations
- `GET /api/locations` — All locations
- `POST /api/locations` — Add location (admin)
- `GET /api/locations/quota-dashboard` — Quota summary

### Public (No Auth)
- `GET /api/walkin/form-data` — Registration form data
- `POST /api/walkin/register` — Submit walk-in registration
- `GET /api/status/:token` — Candidate status tracker

## Database Collections

| Collection | Description |
|-----------|-------------|
| users | HR team members with roles & teams |
| candidates | Main entity — all candidate data, scores, status |
| deploymentlocations | Cities with quota tracking |
| timelines | Unified communication events |
| calllogs | All call records with dispositions |
| trainingbatches | 3-day training batch management |
| importbatches | Data import history & results |

## Key Design Decisions

1. **WhatsApp Retry**: Max 2 attempts (original + 1 retry after 4h). Then SMS fallback → Telecaller queue.
2. **No IVR**: Inbound calls answered by human agent who manually searches candidate by phone number.
3. **Self-Service Status**: WhatsApp link within 24h session window → lightweight status page with OTP auth.
4. **3-Day Training**: Physical classroom + practical. Hard gate — cannot deploy without Training=Completed AND BGV=Clear.
5. **Selection Panel**: Not a scoring rubric — it's a Select/Reject/Hold decision interface with mandatory reasons and audit trail.
6. **Unified Timeline**: Every WhatsApp message, call, SMS, note, status change, and decision in one chronological view per candidate.

## Project Structure

```
inovit-recruitment/
├── backend/
│   ├── package.json
│   ├── uploads/                  # Uploaded files (temp)
│   └── src/
│       ├── server.js             # Express + Socket.io entry
│       ├── config/
│       │   ├── db.js             # MongoDB connection
│       │   └── constants.js      # All enums & status codes
│       ├── models/
│       │   ├── User.js
│       │   ├── Candidate.js      # Main entity (50+ fields)
│       │   ├── DeploymentLocation.js
│       │   ├── Timeline.js       # Unified events
│       │   ├── CallLog.js
│       │   ├── TrainingBatch.js
│       │   ├── ImportBatch.js
│       │   └── index.js
│       ├── middleware/
│       │   ├── auth.js           # JWT + role authorization
│       │   └── upload.js         # Multer file handling
│       ├── controllers/
│       │   ├── authController.js
│       │   ├── candidateController.js
│       │   ├── importController.js
│       │   ├── callController.js
│       │   ├── locationController.js
│       │   ├── dashboardController.js
│       │   └── walkinController.js
│       ├── services/
│       │   ├── watiService.js    # WATI WhatsApp API
│       │   └── timelineService.js
│       ├── routes/
│       │   └── index.js          # All API routes
│       └── seeds/
│           └── seed.js           # Demo data seeder
├── frontend/
│   ├── package.json
│   ├── vite.config.js
│   ├── tailwind.config.js
│   ├── postcss.config.js
│   ├── index.html
│   └── src/
│       ├── main.jsx
│       ├── App.jsx               # Routes
│       ├── index.css             # Tailwind + components
│       ├── context/
│       │   └── AuthContext.jsx
│       ├── services/
│       │   └── api.js            # Axios + all API functions
│       ├── components/
│       │   └── layout/
│       │       └── Layout.jsx    # Sidebar + header
│       └── pages/
│           ├── Login.jsx
│           ├── Dashboard.jsx
│           ├── Candidates.jsx
│           ├── CandidateDetail.jsx
│           ├── ImportData.jsx
│           ├── SelectionPanel.jsx
│           ├── Telecalling.jsx
│           ├── Locations.jsx
│           ├── WalkInRegister.jsx
│           └── StatusTracker.jsx
├── .env.example
├── package.json                  # Root with dev scripts
└── README.md
```

## Next Steps (Phase 2)

- [ ] WATI webhook integration for live WhatsApp message sync
- [ ] Exotel click-to-call integration
- [ ] Training batch management UI
- [ ] Document upload + OCR verification
- [ ] Interview scheduling calendar
- [ ] BGV workflow
- [ ] WhatsApp chatbot (Dialogflow CX)
- [ ] Regional language support (Phase 2 languages)
- [ ] Waitlist automation
- [ ] DPDP compliance module
