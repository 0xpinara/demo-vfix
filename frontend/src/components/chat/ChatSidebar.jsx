// ChatSidebar.jsx
import React from "react";
import { Plus, Download, Wrench, Star, User } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";

const ChatSidebar = ({
  sidebarOpen,
  handleNewChat,
  downloadChat,
  sessions = [],
  currentSessionId,
  setCurrentSessionId,
  onOpenFeedback,
  feedbackBySession = {},
  user,
}) => {
  const currentMessages =
    sessions.find((s) => s.id === currentSessionId)?.messages || [];

  const navigate = useNavigate();

  const userInitials = React.useMemo(() => {
    if (!user) return "U";
    if (user.full_name) {
      const parts = user.full_name.trim().split(" ").filter(Boolean);
      if (parts.length === 1) return parts[0][0]?.toUpperCase() || "U";
      return `${parts[0][0] || ""}${parts[parts.length - 1][0] || ""}`.toUpperCase();
    }
    if (user.username) return user.username[0]?.toUpperCase() || "U";
    if (user.email) return user.email[0]?.toUpperCase() || "U";
    return "U";
  }, [user]);

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
                <div className="mt-3 flex items-center justify-between">
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={(e) => {
                      e.stopPropagation();
                      onOpenFeedback?.(session.id);
                    }}
                    className="border-slate-700 text-slate-200 hover:bg-slate-700/70"
                  >
                    <Star className="h-4 w-4 mr-2" />
                    Değerlendir
                  </Button>
                  {feedbackBySession[session.id]?.rating ? (
                    <span className="text-xs text-amber-300">
                      {feedbackBySession[session.id].rating}/5
                    </span>
                  ) : null}
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

        {/* User quick access */}
        <Button
          variant="outline"
          className="w-full justify-start gap-3 border-slate-700 hover:bg-slate-800 text-slate-200"
          onClick={() => navigate("/dashboard")}
        >
          <div className="h-9 w-9 rounded-full bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center text-white font-semibold">
            {userInitials}
          </div>
          <div className="flex flex-col text-left">
            <span className="text-sm font-semibold truncate">
              {user?.full_name || user?.username || user?.email || "Kullanıcı"}
            </span>
            <span className="text-xs text-slate-400">Profil & Dashboard</span>
          </div>
          <User className="h-4 w-4 ml-auto text-slate-400" />
        </Button>
      </div>
    </div>
  );
};

export default ChatSidebar;
