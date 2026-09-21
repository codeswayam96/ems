'use client';

import { useState, useEffect, useCallback, useMemo } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import {
  IndianRupee, PlayCircle, Settings2, Eye, CheckCircle2,
  Clock, TrendingUp, Download, Loader2, Banknote,
} from 'lucide-react';
import { format } from 'date-fns';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';
import apiClient from '@/lib/api-client';
import { useEmsUser } from '@/components/providers/EmsProvider';
import { hasPermission, UserRole } from '@/lib/permissions';
import { RunPayrollModal } from '@/components/payroll/RunPayrollModal';
import { SalaryConfigModal } from '@/components/payroll/SalaryConfigModal';
import { PayslipDetail } from '@/components/payroll/PayslipDetail';
import { EmptyState } from '@/components/EmptyState';
import { SkeletonStatCard } from '@codeswayam/ui';

interface Payslip {
  _id: string;
  ssoUserId: string;
  payPeriod: string;
  month: number;
  year: number;
  basicSalary: number;
  allowances: number;
  bonus: number;
  workingDays: number;
  daysWorked: number;
  grossSalary: number;
  pfDeduction: number;
  professionalTax: number;
  otherDeductions: number;
  totalDeductions: number;
  netSalary: number;
  status: 'draft' | 'approved' | 'paid';
  notes?: string;
  paidAt?: string;
  employeeDetails?: { name: string; email: string };
  createdAt: string;
}

interface Employee {
  ssoUserId: string;
  ssoDetails?: { name: string; email: string };
}

const STATUS_CONFIG = {
  draft:    { label: 'Draft',    cls: 'bg-slate-100 text-slate-600' },
  approved: { label: 'Approved', cls: 'bg-blue-100 text-blue-700' },
  paid:     { label: 'Paid',     cls: 'bg-emerald-100 text-emerald-700' },
};

function getUniquePayPeriods(payslips: Payslip[]) {
  const map = new Map<string, { payPeriod: string; label: string }>();
  payslips.forEach((p) => {
    if (!map.has(p.payPeriod)) {
      map.set(p.payPeriod, {
        payPeriod: p.payPeriod,
        label: format(new Date(p.year, p.month - 1, 1), 'MMMM yyyy'),
      });
    }
  });
  return Array.from(map.values()).sort((a, b) => b.payPeriod.localeCompare(a.payPeriod));
}

export default function PayrollPage() {
  const { user } = useEmsUser();
  const isManager = hasPermission((user?.appRole || (user as any)?.role) as UserRole, 'manager');
  const isAdmin = user && ['admin', 'ceo'].includes(user.appRole || (user as any)?.role);

  const [payslips, setPayslips] = useState<Payslip[]>([]);
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedPeriod, setSelectedPeriod] = useState<string>('all');
  const [selectedPayslip, setSelectedPayslip] = useState<Payslip | null>(null);

  // Modals
  const [runPayrollOpen, setRunPayrollOpen] = useState(false);
  const [salaryConfigOpen, setSalaryConfigOpen] = useState(false);
  const [updatingId, setUpdatingId] = useState<string | null>(null);

  const fetchPayslips = useCallback(async () => {
    setLoading(true);
    try {
      const params = selectedPeriod !== 'all' ? `?payPeriod=${selectedPeriod}` : '';
      const res = await apiClient.get(`/payroll${params}`);
      setPayslips(res.data);
    } catch {
      toast.error('Failed to load payroll data');
    } finally {
      setLoading(false);
    }
  }, [selectedPeriod]);

  const fetchEmployees = useCallback(async () => {
    if (!isAdmin) return;
    try {
      const res = await apiClient.get('/users');
      setEmployees(res.data);
    } catch { /* non-critical */ }
  }, [isAdmin]);

  useEffect(() => {
    fetchPayslips();
    fetchEmployees();
  }, [fetchPayslips, fetchEmployees]);

  const payPeriods = useMemo(() => getUniquePayPeriods(payslips), [payslips]);

  const filtered = useMemo(() =>
    selectedPeriod === 'all' ? payslips : payslips.filter((p) => p.payPeriod === selectedPeriod),
    [payslips, selectedPeriod]
  );

  // Summary stats
  const stats = useMemo(() => {
    const list = filtered;
    const totalNet = list.reduce((s, p) => s + p.netSalary, 0);
    const totalGross = list.reduce((s, p) => s + p.grossSalary, 0);
    const paid = list.filter(p => p.status === 'paid').length;
    const pending = list.filter(p => p.status !== 'paid').length;
    return { totalNet, totalGross, paid, pending, count: list.length };
  }, [filtered]);

  const updateStatus = async (id: string, status: string) => {
    setUpdatingId(id);
    try {
      await apiClient.patch(`/payroll/${id}`, { status });
      toast.success(`Payslip marked as ${status}`);
      fetchPayslips();
    } catch {
      toast.error('Failed to update payslip status');
    } finally {
      setUpdatingId(null);
    }
  };

  const exportCSV = () => {
    const rows = [
      ['Employee', 'Email', 'Pay Period', 'Days Worked', 'Gross', 'Deductions', 'Net', 'Status'],
      ...filtered.map(p => [
        p.employeeDetails?.name || p.ssoUserId,
        p.employeeDetails?.email || '',
        p.payPeriod,
        `${p.daysWorked}/${p.workingDays}`,
        p.grossSalary,
        p.totalDeductions,
        p.netSalary,
        p.status,
      ]),
    ];
    const csv = rows.map(r => r.join(',')).join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `payroll-${selectedPeriod !== 'all' ? selectedPeriod : 'all'}.csv`;
    a.click();
    toast.success('Payroll exported');
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight flex items-center gap-2">
            <IndianRupee className="w-7 h-7 text-emerald-600" />
            Payroll
          </h1>
          <p className="text-muted-foreground mt-1">
            {isManager ? 'Manage employee payslips and salary configurations' : 'View your payslips and salary details'}
          </p>
        </div>

        {isAdmin && (
          <div className="flex items-center gap-2 flex-wrap">
            <Button
              variant="outline"
              size="sm"
              className="gap-2"
              onClick={() => setSalaryConfigOpen(true)}
            >
              <Settings2 className="w-4 h-4" /> Salary Config
            </Button>
            <Button
              size="sm"
              className="gap-2 bg-violet-600 hover:bg-violet-700"
              onClick={() => setRunPayrollOpen(true)}
            >
              <PlayCircle className="w-4 h-4" /> Run Payroll
            </Button>
          </div>
        )}
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {loading ? (
          Array.from({ length: 4 }).map((_, i) => <SkeletonStatCard key={i} />)
        ) : (
          <>
            <Card>
              <CardContent className="p-5">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-emerald-100 flex items-center justify-center">
                    <Banknote className="w-5 h-5 text-emerald-600" />
                  </div>
                  <div>
                    <p className="text-2xl font-bold text-foreground">₹{(stats.totalNet / 1000).toFixed(0)}K</p>
                    <p className="text-xs text-muted-foreground">Total Net Pay</p>
                  </div>
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-5">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-violet-100 flex items-center justify-center">
                    <TrendingUp className="w-5 h-5 text-violet-600" />
                  </div>
                  <div>
                    <p className="text-2xl font-bold text-foreground">₹{(stats.totalGross / 1000).toFixed(0)}K</p>
                    <p className="text-xs text-muted-foreground">Gross Payroll</p>
                  </div>
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-5">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-blue-100 flex items-center justify-center">
                    <CheckCircle2 className="w-5 h-5 text-blue-600" />
                  </div>
                  <div>
                    <p className="text-2xl font-bold text-foreground">{stats.paid}</p>
                    <p className="text-xs text-muted-foreground">Paid</p>
                  </div>
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-5">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-amber-100 flex items-center justify-center">
                    <Clock className="w-5 h-5 text-amber-600" />
                  </div>
                  <div>
                    <p className="text-2xl font-bold text-foreground">{stats.pending}</p>
                    <p className="text-xs text-muted-foreground">Pending</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </>
        )}
      </div>

      {/* Filters + Export */}
      <div className="flex items-center gap-3 flex-wrap">
        {payPeriods.length > 0 && (
          <Select value={selectedPeriod} onValueChange={setSelectedPeriod}>
            <SelectTrigger className="w-[200px]">
              <SelectValue placeholder="All periods" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Pay Periods</SelectItem>
              {payPeriods.map((p) => (
                <SelectItem key={p.payPeriod} value={p.payPeriod}>{p.label}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        )}
        {isManager && filtered.length > 0 && (
          <Button variant="outline" size="sm" className="gap-2 ml-auto" onClick={exportCSV}>
            <Download className="w-4 h-4" /> Export CSV
          </Button>
        )}
      </div>

      {/* Payslip Table */}
      {loading ? (
        <div className="flex items-center justify-center py-20">
          <Loader2 className="w-8 h-8 animate-spin text-violet-600" />
        </div>
      ) : filtered.length === 0 ? (
        <EmptyState
          icon={<IndianRupee className="w-10 h-10" />}
          title="No payslips found"
          description={
            isAdmin
              ? 'Run payroll to generate payslips for your team. Make sure to set up salary configurations first.'
              : 'Your payslips will appear here once your admin runs payroll for the month.'
          }
          actionLabel={isAdmin ? 'Run Payroll' : undefined}
          onAction={isAdmin ? () => setRunPayrollOpen(true) : undefined}
        />
      ) : (
        <div className="rounded-xl border border-border overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border bg-muted/40">
                  {isManager && <th className="px-4 py-3 text-left text-xs font-semibold text-muted-foreground uppercase tracking-wider">Employee</th>}
                  <th className="px-4 py-3 text-left text-xs font-semibold text-muted-foreground uppercase tracking-wider">Period</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-muted-foreground uppercase tracking-wider">Attendance</th>
                  <th className="px-4 py-3 text-right text-xs font-semibold text-muted-foreground uppercase tracking-wider">Gross</th>
                  <th className="px-4 py-3 text-right text-xs font-semibold text-muted-foreground uppercase tracking-wider">Deductions</th>
                  <th className="px-4 py-3 text-right text-xs font-semibold text-muted-foreground uppercase tracking-wider">Net Pay</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-muted-foreground uppercase tracking-wider">Status</th>
                  <th className="px-4 py-3 text-right text-xs font-semibold text-muted-foreground uppercase tracking-wider">Actions</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((payslip) => {
                  const statusCfg = STATUS_CONFIG[payslip.status] || STATUS_CONFIG.draft;
                  const proRata = payslip.workingDays > 0
                    ? Math.round((payslip.daysWorked / payslip.workingDays) * 100)
                    : 0;

                  return (
                    <tr key={payslip._id} className="border-b border-border/50 hover:bg-muted/30 transition-colors">
                      {isManager && (
                        <td className="px-4 py-3">
                          <div>
                            <p className="font-medium">{payslip.employeeDetails?.name || payslip.ssoUserId}</p>
                            <p className="text-xs text-muted-foreground">{payslip.employeeDetails?.email}</p>
                          </div>
                        </td>
                      )}
                      <td className="px-4 py-3 font-medium">
                        {format(new Date(payslip.year, payslip.month - 1, 1), 'MMM yyyy')}
                      </td>
                      <td className="px-4 py-3">
                        <span className={cn(
                          'text-xs font-semibold',
                          proRata >= 90 ? 'text-emerald-600' : proRata >= 60 ? 'text-amber-600' : 'text-red-500'
                        )}>
                          {payslip.daysWorked}/{payslip.workingDays} days ({proRata}%)
                        </span>
                      </td>
                      <td className="px-4 py-3 text-right font-medium">
                        ₹{payslip.grossSalary.toLocaleString()}
                      </td>
                      <td className="px-4 py-3 text-right text-red-500 font-medium">
                        −₹{payslip.totalDeductions.toLocaleString()}
                      </td>
                      <td className="px-4 py-3 text-right font-bold text-emerald-600">
                        ₹{payslip.netSalary.toLocaleString()}
                      </td>
                      <td className="px-4 py-3">
                        <span className={cn('text-xs font-semibold px-2.5 py-1 rounded-full', statusCfg.cls)}>
                          {statusCfg.label}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-center justify-end gap-1">
                          <button
                            onClick={() => setSelectedPayslip(payslip)}
                            className="p-1.5 rounded hover:bg-muted transition-colors text-muted-foreground hover:text-foreground"
                            title="View payslip"
                          >
                            <Eye className="w-4 h-4" />
                          </button>
                          {isAdmin && payslip.status === 'draft' && (
                            <button
                              onClick={() => updateStatus(payslip._id, 'approved')}
                              disabled={updatingId === payslip._id}
                              className="p-1.5 rounded hover:bg-blue-50 transition-colors text-blue-600 disabled:opacity-50"
                              title="Approve payslip"
                            >
                              {updatingId === payslip._id
                                ? <Loader2 className="w-4 h-4 animate-spin" />
                                : <CheckCircle2 className="w-4 h-4" />}
                            </button>
                          )}
                          {isAdmin && payslip.status === 'approved' && (
                            <button
                              onClick={() => updateStatus(payslip._id, 'paid')}
                              disabled={updatingId === payslip._id}
                              className="p-1.5 rounded hover:bg-emerald-50 transition-colors text-emerald-600 disabled:opacity-50"
                              title="Mark as paid"
                            >
                              {updatingId === payslip._id
                                ? <Loader2 className="w-4 h-4 animate-spin" />
                                : <Banknote className="w-4 h-4" />}
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Modals */}
      <RunPayrollModal
        open={runPayrollOpen}
        onOpenChange={setRunPayrollOpen}
        onSuccess={fetchPayslips}
      />

      <SalaryConfigModal
        open={salaryConfigOpen}
        onOpenChange={setSalaryConfigOpen}
        employees={employees}
        onSuccess={fetchPayslips}
      />

      {/* Payslip detail slide-over */}
      <PayslipDetail
        payslip={selectedPayslip}
        onClose={() => setSelectedPayslip(null)}
      />
    </div>
  );
}
