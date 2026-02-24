import React, { useMemo, useState } from 'react';
import { db } from '../db';
import { getInstallmentStatus } from '../services/logicService';
import { PaymentStatus } from '../types';

interface Props { memberId: string; }

const MemberPortal: React.FC<Props> = ({ memberId }) => {
  const members = db.getMembers();
  const currentMember = members.find(m => m.memberId === memberId);
  const memberships = db.getMemberships().filter(ms => ms.memberId === memberId);
  const chits = db.getChits();
  const allotments = db.getAllotments();
  const payments = db.getPayments();

  const activeGroup = memberships.length > 0 ? chits.find(c => c.chitGroupId === memberships[0].chitGroupId) : null;
  const membershipInfo = memberships.length > 0 ? memberships[0] : null;
  const [selectedMonth, setSelectedMonth] = useState<number>(1);

  const monthStatus = useMemo(() => {
    if (!activeGroup) return null;
    const status = getInstallmentStatus(activeGroup.chitGroupId, memberId, selectedMonth);
    const record = payments.find(p => p.chitGroupId === activeGroup.chitGroupId && p.memberId === memberId && p.monthNo === selectedMonth);
    return { ...status, paidDate: record?.paymentDate, paymentMode: record?.paymentMode };
  }, [activeGroup, memberId, selectedMonth, payments]);

  const financialSummary = useMemo(() => {
    if (!activeGroup || !membershipInfo) return { totalPaid: 0, outstanding: 0 };
    let totalPaid = 0, totalDue = 0;
    for (let m = 1; m <= activeGroup.totalMonths; m++) {
      const { due, paid } = getInstallmentStatus(activeGroup.chitGroupId, memberId, m);
      totalPaid += paid;
      totalDue += due;
    }
    return { totalPaid, outstanding: Math.max(0, totalDue - totalPaid) };
  }, [activeGroup, membershipInfo, memberId]);

  const groupWinners = useMemo(() => {
    if (!activeGroup) return [];
    return allotments
      .filter(a => a.chitGroupId === activeGroup.chitGroupId && a.isConfirmed && !a.revoked)
      .sort((a, b) => a.monthNo - b.monthNo);
  }, [activeGroup, allotments]);

  const isAllotted = groupWinners.some(w => w.memberId === memberId);

  if (!currentMember || !activeGroup) {
    return (
      <div style={{ padding: 40, textAlign: 'center', color: 'var(--text-muted)', fontSize: 14 }}>
        No active chit group found for your profile.
      </div>
    );
  }

  const isMonthPaid = monthStatus?.status === PaymentStatus.PAID;
  const upiLink = activeGroup.upiId && monthStatus && monthStatus.balance > 0
    ? `upi://pay?pa=${activeGroup.upiId}&pn=BhadrakaliChits&am=${monthStatus.balance}&cu=INR&tn=${encodeURIComponent(`M${selectedMonth} Installment - ${currentMember.name}`)}`
    : null;

  // Calculate progress
  const paidMonths = Array.from({ length: activeGroup.totalMonths }, (_, i) => i + 1)
    .filter(m => getInstallmentStatus(activeGroup.chitGroupId, memberId, m).status === 'paid').length;
  const progressPct = Math.round((paidMonths / activeGroup.totalMonths) * 100);

  return (
    <div style={{ padding: '24px', maxWidth: 780, margin: '0 auto', display: 'flex', flexDirection: 'column', gap: 20 }} className="animate-in">

      {/* Profile Header */}
      <div className="card" style={{ padding: 24 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 20 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
            <div style={{ width: 52, height: 52, borderRadius: 14, background: 'linear-gradient(135deg, #3b82f6 0%, #1d4ed8 100%)', color: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 800, fontSize: 20, boxShadow: '0 4px 14px rgba(59,130,246,0.4)', flexShrink: 0 }}>
              {currentMember.name.charAt(0)}
            </div>
            <div>
              <h2 style={{ fontSize: 20, fontWeight: 800, color: 'var(--text-primary)', margin: '0 0 4px', letterSpacing: '-0.01em' }}>{currentMember.name}</h2>
              <div style={{ fontSize: 12, color: 'var(--text-muted)', fontWeight: 500 }}>
                {activeGroup.name} · <span style={{ fontFamily: "'DM Mono', monospace" }}>Token #{membershipInfo?.tokenNo}</span>
              </div>
            </div>
          </div>
          <span style={{
            padding: '5px 12px', borderRadius: 20, fontSize: 10, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.07em',
            background: isAllotted ? 'var(--success-bg)' : 'var(--brand-accent-light)',
            color: isAllotted ? 'var(--success)' : 'var(--brand-accent)',
            border: `1px solid ${isAllotted ? '#a7f3d0' : '#bfdbfe'}`
          }}>
            {isAllotted ? '✓ Allotted' : 'Awaiting Allotment'}
          </span>
        </div>

        {/* Progress */}
        <div style={{ background: 'var(--surface-2)', borderRadius: 10, padding: '14px 16px', marginBottom: 16 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8 }}>
            <span style={{ fontSize: 11, fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.07em' }}>Chit Progress</span>
            <span style={{ fontSize: 12, fontWeight: 700, color: 'var(--text-secondary)' }}>{paidMonths} / {activeGroup.totalMonths} months paid</span>
          </div>
          <div style={{ height: 8, background: 'var(--border)', borderRadius: 20, overflow: 'hidden' }}>
            <div style={{ height: '100%', width: `${progressPct}%`, background: 'linear-gradient(90deg, #3b82f6, #2563eb)', borderRadius: 20, transition: 'width 0.5s ease' }} />
          </div>
        </div>

        {/* Financial Summary */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
          <div style={{ background: 'var(--success-bg)', border: '1.5px solid #a7f3d0', borderRadius: 10, padding: '14px 16px' }}>
            <div style={{ fontSize: 10, fontWeight: 700, color: 'var(--success)', textTransform: 'uppercase', letterSpacing: '0.07em', marginBottom: 6 }}>Total Paid</div>
            <div style={{ fontSize: 22, fontWeight: 800, color: 'var(--success)', fontFamily: "'DM Mono', monospace", letterSpacing: '-0.02em' }}>₹{financialSummary.totalPaid.toLocaleString()}</div>
          </div>
          <div style={{ background: 'var(--danger-bg)', border: '1.5px solid #fecaca', borderRadius: 10, padding: '14px 16px' }}>
            <div style={{ fontSize: 10, fontWeight: 700, color: 'var(--danger)', textTransform: 'uppercase', letterSpacing: '0.07em', marginBottom: 6 }}>Outstanding</div>
            <div style={{ fontSize: 22, fontWeight: 800, color: 'var(--danger)', fontFamily: "'DM Mono', monospace", letterSpacing: '-0.02em' }}>₹{financialSummary.outstanding.toLocaleString()}</div>
          </div>
        </div>
      </div>

      {/* Monthly Tracker */}
      <div className="card" style={{ padding: 24 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
          <div className="section-title">Monthly Installment Tracker</div>
          <div style={{ width: 180 }}>
            <select value={selectedMonth} onChange={(e) => setSelectedMonth(Number(e.target.value))}>
              {Array.from({ length: activeGroup.totalMonths }, (_, i) => i + 1).map(m => (
                <option key={m} value={m}>Month {m}</option>
              ))}
            </select>
          </div>
        </div>

        {monthStatus && (
          <div style={{ border: '1.5px solid var(--border)', borderRadius: 12, overflow: 'hidden' }} className="animate-in">
            {/* Status Header */}
            <div style={{ padding: '16px 20px', background: isMonthPaid ? 'var(--success-bg)' : 'var(--danger-bg)', borderBottom: `1.5px solid ${isMonthPaid ? '#a7f3d0' : '#fecaca'}`, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div>
                <div style={{ fontSize: 10, fontWeight: 700, color: isMonthPaid ? 'var(--success)' : 'var(--danger)', textTransform: 'uppercase', letterSpacing: '0.07em', marginBottom: 6 }}>Month {selectedMonth} Status</div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                  <span style={{ fontSize: 16, fontWeight: 800, color: isMonthPaid ? 'var(--success)' : 'var(--danger)' }}>
                    {isMonthPaid ? '✓ Paid' : '○ Unpaid'}
                  </span>
                  {monthStatus.paidDate && (
                    <span style={{ fontSize: 11, color: 'var(--text-muted)', fontFamily: "'DM Mono', monospace" }}>on {monthStatus.paidDate}</span>
                  )}
                </div>
              </div>
              <div style={{ textAlign: 'right' }}>
                <div style={{ fontSize: 10, fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.07em', marginBottom: 4 }}>Installment</div>
                <div style={{ fontSize: 22, fontWeight: 800, color: 'var(--text-primary)', fontFamily: "'DM Mono', monospace", letterSpacing: '-0.02em' }}>₹{monthStatus.due.toLocaleString()}</div>
              </div>
            </div>

            {/* Details */}
            <div style={{ padding: '16px 20px', background: 'white' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', padding: '10px 0', borderBottom: '1px solid var(--border)', fontSize: 13 }}>
                <span style={{ color: 'var(--text-secondary)' }}>Amount Received</span>
                <span style={{ fontWeight: 700, color: 'var(--success)', fontFamily: "'DM Mono', monospace" }}>₹{monthStatus.paid.toLocaleString()}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', padding: '10px 0', fontSize: 13 }}>
                <span style={{ color: 'var(--text-secondary)' }}>Balance Pending</span>
                <span style={{ fontWeight: 800, color: monthStatus.balance > 0 ? 'var(--danger)' : 'var(--text-muted)', fontFamily: "'DM Mono', monospace" }}>₹{monthStatus.balance.toLocaleString()}</span>
              </div>

              {!isMonthPaid && upiLink && (
                <div style={{ marginTop: 16, paddingTop: 16, borderTop: '1px dashed var(--border)' }}>
                  <div style={{ fontSize: 10, fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.07em', textAlign: 'center', marginBottom: 12 }}>Pay via UPI</div>
                  <a
                    href={upiLink}
                    style={{ display: 'block', width: '100%', padding: '13px', background: 'linear-gradient(135deg, #3b82f6 0%, #2563eb 100%)', color: 'white', fontWeight: 800, fontSize: 14, textAlign: 'center', borderRadius: 10, textDecoration: 'none', boxShadow: '0 4px 14px rgba(59,130,246,0.35)' }}
                  >
                    Pay ₹{monthStatus.balance.toLocaleString()} Now
                  </a>
                  <p style={{ fontSize: 10, color: 'var(--text-muted)', textAlign: 'center', marginTop: 8 }}>Opens your UPI app (GPay, PhonePe, Paytm, etc.)</p>
                </div>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Group Winners Table */}
      <div className="card" style={{ overflow: 'hidden' }}>
        <div style={{ padding: '16px 20px', borderBottom: '1.5px solid var(--border)', background: 'var(--surface-2)' }}>
          <div className="section-title">Group Prize Winners</div>
        </div>
        <table className="data-table">
          <thead>
            <tr>
              <th>Month</th>
              <th>Winner</th>
              <th style={{ textAlign: 'right' }}>Prize Amount</th>
            </tr>
          </thead>
          <tbody>
            {groupWinners.map((w, idx) => (
              <tr key={idx} style={{ background: w.memberId === memberId ? 'var(--brand-accent-light)' : 'transparent' }}>
                <td><span style={{ fontFamily: "'DM Mono', monospace", fontWeight: 700, fontSize: 12, color: 'var(--text-muted)' }}>M{w.monthNo}</span></td>
                <td>
                  <span style={{ fontWeight: w.memberId === memberId ? 800 : 600, color: w.memberId === memberId ? 'var(--brand-accent)' : 'var(--text-primary)' }}>
                    {members.find(m => m.memberId === w.memberId)?.name || 'Unknown'}
                    {w.memberId === memberId && <span style={{ marginLeft: 8, fontSize: 10, background: 'var(--brand-accent)', color: 'white', padding: '2px 6px', borderRadius: 20, fontWeight: 700 }}>You</span>}
                  </span>
                </td>
                <td style={{ textAlign: 'right', fontFamily: "'DM Mono', monospace", fontWeight: 700, color: '#3b82f6' }}>₹{w.allottedAmount.toLocaleString()}</td>
              </tr>
            ))}
            {groupWinners.length === 0 && (
              <tr><td colSpan={3} style={{ textAlign: 'center', padding: '40px', color: 'var(--text-muted)', fontSize: 13 }}>No allotments made yet in this group.</td></tr>
            )}
          </tbody>
        </table>
      </div>

      <div style={{ textAlign: 'center', fontSize: 10, fontWeight: 600, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.1em', paddingBottom: 16 }}>
        Read-Only Member Portal
      </div>
    </div>
  );
};

export default MemberPortal;
