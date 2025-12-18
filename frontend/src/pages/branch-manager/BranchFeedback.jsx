import React, { useState, useEffect } from 'react';
import BranchManagerLayout from '../../components/branch-manager/BranchManagerLayout';
import StarRating from '../../components/admin/StarRating';
import api from '../../services/api';
import { 
  RefreshCw,
  MessageSquare,
  User,
  CheckCircle,
  XCircle,
  AlertTriangle,
  ChevronLeft,
  ChevronRight,
  Bot,
  Wrench
} from 'lucide-react';
import './BranchFeedback.css';

export default function BranchFeedback() {
  const [feedbacks, setFeedbacks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [averageRating, setAverageRating] = useState(0);
  const [selectedTechnician, setSelectedTechnician] = useState('');
  const [technicians, setTechnicians] = useState([]);
  const pageSize = 10;

  const fetchFeedbacks = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const params = {
        page,
        page_size: pageSize
      };
      
      if (selectedTechnician) {
        params.technician_id = selectedTechnician;
      }
      
      const response = await api.get('/branch-manager/technician-feedback', { params });
      setFeedbacks(response.data.feedback);
      setTotalPages(Math.ceil(response.data.total / pageSize));
      setAverageRating(response.data.average_rating);
    } catch (err) {
      console.error('Failed to fetch feedbacks:', err);
      setError('Geri bildirimler yüklenirken bir hata oluştu.');
    } finally {
      setLoading(false);
    }
  };

  const fetchTechnicians = async () => {
    try {
      const response = await api.get('/branch-manager/technicians');
      setTechnicians(response.data);
    } catch (err) {
      console.error('Failed to fetch technicians:', err);
    }
  };

  useEffect(() => {
    fetchTechnicians();
  }, []);

  useEffect(() => {
    fetchFeedbacks();
  }, [page, selectedTechnician]);

  const handleTechnicianChange = (e) => {
    setSelectedTechnician(e.target.value);
    setPage(1);
  };

  if (loading && feedbacks.length === 0) {
    return (
      <BranchManagerLayout title="AI Geri Bildirimleri">
        <div className="loading-state">
          <RefreshCw className="loading-icon" />
          <p>Geri bildirimler yükleniyor...</p>
        </div>
      </BranchManagerLayout>
    );
  }

  return (
    <BranchManagerLayout title="AI Geri Bildirimleri">
      <div className="branch-feedback-page">
        {/* Stats Bar */}
        <div className="stats-bar">
          <div className="stat-item">
            <span className="stat-label">Ortalama Puan</span>
            <div className="stat-value">
              <StarRating rating={averageRating} size="sm" />
            </div>
          </div>
          <div className="filter-section">
            <label>Teknisyen:</label>
            <select 
              value={selectedTechnician} 
              onChange={handleTechnicianChange}
              className="technician-filter"
            >
              <option value="">Tümü</option>
              {technicians.map((tech) => (
                <option key={tech.id} value={tech.id}>
                  {tech.full_name}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Feedback List */}
        <div className="feedback-list">
          {error ? (
            <div className="error-state">
              <p>{error}</p>
              <button onClick={fetchFeedbacks} className="retry-btn">
                Tekrar Dene
              </button>
            </div>
          ) : feedbacks.length === 0 ? (
            <div className="no-feedback">
              <MessageSquare className="no-data-icon" />
              <p>Henüz geri bildirim bulunmuyor</p>
            </div>
          ) : (
            feedbacks.map((fb) => (
              <div key={fb.id} className="feedback-card">
                <div className="feedback-header">
                  <div className="technician-info">
                    <div className="tech-avatar">
                      {fb.technician_name?.[0] || 'T'}
                    </div>
                    <div className="tech-details">
                      <span className="tech-name">{fb.technician_name}</span>
                      <span className="feedback-date">
                        {new Date(fb.created_at).toLocaleDateString('tr-TR', {
                          day: 'numeric',
                          month: 'long',
                          year: 'numeric'
                        })}
                      </span>
                    </div>
                  </div>
                  <StarRating rating={fb.rating} size="sm" />
                </div>

                <div className="feedback-body">
                  {/* AI Diagnosis */}
                  <div className="ai-section">
                    <div className="section-header">
                      <Bot size={16} />
                      <span>AI Teşhisi</span>
                    </div>
                    <div className="ai-content">
                      <div className="ai-item">
                        <label>Teşhis:</label>
                        <span>{fb.ai_diagnosed_problem || '-'}</span>
                      </div>
                      <div className="ai-item">
                        <label>Önerilen Parçalar:</label>
                        <span>{fb.ai_recommended_parts || '-'}</span>
                      </div>
                    </div>
                  </div>

                  {/* Evaluation Badges */}
                  <div className="evaluation-badges">
                    <div className={`eval-badge ${fb.diagnosis_correct ? 'success' : 'error'}`}>
                      {fb.diagnosis_correct ? (
                        <>
                          <CheckCircle size={14} />
                          <span>Teşhis Doğru</span>
                        </>
                      ) : (
                        <>
                          <XCircle size={14} />
                          <span>Teşhis Hatalı</span>
                        </>
                      )}
                    </div>
                    
                    <div className={`eval-badge ${fb.parts_sufficient ? 'success' : 'warning'}`}>
                      {fb.parts_sufficient ? (
                        <>
                          <CheckCircle size={14} />
                          <span>Parçalar Yeterli</span>
                        </>
                      ) : (
                        <>
                          <AlertTriangle size={14} />
                          <span>Ek Parça Gerekti</span>
                        </>
                      )}
                    </div>
                    
                    {fb.second_trip_required && (
                      <div className="eval-badge error">
                        <AlertTriangle size={14} />
                        <span>İkinci Ziyaret Gerekti</span>
                      </div>
                    )}
                  </div>

                  {/* Actual Findings (if diagnosis was wrong) */}
                  {(fb.actual_problem || fb.actual_solution) && (
                    <div className="actual-section">
                      <div className="section-header">
                        <Wrench size={16} />
                        <span>Gerçek Durum</span>
                      </div>
                      <div className="actual-content">
                        {fb.actual_problem && (
                          <div className="actual-item">
                            <label>Gerçek Sorun:</label>
                            <span>{fb.actual_problem}</span>
                          </div>
                        )}
                        {fb.actual_solution && (
                          <div className="actual-item">
                            <label>Uygulanan Çözüm:</label>
                            <span>{fb.actual_solution}</span>
                          </div>
                        )}
                      </div>
                    </div>
                  )}

                  {/* Comment */}
                  {fb.comment && (
                    <div className="comment-section">
                      <div className="section-header">
                        <MessageSquare size={16} />
                        <span>Teknisyen Yorumu</span>
                      </div>
                      <p className="comment-text">{fb.comment}</p>
                    </div>
                  )}
                </div>
              </div>
            ))
          )}
        </div>

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="pagination">
            <button 
              className="page-btn"
              onClick={() => setPage(p => Math.max(1, p - 1))}
              disabled={page === 1}
            >
              <ChevronLeft size={18} />
              Önceki
            </button>
            <span className="page-info">
              Sayfa {page} / {totalPages}
            </span>
            <button 
              className="page-btn"
              onClick={() => setPage(p => Math.min(totalPages, p + 1))}
              disabled={page === totalPages}
            >
              Sonraki
              <ChevronRight size={18} />
            </button>
          </div>
        )}
      </div>
    </BranchManagerLayout>
  );
}

