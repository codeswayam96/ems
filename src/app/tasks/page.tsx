'use client';

import { useMemo, useState, useEffect, useCallback } from 'react';
import { ColumnDef } from '@tanstack/react-table';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { DataTable } from '@/components/DataTable';
import { StatusBadge, PriorityBadge } from '@/components/StatusBadge';
import { TableToolbar } from '@/components/table/TableToolbar';
import {
  Plus, ListTodo, Kanban, Clock, CheckCircle2, AlertCircle,
  Loader2, Eye, Pencil, Trash2, TrendingUp, Users,
  ChevronDown, Filter, RotateCcw,
} from 'lucide-react';
import { toast } from 'sonner';
import { Card, CardContent } from '@/components/ui/card';
import apiClient from '@/lib/api-client';
import { useEmsUser } from '@/components/providers/EmsProvider';
import { hasPermission, UserRole } from '@/lib/permissions';
import { CreateTaskModal } from '@/components/tasks/CreateTaskModal';
import { EditTaskModal } from '@/components/tasks/EditTaskModal';
import { TaskDetailModal } from '@/components/tasks/TaskDetailModal';

interface Submission {
  ssoUserId: string;
  contentUrl?: string;
  externalLink?: string;
  notes?: string;
  version: number;
  createdAt: string;
}

interface Task {
  _id: string;
  title: string;
  description: string;
  status: 'pending' | 'in_progress' | 'submitted' | 'approved' | 'rejected';
  priority: 'low' | 'medium' | 'high' | 'urgent';
  assignedToSsoId: string;
  assignedBySsoId: string;
  assignedToUser?: { id: string | number; name: string; email: string; role: string };
  assignedByUser?: { id: string | number; name: string; email: string; role: string };
  dueDate?: string;
  tags?: string[];
  submissions?: Submission[];
  createdAt: string;
  updatedAt: string;
}

const STATUS_COLUMNS = [
  { key: 'pending',     label: 'To Do',      color: 'bg-slate-400',    ring: 'ring-slate-400/20',   text: 'text-slate-300' },
  { key: 'in_progress', label: 'In Progress', color: 'bg-blue-500',     ring: 'ring-blue-500/20',    text: 'text-blue-300' },
  { key: 'submitted',   label: 'In Review',   color: 'bg-purple-500',   ring: 'ring-purple-500/20',  text: 'text-purple-300' },
  { key: 'approved',    label: 'Approved',    color: 'bg-emerald-500',  ring: 'ring-emerald-500/20', text: 'text-emerald-300' },
];

function isOverdue(dueDate?: string, status?: string) {
  if (!dueDate || status === 'approved') return false;
  return new Date(dueDate) < new Date();
}

export default function TasksPage() {
  const { user } = useEmsUser();
  const currentRole = (user?.appRole || (user as any)?.role) as UserRole;
  const isManager = hasPermission(currentRole, 'manager');

  const [tasks, setTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [viewMode, setViewMode] = useState<'table' | 'board'>('table');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [priorityFilter, setPriorityFilter] = useState<string>('all');
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [editTask, setEditTask] = useState<Task | null>(null);
  const [detailTask, setDetailTask] = useState<Task | null>(null);

  const fetchTasks = useCallback(async () => {
    setLoading(true);
    try {
      const response = await apiClient.get('/tasks');
      setTasks(response.data);
    } catch {
      toast.error('Could not load tasks');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchTasks(); }, [fetchTasks]);

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this task?')) return;
    setDeletingId(id);
    try {
      await apiClient.delete(`/tasks/${id}`);
      toast.success('Task deleted');
      setTasks((prev) => prev.filter((t) => t._id !== id));
    } catch {
      toast.error('Failed to delete task');
    } finally {
      setDeletingId(null);
    }
  };

  // Stats
  const stats = useMemo(() => ({
    total:      tasks.length,
    pending:    tasks.filter((t) => t.status === 'pending').length,
    inProgress: tasks.filter((t) => t.status === 'in_progress').length,
    submitted:  tasks.filter((t) => t.status === 'submitted').length,
    approved:   tasks.filter((t) => t.status === 'approved').length,
    overdue:    tasks.filter((t) => isOverdue(t.dueDate, t.status)).length,
  }), [tasks]);

  // Filtered tasks
  const filteredTasks = useMemo(() => tasks.filter((t) => {
    const matchesSearch = t.title.toLowerCase().includes(search.toLowerCase()) ||
      t.description.toLowerCase().includes(search.toLowerCase()) ||
      t.assignedToSsoId.toLowerCase().includes(search.toLowerCase());
    const matchesStatus = statusFilter === 'all' || t.status === statusFilter;
    const matchesPriority = priorityFilter === 'all' || t.priority === priorityFilter;
    return matchesSearch && matchesStatus && matchesPriority;
  }), [tasks, search, statusFilter, priorityFilter]);

  const activeFilterCount = (statusFilter !== 'all' ? 1 : 0) + (priorityFilter !== 'all' ? 1 : 0);

  const columns = useMemo<ColumnDef<Task>[]>(() => [
    {
      accessorKey: 'title',
      header: 'Task',
      cell: (info) => {
        const task = info.row.original;
        const overdue = isOverdue(task.dueDate, task.status);
        return (
          <div className="max-w-[280px]">
            <div className="flex items-center gap-2 mb-0.5">
              <p className="font-semibold text-sm line-clamp-1">{task.title}</p>
              {overdue && <AlertCircle className="w-3.5 h-3.5 text-red-400 flex-shrink-0" />}
            </div>
            <p className="text-xs text-muted-foreground line-clamp-1">{task.description}</p>
            {task.tags && task.tags.length > 0 && (
              <div className="flex flex-wrap gap-1 mt-1">
                {task.tags.slice(0, 2).map((tag) => (
                  <Badge key={tag} variant="outline" className="text-[10px] px-1.5 py-0 bg-violet-500/10 text-violet-300 border-violet-500/20">{tag}</Badge>
                ))}
                {task.tags.length > 2 && <Badge variant="outline" className="text-[10px] px-1.5 py-0">+{task.tags.length - 2}</Badge>}
              </div>
            )}
          </div>
        );
      },
    },
    {
      accessorKey: 'assignedToUser',
      header: 'Assignee',
      cell: (info) => {
        const user = info.row.original.assignedToUser;
        const name = user?.name || info.row.original.assignedToSsoId;
        return (
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 rounded-full bg-violet-500/20 flex items-center justify-center text-[10px] font-bold text-violet-500 uppercase">
              {name.charAt(0)}
            </div>
            <div className="flex flex-col">
              <span className="text-sm font-medium">{name}</span>
              <span className="text-[10px] text-muted-foreground">{user?.email || 'No email'}</span>
            </div>
          </div>
        );
      },
    },
    {
      accessorKey: 'priority',
      header: 'Priority',
      cell: (info) => <PriorityBadge priority={info.getValue() as any || 'medium'} />,
    },
    {
      accessorKey: 'status',
      header: 'Status',
      cell: (info) => <StatusBadge status={info.getValue() as any} />,
    },
    {
      accessorKey: 'dueDate',
      header: 'Due Date',
      cell: (info) => {
        const val = info.getValue() as string | undefined;
        const task = info.row.original;
        const overdue = isOverdue(val, task.status);
        if (!val) return <span className="text-muted-foreground text-xs">No date</span>;
        return (
          <span className={`text-xs font-medium flex items-center gap-1 ${overdue ? 'text-red-400' : 'text-muted-foreground'}`}>
            {overdue && <AlertCircle className="w-3 h-3" />}
            {new Date(val).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })}
          </span>
        );
      },
    },
    {
      id: 'actions',
      header: '',
      cell: (info) => {
        const task = info.row.original;
        return (
          <div className="flex items-center gap-1 justify-end">
            <Button variant="ghost" size="sm" className="h-7 w-7 p-0 text-muted-foreground hover:text-foreground" onClick={() => setDetailTask(task)}>
              <Eye className="w-3.5 h-3.5" />
            </Button>
            <Button variant="ghost" size="sm" className="h-7 w-7 p-0 text-muted-foreground hover:text-blue-400" onClick={() => setEditTask(task)}>
              <Pencil className="w-3.5 h-3.5" />
            </Button>
            {isManager && (
              <Button
                variant="ghost" size="sm"
                className="h-7 w-7 p-0 text-muted-foreground hover:text-red-400"
                onClick={() => handleDelete(task._id)}
                disabled={deletingId === task._id}
              >
                {deletingId === task._id ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Trash2 className="w-3.5 h-3.5" />}
              </Button>
            )}
          </div>
        );
      },
    },
  ], [isManager, deletingId]);

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px] space-y-4">
        <div className="w-12 h-12 border-4 border-violet-500/20 border-t-violet-500 rounded-full animate-spin" />
        <p className="text-muted-foreground animate-pulse text-sm">Loading tasks...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex justify-between items-start md:items-center gap-4 flex-col md:flex-row">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Task Board</h1>
          <p className="text-muted-foreground mt-1 text-sm">
            {isManager ? 'Create, assign, and manage team tasks' : 'View and update your assigned tasks'}
          </p>
        </div>
        <div className="flex gap-2 w-full md:w-auto">
          <div className="flex gap-1 bg-muted p-1 rounded-lg">
            <Button variant={viewMode === 'table' ? 'default' : 'ghost'} size="sm" onClick={() => setViewMode('table')} className="gap-1.5 h-8 px-3 text-xs">
              <ListTodo className="w-3.5 h-3.5" /> Table
            </Button>
            <Button variant={viewMode === 'board' ? 'default' : 'ghost'} size="sm" onClick={() => setViewMode('board')} className="gap-1.5 h-8 px-3 text-xs">
              <Kanban className="w-3.5 h-3.5" /> Board
            </Button>
          </div>
          {isManager && (
            <Button onClick={() => setIsCreateOpen(true)} className="gap-2 flex-1 md:flex-none h-9 shadow-lg shadow-violet-500/20 bg-violet-600 hover:bg-violet-700">
              <Plus className="w-4 h-4" /> Create Task
            </Button>
          )}
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
        {[
          { label: 'Total',       value: stats.total,      icon: TrendingUp,   color: 'text-violet-400' },
          { label: 'To Do',       value: stats.pending,    icon: Clock,        color: 'text-sky-400'    },
          { label: 'In Progress', value: stats.inProgress, icon: Loader2,      color: 'text-blue-400'   },
          { label: 'In Review',   value: stats.submitted,  icon: Users,        color: 'text-purple-400' },
          { label: 'Approved',    value: stats.approved,   icon: CheckCircle2, color: 'text-emerald-400'},
          { label: 'Overdue',     value: stats.overdue,    icon: AlertCircle,  color: 'text-red-400'    },
        ].map(({ label, value, icon: Icon, color }) => (
          <Card key={label} className="border-border/50 hover:border-border transition-colors">
            <CardContent className="p-4">
              <div className="flex items-center justify-between mb-2">
                <p className="text-xs text-muted-foreground font-medium">{label}</p>
                <Icon className={`w-5 h-5 ${color}`} />
              </div>
              <p className={`text-2xl font-bold ${color}`}>{value}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Modals */}
      <CreateTaskModal isOpen={isCreateOpen} onClose={() => setIsCreateOpen(false)} onTaskCreated={fetchTasks} />
      <EditTaskModal task={editTask} isOpen={!!editTask} isManager={isManager} onClose={() => setEditTask(null)} onUpdated={fetchTasks} />
      <TaskDetailModal task={detailTask} isOpen={!!detailTask} onClose={() => setDetailTask(null)} />

      {/* Filters Bar */}
      <div className="flex flex-wrap gap-3 items-center">
        <TableToolbar searchValue={search} onSearchChange={setSearch} placeholder="Search tasks, assignees..." />
        <div className="flex items-center gap-2 ml-auto">
          {activeFilterCount > 0 && (
            <Button variant="ghost" size="sm" className="h-9 gap-1.5 text-xs text-muted-foreground" onClick={() => { setStatusFilter('all'); setPriorityFilter('all'); }}>
              <RotateCcw className="w-3.5 h-3.5" /> Reset
            </Button>
          )}
          <div className="relative">
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="h-9 rounded-md border border-input bg-muted/30 px-3 pr-8 text-xs focus:outline-none focus:ring-1 focus:ring-violet-500/50 appearance-none"
            >
              <option value="all">All Statuses</option>
              <option value="pending">To Do</option>
              <option value="in_progress">In Progress</option>
              <option value="submitted">In Review</option>
              <option value="approved">Approved</option>
              <option value="rejected">Rejected</option>
            </select>
            <ChevronDown className="absolute right-2 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted-foreground pointer-events-none" />
          </div>
          <div className="relative">
            <select
              value={priorityFilter}
              onChange={(e) => setPriorityFilter(e.target.value)}
              className="h-9 rounded-md border border-input bg-muted/30 px-3 pr-8 text-xs focus:outline-none focus:ring-1 focus:ring-violet-500/50 appearance-none"
            >
              <option value="all">All Priorities</option>
              <option value="urgent">Urgent</option>
              <option value="high">High</option>
              <option value="medium">Medium</option>
              <option value="low">Low</option>
            </select>
            <ChevronDown className="absolute right-2 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted-foreground pointer-events-none" />
          </div>
          {activeFilterCount > 0 && (
            <Badge className="bg-violet-500/20 text-violet-300 border-violet-500/30 text-xs">
              <Filter className="w-3 h-3 mr-1" />{activeFilterCount} filter{activeFilterCount > 1 ? 's' : ''}
            </Badge>
          )}
        </div>
      </div>

      {/* TABLE VIEW */}
      {viewMode === 'table' && (
        filteredTasks.length > 0 ? (
          <DataTable columns={columns} data={filteredTasks} />
        ) : (
          <div className="flex flex-col items-center justify-center py-20 text-center space-y-3">
            <div className="w-14 h-14 rounded-2xl bg-muted flex items-center justify-center">
              <ListTodo className="w-7 h-7 text-muted-foreground/50" />
            </div>
            <div>
              <p className="font-semibold text-foreground">No tasks found</p>
              <p className="text-sm text-muted-foreground mt-1">
                {search || activeFilterCount > 0 ? 'Try adjusting your search or filters.' : isManager ? 'Create your first task to get started.' : 'No tasks have been assigned to you yet.'}
              </p>
            </div>
            {isManager && !search && activeFilterCount === 0 && (
              <Button onClick={() => setIsCreateOpen(true)} className="gap-2 bg-violet-600 hover:bg-violet-700 mt-2">
                <Plus className="w-4 h-4" /> Create Task
              </Button>
            )}
          </div>
        )
      )}

      {/* KANBAN BOARD VIEW */}
      {viewMode === 'board' && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {STATUS_COLUMNS.map(({ key, label, color, ring, text }) => {
            const colTasks = filteredTasks.filter((t) => t.status === key);
            return (
              <div key={key} className={`bg-muted/30 rounded-xl border border-border/50 ring-1 ${ring} overflow-hidden`}>
                {/* Column Header */}
                <div className="px-4 py-3 border-b border-border/50 flex items-center gap-2">
                  <div className={`w-2.5 h-2.5 rounded-full ${color} shadow-sm`} />
                  <h3 className="font-bold text-sm">{label}</h3>
                  <Badge variant="outline" className={`ml-auto text-[10px] h-5 px-1.5 ${text} border-current bg-current/10`}>
                    {colTasks.length}
                  </Badge>
                </div>

                {/* Cards */}
                <div className="p-3 space-y-2.5 min-h-[400px]">
                  {colTasks.length === 0 && (
                    <div className="flex flex-col items-center justify-center py-10 opacity-40">
                      <ListTodo className="w-6 h-6 mb-2" />
                      <p className="text-xs font-medium">Empty</p>
                    </div>
                  )}
                  {colTasks.map((task) => {
                    const overdue = isOverdue(task.dueDate, task.status);
                    return (
                      <Card
                        key={task._id}
                        className={`border-border/50 shadow-sm hover:shadow-md transition-all cursor-pointer group ${overdue ? 'border-red-500/30' : ''}`}
                        onClick={() => setDetailTask(task)}
                      >
                        <CardContent className="p-3.5">
                          <div className="flex items-start justify-between gap-2 mb-2">
                            <p className="font-semibold text-xs line-clamp-2 group-hover:text-violet-400 transition-colors flex-1">{task.title}</p>
                            <PriorityBadge priority={task.priority || 'medium'} className="text-[10px] flex-shrink-0" />
                          </div>
                          <p className="text-[11px] text-muted-foreground line-clamp-2 leading-relaxed mb-3">{task.description}</p>
                          {task.tags && task.tags.length > 0 && (
                            <div className="flex flex-wrap gap-1 mb-2">
                              {task.tags.slice(0, 2).map((tag) => (
                                <Badge key={tag} variant="outline" className="text-[10px] px-1.5 py-0 h-4 bg-violet-500/10 text-violet-300 border-violet-500/20">{tag}</Badge>
                              ))}
                            </div>
                          )}
                            <div className="flex items-center justify-between border-t border-border/50 pt-3">
                              <div className="flex items-center gap-2">
                                <div className="w-5 h-5 rounded-full bg-violet-500/20 flex items-center justify-center text-[9px] font-bold text-violet-500 uppercase">
                                  {(task.assignedToUser?.name || task.assignedToSsoId).charAt(0)}
                                </div>
                                <span className="text-[10px] text-muted-foreground truncate max-w-[70px]">{task.assignedToUser?.name || task.assignedToSsoId}</span>
                              </div>
                            {task.dueDate && (
                              <span className={`text-[10px] font-medium flex items-center gap-0.5 ${overdue ? 'text-red-400' : 'text-muted-foreground'}`}>
                                {overdue && <AlertCircle className="w-2.5 h-2.5" />}
                                <Clock className="w-2.5 h-2.5" />
                                {new Date(task.dueDate).toLocaleDateString('en-GB', { day: 'numeric', month: 'short' })}
                              </span>
                            )}
                          </div>
                          {/* Quick actions on hover */}
                          <div className="flex gap-1 mt-2 pt-2 border-t border-border/20 opacity-0 group-hover:opacity-100 transition-opacity" onClick={(e) => e.stopPropagation()}>
                            <Button variant="ghost" size="sm" className="h-6 flex-1 text-[10px] gap-1 text-muted-foreground hover:text-foreground" onClick={() => setEditTask(task)}>
                              <Pencil className="w-3 h-3" /> Edit
                            </Button>
                            {isManager && (
                              <Button variant="ghost" size="sm" className="h-6 flex-1 text-[10px] gap-1 text-muted-foreground hover:text-red-400" onClick={() => handleDelete(task._id)} disabled={deletingId === task._id}>
                                {deletingId === task._id ? <Loader2 className="w-3 h-3 animate-spin" /> : <Trash2 className="w-3 h-3" />}
                                Delete
                              </Button>
                            )}
                          </div>
                        </CardContent>
                      </Card>
                    );
                  })}
                </div>

                {/* Column Footer */}
                {isManager && (
                  <div className="px-3 pb-3">
                    <Button
                      variant="ghost"
                      size="sm"
                      className="w-full h-8 text-xs gap-1.5 text-muted-foreground hover:text-foreground border border-dashed border-border/50 hover:border-border"
                      onClick={() => setIsCreateOpen(true)}
                    >
                      <Plus className="w-3.5 h-3.5" /> Add Task
                    </Button>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
