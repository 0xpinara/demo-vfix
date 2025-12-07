import React, { useState, useEffect } from 'react';
import AdminLayout from '../../components/admin/AdminLayout';
import StarRating from '../../components/admin/StarRating';
import api from '../../services/api';
import { 
  RefreshCw, 
  User, 
  Calendar, 
  MessageSquare,
  ChevronLeft,
  ChevronRight,
  Star
} from 'lucide-react';
import './UserFeedback.css';

export default function UserFeedback() {
  const [feedback, setFeedback] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [averageRating, setAverageRating] = useState(0);
  const [total, setTotal] = useState(0);
  const pageSize = 10;

  const fetchFeedback = async (pageNum = 1) => {
    try {
      setLoading(true);
      setError(null);
      const response = await api.get(`/admin/user-feedback?page=${pageNum}&page_size=${pageSize}`);
      setFeedback(response.data.feedback);
      setTotal(response.data.total);
      setTotalPages(Math.ceil(response.data.total / pageSize));
      setAverageRating(response.data.average_rating);
    } catch (err) {
      console.error('Failed to fetch feedback:', err);
      setError('Geri bildirimler yüklenirken bir hata oluştu.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchFeedback(page);
  }, [page]);

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('tr-TR', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  if (loading && feedback.length === 0) {
    return (
      <AdminLayout title="Kullanıcı Geri Bildirimi">
        <div className="loading-state">
          <RefreshCw className="loading-icon" />
          <p>Geri bildirimler yükleniyor...</p>
        </div>
      </AdminLayout>
    );
  }

  if (error && feedback.length === 0) {
    return (
      <AdminLayout title="Kullanıcı Geri Bildirimi">
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
    <AdminLayout title="Kullanıcı Geri Bildirimi">
      <div className="feedback-page">
        {/* Summary Header */}
        <div className="feedback-summary">
          <div className="summary-card">
            <div className="summary-icon-wrapper">
              <MessageSquare className="summary-icon" />
            </div>
            <div className="summary-info">
              <span className="summary-value">{total}</span>
              <span className="summary-label">Toplam Değerlendirme</span>
            </div>
          </div>
          
          <div className="summary-card highlight">
            <div className="summary-icon-wrapper">
              <Star className="summary-icon" />
            </div>
            <div className="summary-info">
              <StarRating rating={averageRating} size="md" />
              <span className="summary-label">Ortalama Puan</span>
            </div>
          </div>
        </div>

        {/* Feedback List */}
        <div className="feedback-list">
          {feedback.length === 0 ? (
            <div className="empty-state">
              <MessageSquare className="empty-icon" />
              <p>Henüz kullanıcı geri bildirimi bulunmuyor.</p>
            </div>
          ) : (
            feedback.map((item) => (
              <div key={item.id} className="feedback-card">
                <div className="feedback-header">
                  <div className="feedback-user">
                    <div className="user-avatar">
                      {item.username?.[0]?.toUpperCase() || 'U'}
                    </div>
                    <div className="user-info">
                      <span className="user-name">{item.username}</span>
                      <span className="session-title">
                        {item.session_title || 'Sohbet Oturumu'}
                      </span>
                    </div>
                  </div>
                  <div className="feedback-rating">
                    <StarRating rating={item.rating} size="md" showValue={false} />
                    <span className="rating-badge">{item.rating}/5</span>
                  </div>
                </div>
                
                {item.comment && (
                  <div className="feedback-content">
                    <p className="feedback-comment">"{item.comment}"</p>
                  </div>
                )}
                
                <div className="feedback-footer">
                  <div className="feedback-date">
                    <Calendar className="date-icon" />
                    <span>{formatDate(item.created_at)}</span>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="pagination">
            <button
              className="pagination-btn"
              onClick={() => setPage(p => Math.max(1, p - 1))}
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
              onClick={() => setPage(p => Math.min(totalPages, p + 1))}
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

