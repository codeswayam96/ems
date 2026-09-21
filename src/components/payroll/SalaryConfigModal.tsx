'use client';

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { toast } from 'sonner';
import { Loader2, IndianRupee, Percent, Building2 } from 'lucide-react';
import apiClient from '@/lib/api-client';

const SalarySchema = z.object({
  ssoUserId: z.string().min(1, 'Employee required'),
  basicSalary: z.coerce.number().min(1, 'Basic salary must be > 0'),
  allowances: z.coerce.number().min(0),
  pfPercent: z.coerce.number().min(0).max(100),
  professionalTax: z.coerce.number().min(0),
  otherDeductions: z.coerce.number().min(0),
  bankAccount: z.string().optional(),
  ifsc: z.string().optional(),
});

type SalaryFormValues = z.infer<typeof SalarySchema>;

interface Employee {
  ssoUserId: string;
  ssoDetails?: { name: string; email: string };
}

interface ExistingConfig {
  ssoUserId: string;
  basicSalary: number;
  allowances: number;
  pfPercent: number;
  professionalTax: number;
  otherDeductions: number;
  bankAccount?: string;
  ifsc?: string;
}

interface SalaryConfigModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  employees: Employee[];
  existingConfig?: ExistingConfig | null;
  onSuccess: () => void;
}

function InfoRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex justify-between text-xs py-1 border-b border-border/50 last:border-0">
      <span className="text-muted-foreground">{label}</span>
      <span className="font-semibold text-foreground">{value}</span>
    </div>
  );
}

export function SalaryConfigModal({ open, onOpenChange, employees, existingConfig, onSuccess }: SalaryConfigModalProps) {
  const [saving, setSaving] = useState(false);

  const { register, handleSubmit, watch, setValue, formState: { errors } } = useForm<SalaryFormValues>({
    resolver: zodResolver(SalarySchema),
    defaultValues: existingConfig
      ? { ...existingConfig }
      : { pfPercent: 12, professionalTax: 200, allowances: 0, otherDeductions: 0 },
  });

  const basic = watch('basicSalary') || 0;
  const allowances = watch('allowances') || 0;
  const pfPercent = watch('pfPercent') || 12;
  const profTax = watch('professionalTax') || 200;
  const otherDed = watch('otherDeductions') || 0;

  const gross = (Number(basic) + Number(allowances));
  const pf = Math.round((Number(basic) * Number(pfPercent)) / 100);
  const totalDed = pf + Number(profTax) + Number(otherDed);
  const net = Math.max(0, gross - totalDed);

  const onSubmit = async (data: SalaryFormValues) => {
    setSaving(true);
    try {
      await apiClient.post('/payroll/salary-config', data);
      toast.success('Salary configuration saved successfully');
      onOpenChange(false);
      onSuccess();
    } catch (err: any) {
      toast.error(err.response?.data?.error || 'Failed to save salary config');
    } finally {
      setSaving(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <IndianRupee className="w-5 h-5 text-emerald-600" />
            {existingConfig ? 'Edit Salary Configuration' : 'Set Salary Configuration'}
          </DialogTitle>
          <DialogDescription>
            Configure the CTC structure for this employee. These values will be used for payslip generation.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
          {/* Employee Selector */}
          {!existingConfig && (
            <div className="space-y-1.5">
              <Label>Employee *</Label>
              <Select onValueChange={(v) => setValue('ssoUserId', v)}>
                <SelectTrigger>
                  <SelectValue placeholder="Select employee..." />
                </SelectTrigger>
                <SelectContent>
                  {employees.map((e) => (
                    <SelectItem key={e.ssoUserId} value={e.ssoUserId}>
                      {e.ssoDetails?.name || e.ssoUserId}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {errors.ssoUserId && <p className="text-xs text-destructive">{errors.ssoUserId.message}</p>}
            </div>
          )}

          {/* Two-column grid */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <Label>Basic Salary (₹/month) *</Label>
              <div className="relative">
                <IndianRupee className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted-foreground" />
                <Input {...register('basicSalary')} type="number" className="pl-8" placeholder="e.g. 30000" />
              </div>
              {errors.basicSalary && <p className="text-xs text-destructive">{errors.basicSalary.message}</p>}
            </div>
            <div className="space-y-1.5">
              <Label>Allowances (₹/month)</Label>
              <div className="relative">
                <IndianRupee className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted-foreground" />
                <Input {...register('allowances')} type="number" className="pl-8" placeholder="e.g. 5000" />
              </div>
            </div>
            <div className="space-y-1.5">
              <Label>PF Deduction (%)</Label>
              <div className="relative">
                <Percent className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted-foreground" />
                <Input {...register('pfPercent')} type="number" className="pl-8" placeholder="12" />
              </div>
            </div>
            <div className="space-y-1.5">
              <Label>Professional Tax (₹)</Label>
              <div className="relative">
                <IndianRupee className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted-foreground" />
                <Input {...register('professionalTax')} type="number" className="pl-8" placeholder="200" />
              </div>
            </div>
            <div className="space-y-1.5">
              <Label>Other Deductions (₹)</Label>
              <div className="relative">
                <IndianRupee className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted-foreground" />
                <Input {...register('otherDeductions')} type="number" className="pl-8" placeholder="0" />
              </div>
            </div>
            <div className="space-y-1.5">
              <Label>IFSC Code</Label>
              <Input {...register('ifsc')} placeholder="SBIN0001234" />
            </div>
          </div>

          <div className="space-y-1.5">
            <Label>Bank Account Number</Label>
            <div className="relative">
              <Building2 className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted-foreground" />
              <Input {...register('bankAccount')} className="pl-8" placeholder="Account number" />
            </div>
          </div>

          {/* Live preview */}
          <div className="rounded-xl border border-border bg-muted/40 p-4 space-y-1.5">
            <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2">Live Preview (full month)</p>
            <InfoRow label="Gross CTC" value={`₹${gross.toLocaleString()}`} />
            <InfoRow label="PF Deduction" value={`₹${pf.toLocaleString()}`} />
            <InfoRow label="Professional Tax" value={`₹${Number(profTax).toLocaleString()}`} />
            <InfoRow label="Other Deductions" value={`₹${Number(otherDed).toLocaleString()}`} />
            <div className="flex justify-between text-sm pt-2 font-bold">
              <span>Net Take-home</span>
              <span className="text-emerald-600">₹{net.toLocaleString()}</span>
            </div>
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button>
            <Button type="submit" disabled={saving} className="bg-emerald-600 hover:bg-emerald-700 text-white">
              {saving && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
              Save Configuration
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
