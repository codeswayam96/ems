'use client';

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Loader2, Video, Calendar, Clock, Link, FileText, Users } from 'lucide-react';
import { toast } from 'sonner';
import apiClient from '@/lib/api-client';
import { useEmsUser } from '@/components/providers/EmsProvider';

interface FormData {
  title: string;
  description: string;
  platform: 'teams' | 'meet' | 'other';
  scheduledDate: string;
  scheduledTime: string;
  department: string;
  meetingLink: string;
}

interface Props {
  isOpen: boolean;
  onClose: () => void;
  onCreated: () => void;
}

const PLATFORMS = [
  { value: 'teams', label: 'Microsoft Teams', color: 'bg-[#444791]' },
  { value: 'meet', label: 'Google Meet', color: 'bg-[#00897b]' },
  { value: 'other', label: 'Other Platform', color: 'bg-slate-500' },
];

export function CreateMeetingModal({ isOpen, onClose, onCreated }: Props) {
  const { user } = useEmsUser();
  const [saving, setSaving] = useState(false);

  const { register, handleSubmit, watch, reset, formState: { errors } } = useForm<FormData>({
    defaultValues: {
      platform: 'teams',
      department: user?.department || 'General',
    },
  });

  const platform = watch('platform');

  const onSubmit = async (data: FormData) => {
    setSaving(true);
    try {
      const scheduledTime = new Date(`${data.scheduledDate}T${data.scheduledTime}`).toISOString();
      await apiClient.post('/meetings', {
        title: data.title,
        description: data.description,
        platform: data.platform,
        scheduledTime,
        department: data.department,
        meetingLink: data.meetingLink || undefined,
      });
      toast.success('Meeting scheduled successfully!');
      reset();
      onCreated();
      onClose();
    } catch (err: any) {
      toast.error(err.response?.data?.error || 'Failed to create meeting');
    } finally {
      setSaving(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-xl font-bold">
            <Video className="w-5 h-5 text-violet-500" />
            Schedule Meeting
          </DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4 mt-2">
          {/* Title */}
          <div className="space-y-1.5">
            <Label htmlFor="meet-title">Meeting Title *</Label>
            <div className="relative">
              <FileText className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input
                id="meet-title"
                className="pl-9"
                placeholder="e.g. Sprint Planning Q2"
                {...register('title', { required: 'Title is required' })}
              />
            </div>
            {errors.title && <p className="text-xs text-destructive">{errors.title.message}</p>}
          </div>

          {/* Platform */}
          <div className="space-y-1.5">
            <Label>Platform *</Label>
            <div className="grid grid-cols-3 gap-2">
              {PLATFORMS.map((p) => (
                <label
                  key={p.value}
                  className={`flex items-center justify-center gap-2 p-2.5 rounded-lg border-2 cursor-pointer transition-all text-sm font-medium ${
                    platform === p.value
                      ? 'border-violet-500 bg-violet-500/10 text-violet-600'
                      : 'border-border hover:border-violet-300'
                  }`}
                >
                  <input type="radio" value={p.value} {...register('platform')} className="sr-only" />
                  <span className={`w-2 h-2 rounded-full ${p.color}`} />
                  {p.label.split(' ')[0]}
                </label>
              ))}
            </div>
          </div>

          {/* Date & Time */}
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label htmlFor="meet-date">Date *</Label>
              <div className="relative">
                <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input
                  id="meet-date"
                  type="date"
                  className="pl-9"
                  {...register('scheduledDate', { required: 'Date is required' })}
                />
              </div>
              {errors.scheduledDate && <p className="text-xs text-destructive">{errors.scheduledDate.message}</p>}
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="meet-time">Time *</Label>
              <div className="relative">
                <Clock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input
                  id="meet-time"
                  type="time"
                  className="pl-9"
                  {...register('scheduledTime', { required: 'Time is required' })}
                />
              </div>
            </div>
          </div>

          {/* Department */}
          <div className="space-y-1.5">
            <Label htmlFor="meet-dept">Department</Label>
            <div className="relative">
              <Users className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input id="meet-dept" className="pl-9" placeholder="e.g. Engineering" {...register('department')} />
            </div>
          </div>

          {/* Meeting Link */}
          <div className="space-y-1.5">
            <Label htmlFor="meet-link">Meeting Link</Label>
            <div className="relative">
              <Link className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input
                id="meet-link"
                type="url"
                className="pl-9"
                placeholder={
                  platform === 'teams'
                    ? 'https://teams.microsoft.com/...'
                    : platform === 'meet'
                    ? 'https://meet.google.com/...'
                    : 'https://...'
                }
                {...register('meetingLink')}
              />
            </div>
          </div>

          {/* Description */}
          <div className="space-y-1.5">
            <Label htmlFor="meet-desc">Description</Label>
            <textarea
              id="meet-desc"
              rows={3}
              className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring resize-none"
              placeholder="What's this meeting about?"
              {...register('description')}
            />
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
              {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Video className="w-4 h-4" />}
              {saving ? 'Scheduling...' : 'Schedule Meeting'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
