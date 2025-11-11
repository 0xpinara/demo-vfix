import React from "react";

export default function MessageBubble({ msg }) {
  return (
    <div className="flex gap-4">
      <div
        className={`flex-shrink-0 w-10 h-10 rounded-xl flex items-center justify-center shadow-lg ${
          msg.role === "assistant"
            ? "bg-gradient-to-br from-indigo-500 to-purple-600 shadow-indigo-500/50"
            : "bg-gradient-to-br from-slate-700 to-slate-600 shadow-slate-500/50"
        }`}
      >
        {msg.role === "assistant" ? (
          <span className="text-white font-bold">AI</span>
        ) : (
          <span className="text-white font-bold">Siz</span>
        )}
      </div>
      <div className="flex-1 space-y-3">
        <div className="font-semibold text-sm text-slate-300">
          {msg.role === "assistant" ? "V-FIX" : "Siz"}
        </div>
        <div className="text-slate-100 leading-relaxed whitespace-pre-wrap">{msg.content}</div>
        {msg.images && msg.images.length > 0 && (
          <div className="flex gap-2 flex-wrap">
            {msg.images.map((img, idx) => (
              <div key={idx} className="relative group">
                <img
                  src={img.url}
                  alt={img.name}
                  className="w-32 h-32 object-cover rounded-xl border border-slate-700 shadow-lg"
                />
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
