export interface TagData {
    id: number;
    name: string;
    color: string | null;
}

export interface Stats {
    totalIncome: number;
    totalExpense: number;
    balance: number;
    netFlow: number;
    netWorth: number; // Added for Net Worth feature
    transactionCount: number;
}

export interface Transaction {
    id: number;
    date: string;
    description: string;
    amount: number;
    type: 'INCOME' | 'EXPENSE' | 'TRANSFER';
    category: string;
    wallet?: { id: number; name: string };
}

export interface WalletData {
    id: number;
    name: string;
    type: string;
    balance: number;
}

export interface BudgetProgress {
    id: number;
    category: string;
    limit: number;
    spent: number;
    percentage: number;
}

export interface CategoryData {
    id: number;
    name: string;
    type: string;
    // adding icon/color if needed later, but keeping it simple for now matching Dashboard.tsx
}

export interface Debt {
    id: number;
    type: string;
    person: string;
    amount: number;
    due_date: string;
    description?: string;
    remainingAmount?: number; // Added based on possible usage
}

export interface RecurringTransaction {
    id: number;
    name: string;
    amount: number;
    next_run_date: string;
    frequency: string;
    type: 'INCOME' | 'EXPENSE' | 'TRANSFER';
    category: string;
    auto_cut: boolean;
}

export interface ChartData {
    name: string;
    Pemasukan: number;
    Pengeluaran: number;
    fullDate?: string;
}

export interface PieData {
    name: string;
    value: number;
    color?: string; // Optional if we want to carry color in data
}

export interface TopTagData {
    name: string;
    total: number;
    color: string | null;
    percentage: number;
}

export interface FilterState {
    startDate: string;
    endDate: string;
    mode: string;
    trendCategory: string;
    pieStartDate?: string;
    pieEndDate?: string;
}
