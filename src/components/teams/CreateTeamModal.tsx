'use client';

import { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Loader2, Users, Building2, Palette, User } from 'lucide-react';
import { toast } from 'sonner';
import apiClient from '@/lib/api-client';
import axios from 'axios';

interface FormData {
  name: string;
  description: string;
  department: string;
  color: string;
  lead: string;
}

interface EmsUser {
  _id: string;
  ssoUserId: string;
  appRole: string;
  department: string;
  ssoDetails?: { name: string; email: string };
}

interface Props {
  isOpen: boolean;
  onClose: () => void;
  onCreated: () => void;
}

const TEAM_COLORS = [
  { value: 'bg-violet-500', label: 'Violet', hex: '#8b5cf6' },
  { value: 'bg-blue-500', label: 'Blue', hex: '#3b82f6' },
  { value: 'bg-emerald-500', label: 'Emerald', hex: '#10b981' },
  { value: 'bg-pink-500', label: 'Pink', hex: '#ec4899' },
  { value: 'bg-orange-500', label: 'Orange', hex: '#f97316' },
  { value: 'bg-cyan-500', label: 'Cyan', hex: '#06b6d4' },
];

export function CreateTeamModal({ isOpen, onClose, onCreated }: Props) {
  const [saving, setSaving] = useState(false);
  const [users, setUsers] = useState<EmsUser[]>([]);
  const [loadingUsers, setLoadingUsers] = useState(false);

  const { register, handleSubmit, watch, setValue, reset, formState: { errors } } = useForm<FormData>({
    defaultValues: { color: 'bg-violet-500' },
  });

  const selectedColor = watch('color');

  useEffect(() => {
    if (isOpen) {
      setLoadingUsers(true);
      axios.get('/api/users')
        .then((res) => setUsers(res.data))
        .catch(() => {})
        .finally(() => setLoadingUsers(false));
    }
  }, [isOpen]);

  const onSubmit = async (data: FormData) => {
    setSaving(true);
    try {
      await apiClient.post('/teams', {
        name: data.name,
        description: data.description,
        department: data.department,
        color: data.color,
        lead: data.lead,
      });
      toast.success(`Team "${data.name}" created successfully!`);
      reset();
      onCreated();
      onClose();
    } catch (err: any) {
      toast.error(err.response?.data?.error || 'Failed to create team');
    } finally {
      setSaving(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-xl font-bold">
            <Users className="w-5 h-5 text-violet-500" />
            Create New Team
          </DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4 mt-2">
          {/* Name */}
          <div className="space-y-1.5">
            <Label htmlFor="team-name">Team Name *</Label>
            <div className="relative">
              <Users className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input
                id="team-name"
                className="pl-9"
                placeholder="e.g. Frontend Team"
                {...register('name', { required: 'Team name is required' })}
              />
            </div>
            {errors.name && <p className="text-xs text-destructive">{errors.name.message}</p>}
          </div>

          {/* Department */}
          <div className="space-y-1.5">
            <Label htmlFor="team-dept">Department *</Label>
            <div className="relative">
              <Building2 className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input
                id="team-dept"
                className="pl-9"
                placeholder="e.g. Engineering"
                {...register('department', { required: 'Department is required' })}
              />
            </div>
            {errors.department && <p className="text-xs text-destructive">{errors.department.message}</p>}
          </div>

          {/* Team Lead */}
          <div className="space-y-1.5">
            <Label htmlFor="team-lead">Team Lead *</Label>
            <div className="relative">
              <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <select
                id="team-lead"
                className="w-full pl-9 pr-3 py-2 rounded-md border border-input bg-background text-sm focus:outline-none focus:ring-2 focus:ring-ring appearance-none"
                {...register('lead', { required: 'Team lead is required' })}
              >
                <option value="">
                  {loadingUsers ? 'Loading members...' : 'Select team lead'}
                </option>
                {users.map((u) => (
                  <option key={u.ssoUserId} value={u.ssoUserId}>
                    {u.ssoDetails?.name || u.ssoUserId} ({u.department})
                  </option>
                ))}
              </select>
            </div>
            {errors.lead && <p className="text-xs text-destructive">{errors.lead.message}</p>}
          </div>

          {/* Color */}
          <div className="space-y-1.5">
            <Label className="flex items-center gap-1.5">
              <Palette className="w-4 h-4" /> Team Color
            </Label>
            <div className="flex gap-2 flex-wrap">
              {TEAM_COLORS.map((c) => (
                <button
                  key={c.value}
                  type="button"
                  title={c.label}
                  className={`w-8 h-8 rounded-full transition-all ${c.value} ${
                    selectedColor === c.value ? 'ring-2 ring-offset-2 ring-foreground scale-110' : 'hover:scale-105'
                  }`}
                  onClick={() => setValue('color', c.value)}
                />
              ))}
            </div>
          </div>

          {/* Description */}
          <div className="space-y-1.5">
            <Label htmlFor="team-desc">Description</Label>
            <textarea
              id="team-desc"
              rows={2}
              className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring resize-none"
              placeholder="What does this team do?"
              {...register('description')}
            />
          </div>

          <div className="flex gap-3 pt-2">
            <Button type="button" variant="outline" onClick={onClose} className="flex-1">
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={saving || loadingUsers}
              className="flex-1 gap-2 bg-violet-600 hover:bg-violet-700"
            >
              {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Users className="w-4 h-4" />}
              {saving ? 'Creating...' : 'Create Team'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
