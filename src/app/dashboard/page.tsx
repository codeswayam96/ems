'use client';

import { useMemo, useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";
import { Users, CheckCircle, Clock, TrendingUp, TrendingDown, ListTodo, ArrowUpRight, AlertCircle, Video, Plus, Zap, Megaphone, Pin } from "lucide-react";
import { useEmsUser } from "@/components/providers/EmsProvider";
import { hasPermission, UserRole } from "@/lib/permissions";
import axios from "axios";
import { format } from "date-fns";
import Link from "next/link";

interface DashStats {
  tasks: { total: number; completed: number; pending: number; inProgress: number; overdue: number; completionRate: number };
  attendance: { todayCount: number };
  upcomingMeetings: { _id: string; title: string; scheduledTime: string; platform: string }[];
  activeTeams: number;
  totalEmployees: number | null;
}

interface Announcement {
  _id: string; title: string; content: string; priority: string; pinned: boolean; createdAt: string;
  authorDetails?: { name: string };
}

const tasksByDepartment = [
  { name: "Engineering", tasks: 145 },
  { name: "Product", tasks: 98 },
  { name: "Design", tasks: 76 },
  { name: "Sales", tasks: 64 },
  { name: "HR", tasks: 42 },
];

const PRIORITY_CLS: Record<string, string> = {
  urgent: 'border-l-red-500',
  high: 'border-l-orange-500',
  normal: 'border-l-blue-500',
  low: 'border-l-slate-400',
};

export default function Dashboard() {
  const { user } = useEmsUser();
  const currentRole = (user?.appRole || (user as any)?.role) as UserRole;
  const isManager = hasPermission(currentRole, 'manager');

  const [stats, setStats] = useState<DashStats | null>(null);
  const [announcements, setAnnouncements] = useState<Announcement[]>([]);
  const [loadingStats, setLoadingStats] = useState(true);

  useEffect(() => {
    Promise.all([
      axios.get('/api/dashboard/stats').then(r => setStats(r.data)).catch(() => {}),
      axios.get('/api/announcements?limit=3').then(r => setAnnouncements(r.data)).catch(() => {}),
    ]).finally(() => setLoadingStats(false));
  }, []);

  const statCards = useMemo(() => {
    const base = [
      { label: "Tasks Completed", value: stats?.tasks.completed ?? '—', change: stats ? `${stats.tasks.completionRate}% rate` : '...', positive: true, icon: CheckCircle, color: "text-emerald-600", bg: "bg-emerald-100", description: "this period" },
      { label: "Avg Attendance", value: stats?.attendance.todayCount ?? '—', change: "+2%", positive: true, icon: Clock, color: "text-blue-600", bg: "bg-blue-100", description: "present today" },
    ];
    if (isManager) return [
      { label: "Active Employees", value: stats?.totalEmployees ?? '—', change: "+8%", positive: true, icon: Users, color: "text-violet-600", bg: "bg-violet-100", description: "approved users" },
      ...base,
      { label: "Pending Tasks", value: stats?.tasks.pending ?? '—', change: stats?.tasks.overdue ? `${stats.tasks.overdue} overdue` : 'on track', positive: !(stats?.tasks.overdue), icon: AlertCircle, color: "text-orange-600", bg: "bg-orange-100", description: "need action" },
    ];
    return [
      { label: "My Open Tasks", value: stats?.tasks.pending ?? '—', change: stats?.tasks.overdue ? `${stats.tasks.overdue} overdue` : 'on track', positive: false, icon: ListTodo, color: "text-violet-600", bg: "bg-violet-100", description: "assigned to me" },
      ...base,
      { label: "Meetings Today", value: stats?.upcomingMeetings.length ?? '—', change: "Upcoming", positive: true, icon: Video, color: "text-orange-600", bg: "bg-orange-100", description: "scheduled" },
    ];
  }, [isManager, stats]);

  return (
    <div className="space-y-8">
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight bg-gradient-to-r from-foreground to-foreground/70 bg-clip-text">
            Welcome, {user?.name || user?.email?.split('@')[0]}
          </h1>
          <p className="text-muted-foreground mt-1 font-medium">
            Role: <span className="text-violet-500 uppercase tracking-tighter font-bold">{user?.appRole || (user as any)?.role}</span> · {user?.department || 'Operations'}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Link href="/attendance">
            <Button size="sm" variant="outline" className="gap-2 hidden md:flex"><Clock className="w-4 h-4" />Check In</Button>
          </Link>
          {isManager && (
            <Link href="/tasks">
              <Button size="sm" className="gap-2 bg-violet-600 hover:bg-violet-700"><Plus className="w-4 h-4" />New Task</Button>
            </Link>
          )}
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4">
        {statCards.map((stat) => (
          <Card key={stat.label} className="relative overflow-hidden border-none shadow-md bg-card/50 backdrop-blur-sm">
            <CardContent className="p-6">
              <div className="flex items-start justify-between">
                <div className={`p-2.5 rounded-xl ${stat.bg} shadow-inner`}><stat.icon size={20} className={stat.color} /></div>
                <span className={`flex items-center gap-1 text-[10px] font-bold uppercase tracking-wider ${stat.positive ? "text-emerald-600" : "text-orange-500"}`}>
                  {stat.positive ? <TrendingUp size={13} /> : <TrendingDown size={13} />}{stat.change}
                </span>
              </div>
              <div className="mt-4">
                {loadingStats ? <div className="h-8 w-16 bg-muted animate-pulse rounded" /> : <p className="text-3xl font-bold tracking-tight">{stat.value}</p>}
                <p className="text-xs font-semibold text-muted-foreground/80 mt-1 uppercase tracking-widest">{stat.label}</p>
                <p className="text-[10px] text-muted-foreground/50 mt-0.5">{stat.description}</p>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
        {/* Up Next meetings */}
        <Card className="border-none shadow-md bg-violet-600 text-white overflow-hidden relative">
          <div className="absolute top-0 right-0 w-64 h-64 bg-white/10 rounded-full -mr-32 -mt-32 blur-3xl pointer-events-none" />
          <CardHeader>
            <div className="flex items-center gap-2 mb-2"><Zap className="w-5 h-5 fill-yellow-400 text-yellow-400" /><span className="text-xs font-bold uppercase tracking-widest text-white/70">Up Next</span></div>
            {stats?.upcomingMeetings?.[0] ? (
              <><CardTitle className="text-2xl font-bold">{stats.upcomingMeetings[0].title}</CardTitle><CardDescription className="text-white/60">{format(new Date(stats.upcomingMeetings[0].scheduledTime), 'MMM d \'at\' hh:mm a')}</CardDescription></>
            ) : (
              <><CardTitle className="text-xl font-bold">No upcoming meetings</CardTitle><CardDescription className="text-white/60">Schedule one in the Meetings tab</CardDescription></>
            )}
          </CardHeader>
          <CardContent className="space-y-3 relative z-10">
            {stats?.upcomingMeetings?.slice(0, 3).map((m) => (
              <div key={m._id} className="flex items-center gap-3 p-2.5 rounded-xl bg-white/10 backdrop-blur-md border border-white/10">
                <Video className="w-4 h-4 shrink-0" />
                <div className="flex-1 min-w-0"><p className="text-sm font-medium truncate">{m.title}</p><p className="text-[10px] text-white/60">{format(new Date(m.scheduledTime), 'hh:mm a')}</p></div>
              </div>
            ))}
            <Link href="/meetings"><Button className="w-full bg-white text-violet-600 hover:bg-white/90 font-bold gap-2 mt-2"><Video className="w-4 h-4" />All Meetings</Button></Link>
          </CardContent>
        </Card>

        {/* Announcements widget */}
        <Card className="xl:col-span-2 border-none shadow-md bg-card/50">
          <CardHeader className="flex flex-row items-center justify-between">
            <div><CardTitle className="text-lg flex items-center gap-2"><Megaphone className="w-5 h-5 text-violet-500" />Latest Announcements</CardTitle><CardDescription>Company-wide notices</CardDescription></div>
            <Link href="/announcements" className="text-xs text-violet-600 hover:text-violet-700 font-bold flex items-center gap-1 group">View All <ArrowUpRight size={14} className="group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-transform" /></Link>
          </CardHeader>
          <CardContent className="space-y-3">
            {loadingStats ? (
              <div className="space-y-2">{[1,2,3].map(i => <div key={i} className="h-14 bg-muted animate-pulse rounded-lg" />)}</div>
            ) : announcements.length === 0 ? (
              <div className="py-8 text-center text-muted-foreground text-sm">No announcements yet</div>
            ) : announcements.map((a) => (
              <div key={a._id} className={`p-3.5 rounded-xl bg-muted/50 border-l-4 ${PRIORITY_CLS[a.priority] || 'border-l-slate-400'} hover:bg-muted/70 transition-colors`}>
                <div className="flex items-center gap-2 mb-1">
                  {a.pinned && <Pin className="w-3.5 h-3.5 text-violet-500 shrink-0" />}
                  <p className="font-semibold text-sm line-clamp-1">{a.title}</p>
                </div>
                <p className="text-xs text-muted-foreground line-clamp-2">{a.content}</p>
                <p className="text-[10px] text-muted-foreground/50 mt-1.5">{a.authorDetails?.name} · {format(new Date(a.createdAt), 'MMM d')}</p>
              </div>
            ))}
          </CardContent>
        </Card>
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
        <Card className="xl:col-span-2 border-none shadow-md bg-card/50">
          <CardHeader className="flex flex-row items-center justify-between">
            <div><CardTitle className="text-xl">Task Distribution</CardTitle><CardDescription>Workload by department</CardDescription></div>
            <Link href="/tasks" className="text-xs text-violet-600 hover:text-violet-700 font-bold flex items-center gap-1 group">Full Board <ArrowUpRight size={14} className="group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-transform" /></Link>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={240}>
              <BarChart data={tasksByDepartment} layout="vertical" margin={{ top: 0, right: 30, left: -10, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--muted-foreground)/0.1)" horizontal={false} />
                <XAxis type="number" hide />
                <YAxis dataKey="name" type="category" tick={{ fontSize: 11, fontWeight: 'bold' }} width={90} axisLine={false} tickLine={false} />
                <Tooltip cursor={{ fill: 'hsl(var(--muted)/0.3)' }} contentStyle={{ backgroundColor: 'hsl(var(--card))', border: 'none', borderRadius: '12px', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)' }} />
                <Bar dataKey="tasks" fill="#8b5cf6" radius={[0, 6, 6, 0]} barSize={18} />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card className="border-none shadow-md bg-card/50">
          <CardHeader><CardTitle className="text-lg">My Tasks</CardTitle><CardDescription>Current task breakdown</CardDescription></CardHeader>
          <CardContent className="space-y-4">
            {loadingStats ? (
              <div className="space-y-2">{[1,2,3,4].map(i => <div key={i} className="h-8 bg-muted animate-pulse rounded" />)}</div>
            ) : [
              { label: 'Completed', value: stats?.tasks.completed ?? 0, total: stats?.tasks.total ?? 1, color: 'bg-emerald-500' },
              { label: 'In Progress', value: stats?.tasks.inProgress ?? 0, total: stats?.tasks.total ?? 1, color: 'bg-blue-500' },
              { label: 'Pending', value: stats?.tasks.pending ?? 0, total: stats?.tasks.total ?? 1, color: 'bg-amber-500' },
              { label: 'Overdue', value: stats?.tasks.overdue ?? 0, total: stats?.tasks.total ?? 1, color: 'bg-red-500' },
            ].map(item => (
              <div key={item.label} className="space-y-1.5">
                <div className="flex justify-between text-xs font-medium"><span className="text-muted-foreground">{item.label}</span><span className="font-bold">{item.value}</span></div>
                <div className="h-2 bg-muted rounded-full overflow-hidden"><div className={`h-full ${item.color} rounded-full transition-all`} style={{ width: `${item.total > 0 ? (item.value / item.total) * 100 : 0}%` }} /></div>
              </div>
            ))}
            <Link href="/tasks"><Button variant="outline" className="w-full mt-2 gap-2 text-xs"><ListTodo className="w-3.5 h-3.5" />View All Tasks</Button></Link>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
