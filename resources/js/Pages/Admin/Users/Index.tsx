import AppLayout from '@/Layouts/AppLayout';
import { Head, router } from '@inertiajs/react';
import { PageProps } from '@/types';
import {
    Shield, ShieldOff, Trash2, Search, Users, AlertTriangle, UserCheck, UserX
} from 'lucide-react';
import { useState } from 'react';
import toast, { Toaster } from 'react-hot-toast';

interface User {
    id: number;
    name: string;
    email: string;
    role: 'ADMIN' | 'USER';
    status: 'ACTIVE' | 'SUSPENDED';
    transactions_count: number;
    wallets_count: number;
    created_at: string;
}

export default function AdminUsers({ auth, users, filters }: PageProps<{ users: { data: User[] }; filters: any }>) {
    const [search, setSearch] = useState(filters?.search || '');
    const [deleteId, setDeleteId] = useState<number | null>(null);
    const [deleteUser, setDeleteUser] = useState<User | null>(null);

    const handleSearch = (e: React.FormEvent) => {
        e.preventDefault();
        router.get(route('admin.users.index'), { search }, { preserveState: true });
    };

    const handleSuspend = (user: User) => {
        router.post(route('admin.users.suspend', user.id), {}, {
            onSuccess: () => toast.success(user.status === 'ACTIVE' ? `${user.name} di-suspend` : `${user.name} diaktifkan`)
        });
    };

    const handleDelete = (user: User) => {
        setDeleteUser(user);
        setDeleteId(user.id);
    };

    return (
        <>
            <Head title="Admin - Users" />
            <Toaster position="top-right" />

            <div className="space-y-6 animate-fade-in-up">
                {/* Search */}
                <form onSubmit={handleSearch} className="glass-card rounded-2xl p-4 flex gap-3 items-center">
                    <div className="relative flex-1">
                        <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                        <input type="text" value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Cari user..."
                            className="w-full pl-10 pr-4 py-2.5 border border-slate-200 dark:border-slate-700/50 rounded-2xl text-sm focus:ring-2 focus:ring-indigo-500 outline-none font-medium text-slate-900 dark:text-white bg-slate-50 dark:bg-slate-900/50"
                        />
                    </div>
                    <button type="submit" className="px-5 py-2.5 bg-gradient-to-r from-indigo-600 to-violet-600 text-white rounded-2xl text-sm font-bold hover:shadow-lg hover:shadow-indigo-500/30 transition-all hover:scale-105 active:scale-95">
                        Cari
                    </button>
                </form>

                {/* User Cards */}
                <div className="space-y-3">
                    {users.data.length > 0 ? users.data.map((user, idx) => (
                        <div key={user.id} className="glass-card rounded-2xl p-4 flex flex-col sm:flex-row sm:items-center justify-between group hover:shadow-lg transition-all duration-300 animate-fade-in-up" style={{ animationDelay: `${idx * 50}ms` }}>
                            <div className="flex items-center gap-4 flex-1 min-w-0">
                                <div className={`w-11 h-11 rounded-2xl flex items-center justify-center text-white font-bold text-sm shrink-0 ${user.role === 'ADMIN' ? 'bg-gradient-to-br from-violet-500 to-purple-600' : 'bg-gradient-to-br from-slate-400 to-slate-500'}`}>
                                    {user.name.charAt(0).toUpperCase()}
                                </div>
                                <div className="flex-1 min-w-0">
                                    <div className="flex items-center gap-2 flex-wrap">
                                        <p className="text-sm font-bold text-slate-800 dark:text-white">{user.name}</p>
                                        <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${user.role === 'ADMIN' ? 'bg-violet-100 text-violet-700 dark:bg-violet-900/30 dark:text-violet-400' : 'bg-slate-100 text-slate-500 dark:bg-slate-800 dark:text-slate-400'}`}>
                                            {user.role}
                                        </span>
                                        <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full flex items-center gap-0.5 ${user.status === 'ACTIVE' ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400' : 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400'}`}>
                                            {user.status === 'ACTIVE' ? <UserCheck className="w-3 h-3" /> : <UserX className="w-3 h-3" />}
                                            {user.status === 'ACTIVE' ? 'Aktif' : 'Suspended'}
                                        </span>
                                    </div>
                                    <p className="text-[10px] text-slate-400 mt-0.5">{user.email}</p>
                                    <div className="flex items-center gap-3 mt-1">
                                        <span className="text-[10px] text-slate-400">{user.transactions_count} transaksi</span>
                                        <span className="text-[10px] text-slate-400">{user.wallets_count} dompet</span>
                                        <span className="text-[10px] text-slate-400">Bergabung: {new Date(user.created_at).toLocaleDateString('id-ID')}</span>
                                    </div>
                                </div>
                            </div>

                            {/* Actions */}
                            {user.role !== 'ADMIN' && (
                                <div className="flex items-center gap-2 mt-3 sm:mt-0 opacity-100 sm:opacity-0 group-hover:opacity-100 transition-opacity shrink-0">
                                    <button
                                        onClick={() => handleSuspend(user)}
                                        className={`flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-bold transition-all hover:scale-105 active:scale-95 ${user.status === 'ACTIVE'
                                            ? 'text-amber-700 bg-amber-100 dark:bg-amber-900/30 dark:text-amber-400 hover:shadow-amber-500/20 hover:shadow-lg'
                                            : 'text-emerald-700 bg-emerald-100 dark:bg-emerald-900/30 dark:text-emerald-400 hover:shadow-emerald-500/20 hover:shadow-lg'
                                            }`}
                                    >
                                        {user.status === 'ACTIVE' ? <><ShieldOff className="w-3.5 h-3.5" /> Suspend</> : <><Shield className="w-3.5 h-3.5" /> Aktifkan</>}
                                    </button>
                                    <button
                                        onClick={() => handleDelete(user)}
                                        className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-bold text-red-700 bg-red-100 dark:bg-red-900/30 dark:text-red-400 transition-all hover:scale-105 active:scale-95 hover:shadow-lg hover:shadow-red-500/20"
                                    >
                                        <Trash2 className="w-3.5 h-3.5" /> Hapus
                                    </button>
                                </div>
                            )}
                        </div>
                    )) : (
                        <div className="glass-card rounded-[2rem] p-16 text-center">
                            <Users className="w-16 h-16 text-slate-200 dark:text-slate-700 mx-auto mb-4" />
                            <p className="text-lg font-bold text-slate-400">Tidak ada user ditemukan</p>
                        </div>
                    )}
                </div>
            </div>

            {/* Delete Modal */}
            {deleteId && deleteUser && (
                <div className="fixed inset-0 z-[1000] flex items-center justify-center p-4 animate-fade-in">
                    <div className="absolute inset-0 bg-slate-950/70 backdrop-blur-sm" onClick={() => setDeleteId(null)} />
                    <div className="relative w-full max-w-sm bg-white dark:bg-slate-900 rounded-[2rem] p-6 shadow-2xl animate-pop-in border border-slate-100 dark:border-slate-800">
                        <div className="w-14 h-14 rounded-full bg-red-100 dark:bg-red-900/30 flex items-center justify-center text-red-600 mb-4 mx-auto"><AlertTriangle className="w-7 h-7" /></div>
                        <h3 className="text-xl font-bold text-center text-slate-900 dark:text-white mb-2">Hapus User?</h3>
                        <p className="text-sm text-center text-slate-500 mb-6 px-4">
                            Hapus <strong>{deleteUser.name}</strong>? Semua data user akan hilang permanen.
                        </p>
                        <div className="flex gap-3">
                            <button onClick={() => setDeleteId(null)} className="flex-1 py-3 rounded-xl font-bold text-slate-600 bg-slate-100 dark:bg-slate-800 dark:text-slate-300">Batal</button>
                            <button onClick={() => { router.delete(route('admin.users.destroy', deleteId), { onSuccess: () => toast.success('User dihapus!') }); setDeleteId(null); }} className="flex-1 py-3 rounded-xl font-bold text-white bg-red-600 shadow-lg shadow-red-500/30">Ya, Hapus</button>
                        </div>
                    </div>
                </div>
            )}
        </>
    );
}

AdminUsers.layout = (page: any) => (
    <AppLayout header={
        <div className="flex flex-col">
            <h1 className="text-2xl font-bold text-slate-800 dark:text-white tracking-tight">Manajemen User</h1>
            <p className="text-xs text-slate-500 dark:text-slate-400 font-medium mt-0.5">Kelola pengguna aplikasi</p>
        </div>
    }>
        {page}
    </AppLayout>
);
