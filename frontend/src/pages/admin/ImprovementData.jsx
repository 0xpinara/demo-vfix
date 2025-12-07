import React, { useState, useEffect } from 'react';
import AdminLayout from '../../components/admin/AdminLayout';
import api from '../../services/api';
import { 
  RefreshCw, 
  Database,
  AlertCircle,
  CheckCircle,
  Truck,
  Package,
  ChevronLeft,
  ChevronRight,
  Filter,
  Cpu
} from 'lucide-react';
import './ImprovementData.css';

export default function ImprovementData() {
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [total, setTotal] = useState(0);
  const [unusedCount, setUnusedCount] = useState(0);
  const [filterUnused, setFilterUnused] = useState(false);
  const pageSize = 10;

  const fetchData = async (pageNum = 1, unusedOnly = false) => {
    try {
      setLoading(true);
      setError(null);
      const response = await api.get(`/admin/improvement-data?page=${pageNum}&page_size=${pageSize}&unused_only=${unusedOnly}`);
      setData(response.data.data);
      setTotal(response.data.total);
      setTotalPages(Math.ceil(response.data.total / pageSize));
      setUnusedCount(response.data.unused_for_training_count);
    } catch (err) {
      console.error('Failed to fetch improvement data:', err);
      setError('İyileştirme verileri yüklenirken bir hata oluştu.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData(page, filterUnused);
  }, [page, filterUnused]);

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('tr-TR', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  const handleFilterToggle = () => {
    setFilterUnused(!filterUnused);
    setPage(1);
  };

  if (loading && data.length === 0) {
    return (
      <AdminLayout title="İyileştirme Verileri">
        <div className="loading-state">
          <RefreshCw className="loading-icon" />
          <p>Veriler yükleniyor...</p>
        </div>
      </AdminLayout>
    );
  }

  if (error && data.length === 0) {
    return (
      <AdminLayout title="İyileştirme Verileri">
        <div className="error-state">
          <p>{error}</p>
          <button onClick={() => fetchData(page, filterUnused)} className="retry-btn">
            Tekrar Dene
          </button>
        </div>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout title="İyileştirme Verileri">
      <div className="improvement-page">
        {/* Summary Header */}
        <div className="improvement-summary">
          <div className="summary-card">
            <div className="summary-icon-wrapper">
              <Database className="summary-icon" />
            </div>
            <div className="summary-info">
              <span className="summary-value">{total}</span>
              <span className="summary-label">Toplam Kayıt</span>
            </div>
          </div>
          
          <div className="summary-card">
            <div className="summary-icon-wrapper waiting">
              <Cpu className="summary-icon" />
            </div>
            <div className="summary-info">
              <span className="summary-value">{unusedCount}</span>
              <span className="summary-label">Eğitim Bekleyen</span>
            </div>
          </div>
          
          <button 
            className={`filter-btn ${filterUnused ? 'active' : ''}`}
            onClick={handleFilterToggle}
          >
            <Filter className="filter-icon" />
            {filterUnused ? 'Tümünü Göster' : 'Sadece Bekleyenler'}
          </button>
        </div>

        {/* Info Banner */}
        <div className="info-banner">
          <AlertCircle className="info-icon" />
          <p>
            Bu veriler, teknisyen geri bildirimlerinden elde edilen düzeltme kayıtlarıdır. 
            AI modelinin hatalı teşhis yaptığı durumlar burada listelenir ve gelecek eğitimlerde kullanılır.
          </p>
        </div>

        {/* Data List */}
        <div className="data-list">
          {data.length === 0 ? (
            <div className="empty-state">
              <Database className="empty-icon" />
              <p>İyileştirme verisi bulunmuyor.</p>
            </div>
          ) : (
            data.map((item) => (
              <div key={item.id} className="data-card">
                <div className="data-header">
                  <div className="appliance-info">
                    {item.appliance_type && (
                      <span className="appliance-badge">
                        {item.appliance_type}
                      </span>
                    )}
                    {item.appliance_brand && (
                      <span className="brand-text">
                        {item.appliance_brand} {item.appliance_model && `- ${item.appliance_model}`}
                      </span>
                    )}
                  </div>
                  <div className={`training-status ${item.used_for_training ? 'used' : 'pending'}`}>
                    {item.used_for_training ? (
                      <>
                        <CheckCircle className="status-icon" />
                        <span>Eğitimde Kullanıldı</span>
                      </>
                    ) : (
                      <>
                        <Cpu className="status-icon" />
                        <span>Eğitim Bekliyor</span>
                      </>
                    )}
                  </div>
                </div>
                
                <div className="data-content">
                  <div className="data-field">
                    <div className="field-label">
                      <AlertCircle className="field-icon problem" />
                      <span>Problem</span>
                    </div>
                    <p className="field-value">{item.problem_description}</p>
                  </div>
                  
                  <div className="data-field">
                    <div className="field-label">
                      <svg className="field-icon reason" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <circle cx="12" cy="12" r="10" />
                        <path d="M12 8v4M12 16h.01" />
                      </svg>
                      <span>Sebep</span>
                    </div>
                    <p className="field-value">{item.reason}</p>
                  </div>
                  
                  <div className="data-field">
                    <div className="field-label">
                      <CheckCircle className="field-icon solution" />
                      <span>Çözüm</span>
                    </div>
                    <p className="field-value">{item.solution}</p>
                  </div>
                  
                  <div className="data-row">
                    <div className="data-field half">
                      <div className="field-label">
                        <Truck className="field-icon" />
                        <span>Saha Ziyareti</span>
                      </div>
                      <span className={`field-badge ${item.field_trip_required ? 'required' : 'not-required'}`}>
                        {item.field_trip_required ? 'Gerekli' : 'Gerekli Değil'}
                      </span>
                    </div>
                    
                    <div className="data-field half">
                      <div className="field-label">
                        <Package className="field-icon" />
                        <span>Gerekli Parçalar</span>
                      </div>
                      <p className="field-value small">
                        {item.parts_required || 'Belirtilmemiş'}
                      </p>
                    </div>
                  </div>
                </div>
                
                <div className="data-footer">
                  <span className="data-date">{formatDate(item.created_at)}</span>
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

