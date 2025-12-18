import React, { useState, useEffect } from 'react';
import BranchManagerLayout from '../../components/branch-manager/BranchManagerLayout';
import StatCard from '../../components/admin/StatCard';
import StarRating from '../../components/admin/StarRating';
import HalfCircleProgress from '../../components/admin/HalfCircleProgress';
import api from '../../services/api';
import { 
  Users, 
  Wrench, 
  Calendar,
  CheckCircle,
  Clock,
  Star,
  Target,
  Package,
  RefreshCw
} from 'lucide-react';
import './BranchStatistics.css';

export default function BranchStatistics() {
  const [statistics, setStatistics] = useState(null);
  const [technicianRatings, setTechnicianRatings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchStatistics = async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await api.get('/branch-manager/statistics');
      setStatistics(response.data.statistics);
      setTechnicianRatings(response.data.technician_ratings);
    } catch (err) {
      console.error('Failed to fetch statistics:', err);
      setError('İstatistikler yüklenirken bir hata oluştu.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStatistics();
  }, []);

  if (loading) {
    return (
      <BranchManagerLayout title="Şube İstatistikleri">
        <div className="loading-state">
          <RefreshCw className="loading-icon" />
          <p>İstatistikler yükleniyor...</p>
        </div>
      </BranchManagerLayout>
    );
  }

  if (error) {
    return (
      <BranchManagerLayout title="Şube İstatistikleri">
        <div className="error-state">
          <p>{error}</p>
          <button onClick={fetchStatistics} className="retry-btn">
            Tekrar Dene
          </button>
        </div>
      </BranchManagerLayout>
    );
  }

  return (
    <BranchManagerLayout title="Şube İstatistikleri">
      <div className="branch-statistics-page">
        {/* Branch Info */}
        <section className="stats-section">
          <h2 className="section-title">{statistics?.branch_name || 'Şube'} - Genel Bakış</h2>
          <div className="stats-grid">
            <StatCard
              icon={Users}
              title="Toplam Teknisyen"
              value={statistics?.total_technicians || 0}
              subtitle="Aktif teknisyenler"
              color="primary"
            />
            <StatCard
              icon={Calendar}
              title="Toplam Randevu"
              value={statistics?.total_appointments || 0}
              subtitle="Tüm randevular"
              color="success"
            />
            <StatCard
              icon={CheckCircle}
              title="Tamamlanan"
              value={statistics?.completed_appointments || 0}
              subtitle="Başarılı ziyaretler"
              color="success"
            />
            <StatCard
              icon={Clock}
              title="Bekleyen"
              value={statistics?.pending_appointments || 0}
              subtitle="Planlanmış randevular"
              color="warning"
            />
          </div>
        </section>

        {/* AI Model Performance */}
        <section className="stats-section">
          <h2 className="section-title">AI Model Performansı</h2>
          <div className="performance-grid">
            <div className="performance-card main-rating">
              <div className="rating-header">
                <Star className="rating-header-icon" />
                <span>AI Model Puan Ortalaması</span>
              </div>
              <div className="rating-body">
                <StarRating 
                  rating={statistics?.average_rating || 0} 
                  size="lg" 
                />
                <p className="rating-count">
                  {statistics?.total_feedbacks || 0} teknisyen dönütü
                </p>
              </div>
            </div>
            
            <div className="metric-card">
              <HalfCircleProgress
                percentage={statistics?.diagnosis_accuracy || 0}
                label="AI Teşhis Doğruluğu"
                sublabel="Model teşhis başarısı"
                size="lg"
              />
            </div>
            
            <div className="metric-card">
              <HalfCircleProgress
                percentage={statistics?.parts_accuracy || 0}
                label="AI Parça Tahmini"
                sublabel="Önerilen parçalar yeterli"
                size="lg"
              />
            </div>
          </div>
        </section>

        {/* Technician AI Feedback Table */}
        <section className="stats-section">
          <h2 className="section-title">Teknisyen Model Dönütleri</h2>
          <div className="technicians-table-wrapper">
            <table className="technicians-table">
              <thead>
                <tr>
                  <th>Teknisyen</th>
                  <th>Sicil No</th>
                  <th>Dönüt Sayısı</th>
                  <th>AI'ya Verilen Puan</th>
                  <th>AI Teşhis Doğruluğu</th>
                  <th>AI Parça Doğruluğu</th>
                </tr>
              </thead>
              <tbody>
                {technicianRatings.length === 0 ? (
                  <tr>
                    <td colSpan="6" className="no-data">
                      Henüz teknisyen değerlendirmesi bulunmuyor
                    </td>
                  </tr>
                ) : (
                  technicianRatings.map((tech) => (
                    <tr key={tech.technician_id}>
                      <td className="tech-name">
                        <div className="tech-avatar">
                          {tech.technician_name?.[0] || 'T'}
                        </div>
                        <span>{tech.technician_name}</span>
                      </td>
                      <td className="tech-id">{tech.employee_id || '-'}</td>
                      <td className="tech-feedback-count">{tech.total_feedbacks}</td>
                      <td className="tech-rating">
                        <StarRating rating={tech.average_rating} size="sm" />
                      </td>
                      <td className="tech-accuracy">
                        <div className={`accuracy-badge ${tech.diagnosis_accuracy >= 80 ? 'good' : tech.diagnosis_accuracy >= 60 ? 'medium' : 'low'}`}>
                          %{tech.diagnosis_accuracy.toFixed(1)}
                        </div>
                      </td>
                      <td className="tech-accuracy">
                        <div className={`accuracy-badge ${tech.parts_accuracy >= 80 ? 'good' : tech.parts_accuracy >= 60 ? 'medium' : 'low'}`}>
                          %{tech.parts_accuracy.toFixed(1)}
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </section>

        {/* Quick Stats */}
        <section className="stats-section">
          <h2 className="section-title">AI Model Özeti</h2>
          <div className="quick-stats">
            <div className="quick-stat-item">
              <Star className="quick-stat-icon success" />
              <div className="quick-stat-info">
                <span className="quick-stat-value">
                  {statistics?.average_rating?.toFixed(1) || 0}
                </span>
                <span className="quick-stat-label">AI Model Puanı</span>
              </div>
            </div>
            
            <div className="quick-stat-item">
              <Target className="quick-stat-icon primary" />
              <div className="quick-stat-info">
                <span className="quick-stat-value">
                  %{statistics?.diagnosis_accuracy?.toFixed(1) || 0}
                </span>
                <span className="quick-stat-label">AI Teşhis Başarısı</span>
              </div>
            </div>
            
            <div className="quick-stat-item">
              <Package className="quick-stat-icon success" />
              <div className="quick-stat-info">
                <span className="quick-stat-value">
                  %{statistics?.parts_accuracy?.toFixed(1) || 0}
                </span>
                <span className="quick-stat-label">AI Parça Doğruluğu</span>
              </div>
            </div>
            
            <div className="quick-stat-item">
              <Wrench className="quick-stat-icon warning" />
              <div className="quick-stat-info">
                <span className="quick-stat-value">
                  {statistics?.total_feedbacks || 0}
                </span>
                <span className="quick-stat-label">Toplam Dönüt</span>
              </div>
            </div>
          </div>
        </section>
      </div>
    </BranchManagerLayout>
  );
}

