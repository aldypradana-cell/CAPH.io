import AppLayout from '@/Layouts/AppLayout';
import { Head, router, useForm } from '@inertiajs/react';
import { PageProps } from '@/types';
import { useState } from 'react';
import {
    Tags, Plus, Edit2, Trash2, Save, X,
    Wallet, TrendingUp, TrendingDown
} from 'lucide-react';
import Modal from '@/Components/Modal'; // Assuming we have a Modal component
import InputLabel from '@/Components/InputLabel';
import TextInput from '@/Components/TextInput';
import InputError from '@/Components/InputError';
import PrimaryButton from '@/Components/PrimaryButton';
import SecondaryButton from '@/Components/SecondaryButton';

interface Category {
    id: number;
    name: string;
    type: 'INCOME' | 'EXPENSE';
    icon: string;
    color: string;
}

export default function AdminMasterIndex({ categories }: { categories: Category[] }) {
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingCategory, setEditingCategory] = useState<Category | null>(null);

    const { data, setData, post, put, delete: destroy, processing, errors, reset, clearErrors } = useForm({
        name: '',
        type: 'EXPENSE',
        icon: 'Tags',
        color: 'bg-blue-500'
    });

    const openModal = (category: Category | null = null) => {
        setEditingCategory(category);
        if (category) {
            setData({
                name: category.name,
                type: category.type,
                icon: category.icon,
                color: category.color
            });
        } else {
            reset();
            setData('type', 'EXPENSE'); // Default
        }
        clearErrors();
        setIsModalOpen(true);
    };

    const closeModal = () => {
        setIsModalOpen(false);
        setEditingCategory(null);
        reset();
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (editingCategory) {
            put(route('admin.master.categories.update', editingCategory.id), {
                onSuccess: () => closeModal()
            });
        } else {
            post(route('admin.master.categories.store'), {
                onSuccess: () => closeModal()
            });
        }
    };

    const handleDelete = (id: number) => {
        if (confirm('Apakah anda yakin ingin menghapus kategori ini?')) {
            destroy(route('admin.master.categories.destroy', id));
        }
    };

    return (
        <>
            <Head title="Admin - Master Data" />

            <div className="space-y-6 animate-fade-in-up">
                {/* Categories Section */}
                <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-sm border border-slate-200 dark:border-slate-800 p-6">
                    <div className="flex justify-between items-center mb-6">
                        <h2 className="text-lg font-bold text-slate-800 dark:text-white flex items-center gap-2">
                            <Tags className="w-5 h-5 text-indigo-500" /> Kategori Global
                        </h2>
                        <button
                            onClick={() => openModal()}
                            className="bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-xl text-sm font-bold transition-all flex items-center gap-2"
                        >
                            <Plus className="w-4 h-4" /> Tambah Kategori
                        </button>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                        {categories.map((cat) => (
                            <div key={cat.id} className="group p-4 rounded-xl border border-slate-100 dark:border-slate-700 hover:border-indigo-200 dark:hover:border-indigo-800 hover:shadow-md transition-all bg-slate-50 dark:bg-slate-800/50 flex justify-between items-center">
                                <div className="flex items-center gap-3">
                                    <div className={`w-10 h-10 rounded-full flex items-center justify-center text-white ${cat.color.replace('bg-', 'bg-gradient-to-br from-').replace('-500', '-500 to-').replace('-600', '-600') + ' ' + cat.color}`}>
                                        <Tags className="w-5 h-5" />
                                    </div>
                                    <div>
                                        <p className="font-bold text-slate-800 dark:text-white">{cat.name}</p>
                                        <p className={`text-[10px] font-bold px-2 py-0.5 rounded-full w-fit mt-1 ${cat.type === 'INCOME' ? 'bg-emerald-100 text-emerald-600' : 'bg-red-100 text-red-600'}`}>
                                            {cat.type}
                                        </p>
                                    </div>
                                </div>
                                <div className="flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                    <button
                                        onClick={() => openModal(cat)}
                                        className="p-2 text-blue-500 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded-lg"
                                    >
                                        <Edit2 className="w-4 h-4" />
                                    </button>
                                    <button
                                        onClick={() => handleDelete(cat.id)}
                                        className="p-2 text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg"
                                    >
                                        <Trash2 className="w-4 h-4" />
                                    </button>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            </div>

            {/* Modal */}
            <Modal show={isModalOpen} onClose={closeModal}>
                <div className="p-6">
                    <h3 className="text-lg font-bold text-slate-800 dark:text-white mb-4">
                        {editingCategory ? 'Edit Kategori' : 'Tambah Kategori Baru'}
                    </h3>

                    <form onSubmit={handleSubmit} className="space-y-4">
                        <div>
                            <InputLabel htmlFor="name" value="Nama Kategori" />
                            <TextInput
                                id="name"
                                value={data.name}
                                onChange={(e) => setData('name', e.target.value)}
                                className="mt-1 block w-full"
                                placeholder="Contoh: Makanan, Gaji"
                            />
                            <InputError message={errors.name} className="mt-2" />
                        </div>

                        <div>
                            <InputLabel htmlFor="type" value="Tipe" />
                            <div className="grid grid-cols-2 gap-4 mt-1">
                                <button
                                    type="button"
                                    onClick={() => setData('type', 'INCOME')}
                                    className={`p-3 rounded-xl border flex items-center justify-center gap-2 transition-all ${data.type === 'INCOME'
                                        ? 'border-emerald-500 bg-emerald-50 text-emerald-600 dark:bg-emerald-900/20'
                                        : 'border-slate-200 dark:border-slate-700 text-slate-500'
                                        }`}
                                >
                                    <TrendingUp className="w-4 h-4" /> Pemasukan
                                </button>
                                <button
                                    type="button"
                                    onClick={() => setData('type', 'EXPENSE')}
                                    className={`p-3 rounded-xl border flex items-center justify-center gap-2 transition-all ${data.type === 'EXPENSE'
                                        ? 'border-red-500 bg-red-50 text-red-600 dark:bg-red-900/20'
                                        : 'border-slate-200 dark:border-slate-700 text-slate-500'
                                        }`}
                                >
                                    <TrendingDown className="w-4 h-4" /> Pengeluaran
                                </button>
                            </div>
                        </div>

                        <div>
                            <InputLabel htmlFor="color" value="Warna" />
                            <select
                                value={data.color}
                                onChange={(e) => setData('color', e.target.value)}
                                className="w-full mt-1 border-slate-300 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-300 focus:border-indigo-500 focus:ring-indigo-500 rounded-md shadow-sm"
                            >
                                <option value="bg-blue-500">Blue</option>
                                <option value="bg-emerald-500">Emerald</option>
                                <option value="bg-red-500">Red</option>
                                <option value="bg-amber-500">Amber</option>
                                <option value="bg-violet-500">Violet</option>
                                <option value="bg-pink-500">Pink</option>
                                <option value="bg-cyan-500">Cyan</option>
                            </select>
                        </div>

                        <div className="flex justify-end gap-3 mt-6">
                            <SecondaryButton onClick={closeModal} disabled={processing}>
                                Batal
                            </SecondaryButton>
                            <PrimaryButton disabled={processing}>
                                {processing ? 'Menyimpan...' : 'Simpan'}
                            </PrimaryButton>
                        </div>
                    </form>
                </div>
            </Modal>
        </>
    );
}

AdminMasterIndex.layout = (page: any) => (
    <AppLayout header={
        <div className="flex flex-col">
            <h1 className="text-2xl font-bold text-slate-800 dark:text-white tracking-tight">Master Data</h1>
            <p className="text-xs text-slate-500 dark:text-slate-400 font-medium mt-0.5">Kelola kategori global & referensi data</p>
        </div>
    }>
        {page}
    </AppLayout>
);
