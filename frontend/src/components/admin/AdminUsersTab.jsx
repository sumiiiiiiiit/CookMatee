import React from 'react';
import { Trash2, ShieldCheck, User as UserIcon } from 'lucide-react';

const AdminUsersTab = ({ users, onDeleteUser }) => {
    return (
        <div className="overflow-x-auto custom-scrollbar">
            <table className="w-full text-left border-collapse min-w-[700px]">
                <thead>
                    <tr className="bg-gray-50/70 dark:bg-black/10">
                        {['User', 'Email', 'Joined', 'Role', 'Actions'].map((h, i) => (
                            <th key={h} className={`px-7 py-4 text-[10px] font-black text-gray-400 uppercase tracking-widest ${i === 4 ? 'text-right' : ''}`}>
                                {h}
                            </th>
                        ))}
                    </tr>
                </thead>
                <tbody className="divide-y divide-gray-50 dark:divide-gray-800/60">
                    {users.length === 0 ? (
                        <tr>
                            <td colSpan={5} className="px-8 py-20 text-center text-gray-400 text-sm font-medium">
                                No users found.
                            </td>
                        </tr>
                    ) : users.map(u => {
                        const initials = u.name?.split(' ').map(n => n[0]).slice(0, 2).join('').toUpperCase() || '?';
                        const avatarColors = ['bg-blue-500', 'bg-violet-500', 'bg-emerald-500', 'bg-amber-500', 'bg-rose-500', 'bg-indigo-500'];
                        const avatarColor = avatarColors[(u.name?.charCodeAt(0) || 0) % avatarColors.length];
                        const joined = u.createdAt ? new Date(u.createdAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }) : '—';
                        
                        return (
                            <tr key={u._id} className="group hover:bg-gray-50/60 dark:hover:bg-gray-800/40 transition duration-150">
                                <td className="px-7 py-4">
                                    <div className="flex items-center gap-3">
                                        <div className={`w-9 h-9 rounded-full ${avatarColor} flex items-center justify-center text-[11px] font-extrabold text-white shrink-0`}>
                                            {initials}
                                        </div>
                                        <span className="font-bold text-gray-800 dark:text-gray-200 text-sm">{u.name}</span>
                                    </div>
                                </td>
                                <td className="px-7 py-4 text-sm text-gray-500 dark:text-gray-400 font-medium">{u.email}</td>
                                <td className="px-7 py-4 text-xs text-gray-400 font-semibold">{joined}</td>
                                <td className="px-7 py-4">
                                    <span className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[10px] font-black uppercase tracking-wider ${u.role === 'admin' ? 'bg-violet-100 dark:bg-violet-900/30 text-violet-700 dark:text-violet-300' : 'bg-gray-100 dark:bg-gray-800 text-gray-500 dark:text-gray-400'}`}>
                                        {u.role === 'admin' ? <ShieldCheck size={11} /> : <UserIcon size={11} />}
                                        {u.role}
                                    </span>
                                </td>
                                <td className="px-7 py-4 text-right">
                                    {u.role !== 'admin' ? (
                                        <button onClick={() => onDeleteUser(u._id)} className="inline-flex items-center gap-1.5 text-red-500 hover:text-white hover:bg-red-500 px-3 py-2 rounded-xl font-bold text-xs transition duration-200 opacity-0 group-hover:opacity-100">
                                            <Trash2 size={13} /> Delete
                                        </button>
                                    ) : (
                                        <span className="text-xs text-gray-300 dark:text-gray-700 font-medium px-3 py-2">Protected</span>
                                    )}
                                </td>
                            </tr>
                        );
                    })}
                </tbody>
            </table>
        </div>
    );
};

export default AdminUsersTab;
