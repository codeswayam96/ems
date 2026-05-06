'use client';

import { useState, useEffect, useMemo, useCallback } from 'react';
import { ColumnDef } from '@tanstack/react-table';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { DataTable } from '@/components/DataTable';
import { StatusBadge } from '@/components/StatusBadge';
import { TableToolbar } from '@/components/table/TableToolbar';
import { LogTimeModal } from '@/components/tracking/LogTimeModal';
import { Plus, Clock, Loader2, CheckCircle2, XCircle, AlertCircle, TrendingUp, RefreshCw } from 'lucide-react';
import { toast } from 'sonner';
import { format } from 'date-fns';
import apiClient from '@/lib/api-client';
import { useEmsUser } from '@/components/providers/EmsProvider';
import { hasPermission, UserRole } from '@/lib/permissions';

interface TimeEntry {
  _id: string;
  ssoUserId: string;
  project: string;
  description?: string;
  hours: number;
  date: string;
  status: 'pending' | 'approved' | 'rejected';
  userDetails?: { name: string; email: string };
}

export default function TrackingPage() {
  const { user } = useEmsUser();
  const isManager = hasPermission((user?.appRole || (user as any)?.role) as UserRole, 'manager');
  const [entries, setEntries] = useState<TimeEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [logModalOpen, setLogModalOpen] = useState(false);
  const [updatingId, setUpdatingId] = useState<string | null>(null);

  const fetchEntries = useCallback(async () => {
    setLoading(true);
    try { const res = await apiClient.get('/tracking'); setEntries(res.data); }
    catch { toast.error('Failed to load time entries'); }
    finally { setLoading(false); }
  }, []);

  useEffect(() => { fetchEntries(); }, [fetchEntries]);

  const handleApprove = async (id: string) => {
    setUpdatingId(id);
    try { await apiClient.patch(`/tracking/${id}`, { status: 'approved' }); toast.success('Time entry approved'); fetchEntries(); }
    catch { toast.error('Failed to approve'); }
    finally { setUpdatingId(null); }
  };

  const handleReject = async (id: string) => {
    setUpdatingId(id);
    try { await apiClient.patch(`/tracking/${id}`, { status: 'rejected', rejectionReason: 'Rejected by manager' }); toast.error('Time entry rejected'); fetchEntries(); }
    catch { toast.error('Failed to reject'); }
    finally { setUpdatingId(null); }
  };

  const stats = useMemo(() => {
    const totalHours = entries.reduce((s, e) => s + (e.status !== 'rejected' ? e.hours : 0), 0);
    const pending = entries.filter(e => e.status === 'pending').length;
    const approved = entries.filter(e => e.status === 'approved').length;
    const todayHours = entries.filter(e => e.date?.startsWith(format(new Date(), 'yyyy-MM-dd'))).reduce((s, e) => s + e.hours, 0);
    return { totalHours, pending, approved, todayHours };
  }, [entries]);

  const filtered = useMemo(() => entries.filter(e => {
    const name = (e.userDetails?.name || e.ssoUserId).toLowerCase();
    return name.includes(search.toLowerCase()) || e.project.toLowerCase().includes(search.toLowerCase());
  }), [entries, search]);

  const columns = useMemo<ColumnDef<TimeEntry>[]>(() => [
    {
      accessorKey: 'userDetails.name',
      header: 'Employee',
      cell: (info) => {
        const name = info.row.original.userDetails?.name || info.row.original.ssoUserId;
        return (
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-full bg-violet-500/20 flex items-center justify-center text-[10px] font-bold text-violet-500">{name.charAt(0).toUpperCase()}</div>
            <div><p className="font-medium text-sm">{name}</p><p className="text-[10px] text-muted-foreground">{info.row.original.userDetails?.email}</p></div>
          </div>
        );
      },
    },
    { accessorKey: 'project', header: 'Project', cell: (info) => <span className="font-medium text-sm">{info.getValue() as string}</span> },
    { accessorKey: 'description', header: 'Notes', cell: (info) => <span className="text-xs text-muted-foreground line-clamp-1 max-w-[180px]">{(info.getValue() as string) || '—'}</span> },
    { accessorKey: 'hours', header: 'Hours', cell: (info) => <span className="font-bold text-violet-600">{(info.getValue() as number).toFixed(1)}h</span> },
    { accessorKey: 'date', header: 'Date', cell: (info) => <span className="text-sm text-muted-foreground">{format(new Date(info.getValue() as string), 'MMM d, yyyy')}</span> },
    { accessorKey: 'status', header: 'Status', cell: (info) => <StatusBadge status={info.getValue() as any} /> },
    {
      id: 'actions',
      header: '',
      cell: (info) => {
        const entry = info.row.original;
        if (isManager && entry.status === 'pending') {
          return (
            <div className="flex gap-1">
              <Button variant="ghost" size="sm" className="h-7 text-xs gap-1 text-emerald-600 hover:bg-emerald-500/10" onClick={() => handleApprove(entry._id)} disabled={updatingId === entry._id}>
                {updatingId === entry._id ? <Loader2 className="w-3 h-3 animate-spin" /> : <CheckCircle2 className="w-3.5 h-3.5" />}
              </Button>
              <Button variant="ghost" size="sm" className="h-7 text-xs gap-1 text-destructive hover:bg-destructive/10" onClick={() => handleReject(entry._id)} disabled={updatingId === entry._id}>
                <XCircle className="w-3.5 h-3.5" />
              </Button>
            </div>
          );
        }
        return null;
      },
    },
  ], [isManager, updatingId]);

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-start md:items-center gap-4 flex-col md:flex-row">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Time Tracking</h1>
          <p className="text-muted-foreground mt-1">{isManager ? 'Review and approve employee time entries' : 'Log your working hours for manager review'}</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" onClick={fetchEntries} className="gap-2"><RefreshCw className="w-4 h-4" />Refresh</Button>
          <Button onClick={() => setLogModalOpen(true)} className="gap-2 bg-violet-600 hover:bg-violet-700"><Plus className="w-4 h-4" />Log Time</Button>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-4">
        {[
          { label: "Today's Hours", value: `${stats.todayHours.toFixed(1)}h`, icon: Clock, color: 'text-blue-600', bg: 'bg-blue-100' },
          { label: 'Total Approved', value: `${entries.filter(e=>e.status==='approved').reduce((s,e)=>s+e.hours,0).toFixed(1)}h`, icon: TrendingUp, color: 'text-emerald-600', bg: 'bg-emerald-100' },
          { label: 'Pending Approval', value: stats.pending, icon: AlertCircle, color: 'text-amber-600', bg: 'bg-amber-100' },
          { label: 'Approved Entries', value: stats.approved, icon: CheckCircle2, color: 'text-violet-600', bg: 'bg-violet-100' },
        ].map((s) => (
          <Card key={s.label} className="border-none shadow-sm">
            <CardContent className="p-5">
              <div className="flex items-center justify-between">
                <div><p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">{s.label}</p><p className={`text-2xl font-bold mt-1 ${s.color}`}>{s.value}</p></div>
                <div className={`p-2.5 rounded-xl ${s.bg}`}><s.icon size={20} className={s.color} /></div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <TableToolbar searchValue={search} onSearchChange={setSearch} placeholder="Search by employee or project..." />

      {loading ? (
        <div className="flex flex-col items-center justify-center py-20 gap-4"><Loader2 className="w-10 h-10 animate-spin text-violet-500" /><p className="text-muted-foreground">Loading entries...</p></div>
      ) : (
        <DataTable columns={columns} data={filtered} />
      )}

      <LogTimeModal isOpen={logModalOpen} onClose={() => setLogModalOpen(false)} onCreated={fetchEntries} />
    </div>
  );
}
