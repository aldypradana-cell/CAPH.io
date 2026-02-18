import AppLayout from '@/Layouts/AppLayout';
import { PageProps } from '@/types';
import { Head, useForm, usePage, Link } from '@inertiajs/react';
import { FormEventHandler, useRef, useState } from 'react';
import { User, Lock, Trash2, Shield, Mail, AlertTriangle, X, Eye, EyeOff, Check } from 'lucide-react';
import toast, { Toaster } from 'react-hot-toast';

export default function Edit({
    mustVerifyEmail,
    status,
}: PageProps<{ mustVerifyEmail: boolean; status?: string }>) {
    const user = usePage().props.auth.user;

    // Profile form
    const profileForm = useForm({
        name: user.name,
        email: user.email,
    });

    const submitProfile: FormEventHandler = (e) => {
        e.preventDefault();
        profileForm.patch(route('profile.update'), {
            onSuccess: () => toast.success('Profil berhasil diperbarui!'),
        });
    };

    // Password form
    const passwordInput = useRef<HTMLInputElement>(null);
    const currentPasswordInput = useRef<HTMLInputElement>(null);
    const [showCurrentPw, setShowCurrentPw] = useState(false);
    const [showNewPw, setShowNewPw] = useState(false);

    const passwordForm = useForm({
        current_password: '',
        password: '',
        password_confirmation: '',
    });

    const updatePassword: FormEventHandler = (e) => {
        e.preventDefault();
        passwordForm.put(route('password.update'), {
            preserveScroll: true,
            onSuccess: () => { passwordForm.reset(); toast.success('Password berhasil diubah!'); },
            onError: (errors) => {
                if (errors.password) { passwordForm.reset('password', 'password_confirmation'); passwordInput.current?.focus(); }
                if (errors.current_password) { passwordForm.reset('current_password'); currentPasswordInput.current?.focus(); }
            },
        });
    };

    // Delete form
    const [confirmingDeletion, setConfirmingDeletion] = useState(false);
    const deletePasswordInput = useRef<HTMLInputElement>(null);
    const deleteForm = useForm({ password: '' });

    const deleteUser: FormEventHandler = (e) => {
        e.preventDefault();
        deleteForm.delete(route('profile.destroy'), {
            preserveScroll: true,
            onSuccess: () => setConfirmingDeletion(false),
            onError: () => deletePasswordInput.current?.focus(),
            onFinish: () => deleteForm.reset(),
        });
    };

    const inputClass = "w-full px-4 py-3 border border-slate-200 dark:border-slate-700/50 rounded-2xl text-sm focus:ring-2 focus:ring-indigo-500 outline-none font-medium text-slate-900 dark:text-white bg-slate-50 dark:bg-slate-900/50 transition-all";

    return (

        <>
            <Head title="Profil" />
            <Toaster position="top-right" />

            <div className="max-w-2xl mx-auto space-y-6 animate-fade-in-up">
                {/* User Avatar Card */}
                <div className="glass-card rounded-[2rem] p-8 text-center relative overflow-hidden animate-pop-in">
                    <div className="absolute top-0 left-0 w-full h-32 bg-gradient-to-br from-indigo-500 via-purple-500 to-pink-500 opacity-20" />
                    <div className="relative z-10">
                        <div className="w-20 h-20 rounded-full bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center text-white text-3xl font-bold mx-auto mb-4 shadow-xl shadow-indigo-500/30">
                            {user.name.charAt(0).toUpperCase()}
                        </div>
                        <h2 className="text-xl font-bold text-slate-800 dark:text-white">{user.name}</h2>
                        <p className="text-sm text-slate-400 flex items-center justify-center gap-1 mt-1">
                            <Mail className="w-3.5 h-3.5" /> {user.email}
                        </p>
                    </div>
                </div>

                {/* Profile Information */}
                <div className="glass-card rounded-[2rem] p-6 animate-fade-in-up" style={{ animationDelay: '100ms' }}>
                    <div className="flex items-center gap-3 mb-5">
                        <div className="w-10 h-10 rounded-xl bg-indigo-100 dark:bg-indigo-900/30 flex items-center justify-center text-indigo-600">
                            <User className="w-5 h-5" />
                        </div>
                        <div>
                            <h3 className="text-base font-bold text-slate-800 dark:text-white">Informasi Profil</h3>
                            <p className="text-[10px] text-slate-400">Perbarui nama dan email akun Anda</p>
                        </div>
                    </div>
                    <form onSubmit={submitProfile} className="space-y-4">
                        <div>
                            <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block mb-1 ml-1">Nama</label>
                            <input type="text" required value={profileForm.data.name} onChange={(e) => profileForm.setData('name', e.target.value)} className={inputClass} />
                            {profileForm.errors.name && <p className="text-xs text-red-500 mt-1 ml-1">{profileForm.errors.name}</p>}
                        </div>
                        <div>
                            <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block mb-1 ml-1">Email</label>
                            <input type="email" required value={profileForm.data.email} onChange={(e) => profileForm.setData('email', e.target.value)} className={inputClass} />
                            {profileForm.errors.email && <p className="text-xs text-red-500 mt-1 ml-1">{profileForm.errors.email}</p>}
                        </div>

                        {mustVerifyEmail && user.email_verified_at === null && (
                            <div className="bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800/30 rounded-2xl p-4">
                                <p className="text-sm text-amber-700 dark:text-amber-400">
                                    Email belum terverifikasi.{' '}
                                    <Link href={route('verification.send')} method="post" as="button" className="underline font-bold hover:text-amber-900 dark:hover:text-amber-300">
                                        Kirim ulang link verifikasi
                                    </Link>
                                </p>
                                {status === 'verification-link-sent' && (
                                    <p className="text-sm font-bold text-emerald-600 mt-2 flex items-center gap-1"><Check className="w-4 h-4" /> Link verifikasi baru telah dikirim!</p>
                                )}
                            </div>
                        )}

                        <div className="flex items-center gap-3 pt-2">
                            <button type="submit" disabled={profileForm.processing} className="px-6 py-3 bg-gradient-to-r from-indigo-600 to-violet-600 text-white rounded-2xl text-sm font-bold hover:shadow-lg hover:shadow-indigo-500/30 transition-all hover:scale-105 active:scale-95 disabled:opacity-50">
                                {profileForm.processing ? 'Menyimpan...' : 'Simpan'}
                            </button>
                            {profileForm.recentlySuccessful && (
                                <span className="text-sm text-emerald-600 font-medium flex items-center gap-1 animate-fade-in"><Check className="w-4 h-4" /> Tersimpan</span>
                            )}
                        </div>
                    </form>
                </div>

                {/* Update Password */}
                <div className="glass-card rounded-[2rem] p-6 animate-fade-in-up" style={{ animationDelay: '200ms' }}>
                    <div className="flex items-center gap-3 mb-5">
                        <div className="w-10 h-10 rounded-xl bg-emerald-100 dark:bg-emerald-900/30 flex items-center justify-center text-emerald-600">
                            <Lock className="w-5 h-5" />
                        </div>
                        <div>
                            <h3 className="text-base font-bold text-slate-800 dark:text-white">Ubah Password</h3>
                            <p className="text-[10px] text-slate-400">Gunakan password yang kuat dan unik</p>
                        </div>
                    </div>
                    <form onSubmit={updatePassword} className="space-y-4">
                        <div>
                            <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block mb-1 ml-1">Password Saat Ini</label>
                            <div className="relative">
                                <input type={showCurrentPw ? 'text' : 'password'} ref={currentPasswordInput} value={passwordForm.data.current_password} onChange={(e) => passwordForm.setData('current_password', e.target.value)} className={inputClass} />
                                <button type="button" onClick={() => setShowCurrentPw(!showCurrentPw)} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 p-1">
                                    {showCurrentPw ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                                </button>
                            </div>
                            {passwordForm.errors.current_password && <p className="text-xs text-red-500 mt-1 ml-1">{passwordForm.errors.current_password}</p>}
                        </div>
                        <div>
                            <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block mb-1 ml-1">Password Baru</label>
                            <div className="relative">
                                <input type={showNewPw ? 'text' : 'password'} ref={passwordInput} value={passwordForm.data.password} onChange={(e) => passwordForm.setData('password', e.target.value)} className={inputClass} />
                                <button type="button" onClick={() => setShowNewPw(!showNewPw)} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 p-1">
                                    {showNewPw ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                                </button>
                            </div>
                            {passwordForm.errors.password && <p className="text-xs text-red-500 mt-1 ml-1">{passwordForm.errors.password}</p>}
                        </div>
                        <div>
                            <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block mb-1 ml-1">Konfirmasi Password</label>
                            <input type="password" value={passwordForm.data.password_confirmation} onChange={(e) => passwordForm.setData('password_confirmation', e.target.value)} className={inputClass} />
                            {passwordForm.errors.password_confirmation && <p className="text-xs text-red-500 mt-1 ml-1">{passwordForm.errors.password_confirmation}</p>}
                        </div>
                        <div className="flex items-center gap-3 pt-2">
                            <button type="submit" disabled={passwordForm.processing} className="px-6 py-3 bg-gradient-to-r from-emerald-600 to-teal-600 text-white rounded-2xl text-sm font-bold hover:shadow-lg hover:shadow-emerald-500/30 transition-all hover:scale-105 active:scale-95 disabled:opacity-50">
                                {passwordForm.processing ? 'Menyimpan...' : 'Ubah Password'}
                            </button>
                            {passwordForm.recentlySuccessful && (
                                <span className="text-sm text-emerald-600 font-medium flex items-center gap-1 animate-fade-in"><Check className="w-4 h-4" /> Tersimpan</span>
                            )}
                        </div>
                    </form>
                </div>

                {/* Delete Account */}
                <div className="glass-card rounded-[2rem] p-6 border-red-200/30 dark:border-red-800/20 animate-fade-in-up" style={{ animationDelay: '300ms' }}>
                    <div className="flex items-center gap-3 mb-5">
                        <div className="w-10 h-10 rounded-xl bg-red-100 dark:bg-red-900/30 flex items-center justify-center text-red-600">
                            <Trash2 className="w-5 h-5" />
                        </div>
                        <div>
                            <h3 className="text-base font-bold text-slate-800 dark:text-white">Hapus Akun</h3>
                            <p className="text-[10px] text-slate-400">Akun Anda dan semua data akan dihapus permanen</p>
                        </div>
                    </div>
                    <p className="text-sm text-slate-500 mb-4">
                        Setelah akun dihapus, semua data dan resource akan hilang secara permanen. Pastikan Anda sudah mengunduh data yang ingin disimpan.
                    </p>
                    <button onClick={() => setConfirmingDeletion(true)} className="px-5 py-3 bg-red-600 text-white rounded-2xl text-sm font-bold hover:bg-red-700 hover:shadow-lg hover:shadow-red-500/30 transition-all hover:scale-105 active:scale-95">
                        <Trash2 className="w-4 h-4 inline mr-2" /> Hapus Akun Saya
                    </button>
                </div>
            </div>

            {/* Delete Confirmation Modal */}
            {confirmingDeletion && (
                <div className="fixed inset-0 z-[1000] flex items-center justify-center p-4 animate-fade-in">
                    <div className="absolute inset-0 bg-slate-950/70 backdrop-blur-sm" onClick={() => setConfirmingDeletion(false)} />
                    <div className="relative w-full max-w-sm bg-white dark:bg-slate-900 rounded-[2rem] shadow-2xl animate-pop-in border border-slate-100 dark:border-slate-800 overflow-hidden">
                        <div className="h-1.5 bg-gradient-to-r from-red-500 to-rose-600" />
                        <form onSubmit={deleteUser} className="p-6">
                            <div className="w-14 h-14 rounded-full bg-red-100 dark:bg-red-900/30 flex items-center justify-center text-red-600 mb-4 mx-auto">
                                <AlertTriangle className="w-7 h-7" />
                            </div>
                            <h3 className="text-xl font-bold text-center text-slate-900 dark:text-white mb-2">Hapus Akun?</h3>
                            <p className="text-sm text-center text-slate-500 mb-6">
                                Tindakan ini tidak dapat dibatalkan. Masukkan password untuk konfirmasi.
                            </p>

                            <div className="mb-4">
                                <input type="password" ref={deletePasswordInput} value={deleteForm.data.password}
                                    onChange={(e) => deleteForm.setData('password', e.target.value)}
                                    className={inputClass} placeholder="Masukkan password..."
                                />
                                {deleteForm.errors.password && <p className="text-xs text-red-500 mt-1 ml-1">{deleteForm.errors.password}</p>}
                            </div>

                            <div className="flex gap-3">
                                <button type="button" onClick={() => { setConfirmingDeletion(false); deleteForm.clearErrors(); deleteForm.reset(); }} className="flex-1 py-3 rounded-xl font-bold text-slate-600 bg-slate-100 dark:bg-slate-800 dark:text-slate-300">
                                    Batal
                                </button>
                                <button type="submit" disabled={deleteForm.processing} className="flex-1 py-3 rounded-xl font-bold text-white bg-red-600 shadow-lg shadow-red-500/30 disabled:opacity-50">
                                    {deleteForm.processing ? '...' : 'Ya, Hapus'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </>
    );
}

Edit.layout = (page: any) => (
    <AppLayout header={
        <div className="flex flex-col">
            <h1 className="text-2xl font-bold text-slate-800 dark:text-white tracking-tight">Profil Saya</h1>
            <p className="text-xs text-slate-500 dark:text-slate-400 font-medium mt-0.5">Kelola informasi akun Anda</p>
        </div>
    }>
        {page}
    </AppLayout>
);

