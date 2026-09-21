'use client';

import { useState, useEffect, useCallback } from 'react';
import axios from 'axios';
import { Target, Plus, ChevronRight, Star, CheckCircle2, Clock, Users, RefreshCw, X, Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useEmsUser } from '@/components/providers/EmsProvider';
import { toast } from 'sonner';

interface ReviewCycle {
  _id: string;
  title: string;
  period: string;
  status: 'draft' | 'active' | 'completed';
  revieweeCount: number;
  completedCount: number;
  createdAt: string;
}

interface Goal {
  _id?: string;
  title: string;
  target: string;
  weight: number;
  selfRating?: number;
  managerRating?: number;
  status: 'pending' | 'in-progress' | 'completed';
}

const STATUS_STYLES: Record<string, string> = {
  draft:     'bg-slate-100 text-slate-700 border-slate-200',
  active:    'bg-emerald-100 text-emerald-700 border-emerald-200',
  completed: 'bg-violet-100 text-violet-700 border-violet-200',
};

const STATUS_ICONS: Record<string, any> = {
  draft: Clock,
  active: Target,
  completed: CheckCircle2,
};

function StarRating({ value, onChange, max = 5 }: { value: number; onChange?: (v: number) => void; max?: number }) {
  return (
    <div className="flex gap-0.5">
      {Array.from({ length: max }, (_, i) => (
        <button
          key={i}
          type="button"
          onClick={() => onChange?.(i + 1)}
          className={cn('transition-colors', onChange ? 'cursor-pointer' : 'cursor-default')}
        >
          <Star
            size={16}
            className={i < value ? 'text-amber-400 fill-amber-400' : 'text-slate-300'}
          />
        </button>
      ))}
    </div>
  );
}

function CreateCycleModal({ onClose, onCreated }: { onClose: () => void; onCreated: () => void }) {
  const [title, setTitle] = useState('');
  const [period, setPeriod] = useState('');
  const [saving, setSaving] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !period.trim()) return;
    setSaving(true);
    try {
      await axios.post('/api/performance', { title, period, status: 'draft' });
      toast.success('Review cycle created!');
      onCreated();
      onClose();
    } catch {
      toast.error('Failed to create cycle');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4">
      <div className="bg-card w-full max-w-md rounded-2xl border border-border shadow-2xl">
        <div className="flex items-center justify-between p-6 border-b border-border">
          <h3 className="font-bold text-lg">New Review Cycle</h3>
          <button onClick={onClose} className="w-8 h-8 rounded-lg hover:bg-secondary flex items-center justify-center">
            <X size={16} />
          </button>
        </div>
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div>
            <label className="block text-xs font-bold text-muted-foreground uppercase tracking-widest mb-1.5">Cycle Title</label>
            <input
              value={title}
              onChange={e => setTitle(e.target.value)}
              placeholder="e.g. Q2 2026 Performance Review"
              className="w-full h-11 px-4 text-sm bg-background border border-border rounded-xl focus:outline-none focus:ring-2 focus:ring-primary/30"
              required
            />
          </div>
          <div>
            <label className="block text-xs font-bold text-muted-foreground uppercase tracking-widest mb-1.5">Period</label>
            <input
              value={period}
              onChange={e => setPeriod(e.target.value)}
              placeholder="e.g. Apr 1 – Jun 30, 2026"
              className="w-full h-11 px-4 text-sm bg-background border border-border rounded-xl focus:outline-none focus:ring-2 focus:ring-primary/30"
              required
            />
          </div>
          <div className="flex gap-3 pt-2">
            <button type="button" onClick={onClose} className="flex-1 h-11 rounded-xl border border-border text-sm font-bold hover:bg-secondary transition-colors">Cancel</button>
            <button type="submit" disabled={saving} className="flex-1 h-11 rounded-xl bg-foreground text-background text-sm font-bold hover:opacity-90 transition-opacity flex items-center justify-center gap-2">
              {saving ? <Loader2 size={14} className="animate-spin" /> : <Plus size={14} />}
              Create Cycle
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

function CycleDetailView({ cycle, onBack }: { cycle: ReviewCycle; onBack: () => void }) {
  const [goals] = useState<Goal[]>([
    { title: 'Improve code review turnaround', target: 'Under 24h response time', weight: 30, selfRating: 4, managerRating: 3, status: 'in-progress' },
    { title: 'Complete onboarding module', target: 'Ship by end of quarter', weight: 25, selfRating: 5, managerRating: 5, status: 'completed' },
    { title: 'Reduce bug escapement rate', target: 'Below 2 critical bugs/sprint', weight: 20, selfRating: 3, status: 'in-progress' },
    { title: 'Mentoring junior developers', target: '2 sessions per week', weight: 25, selfRating: 4, status: 'pending' },
  ]);

  const avgSelf = goals.filter(g => g.selfRating).reduce((a, g) => a + (g.selfRating || 0), 0) / Math.max(goals.filter(g => g.selfRating).length, 1);
  const avgMgr = goals.filter(g => g.managerRating).reduce((a, g) => a + (g.managerRating || 0), 0) / Math.max(goals.filter(g => g.managerRating).length, 1);

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <button onClick={onBack} className="w-9 h-9 rounded-xl border border-border flex items-center justify-center hover:bg-secondary transition-colors">
          <ChevronRight size={16} className="rotate-180" />
        </button>
        <div>
          <h2 className="font-bold text-xl">{cycle.title}</h2>
          <p className="text-sm text-muted-foreground">{cycle.period}</p>
        </div>
        <div className="ml-auto flex items-center gap-2">
          <span className={cn('flex items-center gap-1.5 px-3 py-1.5 rounded-full border text-xs font-bold capitalize', STATUS_STYLES[cycle.status])}>
            {cycle.status}
          </span>
        </div>
      </div>

      {/* Summary scores */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        {[
          { label: 'Goals Set', value: goals.length, icon: Target, color: 'bg-violet-50 text-violet-600' },
          { label: 'Completed Goals', value: goals.filter(g => g.status === 'completed').length, icon: CheckCircle2, color: 'bg-emerald-50 text-emerald-600' },
          { label: 'Avg Self Rating', value: avgSelf.toFixed(1) + '/5', icon: Star, color: 'bg-amber-50 text-amber-600' },
          { label: 'Avg Mgr Rating', value: avgMgr ? avgMgr.toFixed(1) + '/5' : '—', icon: Users, color: 'bg-blue-50 text-blue-600' },
        ].map(card => (
          <div key={card.label} className="bg-card rounded-2xl border border-border p-4">
            <div className={cn('w-9 h-9 rounded-xl flex items-center justify-center mb-3', card.color)}>
              <card.icon size={16} />
            </div>
            <p className="text-2xl font-bold">{card.value}</p>
            <p className="text-xs text-muted-foreground mt-0.5">{card.label}</p>
          </div>
        ))}
      </div>

      {/* Goals Table */}
      <div className="bg-card rounded-2xl border border-border overflow-hidden">
        <div className="px-6 py-4 border-b border-border flex items-center justify-between">
          <h3 className="font-bold">Goals & OKRs</h3>
          <span className="text-xs text-muted-foreground">{goals.reduce((a, g) => a + g.weight, 0)}% total weight</span>
        </div>
        <div className="divide-y divide-border">
          {goals.map((goal, i) => (
            <div key={i} className="px-6 py-4 hover:bg-secondary/30 transition-colors">
              <div className="flex items-start justify-between gap-4 flex-wrap">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <p className="font-semibold text-sm">{goal.title}</p>
                    <span className={cn('text-[10px] font-bold px-2 py-0.5 rounded-full border capitalize',
                      goal.status === 'completed' ? 'bg-emerald-50 border-emerald-200 text-emerald-700' :
                      goal.status === 'in-progress' ? 'bg-blue-50 border-blue-200 text-blue-700' :
                      'bg-slate-50 border-slate-200 text-slate-600'
                    )}>
                      {goal.status}
                    </span>
                    <span className="text-[10px] font-bold text-muted-foreground bg-secondary px-2 py-0.5 rounded-full">
                      Weight: {goal.weight}%
                    </span>
                  </div>
                  <p className="text-xs text-muted-foreground mt-1">Target: {goal.target}</p>
                </div>
                <div className="flex items-center gap-6 shrink-0">
                  <div>
                    <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider mb-1">Self</p>
                    <StarRating value={goal.selfRating || 0} />
                  </div>
                  <div>
                    <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider mb-1">Manager</p>
                    <StarRating value={goal.managerRating || 0} />
                  </div>
                </div>
              </div>
              {/* Progress bar */}
              <div className="mt-3 h-1.5 bg-secondary rounded-full overflow-hidden">
                <div
                  className={cn('h-full rounded-full transition-all duration-700',
                    goal.status === 'completed' ? 'bg-emerald-500' :
                    goal.status === 'in-progress' ? 'bg-blue-500' : 'bg-slate-300'
                  )}
                  style={{ width: goal.status === 'completed' ? '100%' : goal.status === 'in-progress' ? '55%' : '10%' }}
                />
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

export default function PerformancePage() {
  const { user } = useEmsUser();
  const [cycles, setCycles] = useState<ReviewCycle[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreate, setShowCreate] = useState(false);
  const [selected, setSelected] = useState<ReviewCycle | null>(null);

  const isAdmin = user && ['admin', 'ceo', 'manager'].includes(user.appRole);

  const fetchCycles = useCallback(async () => {
    setLoading(true);
    try {
      const { data } = await axios.get('/api/performance');
      setCycles(data);
    } catch {
      // Show demo cycles if API not ready
      setCycles([
        { _id: '1', title: 'Q2 2026 Review', period: 'Apr 1 – Jun 30, 2026', status: 'active', revieweeCount: 12, completedCount: 4, createdAt: new Date().toISOString() },
        { _id: '2', title: 'Q1 2026 Review', period: 'Jan 1 – Mar 31, 2026', status: 'completed', revieweeCount: 11, completedCount: 11, createdAt: new Date(Date.now() - 90 * 86400000).toISOString() },
        { _id: '3', title: 'Q3 2026 Planning', period: 'Jul 1 – Sep 30, 2026', status: 'draft', revieweeCount: 0, completedCount: 0, createdAt: new Date().toISOString() },
      ]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchCycles(); }, [fetchCycles]);

  if (selected) return <CycleDetailView cycle={selected} onBack={() => setSelected(null)} />;

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex items-start justify-between gap-4 flex-wrap">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="w-2 h-2 rounded-full bg-primary" />
            <span className="text-[10px] font-bold text-primary uppercase tracking-[0.2em]">HR</span>
          </div>
          <h1 className="text-3xl font-bold tracking-tight">Performance Reviews</h1>
          <p className="text-muted-foreground text-sm mt-1">Manage OKRs, goal setting, and quarterly review cycles</p>
        </div>
        <div className="flex gap-2">
          <button onClick={fetchCycles} className="h-10 w-10 rounded-xl border border-border bg-background flex items-center justify-center hover:bg-secondary transition-colors">
            <RefreshCw size={15} className="text-muted-foreground" />
          </button>
          {isAdmin && (
            <button onClick={() => setShowCreate(true)} className="h-10 px-5 rounded-xl bg-foreground text-background text-sm font-bold flex items-center gap-2 hover:opacity-90 transition-opacity">
              <Plus size={15} /> New Cycle
            </button>
          )}
        </div>
      </div>

      {/* Stats Banner */}
      <div className="grid grid-cols-3 gap-4">
        {[
          { label: 'Active Cycles', value: cycles.filter(c => c.status === 'active').length, icon: Target, color: 'text-emerald-600 bg-emerald-50' },
          { label: 'Total Cycles', value: cycles.length, icon: CheckCircle2, color: 'text-violet-600 bg-violet-50' },
          { label: 'Draft Cycles', value: cycles.filter(c => c.status === 'draft').length, icon: Clock, color: 'text-amber-600 bg-amber-50' },
        ].map(s => (
          <div key={s.label} className="bg-card rounded-2xl border border-border p-5 flex items-center gap-4">
            <div className={cn('w-10 h-10 rounded-xl flex items-center justify-center shrink-0', s.color)}>
              <s.icon size={18} />
            </div>
            <div>
              <p className="text-2xl font-bold">{s.value}</p>
              <p className="text-xs text-muted-foreground">{s.label}</p>
            </div>
          </div>
        ))}
      </div>

      {/* Cycles List */}
      {loading ? (
        <div className="space-y-4">
          {[1, 2, 3].map(i => <div key={i} className="h-28 bg-secondary rounded-2xl animate-pulse" />)}
        </div>
      ) : cycles.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-24 text-muted-foreground gap-4">
          <Target size={48} className="opacity-20" />
          <p className="font-semibold">No review cycles yet</p>
          {isAdmin && <button onClick={() => setShowCreate(true)} className="text-sm text-primary font-bold hover:underline">Create the first cycle</button>}
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-4">
          {cycles.map(cycle => {
            const StatusIcon = STATUS_ICONS[cycle.status];
            const progress = cycle.revieweeCount > 0 ? Math.round((cycle.completedCount / cycle.revieweeCount) * 100) : 0;
            return (
              <div
                key={cycle._id}
                onClick={() => setSelected(cycle)}
                className="group bg-card rounded-2xl border border-border p-6 hover:shadow-lg hover:border-primary/30 transition-all cursor-pointer"
              >
                <div className="flex items-start justify-between gap-4 flex-wrap">
                  <div className="flex items-start gap-4">
                    <div className={cn('w-11 h-11 rounded-xl flex items-center justify-center shrink-0 border', STATUS_STYLES[cycle.status])}>
                      <StatusIcon size={18} />
                    </div>
                    <div>
                      <h3 className="font-bold text-base group-hover:text-primary transition-colors">{cycle.title}</h3>
                      <p className="text-sm text-muted-foreground mt-0.5">{cycle.period}</p>
                      <div className="flex items-center gap-2 mt-2">
                        <span className={cn('text-[10px] font-bold px-2 py-0.5 rounded-full border capitalize', STATUS_STYLES[cycle.status])}>
                          {cycle.status}
                        </span>
                        {cycle.revieweeCount > 0 && (
                          <span className="text-[10px] text-muted-foreground">
                            {cycle.completedCount}/{cycle.revieweeCount} reviews complete
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    {cycle.revieweeCount > 0 && (
                      <div className="text-right">
                        <p className="text-2xl font-bold">{progress}%</p>
                        <p className="text-[10px] text-muted-foreground">complete</p>
                      </div>
                    )}
                    <ChevronRight size={18} className="text-muted-foreground group-hover:text-primary transition-colors" />
                  </div>
                </div>
                {/* Progress bar */}
                {cycle.revieweeCount > 0 && (
                  <div className="mt-4 h-1.5 bg-secondary rounded-full overflow-hidden">
                    <div
                      className="h-full rounded-full bg-primary transition-all duration-700"
                      style={{ width: `${progress}%` }}
                    />
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {showCreate && <CreateCycleModal onClose={() => setShowCreate(false)} onCreated={fetchCycles} />}
    </div>
  );
}
