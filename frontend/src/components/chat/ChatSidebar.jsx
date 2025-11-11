// ChatSidebar.jsx
import React from "react";
import { Plus, Download, Wrench } from "lucide-react";
import { Button } from "@/components/ui/button";

const ChatSidebar = ({
  sidebarOpen,
  handleNewChat,
  downloadChat,
  sessions = [],
  currentSessionId,
  setCurrentSessionId,
}) => {
  const currentMessages =
    sessions.find((s) => s.id === currentSessionId)?.messages || [];

  return (
    <div
      className={`${
        sidebarOpen ? "w-72" : "w-0"
      } transition-all duration-300 bg-slate-900/50 border-r border-slate-800/50 backdrop-blur-xl flex flex-col overflow-hidden`}
    >
      {/* Top Section: New Chat */}
      <div className="p-4 border-b border-slate-800/50">
        <Button
          onClick={handleNewChat}
          className="w-full justify-start gap-3 bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 text-white shadow-lg shadow-indigo-500/20 transition-all hover:shadow-indigo-500/40"
        >
          <Plus className="h-5 w-5" />
          Yeni Sohbet
        </Button>
      </div>

      {/* Recent Chats */}
      <div className="flex-1 overflow-y-auto p-4">
        <div className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-3 px-2">
          Son Sohbetler
        </div>
        <div className="space-y-2">
          {sessions.length > 0 ? (
            sessions.map((session) => (
              <div
                key={session.id}
                onClick={() => setCurrentSessionId(session.id)}
                className={`p-3 rounded-xl border hover:bg-slate-800 transition-all cursor-pointer ${
                  currentSessionId === session.id
                    ? "bg-slate-700/50"
                    : "bg-slate-800/50"
                }`}
              >
                <div className="text-sm text-white font-medium truncate">
                  {session.title || "Yeni Sohbet"}
                </div>
                <div className="text-xs text-slate-400 mt-1 truncate">
                  {session.messages[session.messages.length - 1]?.content
                    .substring(0, 40) || ""}
                  ...
                </div>
              </div>
            ))
          ) : (
            <div className="text-slate-400 text-sm px-2">Hiç sohbet yok</div>
          )}
        </div>
      </div>

      {/* Bottom Section */}
      <div className="p-4 border-t border-slate-800/50 space-y-3">
        <Button
          onClick={() => downloadChat(currentSessionId)}
          disabled={currentMessages.length === 0}
          variant="outline"
          className="w-full justify-start gap-3 border-slate-700 hover:bg-slate-800 text-slate-300"
        >
          <Download className="h-4 w-4" />
          Sohbeti İndir
        </Button>

        <div className="flex items-center gap-3 p-4 rounded-xl bg-gradient-to-br from-indigo-500/10 to-purple-500/10 border border-indigo-500/20">
          <div className="p-2 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-xl shadow-lg shadow-indigo-500/50">
            <Wrench className="h-5 w-5" />
          </div>
          <div className="flex-1 min-w-0">
            <div className="font-semibold text-white">V-FIX</div>
            <div className="text-xs text-slate-400">AI Teknisyen Asistanı</div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ChatSidebar;
