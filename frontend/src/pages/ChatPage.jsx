import React from "react";
import ChatSidebar from "@/components/chat/ChatSidebar";
import ChatMessages from "@/components/chat/ChatMessages";
import ChatInput from "@/components/chat/ChatInput";
import ChatHeader from "@/components/chat/ChatHeader";
import AnimatedBackground from "@/components/layout/AnimatedBackground";
import { useChat } from "@/hooks/useChat";

export default function ChatPage() {
  const {
    sessions,
    currentSessionId,
    setCurrentSessionId,
    input,
    attachedImages,
    busy,
    sidebarOpen,
    setSidebarOpen,
    setInput,
    handleImageUpload,
    removeImage,
    onSubmit,
    handleNewChat,
    downloadChat,
    messagesEndRef,
  } = useChat();

  const currentMessages =
    sessions.find((s) => s.id === currentSessionId)?.messages || [];

  return (
    <div className="flex h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950">
      <ChatSidebar
        sidebarOpen={sidebarOpen}
        setSidebarOpen={setSidebarOpen}
        handleNewChat={handleNewChat}
        sessions={sessions}
        currentSessionId={currentSessionId}
        setCurrentSessionId={setCurrentSessionId}
        downloadChat={downloadChat}
      />

      <div className="flex-1 flex flex-col relative">
        <AnimatedBackground />
        <ChatHeader sidebarOpen={sidebarOpen} setSidebarOpen={setSidebarOpen} />

        <ChatMessages
          msgs={currentMessages}
          busy={busy}
          setInput={setInput}
        />

        <ChatInput
          input={input}
          setInput={setInput}
          busy={busy}
          attachedImages={attachedImages}
          handleImageUpload={handleImageUpload}
          removeImage={removeImage}
          onSubmit={onSubmit}
        />
      </div>
    </div>
  );
}
