import React, { Component, ErrorInfo, ReactNode } from 'react';
import { AlertTriangle } from 'lucide-react';

interface Props {
    children?: ReactNode;
    fallback?: ReactNode;
    title?: string;
}

interface State {
    hasError: boolean;
    error: Error | null;
}

class ErrorBoundary extends Component<Props, State> {
    public state: State = {
        hasError: false,
        error: null
    };

    public static getDerivedStateFromError(error: Error): State {
        return { hasError: true, error };
    }

    public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
        console.error('Uncaught error:', error, errorInfo);
    }

    public render() {
        if (this.state.hasError) {
            if (this.props.fallback) {
                return this.props.fallback;
            }
            return (
                <div className="flex flex-col items-center justify-center p-6 bg-red-50 dark:bg-red-900/10 rounded-2xl border border-red-100 dark:border-red-800/30 text-center w-full h-full min-h-[150px]">
                    <AlertTriangle className="w-8 h-8 text-red-500 mb-3" />
                    <h3 className="text-sm font-semibold text-red-800 dark:text-red-400 mb-1">
                        {this.props.title || 'Gagal memuat komponen'}
                    </h3>
                    <p className="text-xs text-red-600 dark:text-red-500/70">
                        {this.state.error?.message || 'Terjadi kesalahan pada antarmuka.'}
                    </p>
                    <button
                        onClick={() => this.setState({ hasError: false, error: null })}
                        className="mt-4 px-3 py-1.5 bg-red-100 dark:bg-red-500/20 text-red-700 dark:text-red-400 rounded-lg text-xs font-medium hover:bg-red-200 dark:hover:bg-red-500/30 transition-colors"
                    >
                        Coba Lagi
                    </button>
                </div>
            );
        }

        return this.props.children;
    }
}

export default ErrorBoundary;
