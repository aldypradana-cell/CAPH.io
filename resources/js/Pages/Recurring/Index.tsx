import AppLayout from '@/Layouts/AppLayout';
import { Head, useForm, router } from '@inertiajs/react';
import { PageProps } from '@/types';
import { useState, FormEventHandler } from 'react';
import Modal from '@/Components/Modal';
import InputLabel from '@/Components/InputLabel';
import TextInput from '@/Components/TextInput';
import InputError from '@/Components/InputError';
import PrimaryButton from '@/Components/PrimaryButton';
import SecondaryButton from '@/Components/SecondaryButton';
import Dropdown from '@/Components/Dropdown';
import DangerButton from '@/Components/DangerButton';
import { Plus, Calendar, Repeat, ArrowRight, CheckCircle, Clock, AlertTriangle, Wallet } from 'lucide-react';

interface RecurringTransaction {
    id: number;
    name: string;
    amount: number;
    wallet_id: number;
    type: 'INCOME' | 'EXPENSE' | 'TRANSFER';
    category: string;
    frequency: 'DAILY' | 'WEEKLY' | 'MONTHLY' | 'YEARLY';
    start_date: string;
    next_run_date: string;
    auto_cut: boolean;
    is_active: boolean;
    description: string | null;
    status?: 'OVERDUE' | 'DUE_SOON' | 'ACTIVE'; // Helper for UI
    wallet: {
        id: number;
        name: string;
    };
}

interface Wallet {
    id: number;
    name: string;
    balance: number;
}

interface Category {
    id: number;
    name: string;
    type: 'INCOME' | 'EXPENSE' | 'TRANSFER';
}

interface Props extends PageProps {
    recurringTransactions: RecurringTransaction[];
    dueBills: RecurringTransaction[];
    wallets: Wallet[];
    categories: Category[];
}

export default function RecurringIndex({ auth, recurringTransactions, dueBills, wallets, categories }: Props) {
    const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
    const [isEditModalOpen, setIsEditModalOpen] = useState(false);
    const [isProcessModalOpen, setIsProcessModalOpen] = useState(false);
    const [selectedRecurring, setSelectedRecurring] = useState<RecurringTransaction | null>(null);

    // Form for Create/Edit
    const { data, setData, post, put, delete: destroy, processing, errors, reset, clearErrors } = useForm({
        name: '',
        amount: '',
        wallet_id: '',
        type: 'EXPENSE',
        category: '',
        frequency: 'MONTHLY',
        start_date: new Date().toISOString().split('T')[0],
        auto_cut: true,
        description: '',
    });

    // Form for Processing (Paying)
    const processForm = useForm({
        amount: '',
        wallet_id: '',
        date: new Date().toISOString().split('T')[0],
    });

    const openCreateModal = () => {
        reset();
        clearErrors();
        setIsCreateModalOpen(true);
    };

    const openEditModal = (item: RecurringTransaction) => {
        setSelectedRecurring(item);
        setData({
            name: item.name,
            amount: item.amount.toString(),
            wallet_id: item.wallet_id.toString(),
            type: item.type,
            category: item.category,
            frequency: item.frequency,
            start_date: item.start_date,
            auto_cut: item.auto_cut,
            description: item.description || '',
        });
        clearErrors();
        setIsEditModalOpen(true);
    };

    const openProcessModal = (item: RecurringTransaction) => {
        setSelectedRecurring(item);
        processForm.setData({
            amount: item.amount.toString(),
            wallet_id: item.wallet_id.toString(),
            date: new Date().toISOString().split('T')[0],
        });
        processForm.clearErrors();
        setIsProcessModalOpen(true);
    };

    const handleCreate: FormEventHandler = (e) => {
        e.preventDefault();
        post(route('recurring.store'), {
            onSuccess: () => setIsCreateModalOpen(false),
        });
    };

    const handleUpdate: FormEventHandler = (e) => {
        e.preventDefault();
        if (!selectedRecurring) return;
        put(route('recurring.update', selectedRecurring.id), {
            onSuccess: () => setIsEditModalOpen(false),
        });
    };

    const handleDelete = () => {
        if (!selectedRecurring) return;
        if (confirm('Yakin ingin menghapus jadwal ini?')) {
            destroy(route('recurring.destroy', selectedRecurring.id), {
                onSuccess: () => setIsEditModalOpen(false),
            });
        }
    };

    const handleProcess: FormEventHandler = (e) => {
        e.preventDefault();
        if (!selectedRecurring) return;
        processForm.post(route('recurring.process', selectedRecurring.id), {
            onSuccess: () => setIsProcessModalOpen(false),
        });
    };

    // Filter categories based on type
    const availableCategories = categories.filter(c => c.type === data.type);

    const formatCurrency = (amount: number) => {
        return new Intl.NumberFormat('id-ID', {
            style: 'currency',
            currency: 'IDR',
            minimumFractionDigits: 0,
        }).format(amount);
    };

    const formatDate = (dateString: string) => {
        return new Date(dateString).toLocaleDateString('id-ID', {
            day: 'numeric',
            month: 'short',
            year: 'numeric'
        });
    };

    return (
        <>
            <Head title="Transaksi Rutin" />

            <div className="py-12">
                <div className="max-w-7xl mx-auto sm:px-6 lg:px-8 space-y-6">

                    {/* DUE BILLS WIDGET */}
                    {dueBills.length > 0 && (
                        <div className="bg-orange-50 overflow-hidden shadow-sm sm:rounded-lg border border-orange-200">
                            <div className="p-6">
                                <h3 className="text-lg font-bold text-orange-800 mb-4 flex items-center">
                                    <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                                    </svg>
                                    Tagihan Jatuh Tempo ({dueBills.length})
                                </h3>
                                <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                                    {dueBills.map(bill => (
                                        <div key={bill.id} className="bg-white p-4 rounded-lg shadow-sm border border-orange-100 flex justify-between flex-col">
                                            <div>
                                                <div className="text-sm text-gray-500 mb-1">{formatDate(bill.next_run_date)}</div>
                                                <h4 className="font-bold text-gray-800 text-lg">{bill.name}</h4>
                                                <div className="text-orange-600 font-bold mb-2">{formatCurrency(bill.amount)}</div>
                                                <div className="text-sm text-gray-600">Via: {bill.wallet.name}</div>
                                            </div>
                                            <div className="mt-4">
                                                <PrimaryButton
                                                    onClick={() => openProcessModal(bill)}
                                                    className="w-full justify-center bg-orange-600 hover:bg-orange-700 focus:bg-orange-700 active:bg-orange-800"
                                                >
                                                    Bayar Sekarang
                                                </PrimaryButton>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        </div>
                    )}

                    {/* ACTIVE RECURRING LIST */}
                    <div className="bg-white overflow-hidden shadow-sm sm:rounded-lg">
                        <div className="p-6 text-gray-900">
                            <div className="flex justify-between items-center mb-6">
                                <h3 className="text-lg font-semibold">Daftar Transaksi Rutin</h3>
                                <PrimaryButton onClick={openCreateModal}>
                                    + Tambah Jadwal
                                </PrimaryButton>
                            </div>

                            <div className="overflow-x-auto">
                                <table className="min-w-full divide-y divide-gray-200">
                                    <thead className="bg-gray-50">
                                        <tr>
                                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Nama</th>
                                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Jumlah</th>
                                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Frekuensi</th>
                                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Jadwal Tiba</th>
                                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Aksi</th>
                                        </tr>
                                    </thead>
                                    <tbody className="bg-white divide-y divide-gray-200">
                                        {recurringTransactions.map((item) => (
                                            <tr key={item.id} className="hover:bg-gray-50">
                                                <td className="px-6 py-4 whitespace-nowrap">
                                                    <div className="font-medium text-gray-900">{item.name}</div>
                                                    <div className="text-xs text-gray-500">{item.category} • {item.wallet.name}</div>
                                                </td>
                                                <td className="px-6 py-4 whitespace-nowrap">
                                                    <div className={`font-bold ${item.type === 'EXPENSE' ? 'text-red-600' : 'text-green-600'}`}>
                                                        {formatCurrency(item.amount)}
                                                    </div>
                                                </td>
                                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                                    {item.frequency}
                                                </td>
                                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                                    {formatDate(item.next_run_date)}
                                                </td>
                                                <td className="px-6 py-4 whitespace-nowrap">
                                                    <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${item.auto_cut ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800'
                                                        }`}>
                                                        {item.auto_cut ? 'Auto Cut' : 'Manual'}
                                                    </span>
                                                </td>
                                                <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                                                    <button
                                                        onClick={() => openEditModal(item)}
                                                        className="text-indigo-600 hover:text-indigo-900"
                                                    >
                                                        Edit
                                                    </button>
                                                </td>
                                            </tr>
                                        ))}
                                        {recurringTransactions.length === 0 && (
                                            <tr>
                                                <td colSpan={6} className="px-6 py-10 text-center text-gray-500">
                                                    Belum ada jadwal transaksi rutin.
                                                </td>
                                            </tr>
                                        )}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* CREATE/EDIT MODAL */}
            <Modal show={isCreateModalOpen || isEditModalOpen} onClose={() => { setIsCreateModalOpen(false); setIsEditModalOpen(false); }}>
                <form onSubmit={isEditModalOpen ? handleUpdate : handleCreate} className="p-6">
                    <h2 className="text-lg font-medium text-gray-900 mb-4">
                        {isEditModalOpen ? 'Edit Jadwal Rutin' : 'Buat Jadwal Rutin Baru'}
                    </h2>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="col-span-2">
                            <InputLabel htmlFor="name" value="Nama Transaksi (Contoh: Netflix)" />
                            <TextInput
                                id="name"
                                value={data.name}
                                onChange={(e) => setData('name', e.target.value)}
                                className="mt-1 block w-full"
                                required
                            />
                            <InputError message={errors.name} className="mt-2" />
                        </div>

                        <div>
                            <InputLabel htmlFor="amount" value="Jumlah (Estimasi)" />
                            <TextInput
                                id="amount"
                                type="number"
                                value={data.amount}
                                onChange={(e) => setData('amount', e.target.value)}
                                className="mt-1 block w-full"
                                required
                            />
                            <InputError message={errors.amount} className="mt-2" />
                        </div>

                        <div>
                            <InputLabel htmlFor="frequency" value="Frekuensi" />
                            <select
                                id="frequency"
                                value={data.frequency}
                                onChange={(e) => setData('frequency', e.target.value as any)}
                                className="mt-1 block w-full border-gray-300 focus:border-indigo-500 focus:ring-indigo-500 rounded-md shadow-sm"
                            >
                                <option value="DAILY">Harian</option>
                                <option value="WEEKLY">Mingguan</option>
                                <option value="MONTHLY">Bulanan</option>
                                <option value="YEARLY">Tahunan</option>
                            </select>
                            <InputError message={errors.frequency} className="mt-2" />
                        </div>

                        <div>
                            <InputLabel htmlFor="type" value="Tipe" />
                            <select
                                id="type"
                                value={data.type}
                                onChange={(e) => setData('type', e.target.value as any)}
                                className="mt-1 block w-full border-gray-300 focus:border-indigo-500 focus:ring-indigo-500 rounded-md shadow-sm"
                            >
                                <option value="EXPENSE">Pengeluaran</option>
                                <option value="INCOME">Pemasukan</option>
                                <option value="TRANSFER">Transfer</option>
                            </select>
                            <InputError message={errors.type} className="mt-2" />
                        </div>

                        <div>
                            <InputLabel htmlFor="category" value="Kategori" />
                            <select
                                id="category"
                                value={data.category}
                                onChange={(e) => setData('category', e.target.value)}
                                className="mt-1 block w-full border-gray-300 focus:border-indigo-500 focus:ring-indigo-500 rounded-md shadow-sm"
                                required
                            >
                                <option value="">Pilih Kategori</option>
                                {availableCategories.map(cat => (
                                    <option key={cat.id} value={cat.name}>{cat.name}</option>
                                ))}
                            </select>
                            <InputError message={errors.category} className="mt-2" />
                        </div>

                        <div>
                            <InputLabel htmlFor="wallet_id" value="Dompet Sumber" />
                            <select
                                id="wallet_id"
                                value={data.wallet_id}
                                onChange={(e) => setData('wallet_id', e.target.value)}
                                className="mt-1 block w-full border-gray-300 focus:border-indigo-500 focus:ring-indigo-500 rounded-md shadow-sm"
                                required
                            >
                                <option value="">Pilih Dompet</option>
                                {wallets.map(w => (
                                    <option key={w.id} value={w.id}>{w.name} (Saldo: {formatCurrency(w.balance)})</option>
                                ))}
                            </select>
                            <InputError message={errors.wallet_id} className="mt-2" />
                        </div>

                        <div>
                            <InputLabel htmlFor="start_date" value="Tanggal Mulai / Berikutnya" />
                            <TextInput
                                id="start_date"
                                type="date"
                                value={data.start_date}
                                onChange={(e) => {
                                    setData('start_date', e.target.value);
                                    if (isEditModalOpen) setData('next_run_date' as any, e.target.value);
                                }}
                                className="mt-1 block w-full"
                                required
                            />
                            <InputError message={errors.start_date} className="mt-2" />
                        </div>

                        <div className="col-span-2 mt-2">
                            <label className="flex items-center space-x-2 cursor-pointer">
                                <input
                                    type="checkbox"
                                    checked={data.auto_cut}
                                    onChange={(e) => setData('auto_cut', e.target.checked)}
                                    className="rounded border-gray-300 text-indigo-600 shadow-sm focus:ring-indigo-500"
                                />
                                <span className="text-sm text-gray-700 font-medium">Otomatis Potong Saldo?</span>
                            </label>
                            <p className="text-xs text-gray-500 mt-1 ml-6">
                                Jika dicentang, transaksi akan otomatis dibuat saat tanggal tiba (Contoh: Netflix).<br />
                                Jika tidak, akan muncul sebagai "Tagihan Jatuh Tempo" untuk dikonfirmasi manual (Contoh: Listrik).
                            </p>
                        </div>
                    </div>

                    <div className="mt-6 flex justify-end space-x-3">
                        {isEditModalOpen && (
                            <DangerButton type="button" onClick={handleDelete} className="mr-auto">
                                Hapus Jadwal
                            </DangerButton>
                        )}
                        <SecondaryButton onClick={() => { setIsCreateModalOpen(false); setIsEditModalOpen(false); }}>
                            Batal
                        </SecondaryButton>
                        <PrimaryButton disabled={processing}>
                            {isEditModalOpen ? 'Simpan Perubahan' : 'Buat Jadwal'}
                        </PrimaryButton>
                    </div>
                </form>
            </Modal>

            {/* PROCESS PAYMENT MODAL */}
            <Modal show={isProcessModalOpen} onClose={() => setIsProcessModalOpen(false)}>
                <form onSubmit={handleProcess} className="p-6">
                    <h2 className="text-lg font-bold text-gray-900 mb-4">
                        Bayar Tagihan: {selectedRecurring?.name}
                    </h2>

                    <p className="text-sm text-gray-600 mb-4">
                        Silakan konfirmasi nominal aktual dan dompet pembayaran.
                    </p>

                    <div className="space-y-4">
                        <div>
                            <InputLabel htmlFor="process_amount" value="Nominal Aktual (Rp)" />
                            <TextInput
                                id="process_amount"
                                type="number"
                                value={processForm.data.amount}
                                onChange={(e) => processForm.setData('amount', e.target.value)}
                                className="mt-1 block w-full"
                                required
                                autoFocus
                            />
                            <InputError message={processForm.errors.amount} className="mt-2" />
                        </div>

                        <div>
                            <InputLabel htmlFor="process_wallet" value="Bayar Menggunakan" />
                            <select
                                id="process_wallet"
                                value={processForm.data.wallet_id}
                                onChange={(e) => processForm.setData('wallet_id', e.target.value)}
                                className="mt-1 block w-full border-gray-300 focus:border-indigo-500 focus:ring-indigo-500 rounded-md shadow-sm"
                                required
                            >
                                <option value="">Pilih Dompet</option>
                                {wallets.map(w => (
                                    <option key={w.id} value={w.id}>{w.name} (Saldo: {formatCurrency(w.balance)})</option>
                                ))}
                            </select>
                            <InputError message={processForm.errors.wallet_id} className="mt-2" />
                        </div>

                        <div>
                            <InputLabel htmlFor="process_date" value="Tanggal Bayar" />
                            <TextInput
                                id="process_date"
                                type="date"
                                value={processForm.data.date}
                                onChange={(e) => processForm.setData('date', e.target.value)}
                                className="mt-1 block w-full"
                                required
                            />
                            <InputError message={processForm.errors.date} className="mt-2" />
                        </div>
                    </div>

                    <div className="mt-6 flex justify-end space-x-3">
                        <SecondaryButton onClick={() => setIsProcessModalOpen(false)}>
                            Batal
                        </SecondaryButton>
                        <PrimaryButton disabled={processForm.processing}>
                            Konfirmasi Pembayaran
                        </PrimaryButton>
                    </div>
                </form>
            </Modal>
        </>
    );
}

RecurringIndex.layout = (page: any) => (
    <AppLayout
        header={
            <div className="flex flex-col">
                <h1 className="text-2xl font-bold text-slate-800 dark:text-white tracking-tight">Transaksi Rutin</h1>
                <p className="text-xs text-slate-500 dark:text-slate-400 font-medium mt-0.5">
                    Kelola langganan, cicilan, dan tagihan rutin Anda.
                </p>
            </div>
        }
    >
        {page}
    </AppLayout>
);
