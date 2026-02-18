import AppLayout from '@/Layouts/AppLayout';
import { Head } from '@inertiajs/react';
import { useState } from 'react';
import { Search, ChevronDown, MessageCircle, Mail, HelpCircle, FileText, ShieldQuestion, User } from 'lucide-react';

interface FaqItem { question: string; answer: string; category: 'GENERAL' | 'ACCOUNT' | 'TRANSACTIONS' | 'SECURITY'; }

const FAQS: FaqItem[] = [
    { category: 'GENERAL', question: 'Apa itu CAPH.io?', answer: 'CAPH.io adalah aplikasi manajemen keuangan pribadi yang menggunakan kecerdasan buatan (AI) untuk membantu Anda mencatat, menganalisis, dan merencanakan keuangan dengan lebih cerdas dan efisien.' },
    { category: 'TRANSACTIONS', question: 'Bagaimana cara menggunakan AI Smart Entry?', answer: 'Cukup ketik transaksi Anda dalam bahasa sehari-hari di menu "Input AI". Contoh: "Makan siang nasi goreng 25rb tadi". AI kami akan otomatis mendeteksi kategori, jumlah, dan tanggal transaksi untuk Anda.' },
    { category: 'TRANSACTIONS', question: 'Apakah saya bisa mengedit transaksi yang sudah disimpan?', answer: 'Tentu saja. Pergi ke menu "Riwayat", cari transaksi yang ingin diubah, lalu klik ikon pensil (Edit) di sebelah kanan baris transaksi tersebut.' },
    { category: 'ACCOUNT', question: 'Bagaimana cara mereset password saya?', answer: 'Anda dapat mereset password melalui menu "Profil Saya" > "Ganti Password". Jika Anda lupa password saat login, silakan hubungi administrator sistem.' },
    { category: 'SECURITY', question: 'Apakah data keuangan saya aman?', answer: 'Ya, data Anda disimpan secara aman di server dan dienkripsi. Kami menyarankan Anda melakukan backup data secara berkala melalui menu Pengaturan.' },
    { category: 'GENERAL', question: 'Apakah aplikasi ini gratis?', answer: 'Saat ini CAPH.io dapat digunakan sepenuhnya secara gratis dengan fitur-fitur dasar dan AI integration.' },
];

const categories = [
    { id: 'GENERAL', label: 'Umum', icon: HelpCircle },
    { id: 'TRANSACTIONS', label: 'Transaksi', icon: FileText },
    { id: 'ACCOUNT', label: 'Akun', icon: User },
    { id: 'SECURITY', label: 'Keamanan', icon: ShieldQuestion },
];

export default function HelpCenter() {
    const [searchTerm, setSearchTerm] = useState('');
    const [openIndex, setOpenIndex] = useState<number | null>(0);

    const filteredFaqs = FAQS.filter(faq =>
        faq.question.toLowerCase().includes(searchTerm.toLowerCase()) ||
        faq.answer.toLowerCase().includes(searchTerm.toLowerCase())
    );

    return (

        <>
            <Head title="Bantuan & FAQ" />

            <div className="space-y-8 animate-fade-in-up">
                {/* Hero */}
                <div className="relative bg-gradient-to-r from-indigo-600 to-purple-600 rounded-[2.5rem] p-10 text-center text-white overflow-hidden shadow-xl">
                    <div className="absolute -bottom-24 -right-24 w-64 h-64 bg-white opacity-10 rounded-full blur-3xl" />
                    <div className="relative z-10 max-w-2xl mx-auto">
                        <h2 className="text-3xl font-bold mb-4">Bagaimana kami bisa membantu?</h2>
                        <p className="text-indigo-100 mb-8">Temukan jawaban cepat untuk pertanyaan umum atau hubungi tim support kami.</p>
                        <div className="relative group">
                            <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 text-slate-400 group-focus-within:text-indigo-600 transition-colors" />
                            <input type="text" placeholder="Cari pertanyaan atau topik..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} className="w-full pl-12 pr-6 py-4 rounded-2xl text-slate-800 focus:outline-none focus:ring-4 focus:ring-white/30 shadow-lg placeholder:text-slate-400 transition-all" />
                        </div>
                    </div>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                    {/* Contact */}
                    <div className="lg:col-span-1 space-y-4">
                        <h3 className="font-bold text-slate-800 dark:text-white px-2">Kontak Support</h3>
                        <div className="bg-white dark:bg-slate-900 p-6 rounded-2xl shadow-sm border border-slate-200 dark:border-slate-800 hover:border-indigo-200 dark:hover:border-indigo-800 transition-all group cursor-pointer">
                            <div className="p-3 bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400 rounded-xl w-fit mb-4 group-hover:scale-110 transition-transform"><Mail className="w-6 h-6" /></div>
                            <h4 className="font-bold text-slate-800 dark:text-white">Email Support</h4>
                            <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 mb-3">Respon dalam 24 jam</p>
                            <a href="mailto:support@caph.io" className="text-sm font-bold text-indigo-600 dark:text-indigo-400 hover:underline">support@caph.io</a>
                        </div>
                        <div className="bg-white dark:bg-slate-900 p-6 rounded-2xl shadow-sm border border-slate-200 dark:border-slate-800 hover:border-emerald-200 dark:hover:border-emerald-800 transition-all group cursor-pointer">
                            <div className="p-3 bg-emerald-50 dark:bg-emerald-900/20 text-emerald-600 dark:text-emerald-400 rounded-xl w-fit mb-4 group-hover:scale-110 transition-transform"><MessageCircle className="w-6 h-6" /></div>
                            <h4 className="font-bold text-slate-800 dark:text-white">Live Chat</h4>
                            <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 mb-3">Senin - Jumat, 09:00 - 17:00</p>
                            <button className="text-sm font-bold text-emerald-600 dark:text-emerald-400 hover:underline">Mulai Obrolan</button>
                        </div>
                    </div>

                    {/* FAQ Accordion */}
                    <div className="lg:col-span-2 space-y-6">
                        <div className="flex items-center justify-between px-2">
                            <h3 className="font-bold text-slate-800 dark:text-white">Pertanyaan Umum (FAQ)</h3>
                            {searchTerm && <span className="text-xs font-bold text-indigo-600 bg-indigo-50 dark:bg-indigo-900/30 px-2 py-1 rounded-lg">Hasil pencarian: "{searchTerm}"</span>}
                        </div>

                        <div className="space-y-4">
                            {filteredFaqs.length === 0 ? (
                                <div className="text-center py-12 bg-white dark:bg-slate-900 rounded-3xl border border-dashed border-slate-200 dark:border-slate-800">
                                    <HelpCircle className="w-12 h-12 text-slate-300 mx-auto mb-3" />
                                    <p className="text-slate-500 dark:text-slate-400 font-medium">Tidak ada hasil ditemukan.</p>
                                    <button onClick={() => setSearchTerm('')} className="text-sm text-indigo-600 font-bold mt-2 hover:underline">Hapus pencarian</button>
                                </div>
                            ) : (
                                filteredFaqs.map((faq, index) => (
                                    <div key={index} className={`bg-white dark:bg-slate-900 rounded-2xl border transition-all duration-300 overflow-hidden ${openIndex === index ? 'border-indigo-200 dark:border-indigo-800 shadow-md' : 'border-slate-200 dark:border-slate-800 shadow-sm hover:border-indigo-100'}`}>
                                        <button onClick={() => setOpenIndex(openIndex === index ? null : index)} className="w-full flex items-center justify-between p-5 text-left focus:outline-none">
                                            <div className="flex items-center gap-4">
                                                <div className={`p-2 rounded-lg ${openIndex === index ? 'bg-indigo-100 dark:bg-indigo-900/30 text-indigo-600 dark:text-indigo-400' : 'bg-slate-100 dark:bg-slate-800 text-slate-500'}`}>
                                                    {(() => { const Icon = categories.find(c => c.id === faq.category)?.icon || HelpCircle; return <Icon className="w-5 h-5" />; })()}
                                                </div>
                                                <span className={`font-bold text-sm ${openIndex === index ? 'text-indigo-900 dark:text-white' : 'text-slate-700 dark:text-slate-300'}`}>{faq.question}</span>
                                            </div>
                                            <ChevronDown className={`w-5 h-5 text-slate-400 transition-transform duration-300 ${openIndex === index ? 'rotate-180 text-indigo-500' : ''}`} />
                                        </button>
                                        <div className={`transition-all duration-300 ease-in-out overflow-hidden ${openIndex === index ? 'max-h-48 opacity-100' : 'max-h-0 opacity-0'}`}>
                                            <div className="p-5 pt-0 pl-[4.5rem] text-sm text-slate-600 dark:text-slate-400 leading-relaxed">{faq.answer}</div>
                                        </div>
                                    </div>
                                ))
                            )}
                        </div>
                    </div>
                </div>
            </div>
        </>
    );
}

HelpCenter.layout = (page: any) => (
    <AppLayout header={
        <div className="flex flex-col">
            <h1 className="text-2xl font-bold text-slate-800 dark:text-white tracking-tight">Bantuan & FAQ</h1>
            <p className="text-xs text-slate-500 dark:text-slate-400 font-medium mt-0.5">Temukan jawaban dan dapatkan bantuan</p>
        </div>
    }>
        {page}
    </AppLayout>
);

