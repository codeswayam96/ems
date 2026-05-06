'use client';

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Loader2, Calendar, FileText, Clock } from 'lucide-react';
import { toast } from 'sonner';
import apiClient from '@/lib/api-client';

interface FormData {
  type: 'sick' | 'casual' | 'vacation' | 'medical' | 'other';
  startDate: string;
  endDate: string;
  reason: string;
}

interface Props {
  isOpen: boolean;
  onClose: () => void;
  onSubmitted: () => void;
}

const LEAVE_TYPES = [
  { value: 'sick', label: 'Sick Leave', icon: '🤒' },
  { value: 'casual', label: 'Casual Leave', icon: '🏖️' },
  { value: 'vacation', label: 'Vacation', icon: '✈️' },
  { value: 'medical', label: 'Medical', icon: '🏥' },
  { value: 'other', label: 'Other', icon: '📋' },
];

export function LeaveRequestModal({ isOpen, onClose, onSubmitted }: Props) {
  const [saving, setSaving] = useState(false);

  const { register, handleSubmit, watch, reset, formState: { errors } } = useForm<FormData>({
    defaultValues: { type: 'casual' },
  });

  const startDate = watch('startDate');
  const endDate = watch('endDate');

  const getDays = () => {
    if (!startDate || !endDate) return 0;
    const s = new Date(startDate);
    const e = new Date(endDate);
    if (e < s) return 0;
    // Count business days
    let businessDays = 0;
    const current = new Date(s);
    while (current <= e) {
      if (current.getDay() !== 0 && current.getDay() !== 6) businessDays++;
      current.setDate(current.getDate() + 1);
    }
    return businessDays;
  };

  const onSubmit = async (data: FormData) => {
    const days = getDays();
    if (days <= 0) {
      toast.error('End date must be on or after start date');
      return;
    }
    setSaving(true);
    try {
      await apiClient.post('/attendance', {
        action: 'leave_request',
        type: data.type,
        startDate: data.startDate,
        endDate: data.endDate,
        days,
        reason: data.reason,
      });
      toast.success('Leave request submitted successfully!');
      reset();
      onSubmitted();
      onClose();
    } catch (err: any) {
      toast.error(err.response?.data?.error || 'Failed to submit leave request');
    } finally {
      setSaving(false);
    }
  };

  const leaveType = watch('type');
  const days = getDays();

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-xl font-bold">
            <Calendar className="w-5 h-5 text-violet-500" />
            Request Leave
          </DialogTitle>
          <p className="text-sm text-muted-foreground mt-1">
            Submit a leave request for manager approval
          </p>
        </DialogHeader>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4 mt-2">
          {/* Leave Type */}
          <div className="space-y-1.5">
            <Label>Leave Type *</Label>
            <div className="grid grid-cols-3 gap-2">
              {LEAVE_TYPES.map((t) => (
                <label
                  key={t.value}
                  className={`flex flex-col items-center gap-1 p-2.5 rounded-lg border-2 cursor-pointer transition-all text-xs font-medium ${
                    leaveType === t.value
                      ? 'border-violet-500 bg-violet-500/10 text-violet-600'
                      : 'border-border hover:border-violet-300'
                  }`}
                >
                  <input type="radio" value={t.value} {...register('type')} className="sr-only" />
                  <span className="text-lg">{t.icon}</span>
                  {t.label}
                </label>
              ))}
            </div>
          </div>

          {/* Dates */}
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label htmlFor="leave-start">Start Date *</Label>
              <div className="relative">
                <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input
                  id="leave-start"
                  type="date"
                  className="pl-9"
                  {...register('startDate', { required: 'Start date is required' })}
                />
              </div>
              {errors.startDate && <p className="text-xs text-destructive">{errors.startDate.message}</p>}
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="leave-end">End Date *</Label>
              <div className="relative">
                <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input
                  id="leave-end"
                  type="date"
                  className="pl-9"
                  min={startDate}
                  {...register('endDate', { required: 'End date is required' })}
                />
              </div>
              {errors.endDate && <p className="text-xs text-destructive">{errors.endDate.message}</p>}
            </div>
          </div>

          {/* Days preview */}
          {days > 0 && (
            <div className="flex items-center gap-2 p-3 bg-violet-500/10 rounded-lg border border-violet-500/20">
              <Clock className="w-4 h-4 text-violet-500" />
              <p className="text-sm font-semibold text-violet-600">
                {days} business day{days !== 1 ? 's' : ''} of leave
              </p>
            </div>
          )}

          {/* Reason */}
          <div className="space-y-1.5">
            <Label htmlFor="leave-reason">Reason *</Label>
            <div className="relative">
              <FileText className="absolute left-3 top-3 w-4 h-4 text-muted-foreground" />
              <textarea
                id="leave-reason"
                rows={3}
                className="w-full rounded-md border border-input bg-background pl-9 pr-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring resize-none"
                placeholder="Brief reason for leave..."
                {...register('reason', { required: 'Reason is required' })}
              />
            </div>
            {errors.reason && <p className="text-xs text-destructive">{errors.reason.message}</p>}
          </div>

          <div className="flex gap-3 pt-2">
            <Button type="button" variant="outline" onClick={onClose} className="flex-1">
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={saving}
              className="flex-1 gap-2 bg-violet-600 hover:bg-violet-700"
            >
              {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Calendar className="w-4 h-4" />}
              {saving ? 'Submitting...' : 'Submit Request'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
