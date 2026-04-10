import React, { useEffect } from 'react';
import { CheckCircle, XCircle, AlertTriangle, Info, X } from 'lucide-react';

const ICONS = {
    success: <CheckCircle size={18} className="text-emerald-500" />,
    error:   <XCircle    size={18} className="text-red-500" />,
    warning: <AlertTriangle size={18} className="text-amber-500" />,
    info:    <Info       size={18} className="text-blue-500" />,
};

const BG = {
    success: 'border-emerald-100 dark:border-emerald-900/30',
    error:   'border-red-100 dark:border-red-900/30',
    warning: 'border-amber-100 dark:border-amber-900/30',
    info:    'border-blue-100 dark:border-blue-900/30',
};

/* Single toast item */
const Toast = ({ id, type = 'info', message, onDismiss }) => {
    useEffect(() => {
        const t = setTimeout(() => onDismiss(id), 4000);
        return () => clearTimeout(t);
    }, [id, onDismiss]);

    return (
        <div className={`flex items-start gap-3 bg-white dark:bg-[#1e1e1e] border ${BG[type]} rounded-2xl shadow-xl px-5 py-4 min-w-[280px] max-w-sm animate-slideUp`}>
            <span className="mt-0.5 shrink-0">{ICONS[type]}</span>
            <p className="text-sm font-semibold text-gray-800 dark:text-gray-100 flex-1 leading-snug">{message}</p>
            <button onClick={() => onDismiss(id)} className="text-gray-300 hover:text-gray-500 dark:hover:text-gray-300 transition mt-0.5 shrink-0">
                <X size={14} />
            </button>
        </div>
    );
};

/* Toast container rendered at root level */
export const ToastContainer = ({ toasts, onDismiss }) => (
    <div className="fixed bottom-6 right-6 z-[200] flex flex-col gap-3 items-end">
        {toasts.map(t => (
            <Toast key={t.id} {...t} onDismiss={onDismiss} />
        ))}
    </div>
);

/* Hook to manage toasts */
export const useToast = () => {
    const [toasts, setToasts] = React.useState([]);

    const addToast = React.useCallback((message, type = 'info') => {
        const id = Date.now() + Math.random();
        setToasts(prev => [...prev, { id, message, type }]);
    }, []);

    const dismiss = React.useCallback((id) => {
        setToasts(prev => prev.filter(t => t.id !== id));
    }, []);

    const toast = {
        success: (msg) => addToast(msg, 'success'),
        error:   (msg) => addToast(msg, 'error'),
        warning: (msg) => addToast(msg, 'warning'),
        info:    (msg) => addToast(msg, 'info'),
    };

    return { toasts, toast, dismiss };
};
