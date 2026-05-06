'use client';

import { useState, useEffect, useMemo } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Plus, Search, Calendar, Clock, Video, ExternalLink, ChevronRight, LayoutGrid, List, Loader2, RefreshCw } from 'lucide-react';
import { useEmsUser } from '@/components/providers/EmsProvider';
import { CreateMeetingModal } from '@/components/meetings/CreateMeetingModal';
import apiClient from '@/lib/api-client';
import { toast } from 'sonner';
import { hasPermission, UserRole } from '@/lib/permissions';

interface Meeting {
  _id: string;
  title: string;
  description: string;
  scheduledTime: string;
  meetingLink: string;
  platform: 'teams' | 'meet' | 'other';
  hostSsoId: string;
  department: string;
  status: 'scheduled' | 'ongoing' | 'completed' | 'cancelled';
}

const STATUS_CLS: Record<string, string> = {
  scheduled: 'bg-blue-500/10 text-blue-600 border-blue-500/20',
  ongoing:   'bg-rose-500/10 text-rose-600 border-rose-500/20 animate-pulse',
  completed: 'bg-emerald-500/10 text-emerald-600 border-emerald-500/20',
  cancelled: 'bg-slate-500/10 text-slate-500 border-slate-500/20',
};

const getPlatformIcon = (platform: string) => {
  if (platform === 'teams') return <div className="w-8 h-8 rounded-lg bg-[#444791] flex items-center justify-center text-white font-bold text-xs">T</div>;
  if (platform === 'meet')  return <div className="w-8 h-8 rounded-lg bg-[#00897b] flex items-center justify-center text-white font-bold text-xs">G</div>;
  return <Video className="w-4 h-4" />;
};

const getPlatformLabel = (p: string) => p === 'teams' ? 'Microsoft Teams' : p === 'meet' ? 'Google Meet' : 'Online';

export default function MeetingsPage() {
  const { user } = useEmsUser();
  const isManager = hasPermission((user?.appRole || (user as any)?.role) as UserRole, 'manager');
  const [meetings, setMeetings] = useState<Meeting[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [createOpen, setCreateOpen] = useState(false);

  const fetchMeetings = async () => {
    setLoading(true);
    try { const res = await apiClient.get('/meetings'); setMeetings(res.data); }
    catch { toast.error('Failed to load meetings'); }
    finally { setLoading(false); }
  };

  useEffect(() => { fetchMeetings(); }, []);

  const filtered = useMemo(() =>
    meetings.filter(m => m.title.toLowerCase().includes(search.toLowerCase()) || m.department?.toLowerCase().includes(search.toLowerCase())),
    [meetings, search]
  );

  const addToGoogleCalendar = (m: Meeting) => {
    const start = new Date(m.scheduledTime);
    const end = new Date(start.getTime() + 60 * 60 * 1000); // 1hr default
    const fmt = (d: Date) => d.toISOString().replace(/-|:|\.\d{3}/g, '');
    const url = `https://calendar.google.com/calendar/render?action=TEMPLATE&text=${encodeURIComponent(m.title)}&dates=${fmt(start)}/${fmt(end)}&details=${encodeURIComponent(m.description || '')}&location=${encodeURIComponent(m.meetingLink || '')}`;
    window.open(url, '_blank');
  };

  if (loading) return (
    <div className="flex flex-col items-center justify-center min-h-[400px] space-y-4">
      <Loader2 className="w-12 h-12 text-violet-500 animate-spin" />
      <p className="text-muted-foreground animate-pulse">Syncing Calendar...</p>
    </div>
  );

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Collaboration Hub</h1>
          <p className="text-muted-foreground mt-1">Managed meetings for {user?.department || 'all departments'}</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" onClick={fetchMeetings} className="gap-2"><RefreshCw className="w-4 h-4" />Refresh</Button>
          {isManager && (
            <Button onClick={() => setCreateOpen(true)} className="gap-2 bg-violet-600 hover:bg-violet-700 shadow-lg shadow-violet-500/20"><Plus className="w-4 h-4" />Schedule Meeting</Button>
          )}
        </div>
      </div>

      <div className="flex items-center gap-4 bg-card p-2 rounded-xl border shadow-sm">
        <div className="flex-1 relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input placeholder="Search meetings..." value={search} onChange={(e) => setSearch(e.target.value)} className="pl-10 border-0 focus-visible:ring-0 bg-transparent" />
        </div>
        <div className="flex items-center gap-1 border-l pl-2">
          <Button variant={viewMode === 'grid' ? 'secondary' : 'ghost'} size="icon" onClick={() => setViewMode('grid')} className="h-8 w-8"><LayoutGrid className="w-4 h-4" /></Button>
          <Button variant={viewMode === 'list' ? 'secondary' : 'ghost'} size="icon" onClick={() => setViewMode('list')} className="h-8 w-8"><List className="w-4 h-4" /></Button>
        </div>
      </div>

      {viewMode === 'grid' ? (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {filtered.map((meeting) => (
            <Card key={meeting._id} className="relative group overflow-hidden border-none shadow-md bg-gradient-to-br from-card to-muted/30 hover:shadow-lg transition-all">
              <CardContent className="p-6">
                <div className="flex justify-between items-start mb-4">
                  <div className="flex items-center gap-3">
                    {getPlatformIcon(meeting.platform)}
                    <div>
                      <Badge variant="outline" className="text-[10px] uppercase tracking-wider font-semibold">{getPlatformLabel(meeting.platform)}</Badge>
                      <p className="text-[10px] text-muted-foreground mt-0.5">{meeting.department || 'General'}</p>
                    </div>
                  </div>
                  <Badge variant="outline" className={`text-xs ${STATUS_CLS[meeting.status]}`}>{meeting.status}</Badge>
                </div>
                <h3 className="text-lg font-bold mb-2 group-hover:text-violet-500 transition-colors">{meeting.title}</h3>
                <p className="text-sm text-muted-foreground line-clamp-2 mb-4 h-10">{meeting.description || 'No description provided.'}</p>
                <div className="space-y-2 mb-4">
                  <div className="flex items-center gap-2 text-xs font-medium"><Calendar className="w-3.5 h-3.5 text-violet-500" />{new Date(meeting.scheduledTime).toLocaleDateString(undefined, { dateStyle: 'medium' })}</div>
                  <div className="flex items-center gap-2 text-xs font-medium"><Clock className="w-3.5 h-3.5 text-blue-500" />{new Date(meeting.scheduledTime).toLocaleTimeString(undefined, { timeStyle: 'short' })}</div>
                </div>
                <div className="flex gap-2">
                  <Button className="flex-1 gap-2 bg-foreground hover:bg-foreground/90 text-background text-xs" onClick={() => meeting.meetingLink && window.open(meeting.meetingLink, '_blank')} disabled={!meeting.meetingLink}>
                    Join <ExternalLink className="w-3 h-3" />
                  </Button>
                  <Button variant="outline" size="icon" className="shrink-0" title="Add to Google Calendar" onClick={() => addToGoogleCalendar(meeting)}>
                    <Calendar className="w-4 h-4" />
                  </Button>
                  <Button variant="outline" size="icon" className="shrink-0"><ChevronRight className="w-4 h-4" /></Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      ) : (
        <div className="space-y-2">
          {filtered.map((meeting) => (
            <Card key={meeting._id} className="hover:bg-muted/50 transition-colors border-none shadow-sm">
              <CardContent className="p-4 flex items-center gap-4">
                <div className="shrink-0">{getPlatformIcon(meeting.platform)}</div>
                <div className="flex-1 min-w-0">
                  <h3 className="font-bold truncate">{meeting.title}</h3>
                  <div className="flex items-center gap-3 text-xs text-muted-foreground">
                    <span className="flex items-center gap-1"><Calendar className="w-3 h-3" />{new Date(meeting.scheduledTime).toLocaleDateString()}</span>
                    <span className="flex items-center gap-1"><Clock className="w-3 h-3" />{new Date(meeting.scheduledTime).toLocaleTimeString(undefined, { timeStyle: 'short' })}</span>
                    {meeting.department && <span>{meeting.department}</span>}
                  </div>
                </div>
                <div className="shrink-0 flex items-center gap-2">
                  <Badge variant="outline" className={`text-xs ${STATUS_CLS[meeting.status]}`}>{meeting.status}</Badge>
                  <Button size="sm" variant="outline" onClick={() => addToGoogleCalendar(meeting)} title="Add to Google Calendar"><Calendar className="w-3.5 h-3.5" /></Button>
                  <Button size="sm" onClick={() => meeting.meetingLink && window.open(meeting.meetingLink, '_blank')} disabled={!meeting.meetingLink}>Join</Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {filtered.length === 0 && (
        <div className="py-20 text-center bg-card rounded-2xl border border-dashed">
          <div className="w-16 h-16 bg-muted rounded-full flex items-center justify-center mx-auto mb-4"><Video className="w-8 h-8 text-muted-foreground" /></div>
          <h3 className="text-xl font-bold">No meetings found</h3>
          <p className="text-muted-foreground max-w-xs mx-auto mt-2">Try adjusting your search or schedule a new meeting.</p>
          {isManager && <Button onClick={() => setCreateOpen(true)} className="mt-4 gap-2 bg-violet-600 hover:bg-violet-700"><Plus className="w-4 h-4" />Schedule Meeting</Button>}
        </div>
      )}

      <CreateMeetingModal isOpen={createOpen} onClose={() => setCreateOpen(false)} onCreated={fetchMeetings} />
    </div>
  );
}
