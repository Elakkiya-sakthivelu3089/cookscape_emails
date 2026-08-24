import React, { useState } from 'react';
import { ChatSidebar } from './ChatSidebar.js';
import { ChatWindow } from './ChatWindow.js';
import { NewRoomModal } from './NewRoomModal.js';

export const ChatLayout: React.FC = () => {
  const [isNewRoomOpen, setIsNewRoomOpen] = useState(false);

  return (
    <div className="h-full flex overflow-hidden bg-slate-50 dark:bg-slate-950 transition-colors duration-200">
      {/* Channels & Client Projects Sidebar */}
      <ChatSidebar onOpenNewRoom={() => setIsNewRoomOpen(true)} />

      {/* Main Chat Conversation View */}
      <main className="flex-1 h-full min-w-0">
        <ChatWindow />
      </main>

      {/* Modal for creating new channel / project room */}
      <NewRoomModal
        isOpen={isNewRoomOpen}
        onClose={() => setIsNewRoomOpen(false)}
      />
    </div>
  );
};
