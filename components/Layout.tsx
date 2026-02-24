import React, { useState } from 'react';
import { UserRole } from '../types';

interface NavItem {
  id: string;
  label: string;
  icon: React.ReactNode;
  roles: UserRole[];
}

const Icon = ({ path, size = 18 }: { path: string; size?: number }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="currentColor" style={{ flexShrink: 0 }}>
    <path d={path} />
  </svg>
);

const NAV_ITEMS: NavItem[] = [
  {
    id: 'dashboard', label: 'Dashboard',
    icon: <Icon path="M3 13h8V3H3v10zm0 8h8v-6H3v6zm10 0h8V11h-8v10zm0-18v6h8V3h-8z" />,
    roles: [UserRole.ADMIN, UserRole.COLLECTOR, UserRole.VIEWER]
  },
  {
    id: 'my_portal', label: 'My Financials',
    icon: <Icon path="M11.8 10.9c-2.27-.59-3-1.2-3-2.15 0-1.09 1.01-1.85 2.7-1.85 1.78 0 2.44.85 2.5 2.1h2.21c-.07-1.72-1.12-3.3-3.21-3.81V3h-3v2.16c-1.94.42-3.5 1.68-3.5 3.61 0 2.31 1.91 3.46 4.7 4.13 2.5.6 3 1.48 3 2.41 0 .69-.49 1.79-2.7 1.79-2.06 0-2.87-.92-2.98-2.1h-2.2c.12 2.19 1.76 3.42 3.68 3.83V21h3v-2.15c1.95-.37 3.5-1.5 3.5-3.55 0-2.84-2.43-3.81-4.7-4.4z" />,
    roles: [UserRole.MEMBER]
  },
  {
    id: 'chits', label: 'Chit Groups',
    icon: <Icon path="M19 3H5c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2zm0 16H5V5h14v14zM7 10h2v7H7zm4-3h2v10h-2zm4 6h2v4h-2z" />,
    roles: [UserRole.ADMIN, UserRole.COLLECTOR, UserRole.VIEWER]
  },
  {
    id: 'members', label: 'Members',
    icon: <Icon path="M16 11c1.66 0 2.99-1.34 2.99-3S17.66 5 16 5c-1.66 0-3 1.34-3 3s1.34 3 3 3zm-8 0c1.66 0 2.99-1.34 2.99-3S9.66 5 8 5C6.34 5 5 6.34 5 8s1.34 3 3 3zm0 2c-2.33 0-7 1.17-7 3.5V19h14v-2.5c0-2.33-4.67-3.5-7-3.5zm8 0c-.29 0-.62.02-.97.05 1.16.84 1.97 1.97 1.97 3.45V19h6v-2.5c0-2.33-4.67-3.5-7-3.5z" />,
    roles: [UserRole.ADMIN, UserRole.COLLECTOR, UserRole.VIEWER]
  },
  {
    id: 'allotment', label: 'Allotment',
    icon: <Icon path="M11.5 1L2 6v10l9.5 5 9.5-5V6l-9.5-5zm0 17.5L5 15V8.5l6.5 3.5 6.5-3.5V15l-6.5 3.5z" />,
    roles: [UserRole.ADMIN, UserRole.COLLECTOR]
  },
  {
    id: 'collections', label: 'Collections',
    icon: <Icon path="M11.8 10.9c-2.27-.59-3-1.2-3-2.15 0-1.09 1.01-1.85 2.7-1.85 1.78 0 2.44.85 2.5 2.1h2.21c-.07-1.72-1.12-3.3-3.21-3.81V3h-3v2.16c-1.94.42-3.5 1.68-3.5 3.61 0 2.31 1.91 3.46 4.7 4.13 2.5.6 3 1.48 3 2.41 0 .69-.49 1.79-2.7 1.79-2.06 0-2.87-.92-2.98-2.1h-2.2c.12 2.19 1.76 3.42 3.68 3.83V21h3v-2.15c1.95-.37 3.5-1.5 3.5-3.55 0-2.84-2.43-3.81-4.7-4.4z" />,
    roles: [UserRole.ADMIN, UserRole.COLLECTOR]
  },
  {
    id: 'reports', label: 'Reports',
    icon: <Icon path="M19 3H5c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2zm0 16H5V5h14v14zM7 10h2v7H7zm4-3h2v10h-2zm4 6h2v4h-2z" />,
    roles: [UserRole.ADMIN, UserRole.COLLECTOR, UserRole.VIEWER]
  },
  {
    id: 'masters', label: 'Masters',
    icon: <Icon path="M19.14 12.94c.04-.3.06-.61.06-.94 0-.32-.02-.64-.07-.94l2.03-1.58c.18-.14.23-.41.12-.61l-1.92-3.32c-.12-.22-.37-.29-.59-.22l-2.39.96c-.5-.38-1.03-.7-1.62-.94l-.36-2.54c-.04-.24-.24-.41-.48-.41h-3.84c-.24 0-.43.17-.47.41l-.36 2.54c-.59.24-1.13.57-1.62.94l-2.39-.96c-.22-.08-.47 0-.59.22L2.74 8.87c-.12.21-.08.47.12.61l2.03 1.58c-.05.3-.09.63-.09.94s.02.64.07.94l-2.03 1.58c-.18.14-.23.41-.12.61l1.92 3.32c.12.22.37.29.59.22l2.39-.96c.5.38 1.03.7 1.62.94l.36 2.54c.05.24.24.41.48.41h3.84c.24 0 .44-.17.47-.41l.36-2.54c.59-.24 1.13-.56 1.62-.94l2.39.96c.22.08.47 0 .59-.22l1.92-3.32c.12-.21.07-.47-.12-.61l-2.01-1.58zM12 15.6c-1.98 0-3.6-1.62-3.6-3.6s1.62-3.6 3.6-3.6 3.6 1.62 3.6 3.6-1.62 3.6-3.6 3.6z" />,
    roles: [UserRole.ADMIN]
  },
];

const PAGE_TITLES: Record<string, string> = {
  dashboard: 'Dashboard',
  my_portal: 'My Financials',
  chits: 'Chit Groups',
  members: 'Member Directory',
  allotment: 'Allotment',
  collections: 'Collections',
  reports: 'Reports',
  masters: 'Masters',
};

interface Props {
  children: React.ReactNode;
  activePage: string;
  setActivePage: (id: string) => void;
  user: { name: string; role: UserRole };
  onLogout: () => void;
  onSync: () => void;
  isDirty?: boolean;
  isSyncing?: boolean;
  syncLabel?: string;
  syncColor?: string;
}

const Layout: React.FC<Props> = ({ children, activePage, setActivePage, user, onLogout, onSync, isDirty, isSyncing, syncLabel, syncColor }) => {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  const handleNavClick = (id: string) => {
    setActivePage(id);
    setIsMobileMenuOpen(false);
  };

  const syncIndicator = isSyncing
    ? { bg: '#f59e0b', label: 'Syncing…' }
    : isDirty
    ? { bg: '#ef4444', label: 'Unsaved' }
    : { bg: '#10b981', label: 'Synced' };

  const navContent = (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
      {/* Logo */}
      <div style={{ padding: '24px 20px 16px', borderBottom: '1px solid rgba(255,255,255,0.08)', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 4 }}>
            <div style={{ width: 32, height: 32, background: 'linear-gradient(135deg, #f5a623 0%, #e8921a 100%)', borderRadius: 8, display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 2px 8px rgba(245,166,35,0.4)' }}>
              <svg width="18" height="18" viewBox="0 0 24 24" fill="white"><path d="M11.5 1L2 6v10l9.5 5 9.5-5V6l-9.5-5zm0 17.5L5 15V8.5l6.5 3.5 6.5-3.5V15l-6.5 3.5z"/></svg>
            </div>
            <div>
              <div style={{ color: 'white', fontWeight: 800, fontSize: 14, letterSpacing: '-0.01em', lineHeight: 1.1 }}>Bhadrakali</div>
              <div style={{ color: 'rgba(255,255,255,0.4)', fontSize: 10, fontWeight: 600, letterSpacing: '0.08em', textTransform: 'uppercase' }}>Chits Manager</div>
            </div>
          </div>
        </div>
        <button onClick={() => setIsMobileMenuOpen(false)} style={{ color: 'rgba(255,255,255,0.4)', background: 'none', border: 'none', cursor: 'pointer', padding: 4, display: 'flex' }} className="md:hidden">
          <svg width="20" height="20" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
        </button>
      </div>

      {/* Nav section label */}
      <div style={{ padding: '20px 16px 8px' }}>
        <div style={{ fontSize: 10, fontWeight: 700, letterSpacing: '0.1em', color: 'rgba(255,255,255,0.25)', textTransform: 'uppercase', marginBottom: 6 }}>Navigation</div>
        <nav>
          {NAV_ITEMS.filter(item => item.roles.includes(user.role)).map((item) => (
            <button
              key={item.id}
              onClick={() => handleNavClick(item.id)}
              className={`nav-btn ${activePage === item.id ? 'active' : ''}`}
            >
              {item.icon}
              <span>{item.label}</span>
            </button>
          ))}
        </nav>
      </div>

      {/* Spacer */}
      <div style={{ flex: 1 }} />

      {/* Sync indicator */}
      {user.role !== UserRole.MEMBER && (
        <div style={{ padding: '0 16px 12px' }}>
          <button
            onClick={onSync}
            style={{ width: '100%', display: 'flex', alignItems: 'center', gap: 8, padding: '10px 12px', borderRadius: 8, background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.08)', cursor: 'pointer', transition: 'all 0.15s' }}
          >
            <div style={{ width: 7, height: 7, borderRadius: '50%', background: syncIndicator.bg, flexShrink: 0 }} />
            <span style={{ color: 'rgba(255,255,255,0.55)', fontSize: 12, fontWeight: 600 }}>{syncIndicator.label}</span>
            <svg style={{ marginLeft: 'auto', color: 'rgba(255,255,255,0.3)' }} className={isSyncing ? 'animate-spin' : ''} width="13" height="13" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" /></svg>
          </button>
        </div>
      )}

      {/* User Profile */}
      <div style={{ padding: '12px 16px 20px', borderTop: '1px solid rgba(255,255,255,0.08)' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <div style={{ width: 36, height: 36, flexShrink: 0, borderRadius: 10, background: 'linear-gradient(135deg, #3b82f6 0%, #2563eb 100%)', color: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 800, fontSize: 14, boxShadow: '0 2px 8px rgba(59,130,246,0.4)' }}>
            {user.name.charAt(0).toUpperCase()}
          </div>
          <div style={{ flex: 1, overflow: 'hidden' }}>
            <div style={{ color: 'rgba(255,255,255,0.9)', fontWeight: 700, fontSize: 13, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{user.name}</div>
            <div style={{ color: 'rgba(255,255,255,0.35)', fontSize: 10, textTransform: 'capitalize', fontWeight: 600, letterSpacing: '0.04em' }}>{user.role}</div>
          </div>
          <button
            onClick={onLogout}
            title="Logout"
            style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'rgba(255,255,255,0.3)', padding: 6, borderRadius: 6, transition: 'all 0.15s', display: 'flex' }}
            onMouseEnter={e => (e.currentTarget.style.color = '#ef4444')}
            onMouseLeave={e => (e.currentTarget.style.color = 'rgba(255,255,255,0.3)')}
          >
            <svg width="18" height="18" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
            </svg>
          </button>
        </div>
      </div>
    </div>
  );

  return (
    <div style={{ display: 'flex', height: '100vh', overflow: 'hidden', background: '#f8fafc' }}>
      {/* Sidebar Desktop */}
      <div className="hidden md:flex" style={{ width: 230, flexShrink: 0, background: 'var(--brand-navy)', flexDirection: 'column', height: '100%' }}>
        {navContent}
      </div>

      {/* Mobile Drawer */}
      {isMobileMenuOpen && (
        <div style={{ position: 'fixed', inset: 0, zIndex: 50 }} className="md:hidden">
          <div
            style={{ position: 'absolute', inset: 0, background: 'rgba(15,22,41,0.7)', backdropFilter: 'blur(4px)' }}
            onClick={() => setIsMobileMenuOpen(false)}
          />
          <div style={{ position: 'absolute', top: 0, left: 0, bottom: 0, width: 240, background: 'var(--brand-navy)', boxShadow: '4px 0 30px rgba(0,0,0,0.4)' }} className="animate-in">
            {navContent}
          </div>
        </div>
      )}

      {/* Main Area */}
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden', minWidth: 0 }}>
        {/* Top Header */}
        <header style={{ height: 58, borderBottom: '1.5px solid var(--border)', display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0 20px', background: 'white', flexShrink: 0, zIndex: 20 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <button
              onClick={() => setIsMobileMenuOpen(true)}
              className="md:hidden"
              style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-secondary)', padding: 6, borderRadius: 6, display: 'flex', alignItems: 'center' }}
              aria-label="Toggle menu"
            >
              <svg width="22" height="22" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" /></svg>
            </button>
            <div>
              <h2 style={{ fontSize: 16, fontWeight: 700, color: 'var(--text-primary)', margin: 0 }}>
                {PAGE_TITLES[activePage] || activePage}
              </h2>
            </div>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            {/* Mobile sync button */}
            {user.role !== UserRole.MEMBER && (
              <button
                onClick={onSync}
                className="md:hidden"
                style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '6px 10px', borderRadius: 8, background: 'var(--surface-2)', border: '1.5px solid var(--border)', fontSize: 11, fontWeight: 700, color: 'var(--text-secondary)', cursor: 'pointer' }}
              >
                <div style={{ width: 6, height: 6, borderRadius: '50%', background: syncIndicator.bg }} />
                {syncIndicator.label}
              </button>
            )}
          </div>
        </header>

        {/* Page Content */}
        <main style={{ flex: 1, overflowY: 'auto', background: 'var(--surface-2)', position: 'relative' }}>
          {children}
        </main>
      </div>
    </div>
  );
};

export default Layout;
