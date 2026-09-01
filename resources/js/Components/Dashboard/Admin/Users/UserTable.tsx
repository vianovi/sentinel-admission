import React from 'react';

type UserData = {
    id: number;
    identifier: string;
    name: string;
    email: string;
    role: string;
    whatsapp_number: string | null;
    is_active: boolean;
    account_status: string;
    program_choice: string | null;
    created_at: string;
};

type Props = {
    users: UserData[];
    processingId: number | null;
    handleToggleStatus: (user: UserData) => void;
};

const getRoleBadgeStyle = (role: string) => {
    switch (role) {
        case 'admin':
            return 'bg-purple-100 text-purple-800 border-purple-200 dark:bg-purple-500/20 dark:text-purple-300 dark:border-purple-500/30';
        case 'staff':
            return 'bg-indigo-100 text-indigo-800 border-indigo-200 dark:bg-indigo-500/20 dark:text-indigo-300 dark:border-indigo-500/30';
        case 'student':
            return 'bg-blue-100 text-blue-800 border-blue-200 dark:bg-blue-500/20 dark:text-blue-300 dark:border-blue-500/30';
        default:
            return 'bg-amber-100 text-amber-800 border-amber-200 dark:bg-amber-500/20 dark:text-amber-300 dark:border-amber-500/30';
    }
};

export default function UserTable({ users, processingId, handleToggleStatus }: Props) {
    return (
        <div className="overflow-x-auto">
            <table className="w-full text-left text-sm border-collapse">
                <thead>
                    <tr className="border-b border-slate-200 bg-slate-50/80 text-slate-600 dark:border-slate-800 dark:bg-slate-800/50 dark:text-slate-300 font-semibold">
                        <th className="py-3.5 px-5">Pengguna & ID</th>
                        <th className="py-3.5 px-5">Email & WhatsApp</th>
                        <th className="py-3.5 px-5">Peran</th>
                        <th className="py-3.5 px-5">Status Akun</th>
                        <th className="py-3.5 px-5">Waktu Daftar</th>
                        <th className="py-3.5 px-5 text-center">Aksi Direct</th>
                    </tr>
                </thead>
                <tbody className="divide-y divide-slate-200 dark:divide-slate-800">
                    {users.length === 0 ? (
                        <tr>
                            <td colSpan={6} className="py-12 text-center text-slate-500 dark:text-slate-400">
                                <i className="fa-solid fa-users-slash text-3xl mb-3 opacity-40" />
                                <p className="text-sm font-medium">Tidak ada data pengguna yang ditemukan.</p>
                            </td>
                        </tr>
                    ) : (
                        users.map((user) => (
                            <tr key={user.id} className="hover:bg-slate-50/80 dark:hover:bg-slate-800/40 transition-colors">
                                <td className="py-4 px-5">
                                    <div className="flex items-center gap-3.5">
                                        <div className="w-10 h-10 shrink-0 rounded-xl bg-amber-500/10 text-amber-600 dark:text-amber-400 flex items-center justify-center font-display font-bold text-sm border border-amber-500/20">
                                            {user.name.substring(0, 2).toUpperCase()}
                                        </div>
                                        <div>
                                            <div className="font-bold text-slate-900 dark:text-white text-base">
                                                {user.name}
                                            </div>
                                            <span className="inline-block mt-0.5 text-xs font-mono font-semibold px-2 py-0.5 rounded bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 border border-slate-200 dark:border-slate-700">
                                                #{user.identifier}
                                            </span>
                                        </div>
                                    </div>
                                </td>
                                <td className="py-4 px-5">
                                    <div className="text-slate-800 dark:text-slate-200 font-semibold text-sm">{user.email}</div>
                                    <div className="text-xs text-slate-500 dark:text-slate-400 flex items-center gap-2 mt-1">
                                        {user.whatsapp_number ? (
                                            <span className="flex items-center gap-1.5 font-medium text-emerald-600 dark:text-emerald-400">
                                                <i className="fa-brands fa-whatsapp text-sm" />
                                                {user.whatsapp_number}
                                            </span>
                                        ) : (
                                            <span className="italic text-slate-400">Tidak ada WA</span>
                                        )}
                                        {user.program_choice && (
                                            <span className="text-slate-400 font-medium">• {user.program_choice}</span>
                                        )}
                                    </div>
                                </td>
                                <td className="py-4 px-5">
                                    <span className={`inline-flex items-center px-3 py-1 rounded-lg text-xs font-bold uppercase tracking-wide border ${getRoleBadgeStyle(user.role)}`}>
                                        {user.role}
                                    </span>
                                </td>
                                <td className="py-4 px-5">
                                    <span className={`inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-semibold border ${
                                        user.account_status === 'aktif'
                                            ? 'bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-500/10 dark:text-emerald-300 dark:border-emerald-500/20'
                                            : user.account_status === 'menunggu_verifikasi'
                                            ? 'bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-500/10 dark:text-amber-300 dark:border-amber-500/20'
                                            : 'bg-rose-50 text-rose-700 border-rose-200 dark:bg-rose-500/10 dark:text-rose-300 dark:border-rose-500/20'
                                    }`}>
                                        <span className={`w-2 h-2 rounded-full ${
                                            user.account_status === 'aktif' ? 'bg-emerald-500 animate-pulse'
                                            : user.account_status === 'menunggu_verifikasi' ? 'bg-amber-500'
                                            : 'bg-rose-500'
                                        }`} />
                                        {user.account_status === 'aktif' ? 'Aktif'
                                         : user.account_status === 'menunggu_verifikasi' ? 'Verifikasi'
                                         : 'Suspend'}
                                    </span>
                                </td>
                                <td className="py-4 px-5 text-slate-600 dark:text-slate-400 text-xs font-medium">
                                    {user.created_at}
                                </td>
                                <td className="py-4 px-5 text-center">
                                    <div className="inline-flex items-center justify-center gap-2">
                                        <button 
                                            onClick={() => alert('Fitur Detail dalam pengembangan')}
                                            className="px-3 py-1.5 rounded-lg text-xs font-semibold text-slate-700 dark:text-slate-200 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 transition-colors border border-slate-200 dark:border-slate-700 flex items-center gap-1.5 shadow-sm"
                                            title="Lihat Detail Pengguna"
                                        >
                                            <i className="fa-solid fa-eye text-xs text-slate-500" />
                                            <span>Detail</span>
                                        </button>
                                        <button 
                                            onClick={() => alert('Fitur Edit dalam pengembangan')}
                                            className="px-3 py-1.5 rounded-lg text-xs font-semibold text-amber-700 dark:text-amber-300 bg-amber-50 dark:bg-amber-500/10 hover:bg-amber-100 dark:hover:bg-amber-500/20 transition-colors border border-amber-200 dark:border-amber-500/20 flex items-center gap-1.5 shadow-sm"
                                            title="Edit Data Pengguna"
                                        >
                                            <i className="fa-solid fa-pen text-xs" />
                                            <span>Edit</span>
                                        </button>
                                        <button
                                            onClick={() => handleToggleStatus(user)}
                                            disabled={processingId === user.id}
                                            className={`p-1.5 rounded-lg text-xs font-semibold border transition-colors ${
                                                user.is_active
                                                    ? 'text-rose-600 dark:text-rose-400 bg-rose-50 dark:bg-rose-500/10 border-rose-200 dark:border-rose-500/20 hover:bg-rose-100 dark:hover:bg-rose-500/20'
                                                    : 'text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-500/10 border-emerald-200 dark:border-emerald-500/20 hover:bg-emerald-100 dark:hover:bg-emerald-500/20'
                                            } ${processingId === user.id ? 'opacity-50 cursor-not-allowed' : ''}`}
                                            title={user.is_active ? "Tangguhkan Akun (Suspend)" : "Aktifkan Akun"}
                                        >
                                            {processingId === user.id ? (
                                                <i className="fa-solid fa-spinner fa-spin text-xs" />
                                            ) : (
                                                <i className={`fa-solid ${user.is_active ? 'fa-user-slash' : 'fa-user-check'} text-xs`} />
                                            )}
                                        </button>
                                        <button 
                                            onClick={() => alert('Fitur Hapus dalam pengembangan')}
                                            className="p-1.5 rounded-lg text-xs text-slate-400 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-500/10 transition-colors"
                                            title="Hapus Akun"
                                        >
                                            <i className="fa-solid fa-trash-can text-xs" />
                                        </button>
                                    </div>
                                </td>
                            </tr>
                        ))
                    )}
                </tbody>
            </table>
        </div>
    );
}
