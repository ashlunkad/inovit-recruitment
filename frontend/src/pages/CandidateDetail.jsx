import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { candidateAPI } from '../services/api';
import toast from 'react-hot-toast';
import { ArrowLeft, Phone, Mail, MapPin, Star, Clock, Send, FileText, ChevronDown } from 'lucide-react';

const eventIcons = {
  whatsapp_out: '📤', whatsapp_in: '📩', call_outbound: '📞', call_inbound: '📲',
  sms_sent: '📱', internal_note: '📝', status_change: '🔄', document_event: '📄',
  score_update: '🎯', panel_decision: '✅', system_event: '⚙️',
};

const eventColors = {
  whatsapp_out: 'border-green-300 bg-green-50', whatsapp_in: 'border-green-400 bg-green-50',
  call_outbound: 'border-blue-300 bg-blue-50', call_inbound: 'border-blue-400 bg-blue-50',
  status_change: 'border-yellow-300 bg-yellow-50', panel_decision: 'border-emerald-300 bg-emerald-50',
  internal_note: 'border-purple-300 bg-purple-50', system_event: 'border-gray-300 bg-gray-50',
  score_update: 'border-orange-300 bg-orange-50', document_event: 'border-indigo-300 bg-indigo-50',
};

export default function CandidateDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [candidate, setCandidate] = useState(null);
  const [timeline, setTimeline] = useState([]);
  const [loading, setLoading] = useState(true);
  const [note, setNote] = useState('');
  const [timelineFilter, setTimelineFilter] = useState('all');

  useEffect(() => {
    candidateAPI.getOne(id).then(res => {
      setCandidate(res.data.candidate);
      setTimeline(res.data.timeline || []);
    }).catch(() => toast.error('Candidate not found')).finally(() => setLoading(false));
  }, [id]);

  const addNote = async () => {
    if (!note.trim()) return;
    try {
      await candidateAPI.addNote(id, { content: note });
      toast.success('Note added');
      setNote('');
      // Refresh timeline
      const res = await candidateAPI.getOne(id);
      setTimeline(res.data.timeline || []);
    } catch (err) { toast.error('Failed to add note'); }
  };

  const filteredTimeline = timelineFilter === 'all' ? timeline : timeline.filter(e => {
    if (timelineFilter === 'whatsapp') return e.eventType?.includes('whatsapp');
    if (timelineFilter === 'calls') return e.eventType?.includes('call');
    if (timelineFilter === 'notes') return e.eventType === 'internal_note';
    if (timelineFilter === 'system') return ['status_change', 'system_event', 'panel_decision', 'score_update'].includes(e.eventType);
    return true;
  });

  if (loading) return <div className="flex items-center justify-center h-64"><div className="animate-spin rounded-full h-10 w-10 border-b-2 border-primary-600"></div></div>;
  if (!candidate) return <div className="text-center py-10 text-gray-500">Candidate not found</div>;

  const c = candidate;
  const scoreColor = (s) => s >= 80 ? 'text-green-600 bg-green-50' : s >= 60 ? 'text-blue-600 bg-blue-50' : s >= 40 ? 'text-yellow-600 bg-yellow-50' : 'text-red-500 bg-red-50';

  return (
    <div className="space-y-6">
      <button onClick={() => navigate(-1)} className="flex items-center gap-1 text-sm text-gray-500 hover:text-gray-700"><ArrowLeft size={16} /> Back</button>

      {/* Header */}
      <div className="card flex flex-col md:flex-row md:items-center gap-6">
        <div className="w-16 h-16 rounded-full bg-primary-100 flex items-center justify-center text-primary-700 font-bold text-xl">
          {c.fullName?.split(' ').map(n=>n[0]).join('').slice(0,2)}
        </div>
        <div className="flex-1">
          <h1 className="text-2xl font-bold text-gray-900">{c.fullName}</h1>
          <div className="flex flex-wrap gap-3 mt-1 text-sm text-gray-500">
            <span className="flex items-center gap-1"><Phone size={13} /> {c.phone}</span>
            {c.email && <span className="flex items-center gap-1"><Mail size={13} /> {c.email}</span>}
            <span className="flex items-center gap-1"><MapPin size={13} /> {c.currentLocation?.city || 'N/A'}</span>
            <span className="flex items-center gap-1"><FileText size={13} /> {c.candidateId}</span>
          </div>
        </div>
        <div className="flex gap-3">
          <div className={`text-center px-4 py-2 rounded-lg ${scoreColor(c.combinedScore)}`}>
            <div className="text-2xl font-bold">{c.combinedScore || 0}</div>
            <div className="text-xs">Combined</div>
          </div>
          <div className="text-center px-4 py-2 rounded-lg bg-gray-50">
            <div className="text-2xl font-bold text-gray-700">{c.preScreenScore || 0}</div>
            <div className="text-xs text-gray-500">Pre-Screen</div>
          </div>
          <div className="text-center px-4 py-2 rounded-lg bg-gray-50">
            <div className="text-2xl font-bold text-gray-700">{c.interviewScore || 0}/60</div>
            <div className="text-xs text-gray-500">Interview</div>
          </div>
        </div>
      </div>

      <div className="grid lg:grid-cols-3 gap-6">
        {/* Left: Details */}
        <div className="lg:col-span-1 space-y-4">
          <div className="card">
            <h3 className="font-semibold text-gray-800 mb-3">Details</h3>
            <dl className="space-y-2 text-sm">
              {[
                ['Status', c.status?.replace(/_/g, ' ')],
                ['Qualification', c.qualification?.replace(/_/g, ' ')],
                ['Experience', `${c.experienceYears || 0} years`],
                ['Electrical Trade', c.electricalTrade ? 'Yes' : 'No'],
                ['Source', c.source?.replace(/_/g, ' ')],
                ['Preferred Location', c.preferredLocation?.name || 'N/A'],
                ['Language', c.preferredLanguage === 'hi' ? 'Hindi' : 'English'],
                ['Panel Decision', c.panelDecision],
                ['Training', c.trainingStatus?.replace(/_/g, ' ')],
                ['WhatsApp', c.whatsappStatus],
                ['Assigned To', c.assignedAgent?.name || 'Unassigned'],
                ['Team', c.assignedTeam || 'N/A'],
              ].map(([label, value]) => (
                <div key={label} className="flex justify-between">
                  <dt className="text-gray-500">{label}</dt>
                  <dd className="font-medium text-gray-800">{value || '-'}</dd>
                </div>
              ))}
            </dl>
          </div>

          {c.interviewScore > 0 && (
            <div className="card">
              <h3 className="font-semibold text-gray-800 mb-3">Interview Breakdown</h3>
              <div className="space-y-2">
                {[
                  ['Technical', c.interviewBreakdown?.technical],
                  ['Practical', c.interviewBreakdown?.practical],
                  ['Communication', c.interviewBreakdown?.communication],
                  ['Experience', c.interviewBreakdown?.experience],
                  ['Location/Availability', c.interviewBreakdown?.locationAvailability],
                  ['Quiz (Normalized)', c.interviewBreakdown?.quizNormalized],
                ].map(([label, val]) => (
                  <div key={label} className="flex items-center gap-2 text-sm">
                    <span className="w-32 text-gray-500">{label}</span>
                    <div className="flex-1 bg-gray-200 rounded-full h-2">
                      <div className="bg-primary-500 h-2 rounded-full" style={{ width: `${(val||0)*10}%` }}></div>
                    </div>
                    <span className="font-medium w-8 text-right">{val || 0}/10</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Right: Unified Timeline */}
        <div className="lg:col-span-2">
          <div className="card">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-semibold text-gray-800">Unified Timeline</h3>
              <div className="flex gap-1">
                {['all', 'whatsapp', 'calls', 'notes', 'system'].map(f => (
                  <button key={f} onClick={() => setTimelineFilter(f)}
                    className={`text-xs px-2 py-1 rounded-full transition ${timelineFilter === f ? 'bg-primary-100 text-primary-700 font-medium' : 'text-gray-500 hover:bg-gray-100'}`}>
                    {f === 'all' ? 'All' : f.charAt(0).toUpperCase() + f.slice(1)}
                  </button>
                ))}
              </div>
            </div>

            {/* Add note */}
            <div className="flex gap-2 mb-4">
              <input value={note} onChange={e => setNote(e.target.value)} placeholder="Add a note..." className="input-field flex-1"
                onKeyDown={e => e.key === 'Enter' && addNote()} />
              <button onClick={addNote} className="btn-primary flex items-center gap-1"><Send size={14} /> Add</button>
            </div>

            {/* Timeline events */}
            <div className="space-y-3 max-h-[600px] overflow-y-auto">
              {filteredTimeline.length === 0 ? (
                <div className="text-center text-gray-400 py-8">No timeline events yet</div>
              ) : filteredTimeline.map((event, i) => (
                <div key={event._id || i} className={`border-l-4 rounded-r-lg p-3 ${eventColors[event.eventType] || 'border-gray-300 bg-gray-50'}`}>
                  <div className="flex items-start justify-between">
                    <div className="flex items-start gap-2">
                      <span className="text-base">{eventIcons[event.eventType] || '📌'}</span>
                      <div>
                        <div className="text-sm text-gray-800">{event.content || event.eventType?.replace(/_/g, ' ')}</div>
                        {event.callDuration > 0 && <div className="text-xs text-gray-500 mt-0.5">Duration: {Math.floor(event.callDuration/60)}m {event.callDuration%60}s</div>}
                        {event.oldStatus && <div className="text-xs text-gray-500 mt-0.5">{event.oldStatus} → {event.newStatus}</div>}
                      </div>
                    </div>
                    <div className="text-xs text-gray-400 whitespace-nowrap ml-2">
                      {new Date(event.createdAt).toLocaleString('en-IN', { dateStyle: 'short', timeStyle: 'short' })}
                    </div>
                  </div>
                  <div className="text-xs text-gray-400 mt-1 ml-7">by {event.createdByName || event.createdBy?.name || 'System'}</div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
