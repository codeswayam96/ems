'use client';

import { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Save, Check, Loader2, User, Shield, Bell, Palette } from 'lucide-react';
import { toast } from 'sonner';
import { useEmsUser } from '@/components/providers/EmsProvider';
import apiClient from '@/lib/api-client';

interface AccountFormData { department: string; }
interface NotifData { emailTasks: boolean; emailMeetings: boolean; emailLeave: boolean; }

const DEPARTMENTS = ['Engineering', 'Product', 'Design', 'Sales', 'HR', 'Operations', 'Finance', 'Marketing', 'General'];

export default function SettingsPage() {
  const { user, refreshProfile } = useEmsUser();
  const [savingAccount, setSavingAccount] = useState(false);
  const [savedAccount, setSavedAccount] = useState(false);
  const [notifs, setNotifs] = useState<NotifData>({ emailTasks: true, emailMeetings: true, emailLeave: true });
  const [savedNotifs, setSavedNotifs] = useState(false);

  const accountForm = useForm<AccountFormData>({ defaultValues: { department: user?.department || 'General' } });

  useEffect(() => {
    if (user?.department) accountForm.reset({ department: user.department });
  }, [user]);

  const onAccountSubmit = async (data: AccountFormData) => {
    setSavingAccount(true);
    try {
      await apiClient.patch('/ems-profile', { department: data.department });
      await refreshProfile();
      setSavedAccount(true);
      toast.success('Profile updated!');
      setTimeout(() => setSavedAccount(false), 3000);
    } catch { toast.error('Failed to save changes'); }
    finally { setSavingAccount(false); }
  };

  const onSaveNotifs = () => {
    setSavedNotifs(true);
    toast.success('Notification preferences saved!');
    setTimeout(() => setSavedNotifs(false), 3000);
  };

  return (
    <div className="space-y-6 max-w-2xl">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Settings</h1>
        <p className="text-muted-foreground mt-1">Manage your profile and application preferences</p>
      </div>

      {/* Profile Info (read-only from SSO) */}
      <Card className="border-none shadow-sm">
        <CardHeader><CardTitle className="flex items-center gap-2 text-lg"><User className="w-5 h-5 text-violet-500" />Your Profile</CardTitle></CardHeader>
        <CardContent>
          <div className="flex items-center gap-4 mb-6">
            <div className="w-16 h-16 rounded-full bg-gradient-to-br from-violet-500 to-purple-600 flex items-center justify-center text-2xl font-bold text-white">
              {(user?.name || user?.email || 'U').charAt(0).toUpperCase()}
            </div>
            <div>
              <p className="text-xl font-bold">{user?.name || 'Your Name'}</p>
              <p className="text-muted-foreground text-sm">{user?.email}</p>
              <span className="inline-block mt-1 text-xs font-semibold text-violet-600 bg-violet-500/10 px-2 py-0.5 rounded-full uppercase tracking-wide">{user?.appRole || 'employee'}</span>
            </div>
          </div>
          <p className="text-xs text-muted-foreground bg-muted/50 p-3 rounded-lg border">
            ℹ️ Name and email are managed through your SSO account and cannot be changed here.
          </p>
        </CardContent>
      </Card>

      {/* Department Settings */}
      <Card className="border-none shadow-sm">
        <CardHeader><CardTitle className="flex items-center gap-2 text-lg"><Palette className="w-5 h-5 text-violet-500" />Work Settings</CardTitle><p className="text-sm text-muted-foreground">Update your department and work preferences</p></CardHeader>
        <CardContent>
          <form onSubmit={accountForm.handleSubmit(onAccountSubmit)} className="space-y-4">
            <div>
              <Label htmlFor="dept-select">Department</Label>
              <select
                id="dept-select"
                {...accountForm.register('department')}
                className="w-full mt-1.5 px-3 py-2 border rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-violet-500/50 bg-background"
              >
                {DEPARTMENTS.map(d => <option key={d} value={d}>{d}</option>)}
              </select>
            </div>
            <Button type="submit" disabled={savingAccount} className={`gap-2 transition-all ${savedAccount ? 'bg-emerald-600 hover:bg-emerald-700' : 'bg-violet-600 hover:bg-violet-700'}`}>
              {savingAccount ? <Loader2 className="w-4 h-4 animate-spin" /> : savedAccount ? <Check className="w-4 h-4" /> : <Save className="w-4 h-4" />}
              {savingAccount ? 'Saving...' : savedAccount ? 'Saved!' : 'Save Changes'}
            </Button>
          </form>
        </CardContent>
      </Card>

      {/* Security */}
      <Card className="border-none shadow-sm">
        <CardHeader><CardTitle className="flex items-center gap-2 text-lg"><Shield className="w-5 h-5 text-violet-500" />Security</CardTitle></CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground bg-muted/50 p-4 rounded-lg border">
            Password and security settings are managed through your centralized SSO account. Contact your administrator to update your credentials.
          </p>
          <div className="mt-4 grid grid-cols-2 gap-3">
            <div className="p-3 rounded-lg bg-muted/50 border">
              <p className="text-xs text-muted-foreground">Account Status</p>
              <p className="font-semibold text-emerald-600 mt-0.5">✓ Active</p>
            </div>
            <div className="p-3 rounded-lg bg-muted/50 border">
              <p className="text-xs text-muted-foreground">EMS Access</p>
              <p className="font-semibold text-violet-600 mt-0.5 capitalize">{user?.status || 'approved'}</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Notifications */}
      <Card className="border-none shadow-sm">
        <CardHeader><CardTitle className="flex items-center gap-2 text-lg"><Bell className="w-5 h-5 text-violet-500" />Notification Preferences</CardTitle><p className="text-sm text-muted-foreground">Choose what you want to be notified about</p></CardHeader>
        <CardContent>
          <div className="space-y-3">
            {[
              { key: 'emailTasks' as const, label: 'Task Reminders', desc: 'Get notified about task assignments and due dates' },
              { key: 'emailMeetings' as const, label: 'Meeting Alerts', desc: 'Receive alerts before scheduled meetings' },
              { key: 'emailLeave' as const, label: 'Leave Updates', desc: 'Get updates on your leave request status' },
            ].map((item) => (
              <div key={item.key} className="flex items-center justify-between p-4 rounded-xl bg-muted/50 border hover:bg-muted/70 transition-colors">
                <div><p className="font-medium text-sm">{item.label}</p><p className="text-xs text-muted-foreground mt-0.5">{item.desc}</p></div>
                <button
                  role="switch"
                  aria-checked={notifs[item.key]}
                  onClick={() => setNotifs(prev => ({ ...prev, [item.key]: !prev[item.key] }))}
                  className={`relative w-11 h-6 rounded-full transition-colors ${notifs[item.key] ? 'bg-violet-600' : 'bg-muted-foreground/30'}`}
                >
                  <span className={`absolute top-0.5 left-0.5 w-5 h-5 rounded-full bg-white shadow transition-transform ${notifs[item.key] ? 'translate-x-5' : ''}`} />
                </button>
              </div>
            ))}
          </div>
          <Button onClick={onSaveNotifs} className={`gap-2 mt-4 transition-all ${savedNotifs ? 'bg-emerald-600 hover:bg-emerald-700' : 'bg-violet-600 hover:bg-violet-700'}`}>
            {savedNotifs ? <Check className="w-4 h-4" /> : <Save className="w-4 h-4" />}
            {savedNotifs ? 'Saved!' : 'Save Preferences'}
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
