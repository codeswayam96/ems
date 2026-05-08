'use client';

import { useState, useEffect } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { toast } from 'sonner';
import axios from 'axios';
import { Loader2 } from 'lucide-react';

interface UserActionModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess: () => void;
  user?: any; // If provided, it's an edit action
}

export function UserActionModal({ open, onOpenChange, onSuccess, user }: UserActionModalProps) {
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    ssoUserId: '',
    appRole: 'employee',
    department: 'General',
    status: 'pending',
  });

  useEffect(() => {
    if (user) {
      setFormData({
        ssoUserId: user.ssoUserId,
        appRole: user.appRole,
        department: user.department,
        status: user.status || 'approved',
      });
    } else {
      setFormData({
        ssoUserId: '',
        appRole: 'employee',
        department: 'General',
        status: 'pending',
      });
    }
  }, [user, open]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      if (user) {
        // Edit existing user
        await axios.patch(`/api/users/${user.ssoUserId}`, {
          appRole: formData.appRole,
          department: formData.department,
          status: formData.status,
        });
        toast.success('User updated successfully');
      } else {
        // Add new user
        await axios.post('/api/users', formData);
        toast.success('User added to EMS successfully');
      }
      onSuccess();
      onOpenChange(false);
    } catch (err: any) {
      toast.error(err.response?.data?.error || 'Something went wrong');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>{user ? 'Edit User' : 'Add New User to EMS'}</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4 py-4">
          <div className="space-y-2">
            <Label htmlFor="ssoUserId">SSO User ID</Label>
            <Input
              id="ssoUserId"
              placeholder="Enter numeric SSO User ID"
              value={formData.ssoUserId}
              onChange={(e) => setFormData({ ...formData, ssoUserId: e.target.value })}
              disabled={!!user || loading}
              required
            />
            {!user && <p className="text-[10px] text-muted-foreground">The ID found in the SSO dashboard users list.</p>}
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>App Role</Label>
              <Select
                value={formData.appRole}
                onValueChange={(val) => setFormData({ ...formData, appRole: val })}
                disabled={loading}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select role" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="employee">Employee</SelectItem>
                  <SelectItem value="manager">Manager</SelectItem>
                  <SelectItem value="admin">Admin</SelectItem>
                  <SelectItem value="ceo">CEO</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Department</Label>
              <Select
                value={formData.department}
                onValueChange={(val) => setFormData({ ...formData, department: val })}
                disabled={loading}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select dept" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="General">General</SelectItem>
                  <SelectItem value="Engineering">Engineering</SelectItem>
                  <SelectItem value="Product">Product</SelectItem>
                  <SelectItem value="Sales">Sales</SelectItem>
                  <SelectItem value="Marketing">Marketing</SelectItem>
                  <SelectItem value="HR">HR</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="space-y-2">
            <Label>User Status</Label>
            <Select
              value={formData.status}
              onValueChange={(val) => setFormData({ ...formData, status: val })}
              disabled={loading}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="approved">Approved (Active)</SelectItem>
                <SelectItem value="pending">Pending Approval</SelectItem>
                <SelectItem value="suspended">Suspended</SelectItem>
                <SelectItem value="rejected">Rejected</SelectItem>
              </SelectContent>
            </Select>
            <p className="text-[10px] text-muted-foreground italic">
              * Non-approved users will be blocked from accessing the system.
            </p>
          </div>

          <DialogFooter className="pt-4">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)} disabled={loading}>
              Cancel
            </Button>
            <Button type="submit" disabled={loading}>
              {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              {user ? 'Save Changes' : 'Onboard User'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
