'use client';

import { useState, useEffect, useMemo, useCallback } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { EmptyState } from '@/components/EmptyState';
import { CreateTeamModal } from '@/components/teams/CreateTeamModal';
import { Plus, Users, Zap, Edit2, Trash2, Loader2, RefreshCw, UserPlus } from 'lucide-react';
import { toast } from 'sonner';
import axios from 'axios';
import { useEmsUser } from '@/components/providers/EmsProvider';
import { hasPermission, UserRole } from '@/lib/permissions';

interface Team {
  _id: string;
  name: string;
  description?: string;
  department: string;
  color: string;
  lead: string;
  leadUser?: { name: string; email: string };
  members: { ssoUserId: string }[];
  status: 'active' | 'onboarding' | 'inactive';
  createdAt: string;
}

const STATUS_LABELS: Record<string, { label: string; cls: string }> = {
  active:     { label: 'Active',     cls: 'bg-emerald-500/10 text-emerald-600 border-emerald-500/20' },
  onboarding: { label: 'Onboarding', cls: 'bg-blue-500/10 text-blue-600 border-blue-500/20' },
  inactive:   { label: 'Inactive',   cls: 'bg-slate-500/10 text-slate-500 border-slate-500/20' },
};

export default function TeamsPage() {
  const { user } = useEmsUser();
  const isManager = hasPermission((user?.appRole || (user as any)?.role) as UserRole, 'manager');
  const isAdmin = hasPermission((user?.appRole || (user as any)?.role) as UserRole, 'admin' as UserRole);

  const [teams, setTeams] = useState<Team[]>([]);
  const [loading, setLoading] = useState(true);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [createOpen, setCreateOpen] = useState(false);

  const fetchTeams = useCallback(async () => {
    setLoading(true);
    try { const res = await axios.get('/api/teams'); setTeams(res.data); }
    catch { toast.error('Failed to load teams'); }
    finally { setLoading(false); }
  }, []);

  useEffect(() => { fetchTeams(); }, [fetchTeams]);

  const handleDelete = async (id: string, name: string) => {
    if (!confirm(`Delete team "${name}"? This cannot be undone.`)) return;
    setDeletingId(id);
    try { await axios.delete(`/api/teams/${id}`); toast.success(`Team "${name}" deleted`); setTeams(prev => prev.filter(t => t._id !== id)); }
    catch (err: any) { toast.error(err.response?.data?.error || 'Failed to delete team'); }
    finally { setDeletingId(null); }
  };

  const stats = useMemo(() => ({
    total: teams.length,
    totalMembers: teams.reduce((acc, t) => acc + t.members.length, 0),
    active: teams.filter(t => t.status === 'active').length,
  }), [teams]);

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-start md:items-center gap-4 flex-col md:flex-row">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Teams</h1>
          <p className="text-muted-foreground mt-1">Manage departments and cross-functional teams</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" onClick={fetchTeams} className="gap-2"><RefreshCw className="w-4 h-4" />Refresh</Button>
          {isManager && (
            <Button onClick={() => setCreateOpen(true)} className="gap-2 bg-violet-600 hover:bg-violet-700"><Plus className="w-4 h-4" />Create Team</Button>
          )}
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        {[
          { label: 'Total Teams', value: stats.total, icon: Users, color: 'text-violet-600', bg: 'bg-violet-100' },
          { label: 'Total Members', value: stats.totalMembers, icon: UserPlus, color: 'text-blue-600', bg: 'bg-blue-100' },
          { label: 'Active Teams', value: stats.active, icon: Zap, color: 'text-emerald-600', bg: 'bg-emerald-100' },
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

      {loading ? (
        <div className="flex flex-col items-center justify-center py-20 gap-4"><Loader2 className="w-10 h-10 animate-spin text-violet-500" /><p className="text-muted-foreground">Loading teams...</p></div>
      ) : teams.length === 0 ? (
        <EmptyState icon={<Users className="w-12 h-12" />} title="No teams yet" description={isManager ? 'Create your first team to get started' : 'No teams have been created yet'} actionLabel={isManager ? 'Create Team' : undefined} onAction={() => setCreateOpen(true)} />
      ) : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {teams.map((team) => (
            <Card key={team._id} className="h-full flex flex-col hover:shadow-md transition-all border-none shadow-sm group">
              <div className={`h-1.5 ${team.color} rounded-t-lg`} />
              <CardHeader className="pb-2">
                <div className="flex items-start justify-between gap-2">
                  <div className="flex-1">
                    <CardTitle className="text-lg group-hover:text-violet-600 transition-colors">{team.name}</CardTitle>
                    <p className="text-xs text-muted-foreground mt-1">{team.department}</p>
                  </div>
                  <Badge variant="outline" className={`flex-shrink-0 text-xs ${STATUS_LABELS[team.status]?.cls}`}>
                    {STATUS_LABELS[team.status]?.label}
                  </Badge>
                </div>
              </CardHeader>
              <CardContent className="flex-1 flex flex-col justify-between">
                <div className="space-y-3 mb-4">
                  {team.description && <p className="text-sm text-muted-foreground">{team.description}</p>}
                  <div className="flex items-center gap-2 text-sm">
                    <div className="w-6 h-6 rounded-full bg-violet-500/20 flex items-center justify-center text-[10px] font-bold text-violet-500">
                      {(team.leadUser?.name || 'L').charAt(0).toUpperCase()}
                    </div>
                    <span className="text-muted-foreground">Lead: <span className="font-medium text-foreground">{team.leadUser?.name || team.lead}</span></span>
                  </div>
                  <div className="grid grid-cols-2 gap-2">
                    <div className="bg-muted/60 rounded-lg p-2.5">
                      <p className="text-xs text-muted-foreground">Members</p>
                      <p className="text-xl font-bold mt-0.5">{team.members.length}</p>
                    </div>
                    <div className="bg-muted/60 rounded-lg p-2.5">
                      <p className="text-xs text-muted-foreground">Joined</p>
                      <p className="text-xs font-semibold mt-1">{new Date(team.createdAt).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })}</p>
                    </div>
                  </div>
                  {/* Member avatars */}
                  {team.members.length > 0 && (
                    <div className="flex -space-x-2 overflow-hidden">
                      {team.members.slice(0, 6).map((m, i) => (
                        <div key={i} className={`w-7 h-7 rounded-full border-2 border-background ${team.color} flex items-center justify-center text-[9px] font-bold text-white`}>
                          {m.ssoUserId.charAt(0).toUpperCase()}
                        </div>
                      ))}
                      {team.members.length > 6 && (
                        <div className="w-7 h-7 rounded-full border-2 border-background bg-muted flex items-center justify-center text-[9px] font-bold text-muted-foreground">
                          +{team.members.length - 6}
                        </div>
                      )}
                    </div>
                  )}
                </div>
                {isManager && (
                  <div className="flex gap-2 border-t border-border/50 pt-3">
                    <Button variant="ghost" size="sm" className="flex-1 text-xs gap-1 text-muted-foreground hover:text-foreground" onClick={() => toast.info('Team editing coming soon')}>
                      <Edit2 className="w-3.5 h-3.5" />Edit
                    </Button>
                    {isAdmin && (
                      <Button variant="ghost" size="sm" className="flex-1 text-xs gap-1 text-destructive hover:bg-destructive/10" onClick={() => handleDelete(team._id, team.name)} disabled={deletingId === team._id}>
                        {deletingId === team._id ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Trash2 className="w-3.5 h-3.5" />}Delete
                      </Button>
                    )}
                  </div>
                )}
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      <CreateTeamModal isOpen={createOpen} onClose={() => setCreateOpen(false)} onCreated={fetchTeams} />
    </div>
  );
}
