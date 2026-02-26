import { useState, useEffect } from 'react';
import { candidateAPI, callAPI } from '../services/api';
import toast from 'react-hot-toast';
import { Phone, PhoneIncoming, Search, Clock, User, ChevronRight, PhoneCall } from 'lucide-react';

const OUTCOMES = [
  { value: 'Connected_Positive', label: 'Connected - Positive', color: 'text-green-600' },
  { value: 'Connected_Negative', label: 'Connected - Negative', color: 'text-red-600' },
  { value: 'Connected_Callback', label: 'Connected - Callback Requested', color: 'text-blue-600' },
  { value: 'Connected_Info', label: 'Connected - Info Provided', color: 'text-purple-600' },
  { value: 'Connected_Escalation', label: 'Connected - Needs Escalation', color: 'text-orange-600' },
  { value: 'No_Answer', label: 'No Answer', color: 'text-gray-500' },
  { value: 'Busy', label: 'Busy', color: 'text-yellow-600' },
  { value: 'Switched_Off', label: 'Switched Off', color: 'text-gray-500' },
  { value: 'Not_Reachable', label: 'Not Reachable', color: 'text-gray-500' },
  { value: 'Wrong_Number', label: 'Wrong Number', color: 'text-red-500' },
];

const FOLLOWUPS = [
  { value: 'No_Action', label: 'No Action Needed' },
  { value: 'Schedule_Interview', label: 'Schedule Interview' },
  { value: 'Send_Portal_Link', label: 'Send Portal Link' },
  { value: 'Send_Doc_Reminder', label: 'Send Document Reminder' },
  { value: 'Send_Offer', label: 'Send Offer' },
  { value: 'Escalate_To_Lead', label: 'Escalate to Lead' },
  { value: 'Callback_Scheduled', label: 'Schedule Callback' },
];

export default function Telecalling() {
  const [tab, setTab] = useState('queue'); // queue | inbound | history
  const [queue, setQueue] = useState([]);
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  // Active call state
  const [activeCandidate, setActiveCandidate] = useState(null);
  const [callStarted, setCallStarted] = useState(null);
  // Disposition form
  const [disposition, setDisposition] = useState({ outcome: '', summary: '', followUpAction: 'No_Action', callbackAt: '', direction: 'outbound' });
  // Inbound search
  const [phoneSearch, setPhoneSearch] = useState('');
  const [searchResult, setSearchResult] = useState(null);
  const [searching, setSearching] = useState(false);

  useEffect(() => {
    loadQueue();
    callAPI.getStats().then(res => setStats(res.data)).catch(console.error);
  }, []);

  const loadQueue = async () => {
    setLoading(true);
    try {
      const res = await callAPI.getQueue();
      setQueue(res.data.queue || []);
    } catch (err) { console.error(err); }
    finally { setLoading(false); }
  };

  const startCall = (candidate, direction = 'outbound') => {
    setActiveCandidate(candidate);
    setCallStarted(new Date());
    setDisposition({ outcome: '', summary: '', followUpAction: 'No_Action', callbackAt: '', direction });
  };

  const submitDisposition = async () => {
    if (!disposition.outcome) return toast.error('Select a call outcome');
    if (disposition.outcome.startsWith('Connected') && !disposition.summary.trim()) return toast.error('Call summary required for connected calls');
    if (disposition.outcome === 'Connected_Callback' && !disposition.callbackAt) return toast.error('Callback date/time required');

    const duration = callStarted ? Math.round((Date.now() - callStarted.getTime()) / 1000) : 0;
    try {
      await callAPI.log({
        candidateId: activeCandidate?._id,
        direction: disposition.direction,
        phoneDialed: activeCandidate?.phone || phoneSearch,
        outcome: disposition.outcome,
        summary: disposition.summary,
        followUpAction: disposition.followUpAction,
        callbackAt: disposition.callbackAt || null,
        durationSeconds: duration,
      });
      toast.success('Call logged successfully');
      setActiveCandidate(null);
      setCallStarted(null);
      setSearchResult(null);
      setPhoneSearch('');
      loadQueue();
      callAPI.getStats().then(res => setStats(res.data));
    } catch (err) { toast.error('Failed to log call'); }
  };

  const handlePhoneSearch = async () => {
    if (!phoneSearch || phoneSearch.length < 10) return toast.error('Enter a valid 10-digit number');
    setSearching(true);
    try {
      const res = await candidateAPI.searchByPhone(phoneSearch);
      setSearchResult(res.data);
      if (res.data.found) {
        startCall(res.data.candidate, 'inbound');
      }
    } catch (err) { toast.error('Search failed'); }
    finally { setSearching(false); }
  };

  const priorityColors = { 1: 'bg-red-100 text-red-700', 2: 'bg-orange-100 text-orange-700', 3: 'bg-yellow-100 text-yellow-700', 4: 'bg-blue-100 text-blue-700', 5: 'bg-gray-100 text-gray-600' };

  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-bold text-gray-900">Telecalling Dashboard</h1>

      {/* Stats bar */}
      {stats && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          <div className="card !p-3 text-center"><div className="text-2xl font-bold text-primary-700">{stats.todayCalls}</div><div className="text-xs text-gray-500">Calls Today</div></div>
          <div className="card !p-3 text-center"><div className="text-2xl font-bold text-green-600">{stats.todayConnected}</div><div className="text-xs text-gray-500">Connected</div></div>
          <div className="card !p-3 text-center"><div className="text-2xl font-bold text-blue-600">{stats.connectRate}%</div><div className="text-xs text-gray-500">Connect Rate</div></div>
          <div className="card !p-3 text-center"><div className="text-2xl font-bold text-gray-700">{Math.floor(stats.avgDurationSeconds/60)}m {stats.avgDurationSeconds%60}s</div><div className="text-xs text-gray-500">Avg Duration</div></div>
        </div>
      )}

      {/* Tabs */}
      <div className="flex gap-1 bg-gray-100 p-1 rounded-lg w-fit">
        {[{ key: 'queue', label: 'Call Queue', icon: Phone }, { key: 'inbound', label: 'Inbound Call', icon: PhoneIncoming }].map(t => (
          <button key={t.key} onClick={() => { setTab(t.key); setActiveCandidate(null); }}
            className={`flex items-center gap-2 px-4 py-2 rounded-md text-sm font-medium transition ${tab === t.key ? 'bg-white shadow text-primary-700' : 'text-gray-500 hover:text-gray-700'}`}>
            <t.icon size={16} /> {t.label}
          </button>
        ))}
      </div>

      <div className="grid lg:grid-cols-5 gap-4">
        {/* Left: Queue / Inbound search */}
        <div className="lg:col-span-2">
          {tab === 'queue' && (
            <div className="card">
              <h3 className="font-semibold text-gray-800 mb-3">Today's Call Queue ({queue.length})</h3>
              <div className="space-y-2 max-h-[500px] overflow-y-auto">
                {loading ? <div className="text-center py-6 text-gray-400">Loading queue...</div> :
                queue.length === 0 ? <div className="text-center py-6 text-gray-400">Queue is empty 🎉</div> :
                queue.map((item, i) => (
                  <div key={i} onClick={() => startCall(item, 'outbound')}
                    className={`p-3 rounded-lg border cursor-pointer transition hover:bg-gray-50 ${activeCandidate?._id === item._id ? 'border-primary-400 bg-primary-50' : 'border-gray-200'}`}>
                    <div className="flex items-center justify-between">
                      <div className="font-medium text-sm text-gray-800">{item.fullName || item.candidate?.fullName}</div>
                      <span className={`badge text-xs ${priorityColors[item.priority] || 'bg-gray-100'}`}>P{item.priority}</span>
                    </div>
                    <div className="text-xs text-gray-500 mt-1">{item.phone || item.candidate?.phone}</div>
                    <div className="text-xs text-gray-400 mt-0.5">{item.reason}</div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {tab === 'inbound' && (
            <div className="card">
              <h3 className="font-semibold text-gray-800 mb-3">Inbound Call - Search Candidate</h3>
              <p className="text-sm text-gray-500 mb-3">Ask the caller for their mobile number and search below:</p>
              <div className="flex gap-2 mb-4">
                <input value={phoneSearch} onChange={e => setPhoneSearch(e.target.value)} placeholder="Enter 10-digit number..."
                  className="input-field flex-1 font-mono" maxLength={10} onKeyDown={e => e.key === 'Enter' && handlePhoneSearch()} />
                <button onClick={handlePhoneSearch} disabled={searching} className="btn-primary"><Search size={16} /></button>
              </div>
              {searchResult && !searchResult.found && (
                <div className="p-4 bg-yellow-50 rounded-lg border border-yellow-200">
                  <p className="text-sm font-medium text-yellow-800">No candidate found for this number</p>
                  <p className="text-xs text-yellow-600 mt-1">Options: Quick-add candidate or send registration link via SMS</p>
                  <button onClick={() => toast('Quick-add form coming soon')} className="btn-outline text-xs mt-2">Quick Add Candidate</button>
                </div>
              )}
              {searchResult?.found && searchResult.candidate && (
                <div className="p-3 bg-green-50 rounded-lg border border-green-200">
                  <p className="text-sm font-bold text-green-800">✅ Profile Found</p>
                  <p className="text-sm text-green-700">{searchResult.candidate.fullName} ({searchResult.candidate.candidateId})</p>
                  <p className="text-xs text-green-600">Status: {searchResult.candidate.status?.replace(/_/g,' ')}</p>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Right: Active Call / Disposition */}
        <div className="lg:col-span-3">
          {activeCandidate ? (
            <div className="card">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h3 className="font-bold text-lg text-gray-900">{activeCandidate.fullName}</h3>
                  <div className="text-sm text-gray-500 font-mono">{activeCandidate.phone} • {activeCandidate.candidateId}</div>
                  <div className="text-xs text-gray-400 mt-1">Status: {activeCandidate.status?.replace(/_/g,' ')} • {activeCandidate.qualification?.replace(/_/g,' ')} • {activeCandidate.experienceYears}yr exp</div>
                </div>
                {callStarted && (
                  <div className="flex items-center gap-2 text-sm text-green-600 bg-green-50 px-3 py-1.5 rounded-full">
                    <PhoneCall size={14} className="animate-pulse" />
                    <span className="font-mono">{Math.floor((Date.now()-callStarted.getTime())/60000)}:{String(Math.floor(((Date.now()-callStarted.getTime())%60000)/1000)).padStart(2,'0')}</span>
                  </div>
                )}
              </div>

              {/* Disposition Form */}
              <div className="border-t pt-4 space-y-4">
                <h4 className="font-semibold text-gray-700">Call Disposition (Mandatory)</h4>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Outcome *</label>
                  <select value={disposition.outcome} onChange={e => setDisposition(d => ({...d, outcome: e.target.value}))} className="input-field">
                    <option value="">-- Select Outcome --</option>
                    {OUTCOMES.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
                  </select>
                </div>

                {disposition.outcome.startsWith('Connected') && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Call Summary * <span className="text-xs text-gray-400">(min 20 chars)</span></label>
                    <textarea value={disposition.summary} onChange={e => setDisposition(d => ({...d, summary: e.target.value}))}
                      className="input-field" rows={3} placeholder="What was discussed? What did the candidate say? What was agreed?" />
                  </div>
                )}

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Follow-Up Action</label>
                  <select value={disposition.followUpAction} onChange={e => setDisposition(d => ({...d, followUpAction: e.target.value}))} className="input-field">
                    {FOLLOWUPS.map(f => <option key={f.value} value={f.value}>{f.label}</option>)}
                  </select>
                </div>

                {disposition.followUpAction === 'Callback_Scheduled' && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Callback Date/Time *</label>
                    <input type="datetime-local" value={disposition.callbackAt} onChange={e => setDisposition(d => ({...d, callbackAt: e.target.value}))} className="input-field" />
                  </div>
                )}

                <div className="flex gap-3 pt-2">
                  <button onClick={submitDisposition} className="btn-primary flex-1">Submit & End Call</button>
                  <button onClick={() => { setActiveCandidate(null); setCallStarted(null); }} className="btn-outline">Cancel</button>
                </div>
              </div>
            </div>
          ) : (
            <div className="card flex items-center justify-center h-64 text-gray-400">
              <div className="text-center">
                <Phone size={40} className="mx-auto mb-3 opacity-30" />
                <p>{tab === 'queue' ? 'Click a candidate in the queue to start a call' : 'Search a phone number to handle an inbound call'}</p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
