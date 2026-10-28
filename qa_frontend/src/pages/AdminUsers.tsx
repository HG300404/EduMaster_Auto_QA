import { useState, useMemo, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Shield, Trash2, Search, X, Users, AlertTriangle } from 'lucide-react';
import { Button, Card, CardContent, Table } from '@heroui/react';
import { api } from '../api';
import type { User } from '../api';

export default function AdminUsers() {
  const queryClient = useQueryClient();
  const [searchTerm, setSearchTerm] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [userToDelete, setUserToDelete] = useState<User | null>(null);
  const [userToUpdateRole, setUserToUpdateRole] = useState<User | null>(null);
  const [newRole, setNewRole] = useState<'admin' | 'user'>('user');

  // Debounce search input
  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedSearch(searchTerm);
    }, 300);
    return () => clearTimeout(handler);
  }, [searchTerm]);

  // Load all users
  const { data: users, isLoading } = useQuery({
    queryKey: ['admin_users'],
    queryFn: () => api.getUsers(),
    placeholderData: [],
  });

  // Update user role mutation
  const updateRoleMutation = useMutation({
    mutationFn: ({ userId, role }: { userId: number; role: string }) => api.updateUserRole(userId, role),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin_users'] });
      setUserToUpdateRole(null);
    },
    onError: (err: any) => {
      const errMsg = err.response?.data?.detail || 'Failed to update user role';
      alert(errMsg);
    }
  });

  // Delete user mutation
  const deleteUserMutation = useMutation({
    mutationFn: (userId: number) => api.deleteUser(userId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin_users'] });
      setUserToDelete(null);
    },
    onError: (err: any) => {
      const errMsg = err.response?.data?.detail || 'Failed to delete user';
      alert(errMsg);
    }
  });

  const handleUpdateRole = () => {
    if (!userToUpdateRole) return;
    updateRoleMutation.mutate({ userId: userToUpdateRole.id, role: newRole });
  };

  const handleDeleteUser = () => {
    if (!userToDelete) return;
    deleteUserMutation.mutate(userToDelete.id);
  };

  // Filtered users list
  const filteredUsers = useMemo(() => {
    return (users || []).filter(u => 
      u.email.toLowerCase().includes(debouncedSearch.toLowerCase()) ||
      (u.full_name && u.full_name.toLowerCase().includes(debouncedSearch.toLowerCase()))
    );
  }, [users, debouncedSearch]);

  const formatDate = (isoDate: string) => {
    const date = new Date(isoDate);
    return date.toLocaleString(undefined, {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  return (
    <div className="space-y-6 font-sans">
      {/* PAGE HEADER */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h2 className="text-2xl font-bold text-[#1F1F1F]">User Management</h2>
          <span className="text-xs text-[#595959] font-semibold">Inspect and configure credentials or privilege roles</span>
        </div>
      </div>

      {/* METRIC CARDS */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card className="border border-[#EDEDED] shadow-xs rounded-xl bg-white">
          <CardContent className="p-4 flex items-center justify-between">
            <div>
              <span className="text-[10px] font-bold text-[#8C8C8C] uppercase block">TOTAL USERS</span>
              <span className="text-xl font-bold text-[#1F1F1F] block mt-1">{(users || []).length}</span>
            </div>
            <div className="w-10 h-10 rounded-lg bg-[#E6F4FF] flex items-center justify-center text-[#1677FF]">
              <Users size={20} />
            </div>
          </CardContent>
        </Card>

        <Card className="border border-[#EDEDED] shadow-xs rounded-xl bg-white">
          <CardContent className="p-4 flex items-center justify-between">
            <div>
              <span className="text-[10px] font-bold text-[#8C8C8C] uppercase block">ADMINISTRATORS</span>
              <span className="text-xl font-bold text-[#1677FF] block mt-1">
                {(users || []).filter(u => u.role === 'admin').length}
              </span>
            </div>
            <div className="w-10 h-10 rounded-lg bg-[#E6F4FF] flex items-center justify-center text-[#1677FF]">
              <Shield size={20} />
            </div>
          </CardContent>
        </Card>

        <Card className="border border-[#EDEDED] shadow-xs rounded-xl bg-white">
          <CardContent className="p-4 flex items-center justify-between">
            <div>
              <span className="text-[10px] font-bold text-[#8C8C8C] uppercase block">STANDARD USERS</span>
              <span className="text-xl font-bold text-[#52C41A] block mt-1">
                {(users || []).filter(u => u.role !== 'admin').length}
              </span>
            </div>
            <div className="w-10 h-10 rounded-lg bg-green-50 flex items-center justify-center text-[#52C41A]">
              <Users size={20} />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* FILTER CONTROLS */}
      <Card className="border border-[#EDEDED] shadow-xs rounded-xl bg-white">
        <CardContent className="p-4 flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="relative w-full md:w-80">
            <input
              placeholder="Search by name or email..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-9 pr-4 py-2 border border-[#EDEDED] rounded-lg text-xs font-semibold placeholder:text-[#BFBFBF] focus:outline-none focus:border-[#1677FF] transition-all bg-white"
            />
            <Search size={14} className="text-[#8C8C8C] absolute left-3 top-3.5" />
          </div>
        </CardContent>
      </Card>

      {/* USERS TABLE */}
      <Card className="border border-[#EDEDED] shadow-xs rounded-xl bg-white overflow-hidden">
        <CardContent className="p-0">
          {isLoading ? (
            <div className="flex flex-col items-center justify-center p-12 space-y-2">
              <span className="w-5 h-5 border-2 border-[#1677FF]/30 border-t-[#1677FF] rounded-full animate-spin" />
              <span className="text-xs font-semibold text-[#8C8C8C]">Loading system accounts...</span>
            </div>
          ) : filteredUsers.length === 0 ? (
            <div className="flex flex-col items-center justify-center p-16 space-y-3">
              <Users size={40} className="text-[#8C8C8C] stroke-[1.5]" />
              <div className="text-center">
                <span className="text-sm font-bold text-[#1F1F1F] block">No user accounts found</span>
                <span className="text-xs text-[#8C8C8C] font-semibold block mt-0.5">Try refining your search keyword</span>
              </div>
            </div>
          ) : (
            <Table aria-label="System Users" className="font-sans border-none shadow-none">
              <Table.ScrollContainer>
                <Table.Content>
                  <Table.Header>
                    <Table.Column className="bg-[#FAFAFA] text-xs font-black text-[#595959] py-3.5 px-6 border-b border-[#EDEDED]" isRowHeader>ID</Table.Column>
                    <Table.Column className="bg-[#FAFAFA] text-xs font-black text-[#595959] py-3.5 px-6 border-b border-[#EDEDED]">Full Name</Table.Column>
                    <Table.Column className="bg-[#FAFAFA] text-xs font-black text-[#595959] py-3.5 px-6 border-b border-[#EDEDED]">Email Address</Table.Column>
                    <Table.Column className="bg-[#FAFAFA] text-xs font-black text-[#595959] py-3.5 px-6 border-b border-[#EDEDED]">Role Status</Table.Column>
                    <Table.Column className="bg-[#FAFAFA] text-xs font-black text-[#595959] py-3.5 px-6 border-b border-[#EDEDED]">Registered At</Table.Column>
                    <Table.Column className="bg-[#FAFAFA] text-xs font-black text-[#595959] py-3.5 px-6 border-b border-[#EDEDED] text-center">Actions</Table.Column>
                  </Table.Header>
                  <Table.Body items={filteredUsers}>
                    {(u) => (
                      <Table.Row key={u.id} className="border-b border-[#F0F0F0] hover:bg-[#FAFAFA]/70 transition-colors">
                        <Table.Cell className="py-4 px-6 text-xs text-[#595959] font-bold">#{u.id}</Table.Cell>
                        <Table.Cell className="py-4 px-6 text-xs text-[#1F1F1F] font-bold">{u.full_name || 'N/A'}</Table.Cell>
                        <Table.Cell className="py-4 px-6 text-xs text-[#595959] font-medium">{u.email}</Table.Cell>
                        <Table.Cell className="py-4 px-6">
                          <span className={`px-2.5 py-1 text-[10px] font-extrabold tracking-wider uppercase rounded-full ${u.role === 'admin' ? 'bg-[#E6F4FF] text-[#1677FF]' : 'bg-green-50 text-[#52C41A]'}`}>
                            {u.role}
                          </span>
                        </Table.Cell>
                        <Table.Cell className="py-4 px-6 text-xs text-[#8C8C8C] font-semibold">{formatDate(u.created_at)}</Table.Cell>
                        <Table.Cell className="py-4 px-6 text-center">
                          <div className="flex items-center justify-center gap-2">
                            <Button
                              className="bg-white border border-[#EDEDED] text-zinc-600 font-bold text-xs h-8 px-2.5 rounded-md hover:bg-[#F5F7FA] transition-colors flex items-center gap-1"
                              onClick={() => {
                                setUserToUpdateRole(u);
                                setNewRole(u.role as any);
                              }}
                            >
                              <Shield size={12} />
                              <span>Change Role</span>
                            </Button>
                            <Button
                              className="bg-white border border-red-200 text-red-600 font-bold text-xs h-8 px-2.5 rounded-md hover:bg-red-50 transition-colors flex items-center gap-1"
                              onClick={() => setUserToDelete(u)}
                            >
                              <Trash2 size={12} />
                              <span>Delete</span>
                            </Button>
                          </div>
                        </Table.Cell>
                      </Table.Row>
                    )}
                  </Table.Body>
                </Table.Content>
              </Table.ScrollContainer>
            </Table>
          )}
        </CardContent>
      </Card>

      {/* CHANGE ROLE DIALOG */}
      {userToUpdateRole && (
        <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center animate-fade-in p-4 backdrop-blur-xs">
          <div className="bg-white rounded-xl shadow-xl max-w-sm w-full p-6 relative border border-[#EDEDED] font-sans">
            <button 
              onClick={() => setUserToUpdateRole(null)}
              className="absolute top-4 right-4 text-[#8C8C8C] hover:text-[#1F1F1F] transition-colors"
            >
              <X size={18} />
            </button>
            <div className="mb-4">
              <h3 className="text-[#1F1F1F] font-bold text-lg">Change User Role</h3>
              <span className="text-xs text-[#8C8C8C] font-semibold">Assign new authorization tier for {userToUpdateRole.email}</span>
            </div>
            <div className="space-y-4 py-2">
              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-bold text-[#8C8C8C]">SELECT ROLE</label>
                <select
                  value={newRole}
                  onChange={(e) => setNewRole(e.target.value as any)}
                  className="w-full border border-[#EDEDED] rounded-lg px-3 py-2 text-xs font-semibold focus:outline-none focus:border-[#1677FF] bg-white text-[#1F1F1F]"
                >
                  <option value="user">User (Standard Access)</option>
                  <option value="admin">Admin (Full System Access)</option>
                </select>
              </div>
            </div>
            <div className="flex justify-end gap-3 pt-4 border-t border-[#F0F0F0] mt-4">
              <button 
                onClick={() => setUserToUpdateRole(null)}
                className="font-bold text-xs h-9 px-4 bg-zinc-100 text-zinc-600 rounded-md transition-colors"
              >
                Cancel
              </button>
              <button 
                className="bg-[#1677FF] text-white font-bold text-xs h-9 px-4 rounded-md flex items-center justify-center gap-1.5 disabled:opacity-50"
                onClick={handleUpdateRole}
                disabled={updateRoleMutation.isPending}
              >
                {updateRoleMutation.isPending && (
                  <span className="w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                )}
                <span>Save Role</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* DELETE CONFIRMATION DIALOG */}
      {userToDelete && (
        <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center animate-fade-in p-4 backdrop-blur-xs">
          <div className="bg-white rounded-xl shadow-xl max-w-sm w-full p-6 relative border border-red-100 font-sans">
            <button 
              onClick={() => setUserToDelete(null)}
              className="absolute top-4 right-4 text-[#8C8C8C] hover:text-[#1F1F1F] transition-colors"
            >
              <X size={18} />
            </button>
            <div className="flex items-start gap-3 mb-4">
              <div className="w-10 h-10 rounded-full bg-red-50 text-red-500 flex items-center justify-center flex-shrink-0">
                <AlertTriangle size={20} />
              </div>
              <div>
                <h3 className="text-[#1F1F1F] font-bold text-lg">Delete User Account</h3>
                <span className="text-xs text-red-500 font-bold block mt-1">Warning: This action is permanent and cannot be undone.</span>
              </div>
            </div>
            <p className="text-xs text-[#595959] font-medium leading-relaxed mb-4">
              Are you sure you want to permanently delete the account for <strong className="text-[#1F1F1F]">{userToDelete.email}</strong>? All their execution histories associated with this user will be orphaned.
            </p>
            <div className="flex justify-end gap-3 pt-4 border-t border-[#F0F0F0]">
              <button 
                onClick={() => setUserToDelete(null)}
                className="font-bold text-xs h-9 px-4 bg-zinc-100 text-zinc-600 rounded-md transition-colors"
              >
                Cancel
              </button>
              <button 
                className="bg-red-600 text-white font-bold text-xs h-9 px-4 rounded-md flex items-center justify-center gap-1.5 disabled:opacity-50"
                onClick={handleDeleteUser}
                disabled={deleteUserMutation.isPending}
              >
                {deleteUserMutation.isPending && (
                  <span className="w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                )}
                <span>Delete Account</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
