
import { 
  User, UserRole, ChitGroup, Member, GroupMembership, 
  InstallmentSchedule, Allotment, Payment, PaymentRequest, 
  MasterSettings, ChitStatus, PaymentStatus 
} from './types';

const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL as string;
const SUPABASE_ANON_KEY = import.meta.env.VITE_SUPABASE_ANON_KEY as string;
const DB_ROW_ID = 1; // Single-row storage pattern

const INITIAL_USERS: User[] = [
  { userId: 'u1', name: 'Admin User', role: UserRole.ADMIN, username: 'admin', passwordHash: 'xdr5tgb', isActive: true },
];

const INITIAL_MASTER_SETTINGS: MasterSettings = {
  mastersPasswordHash: 'xdr5tgb',
  lateFeeRules: {},
  receiptTemplateConfig: {},
  appUrl: '',
  whatsappConfig: {}
};

// ─── Supabase REST helper ───────────────────────────────────────────────────
async function supabaseRequest(
  method: 'GET' | 'POST' | 'PATCH',
  path: string,
  body?: object
): Promise<any> {
  if (!SUPABASE_URL || !SUPABASE_ANON_KEY) throw new Error('Supabase env vars missing');
  const url = `${SUPABASE_URL}/rest/v1${path}`;
  const res = await fetch(url, {
    method,
    headers: {
      'Content-Type': 'application/json',
      'apikey': SUPABASE_ANON_KEY,
      'Authorization': `Bearer ${SUPABASE_ANON_KEY}`,
      'Prefer': 'return=representation',
    },
    body: body ? JSON.stringify(body) : undefined,
  });
  if (!res.ok) {
    const err = await res.text();
    throw new Error(`Supabase ${method} ${path} failed: ${err}`);
  }
  const text = await res.text();
  return text ? JSON.parse(text) : null;
}
// ───────────────────────────────────────────────────────────────────────────

class DB {
  private users: User[] = [];
  private chits: ChitGroup[] = [];
  private members: Member[] = [];
  private memberships: GroupMembership[] = [];
  private installments: InstallmentSchedule[] = [];
  private allotments: Allotment[] = [];
  private payments: Payment[] = [];
  private paymentRequests: PaymentRequest[] = [];
  private settings: MasterSettings = INITIAL_MASTER_SETTINGS;
  private lastUpdated: string = new Date(0).toISOString();

  private isDirty: boolean = false;
  private isSyncing: boolean = false;
  private onDirtyChange?: (dirty: boolean) => void;
  private onSyncChange?: (syncing: boolean) => void;
  private syncDebounceTimer: ReturnType<typeof setTimeout> | null = null;

  constructor() {
    this.init();
  }

  private init() {
    try {
      this.loadLocal();
      if (!this.users || this.users.length === 0) {
        this.users = [...INITIAL_USERS];
        this.saveLocal();
      }
    } catch (e) {
      console.error('DB Init failed, resetting to defaults', e);
      this.users = [...INITIAL_USERS];
    }
  }

  setDirtyListener(listener: (dirty: boolean) => void) { this.onDirtyChange = listener; }
  setSyncListener(listener: (syncing: boolean) => void) { this.onSyncChange = listener; }

  markDirty() {
    this.isDirty = true;
    this.saveLocal();
    this.onDirtyChange?.(true);
    if (this.syncDebounceTimer) clearTimeout(this.syncDebounceTimer);
    this.syncDebounceTimer = setTimeout(() => {
      this.syncWithCloud().catch(() => {});
    }, 2000);
  }

  // ── Local Storage ──────────────────────────────────────────────────────────
  loadLocal() {
    const data = localStorage.getItem('mi_chit_db');
    if (data && data !== 'null' && data !== 'undefined') {
      try {
        const parsed = JSON.parse(data);
        if (parsed && typeof parsed === 'object') this.deserialize(parsed);
      } catch (e) {
        console.error('Corrupted local storage data', e);
      }
    }
  }

  private deserialize(parsed: any) {
    if (!parsed) return;
    this.users        = parsed.users        || [];
    this.chits        = (parsed.chits || []).map((c: any) => ({ ...c, status: c.status || ChitStatus.ACTIVE }));
    this.members      = parsed.members      || [];
    this.memberships  = parsed.memberships  || [];
    this.installments = parsed.installments || [];
    this.allotments   = parsed.allotments   || [];
    this.payments     = parsed.payments     || [];
    this.paymentRequests = parsed.paymentRequests || [];
    this.settings     = parsed.settings     || INITIAL_MASTER_SETTINGS;
    this.lastUpdated  = parsed.lastUpdated  || new Date(0).toISOString();
  }

  public getSerializedData() {
    return JSON.stringify({
      users: this.users, chits: this.chits, members: this.members,
      memberships: this.memberships, installments: this.installments,
      allotments: this.allotments, payments: this.payments,
      paymentRequests: this.paymentRequests, settings: this.settings,
      lastUpdated: this.lastUpdated
    }, null, 2);
  }

  saveLocal(): boolean {
    try {
      this.lastUpdated = new Date().toISOString();
      localStorage.setItem('mi_chit_db', this.getSerializedData());
      return true;
    } catch (e) {
      console.error('Critical: Local storage save failed.', e);
      return false;
    }
  }

  // ── Cloud Sync (Supabase) ─────────────────────────────────────────────────
  async syncWithCloud(): Promise<boolean> {
  if (!navigator.onLine || !SUPABASE_URL || !SUPABASE_ANON_KEY) return false;

  this.isSyncing = true;
  this.onSyncChange?.(true);

  try {
    // 1️⃣ Fetch cloud data
    const rows = await supabaseRequest(
      'GET',
      `/bhadrakali_db?id=eq.${DB_ROW_ID}&select=data`
    );

    const cloudRow = rows && rows.length > 0 ? rows[0] : null;
    const cloudData = cloudRow?.data || null;

    const localData = JSON.parse(this.getSerializedData());

    const localHasData =
      (localData.members && localData.members.length > 0) ||
      (localData.groups && localData.groups.length > 0);

    const cloudHasData =
      cloudData &&
      ((cloudData.members && cloudData.members.length > 0) ||
        (cloudData.groups && cloudData.groups.length > 0));

    // 🚨 SAFETY RULE
    // If cloud has data and local is empty → PULL cloud
    if (cloudHasData && !localHasData) {
      this.deserialize(cloudData);
      this.saveLocal();
      this.isDirty = false;
      this.onDirtyChange?.(false);
      return true;
    }

    const cloudTime = new Date(cloudData?.lastUpdated || 0).getTime();
    const localTime = new Date(localData?.lastUpdated || 0).getTime();

    // If cloud newer → pull
    if (cloudData && cloudTime > localTime) {
      this.deserialize(cloudData);
      this.saveLocal();
      this.isDirty = false;
      this.onDirtyChange?.(false);
      return true;
    }

    // Otherwise push local
    const payload = {
      id: DB_ROW_ID,
      data: localData,
      updated_at: new Date().toISOString(),
    };

    const updated = await supabaseRequest(
      'PATCH',
      `/bhadrakali_db?id=eq.${DB_ROW_ID}`,
      payload
    );

    if (!updated || updated.length === 0) {
      await supabaseRequest('POST', '/bhadrakali_db', payload);
    }

    this.isDirty = false;
    this.onDirtyChange?.(false);
    localStorage.setItem('mi_chit_last_sync', new Date().toISOString());

    return true;

  } catch (error) {
    console.error('Cloud sync failed:', error);
    return false;
  } finally {
    this.isSyncing = false;
    this.onSyncChange?.(false);
  }
}

  async loadCloudData(): Promise<boolean> {
    if (!navigator.onLine || !SUPABASE_URL || !SUPABASE_ANON_KEY) return false;

    this.isSyncing = true;
    this.onSyncChange?.(true);

    try {
      const rows = await supabaseRequest('GET', `/bhadrakali_db?id=eq.${DB_ROW_ID}&select=data,updated_at`);
      if (!rows || rows.length === 0 || !rows[0].data) return false;

      const onlineData = rows[0].data;
      const localRaw   = localStorage.getItem('mi_chit_db');
      const localData  = localRaw ? JSON.parse(localRaw) : null;

      const onlineTime = new Date(onlineData.lastUpdated || 0).getTime();
      const localTime  = new Date(localData?.lastUpdated || 0).getTime();

      if (onlineTime > localTime || !localData) {
        this.deserialize(onlineData);
        this.saveLocal();
        this.isDirty = false;
        this.onDirtyChange?.(false);
        return true;
      }
      return false;

    } catch (e) {
      console.warn('Cloud load failed:', e);
      return false;
    } finally {
      this.isSyncing = false;
      this.onSyncChange?.(false);
    }
  }

  async save(): Promise<boolean> {
    this.saveLocal();
    return await this.syncWithCloud();
  }

  // ── Restore ────────────────────────────────────────────────────────────────
  restore(dataString: string): boolean {
    try {
      const parsed = JSON.parse(dataString);
      if (parsed && typeof parsed === 'object') {
        this.deserialize(parsed);
        this.markDirty();
        return true;
      }
      return false;
    } catch (e) {
      console.error('Restore failed', e);
      return false;
    }
  }

  updateSettings(data: Partial<MasterSettings>) {
    this.settings = { ...this.settings, ...data };
    this.markDirty();
  }

  // ── Getters ────────────────────────────────────────────────────────────────
  getUsers         = () => this.users         || [];
  getChits         = () => this.chits         || [];
  getMembers       = () => this.members       || [];
  getMemberships   = () => this.memberships   || [];
  getInstallments  = () => this.installments  || [];
  getAllotments     = () => this.allotments    || [];
  getPayments      = () => this.payments      || [];
  getPaymentRequests = () => this.paymentRequests || [];
  getSettings      = () => this.settings      || INITIAL_MASTER_SETTINGS;
  getDirtyStatus   = () => this.isDirty;
  getSyncStatus    = () => this.isSyncing;

  // ── Write Methods (unchanged business logic) ──────────────────────────────
  addMember(member: Member) {
    this.members.push(member);
    this.markDirty();
  }

  updateMember(memberId: string, data: Partial<Member>, targetGroupId?: string) {
    const idx = this.members.findIndex(m => m.memberId === memberId);
    if (idx !== -1) {
      this.members[idx] = { ...this.members[idx], ...data };
      if (targetGroupId) {
        const msIdx = this.memberships.findIndex(m => m.memberId === memberId);
        if (msIdx !== -1) {
          const oldGroupId = this.memberships[msIdx].chitGroupId;
          if (oldGroupId !== targetGroupId) {
            const chit = this.chits.find(c => c.chitGroupId === targetGroupId);
            if (chit && chit.maxMembers) {
              const currentCount = this.memberships.filter(m => m.chitGroupId === targetGroupId).length;
              if (currentCount >= chit.maxMembers) return;
            }
            this.memberships[msIdx].chitGroupId = targetGroupId;
            this.installments = this.installments.filter(i => !(i.memberId === memberId && i.chitGroupId === oldGroupId));
            if (chit) {
              for (let i = 1; i <= chit.totalMonths; i++) {
                const date = new Date(chit.startMonth);
                date.setMonth(date.getMonth() + i - 1);
                this.installments.push({
                  scheduleId: `s_${this.memberships[msIdx].groupMembershipId}_${i}`,
                  chitGroupId: targetGroupId,
                  memberId,
                  monthNo: i,
                  dueDate: date.toISOString().split('T')[0],
                  dueAmount: chit.monthlyInstallmentRegular,
                  paidAmount: 0,
                  status: PaymentStatus.PENDING,
                  isPrizeMonth: false
                });
              }
            }
          }
        }
      }
      this.markDirty();
    }
  }

  addChit(chit: ChitGroup) {
    this.chits.push(chit);
    this.markDirty();
  }

  updateChit(chitGroupId: string, data: Partial<ChitGroup>) {
    const idx = this.chits.findIndex(c => c.chitGroupId === chitGroupId);
    if (idx !== -1) {
      this.chits[idx] = { ...this.chits[idx], ...data };
      this.markDirty();
    }
  }

  addMembership(membership: GroupMembership) {
    const exists = this.memberships.find(m => m.chitGroupId === membership.chitGroupId && m.memberId === membership.memberId);
    if (exists) return;
    const chit = this.chits.find(c => c.chitGroupId === membership.chitGroupId);
    if (chit && chit.maxMembers) {
      const currentCount = this.memberships.filter(m => m.chitGroupId === membership.chitGroupId).length;
      if (currentCount >= chit.maxMembers) return;
    }
    this.memberships.push(membership);
    if (chit) {
      for (let i = 1; i <= chit.totalMonths; i++) {
        const date = new Date(chit.startMonth);
        date.setMonth(date.getMonth() + i - 1);
        this.installments.push({
          scheduleId: `s_${membership.groupMembershipId}_${i}`,
          chitGroupId: membership.chitGroupId,
          memberId: membership.memberId,
          monthNo: i,
          dueDate: date.toISOString().split('T')[0],
          dueAmount: chit.monthlyInstallmentRegular,
          paidAmount: 0,
          status: PaymentStatus.PENDING,
          isPrizeMonth: false
        });
      }
    }
    this.markDirty();
  }

  bulkAddMembers(membersList: { member: Member, chitGroupId?: string }[]) {
    const now = Date.now();
    membersList.forEach((item, index) => {
      if (item.chitGroupId) {
        const chit = this.chits.find(c => c.chitGroupId === item.chitGroupId);
        if (chit && chit.maxMembers) {
          const currentCount = this.memberships.filter(m => m.chitGroupId === item.chitGroupId).length;
          if (currentCount >= chit.maxMembers) return;
        }
      }
      this.members.push(item.member);
      if (item.chitGroupId) {
        const groupMemberships = this.memberships.filter(m => m.chitGroupId === item.chitGroupId);
        const nextToken = groupMemberships.length > 0 ? Math.max(...groupMemberships.map(m => m.tokenNo)) + 1 : 1;
        this.addMembership({
          groupMembershipId: `gm_bulk_${now}_${index}_${Math.floor(Math.random() * 1000)}`,
          chitGroupId: item.chitGroupId,
          memberId: item.member.memberId,
          tokenNo: nextToken,
          joinedOn: new Date().toISOString().split('T')[0]
        });
      }
    });
    this.markDirty();
  }

  confirmAllotment(allotment: Allotment) {
    this.allotments.push(allotment);
    const chit = this.chits.find(c => c.chitGroupId === allotment.chitGroupId);
    if (!chit) return;
    const s = this.installments.find(s => s.chitGroupId === allotment.chitGroupId && s.memberId === allotment.memberId && s.monthNo === allotment.monthNo);
    if (s) s.isPrizeMonth = true;
    this.installments.forEach(s => {
      if (s.chitGroupId === allotment.chitGroupId && s.memberId === allotment.memberId && s.monthNo > allotment.monthNo)
        s.dueAmount = chit.monthlyInstallmentAllotted;
    });
    this.markDirty();
  }

  updateAllotment(allotmentId: string, data: Partial<Allotment>) {
    const idx = this.allotments.findIndex(a => a.allotmentId === allotmentId);
    if (idx === -1) return;
    const old = this.allotments[idx];
    const chit = this.chits.find(c => c.chitGroupId === old.chitGroupId);
    if (!chit) return;
    this.installments.forEach(s => {
      if (s.chitGroupId === old.chitGroupId && s.memberId === old.memberId) {
        if (s.monthNo === old.monthNo) s.isPrizeMonth = false;
        if (s.monthNo > old.monthNo) s.dueAmount = chit.monthlyInstallmentRegular;
      }
    });
    this.allotments[idx] = { ...old, ...data };
    const n = this.allotments[idx];
    this.installments.forEach(s => {
      if (s.chitGroupId === n.chitGroupId && s.memberId === n.memberId) {
        if (s.monthNo === n.monthNo) s.isPrizeMonth = true;
        if (s.monthNo > n.monthNo) s.dueAmount = chit.monthlyInstallmentAllotted;
      }
    });
    this.markDirty();
  }

  revokeAllotment(allotmentId: string) {
    const idx = this.allotments.findIndex(a => a.allotmentId === allotmentId);
    if (idx === -1) return;
    const allotment = this.allotments[idx];
    allotment.revoked = true;
    allotment.isConfirmed = false;
    const chit = this.chits.find(c => c.chitGroupId === allotment.chitGroupId);
    if (!chit) return;
    const s = this.installments.find(s => s.chitGroupId === allotment.chitGroupId && s.memberId === allotment.memberId && s.monthNo === allotment.monthNo);
    if (s) s.isPrizeMonth = false;
    this.installments.forEach(s => {
      if (s.chitGroupId === allotment.chitGroupId && s.memberId === allotment.memberId && s.monthNo > allotment.monthNo)
        s.dueAmount = chit.monthlyInstallmentRegular;
    });
    this.markDirty();
  }

  addPayment(payment: Payment) {
    this.payments.push(payment);
    const schedule = this.installments.find(s => s.chitGroupId === payment.chitGroupId && s.memberId === payment.memberId && s.monthNo === payment.monthNo);
    if (schedule) {
      schedule.paidAmount += payment.paidAmount;
      schedule.paidDate = payment.paymentDate;
      schedule.status = schedule.paidAmount >= schedule.dueAmount ? PaymentStatus.PAID : PaymentStatus.PARTIAL;
    }
    this.markDirty();
  }
}

export const db = new DB();
