import { Head, useForm, Link } from '@inertiajs/react';
import { FormEventHandler } from 'react';
import { Wallet } from '@phosphor-icons/react';

export default function ForgotPassword({ status }: { status?: string }) {
    const { data, setData, post, processing, errors } = useForm({
        email: '',
    });

    const submit: FormEventHandler = (e) => {
        e.preventDefault();

        post(route('password.email'));
    };

    return (
        <>
            <Head title="Lupa Password - CAPH.io" />
            <div className="min-h-screen flex items-center justify-center bg-slate-950 relative overflow-hidden px-4">
                {/* Animated Mesh Gradient Background */}
                <div className="absolute inset-0 overflow-hidden pointer-events-none">
                    <div className="login-orb-1 absolute -top-40 -left-40 w-[700px] h-[700px] rounded-full bg-indigo-700/30 blur-[120px]" />
                    <div className="login-orb-2 absolute top-1/2 -right-40 w-[600px] h-[600px] rounded-full bg-violet-600/25 blur-[100px]" />
                    <div className="login-orb-3 absolute -bottom-40 left-1/3 w-[600px] h-[600px] rounded-full bg-fuchsia-500/15 blur-[120px]" />
                    <div className="absolute inset-0"
                        style={{
                            backgroundImage: `linear-gradient(rgba(255,255,255,0.02) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.02) 1px, transparent 1px)`,
                            backgroundSize: '60px 60px'
                        }}
                    />
                </div>

                {/* Container Center */}
                <div className="w-full max-w-[420px] relative z-10 flex flex-col items-center">
                    
                    {/* Logo & Headline */}
                    <div className="flex flex-col items-center text-center mb-8">
                        <div className="w-16 h-16 bg-gradient-to-br from-indigo-500 to-violet-600 rounded-2xl flex items-center justify-center text-white shadow-2xl shadow-indigo-500/40 mb-5 relative group">
                            <div className="absolute inset-0 rounded-2xl bg-white/20 blur-md opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
                            <Wallet weight="duotone" className="w-8 h-8 relative z-10" />
                        </div>
                        <h1 className="text-3xl font-bold tracking-tight text-white mb-1">CAPH.io</h1>
                        <p className="text-sm font-medium tracking-[0.2em] text-indigo-400 uppercase">
                            Capital And Personal Hub
                        </p>
                    </div>

                    {/* Glassmorphism Form Card */}
                    <div className="w-full bg-slate-900/60 backdrop-blur-2xl rounded-3xl border border-white/10 shadow-[0_8px_32px_0_rgba(0,0,0,0.3)] relative overflow-hidden p-8">
                        <div className="absolute inset-0 rounded-3xl pointer-events-none shadow-[inset_0_1px_1px_rgba(255,255,255,0.1)]"></div>
                        <div className="absolute top-0 inset-x-0 h-px w-1/2 mx-auto bg-gradient-to-r from-transparent via-indigo-500/50 to-transparent"></div>

                        <div className="text-center mb-6">
                            <h2 className="text-2xl font-bold text-white tracking-tight">Lupa Sandi?</h2>
                            <p className="text-slate-400 text-sm mt-2 font-medium">Masukkan email Anda. Kami akan mengirimkan tautan untuk mengatur ulang kata sandi.</p>
                        </div>

                        {status && (
                            <div className="mb-6 p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-sm font-medium text-center shadow-inner">
                                {status}
                            </div>
                        )}

                        <form onSubmit={submit} className="space-y-4">
                            <div>
                                <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-2 ml-1 cursor-pointer" htmlFor="email">Email Terdaftar</label>
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

                            <button
                                type="submit"
                                disabled={processing}
                                className="w-full mt-4 py-3.5 bg-white text-slate-900 rounded-2xl font-bold hover:bg-indigo-50 transition-all shadow-lg active:scale-[0.98] disabled:opacity-50 disabled:active:scale-100 relative overflow-hidden group"
                            >
                                <div className="absolute inset-0 bg-gradient-to-r from-transparent via-slate-100 to-transparent -translate-x-[100%] group-hover:animate-[shimmer_1.5s_infinite]"></div>
                                <span className="relative z-10">{processing ? 'Mengirim...' : 'Kirim Tautan Reset →'}</span>
                            </button>
                        </form>

                        <div className="mt-6 text-center pt-6 border-t border-slate-700/50">
                            <Link href={route('login')} className="text-sm font-bold text-slate-400 hover:text-white transition-colors flex items-center justify-center gap-2">
                                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
                                </svg>
                                Kembali ke Halaman Login
                            </Link>
                        </div>
                    </div>
                </div>
            </div>
        </>
    );
}
