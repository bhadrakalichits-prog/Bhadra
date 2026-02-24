import React, { useState } from 'react';
import { db } from '../db';
import { PaymentStatus, PaymentMode } from '../types';
import { getInstallmentStatus } from '../services/logicService';
import { sendPaymentLink, sendReceipt } from '../services/whatsappService';

const StatusBadge = ({ status }: { status: string }) => {
  const cls = status === 'paid' ? 'badge-paid' : status === 'partial' ? 'badge-partial' : 'badge-pending';
  return <span className={cls}>{status}</span>;
};

const Collections: React.FC = () => {
  const chits = db.getChits();
  const [selectedChit, setSelectedChit] = useState(chits[0]?.chitGroupId || '');
  const [selectedMonth, setSelectedMonth] = useState(1);
  const [showCollectDialog, setShowCollectDialog] = useState<any>(null);

  const currentChit = chits.find(c => c.chitGroupId === selectedChit);
  const memberships = db.getMemberships().filter(m => m.chitGroupId === selectedChit);
  const members = db.getMembers();

  const handleCollect = (formData: any) => {
    const { memberId, amount, mode, ref } = formData;
    const member = members.find(m => m.memberId === memberId);
    db.addPayment({
      paymentId: `pay_${Date.now()}`,
      chitGroupId: selectedChit,
      memberId,
      monthNo: selectedMonth,
      paidAmount: Number(amount),
      paymentDate: new Date().toISOString().split('T')[0],
      paymentMode: mode,
      referenceNo: ref,
      collectedBy: 'admin'
    });
    if (member && currentChit) {
      sendReceipt(selectedChit, memberId, member.mobile, member.name, currentChit.name, selectedMonth, Number(amount));
    }
    setShowCollectDialog(null);
  };

  const totalDue = memberships.reduce((sum, gm) => sum + getInstallmentStatus(selectedChit, gm.memberId, selectedMonth).due, 0);
  const totalPaid = memberships.reduce((sum, gm) => sum + getInstallmentStatus(selectedChit, gm.memberId, selectedMonth).paid, 0);
  const totalBalance = totalDue - totalPaid;
  const paidCount = memberships.filter(gm => getInstallmentStatus(selectedChit, gm.memberId, selectedMonth).status === 'paid').length;

  return (
    <div style={{ padding: 24, display: 'flex', flexDirection: 'column', gap: 20 }} className="animate-in">

      {/* Filter Bar */}
      <div className="filter-bar" style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'flex-end', gap: 16 }}>
        <div style={{ flex: 1, minWidth: 200 }}>
          <label>Chit Group</label>
          <select value={selectedChit} onChange={(e) => setSelectedChit(e.target.value)}>
            {chits.map(c => <option key={c.chitGroupId} value={c.chitGroupId}>{c.name}</option>)}
          </select>
        </div>
        <div style={{ width: 130 }}>
          <label>Month</label>
          <select value={selectedMonth} onChange={(e) => setSelectedMonth(Number(e.target.value))}>
            {Array.from({ length: currentChit?.totalMonths || 0 }, (_, i) => i + 1).map(m => (
              <option key={m} value={m}>Month {m}</option>
            ))}
          </select>
        </div>
      </div>

      {/* Summary Strip */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))', gap: 12 }}>
        {[
          { label: 'Total Members', value: memberships.length, color: 'var(--text-primary)' },
          { label: 'Paid', value: paidCount, color: 'var(--success)' },
          { label: 'Pending', value: memberships.length - paidCount, color: 'var(--danger)' },
          { label: 'Collected', value: `₹${totalPaid.toLocaleString()}`, color: 'var(--success)' },
          { label: 'Outstanding', value: `₹${totalBalance.toLocaleString()}`, color: 'var(--danger)' },
        ].map((item, i) => (
          <div key={i} className="card" style={{ padding: '14px 16px' }}>
            <div style={{ fontSize: 10, fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.07em', marginBottom: 6 }}>{item.label}</div>
            <div style={{ fontSize: 18, fontWeight: 800, color: item.color, fontFamily: "'DM Mono', monospace" }}>{item.value}</div>
          </div>
        ))}
      </div>

      {/* Desktop Table */}
      <div className="card hidden md:block" style={{ overflow: 'hidden' }}>
        <table className="data-table">
          <thead>
            <tr>
              <th>Token</th>
              <th>Member</th>
              <th style={{ textAlign: 'right' }}>Due Amount</th>
              <th style={{ textAlign: 'right' }}>Paid</th>
              <th style={{ textAlign: 'right' }}>Balance</th>
              <th style={{ textAlign: 'center' }}>Status</th>
              <th style={{ textAlign: 'center' }}>Actions</th>
            </tr>
          </thead>
          <tbody>
            {memberships.map(gm => {
              const member = members.find(m => m.memberId === gm.memberId);
              const { due, paid, balance, status } = getInstallmentStatus(selectedChit, gm.memberId, selectedMonth);
              return (
                <tr key={gm.groupMembershipId}>
                  <td>
                    <span style={{ fontSize: 12, fontWeight: 700, color: 'var(--text-muted)', fontFamily: "'DM Mono', monospace" }}>#{gm.tokenNo}</span>
                  </td>
                  <td>
                    <div style={{ fontWeight: 700, color: 'var(--text-primary)', fontSize: 13 }}>{member?.name}</div>
                    <div style={{ fontSize: 11, color: 'var(--text-muted)', fontFamily: "'DM Mono', monospace", marginTop: 2 }}>{member?.mobile}</div>
                  </td>
                  <td style={{ textAlign: 'right', fontFamily: "'DM Mono', monospace", fontWeight: 600, fontSize: 13 }}>₹{due.toLocaleString()}</td>
                  <td style={{ textAlign: 'right', fontFamily: "'DM Mono', monospace", fontWeight: 700, color: 'var(--success)', fontSize: 13 }}>₹{paid.toLocaleString()}</td>
                  <td style={{ textAlign: 'right', fontFamily: "'DM Mono', monospace", fontWeight: 800, color: balance > 0 ? 'var(--danger)' : 'var(--text-muted)', fontSize: 13 }}>₹{balance.toLocaleString()}</td>
                  <td style={{ textAlign: 'center' }}><StatusBadge status={status} /></td>
                  <td style={{ textAlign: 'center' }}>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8 }}>
                      <button
                        onClick={() => setShowCollectDialog({ memberId: gm.memberId, name: member?.name, due: balance })}
                        disabled={balance <= 0}
                        className="btn-primary"
                        style={{ padding: '6px 14px', fontSize: 12, opacity: balance <= 0 ? 0.3 : 1, cursor: balance <= 0 ? 'not-allowed' : 'pointer' }}
                      >
                        Collect
                      </button>
                      <button
                        onClick={() => member && currentChit && sendPaymentLink(currentChit.upiId, member.mobile, member.name, currentChit.name, selectedMonth, balance, member.memberId)}
                        disabled={balance <= 0}
                        style={{ width: 32, height: 32, borderRadius: 8, background: balance <= 0 ? '#f0fdf4' : '#dcfce7', border: '1px solid #86efac', cursor: balance <= 0 ? 'not-allowed' : 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#16a34a', opacity: balance <= 0 ? 0.3 : 1 }}
                        title="Send WhatsApp reminder"
                      >
                        <svg width="16" height="16" fill="currentColor" viewBox="0 0 24 24"><path d="M12.031 6.172c-3.181 0-5.767 2.586-5.767 5.767 0 1.267.405 2.436 1.096 3.39l-.79 2.885 2.955-.775a5.727 5.727 0 002.506.582c3.181 0 5.767-2.586 5.767-5.767 0-3.181-2.586-5.767-5.767-5.767zM12 2C6.477 2 2 6.477 2 12c0 1.891.524 3.662 1.435 5.176L2.05 22l4.957-1.301C8.42 21.515 10.138 22 12 22c5.523 0 10-4.477 10-10S17.523 2 12 2z"/></svg>
                      </button>
                    </div>
                  </td>
                </tr>
              );
            })}
            {memberships.length === 0 && (
              <tr><td colSpan={7} style={{ textAlign: 'center', padding: '48px', color: 'var(--text-muted)', fontSize: 13 }}>No members in this group.</td></tr>
            )}
          </tbody>
        </table>
      </div>

      {/* Mobile Cards */}
      <div className="md:hidden" style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
        {memberships.map(gm => {
          const member = members.find(m => m.memberId === gm.memberId);
          const { due, paid, balance, status } = getInstallmentStatus(selectedChit, gm.memberId, selectedMonth);
          return (
            <div key={gm.groupMembershipId} className="card" style={{ padding: 16 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 14, paddingBottom: 12, borderBottom: '1px solid var(--border)' }}>
                <div>
                  <div style={{ fontSize: 10, fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.07em', marginBottom: 3 }}>Token #{gm.tokenNo}</div>
                  <div style={{ fontWeight: 700, fontSize: 15, color: 'var(--text-primary)' }}>{member?.name}</div>
                  <div style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 2, fontFamily: "'DM Mono', monospace" }}>{member?.mobile}</div>
                </div>
                <StatusBadge status={status} />
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 8, marginBottom: 14, textAlign: 'center' }}>
                {[{ label: 'Due', value: `₹${due.toLocaleString()}`, color: 'var(--text-primary)' },
                  { label: 'Paid', value: `₹${paid.toLocaleString()}`, color: 'var(--success)' },
                  { label: 'Balance', value: `₹${balance.toLocaleString()}`, color: balance > 0 ? 'var(--danger)' : 'var(--text-muted)' }
                ].map((item, i) => (
                  <div key={i} style={{ background: 'var(--surface-2)', borderRadius: 8, padding: '8px 4px' }}>
                    <div style={{ fontSize: 9, fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 4 }}>{item.label}</div>
                    <div style={{ fontSize: 13, fontWeight: 800, color: item.color, fontFamily: "'DM Mono', monospace" }}>{item.value}</div>
                  </div>
                ))}
              </div>
              <div style={{ display: 'flex', gap: 10 }}>
                <button
                  onClick={() => setShowCollectDialog({ memberId: gm.memberId, name: member?.name, due: balance })}
                  disabled={balance <= 0}
                  className="btn-primary"
                  style={{ flex: 1, padding: '11px', fontSize: 13, opacity: balance <= 0 ? 0.25 : 1, cursor: balance <= 0 ? 'not-allowed' : 'pointer' }}
                >
                  Collect Payment
                </button>
                <button
                  onClick={() => member && currentChit && sendPaymentLink(currentChit.upiId, member.mobile, member.name, currentChit.name, selectedMonth, balance, member.memberId)}
                  disabled={balance <= 0}
                  style={{ width: 46, borderRadius: 8, background: '#dcfce7', border: '1px solid #86efac', cursor: balance <= 0 ? 'not-allowed' : 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#16a34a', opacity: balance <= 0 ? 0.25 : 1 }}
                >
                  <svg width="20" height="20" fill="currentColor" viewBox="0 0 24 24"><path d="M12.031 6.172c-3.181 0-5.767 2.586-5.767 5.767 0 1.267.405 2.436 1.096 3.39l-.79 2.885 2.955-.775a5.727 5.727 0 002.506.582c3.181 0 5.767-2.586 5.767-5.767 0-3.181-2.586-5.767-5.767-5.767zM12 2C6.477 2 2 6.477 2 12c0 1.891.524 3.662 1.435 5.176L2.05 22l4.957-1.301C8.42 21.515 10.138 22 12 22c5.523 0 10-4.477 10-10S17.523 2 12 2z"/></svg>
                </button>
              </div>
            </div>
          );
        })}
        {memberships.length === 0 && (
          <div style={{ textAlign: 'center', padding: '64px 24px', color: 'var(--text-muted)', fontSize: 13 }}>No members found in this group.</div>
        )}
      </div>

      {/* Collect Modal */}
      {showCollectDialog && (
        <div className="modal-backdrop" style={{ position: 'fixed', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 100, padding: 16 }}>
          <div className="card animate-in" style={{ width: '100%', maxWidth: 420, padding: '28px 28px 24px' }}>
            <div style={{ marginBottom: 22, paddingBottom: 16, borderBottom: '1px solid var(--border)' }}>
              <div style={{ fontSize: 10, fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.07em', marginBottom: 4 }}>Collect Payment</div>
              <h3 style={{ fontSize: 17, fontWeight: 800, color: 'var(--text-primary)', margin: 0 }}>{showCollectDialog.name}</h3>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
              <div>
                <label>Amount (₹)</label>
                <input type="number" id="payAmount" defaultValue={showCollectDialog.due} style={{ fontWeight: 700, fontSize: 16 }} />
              </div>
              <div>
                <label>Payment Mode</label>
                <select id="payMode">
                  <option value="cash">Cash</option>
                  <option value="upi">UPI / Online</option>
                  <option value="bank_transfer">Bank Transfer</option>
                </select>
              </div>
              <div>
                <label>Reference / Note</label>
                <input type="text" id="payRef" placeholder="Transaction ID or note" />
              </div>
              <div style={{ display: 'flex', gap: 12, marginTop: 4 }}>
                <button
                  onClick={() => setShowCollectDialog(null)}
                  className="btn-secondary"
                  style={{ flex: 1, padding: 12, fontSize: 13 }}
                >
                  Cancel
                </button>
                <button
                  onClick={() => handleCollect({
                    memberId: showCollectDialog.memberId,
                    amount: (document.getElementById('payAmount') as HTMLInputElement).value,
                    mode: (document.getElementById('payMode') as HTMLSelectElement).value,
                    ref: (document.getElementById('payRef') as HTMLInputElement).value,
                  })}
                  className="btn-primary"
                  style={{ flex: 1, padding: 12, fontSize: 13 }}
                >
                  Confirm Payment
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Collections;
