import { motion } from "framer-motion";
import { MessageSquare, Plus, Trash2, X } from "lucide-react";
import { format } from "date-fns";

export const ChatSidebar = ({
    sessions,
    currentSessionId,
    onSelectSession,
    onNewChat,
    onDeleteSession,
    isOpen,
    onClose
}) => {
    return (
        <motion.div
            initial={{ x: -300, opacity: 0 }}
            animate={{ x: isOpen ? 0 : -300, opacity: isOpen ? 1 : 0 }}
            transition={{ type: "spring", damping: 20 }}
            className={`fixed md:relative inset-y-0 left-0 w-72 bg-sec border-r border-[var(--border)] z-40 flex flex-col ${isOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0 md:w-0 md:hidden'} md:flex md:w-72 md:translate-x-0`}
        >
            {/* Header */}
            <div className="p-4 border-b border-[var(--border)] flex items-center justify-between">
                <button
                    onClick={onNewChat}
                    className="flex-1 flex items-center justify-center gap-2 px-4 py-2 bg-primary hover:bg-[var(--bg-ter)] border border-[var(--border)] rounded-lg transition-colors txt text-sm font-medium"
                >
                    <Plus className="w-4 h-4" />
                    New Chat
                </button>
                <button
                    onClick={onClose}
                    className="md:hidden p-2 text-gray-500 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg"
                >
                    <X className="w-5 h-5" />
                </button>
            </div>

            {/* Session List */}
            <div className="flex-1 overflow-y-auto p-2 space-y-1">
                {sessions.length === 0 ? (
                    <div className="text-center p-4 txt-dim text-sm">
                        No history yet. Start a new chat!
                    </div>
                ) : (
                    sessions.map((session) => (
                        <div
                            key={session._id}
                            className={`group flex items-center gap-3 p-3 rounded-lg cursor-pointer transition-all ${currentSessionId === session._id
                                    ? "bg-[var(--active-red)] border border-[var(--txt-red)]"
                                    : "hover:bg-[var(--bg-ter)] border border-transparent"
                                }`}
                            onClick={() => onSelectSession(session._id)}
                        >
                            <MessageSquare className={`w-4 h-4 flex-shrink-0 ${currentSessionId === session._id ? "txt-red" : "txt-dim"
                                }`} />

                            <div className="flex-1 min-w-0">
                                <h3 className={`text-sm font-medium truncate ${currentSessionId === session._id ? "txt" : "txt-dim"
                                    }`}>
                                    {session.title || "New Chat"}
                                </h3>
                                <p className="text-xs txt-disabled truncate">
                                    {session.updatedAt ? format(new Date(session.lastMessageAt || session.updatedAt), 'MMM d, h:mm a') : ''}
                                </p>
                            </div>

                            <button
                                onClick={(e) => {
                                    e.stopPropagation();
                                    onDeleteSession(session._id);
                                }}
                                className="opacity-0 group-hover:opacity-100 p-1.5 hover:bg-red-100 hover:text-red-500 rounded-md transition-all"
                                title="Delete Chat"
                            >
                                <Trash2 className="w-3 h-3" />
                            </button>
                        </div>
                    ))
                )}
            </div>

            {/* Footer / User Info could go here */}
            <div className="p-4 border-t border-[var(--border)]">
                <p className="text-xs txt-dim text-center">Studia AI v1.0</p>
            </div>
        </motion.div>
    );
};
