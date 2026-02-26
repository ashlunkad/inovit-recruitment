import { useState } from 'react';
import { Outlet, NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { LayoutDashboard, Users, Upload, CheckSquare, Phone, MapPin, LogOut, Menu, X, ChevronDown } from 'lucide-react';

const navItems = [
  { to: '/', icon: LayoutDashboard, label: 'Dashboard', roles: ['super_admin', 'team_lead', 'agent', 'interviewer', 'telecaller'] },
  { to: '/candidates', icon: Users, label: 'Candidates', roles: ['super_admin', 'team_lead', 'agent', 'interviewer'] },
  { to: '/import', icon: Upload, label: 'Import Data', roles: ['super_admin', 'team_lead'] },
  { to: '/selection', icon: CheckSquare, label: 'Selection Panel', roles: ['super_admin', 'team_lead'] },
  { to: '/telecalling', icon: Phone, label: 'Telecalling', roles: ['super_admin', 'team_lead', 'telecaller', 'agent'] },
  { to: '/locations', icon: MapPin, label: 'Locations & Quota', roles: ['super_admin', 'team_lead'] },
];

export default function Layout() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [mobileOpen, setMobileOpen] = useState(false);

  const handleLogout = () => { logout(); navigate('/login'); };
  const filtered = navItems.filter(n => n.roles.includes(user?.role));

  const roleLabels = { super_admin: 'Super Admin', team_lead: 'Team Lead', agent: 'Agent', interviewer: 'Interviewer', telecaller: 'Telecaller' };

  const Sidebar = ({ mobile }) => (
    <div className={`${mobile ? 'w-64' : sidebarOpen ? 'w-60' : 'w-16'} bg-primary-900 text-white flex flex-col transition-all duration-200 h-full`}>
      <div className="p-4 border-b border-primary-700 flex items-center justify-between">
        {(sidebarOpen || mobile) && <div><div className="font-bold text-lg">INOVIT</div><div className="text-xs text-primary-300">Recruitment Platform</div></div>}
        {!mobile && <button onClick={() => setSidebarOpen(!sidebarOpen)} className="text-primary-300 hover:text-white">
          {sidebarOpen ? <X size={18} /> : <Menu size={18} />}
        </button>}
      </div>
      <nav className="flex-1 py-4 space-y-1 px-2">
        {filtered.map(item => (
          <NavLink key={item.to} to={item.to} end={item.to === '/'} onClick={() => mobile && setMobileOpen(false)}
            className={({ isActive }) => `flex items-center gap-3 px-3 py-2.5 rounded-lg transition text-sm ${isActive ? 'bg-primary-700 text-white' : 'text-primary-200 hover:bg-primary-800 hover:text-white'}`}>
            <item.icon size={18} />
            {(sidebarOpen || mobile) && <span>{item.label}</span>}
          </NavLink>
        ))}
      </nav>
      {(sidebarOpen || mobile) && (
        <div className="p-4 border-t border-primary-700">
          <div className="text-sm font-medium">{user?.name}</div>
          <div className="text-xs text-primary-300">{roleLabels[user?.role]}{user?.team ? ` • ${user.team}` : ''}</div>
          <button onClick={handleLogout} className="mt-3 flex items-center gap-2 text-sm text-primary-300 hover:text-white transition">
            <LogOut size={14} /> Sign Out
          </button>
        </div>
      )}
    </div>
  );

  return (
    <div className="h-screen flex overflow-hidden bg-gray-50">
      {/* Desktop sidebar */}
      <div className="hidden md:flex"><Sidebar /></div>
      {/* Mobile sidebar overlay */}
      {mobileOpen && (
        <div className="fixed inset-0 z-50 md:hidden">
          <div className="absolute inset-0 bg-black/50" onClick={() => setMobileOpen(false)} />
          <div className="relative z-10"><Sidebar mobile /></div>
        </div>
      )}
      {/* Main content */}
      <div className="flex-1 flex flex-col overflow-hidden">
        <header className="bg-white border-b border-gray-200 px-4 py-3 flex items-center justify-between md:px-6">
          <button onClick={() => setMobileOpen(true)} className="md:hidden text-gray-600"><Menu size={22} /></button>
          <div className="text-sm text-gray-500">
            Target: <span className="font-bold text-primary-600">500</span> Junior Electricians
          </div>
          <div className="flex items-center gap-3">
            <span className="text-xs bg-primary-100 text-primary-700 px-2 py-1 rounded-full font-medium">{user?.team || user?.role}</span>
          </div>
        </header>
        <main className="flex-1 overflow-y-auto p-4 md:p-6">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
