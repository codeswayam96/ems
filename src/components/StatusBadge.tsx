import { cn } from '@/lib/utils';

type StatusType = 'todo' | 'in-progress' | 'in_progress' | 'done' | 'cancelled' | 'approved' | 'pending' | 'rejected' | 'submitted' | 'suspended';
type PriorityType = 'low' | 'medium' | 'high' | 'urgent';
type RoleType = 'admin' | 'manager' | 'employee' | 'ceo' | 'intern';

interface StatusBadgeProps {
  status: StatusType;
  className?: string;
}

interface PriorityBadgeProps {
  priority: PriorityType;
  className?: string;
}

interface RoleBadgeProps {
  role: RoleType;
  className?: string;
}

// Soft pastel pill style — light bg + darker matching text, no border
const statusStyles: Record<StatusType, { label: string; color: string }> = {
  'todo':        { label: 'To Do',       color: 'bg-slate-100  text-slate-500'   },
  'pending':     { label: 'Pending',     color: 'bg-yellow-100 text-yellow-600'  },
  'in-progress': { label: 'In Progress', color: 'bg-blue-100   text-blue-600'    },
  'in_progress': { label: 'In Progress', color: 'bg-blue-100   text-blue-600'    },
  'submitted':   { label: 'In Review',   color: 'bg-purple-100 text-purple-600'  },
  'done':        { label: 'Done',        color: 'bg-green-100  text-green-600'   },
  'approved':    { label: 'Approved',    color: 'bg-emerald-100 text-emerald-600' },
  'cancelled':   { label: 'Cancelled',   color: 'bg-red-100    text-red-600'     },
  'rejected':    { label: 'Rejected',    color: 'bg-red-100    text-red-600'     },
  'suspended':   { label: 'Suspended',   color: 'bg-red-50     text-red-700 border border-red-200' },
};

const priorityStyles: Record<PriorityType, { label: string; color: string }> = {
  'low':    { label: 'Low',    color: 'bg-slate-100  text-slate-500'  },
  'medium': { label: 'Medium', color: 'bg-yellow-100 text-yellow-600' },
  'high':   { label: 'High',   color: 'bg-orange-100 text-orange-600' },
  'urgent': { label: 'Urgent', color: 'bg-red-100    text-red-600'    },
};

const roleStyles: Record<RoleType, { label: string; color: string }> = {
  'ceo':      { label: 'CEO',      color: 'bg-amber-100  text-amber-600'  },
  'admin':    { label: 'Admin',    color: 'bg-violet-100 text-violet-600' },
  'manager':  { label: 'Manager',  color: 'bg-blue-100   text-blue-600'   },
  'employee': { label: 'Employee', color: 'bg-slate-100  text-slate-500'  },
  'intern':   { label: 'Intern',   color: 'bg-teal-100   text-teal-600'   },
};

const pillBase = 'inline-flex items-center justify-center rounded-full px-4 py-1 text-xs font-semibold tracking-wide select-none';

export function StatusBadge({ status, className }: StatusBadgeProps) {
  const style = statusStyles[status] ?? statusStyles['pending'];
  return (
    <span className={cn(pillBase, style.color, className)}>
      {style.label}
    </span>
  );
}

export function PriorityBadge({ priority, className }: PriorityBadgeProps) {
  const style = priorityStyles[priority] ?? priorityStyles['medium'];
  return (
    <span className={cn(pillBase, style.color, className)}>
      {style.label}
    </span>
  );
}

export function RoleBadge({ role, className }: RoleBadgeProps) {
  const style = roleStyles[role] ?? roleStyles['employee'];
  return (
    <span className={cn(pillBase, style.color, className)}>
      {style.label}
    </span>
  );
}
