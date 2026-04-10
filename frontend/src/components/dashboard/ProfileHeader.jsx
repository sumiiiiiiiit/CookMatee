import React from 'react';

const ProfileHeader = ({ user, isEditing, newName, setNewName, setIsEditing, handleUpdateProfile, updateLoading }) => {
    return (
        <>
            <div className="bg-gradient-to-r from-primary to-indigo-600 h-32 relative">
                <div className="absolute -bottom-16 left-1/2 -translate-x-1/2">
                    <div className="w-32 h-32 bg-white rounded-full p-2 shadow-lg">
                        <div className="w-full h-full bg-pink-500 rounded-full flex items-center justify-center text-5xl font-bold text-white uppercase border-4 border-white">
                            {user?.name?.[0]}
                        </div>
                    </div>
                </div>
            </div>

            <div className="pt-20 px-8 text-center pb-8 border-b border-gray-50">
                {isEditing ? (
                    <div className="flex flex-col items-center space-y-4">
                        <input
                            type="text"
                            value={newName}
                            onChange={(e) => setNewName(e.target.value)}
                            className="text-3xl font-bold text-gray-800 text-center border-b-2 border-primary outline-none bg-transparent px-4 py-1"
                            autoFocus
                        />
                        <div className="flex space-x-3">
                            <button onClick={handleUpdateProfile} disabled={updateLoading} className="bg-green-500 hover:bg-green-600 text-white px-6 py-2 rounded-xl text-sm font-bold transition disabled:opacity-50">{updateLoading ? 'Saving...' : 'Save'}</button>
                            <button onClick={() => { setIsEditing(false); setNewName(user.name); }} className="bg-gray-100 hover:bg-gray-200 text-gray-600 px-6 py-2 rounded-xl text-sm font-bold transition">Cancel</button>
                        </div>
                    </div>
                ) : (
                    <div className="group relative inline-block">
                        <h1 className="text-4xl font-extrabold text-[#1a1a1a] mb-2">{user?.name}</h1>
                        <button onClick={() => setIsEditing(true)} className="absolute -right-12 top-2 p-2.5 bg-gray-50 text-primary hover:bg-primary hover:text-white rounded-full transition-all shadow-md group-hover:scale-110">
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" /></svg>
                        </button>
                    </div>
                )}
                <p className="text-gray-400 font-medium text-lg">{user?.email}</p>
            </div>
        </>
    );
};

export default ProfileHeader;
