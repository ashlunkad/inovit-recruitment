import { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { candidateAPI } from '../services/api';
import { Search, Filter, ChevronLeft, ChevronRight, User, Phone, MapPin, Star } from 'lucide-react';

const statusColors = {
  New: 'bg-blue-100 text-blue-700', Walk_In_Registered: 'bg-teal-100 text-teal-700',
  Interested: 'bg-green-100 text-green-700', Screening: 'bg-yellow-100 text-yellow-700',
  Portal_Applied: 'bg-purple-100 text-purple-700', Interview_Scheduled: 'bg-indigo-100 text-indigo-700',
  Interview_Done: 'bg-indigo-200 text-indigo-800', Selected: 'bg-emerald-100 text-emerald-700',
  Rejected: 'bg-red-100 text-red-700', On_Hold: 'bg-amber-100 text-amber-700',
  Offered: 'bg-orange-100 text-orange-700', Offer_Accepted: 'bg-green-200 text-green-800',
  Deployed: 'bg-green-300 text-green-900', Training: 'bg-cyan-100 text-cyan-700',
  WhatsApp_Failed: 'bg-red-50 text-red-600', Unreachable: 'bg-gray-200 text-gray-600',
};

const scoreColor = (s) => s >= 80 ? 'text-green-600' : s >= 60 ? 'text-blue-600' : s >= 40 ? 'text-yellow-600' : 'text-red-500';

export default function Candidates() {
  const [candidates, setCandidates] = useState([]);
  const [pagination, setPagination] = useState({ total: 0, page: 1, pages: 1 });
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [filters, setFilters] = useState({ status: '', source: '', qualification: '' });
  const [showFilters, setShowFilters] = useState(false);
  const navigate = useNavigate();

  const fetchCandidates = async (page = 1) => {
    setLoading(true);
    try {
      const params = { page, limit: 25, sort: '-createdAt', search };
      if (filters.status) params.status = filters.status;
      if (filters.source) params.source = filters.source;
      if (filters.qualification) params.qualification = filters.qualification;
      const res = await candidateAPI.getAll(params);
      setCandidates(res.data.candidates);
      setPagination(res.data.pagination);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchCandidates(); }, [filters]);

  const handleSearch = (e) => {
    e.preventDefault();
    fetchCandidates(1);
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-900">Candidates</h1>
        <span className="text-sm text-gray-500">{pagination.total} total</span>
      </div>

      {/* Search + Filters */}
      <div className="card !p-4">
        <div className="flex gap-3">
          <form onSubmit={handleSearch} className="flex-1 flex gap-2">
            <div className="relative flex-1">
              <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
              <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search by name, phone, or ID..." className="input-field pl-9" />
            </div>
            <button type="submit" className="btn-primary">Search</button>
          </form>
          <button onClick={() => setShowFilters(!showFilters)} className={`btn-outline flex items-center gap-1 ${showFilters ? 'bg-primary-50 border-primary-300' : ''}`}>
            <Filter size={14} /> Filters
          </button>
        </div>
        {showFilters && (
          <div className="flex gap-3 mt-3 pt-3 border-t">
            <select value={filters.status} onChange={e => setFilters(f => ({...f, status: e.target.value}))} className="input-field w-auto">
              <option value="">All Status</option>
              {Object.keys(statusColors).map(s => <option key={s} value={s}>{s.replace(/_/g, ' ')}</option>)}
            </select>
            <select value={filters.source} onChange={e => setFilters(f => ({...f, source: e.target.value}))} className="input-field w-auto">
              <option value="">All Sources</option>
              {['Excel', 'CSV', 'Walk_In', 'Manual', 'Referral', 'GSheet'].map(s => <option key={s} value={s}>{s.replace(/_/g, ' ')}</option>)}
            </select>
            <select value={filters.qualification} onChange={e => setFilters(f => ({...f, qualification: e.target.value}))} className="input-field w-auto">
              <option value="">All Qualifications</option>
              {['ITI_Electrical', 'ITI_Other', 'Diploma_Electrical', 'BTech_Electrical', 'HSC', '10th', 'Other'].map(q => <option key={q} value={q}>{q.replace(/_/g, ' ')}</option>)}
            </select>
            <button onClick={() => setFilters({ status: '', source: '', qualification: '' })} className="text-sm text-gray-500 hover:text-gray-700">Clear</button>
          </div>
        )}
      </div>

      {/* Table */}
      <div className="bg-white rounded-xl shadow-sm border overflow-x-auto">
        <table className="w-full text-sm">
          <thead className="bg-gray-50 border-b">
            <tr>
              <th className="px-4 py-3 text-left font-medium text-gray-500">Candidate</th>
              <th className="px-4 py-3 text-left font-medium text-gray-500">Phone</th>
              <th className="px-4 py-3 text-left font-medium text-gray-500">Qualification</th>
              <th className="px-4 py-3 text-left font-medium text-gray-500">Exp</th>
              <th className="px-4 py-3 text-left font-medium text-gray-500">Location</th>
              <th className="px-4 py-3 text-left font-medium text-gray-500">Source</th>
              <th className="px-4 py-3 text-center font-medium text-gray-500">Score</th>
              <th className="px-4 py-3 text-left font-medium text-gray-500">Status</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {loading ? (
              <tr><td colSpan={8} className="py-12 text-center text-gray-400">Loading...</td></tr>
            ) : candidates.length === 0 ? (
              <tr><td colSpan={8} className="py-12 text-center text-gray-400">No candidates found</td></tr>
            ) : candidates.map(c => (
              <tr key={c._id} onClick={() => navigate(`/candidates/${c._id}`)} className="hover:bg-gray-50 cursor-pointer transition">
                <td className="px-4 py-3">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-full bg-primary-100 flex items-center justify-center text-primary-700 font-medium text-xs">
                      {c.fullName?.split(' ').map(n => n[0]).join('').slice(0,2)}
                    </div>
                    <div>
                      <div className="font-medium text-gray-900">{c.fullName}</div>
                      <div className="text-xs text-gray-400">{c.candidateId}</div>
                    </div>
                  </div>
                </td>
                <td className="px-4 py-3 text-gray-600 font-mono text-xs">{c.phone}</td>
                <td className="px-4 py-3 text-gray-600">{c.qualification?.replace(/_/g, ' ')}</td>
                <td className="px-4 py-3 text-gray-600">{c.experienceYears}y</td>
                <td className="px-4 py-3 text-gray-600 text-xs">{c.currentLocation?.city || c.preferredLocation?.city || '-'}</td>
                <td className="px-4 py-3"><span className="badge bg-gray-100 text-gray-600">{c.source?.replace(/_/g, ' ')}</span></td>
                <td className="px-4 py-3 text-center"><span className={`font-bold ${scoreColor(c.combinedScore)}`}>{c.combinedScore || '-'}</span></td>
                <td className="px-4 py-3"><span className={`badge ${statusColors[c.status] || 'bg-gray-100 text-gray-600'}`}>{c.status?.replace(/_/g, ' ')}</span></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Pagination */}
      {pagination.pages > 1 && (
        <div className="flex items-center justify-between">
          <span className="text-sm text-gray-500">Page {pagination.page} of {pagination.pages}</span>
          <div className="flex gap-2">
            <button onClick={() => fetchCandidates(pagination.page - 1)} disabled={pagination.page <= 1} className="btn-outline disabled:opacity-30"><ChevronLeft size={16} /></button>
            <button onClick={() => fetchCandidates(pagination.page + 1)} disabled={pagination.page >= pagination.pages} className="btn-outline disabled:opacity-30"><ChevronRight size={16} /></button>
          </div>
        </div>
      )}
    </div>
  );
}
