'use client';

import { useState, useEffect, useMemo, useCallback } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { TableToolbar } from '@/components/table/TableToolbar';
import { EmptyState } from '@/components/EmptyState';
import { LeaveRequestModal } from '@/components/attendance/LeaveRequestModal';
import { Plus, User, Calendar, CheckCircle, Clock, AlertCircle, LogIn, LogOut, Loader2, RefreshCw } from 'lucide-react';
import { toast } from 'sonner';
import { format } from 'date-fns';
import apiClient from '@/lib/api-client';
import { useEmsUser } from '@/components/providers/EmsProvider';
import { hasPermission, UserRole } from '@/lib/permissions';

interface AttendanceRecord {
  _id: string;
  ssoUserId: string;
  date: string;
  checkIn?: string;
  checkOut?: string;
  status: 'present' | 'absent' | 'partial' | 'leave' | 'holiday';
  leaveRequest?: { type: string; startDate: string; endDate: string; days: number; reason: string; status: 'pending' | 'approved' | 'rejected'; };
  userDetails?: { name: string; email: string };
}

const STATUS_CONFIG: Record<string, { label: string; cls: string }> = {
  present: { label: 'Present', cls: 'bg-emerald-500/10 text-emerald-600 border-emerald-500/20' },
  absent:  { label: 'Absent',  cls: 'bg-red-500/10 text-red-600 border-red-500/20' },
  partial: { label: 'Partial', cls: 'bg-amber-500/10 text-amber-600 border-amber-500/20' },
  leave:   { label: 'Leave',   cls: 'bg-blue-500/10 text-blue-600 border-blue-500/20' },
  holiday: { label: 'Holiday', cls: 'bg-violet-500/10 text-violet-600 border-violet-500/20' },
};

export default function AttendancePage() {
  const { user } = useEmsUser();
  const isManager = hasPermission((user?.appRole || (user as any)?.role) as UserRole, 'manager');
  const [records, setRecords] = useState<AttendanceRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [checkingIn, setCheckingIn] = useState(false);
  const [checkingOut, setCheckingOut] = useState(false);
  const [search, setSearch] = useState('');
  const [activeTab, setActiveTab] = useState<'attendance' | 'leave'>('attendance');
  const [leaveModalOpen, setLeaveModalOpen] = useState(false);

  const fetchRecords = useCallback(async () => {
    setLoading(true);
    try { const res = await apiClient.get('/attendance'); setRecords(res.data); }
    catch { toast.error('Failed to load attendance records'); }
    finally { setLoading(false); }
  }, []);

  useEffect(() => { fetchRecords(); }, [fetchRecords]);

  const todayRecord = useMemo(() => {
    const today = format(new Date(), 'yyyy-MM-dd');
    return records.find(r => r.ssoUserId === user?.ssoUserId && r.date?.startsWith(today));
  }, [records, user]);

  const handleCheckIn = async () => {
    setCheckingIn(true);
    try { await apiClient.post('/attendance', { action: 'checkin' }); toast.success(`✅ Checked in at ${format(new Date(), 'hh:mm a')}`); fetchRecords(); }
    catch (err: any) { toast.error(err.response?.data?.error || 'Check-in failed'); }
    finally { setCheckingIn(false); }
  };

  const handleCheckOut = async () => {
    setCheckingOut(true);
    try { await apiClient.post('/attendance', { action: 'checkout' }); toast.success(`👋 Checked out at ${format(new Date(), 'hh:mm a')}`); fetchRecords(); }
    catch (err: any) { toast.error(err.response?.data?.error || 'Check-out failed'); }
    finally { setCheckingOut(false); }
  };

  const handleApproveLeave = async (id: string) => {
    try { await apiClient.patch(`/attendance/${id}`, { leaveStatus: 'approved' }); toast.success('Leave approved'); fetchRecords(); }
    catch { toast.error('Failed'); }
  };
  const handleRejectLeave = async (id: string) => {
    try { await apiClient.patch(`/attendance/${id}`, { leaveStatus: 'rejected' }); toast.error('Leave rejected'); fetchRecords(); }
    catch { toast.error('Failed'); }
  };

  const hoursWorked = (r: AttendanceRecord) => {
    if (!r.checkIn || !r.checkOut) return null;
    const diff = new Date(r.checkOut).getTime() - new Date(r.checkIn).getTime();
    return `${Math.floor(diff / 3600000)}h ${Math.floor((diff % 3600000) / 60000)}m`;
  };

  const stats = useMemo(() => ({
    present: records.filter(r => r.status === 'present').length,
    partial: records.filter(r => r.status === 'partial').length,
    leave:   records.filter(r => r.status === 'leave').length,
    absent:  records.filter(r => r.status === 'absent').length,
  }), [records]);

  const allRecords = records.filter(r => !r.leaveRequest);
  const leaveRecords = records.filter(r => r.leaveRequest);

  const filtered = (activeTab === 'attendance' ? allRecords : leaveRecords).filter(r =>
    (r.userDetails?.name || r.ssoUserId).toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-start md:items-center gap-4 flex-col md:flex-row">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Attendance & Leave</h1>
          <p className="text-muted-foreground mt-1">{isManager ? 'Monitor team attendance and manage leave requests' : 'Track your attendance and request leave'}</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" onClick={fetchRecords} className="gap-2"><RefreshCw className="w-4 h-4" /> Refresh</Button>
          <Button onClick={() => setLeaveModalOpen(true)} className="gap-2 bg-violet-600 hover:bg-violet-700"><Plus className="w-4 h-4" /> Request Leave</Button>
        </div>
      </div>

      {!isManager && (
        <Card className="border-none shadow-md bg-gradient-to-br from-violet-600 to-purple-700 text-white overflow-hidden relative">
          <div className="absolute right-0 top-0 w-48 h-48 bg-white/10 rounded-full -mr-16 -mt-16 blur-3xl" />
          <CardContent className="p-6 relative z-10">
            <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
              <div>
                <p className="text-xs font-bold uppercase tracking-widest text-white/60 mb-1">Today — {format(new Date(), 'EEEE, MMMM d')}</p>
                <h2 className="text-2xl font-bold">{!todayRecord?.checkIn ? 'Ready to start your day?' : todayRecord?.checkOut ? '✅ Day Complete' : '⏱ Currently Working'}</h2>
                {todayRecord?.checkIn && (
                  <p className="text-white/70 text-sm mt-1">
                    In: {format(new Date(todayRecord.checkIn), 'hh:mm a')}
                    {todayRecord.checkOut && ` · Out: ${format(new Date(todayRecord.checkOut), 'hh:mm a')} · ${hoursWorked(todayRecord)}`}
                  </p>
                )}
              </div>
              <div className="flex gap-3">
                {!todayRecord?.checkIn && <Button onClick={handleCheckIn} disabled={checkingIn} className="gap-2 bg-white text-violet-700 hover:bg-white/90 font-bold">{checkingIn ? <Loader2 className="w-4 h-4 animate-spin" /> : <LogIn className="w-4 h-4" />}Check In</Button>}
                {todayRecord?.checkIn && !todayRecord?.checkOut && <Button onClick={handleCheckOut} disabled={checkingOut} className="gap-2 bg-white/20 hover:bg-white/30 border border-white/30 font-bold">{checkingOut ? <Loader2 className="w-4 h-4 animate-spin" /> : <LogOut className="w-4 h-4" />}Check Out</Button>}
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      <div className="grid gap-4 md:grid-cols-4">
        {[
          { label: 'Present', value: stats.present, icon: CheckCircle, color: 'text-emerald-600', bg: 'bg-emerald-100' },
          { label: 'Partial', value: stats.partial, icon: Clock, color: 'text-amber-600', bg: 'bg-amber-100' },
          { label: 'On Leave', value: stats.leave, icon: Calendar, color: 'text-blue-600', bg: 'bg-blue-100' },
          { label: 'Absent', value: stats.absent, icon: AlertCircle, color: 'text-red-600', bg: 'bg-red-100' },
        ].map((s) => (
          <Card key={s.label} className="border-none shadow-sm">
            <CardContent className="p-5">
              <div className="flex items-center justify-between">
                <div><p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">{s.label}</p><p className={`text-3xl font-bold mt-1 ${s.color}`}>{s.value}</p></div>
                <div className={`p-2.5 rounded-xl ${s.bg}`}><s.icon size={20} className={s.color} /></div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="flex gap-2 border-b">
        {[{ id: 'attendance', label: `Attendance (${allRecords.length})` }, { id: 'leave', label: `Leave Requests (${leaveRecords.length})` }].map((tab) => (
          <button key={tab.id} onClick={() => setActiveTab(tab.id as any)} className={`px-4 py-3 font-medium border-b-2 transition-colors text-sm ${activeTab === tab.id ? 'border-violet-500 text-violet-600' : 'border-transparent text-muted-foreground hover:text-foreground'}`}>{tab.label}</button>
        ))}
      </div>

      <TableToolbar searchValue={search} onSearchChange={setSearch} placeholder={activeTab === 'attendance' ? 'Search by name...' : 'Search leave requests...'} />

      {loading ? (
        <div className="flex flex-col items-center justify-center py-20 gap-4"><Loader2 className="w-10 h-10 animate-spin text-violet-500" /><p className="text-muted-foreground">Loading records...</p></div>
      ) : filtered.length === 0 ? (
        <EmptyState icon={<User className="w-12 h-12" />} title="No records found" description={search ? 'Try adjusting your search' : 'Records appear after check-in'} />
      ) : (
        <div className="space-y-2">
          {activeTab === 'attendance' && filtered.map((record) => (
            <Card key={record._id} className="border-none shadow-sm hover:shadow-md transition-shadow">
              <CardContent className="p-4">
                <div className="grid grid-cols-1 md:grid-cols-6 gap-4 items-center">
                  <div className="flex items-center gap-3 md:col-span-2">
                    <div className="w-9 h-9 rounded-full bg-gradient-to-br from-violet-500 to-purple-600 flex items-center justify-center text-xs font-bold text-white shrink-0">
                      {(record.userDetails?.name || record.ssoUserId).split(' ').map((n: string) => n[0]).join('').slice(0, 2)}
                    </div>
                    <div><p className="font-semibold text-sm">{record.userDetails?.name || record.ssoUserId}</p><p className="text-xs text-muted-foreground">{record.userDetails?.email}</p></div>
                  </div>
                  <p className="text-sm text-muted-foreground">{format(new Date(record.date), 'MMM d, yyyy')}</p>
                  <p className="text-sm font-medium flex items-center gap-1"><LogIn className="w-3.5 h-3.5 text-emerald-500" />{record.checkIn ? format(new Date(record.checkIn), 'hh:mm a') : '—'}</p>
                  <p className="text-sm font-medium flex items-center gap-1"><LogOut className="w-3.5 h-3.5 text-red-400" />{record.checkOut ? format(new Date(record.checkOut), 'hh:mm a') : '—'}</p>
                  <div className="flex items-center justify-between gap-2">
                    <Badge variant="outline" className={`text-xs ${STATUS_CONFIG[record.status]?.cls}`}>{STATUS_CONFIG[record.status]?.label}</Badge>
                    {record.checkIn && record.checkOut && <span className="text-xs font-semibold text-muted-foreground">{hoursWorked(record)}</span>}
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}

          {activeTab === 'leave' && filtered.map((record) => (
            <Card key={record._id} className="border-none shadow-sm">
              <CardContent className="p-4">
                <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                  <div className="flex items-center gap-3">
                    <div className="w-9 h-9 rounded-full bg-blue-500/20 flex items-center justify-center text-xs font-bold text-blue-600 shrink-0">
                      {(record.userDetails?.name || record.ssoUserId).split(' ').map((n: string) => n[0]).join('').slice(0, 2)}
                    </div>
                    <div>
                      <div className="flex items-center gap-2 mb-1"><p className="font-semibold text-sm">{record.userDetails?.name || record.ssoUserId}</p><Badge variant="outline" className="text-xs capitalize">{record.leaveRequest?.type}</Badge></div>
                      <p className="text-xs text-muted-foreground">{record.leaveRequest?.reason}</p>
                      <p className="text-xs text-muted-foreground/60 mt-0.5">{record.leaveRequest?.startDate ? format(new Date(record.leaveRequest.startDate), 'MMM d') : ''} — {record.leaveRequest?.endDate ? format(new Date(record.leaveRequest.endDate), 'MMM d, yyyy') : ''} · {record.leaveRequest?.days} day(s)</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    {record.leaveRequest?.status === 'pending' && isManager ? (
                      <><Button size="sm" onClick={() => handleApproveLeave(record._id)} className="gap-1 bg-emerald-600 hover:bg-emerald-700 text-white text-xs"><CheckCircle className="w-3.5 h-3.5" />Approve</Button><Button size="sm" variant="outline" onClick={() => handleRejectLeave(record._id)} className="gap-1 border-destructive/30 text-destructive text-xs"><AlertCircle className="w-3.5 h-3.5" />Reject</Button></>
                    ) : (
                      <Badge variant="outline" className={record.leaveRequest?.status === 'approved' ? 'bg-emerald-500/10 text-emerald-600' : record.leaveRequest?.status === 'rejected' ? 'bg-red-500/10 text-red-600' : 'bg-amber-500/10 text-amber-600'}>
                        {record.leaveRequest?.status === 'approved' ? '✓ Approved' : record.leaveRequest?.status === 'rejected' ? '✗ Rejected' : '⏳ Pending'}
                      </Badge>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      <LeaveRequestModal isOpen={leaveModalOpen} onClose={() => setLeaveModalOpen(false)} onSubmitted={fetchRecords} />
    </div>
  );
}
