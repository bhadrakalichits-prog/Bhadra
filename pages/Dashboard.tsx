import React, { useState, useMemo } from 'react';
import { db } from '../db';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, LineChart, Line } from 'recharts';

const StatCard = ({ label, value, icon, color, bgColor }: { label: string; value: string | number; icon: string; color: string; bgColor: string }) => (
  <div className="stat-card">
    <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 12 }}>
      <div style={{ width: 40, height: 40, borderRadius: 10, background: bgColor, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 18 }}>
        {icon}
      </div>
    </div>
    <div style={{ fontSize: 22, fontWeight: 800, color, letterSpacing: '-0.02em', marginBottom: 4 }}>{value}</div>
    <div style={{ fontSize: 11, fontWeight: 600, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.07em' }}>{label}</div>
  </div>
);

const CustomTooltip = ({ active, payload, label }: any) => {
  if (active && payload && payload.length) {
    return (
      <div style={{ background: 'white', border: '1.5px solid var(--border)', borderRadius: 10, padding: '10px 14px', boxShadow: 'var(--shadow-md)', fontSize: 12 }}>
        <div style={{ fontWeight: 700, color: 'var(--text-primary)', marginBottom: 4 }}>{label}</div>
        {payload.map((p: any, i: number) => (
          <div key={i} style={{ color: p.color, fontWeight: 600 }}>₹{Number(p.value).toLocaleString()}</div>
        ))}
      </div>
    );
  }
  return null;
};

const Dashboard: React.FC = () => {
  const chits = db.getChits();
  const [selectedChitId, setSelectedChitId] = useState<string>('all');
  const [selectedMonth, setSelectedMonth] = useState<number | 'all'>('all');

  const members = db.getMembers();
  const installments = db.getInstallments();
  const payments = db.getPayments();
  const allotments = db.getAllotments();

  const targetChitIds = useMemo(() => {
    if (selectedChitId === 'all') return chits.map(c => c.chitGroupId);
    return [selectedChitId];
  }, [selectedChitId, chits]);

  const targetChits = useMemo(() =>
    chits.filter(c => targetChitIds.includes(c.chitGroupId)),
    [chits, targetChitIds]);

  const maxMonthsInSection = useMemo(() => {
    if (targetChits.length === 0) return 0;
    return Math.max(...targetChits.map(c => c.totalMonths));
  }, [targetChits]);

  const filteredInstallments = installments.filter(s => {
    const chitMatch = targetChitIds.includes(s.chitGroupId);
    const monthMatch = selectedMonth === 'all' || s.monthNo === selectedMonth;
    return chitMatch && monthMatch;
  });

  const filteredPayments = payments.filter(p => {
    const chitMatch = targetChitIds.includes(p.chitGroupId);
    const monthMatch = selectedMonth === 'all' || p.monthNo === selectedMonth;
    return chitMatch && monthMatch;
  });

  const filteredAllotments = allotments.filter(a => {
    const chitMatch = targetChitIds.includes(a.chitGroupId);
    const monthMatch = selectedMonth === 'all' || a.monthNo === selectedMonth;
    return chitMatch && monthMatch && a.isConfirmed && !a.revoked;
  });

  const totalCollected = filteredPayments.reduce((sum, p) => sum + p.paidAmount, 0);
  const totalOutstanding = filteredInstallments.reduce((sum, s) => sum + Math.max(0, s.dueAmount - s.paidAmount), 0);
  const totalAllotted = filteredAllotments.reduce((sum, a) => sum + a.allottedAmount, 0);
  const netBalance = totalCollected - totalAllotted;
  const activeChitCount = targetChits.length;

  const targetMemberships = db.getMemberships().filter(ms => targetChitIds.includes(ms.chitGroupId));
  const uniqueMemberIds = new Set(targetMemberships.map(ms => ms.memberId));
  const activeMemberCount = Array.from(uniqueMemberIds).filter(id => {
    const m = members.find(mem => mem.memberId === id);
    return m && m.isActive;
  }).length;

  const handleMessageGroup = () => {
    if (selectedChitId === 'all') { alert('Please select a specific group to message.'); return; }
    const currentChit = chits.find(c => c.chitGroupId === selectedChitId);
    if (!currentChit) return;
    if (currentChit.whatsappGroupLink) window.open(currentChit.whatsappGroupLink, '_blank');
    else alert('WhatsApp Group Link not found for this group. Update it in Masters.');
  };

  const hasData = filteredPayments.length > 0 || filteredInstallments.length > 0;
  const groupLabel = selectedChitId === 'all' ? 'All Groups' : (targetChits[0]?.name || 'Selection');
  const summaryText = selectedMonth === 'all'
    ? `Full tenure · ${groupLabel}`
    : `${groupLabel} · Month ${selectedMonth}`;

  const totalDue = filteredInstallments.reduce((s, i) => s + i.dueAmount, 0);
  const collectionPct = totalDue > 0 ? Math.round((totalCollected / totalDue) * 100) : 0;

  const chartData = [
    { name: 'Target', value: totalDue, fill: '#e2e8f0' },
    { name: 'Collected', value: totalCollected, fill: '#3b82f6' },
    { name: 'Allotted', value: totalAllotted, fill: '#f5a623' },
  ];

  return (
    <div style={{ padding: '24px', display: 'flex', flexDirection: 'column', gap: 20 }} className="animate-in">

      {/* Filter Bar */}
      <div className="filter-bar" style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'flex-end', gap: 16, justifyContent: 'space-between' }}>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 12, flex: 1 }}>
          <div style={{ minWidth: 200, flex: 1 }}>
            <label>Chit Group</label>
            <select value={selectedChitId} onChange={(e) => { setSelectedChitId(e.target.value); setSelectedMonth('all'); }}>
              <option value="all">All Groups (Consolidated)</option>
              <optgroup label="Individual Groups">
                {chits.map(c => <option key={c.chitGroupId} value={c.chitGroupId}>{c.name}</option>)}
              </optgroup>
            </select>
          </div>
          <div style={{ minWidth: 160, flex: 1 }}>
            <label>Time Period</label>
            <select value={selectedMonth} onChange={(e) => setSelectedMonth(e.target.value === 'all' ? 'all' : Number(e.target.value))}>
              <option value="all">Full Tenure (All Months)</option>
              {Array.from({ length: maxMonthsInSection }, (_, i) => i + 1).map(m => (
                <option key={m} value={m}>Month {m}</option>
              ))}
            </select>
          </div>
        </div>
        {selectedChitId !== 'all' && (
          <button
            onClick={handleMessageGroup}
            style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '9px 16px', background: '#25d366', color: 'white', border: 'none', borderRadius: 8, fontWeight: 700, fontSize: 12, cursor: 'pointer', boxShadow: '0 2px 8px rgba(37,211,102,0.35)', whiteSpace: 'nowrap' }}
          >
            <svg width="16" height="16" fill="currentColor" viewBox="0 0 24 24"><path d="M12.031 6.172c-3.181 0-5.767 2.586-5.767 5.767 0 1.267.405 2.436 1.096 3.39l-.79 2.885 2.955-.775a5.727 5.727 0 002.506.582c3.181 0 5.767-2.586 5.767-5.767 0-3.181-2.586-5.767-5.767-5.767zM12 2C6.477 2 2 6.477 2 12c0 1.891.524 3.662 1.435 5.176L2.05 22l4.957-1.301C8.42 21.515 10.138 22 12 22c5.523 0 10-4.477 10-10S17.523 2 12 2z"/></svg>
            Message Group
          </button>
        )}
      </div>

      {/* Stat Cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: 16 }}>
        <StatCard label="Active Groups" value={activeChitCount} icon="📋" color="#3b82f6" bgColor="#eff6ff" />
        <StatCard label="Total Members" value={activeMemberCount} icon="👥" color="#8b5cf6" bgColor="#f5f3ff" />
        <StatCard label="Total Collected" value={`₹${totalCollected.toLocaleString()}`} icon="💰" color="#10b981" bgColor="#ecfdf5" />
        <StatCard label="Outstanding" value={`₹${totalOutstanding.toLocaleString()}`} icon="⏳" color="#ef4444" bgColor="#fef2f2" />
      </div>

      {/* Charts Row */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: 16 }}>
        {/* Collection vs Target */}
        <div className="card" style={{ padding: 24 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 20 }}>
            <div>
              <div className="section-title" style={{ marginBottom: 4 }}>Collection Analysis</div>
              <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>{summaryText}</div>
            </div>
            {!hasData && <span style={{ fontSize: 10, fontWeight: 700, color: 'var(--danger)', background: 'var(--danger-bg)', padding: '3px 8px', borderRadius: 20, border: '1px solid #fecaca' }}>No Data</span>}
          </div>
          <div style={{ height: 220 }}>
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={chartData} barSize={36}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                <XAxis dataKey="name" fontSize={11} tickLine={false} axisLine={false} style={{ fontWeight: 600, fill: 'var(--text-muted)' }} />
                <YAxis fontSize={10} tickLine={false} axisLine={false} style={{ fill: 'var(--text-muted)' }} tickFormatter={v => `₹${(v/1000).toFixed(0)}k`} />
                <Tooltip content={<CustomTooltip />} cursor={{ fill: 'rgba(0,0,0,0.02)' }} />
                <Bar dataKey="value" radius={[6, 6, 0, 0]}>
                  {chartData.map((entry, index) => (
                    <rect key={index} fill={entry.fill} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Summary Panel */}
        <div className="card" style={{ padding: 24, display: 'flex', flexDirection: 'column', gap: 0 }}>
          <div className="section-title" style={{ marginBottom: 20 }}>Financial Summary</div>

          {/* Progress Bar */}
          <div style={{ marginBottom: 24 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8 }}>
              <span style={{ fontSize: 12, color: 'var(--text-secondary)', fontWeight: 600 }}>Collection Rate</span>
              <span style={{ fontSize: 13, fontWeight: 800, color: collectionPct >= 80 ? 'var(--success)' : collectionPct >= 50 ? 'var(--warning)' : 'var(--danger)' }}>{collectionPct}%</span>
            </div>
            <div style={{ height: 8, background: 'var(--surface-3)', borderRadius: 20, overflow: 'hidden' }}>
              <div style={{ height: '100%', width: `${Math.min(collectionPct, 100)}%`, background: collectionPct >= 80 ? 'var(--success)' : collectionPct >= 50 ? 'var(--warning)' : 'var(--danger)', borderRadius: 20, transition: 'width 0.5s ease' }} />
            </div>
          </div>

          {/* Key figures */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 0 }}>
            {[
              { label: 'Total Due (Target)', value: `₹${totalDue.toLocaleString()}`, color: 'var(--text-primary)' },
              { label: 'Total Collected', value: `₹${totalCollected.toLocaleString()}`, color: 'var(--success)' },
              { label: 'Total Outstanding', value: `₹${totalOutstanding.toLocaleString()}`, color: 'var(--danger)' },
              { label: 'Prize Payouts', value: `₹${totalAllotted.toLocaleString()}`, color: '#f5a623' },
            ].map((row, i) => (
              <div key={i} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '12px 0', borderBottom: i < 3 ? '1px solid var(--border)' : 'none' }}>
                <span style={{ fontSize: 12, color: 'var(--text-secondary)', fontWeight: 500 }}>{row.label}</span>
                <span style={{ fontSize: 14, fontWeight: 700, color: row.color, fontFamily: "'DM Mono', monospace" }}>{row.value}</span>
              </div>
            ))}
          </div>

          {/* Net Balance */}
          <div style={{ marginTop: 20, padding: '16px', background: netBalance >= 0 ? 'var(--success-bg)' : 'var(--danger-bg)', borderRadius: 10, border: `1.5px solid ${netBalance >= 0 ? '#a7f3d0' : '#fecaca'}`, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ fontSize: 11, fontWeight: 700, color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.07em' }}>Net Cash Balance</span>
            <span style={{ fontSize: 20, fontWeight: 800, color: netBalance >= 0 ? 'var(--success)' : 'var(--danger)', fontFamily: "'DM Mono', monospace", letterSpacing: '-0.02em' }}>
              ₹{netBalance.toLocaleString()}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
