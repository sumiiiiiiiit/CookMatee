import React from 'react';

export default function ConversationItem({ partner, recipe, lastMessage, user, activeChat, setActiveChat, formatRelTime }) {
    const isMe = lastMessage?.senderId?.toString() === user?._id?.toString();
    const isActive = activeChat?.partner?._id === partner._id && activeChat?.recipe?._id === recipe?._id;
    
    const isChef = recipe && (recipe.user === partner._id || recipe.user?._id === partner._id);
    const prefix = recipe ? (isChef ? 'Chef' : '') : '';

    return (
        <li key={`${partner._id}_${recipe?._id || "no-recipe"}`}>
            <button
                onClick={() => setActiveChat({ partner, recipe })}
                className={`w-full text-left px-4 py-3.5 flex items-center gap-3.5 transition-colors border-b border-gray-50
                    ${isActive ? 'bg-[#f0f2f5]' : 'hover:bg-[#f5f6f8]'}`}
            >
                {/* Avatar */}
                <div className="relative flex-shrink-0">
                    <div className="w-12 h-12 rounded-full bg-gradient-to-br from-violet-500 to-indigo-600 text-white font-extrabold text-lg flex items-center justify-center shadow-sm">
                        {partner.name?.charAt(0).toUpperCase()}
                    </div>
                    {/* Online indicator placeholder */}
                    <span className="absolute bottom-0 right-0 w-3 h-3 bg-emerald-400 rounded-full border-2 border-white" />
                </div>

                {/* Info */}
                <div className="flex-grow min-w-0">
                    <div className="flex justify-between items-baseline gap-2">
                        <span className="font-bold text-gray-900 text-sm truncate">
                            {prefix && <span className="text-violet-600 font-extrabold mr-1">{prefix}</span>}
                            {partner.name}
                        </span>
                        <span className="text-[10px] text-gray-400 flex-shrink-0 font-medium tracking-tight">
                            {formatRelTime(lastMessage?.timestamp)}
                        </span>
                    </div>
                    {recipe && <p className="text-xs text-slate-500 font-medium truncate mt-0.5 tracking-tight">{recipe.title}</p>}
                    <p className="text-xs text-gray-500 truncate mt-0.5 font-medium">
                        {lastMessage
                            ? (isMe
                                ? <span><span className="text-gray-400">You: </span>{lastMessage.message}</span>
                                : lastMessage.message)
                            : <span className="italic text-gray-400">No messages yet</span>
                        }
                    </p>
                </div>
            </button>
        </li>
    );
}
