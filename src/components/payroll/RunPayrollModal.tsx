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
import { toast } from 'sonner';
import { Loader2, PlayCircle, Calendar } from 'lucide-react';
import apiClient from '@/lib/api-client';
import { format } from 'date-fns';

const RunPayrollSchema = z.object({
  month: z.coerce.number().min(1).max(12),
  year: z.coerce.number().min(2020).max(2099),
  notes: z.string().optional(),
});

type RunPayrollValues = z.infer<typeof RunPayrollSchema>;

interface RunPayrollModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess: () => void;
}

export function RunPayrollModal({ open, onOpenChange, onSuccess }: RunPayrollModalProps) {
  const [running, setRunning] = useState(false);

  const now = new Date();
  const { register, handleSubmit, watch, formState: { errors } } = useForm<RunPayrollValues>({
    resolver: zodResolver(RunPayrollSchema),
    defaultValues: {
      month: now.getMonth() + 1,
      year: now.getFullYear(),
      notes: '',
    },
  });

  const month = watch('month');
  const year = watch('year');

  const payPeriod = (month && year)
    ? format(new Date(year, month - 1, 1), 'MMMM yyyy')
    : '—';

  const onSubmit = async (data: RunPayrollValues) => {
    setRunning(true);
    try {
      const res = await apiClient.post('/payroll', {
        month: data.month,
        year: data.year,
        notes: data.notes,
      });
      toast.success(res.data.message);
      onOpenChange(false);
      onSuccess();
    } catch (err: any) {
      toast.error(err.response?.data?.error || 'Failed to run payroll');
    } finally {
      setRunning(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-sm">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <PlayCircle className="w-5 h-5 text-violet-600" />
            Run Payroll
          </DialogTitle>
          <DialogDescription>
            Generate payslips for all employees who have a salary configuration. Existing draft payslips for the same period will be updated.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <Label>Month *</Label>
              <Input
                {...register('month')}
                type="number"
                min={1} max={12}
                placeholder="1-12"
              />
              {errors.month && <p className="text-xs text-destructive">{errors.month.message}</p>}
            </div>
            <div className="space-y-1.5">
              <Label>Year *</Label>
              <Input
                {...register('year')}
                type="number"
                min={2020} max={2099}
                placeholder="2025"
              />
              {errors.year && <p className="text-xs text-destructive">{errors.year.message}</p>}
            </div>
          </div>

          {/* Period preview */}
          <div className="flex items-center gap-2 rounded-xl border border-border bg-muted/40 px-4 py-3">
            <Calendar className="w-4 h-4 text-violet-600 shrink-0" />
            <div>
              <p className="text-xs text-muted-foreground">Pay Period</p>
              <p className="text-sm font-semibold text-foreground">{payPeriod}</p>
            </div>
          </div>

          <div className="space-y-1.5">
            <Label>Notes (optional)</Label>
            <Input {...register('notes')} placeholder="e.g. Q1 bonus included" />
          </div>

          {/* Warning */}
          <div className="rounded-xl border border-amber-200 bg-amber-50 dark:border-amber-800/50 dark:bg-amber-900/10 px-3 py-2.5">
            <p className="text-xs text-amber-700 dark:text-amber-400">
              Pro-rata deduction applies for partial months. Employees without salary configurations will be skipped.
            </p>
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button>
            <Button type="submit" disabled={running} className="bg-violet-600 hover:bg-violet-700 text-white">
              {running ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <PlayCircle className="w-4 h-4 mr-2" />}
              {running ? 'Processing...' : 'Run Payroll'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
