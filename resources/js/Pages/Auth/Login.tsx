import { Head, Link, useForm } from '@inertiajs/react';
import { FormEventHandler } from 'react';
import { Wallet, Eye, EyeOff } from 'lucide-react';
import { useState } from 'react';

export default function Login({
    status,
    canResetPassword,
}: {
    status?: string;
    canResetPassword: boolean;
}) {
    const { data, setData, post, processing, errors, reset } = useForm({
        email: '',
        password: '',
        remember: false as boolean,
    });

    const [showPassword, setShowPassword] = useState(false);

    const submit: FormEventHandler = (e) => {
        e.preventDefault();
        post(route('login'), {
            onFinish: () => reset('password'),
        });
    };

    return (
        <>
            <Head title="Login - CAPH.io" />
            <div className="min-h-screen flex items-center justify-center bg-slate-950 relative overflow-hidden px-4">
                {/* Animated Mesh Gradient Background */}
                <div className="absolute inset-0 overflow-hidden pointer-events-none">
                    {/* Orb 1 — Indigo (kiri atas), class dari app.css */}
                    <div className="login-orb-1 absolute -top-40 -left-40 w-[700px] h-[700px] rounded-full bg-indigo-700/30 blur-[120px]" />
                    {/* Orb 2 — Violet (kanan bawah) */}
                    <div className="login-orb-2 absolute top-1/2 -right-40 w-[600px] h-[600px] rounded-full bg-violet-600/25 blur-[100px]" />
                    {/* Orb 3 — Fuchsia (tengah bawah) */}
                    <div className="login-orb-3 absolute -bottom-40 left-1/3 w-[600px] h-[600px] rounded-full bg-fuchsia-500/15 blur-[120px]" />
                    {/* Grid overlay untuk premium look */}
                    <div className="absolute inset-0"
                        style={{
                            backgroundImage: `linear-gradient(rgba(255,255,255,0.02) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.02) 1px, transparent 1px)`,
                            backgroundSize: '60px 60px'
                        }}
                    />
                </div>


                {/* Login Container Centered */}
                <div className="w-full max-w-[420px] relative z-10 flex flex-col items-center">
                    
                    {/* Logo & Headline */}
                    <div className="flex flex-col items-center text-center mb-8">
                        <div className="w-16 h-16 bg-gradient-to-br from-indigo-500 to-violet-600 rounded-2xl flex items-center justify-center text-white shadow-2xl shadow-indigo-500/40 mb-5 relative group">
                            <div className="absolute inset-0 rounded-2xl bg-white/20 blur-md opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
                            <Wallet className="w-8 h-8 relative z-10" />
                        </div>
                        <h1 className="text-3xl font-bold tracking-tight text-white mb-1">CAPH.io</h1>
                        <p className="text-sm font-medium tracking-[0.2em] text-indigo-400 uppercase">
                            Capital And Personal Hub
                        </p>
                    </div>

                    {/* Form Card with Deep Glassmorphism & Inner Glow */}
                    <div className="w-full bg-slate-900/60 backdrop-blur-2xl rounded-3xl border border-white/10 shadow-[0_8px_32px_0_rgba(0,0,0,0.3)] relative overflow-hidden p-8">
                        {/* Shimmer/Glow Inner Border Effect */}
                        <div className="absolute inset-0 rounded-3xl pointer-events-none shadow-[inset_0_1px_1px_rgba(255,255,255,0.1)]"></div>
                        <div className="absolute top-0 inset-x-0 h-px w-1/2 mx-auto bg-gradient-to-r from-transparent via-indigo-500/50 to-transparent"></div>

                        <div className="text-center mb-8">
                            <h2 className="text-2xl font-bold text-white tracking-tight">Selamat Datang</h2>
                            <p className="text-slate-400 text-sm mt-2 font-medium">Rencanakan, catat, dan capai tujuanmu hari ini.</p>
                        </div>

                        {status && (
                            <div className="mb-4 p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-sm font-medium text-center shadow-inner">
                                {status}
                            </div>
                        )}

                        <form onSubmit={submit} className="space-y-5">
                            <div>
                                <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-2 ml-1 cursor-pointer" htmlFor="email">Email</label>
                                <input
                                    id="email"
                                    type="email"
                                    value={data.email}
                                    autoComplete="username"
                                    autoFocus
                                    onChange={(e) => setData('email', e.target.value)}
                                    placeholder="nama@email.com"
                                    className="w-full px-4 py-3.5 bg-slate-950/50 border border-slate-700/50 rounded-2xl text-white placeholder-slate-600 focus:outline-none focus:ring-1 focus:ring-indigo-500 focus:border-indigo-500 focus:bg-slate-900/80 transition-all font-medium shadow-inner"
                                />
                                {errors.email && <p className="mt-1.5 text-xs font-medium text-red-400 ml-1">{errors.email}</p>}
                            </div>

                            <div>
                                <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-2 ml-1 cursor-pointer" htmlFor="password">Kata Sandi</label>
                                <div className="relative">
                                    <input
                                        id="password"
                                        type={showPassword ? 'text' : 'password'}
                                        value={data.password}
                                        autoComplete="current-password"
                                        onChange={(e) => setData('password', e.target.value)}
                                        placeholder="••••••••"
                                        className="w-full px-4 py-3.5 pr-12 bg-slate-950/50 border border-slate-700/50 rounded-2xl text-white placeholder-slate-600 focus:outline-none focus:ring-1 focus:ring-indigo-500 focus:border-indigo-500 focus:bg-slate-900/80 transition-all font-medium shadow-inner tracking-widest"
                                    />
                                    <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-300 transition-colors p-1 rounded-md hover:bg-slate-800">
                                        {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                                    </button>
                                </div>
                                {errors.password && <p className="mt-1.5 text-xs font-medium text-red-400 ml-1">{errors.password}</p>}
                            </div>

                            <div className="flex items-center justify-between pt-1">
                                <label className="flex items-center cursor-pointer group">
                                    <div className="relative flex items-center justify-center">
                                        <input
                                            type="checkbox"
                                            checked={data.remember}
                                            onChange={(e) => setData('remember', e.target.checked)}
                                            className="peer sr-only"
                                        />
                                        <div className="w-5 h-5 rounded border-2 border-slate-600 bg-slate-800/50 peer-checked:bg-indigo-500 peer-checked:border-indigo-500 transition-all duration-200"></div>
                                        <svg className="absolute w-3 h-3 text-white pointer-events-none opacity-0 peer-checked:opacity-100 transition-opacity duration-200" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                                            <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                                        </svg>
                                    </div>
                                    <span className="ml-2 text-sm font-medium text-slate-400 group-hover:text-slate-300 transition-colors">Ingat saya</span>
                                </label>
                                {canResetPassword && (
                                    <Link href={route('password.request')} className="text-sm font-medium text-indigo-400 hover:text-indigo-300 transition-colors">
                                        Lupa Password?
                                    </Link>
                                )}
                            </div>

                            <button
                                type="submit"
                                disabled={processing}
                                className="w-full mt-2 py-3.5 bg-white text-slate-900 rounded-2xl font-bold hover:bg-indigo-50 transition-all shadow-lg active:scale-[0.98] disabled:opacity-50 disabled:active:scale-100 relative overflow-hidden group"
                            >
                                <div className="absolute inset-0 bg-gradient-to-r from-transparent via-slate-100 to-transparent -translate-x-[100%] group-hover:animate-[shimmer_1.5s_infinite]"></div>
                                <span className="relative z-10">{processing ? 'Masuk...' : 'Masuk →'}</span>
                            </button>
                        </form>

                        <div className="mt-8 text-center pt-6 border-t border-slate-700/50">
                            <p className="text-sm font-medium text-slate-400">
                                Belum punya akun?{' '}
                                <Link href={route('register')} className="font-bold text-white hover:text-indigo-300 transition-colors">
                                    Daftar Gratis
                                </Link>
                            </p>
                        </div>
                    </div>
                    
                    {/* Minimal Footer */}
                    <div className="mt-8 text-center text-xs font-medium text-slate-600">
                        &copy; {new Date().getFullYear()} FinTrack • Selalu Aman & Terenkripsi
                    </div>
                </div>
            </div>
        </>
    );
}
