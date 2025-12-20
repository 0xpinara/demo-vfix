import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import TechnicianFeedbackForm from '../../components/technician/TechnicianFeedbackForm';
import { getTechnicianFeedbackList } from '../../services/technicianFeedback';
import { Button } from '../../components/ui/button';

function TechnicianFeedback() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [showForm, setShowForm] = useState(true);
  const [feedbackList, setFeedbackList] = useState([]);
  const [loading, setLoading] = useState(false);
  const [roleError, setRoleError] = useState(false);

  useEffect(() => {
    // Check if user has technician role
    const isTechnician = user?.enterprise_role === 'technician' || user?.enterprise_role === 'senior_technician';
    if (user && !isTechnician) {
      setRoleError(true);
    }
  }, [user]);

  const handleGoBack = () => {
    navigate('/dashboard');
  };

  const handleSuccess = () => {
    setShowForm(false);
    loadFeedbackList();
  };

  const loadFeedbackList = async () => {
    try {
      setLoading(true);
      const data = await getTechnicianFeedbackList();
      setFeedbackList(data);
    } catch (err) {
      console.error('Failed to load feedback list:', err);
    } finally {
      setLoading(false);
    }
  };

  if (roleError) {
    return (
      <div className="min-h-screen" style={{ background: '#000000' }}>
        <div className="max-w-4xl mx-auto p-6">
          <div className="mb-6">
            <button
              onClick={handleGoBack}
              className="text-[#aaa] hover:text-white mb-4 flex items-center gap-2"
            >
              ← Geri Dön
            </button>
            <h1 className="text-3xl font-bold text-white">Teknisyen Geri Bildirimi</h1>
          </div>
          <div style={{ background: '#111', border: '1px solid #333', borderRadius: '24px', padding: '2rem' }}>
            <div className="text-center">
              <p className="text-[#dc2626] text-lg font-semibold mb-2">
                Teknisyen Yetkisi Gerekli
              </p>
              <p className="text-[#aaa] mb-4">
                Bu sayfaya erişmek için teknisyen veya kıdemli teknisyen rolüne sahip olmanız gerekmektedir.
              </p>
              <p className="text-[#aaa] text-sm">
                Mevcut rolünüz: <span className="font-semibold text-white">{user?.enterprise_role || user?.role || 'Belirtilmemiş'}</span>
              </p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen" style={{ background: '#000000' }}>
      <div className="max-w-4xl mx-auto p-6">
        <div className="mb-6">
          <button
            onClick={handleGoBack}
            className="text-[#aaa] hover:text-white mb-4 flex items-center gap-2"
          >
            ← Geri Dön
          </button>
          <h1 className="text-3xl font-bold text-white">Teknisyen Geri Bildirimi</h1>
          <p className="text-[#aaa] mt-2">
            Saha ziyaretinizden sonra deneyiminizi bizimle paylaşın
          </p>
        </div>

        {showForm ? (
          <TechnicianFeedbackForm
            onSuccess={handleSuccess}
            onCancel={handleGoBack}
          />
        ) : (
          <div style={{ background: '#111', border: '1px solid #333', borderRadius: '24px', padding: '2rem' }}>
            <div className="text-center">
              <p className="text-[#10b981] mb-4">Geri bildiriminiz başarıyla kaydedildi!</p>
              <Button
                onClick={() => setShowForm(true)}
                style={{ background: '#dc2626', color: 'white' }}
                className="hover:bg-[#b91c1c]"
              >
                Yeni Geri Bildirim Gönder
              </Button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default TechnicianFeedback;

