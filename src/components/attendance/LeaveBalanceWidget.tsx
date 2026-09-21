'use client';

import { useEffect, useState } from 'react';
import apiClient from '@/lib/api-client';
import { cn } from '@/lib/utils';

interface LeaveBalance {
  annualAllotted: number;
  sickAllotted: number;
  casualAllotted: number;
  annualUsed: number;
  sickUsed: number;
  casualUsed: number;
  carryForward: number;
}

interface LeaveBalanceWidgetProps {
  /** If provided, fetches that specific user's balance (manager view) */
  ssoUserId?: string;
}

function BalanceBar({ label, used, allotted, color }: { label: string; used: number; allotted: number; color: string }) {
  const pct = allotted > 0 ? Math.min((used / allotted) * 100, 100) : 0;
  const remaining = Math.max(0, allotted - used);

  return (
    <div className="space-y-1.5">
      <div className="flex items-center justify-between text-xs">
        <span className="font-medium text-foreground">{label}</span>
        <span className="text-muted-foreground">
          <span className={cn('font-bold', remaining === 0 ? 'text-red-500' : 'text-foreground')}>{remaining}</span>
          /{allotted} remaining
        </span>
      </div>
      <div className="h-2 bg-muted rounded-full overflow-hidden">
        <div
          className={cn('h-full rounded-full transition-all duration-500', color)}
          style={{ width: `${pct}%` }}
        />
      </div>
    </div>
  );
}

export function LeaveBalanceWidget({ ssoUserId }: LeaveBalanceWidgetProps) {
  const [balance, setBalance] = useState<LeaveBalance | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const params = ssoUserId ? `?ssoUserId=${ssoUserId}` : '';
    apiClient.get(`/attendance/leave-balance${params}`)
      .then(r => setBalance(r.data))
      .catch(() => setBalance(null))
      .finally(() => setLoading(false));
  }, [ssoUserId]);

  if (loading) {
    return (
      <div className="rounded-xl border border-border p-4 space-y-3">
        {[1, 2, 3].map(i => (
          <div key={i} className="space-y-1">
            <div className="h-3 w-24 bg-muted animate-pulse rounded" />
            <div className="h-2 bg-muted animate-pulse rounded-full" />
          </div>
        ))}
      </div>
    );
  }

  if (!balance) {
    return (
      <div className="rounded-xl border border-border p-4 text-center">
        <p className="text-xs text-muted-foreground">No leave balance configured</p>
        <p className="text-[11px] text-muted-foreground/60 mt-0.5">Ask your admin to set up leave quotas</p>
      </div>
    );
  }

  const carryForwardDays = balance.carryForward || 0;
  const effectiveAnnual = balance.annualAllotted + carryForwardDays;

  return (
    <div className="rounded-xl border border-border bg-card p-4 space-y-4">
      <div className="flex items-center justify-between">
        <p className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Leave Balance</p>
        {carryForwardDays > 0 && (
          <span className="text-[10px] text-emerald-600 font-semibold bg-emerald-50 dark:bg-emerald-900/20 px-2 py-0.5 rounded-full">
            +{carryForwardDays} carry-forward
          </span>
        )}
      </div>
      <BalanceBar
        label="Annual Leave"
        used={balance.annualUsed}
        allotted={effectiveAnnual}
        color="bg-violet-500"
      />
      <BalanceBar
        label="Sick Leave"
        used={balance.sickUsed}
        allotted={balance.sickAllotted}
        color="bg-blue-500"
      />
      <BalanceBar
        label="Casual Leave"
        used={balance.casualUsed}
        allotted={balance.casualAllotted}
        color="bg-amber-500"
      />
    </div>
  );
}
