import React, { useState, useEffect } from 'react';
import AdminLayout from '../../components/admin/AdminLayout';
import StatCard from '../../components/admin/StatCard';
import HalfCircleProgress from '../../components/admin/HalfCircleProgress';
import StarRating from '../../components/admin/StarRating';
import api from '../../services/api';
import { 
  MessageSquare, 
  Users, 
  Wrench, 
  CheckCircle,
  Star,
  Truck,
  Target,
  Package,
  RefreshCw
} from 'lucide-react';
import './GeneralStatistics.css';

export default function GeneralStatistics() {
  const [statistics, setStatistics] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchStatistics = async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await api.get('/admin/statistics');
      setStatistics(response.data.statistics);
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
      <AdminLayout title="Genel İstatistikler">
        <div className="loading-state">
          <RefreshCw className="loading-icon" />
          <p>İstatistikler yükleniyor...</p>
        </div>
      </AdminLayout>
    );
  }

  if (error) {
    return (
      <AdminLayout title="Genel İstatistikler">
        <div className="error-state">
          <p>{error}</p>
          <button onClick={fetchStatistics} className="retry-btn">
            Tekrar Dene
          </button>
        </div>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout title="Genel İstatistikler">
      <div className="statistics-page">
        {/* Overview Cards */}
        <section className="stats-section">
          <h2 className="section-title">Genel Bakış</h2>
          <div className="stats-grid">
            <StatCard
              icon={MessageSquare}
              title="Toplam Sohbet"
              value={statistics?.total_chats || 0}
              subtitle="Chatbot konuşmaları"
              color="primary"
            />
            <StatCard
              icon={Users}
              title="Toplam Kullanıcı"
              value={statistics?.total_users || 0}
              subtitle="Kayıtlı kullanıcılar"
              color="success"
            />
            <StatCard
              icon={Wrench}
              title="Teknisyen Sayısı"
              value={statistics?.total_technicians || 0}
              subtitle="Aktif teknisyenler"
              color="warning"
            />
            <StatCard
              icon={Star}
              title="Toplam Değerlendirme"
              value={statistics?.total_feedback_count || 0}
              subtitle="Kullanıcı geri bildirimleri"
              color="primary"
            />
          </div>
        </section>

        {/* Star Ratings Section */}
        <section className="stats-section">
          <h2 className="section-title">Puan Ortalamaları</h2>
          <div className="ratings-grid">
            <div className="rating-card">
              <div className="rating-card-header">
                <Users className="rating-icon" />
                <span>Kullanıcı Puanı</span>
              </div>
              <div className="rating-card-body">
                <StarRating 
                  rating={statistics?.average_user_rating || 0} 
                  size="lg" 
                />
                <p className="rating-description">
                  Kullanıcıların chatbot deneyimi değerlendirmesi
                </p>
              </div>
            </div>
            
            <div className="rating-card">
              <div className="rating-card-header">
                <Wrench className="rating-icon" />
                <span>Teknisyen Puanı</span>
              </div>
              <div className="rating-card-body">
                <StarRating 
                  rating={statistics?.average_technician_rating || 0} 
                  size="lg" 
                />
                <p className="rating-description">
                  Teknisyenlerin AI model değerlendirmesi
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* Performance Metrics - Half Circle Charts */}
        <section className="stats-section">
          <h2 className="section-title">Performans Metrikleri</h2>
          <div className="metrics-grid">
            <div className="metric-card">
              <HalfCircleProgress
                percentage={statistics?.problems_solved_percent || 0}
                label="Çözülen Problemler"
                sublabel="Chatbot tarafından çözüldü"
                size="lg"
              />
            </div>
            
            <div className="metric-card">
              <HalfCircleProgress
                percentage={statistics?.technician_dispatch_percent || 0}
                label="Teknisyen Gönderimi"
                sublabel="Saha ziyareti gerektirdi"
                size="lg"
                invertColors={true}
              />
            </div>
            
            <div className="metric-card">
              <HalfCircleProgress
                percentage={statistics?.diagnosis_accuracy_percent || 0}
                label="Teşhis Doğruluğu"
                sublabel="Teknisyen onaylı"
                size="lg"
              />
            </div>
            
            <div className="metric-card">
              <HalfCircleProgress
                percentage={statistics?.parts_accuracy_percent || 0}
                label="Parça Tahmini"
                sublabel="Önerilen parçalar yeterli"
                size="lg"
              />
            </div>
          </div>
        </section>

        {/* Quick Stats */}
        <section className="stats-section">
          <h2 className="section-title">Hızlı Özet</h2>
          <div className="quick-stats">
            <div className="quick-stat-item">
              <CheckCircle className="quick-stat-icon success" />
              <div className="quick-stat-info">
                <span className="quick-stat-value">
                  {statistics?.problems_solved_percent?.toFixed(1) || 0}%
                </span>
                <span className="quick-stat-label">Problem Çözme Oranı</span>
              </div>
            </div>
            
            <div className="quick-stat-item">
              <Truck className="quick-stat-icon warning" />
              <div className="quick-stat-info">
                <span className="quick-stat-value">
                  {statistics?.technician_dispatch_percent?.toFixed(1) || 0}%
                </span>
                <span className="quick-stat-label">Saha Ziyareti Oranı</span>
              </div>
            </div>
            
            <div className="quick-stat-item">
              <Target className="quick-stat-icon primary" />
              <div className="quick-stat-info">
                <span className="quick-stat-value">
                  {statistics?.diagnosis_accuracy_percent?.toFixed(1) || 0}%
                </span>
                <span className="quick-stat-label">Teşhis Başarısı</span>
              </div>
            </div>
            
            <div className="quick-stat-item">
              <Package className="quick-stat-icon success" />
              <div className="quick-stat-info">
                <span className="quick-stat-value">
                  {statistics?.parts_accuracy_percent?.toFixed(1) || 0}%
                </span>
                <span className="quick-stat-label">Parça Doğruluğu</span>
              </div>
            </div>
          </div>
        </section>
      </div>
    </AdminLayout>
  );
}

