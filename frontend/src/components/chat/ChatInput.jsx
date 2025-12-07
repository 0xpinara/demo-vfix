// ChatInput.jsx
import React, { useRef } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Paperclip, Send, X } from "lucide-react";

const ChatInput = ({
  input,
  setInput,
  busy,
  attachedImages,
  handleImageUpload,
  removeImage,
  onSubmit,
}) => {
  const fileInputRef = useRef(null);

  return (
    <div className="relative z-10 border-t border-white/10 bg-black/90 backdrop-blur-xl">
      <div className="max-w-4xl mx-auto px-6 py-4">
        {/* Attached Images */}
        {attachedImages.length > 0 && (
          <div className="mb-3 flex gap-2 flex-wrap">
            {attachedImages.map((img, idx) => (
              <div key={idx} className="relative group">
                <img
                  src={img.url}
                  alt={img.name}
                  className="w-20 h-20 object-cover rounded-xl border border-slate-700"
                />
                <button
                  type="button"
                  onClick={() => removeImage(idx)}
                  className="absolute -top-2 -right-2 p-1 bg-red-500 rounded-full shadow-lg opacity-0 group-hover:opacity-100 transition-opacity"
                >
                  <X className="h-3 w-3" />
                </button>
              </div>
            ))}
          </div>
        )}

        {/* Input Form */}
        <form onSubmit={onSubmit} className="relative">
          <Input
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Sorununuzu yazın... (örn: Çamaşır makinem hata veriyor)"
            disabled={busy}
            style={{
              color: "#ffffff",
              backgroundColor: "rgba(0, 0, 0, 0.7)",
            }}
            className="w-full pr-24 pl-14 py-7 text-lg border-white/10 placeholder:text-slate-400 focus:border-[#dc2626] focus:ring-2 focus:ring-red-500/50 rounded-2xl transition-all"
          />

          {/* Hidden File Input */}
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            multiple
            onChange={handleImageUpload}
            className="hidden"
          />

          {/* Attach Image Button */}
          <Button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            disabled={busy}
            size="sm"
            variant="ghost"
            className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white hover:bg-black/50"
          >
            <Paperclip className="h-5 w-5" />
          </Button>

          {/* Submit Button */}
          <Button
            type="submit"
            disabled={busy || (!input.trim() && attachedImages.length === 0)}
            size="sm"
            className="absolute right-3 top-1/2 -translate-y-1/2 bg-[#dc2626] hover:bg-[#b91c1c] disabled:opacity-50 disabled:cursor-not-allowed rounded-xl shadow-lg shadow-red-500/30 px-6 py-2"
          >
            <Send className="h-5 w-5" />
          </Button>
        </form>

        {/* Footer Text */}
        <p className="text-xs text-slate-500 mt-3 text-center">
          V-FIX • Demo Asistan • API Key Gerektirmez
        </p>
      </div>
    </div>
  );
};

export default ChatInput;
