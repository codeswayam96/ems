'use client';

import { X, Printer, CheckCircle2, IndianRupee, Building } from 'lucide-react';
import { format } from 'date-fns';
import { cn } from '@/lib/utils';

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

interface PayslipDetailProps {
  payslip: Payslip | null;
  onClose: () => void;
}

const STATUS_CONFIG = {
  draft:    { label: 'Draft',    cls: 'bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-300' },
  approved: { label: 'Approved', cls: 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400' },
  paid:     { label: 'Paid',     cls: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400' },
};

function Row({ label, value, bold, positive }: { label: string; value: string; bold?: boolean; positive?: boolean }) {
  return (
    <div className={cn('flex justify-between py-2 border-b border-border/40 last:border-0', bold && 'font-bold')}>
      <span className={bold ? 'text-foreground' : 'text-muted-foreground text-sm'}>{label}</span>
      <span className={cn(bold ? 'text-base' : 'text-sm', positive === true && 'text-emerald-600', positive === false && 'text-red-500')}>
        {value}
      </span>
    </div>
  );
}

export function PayslipDetail({ payslip, onClose }: PayslipDetailProps) {
  if (!payslip) return null;

  const periodLabel = format(new Date(payslip.year, payslip.month - 1, 1), 'MMMM yyyy');
  const statusCfg = STATUS_CONFIG[payslip.status] || STATUS_CONFIG.draft;
  const employeeName = payslip.employeeDetails?.name || payslip.ssoUserId;
  const proRataPercent = payslip.workingDays > 0
    ? Math.round((payslip.daysWorked / payslip.workingDays) * 100)
    : 0;

  const handlePrint = () => {
    window.print();
  };

  return (
    <>
      {/* Backdrop */}
      <div className="fixed inset-0 z-40 bg-black/40 backdrop-blur-sm" onClick={onClose} />

      {/* Slide-over */}
      <div className="fixed right-0 top-0 bottom-0 z-50 w-full max-w-md bg-background border-l border-border shadow-2xl flex flex-col animate-in slide-in-from-right duration-300 print:static print:shadow-none print:border-0">

        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-border print:hidden">
          <div>
            <p className="font-semibold text-foreground">Payslip — {periodLabel}</p>
            <p className="text-xs text-muted-foreground mt-0.5">{employeeName}</p>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={handlePrint}
              className="flex items-center gap-1.5 h-8 px-3 rounded-lg border border-input bg-background text-xs font-medium text-foreground hover:bg-muted transition-colors"
            >
              <Printer className="w-3.5 h-3.5" /> Print
            </button>
            <button onClick={onClose} className="p-2 rounded-lg hover:bg-muted transition-colors text-muted-foreground">
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Body */}
        <div className="flex-1 overflow-y-auto p-5 space-y-5">

          {/* Company + Status header — print-visible */}
          <div className="flex items-start justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-violet-600 flex items-center justify-center shrink-0">
                <Building className="w-5 h-5 text-white" />
              </div>
              <div>
                <p className="font-bold text-foreground">EMS System</p>
                <p className="text-xs text-muted-foreground">Employee Payslip</p>
              </div>
            </div>
            <span className={cn('text-xs font-semibold px-2.5 py-1 rounded-full', statusCfg.cls)}>
              {statusCfg.label}
            </span>
          </div>

          {/* Employee + Period info */}
          <div className="rounded-xl border border-border bg-muted/30 p-4 space-y-2">
            <div className="grid grid-cols-2 gap-2 text-xs">
              <div>
                <p className="text-muted-foreground">Employee</p>
                <p className="font-semibold text-foreground mt-0.5">{employeeName}</p>
              </div>
              <div>
                <p className="text-muted-foreground">Pay Period</p>
                <p className="font-semibold text-foreground mt-0.5">{periodLabel}</p>
              </div>
              <div>
                <p className="text-muted-foreground">Working Days</p>
                <p className="font-semibold mt-0.5">{payslip.workingDays}</p>
              </div>
              <div>
                <p className="text-muted-foreground">Days Worked</p>
                <p className={cn('font-semibold mt-0.5', proRataPercent < 80 ? 'text-amber-600' : 'text-emerald-600')}>
                  {payslip.daysWorked} ({proRataPercent}%)
                </p>
              </div>
            </div>
          </div>

          {/* Earnings */}
          <div className="rounded-xl border border-border overflow-hidden">
            <div className="bg-emerald-50 dark:bg-emerald-900/20 px-4 py-2.5 flex items-center gap-2">
              <IndianRupee className="w-3.5 h-3.5 text-emerald-700 dark:text-emerald-400" />
              <p className="text-xs font-bold uppercase tracking-wide text-emerald-700 dark:text-emerald-400">Earnings</p>
            </div>
            <div className="p-4">
              <Row label="Basic Salary (prorated)" value={`₹${Math.round(payslip.basicSalary * proRataPercent / 100).toLocaleString()}`} />
              <Row label="Allowances (prorated)" value={`₹${Math.round(payslip.allowances * proRataPercent / 100).toLocaleString()}`} />
              {payslip.bonus > 0 && <Row label="Bonus / Incentive" value={`₹${payslip.bonus.toLocaleString()}`} positive={true} />}
              <Row label="Gross Salary" value={`₹${payslip.grossSalary.toLocaleString()}`} bold />
            </div>
          </div>

          {/* Deductions */}
          <div className="rounded-xl border border-border overflow-hidden">
            <div className="bg-red-50 dark:bg-red-900/20 px-4 py-2.5 flex items-center gap-2">
              <IndianRupee className="w-3.5 h-3.5 text-red-700 dark:text-red-400" />
              <p className="text-xs font-bold uppercase tracking-wide text-red-700 dark:text-red-400">Deductions</p>
            </div>
            <div className="p-4">
              <Row label="Provident Fund (PF)" value={`−₹${payslip.pfDeduction.toLocaleString()}`} positive={false} />
              <Row label="Professional Tax" value={`−₹${payslip.professionalTax.toLocaleString()}`} positive={false} />
              {payslip.otherDeductions > 0 && (
                <Row label="Other Deductions" value={`−₹${payslip.otherDeductions.toLocaleString()}`} positive={false} />
              )}
              <Row label="Total Deductions" value={`−₹${payslip.totalDeductions.toLocaleString()}`} bold />
            </div>
          </div>

          {/* Net Pay */}
          <div className="rounded-2xl bg-gradient-to-br from-violet-600 to-purple-700 p-5 text-white">
            <p className="text-xs font-semibold uppercase tracking-widest text-white/70 mb-1">Net Take-Home Pay</p>
            <p className="text-4xl font-bold tracking-tight">₹{payslip.netSalary.toLocaleString()}</p>
            {payslip.paidAt && (
              <div className="flex items-center gap-1.5 mt-3 text-xs text-white/70">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-300" />
                Paid on {format(new Date(payslip.paidAt), 'dd MMM yyyy')}
              </div>
            )}
          </div>

          {/* Notes */}
          {payslip.notes && (
            <div className="rounded-xl border border-border bg-muted/30 px-4 py-3">
              <p className="text-xs font-semibold text-muted-foreground mb-1">Notes</p>
              <p className="text-sm text-foreground">{payslip.notes}</p>
            </div>
          )}

          {/* Generated date */}
          <p className="text-xs text-muted-foreground/60 text-center">
            Generated on {format(new Date(payslip.createdAt), 'dd MMM yyyy, hh:mm a')}
          </p>
        </div>
      </div>
    </>
  );
}
