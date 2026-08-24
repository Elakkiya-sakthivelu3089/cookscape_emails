import React from 'react';
import {
  Hash,
  MessageSquare,
  Briefcase,
  Plus,
  Lock,
  User,
  Users,
} from 'lucide-react';
import { useChat } from '../../context/ChatContext.js';
import { useAuth } from '../../context/AuthContext.js';

interface ChatSidebarProps {
  onOpenNewRoom: () => void;
}

export const ChatSidebar: React.FC<ChatSidebarProps> = ({ onOpenNewRoom }) => {
  const { rooms, activeRoomId, setActiveRoomId, isLoadingRooms } = useChat();
  const { user, onlineUserIds } = useAuth();

  const channels = rooms.filter((r) => r.type === 'CHANNEL');
  const clientProjects = rooms.filter((r) => r.type === 'CLIENT_PROJECT');
  const directMessages = rooms.filter((r) => r.type === 'DIRECT');

  return (
    <aside className="w-64 lg:w-72 bg-white dark:bg-slate-900 border-r border-slate-200 dark:border-slate-800 flex flex-col h-full select-none shrink-0 transition-colors duration-200">
      {/* Sidebar Header */}
      <div className="p-3.5 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between bg-slate-50 dark:bg-slate-950/40">
        <div className="flex items-center space-x-2">
          <MessageSquare className="w-4 h-4 text-red-600 dark:text-red-400" />
          <span className="font-bold text-xs text-slate-900 dark:text-white uppercase tracking-wider">
            Cookscape Messenger
          </span>
        </div>
        <button
          onClick={onOpenNewRoom}
          className="p-1.5 rounded-lg bg-red-500/15 text-red-700 dark:text-red-400 hover:bg-red-500/25 border border-red-500/30 transition-colors"
          title="New Channel or Client Project Room"
        >
          <Plus className="w-3.5 h-3.5" />
        </button>
      </div>

      {/* Room Lists */}
      <div className="flex-1 overflow-y-auto p-3 space-y-6 text-xs">
        {/* 1. Client Project Portals */}
        {clientProjects.length > 0 && (
          <div className="space-y-1">
            <div className="flex items-center justify-between px-2 py-1 text-[11px] font-semibold text-red-700 dark:text-red-400 uppercase tracking-wider">
              <div className="flex items-center space-x-1.5">
                <Briefcase className="w-3.5 h-3.5" />
                <span>Client Projects</span>
              </div>
              <span className="text-[10px] text-slate-400 dark:text-slate-500 font-mono">
                {clientProjects.length}
              </span>
            </div>

            <div className="space-y-0.5">
              {clientProjects.map((room) => {
                const isActive = activeRoomId === room.id;

                return (
                  <button
                    key={room.id}
                    onClick={() => setActiveRoomId(room.id)}
                    className={`w-full text-left p-2 rounded-xl transition-all flex flex-col space-y-0.5 ${
                      isActive
                        ? 'bg-red-500/15 text-red-700 dark:text-red-300 font-semibold border border-red-500/30 shadow-sm'
                        : 'text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800/60'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <span className="truncate text-xs font-semibold text-slate-900 dark:text-white">
                        {room.name}
                      </span>
                    </div>
                    <div className="flex items-center space-x-2 text-[10px] text-slate-500 dark:text-slate-400">
                      {room.projectCode && (
                        <span className="font-mono text-red-700 dark:text-red-400">{room.projectCode}</span>
                      )}
                      {room.clientName && (
                        <span className="text-slate-400 truncate">• {room.clientName}</span>
                      )}
                    </div>
                  </button>
                );
              })}
            </div>
          </div>
        )}

        {/* 2. Company Channels */}
        <div className="space-y-1">
          <div className="flex items-center justify-between px-2 py-1 text-[11px] font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
            <div className="flex items-center space-x-1.5">
              <Hash className="w-3.5 h-3.5 text-slate-400 dark:text-slate-500" />
              <span>Studio Channels</span>
            </div>
          </div>

          <div className="space-y-0.5">
            {channels.map((room) => {
              const isActive = activeRoomId === room.id;

              return (
                <button
                  key={room.id}
                  onClick={() => setActiveRoomId(room.id)}
                  className={`w-full text-left px-2.5 py-1.5 rounded-xl transition-all flex items-center space-x-2 ${
                    isActive
                      ? 'bg-red-500/15 text-red-700 dark:text-red-300 font-semibold border border-red-500/30 shadow-sm'
                      : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200 hover:bg-slate-200/50 dark:hover:bg-slate-800/60'
                  }`}
                >
                  <Hash className="w-3.5 h-3.5 text-slate-400 dark:text-slate-500 shrink-0" />
                  <span className="truncate">{room.name}</span>
                </button>
              );
            })}
          </div>
        </div>

        {/* 3. Direct Messages */}
        <div className="space-y-1">
          <div className="flex items-center justify-between px-2 py-1 text-[11px] font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
            <div className="flex items-center space-x-1.5">
              <Users className="w-3.5 h-3.5 text-slate-400 dark:text-slate-500" />
              <span>Colleagues & DMs</span>
            </div>
          </div>

          <div className="space-y-0.5">
            {directMessages.length === 0 ? (
              <p className="px-2 py-1 text-[11px] text-slate-400 dark:text-slate-500">No active direct messages.</p>
            ) : (
              directMessages.map((room) => {
                const isActive = activeRoomId === room.id;
                const otherUser = room.directUser;
                const isOnline = otherUser ? onlineUserIds.includes(otherUser.id) : false;

                return (
                  <button
                    key={room.id}
                    onClick={() => setActiveRoomId(room.id)}
                    className={`w-full text-left px-2.5 py-1.5 rounded-xl transition-all flex items-center justify-between ${
                      isActive
                        ? 'bg-red-500/15 text-red-700 dark:text-red-300 font-semibold border border-red-500/30 shadow-sm'
                        : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200 hover:bg-slate-200/50 dark:hover:bg-slate-800/60'
                    }`}
                  >
                    <div className="flex items-center space-x-2 truncate">
                      <div className="relative shrink-0">
                        <div className="w-5 h-5 rounded-md bg-red-500/20 text-red-700 dark:text-red-400 font-serif font-bold text-[10px] flex items-center justify-center">
                          {room.name.charAt(0)}
                        </div>
                        <span
                          className={`absolute -bottom-0.5 -right-0.5 w-2 h-2 rounded-full border border-white dark:border-slate-900 ${
                            isOnline ? 'bg-emerald-500' : 'bg-slate-400 dark:bg-slate-600'
                          }`}
                        />
                      </div>
                      <span className="truncate">{room.name}</span>
                    </div>
                  </button>
                );
              })
            )}
          </div>
        </div>
      </div>
    </aside>
  );
};
