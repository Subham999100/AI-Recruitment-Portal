import { FormEvent, useEffect, useState } from 'react';
import { Check, RefreshCw, ShieldCheck, X } from 'lucide-react';
import { adminService, AdminUser } from '../services/adminService';

export default function Admin() {
  const [users, setUsers] = useState<AdminUser[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');
  const [newUser, setNewUser] = useState({ name: '', email: '', password: '' });

  const loadUsers = async () => {
    setIsLoading(true);
    setError('');
    try {
      setUsers(await adminService.listUsers());
    } catch {
      setError('Unable to load registration requests.');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadUsers();
  }, []);

  const updateStatus = async (user: AdminUser, action: 'approve' | 'reject') => {
    try {
      await adminService[action](user.id);
      await loadUsers();
    } catch {
      setError('The user status could not be updated.');
    }
  };

  const createUser = async (event: FormEvent) => {
    event.preventDefault();
    try {
      await adminService.create(newUser);
      setNewUser({ name: '', email: '', password: '' });
      await loadUsers();
    } catch (createError: any) {
      setError(createError?.response?.data?.detail || 'The user could not be created.');
    }
  };

  const removeUser = async (user: AdminUser) => {
    if (!window.confirm(`Remove ${user.email}?`)) return;
    await adminService.remove(user.id);
    await loadUsers();
  };

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-xs uppercase tracking-[0.2em] text-purple-300">Administrator</p>
          <h1 className="mt-2 text-3xl font-extrabold text-white">Registration Requests</h1>
          <p className="mt-2 text-sm text-gray-400">Review employee access before they enter the recruitment workspace.</p>
        </div>
        <button onClick={loadUsers} className="inline-flex items-center gap-2 rounded-xl border border-white/10 px-4 py-2 text-sm text-gray-300 hover:bg-white/5">
          <RefreshCw className="h-4 w-4" /> Refresh
        </button>
      </div>

      {error && <div className="rounded-xl border border-red-400/30 bg-red-500/10 p-4 text-sm text-red-300">{error}</div>}

      <form onSubmit={createUser} className="grid gap-3 rounded-2xl border border-white/10 bg-[rgba(17,10,27,0.75)] p-6 md:grid-cols-4">
        <input required placeholder="Full name" value={newUser.name} onChange={(event) => setNewUser({ ...newUser, name: event.target.value })} className="rounded-lg border border-white/10 bg-black/20 px-3 py-2 text-sm text-white" />
        <input required type="email" placeholder="Email" value={newUser.email} onChange={(event) => setNewUser({ ...newUser, email: event.target.value })} className="rounded-lg border border-white/10 bg-black/20 px-3 py-2 text-sm text-white" />
        <input required minLength={8} type="password" placeholder="Temporary password" value={newUser.password} onChange={(event) => setNewUser({ ...newUser, password: event.target.value })} className="rounded-lg border border-white/10 bg-black/20 px-3 py-2 text-sm text-white" />
        <button type="submit" className="rounded-lg bg-purple-500/25 px-4 py-2 text-sm font-semibold text-purple-200 hover:bg-purple-500/40">Add approved employee</button>
      </form>

      <div className="overflow-hidden rounded-2xl border border-white/10 bg-[rgba(17,10,27,0.75)]">
        <div className="border-b border-white/10 px-6 py-4 text-sm font-semibold text-white">Pending Employee Requests</div>
        {isLoading ? (
          <div className="p-8 text-sm text-gray-400">Loading requests...</div>
        ) : users.length === 0 ? (
          <div className="p-8 text-sm text-gray-400">No registration requests yet.</div>
        ) : (
          <div className="divide-y divide-white/10">
            {users.map((user) => (
              <div key={user.id} className="flex flex-wrap items-center justify-between gap-4 px-6 py-5">
                <div>
                  <p className="font-semibold text-white">{user.name}</p>
                  <p className="text-sm text-gray-400">{user.email}</p>
                  <p className="mt-1 text-xs text-gray-500">Registered {new Date(user.created_at).toLocaleString()}</p>
                </div>
                <div className="flex items-center gap-3">
                  <span className={`rounded-full border px-3 py-1 text-xs font-semibold ${user.status === 'PENDING' ? 'border-amber-400/30 text-amber-300' : user.status === 'APPROVED' ? 'border-emerald-400/30 text-emerald-300' : 'border-red-400/30 text-red-300'}`}>
                    {user.status}
                  </span>
                  {user.status === 'PENDING' && (
                    <>
                      <button onClick={() => updateStatus(user, 'approve')} className="inline-flex items-center gap-1 rounded-lg bg-emerald-500/15 px-3 py-2 text-sm text-emerald-300 hover:bg-emerald-500/25">
                        <Check className="h-4 w-4" /> Accept
                      </button>
                      <button onClick={() => updateStatus(user, 'reject')} className="inline-flex items-center gap-1 rounded-lg bg-red-500/15 px-3 py-2 text-sm text-red-300 hover:bg-red-500/25">
                        <X className="h-4 w-4" /> Reject
                      </button>
                    </>
                  )}
                  {user.role === 'EMPLOYEE' && <button onClick={() => removeUser(user)} className="inline-flex items-center gap-1 rounded-lg bg-red-500/15 px-3 py-2 text-sm text-red-300 hover:bg-red-500/25">Remove</button>}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      <div className="flex items-center gap-2 text-xs text-gray-500">
        <ShieldCheck className="h-4 w-4 text-purple-300" /> Only administrators can change account status.
      </div>
    </div>
  );
}
