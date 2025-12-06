// ChatHeader.jsx
import React from "react";
import { Menu, Bot, Star } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

const ChatHeader = ({ sidebarOpen, setSidebarOpen, onOpenFeedback, canEvaluate }) => {
  return (
    <header className="relative z-10 h-16 border-b border-slate-800/50 flex items-center justify-between px-6 bg-slate-900/30 backdrop-blur-xl">
      {/* Left Section */}
      <div className="flex items-center gap-4">
        <Button
          variant="ghost"
          size="sm"
          onClick={() => setSidebarOpen(!sidebarOpen)}
          className="text-slate-400 hover:text-white hover:bg-slate-800"
        >
          <Menu className="h-5 w-5" />
        </Button>

        <div className="flex items-center gap-3">
          <div className="p-2 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-xl shadow-lg shadow-indigo-500/50">
            <Bot className="h-5 w-5" />
          </div>
          <div>
            <span className="font-bold text-white">V-FIX AI</span>
            <div className="text-xs text-slate-400">Demo Asistan</div>
          </div>
        </div>
      </div>

      {/* Right Section */}
      <div className="flex items-center gap-3">
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={onOpenFeedback}
          disabled={!canEvaluate}
          className="border-slate-700 text-slate-200 hover:bg-slate-800"
        >
          <Star className="h-4 w-4 mr-2" />
          Sohbeti Değerlendir
        </Button>
        <Badge className="bg-green-500/20 text-green-400 border-green-500/30 px-3 py-1 flex items-center">
          <div className="w-2 h-2 bg-green-400 rounded-full mr-2 animate-pulse" />
          Hazır
        </Badge>
      </div>
    </header>
  );
};

export default ChatHeader;
