'use client';

import { useMemo, useState, useEffect, useCallback } from 'react';
import { ColumnDef } from '@tanstack/react-table';
import { Button } from '@/components/ui/button';
import { DataTable } from '@/components/DataTable';
import { StatusBadge, RoleBadge } from '@/components/StatusBadge';
import { TableToolbar } from '@/components/table/TableToolbar';
import { EmptyState } from '@/components/EmptyState';
import { Plus, Edit2, Trash2, Users, Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import axios from 'axios';
import { useEmsUser } from '@/components/providers/EmsProvider';
import { UserActionModal } from '@/components/users/UserActionModal';
import { ConfirmDialog } from '@/components/ConfirmDialog';

interface User {
  _id: string;
  ssoUserId: string;
  appRole: 'admin' | 'manager' | 'employee' | 'ceo' | 'intern';
  status: 'approved' | 'pending' | 'suspended' | 'rejected';
  department: string;
  createdAt: string;
  ssoDetails?: {
    name: string;
    email: string;
  };
}

export default function UsersPage() {
  const { user: currentUser } = useEmsUser();
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  
  // Modals state
  const [modalOpen, setModalOpen] = useState(false);
  const [editingUser, setEditingUser] = useState<User | null>(null);
  const [deletingUser, setDeletingUser] = useState<User | null>(null);

  const isAdmin = currentUser && ['admin', 'ceo'].includes(currentUser.appRole);

  const fetchUsers = useCallback(async () => {
    setLoading(true);
    try {
      const response = await axios.get('/api/users');
      setUsers(response.data);
    } catch (err) {
      toast.error('Failed to fetch users');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchUsers();
  }, [fetchUsers]);

  const handleFireUser = async () => {
    if (!deletingUser) return;
    try {
      await axios.delete(`/api/users/${deletingUser.ssoUserId}`);
      toast.error(`Employee ${deletingUser.ssoDetails?.name || deletingUser.ssoUserId} has been dismissed.`);
      fetchUsers();
      setDeletingUser(null);
    } catch (err: any) {
      toast.error(err.response?.data?.error || 'Failed to remove user');
    }
  };

  const columns = useMemo<ColumnDef<User>[]>(
    () => [
      {
        accessorKey: 'ssoDetails.name',
        header: 'Name',
        cell: (info) => {
          const name = (info.row.original.ssoDetails?.name) || `User ${info.row.original.ssoUserId}`;
          return (
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-full bg-gradient-to-br from-violet-500 to-purple-600 flex items-center justify-center text-xs font-bold text-white uppercase">
                {name.split(' ').map((n) => n[0]).join('')}
              </div>
              <span className="font-medium">{name}</span>
            </div>
          );
        },
      },
      {
        accessorKey: 'ssoDetails.email',
        header: 'Email',
        cell: (info) => <span className="text-muted-foreground">{info.getValue() as string || 'N/A'}</span>,
      },
      {
        accessorKey: 'department',
        header: 'Department',
        cell: (info) => <span className="text-muted-foreground">{info.getValue() as string}</span>,
      },
      {
        accessorKey: 'appRole',
        header: 'Role',
        cell: (info) => <RoleBadge role={info.getValue() as any} />,
      },
      {
        accessorKey: 'status',
        header: 'Status',
        cell: (info) => <StatusBadge status={info.getValue() as any} />,
      },
      {
        accessorKey: 'createdAt',
        header: 'Join Date',
        cell: (info) => (
          <span className="text-muted-foreground text-sm">
            {new Date(info.getValue() as string).toLocaleDateString()}
          </span>
        ),
      },
      {
        id: 'actions',
        header: 'Actions',
        cell: (info) => (
          <div className="flex gap-2">
            {isAdmin && (
              <>
                <Button 
                  variant="ghost" 
                  size="sm" 
                  className="text-muted-foreground hover:text-foreground" 
                  onClick={() => {
                    setEditingUser(info.row.original);
                    setModalOpen(true);
                  }}
                >
                  <Edit2 className="w-4 h-4" />
                </Button>
                <Button 
                  variant="ghost" 
                  size="sm" 
                  className="text-destructive hover:text-destructive/90" 
                  onClick={() => setDeletingUser(info.row.original)}
                >
                  <Trash2 className="w-4 h-4" />
                </Button>
              </>
            )}
          </div>
        ),
      },
    ],
    [isAdmin]
  );

  const filteredUsers = useMemo(
    () => users.filter((user) => {
      const name = user.ssoDetails?.name?.toLowerCase() || '';
      const email = user.ssoDetails?.email?.toLowerCase() || '';
      const dept = user.department?.toLowerCase() || '';
      const query = search.toLowerCase();
      return name.includes(query) || email.includes(query) || dept.includes(query);
    }),
    [users, search]
  );

  const handleExport = () => {
    const csv = [
      ['Name', 'Email', 'Department', 'Role', 'Status', 'Join Date'], 
      ...users.map((u) => [
        u.ssoDetails?.name || u.ssoUserId, 
        u.ssoDetails?.email || '', 
        u.department, 
        u.appRole, 
        u.status, 
        new Date(u.createdAt).toLocaleDateString()
      ])
    ].map((row) => row.join(',')).join('\n');
    
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'ems-users.csv';
    a.click();
    toast.success('Users exported successfully');
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-start md:items-center gap-4 flex-col md:flex-row">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Users Management</h1>
          <p className="text-muted-foreground mt-2">Manage {users.length} team members and their roles</p>
        </div>
        {isAdmin && (
          <Button 
            className="gap-2 w-full md:w-auto justify-center bg-violet-600 hover:bg-violet-700"
            onClick={() => {
              setEditingUser(null);
              setModalOpen(true);
            }}
          >
            <Plus className="w-4 h-4" />
            Add User
          </Button>
        )}
      </div>

      <TableToolbar 
        searchValue={search} 
        onSearchChange={setSearch} 
        onExport={handleExport} 
        selectedCount={0} 
        onBulkDelete={() => {}} 
        placeholder="Search by name, email, or department..." 
      />

      {loading ? (
        <div className="flex flex-col items-center justify-center py-20 gap-4">
          <Loader2 className="w-10 h-10 animate-spin text-violet-600" />
          <p className="text-muted-foreground font-medium">Loading workforce data...</p>
        </div>
      ) : filteredUsers.length > 0 ? (
        <DataTable columns={columns} data={filteredUsers} />
      ) : (
        <EmptyState 
          icon={<Users className="w-12 h-12" />} 
          title="No users found" 
          description={search ? 'Try adjusting your search criteria' : 'Get started by onboarding your first team member'} 
          actionLabel={isAdmin ? "Add User" : undefined}
          onAction={() => {
            setEditingUser(null);
            setModalOpen(true);
          }} 
        />
      )}

      <UserActionModal 
        open={modalOpen} 
        onOpenChange={setModalOpen} 
        onSuccess={fetchUsers} 
        user={editingUser} 
      />

      <ConfirmDialog
        open={!!deletingUser}
        title="Dismiss Employee?"
        description={`Are you sure you want to remove ${deletingUser?.ssoDetails?.name || 'this user'} from the EMS? This will revoke their access to internal company resources.`}
        confirmLabel="Dismiss"
        isDangerous={true}
        onConfirm={handleFireUser}
        onCancel={() => setDeletingUser(null)}
      />
    </div>
  );
}
