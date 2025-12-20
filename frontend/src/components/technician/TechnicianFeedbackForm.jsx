import React, { useState } from 'react';
import { Star } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { submitTechnicianFeedback } from '@/services/technicianFeedback';

const stars = [1, 2, 3, 4, 5];

export default function TechnicianFeedbackForm({ onSuccess, onCancel }) {
  const [formData, setFormData] = useState({
    rating: 0,
    comment: '',
    diagnosis_correct: true,
    parts_sufficient: true,
    second_trip_required: false,
    actual_problem: '',
    actual_reason: '',
    actual_solution: '',
    actual_parts_needed: '',
    field_trip_was_required: null,
  });

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [successMessage, setSuccessMessage] = useState('');

  const handleChange = (field, value) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
    setError('');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!formData.rating) {
      setError('Lütfen 1-5 arasında bir puan seçin.');
      return;
    }

    if (!formData.diagnosis_correct) {
      if (!formData.actual_problem || !formData.actual_solution) {
        setError('Tanı yanlışsa, gerçek sorun ve çözüm alanları zorunludur.');
        return;
      }
    }

    try {
      setLoading(true);
      setError('');
      await submitTechnicianFeedback(formData);
      setSuccessMessage('Geri bildiriminiz başarıyla kaydedildi!');
      setTimeout(() => {
        if (onSuccess) onSuccess();
      }, 1500);
    } catch (err) {
      setError(err?.response?.data?.detail || 'Geri bildirim kaydedilemedi. Lütfen tekrar deneyin.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="w-full max-w-4xl mx-auto" style={{ background: '#111', border: '1px solid #333', borderRadius: '24px', padding: '2rem' }}>
      <h2 className="text-2xl font-bold text-white mb-6">Teknisyen Geri Bildirimi</h2>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Rating */}
        <div>
          <label className="block text-sm font-medium text-[#aaa] mb-2">
            Genel Değerlendirme (1-5 yıldız)
          </label>
          <div className="flex items-center gap-3">
            {stars.map((value) => (
              <button
                key={value}
                type="button"
                aria-label={`${value} yıldız`}
                onClick={() => handleChange('rating', value)}
                className="p-2 rounded-full hover:bg-[#222] transition-colors"
              >
                <Star
                  className={`h-7 w-7 ${
                    value <= formData.rating
                      ? 'fill-[#dc2626] text-[#dc2626]'
                      : 'text-[#555]'
                  }`}
                />
              </button>
            ))}
            <span className="text-sm text-[#aaa]">
              {formData.rating ? `${formData.rating}/5` : 'Puan seçin'}
            </span>
          </div>
        </div>

        {/* Comment */}
        <div>
          <label className="block text-sm font-medium text-[#aaa] mb-2">
            Genel Yorum (isteğe bağlı)
          </label>
          <Textarea
            value={formData.comment}
            onChange={(e) => handleChange('comment', e.target.value)}
            rows={3}
            placeholder="Deneyiminiz hakkında genel görüşleriniz..."
            className="bg-white border-[#333] text-[#000] placeholder:text-[#999]"
          />
        </div>

        {/* Diagnostic Accuracy */}
        <div className="border-t border-[#333] pt-6">
          <h3 className="text-lg font-semibold text-white mb-4">Tanı Doğruluğu</h3>

          <div className="space-y-4">
            <div className="flex items-center gap-3">
              <input
                type="checkbox"
                id="diagnosis_correct"
                checked={formData.diagnosis_correct}
                onChange={(e) => handleChange('diagnosis_correct', e.target.checked)}
                className="w-5 h-5 rounded border-[#333]"
              />
              <label htmlFor="diagnosis_correct" className="text-[#aaa]">
                AI tanısı doğruydu
              </label>
            </div>

            <div className="flex items-center gap-3">
              <input
                type="checkbox"
                id="parts_sufficient"
                checked={formData.parts_sufficient}
                onChange={(e) => handleChange('parts_sufficient', e.target.checked)}
                className="w-5 h-5 rounded border-[#333]"
              />
              <label htmlFor="parts_sufficient" className="text-[#aaa]">
                Önerilen parçalar yeterliydi
              </label>
            </div>

            <div className="flex items-center gap-3">
              <input
                type="checkbox"
                id="second_trip_required"
                checked={formData.second_trip_required}
                onChange={(e) => handleChange('second_trip_required', e.target.checked)}
                className="w-5 h-5 rounded border-[#333]"
              />
              <label htmlFor="second_trip_required" className="text-[#aaa]">
                İkinci bir ziyaret gerekliydi
              </label>
            </div>
          </div>
        </div>

        {/* Actual Findings (Required if diagnosis incorrect) */}
        {!formData.diagnosis_correct && (
          <div className="border-t border-[#333] pt-6">
            <h3 className="text-lg font-semibold text-white mb-4">
              Gerçek Bulgular (zorunlu)
            </h3>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-[#aaa] mb-2">
                  Gerçek Sorun <span className="text-[#dc2626]">*</span>
                </label>
                <Textarea
                  value={formData.actual_problem}
                  onChange={(e) => handleChange('actual_problem', e.target.value)}
                  rows={2}
                  placeholder="Gerçek sorun neydi?"
                  required
                  className="bg-white border-[#333] text-[#000] placeholder:text-[#999]"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-[#aaa] mb-2">
                  Sorunun Nedeni
                </label>
                <Textarea
                  value={formData.actual_reason}
                  onChange={(e) => handleChange('actual_reason', e.target.value)}
                  rows={2}
                  placeholder="Sorunun nedeni..."
                  className="bg-white border-[#333] text-[#000] placeholder:text-[#999]"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-[#aaa] mb-2">
                  Gerçek Çözüm <span className="text-[#dc2626]">*</span>
                </label>
                <Textarea
                  value={formData.actual_solution}
                  onChange={(e) => handleChange('actual_solution', e.target.value)}
                  rows={2}
                  placeholder="Gerçek çözüm neydi?"
                  required
                  className="bg-white border-[#333] text-[#000] placeholder:text-[#999]"
                />
              </div>
              <div className="flex items-center gap-3">
                <input
                  type="checkbox"
                  id="field_trip_was_required"
                  checked={formData.field_trip_was_required === true}
                  onChange={(e) =>
                    handleChange('field_trip_was_required', e.target.checked ? true : null)
                  }
                  className="w-5 h-5 rounded border-[#333]"
                />
                <label htmlFor="field_trip_was_required" className="text-[#aaa]">
                  Saha ziyareti gerekliydi
                </label>
              </div>
            </div>
          </div>
        )}

        {/* Required Parts (shown when parts were not sufficient) */}
        {!formData.parts_sufficient && (
          <div className="border-t border-[#333] pt-6">
            <h3 className="text-lg font-semibold text-white mb-4">
              Gerekli Parçalar
            </h3>
            <div>
              <label className="block text-sm font-medium text-[#aaa] mb-2">
                Gerçekte Gerekli Olan Parçalar
              </label>
              <Textarea
                value={formData.actual_parts_needed}
                onChange={(e) => handleChange('actual_parts_needed', e.target.value)}
                rows={2}
                placeholder="Gerçekte gerekli olan parçalar..."
                className="bg-white border-[#333] text-[#000] placeholder:text-[#999]"
              />
            </div>
          </div>
        )}

        {/* Error and Success Messages */}
        {error && <p className="text-sm text-[#ef4444]">{error}</p>}
        {successMessage && <p className="text-sm text-[#10b981]">{successMessage}</p>}

        {/* Submit Buttons */}
        <div className="flex items-center justify-end gap-3 border-t border-[#333] pt-6">
          {onCancel && (
            <Button
              type="button"
              variant="outline"
              onClick={onCancel}
              style={{ borderColor: '#333', color: '#aaa' }}
              className="hover:bg-[#222]"
              disabled={loading}
            >
              Vazgeç
            </Button>
          )}
          <Button
            type="submit"
            disabled={loading}
            style={{ background: '#dc2626', color: 'white' }}
            className="hover:bg-[#b91c1c]"
          >
            {loading ? 'Gönderiliyor...' : 'Geri Bildirimi Gönder'}
          </Button>
        </div>
      </form>
    </div>
  );
}

