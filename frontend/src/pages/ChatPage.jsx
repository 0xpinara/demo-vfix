import React, { useState } from "react";
import ChatSidebar from "@/components/chat/ChatSidebar";
import ChatMessages from "@/components/chat/ChatMessages";
import ChatInput from "@/components/chat/ChatInput";
import ChatHeader from "@/components/chat/ChatHeader";
import AnimatedBackground from "@/components/layout/AnimatedBackground";
import { useChat } from "@/hooks/useChat";
import FeedbackModal from "@/components/chat/FeedbackModal";
import { useAuth } from "@/context/AuthContext";

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
    fetchFeedbackForSession,
    submitFeedback,
    feedbackBySession,
    feedbackLoading,
    feedbackError,
  } = useChat();
  const { user } = useAuth();

  const [feedbackModal, setFeedbackModal] = useState({ open: false, sessionId: null });
  const [feedbackForm, setFeedbackForm] = useState({ rating: 0, comment: "" });
  const [feedbackStatus, setFeedbackStatus] = useState({ message: "", error: "" });

  const currentMessages =
    sessions.find((s) => s.id === currentSessionId)?.messages || [];

  const currentSessionTitle =
    sessions.find((s) => s.id === currentSessionId)?.title || "Sohbet";

  const openFeedback = async (sessionId) => {
    if (!sessionId) return;
    setFeedbackModal({ open: true, sessionId });
    setFeedbackStatus({ message: "", error: "" });
    setFeedbackForm({ rating: 0, comment: "" });

    try {
      const existing = await fetchFeedbackForSession(sessionId);
      if (existing && existing.rating) {
        setFeedbackForm({
          rating: existing.rating,
          comment: existing.comment || "",
        });
      }
    } catch {
      setFeedbackStatus({ message: "", error: feedbackError || "Değerlendirme yüklenemedi" });
    }
  };

  const closeFeedback = () => {
    setFeedbackModal({ open: false, sessionId: null });
    setFeedbackStatus({ message: "", error: "" });
  };

  const handleSubmitFeedback = async () => {
    if (!feedbackModal.sessionId) return;
    if (!feedbackForm.rating) {
      setFeedbackStatus({ message: "", error: "Lütfen 1-5 arasında bir puan seçin." });
      return;
    }

    try {
      setFeedbackStatus({ message: "", error: "" });
      await submitFeedback({
        session_id: feedbackModal.sessionId,
        rating: feedbackForm.rating,
        comment: feedbackForm.comment,
        session_title:
          sessions.find((s) => s.id === feedbackModal.sessionId)?.title || "Sohbet",
      });
      setFeedbackStatus({ message: "Geri bildiriminiz için teşekkürler!", error: "" });
      setTimeout(() => closeFeedback(), 600);
    } catch (err) {
      setFeedbackStatus({
        message: "",
        error: feedbackError || "Geri bildirim kaydedilemedi. Lütfen tekrar deneyin.",
      });
    }
  };

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
        onOpenFeedback={openFeedback}
        feedbackBySession={feedbackBySession}
        user={user}
      />

      <div className="flex-1 flex flex-col relative">
        <AnimatedBackground />
        <ChatHeader
          sidebarOpen={sidebarOpen}
          setSidebarOpen={setSidebarOpen}
          onOpenFeedback={() => openFeedback(currentSessionId)}
          canEvaluate={!!currentSessionId}
        />

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

      <FeedbackModal
        open={feedbackModal.open}
        onClose={closeFeedback}
        sessionTitle={
          feedbackModal.sessionId
            ? sessions.find((s) => s.id === feedbackModal.sessionId)?.title || "Sohbet"
            : currentSessionTitle
        }
        rating={feedbackForm.rating}
        comment={feedbackForm.comment}
        onRatingChange={(rating) => setFeedbackForm((prev) => ({ ...prev, rating }))}
        onCommentChange={(comment) => setFeedbackForm((prev) => ({ ...prev, comment }))}
        onSubmit={handleSubmitFeedback}
        loading={feedbackLoading}
        error={feedbackStatus.error}
        successMessage={feedbackStatus.message}
      />
    </div>
  );
}
