import React from 'react';

const AdminUsersTab = ({ users, onDeleteUser }) => {
    return (
        <div className="bg-white dark:bg-[#1a1a1a] rounded-3xl shadow-sm border border-gray-100 dark:border-gray-800 overflow-hidden">
            <div className="p-6 border-b border-gray-100 dark:border-gray-800 flex justify-between items-center">
                <h3 className="text-lg font-bold dark:text-white">User Directory</h3>
            </div>
            <div className="overflow-x-auto custom-scrollbar">
                <table className="w-full text-left border-collapse min-w-[800px]">
                    <thead className="bg-gray-50/50 dark:bg-black/10 text-xs text-gray-400 uppercase tracking-widest font-bold">
                        <tr>
                            <th className="px-8 py-5">User</th>
                            <th className="px-8 py-5">Email</th>
                            <th className="px-8 py-5">Role</th>
                            <th className="px-8 py-5 text-right">Actions</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100 dark:divide-gray-800">
                        {users.map(u => (
                            <tr key={u._id} className="hover:bg-gray-50/50 dark:hover:bg-gray-800/50 transition duration-200">
                                <td className="px-8 py-5 font-bold text-gray-800 dark:text-gray-200">{u.name}</td>
                                <td className="px-8 py-5 text-gray-500 font-medium">{u.email}</td>
                                <td className="px-8 py-5">
                                    <span className={`px-3 py-1.5 rounded-lg text-xs font-black uppercase tracking-wider ${u.role === 'admin' ? 'bg-purple-100 text-purple-700' : 'bg-gray-100 text-gray-500 dark:bg-gray-800 dark:text-gray-400'}`}>
                                        {u.role}
                                    </span>
                                </td>
                                <td className="px-8 py-5 text-right">
                                    {u.role !== 'admin' && (
                                        <button
                                            onClick={() => onDeleteUser(u._id)}
                                            className="text-red-500 hover:text-red-700 hover:bg-red-50 dark:hover:bg-red-900/20 px-4 py-2 rounded-xl font-bold text-sm transition"
                                        >
                                            Delete <span className="hidden sm:inline">User</span>
                                        </button>
                                    )}
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </div>
    );
};

export default AdminUsersTab;
