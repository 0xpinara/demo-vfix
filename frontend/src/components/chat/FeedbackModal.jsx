import React from "react";
import { Star, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";

const stars = [1, 2, 3, 4, 5];

export default function FeedbackModal({
  open,
  onClose,
  sessionTitle,
  rating,
  comment,
  onRatingChange,
  onCommentChange,
  onSubmit,
  loading,
  error,
  successMessage,
}) {
  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm px-4">
      <div className="w-full max-w-lg rounded-2xl border border-white/10 bg-black/90 shadow-2xl shadow-red-500/20">
        <div className="flex items-center justify-between border-b border-white/10 px-6 py-4">
          <div>
            <p className="text-xs uppercase tracking-wide text-slate-500">Sohbeti Değerlendir</p>
            <h3 className="text-lg font-semibold text-white">{sessionTitle || "Sohbet"}</h3>
          </div>
          <button
            aria-label="Kapat"
            className="text-slate-400 hover:text-white"
            onClick={onClose}
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="px-6 py-5 space-y-4">
          <div>
            <p className="text-sm font-medium text-slate-200 mb-2">Sohbeti 1-5 arası puanlayın</p>
            <div className="flex items-center gap-3">
              {stars.map((value) => (
                <button
                  key={value}
                  type="button"
                  aria-label={`${value} yıldız`}
                  onClick={() => onRatingChange(value)}
                  className="p-2 rounded-full hover:bg-black/50 transition-colors"
                >
                  <Star
                    className={`h-7 w-7 ${
                      value <= rating ? "fill-amber-400 text-amber-400" : "text-slate-500"
                    }`}
                  />
                </button>
              ))}
              <span className="text-sm text-slate-400">{rating ? `${rating}/5` : "Puan seçin"}</span>
            </div>
          </div>

          <div>
            <p className="text-sm font-medium text-slate-200 mb-2">Görüşleriniz (isteğe bağlı)</p>
            <Textarea
              value={comment}
              onChange={(e) => onCommentChange(e.target.value)}
              rows={4}
              placeholder="Deneyiminiz nasıldı? Neyi geliştirebiliriz?"
              className="bg-white border-slate-300 text-slate-900 placeholder:text-slate-500"
            />
          </div>

          {error && <p className="text-sm text-red-400">{error}</p>}
          {successMessage && <p className="text-sm text-green-400">{successMessage}</p>}
        </div>

        <div className="flex items-center justify-end gap-3 border-t border-white/10 px-6 py-4">
          <Button
            type="button"
            variant="outline"
            onClick={onClose}
            className="border-white/10 text-slate-200 hover:bg-black/50"
            disabled={loading}
          >
            Vazgeç
          </Button>
          <Button
            type="button"
            onClick={onSubmit}
            disabled={loading}
            className="bg-[#dc2626] hover:bg-[#b91c1c] text-white"
          >
            {loading ? "Gönderiliyor..." : "Gönder"}
          </Button>
        </div>
      </div>
    </div>
  );
}

