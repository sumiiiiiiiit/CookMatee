import React from 'react';

const AllergySection = ({ user, userAllergies, setUserAllergies, isEditing, setIsEditing, ALLERGEN_OPTIONS }) => {
    const toggle = (a) => {
        if (userAllergies.includes(a)) setUserAllergies(userAllergies.filter(x => x !== a));
        else setUserAllergies([...userAllergies, a]);
    };

    return (
        <div className="bg-gray-50 p-6 rounded-3xl border border-gray-100">
            <div className="flex justify-between items-center mb-4">
                <p className="text-gray-400 text-xs font-bold uppercase tracking-wider">My Allergies</p>
                {!isEditing && <button onClick={() => setIsEditing(true)} className="text-[10px] font-bold text-primary hover:underline">Edit</button>}
            </div>
            {isEditing ? (
                <div className="flex flex-wrap gap-2">
                    {ALLERGEN_OPTIONS.map(a => (
                        <button key={a} onClick={() => toggle(a)} className={`px-3 py-1.5 rounded-full text-[10px] font-bold transition border ${userAllergies.includes(a) ? 'bg-primary text-white border-primary' : 'bg-white text-gray-500 border-gray-200'}`}>
                            {a.replace('_', ' ')}
                        </button>
                    ))}
                </div>
            ) : (
                <div className="flex flex-wrap gap-2">
                    {user?.allergies?.length > 0 ? user.allergies.map(a => <span key={a} className="px-3 py-1 bg-red-50 text-red-500 rounded-full text-[10px] font-bold border border-red-100 uppercase tracking-tighter">{a.replace('_', ' ')}</span>) : <p className="text-gray-400 text-xs italic">No allergies listed.</p>}
                </div>
            )}
        </div>
    );
};

export default AllergySection;
