import { useState, useEffect, useRef } from 'react';
import { NavLink, Outlet, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import api from '../../api/axiosInstance';
import ErrorBoundary from '../common/ErrorBoundary';
import { LayoutDashboard, ClipboardCheck, Users, ScrollText, CheckCircle, X, Menu, LogOut, Sun, Moon, ExternalLink, Search, Zap, Clock, Bell, ShieldCheck } from 'lucide-react';

const baseNavItems = [
  { to: '/admin', label: 'Dashboard', end: true, icon: <LayoutDashboard size={20} /> },
  { to: '/admin/elections', label: 'Elections', icon: <ClipboardCheck size={20} /> },
  { to: '/admin/announcements', label: 'Announcements', icon: <Bell size={20} /> },
  { to: '/admin/templates', label: 'Templates', icon: <Clock size={20} /> },
  { to: '/admin/students', label: 'Students', icon: <Users size={20} /> },
  { to: '/admin/users', label: 'Admin Users', superAdminOnly: true, icon: <ShieldCheck size={20} /> },
  { to: '/admin/audit', label: 'Audit Log', superAdminOnly: true, icon: <ScrollText size={20} /> },
];

export default function AdminLayout() {
  const { admin, logoutAdmin, isSuperAdmin } = useAuth();
  const navItems = baseNavItems.filter(item => !item.superAdminOnly || isSuperAdmin);
  const navigate = useNavigate();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [darkMode, setDarkMode] = useState(() => {
    const saved = localStorage.getItem('darkMode');
    return saved ? JSON.parse(saved) : false;
  });
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [showSearch, setShowSearch] = useState(false);
  const searchRef = useRef(null);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (searchRef.current && !searchRef.current.contains(event.target)) {
        setShowSearch(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleSearch = async (query) => {
    setSearchQuery(query);
    if (query.length < 2) {
      setSearchResults([]);
      return;
    }
    try {
      const res = await api.get('/api/elections');
      const elections = res.data.elections || [];
      const filtered = elections.filter(e => 
        e.title.toLowerCase().includes(query.toLowerCase())
      ).slice(0, 5);
      setSearchResults(filtered);
    } catch (err) {
      console.error('Search failed:', err);
    }
  };

  useEffect(() => {
    if (darkMode) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
    localStorage.setItem('darkMode', JSON.stringify(darkMode));
  }, [darkMode]);

  const handleLogout = () => {
    logoutAdmin();
    navigate('/admin/login');
  };

  return (
    <div className="min-h-screen bg-surface-50 flex">
      {/* Mobile overlay */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 bg-surface-900/50 backdrop-blur-sm z-40 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside
        className={`
          fixed inset-y-0 left-0 z-50 w-64
          bg-gradient-to-b from-surface-800 to-surface-900
          flex flex-col
          transform transition-transform duration-300 ease-in-out
          lg:translate-x-0 lg:static lg:z-auto
          ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'}
        `}
      >
        {/* Logo / Branding */}
        <div className="flex items-center gap-3 px-6 h-16 border-b border-surface-700/50 shrink-0">
          <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-primary-500 to-accent-500 flex items-center justify-center shadow-lg">
            <CheckCircle size={16} className="text-white" strokeWidth={2.5} />
          </div>
          <span className="text-lg font-bold gradient-text tracking-tight select-none">
            VoteSync Pro
          </span>

          {/* Close button on mobile */}
          <button
            onClick={() => setSidebarOpen(false)}
            className="ml-auto lg:hidden text-surface-400 hover:text-white transition-colors"
            aria-label="Close sidebar"
          >
            <X size={20} />
          </button>
        </div>

        {/* Navigation */}
        <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto">
          {/* Search */}
          <div className="mb-4 relative" ref={searchRef}>
            <div className="relative">
              <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-surface-400" />
              <input
                type="text"
                placeholder="Search elections..."
                value={searchQuery}
                onChange={(e) => handleSearch(e.target.value)}
                onFocus={() => setShowSearch(true)}
                className="w-full bg-surface-700/50 border-0 rounded-lg pl-9 pr-3 py-2 text-sm text-surface-200 placeholder-surface-400 focus:outline-none focus:ring-1 focus:ring-primary-500"
              />
            </div>
            {showSearch && searchResults.length > 0 && (
              <div className="absolute left-0 right-0 mt-1 bg-surface-700 rounded-lg shadow-lg border border-surface-600 overflow-hidden z-50">
                {searchResults.map((election) => (
                  <button
                    key={election.id}
                    onClick={() => { navigate(`/admin/elections/${election.id}`); setSidebarOpen(false); setShowSearch(false); setSearchQuery(''); }}
                    className="w-full flex items-center gap-2 px-3 py-2 text-left hover:bg-surface-600 transition-colors"
                  >
                    <div className={`w-2 h-2 rounded-full ${election.status === 'active' ? 'bg-success-500' : election.status === 'completed' ? 'bg-surface-400' : 'bg-warning-500'}`} />
                    <span className="text-sm text-surface-200 truncate">{election.title}</span>
                  </button>
                ))}
              </div>
            )}
          </div>

          <div className="border-t border-surface-700/50 pt-4 mt-4">
            <p className="px-3 text-xs font-semibold text-surface-500 uppercase tracking-wider mb-2">Menu</p>
          </div>

          {navItems.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              end={item.end}
              onClick={() => setSidebarOpen(false)}
              className={({ isActive }) =>
                `flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all duration-150 group ${
                  isActive
                    ? 'bg-primary-600/20 text-primary-300 shadow-sm'
                    : 'text-surface-400 hover:bg-surface-700/50 hover:text-surface-200'
                }`
              }
            >
              {({ isActive }) => (
                <>
                  {/* Active indicator bar */}
                  <span
                    className={`absolute left-0 w-1 h-6 rounded-r-full transition-all duration-150 ${
                      isActive ? 'bg-primary-400' : 'bg-transparent'
                    }`}
                  />
                  <span className={`shrink-0 transition-colors duration-150 ${isActive ? 'text-primary-400' : 'text-surface-500 group-hover:text-surface-300'}`}>
                    {item.icon}
                  </span>
                  <span>{item.label}</span>
                </>
              )}
            </NavLink>
          ))}

          {/* Quick Links */}
          <div className="border-t border-surface-700/50 pt-4 mt-4">
            <p className="px-3 text-xs font-semibold text-surface-500 uppercase tracking-wider mb-2">Quick Links</p>
            <button
              onClick={() => { navigate('/'); setSidebarOpen(false); }}
              className="w-full flex items-center gap-2 px-3 py-2 rounded-lg text-sm text-surface-300 hover:bg-surface-700/50 hover:text-surface-100 transition-colors"
            >
              <ExternalLink size={14} />
              View Public Site
            </button>
            <button
              onClick={() => { navigate('/admin/elections/create'); setSidebarOpen(false); }}
              className="w-full flex items-center gap-2 px-3 py-2 rounded-lg text-sm text-surface-300 hover:bg-surface-700/50 hover:text-surface-100 transition-colors"
            >
              <Zap size={14} />
              Quick Create Election
            </button>
          </div>
        </nav>

        {/* Sidebar footer - admin info */}
        <div className="px-4 py-4 border-t border-surface-700/50 shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-full bg-gradient-to-br from-primary-500 to-accent-500 flex items-center justify-center text-white text-sm font-semibold shrink-0 shadow-md">
              {admin?.full_name
                ? admin.full_name.split(' ').map((n) => n[0]).join('').toUpperCase().slice(0, 2)
                : 'A'}
            </div>
            <div className="min-w-0 flex-1">
              <p className="text-sm font-medium text-surface-200 truncate">
                {admin?.full_name || 'Admin'}
              </p>
              <p className="text-xs text-surface-500 truncate">Administrator</p>
            </div>
          </div>
        </div>
      </aside>

      {/* Main content area */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Top bar */}
        <header className="sticky top-0 z-30 h-16 shrink-0 glass border-b border-surface-200/60">
          <div className="flex items-center justify-between h-full px-4 sm:px-6 lg:px-8 max-w-[1600px] mx-auto">
            {/* Left: hamburger + page context */}
            <div className="flex items-center gap-3">
              <button
                onClick={() => setSidebarOpen(true)}
                className="lg:hidden p-2 -ml-2 rounded-lg text-surface-600 hover:bg-surface-100 hover:text-surface-900 transition-colors"
                aria-label="Open sidebar"
              >
                <Menu size={20} />
              </button>

              <div className="hidden sm:flex items-center gap-2">
                <span className="badge badge-primary">Admin Panel</span>
              </div>
            </div>

            {/* Right: admin info + logout */}
            <div className="flex items-center gap-3">
              {/* Dark mode toggle */}
              <button
                onClick={() => setDarkMode(!darkMode)}
                className="p-2 rounded-lg text-surface-600 hover:bg-surface-100 dark:text-surface-400 dark:hover:bg-surface-700 transition-colors"
                aria-label="Toggle dark mode"
              >
                {darkMode ? <Sun size={18} /> : <Moon size={18} />}
              </button>

              {/* Admin name (visible on md+) */}
              <div className="hidden md:flex items-center gap-2 mr-1">
                <div className="w-8 h-8 rounded-full bg-gradient-to-br from-primary-100 to-accent-100 flex items-center justify-center text-primary-700 text-xs font-semibold">
                  {admin?.full_name
                    ? admin.full_name.split(' ').map((n) => n[0]).join('').toUpperCase().slice(0, 2)
                    : 'A'}
                </div>
                <span className="text-sm font-medium text-surface-700">
                  {admin?.full_name || 'Admin'}
                </span>
              </div>

              {/* Divider */}
              <div className="hidden md:block w-px h-6 bg-surface-200" />

              {/* Logout button */}
              <button
                onClick={handleLogout}
                className="btn btn-danger btn-sm"
              >
                <LogOut size={16} />
                <span className="hidden sm:inline">Logout</span>
              </button>
            </div>
          </div>
        </header>

        {/* Page content */}
        <main className="flex-1 px-4 sm:px-6 lg:px-8 py-6">
          <div className="max-w-[1400px] mx-auto">
            <ErrorBoundary level="section">
              <Outlet />
            </ErrorBoundary>
          </div>
        </main>
      </div>
    </div>
  );
}
