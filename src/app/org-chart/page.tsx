'use client';

import { useEffect, useState, useCallback } from 'react';
import axios from 'axios';
import { Users, User, Crown, Briefcase, ChevronRight, RefreshCw, Search } from 'lucide-react';
import { cn } from '@/lib/utils';

interface OrgUser {
  _id: string;
  ssoUserId: string;
  appRole: string;
  department: string;
  status: string;
  ssoDetails?: { name: string; email: string; avatar?: string };
}

interface OrgNode {
  user: OrgUser;
  reports: OrgNode[];
}

const ROLE_ORDER = ['ceo', 'admin', 'manager', 'employee', 'intern', 'viewer'];
const ROLE_COLORS: Record<string, string> = {
  ceo:      'bg-amber-50 border-amber-300 text-amber-800',
  admin:    'bg-violet-50 border-violet-300 text-violet-800',
  manager:  'bg-blue-50 border-blue-300 text-blue-800',
  employee: 'bg-emerald-50 border-emerald-300 text-emerald-800',
  intern:   'bg-slate-50 border-slate-200 text-slate-700',
  viewer:   'bg-gray-50 border-gray-200 text-gray-600',
};
const ROLE_ICONS: Record<string, any> = {
  ceo: Crown, admin: Users, manager: Briefcase, employee: User, intern: User, viewer: User,
};

function buildOrgTree(users: OrgUser[]): OrgNode[] {
  // Group by department → role hierarchy
  const sorted = [...users].sort(
    (a, b) => ROLE_ORDER.indexOf(a.appRole) - ROLE_ORDER.indexOf(b.appRole)
  );
  // CEO/Admin at top, Managers report to them, Employees to Managers
  const ceos = sorted.filter(u => ['ceo', 'admin'].includes(u.appRole));
  const managers = sorted.filter(u => u.appRole === 'manager');
  const employees = sorted.filter(u => ['employee', 'intern', 'viewer'].includes(u.appRole));

  const empNodes: OrgNode[] = employees.map(u => ({ user: u, reports: [] }));
  const mgrNodes: OrgNode[] = managers.map(mgr => ({
    user: mgr,
    reports: empNodes.filter(e => e.user.department === mgr.department),
  }));
  const roots: OrgNode[] = ceos.map(ceo => ({
    user: ceo,
    reports: mgrNodes,
  }));

  return roots.length > 0 ? roots : mgrNodes.length > 0 ? mgrNodes : empNodes;
}

function OrgCard({ node, depth = 0, onSelect }: { node: OrgNode; depth?: number; onSelect: (u: OrgUser) => void }) {
  const [expanded, setExpanded] = useState(depth < 2);
  const RoleIcon = ROLE_ICONS[node.user.appRole] || User;
  const roleColor = ROLE_COLORS[node.user.appRole] || ROLE_COLORS.employee;
  const hasChildren = node.reports.length > 0;

  return (
    <div className={cn('flex flex-col items-center', depth > 0 && 'mt-6')}>
      {/* Card */}
      <div
        className={cn(
          'relative w-52 rounded-2xl border-2 p-4 cursor-pointer shadow-sm hover:shadow-md transition-all group',
          roleColor
        )}
        onClick={() => onSelect(node.user)}
      >
        {/* Avatar */}
        <div className="flex flex-col items-center gap-2">
          <div className="w-12 h-12 rounded-full bg-white border-2 border-current/20 flex items-center justify-center shadow-sm">
            {node.user.ssoDetails?.avatar ? (
              <img src={node.user.ssoDetails.avatar} alt="" className="w-full h-full rounded-full object-cover" />
            ) : (
              <span className="text-lg font-bold opacity-70">
                {(node.user.ssoDetails?.name || '?').charAt(0).toUpperCase()}
              </span>
            )}
          </div>
          <div className="text-center">
            <p className="font-bold text-sm leading-tight">
              {node.user.ssoDetails?.name || 'Unknown'}
            </p>
            <p className="text-xs opacity-60 mt-0.5">{node.user.department}</p>
            <span className="inline-flex items-center gap-1 mt-1 text-[10px] font-bold uppercase tracking-wider opacity-70">
              <RoleIcon size={9} /> {node.user.appRole}
            </span>
          </div>
        </div>

        {/* Expand toggle */}
        {hasChildren && (
          <button
            onClick={e => { e.stopPropagation(); setExpanded(p => !p); }}
            className="absolute -bottom-3 left-1/2 -translate-x-1/2 w-6 h-6 rounded-full bg-white border-2 border-current/30 flex items-center justify-center shadow-sm hover:scale-110 transition-transform z-10"
          >
            <ChevronRight size={10} className={cn('transition-transform', expanded ? 'rotate-90' : '')} />
          </button>
        )}
      </div>

      {/* Children */}
      {hasChildren && expanded && (
        <div className="flex flex-col items-center mt-3">
          {/* Vertical line */}
          <div className="w-0.5 h-4 bg-border" />
          {/* Horizontal connector */}
          {node.reports.length > 1 && (
            <div className="flex items-start">
              <div className="flex">
                {node.reports.map((child) => (
                  <div key={child.user._id} className="flex flex-col items-center mx-3">
                    <div className="w-0.5 h-4 bg-border" />
                    <OrgCard node={child} depth={depth + 1} onSelect={onSelect} />
                  </div>
                ))}
              </div>
            </div>
          )}
          {node.reports.length === 1 && (
            <OrgCard node={node.reports[0]} depth={depth + 1} onSelect={onSelect} />
          )}
        </div>
      )}
    </div>
  );
}

function ProfileDrawer({ user, onClose }: { user: OrgUser; onClose: () => void }) {
  const RoleIcon = ROLE_ICONS[user.appRole] || User;
  return (
    <div className="fixed inset-0 z-50 flex">
      <div className="flex-1 bg-black/40 backdrop-blur-sm" onClick={onClose} />
      <div className="w-80 bg-background border-l border-border flex flex-col h-full shadow-2xl">
        <div className="p-6 border-b border-border">
          <div className="flex items-center justify-between mb-4">
            <p className="text-xs font-bold text-muted-foreground uppercase tracking-widest">Employee Profile</p>
            <button onClick={onClose} className="w-7 h-7 rounded-lg hover:bg-secondary flex items-center justify-center text-muted-foreground transition-colors">✕</button>
          </div>
          <div className="flex flex-col items-center gap-3 text-center">
            <div className="w-16 h-16 rounded-2xl bg-secondary flex items-center justify-center text-2xl font-bold">
              {(user.ssoDetails?.name || '?').charAt(0).toUpperCase()}
            </div>
            <div>
              <p className="font-bold text-lg">{user.ssoDetails?.name || 'Unknown'}</p>
              <p className="text-sm text-muted-foreground">{user.ssoDetails?.email}</p>
            </div>
          </div>
        </div>
        <div className="p-6 space-y-4">
          {[
            { label: 'Role', value: user.appRole.toUpperCase(), icon: RoleIcon },
            { label: 'Department', value: user.department, icon: Briefcase },
            { label: 'Status', value: user.status, icon: User },
            { label: 'SSO ID', value: user.ssoUserId.slice(0, 12) + '…', icon: User },
          ].map(row => (
            <div key={row.label} className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-xl bg-secondary flex items-center justify-center shrink-0">
                <row.icon size={14} className="text-muted-foreground" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-[10px] text-muted-foreground font-bold uppercase tracking-widest">{row.label}</p>
                <p className="text-sm font-semibold truncate">{row.value}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

export default function OrgChartPage() {
  const [users, setUsers] = useState<OrgUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState<OrgUser | null>(null);
  const [search, setSearch] = useState('');
  const [filterDept, setFilterDept] = useState('ALL');

  const fetchUsers = useCallback(async () => {
    setLoading(true);
    try {
      const { data } = await axios.get('/api/users');
      setUsers(data);
    } catch {
      // silent — show empty state
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchUsers(); }, [fetchUsers]);

  const departments = ['ALL', ...Array.from(new Set(users.map(u => u.department)))].sort();
  const filtered = users.filter(u => {
    const name = u.ssoDetails?.name?.toLowerCase() || '';
    const matchSearch = !search || name.includes(search.toLowerCase()) || u.department.toLowerCase().includes(search.toLowerCase());
    const matchDept = filterDept === 'ALL' || u.department === filterDept;
    return matchSearch && matchDept;
  });
  const tree = buildOrgTree(filtered);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <RefreshCw className="w-6 h-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="w-2 h-2 rounded-full bg-primary" />
            <span className="text-[10px] font-bold text-primary uppercase tracking-[0.2em]">People</span>
          </div>
          <h1 className="text-3xl font-bold tracking-tight">Organization Chart</h1>
          <p className="text-muted-foreground text-sm mt-1">{users.length} employees across {departments.length - 1} departments</p>
        </div>
        <div className="flex items-center gap-2">
          <button onClick={fetchUsers} className="h-9 px-4 rounded-full border border-border bg-background text-xs font-bold flex items-center gap-1.5 hover:bg-secondary transition-colors">
            <RefreshCw size={13} /> Refresh
          </button>
        </div>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1 max-w-sm">
          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
          <input
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Search employees…"
            className="w-full h-10 pl-9 pr-4 text-sm bg-background border border-border rounded-full focus:outline-none focus:ring-2 focus:ring-primary/30"
          />
        </div>
        <div className="flex gap-2 overflow-x-auto">
          {departments.map(dept => (
            <button
              key={dept}
              onClick={() => setFilterDept(dept)}
              className={cn(
                'h-10 px-4 rounded-full text-xs font-bold border whitespace-nowrap transition-all',
                filterDept === dept ? 'bg-foreground text-background border-foreground' : 'bg-background border-border text-muted-foreground hover:border-foreground/30'
              )}
            >
              {dept === 'ALL' ? 'All Depts' : dept}
            </button>
          ))}
        </div>
      </div>

      {/* Legend */}
      <div className="flex flex-wrap gap-2">
        {Object.entries(ROLE_COLORS).map(([role, cls]) => {
          const Icon = ROLE_ICONS[role];
          return (
            <div key={role} className={cn('flex items-center gap-1.5 px-3 py-1 rounded-full border-2 text-xs font-bold', cls)}>
              <Icon size={10} /> {role.charAt(0).toUpperCase() + role.slice(1)}
            </div>
          );
        })}
      </div>

      {/* Chart */}
      {filtered.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 text-muted-foreground gap-3">
          <Users size={40} className="opacity-20" />
          <p className="font-semibold">No employees found</p>
        </div>
      ) : (
        <div className="overflow-auto pb-10">
          <div className="min-w-max flex flex-col items-center py-8 px-4">
            {tree.map(root => (
              <div key={root.user._id} className="mb-8">
                <OrgCard node={root} depth={0} onSelect={setSelected} />
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Profile drawer */}
      {selected && <ProfileDrawer user={selected} onClose={() => setSelected(null)} />}
    </div>
  );
}
