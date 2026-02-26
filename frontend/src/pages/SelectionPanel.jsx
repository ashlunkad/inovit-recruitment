import { useState, useEffect } from 'react';
import { candidateAPI, locationAPI } from '../services/api';
import toast from 'react-hot-toast';
import { useNavigate } from 'react-router-dom';
import { CheckCircle, XCircle, PauseCircle, ArrowUpDown, Download, Filter } from 'lucide-react';

const REJECTION_REASONS = [
  'Insufficient_Technical', 'Failed_Practical', 'Location_Mismatch',
  'Poor_Communication', 'Overqualified', 'Underqualified', 'Timeline_Mismatch', 'Other'
];

export default function SelectionPanel() {
  const [candidates, setCandidates] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState(new Set());
  const [sortField, setSortField] = useState('combinedScore');
  const [sortDir, setSortDir] = useState('-');
  const [modal, setModal] = useState(null); // { type: 'select'|'reject'|'hold', candidateId, candidateName }
  const [bulkModal, setBulkModal] = useState(null);
  const [modalData, setModalData] = useState({ reason: '', comments: '', offerSalary: 18000 });
  const [stats, setStats] = useState(null);
  const [locations, setLocations] = useState([]);
  const navigate = useNavigate();

  const fetchData = async () => {
    setLoading(true);
    try {
      const [candRes, locRes, statsRes] = await Promise.all([
        candidateAPI.getAll({ status: ['Interview_Done', 'Selected', 'Rejected', 'On_Hold'], limit: 200, sort: `${sortDir}${sortField}` }),
        locationAPI.getAll(),
        candidateAPI.getPipelineStats(),
      ]);
      setCandidates(candRes.data.candidates);
      setLocations(locRes.data.locations);
      setStats(statsRes.data);
    } catch (err) { console.error(err); }
    finally { setLoading(false); }
  };

  useEffect(() => { fetchData(); }, [sortField, sortDir]);

  const toggleSort = (field) => {
    if (sortField === field) setSortDir(d => d === '-' ? '' : '-');
    else { setSortField(field); setSortDir('-'); }
  };

  const toggleSelect = (id) => {
    const s = new Set(selected);
    s.has(id) ? s.delete(id) : s.add(id);
    setSelected(s);
  };

  const toggleAll = () => {
    if (selected.size === candidates.length) setSelected(new Set());
    else setSelected(new Set(candidates.map(c => c._id)));
  };

  const submitDecision = async () => {
    if (!modal) return;
    try {
      await candidateAPI.panelDecision(modal.candidateId, {
        decision: modal.type === 'select' ? 'Selected' : modal.type === 'reject' ? 'Rejected' : 'On_Hold',
        reason: modalData.reason, comments: modalData.comments,
        offerSalary: modal.type === 'select' ? modalData.offerSalary : undefined,
      });
      toast.success(`${modal.candidateName} ${modal.type === 'select' ? 'selected' : modal.type === 'reject' ? 'rejected' : 'put on hold'}`);
      setModal(null);
      setModalData({ reason: '', comments: '', offerSalary: 18000 });
      fetchData();
    } catch (err) { toast.error(err.response?.data?.error || 'Failed'); }
  };

  const submitBulk = async () => {
    if (!bulkModal || selected.size === 0) return;
    try {
      const res = await candidateAPI.bulkDecision({
        candidateIds: [...selected],
        decision: bulkModal === 'select' ? 'Selected' : bulkModal === 'reject' ? 'Rejected' : 'On_Hold',
        reason: modalData.reason, comments: modalData.comments,
      });
      toast.success(`${res.data.success} candidates updated`);
      setBulkModal(null); setSelected(new Set()); setModalData({ reason: '', comments: '', offerSalary: 18000 });
      fetchData();
    } catch (err) { toast.error('Bulk action failed'); }
  };

  const scoreClass = (s) => s >= 80 ? 'bg-green-100 text-green-700' : s >= 70 ? 'bg-green-50 text-green-600' : s >= 60 ? 'bg-yellow-50 text-yellow-700' : 'bg-red-50 text-red-600';
  const decisionBadge = (d) => ({ Selected: 'bg-green-100 text-green-700', Rejected: 'bg-red-100 text-red-700', On_Hold: 'bg-amber-100 text-amber-700', Pending: 'bg-gray-100 text-gray-600' }[d] || 'bg-gray-100 text-gray-600');

  const summary = stats?.summary || {};
  const pending = candidates.filter(c => c.panelDecision === 'Pending').length;

  return (
    <div className="space-y-4">
      {/* Stats bar */}
      <div className="card !p-4 flex flex-wrap items-center gap-6 text-sm">
        <div>Total Interviewed: <span className="font-bold">{candidates.length}</span></div>
        <div>Pending: <span className="font-bold text-yellow-600">{pending}</span></div>
        <div>Selected: <span className="font-bold text-green-600">{summary.selected || 0}</span>/500</div>
        <div>Deployed: <span className="font-bold text-blue-600">{summary.deployed || 0}</span>/500</div>
        <div className="flex-1 max-w-xs">
          <div className="w-full bg-gray-200 rounded-full h-2">
            <div className="bg-green-500 h-2 rounded-full" style={{ width: `${(summary.deployed||0)/5}%` }}></div>
          </div>
        </div>
      </div>

      {/* Bulk actions */}
      {selected.size > 0 && (
        <div className="card !p-3 flex items-center gap-3 bg-primary-50 border-primary-200">
          <span className="text-sm font-medium text-primary-700">{selected.size} selected</span>
          <button onClick={() => setBulkModal('select')} className="btn-success text-xs py-1.5">Bulk Select</button>
          <button onClick={() => setBulkModal('reject')} className="btn-danger text-xs py-1.5">Bulk Reject</button>
          <button onClick={() => setSelected(new Set())} className="text-xs text-gray-500 hover:text-gray-700 ml-2">Clear</button>
        </div>
      )}

      {/* Table */}
      <div className="bg-white rounded-xl shadow-sm border overflow-x-auto">
        <table className="w-full text-sm">
          <thead className="bg-gray-50 border-b">
            <tr>
              <th className="px-3 py-3 w-10"><input type="checkbox" checked={selected.size === candidates.length && candidates.length > 0} onChange={toggleAll} className="rounded" /></th>
              <th className="px-3 py-3 text-left font-medium text-gray-500">Candidate</th>
              <th className="px-3 py-3 text-left font-medium text-gray-500">Qualification</th>
              <th className="px-3 py-3 text-center font-medium text-gray-500 cursor-pointer" onClick={() => toggleSort('preScreenScore')}>
                <span className="flex items-center justify-center gap-1">Pre-Screen <ArrowUpDown size={12} /></span>
              </th>
              <th className="px-3 py-3 text-center font-medium text-gray-500 cursor-pointer" onClick={() => toggleSort('interviewScore')}>
                <span className="flex items-center justify-center gap-1">Interview <ArrowUpDown size={12} /></span>
              </th>
              <th className="px-3 py-3 text-center font-medium text-gray-500 cursor-pointer" onClick={() => toggleSort('quizScore')}>
                <span className="flex items-center justify-center gap-1">Quiz <ArrowUpDown size={12} /></span>
              </th>
              <th className="px-3 py-3 text-center font-medium text-gray-500 cursor-pointer" onClick={() => toggleSort('combinedScore')}>
                <span className="flex items-center justify-center gap-1 font-bold">Combined <ArrowUpDown size={12} /></span>
              </th>
              <th className="px-3 py-3 text-left font-medium text-gray-500">Location</th>
              <th className="px-3 py-3 text-center font-medium text-gray-500">Decision</th>
              <th className="px-3 py-3 text-center font-medium text-gray-500">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {loading ? (
              <tr><td colSpan={10} className="py-12 text-center text-gray-400">Loading...</td></tr>
            ) : candidates.map(c => (
              <tr key={c._id} className={`hover:bg-gray-50 ${selected.has(c._id) ? 'bg-primary-50' : ''}`}>
                <td className="px-3 py-3"><input type="checkbox" checked={selected.has(c._id)} onChange={() => toggleSelect(c._id)} className="rounded" /></td>
                <td className="px-3 py-3 cursor-pointer" onClick={() => navigate(`/candidates/${c._id}`)}>
                  <div className="font-medium text-gray-900">{c.fullName}</div>
                  <div className="text-xs text-gray-400">{c.candidateId} • {c.experienceYears}yr exp</div>
                </td>
                <td className="px-3 py-3 text-xs text-gray-600">{c.qualification?.replace(/_/g,' ')}</td>
                <td className="px-3 py-3 text-center font-medium">{c.preScreenScore}</td>
                <td className="px-3 py-3 text-center font-medium">{c.interviewScore}/60</td>
                <td className="px-3 py-3 text-center font-medium">{c.quizScore}/20</td>
                <td className="px-3 py-3 text-center">
                  <span className={`badge font-bold ${scoreClass(c.combinedScore)}`}>{c.combinedScore}</span>
                </td>
                <td className="px-3 py-3 text-xs">{c.preferredLocation?.name || '-'}</td>
                <td className="px-3 py-3 text-center">
                  <span className={`badge ${decisionBadge(c.panelDecision)}`}>{c.panelDecision}</span>
                </td>
                <td className="px-3 py-3">
                  {c.panelDecision === 'Pending' && (
                    <div className="flex items-center justify-center gap-1">
                      <button onClick={() => setModal({ type:'select', candidateId:c._id, candidateName:c.fullName })} className="p-1 text-green-600 hover:bg-green-50 rounded" title="Select"><CheckCircle size={18} /></button>
                      <button onClick={() => setModal({ type:'reject', candidateId:c._id, candidateName:c.fullName })} className="p-1 text-red-500 hover:bg-red-50 rounded" title="Reject"><XCircle size={18} /></button>
                      <button onClick={() => setModal({ type:'hold', candidateId:c._id, candidateName:c.fullName })} className="p-1 text-amber-500 hover:bg-amber-50 rounded" title="Hold"><PauseCircle size={18} /></button>
                    </div>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Decision Modal */}
      {(modal || bulkModal) && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-md p-6">
            <h3 className="text-lg font-bold text-gray-900 mb-4">
              {(modal?.type || bulkModal) === 'select' ? '✅ Select Candidate' : (modal?.type || bulkModal) === 'reject' ? '❌ Reject Candidate' : '⏸ Put On Hold'}
              {bulkModal && ` (${selected.size} candidates)`}
            </h3>
            {modal && <p className="text-sm text-gray-600 mb-4">{modal.candidateName}</p>}

            {(modal?.type || bulkModal) === 'select' && (
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-1">Offer Salary (₹/month)</label>
                <input type="number" value={modalData.offerSalary} onChange={e => setModalData(d => ({...d, offerSalary: Number(e.target.value)}))} className="input-field" min={15000} max={22000} step={500} />
              </div>
            )}

            {(modal?.type || bulkModal) === 'reject' && (
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-1">Reason *</label>
                <select value={modalData.reason} onChange={e => setModalData(d => ({...d, reason: e.target.value}))} className="input-field">
                  <option value="">Select reason</option>
                  {REJECTION_REASONS.map(r => <option key={r} value={r}>{r.replace(/_/g,' ')}</option>)}
                </select>
              </div>
            )}

            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-1">Comments {(modal?.type || bulkModal) !== 'select' ? '' : '(optional)'}</label>
              <textarea value={modalData.comments} onChange={e => setModalData(d => ({...d, comments: e.target.value}))} className="input-field" rows={3} placeholder="Add any comments..." />
            </div>

            <div className="flex gap-3 justify-end">
              <button onClick={() => { setModal(null); setBulkModal(null); }} className="btn-outline">Cancel</button>
              <button onClick={bulkModal ? submitBulk : submitDecision}
                className={`${(modal?.type || bulkModal) === 'select' ? 'btn-success' : (modal?.type || bulkModal) === 'reject' ? 'btn-danger' : 'btn-primary'}`}
                disabled={(modal?.type || bulkModal) === 'reject' && !modalData.reason}>
                Confirm
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
