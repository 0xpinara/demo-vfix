import React, { useRef, useEffect } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { Wrench, MessageSquare, Zap } from "lucide-react";
import MessageBubble from "./MessageBubble";

const examplePrompts = [
  { text: "Çamaşır makinem 5E hatası veriyor", icon: <MessageSquare className="h-4 w-4" /> },
  { text: "Buzdolabım soğutmuyor", icon: <Zap className="h-4 w-4" /> },
];

export default function ChatMessages({ msgs, busy, setInput }) {
  const messagesEndRef = useRef(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [msgs]);

  return (
    <div className="relative z-10 flex-1 overflow-y-auto">
      {msgs.length === 0 && (
        <div className="h-full flex items-center justify-center px-6">
          <div className="text-center max-w-3xl">
            <motion.div
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              className="mb-8 inline-flex p-6 bg-[#dc2626]/20 rounded-3xl border border-[#dc2626]/30 shadow-2xl shadow-red-500/20"
            >
              <Wrench className="h-16 w-16 text-[#dc2626]" />
            </motion.div>
            <h2 className="text-4xl font-bold mb-4 text-white">
              V-FIX AI'ya Hoş Geldiniz
            </h2>
            <p className="text-slate-400 text-lg mb-10 leading-relaxed">
              Beyaz eşya arızalarınızı çözmek için buradayım. Sorununuzu Türkçe olarak anlatın!
            </p>
            <div className="grid gap-4 md:grid-cols-2 max-w-2xl mx-auto">
              {examplePrompts.map((prompt, i) => (
                <motion.button
                  key={i}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.1 }}
                  onClick={() => setInput(prompt.text)}
                  className="group p-5 text-left rounded-2xl bg-black/50 hover:bg-black/70 border border-white/10 hover:border-[#dc2626]/50 transition-all hover:shadow-lg hover:shadow-red-500/20"
                >
                  <div className="flex items-center gap-3 mb-2">
                    <div className="p-2 bg-[#dc2626]/20 rounded-lg text-[#dc2626] group-hover:bg-[#dc2626]/30 transition-all">
                      {prompt.icon}
                    </div>
                    <div className="text-sm font-medium text-white">{prompt.text}</div>
                  </div>
                  <div className="text-xs text-slate-500">Örnek sorun</div>
                </motion.button>
              ))}
            </div>
          </div>
        </div>
      )}

      <div className="max-w-4xl mx-auto px-6 py-8">
        <AnimatePresence initial={false}>
          {msgs.map((msg, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              transition={{ duration: 0.4 }}
              className="mb-8"
            >
              <MessageBubble msg={msg} />
            </motion.div>
          ))}
        </AnimatePresence>

        {busy && (
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="mb-8">
            <div className="flex gap-4">
              <div className="flex-shrink-0 w-10 h-10 rounded-xl bg-[#dc2626] flex items-center justify-center shadow-lg shadow-red-500/50">
                <span className="text-white font-bold">AI</span>
              </div>
              <div className="flex-1 space-y-3">
                <div className="font-semibold text-sm text-slate-300">V-FIX</div>
                <div className="flex items-center gap-3">
                  <div className="flex gap-1.5">
                    <div className="w-2.5 h-2.5 bg-[#dc2626] rounded-full animate-bounce" />
                    <div className="w-2.5 h-2.5 bg-[#dc2626] rounded-full animate-bounce delay-100" />
                    <div className="w-2.5 h-2.5 bg-[#dc2626] rounded-full animate-bounce delay-200" />
                  </div>
                  <span className="text-sm text-slate-400">Düşünüyor...</span>
                </div>
              </div>
            </div>
          </motion.div>
        )}
        <div ref={messagesEndRef} />
      </div>
    </div>
  );
}
