'use client';

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Loader2, Clock, Calendar, FileText, Briefcase } from 'lucide-react';
import { toast } from 'sonner';
import { format } from 'date-fns';
import apiClient from '@/lib/api-client';

interface FormData {
  project: string;
  description: string;
  hours: string;
  date: string;
}

interface Props {
  isOpen: boolean;
  onClose: () => void;
  onCreated: () => void;
}

export function LogTimeModal({ isOpen, onClose, onCreated }: Props) {
  const [saving, setSaving] = useState(false);

  const { register, handleSubmit, reset, formState: { errors } } = useForm<FormData>({
    defaultValues: {
      date: format(new Date(), 'yyyy-MM-dd'),
      hours: '8',
    },
  });

  const onSubmit = async (data: FormData) => {
    const hours = parseFloat(data.hours);
    if (isNaN(hours) || hours < 0.25 || hours > 24) {
      toast.error('Hours must be between 0.25 and 24');
      return;
    }
    setSaving(true);
    try {
      await apiClient.post('/tracking', {
        project: data.project,
        description: data.description,
        hours,
        date: data.date,
      });
      toast.success('Time entry logged! Waiting for manager approval.');
      reset({ date: format(new Date(), 'yyyy-MM-dd'), hours: '8' });
      onCreated();
      onClose();
    } catch (err: any) {
      toast.error(err.response?.data?.error || 'Failed to log time');
    } finally {
      setSaving(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-xl font-bold">
            <Clock className="w-5 h-5 text-violet-500" />
            Log Time Entry
          </DialogTitle>
          <p className="text-sm text-muted-foreground mt-1">
            Record your working hours for manager review
          </p>
        </DialogHeader>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4 mt-2">
          <div className="space-y-1.5">
            <Label htmlFor="log-project">Project / Task *</Label>
            <div className="relative">
              <Briefcase className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input
                id="log-project"
                className="pl-9"
                placeholder="e.g. Dashboard Redesign"
                {...register('project', { required: 'Project name is required' })}
              />
            </div>
            {errors.project && <p className="text-xs text-destructive">{errors.project.message}</p>}
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label htmlFor="log-hours">Hours *</Label>
              <div className="relative">
                <Clock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input
                  id="log-hours"
                  type="number"
                  step="0.25"
                  min="0.25"
                  max="24"
                  className="pl-9"
                  placeholder="8"
                  {...register('hours', { required: 'Hours are required' })}
                />
              </div>
              {errors.hours && <p className="text-xs text-destructive">{errors.hours.message}</p>}
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="log-date">Date *</Label>
              <div className="relative">
                <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input
                  id="log-date"
                  type="date"
                  className="pl-9"
                  {...register('date', { required: 'Date is required' })}
                />
              </div>
            </div>
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="log-desc">Description</Label>
            <div className="relative">
              <FileText className="absolute left-3 top-3 w-4 h-4 text-muted-foreground" />
              <textarea
                id="log-desc"
                rows={3}
                className="w-full rounded-md border border-input bg-background pl-9 pr-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring resize-none"
                placeholder="What did you work on?"
                {...register('description')}
              />
            </div>
          </div>

          <div className="p-3 bg-amber-500/10 rounded-lg border border-amber-500/20">
            <p className="text-xs text-amber-600 font-medium">
              ⏱️ Time entries require manager approval before they are finalized.
            </p>
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
              {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Clock className="w-4 h-4" />}
              {saving ? 'Saving...' : 'Log Time'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
