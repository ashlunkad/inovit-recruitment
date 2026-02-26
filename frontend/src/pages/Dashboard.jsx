import { useState, useEffect } from 'react';
import { dashboardAPI } from '../services/api';
import { Users, Target, TrendingUp, Phone, MessageSquare, MapPin, ArrowRight } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, FunnelChart } from 'recharts';
import { useNavigate } from 'react-router-dom';

const COLORS = ['#2E86C1', '#27AE60', '#E67E22', '#E74C3C', '#8E44AD', '#1ABC9C', '#F39C12', '#3498DB'];

const StatCard = ({ icon: Icon, label, value, sub, color = 'primary' }) => (
  <div className="card flex items-center gap-4">
    <div className={`w-12 h-12 rounded-xl bg-${color}-50 flex items-center justify-center`}>
      <Icon size={22} className={`text-${color}-500`} />
    </div>
    <div>
      <div className="text-2xl font-bold text-gray-900">{value}</div>
      <div className="text-sm text-gray-500">{label}</div>
      {sub && <div className="text-xs text-gray-400 mt-0.5">{sub}</div>}
    </div>
  </div>
);

const StatusBadge = ({ status, count }) => {
  const colors = {
    New: 'bg-blue-100 text-blue-700', Interested: 'bg-green-100 text-green-700',
    Screening: 'bg-yellow-100 text-yellow-700', Portal_Applied: 'bg-purple-100 text-purple-700',
    Interview_Scheduled: 'bg-indigo-100 text-indigo-700', Interview_Done: 'bg-indigo-100 text-indigo-800',
    Selected: 'bg-emerald-100 text-emerald-700', Rejected: 'bg-red-100 text-red-700',
    Offered: 'bg-orange-100 text-orange-700', Deployed: 'bg-green-200 text-green-800',
    On_Hold: 'bg-amber-100 text-amber-700', Training: 'bg-cyan-100 text-cyan-700',
  };
  return (
    <div className={`badge ${colors[status] || 'bg-gray-100 text-gray-600'} text-xs px-3 py-1`}>
      {status?.replace(/_/g, ' ')} <span className="ml-1 font-bold">{count}</span>
    </div>
  );
};

export default function Dashboard() {
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    dashboardAPI.getStats().then(res => setStats(res.data)).catch(console.error).finally(() => setLoading(false));
  }, []);

  if (loading) return <div className="flex items-center justify-center h-64"><div className="animate-spin rounded-full h-10 w-10 border-b-2 border-primary-600"></div></div>;
  if (!stats) return <div className="text-center text-gray-500 py-10">Failed to load dashboard data</div>;

  const { overview, pipeline, sources, activity, locations, recentActivity } = stats;

  const locationData = (locations || []).map(l => ({
    name: l.name?.replace(' ', '\n') || l.city,
    quota: l.quota, deployed: l.deployed, pipeline: (l.selected||0)+(l.offered||0)+(l.accepted||0)+(l.inTraining||0)
  }));

  const sourceData = (sources || []).map((s, i) => ({ name: s._id || 'Unknown', value: s.count, fill: COLORS[i % COLORS.length] }));

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-900">Dashboard</h1>
        <div className="text-sm text-gray-500">Target: <span className="font-bold text-primary-700">500</span> Deployments</div>
      </div>

      {/* Progress bar */}
      <div className="card">
        <div className="flex items-center justify-between mb-2">
          <span className="text-sm font-medium text-gray-600">Deployment Progress</span>
          <span className="text-lg font-bold text-primary-700">{overview.deployed} / {overview.target}</span>
        </div>
        <div className="w-full bg-gray-200 rounded-full h-4">
          <div className="bg-gradient-to-r from-primary-500 to-success-500 h-4 rounded-full transition-all duration-500" style={{ width: `${Math.min(overview.progressPercent, 100)}%` }}></div>
        </div>
        <div className="text-right text-sm text-gray-500 mt-1">{overview.progressPercent}% complete</div>
      </div>

      {/* Stat cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard icon={Users} label="Total Candidates" value={overview.total} sub={`+${overview.todayNew} today`} />
        <StatCard icon={Target} label="Deployed" value={overview.deployed} sub={`${overview.target - overview.deployed} remaining`} color="success" />
        <StatCard icon={MessageSquare} label="Messages Today" value={activity.todayMessages} color="accent" />
        <StatCard icon={Phone} label="Calls Today" value={activity.todayCalls} color="danger" />
      </div>

      {/* Pipeline status */}
      <div className="card">
        <h2 className="text-lg font-semibold mb-4">Pipeline Overview</h2>
        <div className="flex flex-wrap gap-2">
          {(pipeline || []).map(p => <StatusBadge key={p._id} status={p._id} count={p.count} />)}
        </div>
      </div>

      {/* Charts */}
      <div className="grid lg:grid-cols-2 gap-6">
        {/* Location quota */}
        <div className="card">
          <h2 className="text-lg font-semibold mb-4">Location Quota Status</h2>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={locationData} margin={{ top: 5, right: 10, left: 0, bottom: 5 }}>
              <XAxis dataKey="name" tick={{ fontSize: 11 }} />
              <YAxis tick={{ fontSize: 11 }} />
              <Tooltip />
              <Bar dataKey="quota" fill="#D6EAF8" name="Quota" radius={[4,4,0,0]} />
              <Bar dataKey="deployed" fill="#27AE60" name="Deployed" radius={[4,4,0,0]} />
              <Bar dataKey="pipeline" fill="#F0B27A" name="In Pipeline" radius={[4,4,0,0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* Source distribution */}
        <div className="card">
          <h2 className="text-lg font-semibold mb-4">Candidate Sources</h2>
          <ResponsiveContainer width="100%" height={300}>
            <PieChart>
              <Pie data={sourceData} cx="50%" cy="50%" outerRadius={100} dataKey="value" label={({ name, value }) => `${name}: ${value}`}>
                {sourceData.map((entry, i) => <Cell key={i} fill={entry.fill} />)}
              </Pie>
              <Tooltip />
            </PieChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Recent Activity */}
      <div className="card">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold">Recent Activity</h2>
          <button onClick={() => navigate('/candidates')} className="text-sm text-primary-600 hover:text-primary-700 flex items-center gap-1">View all <ArrowRight size={14} /></button>
        </div>
        <div className="space-y-3">
          {(recentActivity || []).slice(0, 8).map((event, i) => (
            <div key={i} className="flex items-start gap-3 text-sm border-b border-gray-50 pb-3 last:border-0">
              <div className="text-lg">{
                { whatsapp_out: '📤', whatsapp_in: '📩', call_outbound: '📞', call_inbound: '📲',
                  status_change: '🔄', panel_decision: '✅', internal_note: '📝', system_event: '⚙️',
                  document_event: '📄', score_update: '🎯' }[event.eventType] || '📌'
              }</div>
              <div className="flex-1 min-w-0">
                <div className="text-gray-800 truncate">{event.content || event.eventType?.replace(/_/g, ' ')}</div>
                <div className="text-xs text-gray-400">{event.candidate?.fullName || 'Unknown'} • {new Date(event.createdAt).toLocaleString('en-IN', { dateStyle: 'short', timeStyle: 'short' })}</div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
