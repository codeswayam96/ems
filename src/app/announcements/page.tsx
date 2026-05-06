'use client';

import { useState, useEffect, useCallback } from 'react';
import { useForm } from 'react-hook-form';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Megaphone, Pin, Trash2, Plus, Loader2, RefreshCw, Building2 } from 'lucide-react';
import { toast } from 'sonner';
import { format } from 'date-fns';
import axios from 'axios';
import { useEmsUser } from '@/components/providers/EmsProvider';
import { hasPermission, UserRole } from '@/lib/permissions';

interface Announcement {
  _id: string;
  title: string;
  content: string;
  priority: 'low' | 'normal' | 'high' | 'urgent';
  pinned: boolean;
  targetDepartment?: string;
  authorSsoId: string;
  authorDetails?: { name: string; email: string };
  createdAt: string;
}

interface FormData { title: string; content: string; priority: string; pinned: boolean; targetDepartment: string; }

const PRIORITY_CONFIG: Record<string, { label: string; cls: string }> = {
  urgent: { label: '🚨 Urgent',  cls: 'bg-red-500/10 text-red-600 border-red-500/30' },
  high:   { label: '⚠️ High',   cls: 'bg-orange-500/10 text-orange-600 border-orange-500/30' },
  normal: { label: '📢 Normal', cls: 'bg-blue-500/10 text-blue-600 border-blue-500/30' },
  low:    { label: '💬 Low',    cls: 'bg-slate-500/10 text-slate-500 border-slate-500/30' },
};

export default function AnnouncementsPage() {
  const { user } = useEmsUser();
  const isManager = hasPermission((user?.appRole || (user as any)?.role) as UserRole, 'manager');
  const [announcements, setAnnouncements] = useState<Announcement[]>([]);
  const [loading, setLoading] = useState(true);
  const [createOpen, setCreateOpen] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  const { register, handleSubmit, reset, formState: { errors } } = useForm<FormData>({ defaultValues: { priority: 'normal', pinned: false } });

  const fetchAnnouncements = useCallback(async () => {
    setLoading(true);
    try { const res = await axios.get('/api/announcements'); setAnnouncements(res.data); }
    catch { toast.error('Failed to load announcements'); }
    finally { setLoading(false); }
  }, []);

  useEffect(() => { fetchAnnouncements(); }, [fetchAnnouncements]);

  const onSubmit = async (data: FormData) => {
    setSaving(true);
    try {
      await axios.post('/api/announcements', { ...data, pinned: !!data.pinned, targetDepartment: data.targetDepartment || undefined });
      toast.success('Announcement posted!');
      reset();
      setCreateOpen(false);
      fetchAnnouncements();
    } catch (err: any) { toast.error(err.response?.data?.error || 'Failed to post'); }
    finally { setSaving(false); }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Delete this announcement?')) return;
    setDeletingId(id);
    try { await axios.delete(`/api/announcements/${id}`); toast.success('Deleted'); setAnnouncements(prev => prev.filter(a => a._id !== id)); }
    catch { toast.error('Failed to delete'); }
    finally { setDeletingId(null); }
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-start md:items-center gap-4 flex-col md:flex-row">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Announcements</h1>
          <p className="text-muted-foreground mt-1">Company-wide and department notices</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" onClick={fetchAnnouncements} className="gap-2"><RefreshCw className="w-4 h-4" />Refresh</Button>
          {isManager && <Button onClick={() => setCreateOpen(true)} className="gap-2 bg-violet-600 hover:bg-violet-700"><Plus className="w-4 h-4" />Post Announcement</Button>}
        </div>
      </div>

      {loading ? (
        <div className="flex flex-col items-center justify-center py-20 gap-4"><Loader2 className="w-10 h-10 animate-spin text-violet-500" /><p className="text-muted-foreground">Loading announcements...</p></div>
      ) : announcements.length === 0 ? (
        <div className="py-20 text-center bg-card rounded-2xl border border-dashed">
          <Megaphone className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
          <h3 className="text-xl font-bold">No announcements yet</h3>
          <p className="text-muted-foreground mt-2">{isManager ? 'Post the first announcement for your team.' : 'Your managers haven\'t posted any announcements yet.'}</p>
        </div>
      ) : (
        <div className="space-y-3">
          {announcements.map((a) => (
            <Card key={a._id} className={`border-none shadow-sm hover:shadow-md transition-all ${a.pinned ? 'ring-1 ring-violet-500/30' : ''}`}>
              <CardContent className="p-5">
                <div className="flex items-start gap-4">
                  <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${a.priority === 'urgent' ? 'bg-red-500/10' : a.priority === 'high' ? 'bg-orange-500/10' : 'bg-violet-500/10'}`}>
                    {a.pinned ? <Pin className={`w-5 h-5 ${a.priority === 'urgent' ? 'text-red-500' : a.priority === 'high' ? 'text-orange-500' : 'text-violet-500'}`} /> : <Megaphone className={`w-5 h-5 ${a.priority === 'urgent' ? 'text-red-500' : a.priority === 'high' ? 'text-orange-500' : 'text-violet-500'}`} />}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap mb-1">
                      <h3 className="font-bold text-base">{a.title}</h3>
                      {a.pinned && <Badge variant="outline" className="text-[10px] bg-violet-500/10 text-violet-600 border-violet-500/20">📌 Pinned</Badge>}
                      <Badge variant="outline" className={`text-[10px] ${PRIORITY_CONFIG[a.priority]?.cls}`}>{PRIORITY_CONFIG[a.priority]?.label}</Badge>
                      {a.targetDepartment && (
                        <Badge variant="outline" className="text-[10px] gap-1"><Building2 className="w-2.5 h-2.5" />{a.targetDepartment}</Badge>
                      )}
                    </div>
                    <p className="text-sm text-muted-foreground whitespace-pre-line">{a.content}</p>
                    <div className="flex items-center gap-3 mt-3">
                      <span className="text-xs text-muted-foreground/60">{a.authorDetails?.name || 'Manager'} · {format(new Date(a.createdAt), 'MMM d, yyyy \'at\' hh:mm a')}</span>
                    </div>
                  </div>
                  {isManager && (
                    <Button variant="ghost" size="icon" className="shrink-0 text-muted-foreground hover:text-destructive" onClick={() => handleDelete(a._id)} disabled={deletingId === a._id}>
                      {deletingId === a._id ? <Loader2 className="w-4 h-4 animate-spin" /> : <Trash2 className="w-4 h-4" />}
                    </Button>
                  )}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      <Dialog open={createOpen} onOpenChange={(o) => !o && setCreateOpen(false)}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader><DialogTitle className="flex items-center gap-2"><Megaphone className="w-5 h-5 text-violet-500" />Post Announcement</DialogTitle></DialogHeader>
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4 mt-2">
            <div className="space-y-1.5">
              <Label htmlFor="ann-title">Title *</Label>
              <Input id="ann-title" placeholder="Announcement headline..." {...register('title', { required: 'Title is required' })} />
              {errors.title && <p className="text-xs text-destructive">{errors.title.message}</p>}
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="ann-content">Content *</Label>
              <textarea id="ann-content" rows={4} className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring resize-none" placeholder="Write your announcement..." {...register('content', { required: 'Content is required' })} />
              {errors.content && <p className="text-xs text-destructive">{errors.content.message}</p>}
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label>Priority</Label>
                <select {...register('priority')} className="w-full px-3 py-2 border rounded-md text-sm bg-background focus:outline-none focus:ring-2 focus:ring-ring">
                  <option value="low">💬 Low</option>
                  <option value="normal">📢 Normal</option>
                  <option value="high">⚠️ High</option>
                  <option value="urgent">🚨 Urgent</option>
                </select>
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="ann-dept">Department (optional)</Label>
                <Input id="ann-dept" placeholder="All departments" {...register('targetDepartment')} />
              </div>
            </div>
            <label className="flex items-center gap-3 p-3 rounded-lg bg-muted/50 border cursor-pointer hover:bg-muted/70 transition-colors">
              <input type="checkbox" {...register('pinned')} className="w-4 h-4 rounded accent-violet-600" />
              <div><p className="font-medium text-sm">Pin this announcement</p><p className="text-xs text-muted-foreground">Pinned posts always appear at the top</p></div>
            </label>
            <div className="flex gap-3 pt-2">
              <Button type="button" variant="outline" onClick={() => setCreateOpen(false)} className="flex-1">Cancel</Button>
              <Button type="submit" disabled={saving} className="flex-1 gap-2 bg-violet-600 hover:bg-violet-700">
                {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Megaphone className="w-4 h-4" />}
                {saving ? 'Posting...' : 'Post Announcement'}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
