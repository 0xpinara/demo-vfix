import React, { useEffect, useState } from 'react';
import AdminLayout from '../../components/admin/AdminLayout';
import StarRating from '../../components/admin/StarRating';
import HalfCircleProgress from '../../components/admin/HalfCircleProgress';
import api from '../../services/api';
import {
  RefreshCw,
  Wrench,
  Target,
  Package,
  AlertTriangle,
  ShieldCheck,
  Truck,
  User,
  Calendar,
  Check,
  X,
  ChevronLeft,
  ChevronRight,
  Activity
} from 'lucide-react';
import './TechnicianFeedback.css';

export default function TechnicianFeedback() {
  const [feedback, setFeedback] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [total, setTotal] = useState(0);
  const [averageRating, setAverageRating] = useState(0);
  const [diagnosisAccuracy, setDiagnosisAccuracy] = useState(0);
  const [partsAccuracy, setPartsAccuracy] = useState(0);
  const pageSize = 10;

  const fetchFeedback = async (pageNum = 1) => {
    try {
      setLoading(true);
      setError(null);
      const res = await api.get(`/admin/technician-feedback?page=${pageNum}&page_size=${pageSize}`);
      setFeedback(res.data.feedback);
      setTotal(res.data.total);
      setTotalPages(Math.max(1, Math.ceil(res.data.total / pageSize)));
      setAverageRating(res.data.average_rating || 0);
      setDiagnosisAccuracy(res.data.diagnosis_accuracy || 0);
      setPartsAccuracy(res.data.parts_accuracy || 0);
    } catch (err) {
      console.error('Technician feedback fetch failed', err);
      setError('Teknisyen geri bildirimleri yüklenirken bir hata oluştu.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchFeedback(page);
  }, [page]);

  const formatDate = (date) =>
    new Date(date).toLocaleDateString('tr-TR', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });

  if (loading && feedback.length === 0) {
    return (
      <AdminLayout title="Teknisyen Geri Bildirimi">
        <div className="loading-state">
          <RefreshCw className="loading-icon" />
          <p>Teknisyen geri bildirimleri yükleniyor...</p>
        </div>
      </AdminLayout>
    );
  }

  if (error && feedback.length === 0) {
    return (
      <AdminLayout title="Teknisyen Geri Bildirimi">
        <div className="error-state">
          <p>{error}</p>
          <button onClick={() => fetchFeedback(page)} className="retry-btn">
            Tekrar Dene
          </button>
        </div>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout title="Teknisyen Geri Bildirimi">
      <div className="tech-feedback-page">
        {/* Summary + Gauges */}
        <section className="tech-summary">
          <div className="summary-card">
            <div className="summary-icon-wrapper">
              <Wrench className="summary-icon" />
            </div>
            <div className="summary-info">
              <span className="summary-value">{total}</span>
              <span className="summary-label">Toplam Geri Bildirim</span>
            </div>
          </div>

          <div className="summary-card highlighted">
            <div className="summary-icon-wrapper">
              <Activity className="summary-icon" />
            </div>
            <div className="summary-info">
              <StarRating rating={averageRating} size="md" />
              <span className="summary-label">Ortalama Teknisyen Puanı</span>
            </div>
          </div>

          <div className="gauge-card">
            <HalfCircleProgress
              percentage={diagnosisAccuracy}
              label="Teşhis Doğruluğu"
              sublabel="Teknisyen onayı"
              size="md"
            />
          </div>

          <div className="gauge-card">
            <HalfCircleProgress
              percentage={partsAccuracy}
              label="Parça Önerisi Başarısı"
              sublabel="İkinci ziyaret önleme"
              size="md"
            />
          </div>
        </section>

        {/* Feedback List */}
        <section className="tech-feedback-list">
          {feedback.length === 0 ? (
            <div className="empty-state">
              <AlertTriangle className="empty-icon" />
              <p>Henüz teknisyen geri bildirimi bulunmuyor.</p>
            </div>
          ) : (
            feedback.map((item) => (
              <div key={item.id} className="tech-card">
                <div className="tech-card-header">
                  <div className="tech-user">
                    <div className="tech-avatar">
                      {item.technician_name?.[0]?.toUpperCase() || 'T'}
                    </div>
                    <div className="tech-user-info">
                      <span className="tech-name">{item.technician_name}</span>
                      <span className="tech-session">Oturum: {item.chat_session_id || '—'}</span>
                    </div>
                  </div>
                  <div className="tech-rating">
                    <StarRating rating={item.rating} size="md" showValue={false} />
                    <span className="rating-badge">{item.rating}/5</span>
                  </div>
                </div>

                <div className="tech-flags">
                  <span className={`flag ${item.diagnosis_correct ? 'ok' : 'warn'}`}>
                    {item.diagnosis_correct ? <Check size={14} /> : <X size={14} />}
                    Teşhis {item.diagnosis_correct ? 'Doğru' : 'Yanlış'}
                  </span>
                  <span className={`flag ${item.parts_sufficient ? 'ok' : 'warn'}`}>
                    {item.parts_sufficient ? <Check size={14} /> : <X size={14} />}
                    Parça Önerisi {item.parts_sufficient ? 'Yeterli' : 'Yetersiz'}
                  </span>
                  {item.second_trip_required && (
                    <span className="flag warn">
                      <Truck size={14} />
                      İkinci Ziyaret Gerekti
                    </span>
                  )}
                </div>

                <div className="tech-body">
                  {item.comment && <p className="tech-comment">“{item.comment}”</p>}

                  <div className="tech-meta">
                    <div className="meta-block">
                      <div className="meta-title">
                        <Target size={14} />
                        AI Teşhisi
                      </div>
                      <p className="meta-text">{item.ai_diagnosed_problem || '—'}</p>
                    </div>
                    <div className="meta-block">
                      <div className="meta-title">
                        <Package size={14} />
                        Önerilen Parçalar
                      </div>
                      <p className="meta-text">{item.ai_recommended_parts || '—'}</p>
                    </div>
                  </div>
                </div>

                <div className="tech-footer">
                  <div className="tech-date">
                    <Calendar size={14} />
                    <span>{item.created_at ? formatDate(item.created_at) : '—'}</span>
                  </div>
                </div>
              </div>
            ))
          )}
        </section>

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="pagination">
            <button
              className="pagination-btn"
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              disabled={page === 1}
            >
              <ChevronLeft className="pagination-icon" />
              Önceki
            </button>

            <div className="pagination-info">
              <span className="current-page">{page}</span>
              <span className="page-separator">/</span>
              <span className="total-pages">{totalPages}</span>
            </div>

            <button
              className="pagination-btn"
              onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
              disabled={page === totalPages}
            >
              Sonraki
              <ChevronRight className="pagination-icon" />
            </button>
          </div>
        )}
      </div>
    </AdminLayout>
  );
}

