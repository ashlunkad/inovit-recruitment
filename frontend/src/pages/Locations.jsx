import { useState, useEffect } from 'react';
import { locationAPI } from '../services/api';
import toast from 'react-hot-toast';
import { MapPin, Plus, Target } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Legend } from 'recharts';

export default function Locations() {
  const [locations, setLocations] = useState([]);
  const [summary, setSummary] = useState({});
  const [loading, setLoading] = useState(true);
  const [showAdd, setShowAdd] = useState(false);
  const [form, setForm] = useState({ name: '', city: '', state: '', quota: 0 });

  const fetchData = async () => {
    try {
      const res = await locationAPI.getQuotaDashboard();
      setLocations(res.data.locations);
      setSummary(res.data.summary);
    } catch (err) { console.error(err); }
    finally { setLoading(false); }
  };

  useEffect(() => { fetchData(); }, []);

  const handleAdd = async () => {
    if (!form.name || !form.city || !form.state || !form.quota) return toast.error('All fields required');
    try {
      await locationAPI.create(form);
      toast.success('Location added');
      setShowAdd(false);
      setForm({ name: '', city: '', state: '', quota: 0 });
      fetchData();
    } catch (err) { toast.error(err.response?.data?.error || 'Failed'); }
  };

  const chartData = locations.map(l => ({
    name: l.name, Quota: l.quota, Deployed: l.deployed,
    Pipeline: (l.selected||0) + (l.offered||0) + (l.accepted||0) + (l.inTraining||0),
    Remaining: l.remaining
  }));

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-900">Locations & Quota</h1>
        <button onClick={() => setShowAdd(true)} className="btn-primary flex items-center gap-1"><Plus size={16} /> Add Location</button>
      </div>

      {/* Summary */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="card !p-4 text-center">
          <div className="text-3xl font-bold text-primary-700">{summary.totalQuota || 0}</div>
          <div className="text-sm text-gray-500">Total Quota</div>
        </div>
        <div className="card !p-4 text-center">
          <div className="text-3xl font-bold text-green-600">{summary.totalDeployed || 0}</div>
          <div className="text-sm text-gray-500">Deployed</div>
        </div>
        <div className="card !p-4 text-center">
          <div className="text-3xl font-bold text-orange-500">{summary.totalPipeline || 0}</div>
          <div className="text-sm text-gray-500">In Pipeline</div>
        </div>
        <div className="card !p-4 text-center">
          <div className="text-3xl font-bold text-blue-600">{summary.remaining || 0}</div>
          <div className="text-sm text-gray-500">Remaining</div>
        </div>
      </div>

      {/* Chart */}
      <div className="card">
        <h2 className="font-semibold text-gray-800 mb-4">Quota vs Deployment by Location</h2>
        <ResponsiveContainer width="100%" height={350}>
          <BarChart data={chartData}>
            <XAxis dataKey="name" tick={{ fontSize: 11 }} />
            <YAxis tick={{ fontSize: 11 }} />
            <Tooltip />
            <Legend />
            <Bar dataKey="Quota" fill="#D6EAF8" radius={[3,3,0,0]} />
            <Bar dataKey="Deployed" fill="#27AE60" radius={[3,3,0,0]} />
            <Bar dataKey="Pipeline" fill="#F0B27A" radius={[3,3,0,0]} />
          </BarChart>
        </ResponsiveContainer>
      </div>

      {/* Table */}
      <div className="bg-white rounded-xl shadow-sm border overflow-x-auto">
        <table className="w-full text-sm">
          <thead className="bg-gray-50 border-b">
            <tr>
              <th className="px-4 py-3 text-left font-medium text-gray-500">Location</th>
              <th className="px-4 py-3 text-center font-medium text-gray-500">Quota</th>
              <th className="px-4 py-3 text-center font-medium text-gray-500">Selected</th>
              <th className="px-4 py-3 text-center font-medium text-gray-500">Offered</th>
              <th className="px-4 py-3 text-center font-medium text-gray-500">Accepted</th>
              <th className="px-4 py-3 text-center font-medium text-gray-500">Training</th>
              <th className="px-4 py-3 text-center font-medium text-gray-500">Deployed</th>
              <th className="px-4 py-3 text-center font-medium text-gray-500">Remaining</th>
              <th className="px-4 py-3 text-left font-medium text-gray-500">Progress</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {locations.map(l => {
              const pct = l.quota > 0 ? Math.round((l.deployed / l.quota) * 100) : 0;
              const warn = l.remaining <= 5;
              return (
                <tr key={l._id} className={warn && l.remaining > 0 ? 'bg-yellow-50' : l.remaining <= 0 ? 'bg-red-50' : ''}>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2">
                      <MapPin size={14} className="text-gray-400" />
                      <div>
                        <div className="font-medium text-gray-800">{l.name}</div>
                        <div className="text-xs text-gray-400">{l.city}, {l.state}</div>
                      </div>
                    </div>
                  </td>
                  <td className="px-4 py-3 text-center font-bold">{l.quota}</td>
                  <td className="px-4 py-3 text-center">{l.selected}</td>
                  <td className="px-4 py-3 text-center">{l.offered}</td>
                  <td className="px-4 py-3 text-center">{l.accepted}</td>
                  <td className="px-4 py-3 text-center">{l.inTraining}</td>
                  <td className="px-4 py-3 text-center font-bold text-green-600">{l.deployed}</td>
                  <td className="px-4 py-3 text-center">
                    <span className={`font-bold ${l.remaining <= 0 ? 'text-red-600' : l.remaining <= 5 ? 'text-yellow-600' : 'text-blue-600'}`}>
                      {l.remaining} {l.remaining <= 0 && '⛔'} {l.remaining > 0 && l.remaining <= 5 && '⚠️'}
                    </span>
                  </td>
                  <td className="px-4 py-3 w-40">
                    <div className="flex items-center gap-2">
                      <div className="flex-1 bg-gray-200 rounded-full h-2">
                        <div className={`h-2 rounded-full ${pct >= 80 ? 'bg-green-500' : pct >= 50 ? 'bg-blue-500' : 'bg-yellow-500'}`} style={{ width: `${Math.min(pct, 100)}%` }}></div>
                      </div>
                      <span className="text-xs text-gray-500 w-8">{pct}%</span>
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* Add Modal */}
      {showAdd && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-md p-6">
            <h3 className="text-lg font-bold text-gray-900 mb-4">Add Deployment Location</h3>
            <div className="space-y-3">
              <input value={form.name} onChange={e => setForm(f=>({...f,name:e.target.value}))} placeholder="Location Name (e.g., Delhi NCR)" className="input-field" />
              <div className="grid grid-cols-2 gap-3">
                <input value={form.city} onChange={e => setForm(f=>({...f,city:e.target.value}))} placeholder="City" className="input-field" />
                <input value={form.state} onChange={e => setForm(f=>({...f,state:e.target.value}))} placeholder="State" className="input-field" />
              </div>
              <input type="number" value={form.quota} onChange={e => setForm(f=>({...f,quota:Number(e.target.value)}))} placeholder="Quota (e.g., 80)" className="input-field" min={1} />
            </div>
            <div className="flex gap-3 justify-end mt-4">
              <button onClick={() => setShowAdd(false)} className="btn-outline">Cancel</button>
              <button onClick={handleAdd} className="btn-primary">Add Location</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
