import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import Calendar from 'react-calendar';
import 'react-calendar/dist/Calendar.css';
import api from '../../services/api';
import {
    RefreshCw,
    CalendarOff,
    User,
    Clock,
    Calendar as CalendarIcon,
    Briefcase,
    Heart,
    Home,
    AlertCircle,
    Plus,
    X
} from 'lucide-react';
import ConfirmationModal from '../../components/common/ConfirmationModal';
import './TechnicianVacations.css';

const vacationTypeLabels = {
    annual: { label: 'Yıllık İzin', icon: Briefcase, color: '#0891b2' },
    sick: { label: 'Hastalık İzni', icon: Heart, color: '#ef4444' },
    personal: { label: 'Kişisel İzin', icon: Home, color: '#8b5cf6' },
    unpaid: { label: 'Ücretsiz İzin', icon: AlertCircle, color: '#f59e0b' },
    maternity: { label: 'Doğum İzni', icon: Heart, color: '#ec4899' },
    paternity: { label: 'Babalık İzni', icon: User, color: '#06b6d4' },
    marriage: { label: 'Evlilik İzni', icon: Heart, color: '#f472b6' },
    bereavement: { label: 'Vefat İzni', icon: AlertCircle, color: '#6b7280' },
    other: { label: 'Diğer', icon: CalendarOff, color: '#94a3b8' }
};

const statusLabels = {
    pending: { label: 'Beklemede', class: 'pending' },
    approved: { label: 'Onaylandı', class: 'approved' },
    rejected: { label: 'Reddedildi', class: 'rejected' },
    cancelled: { label: 'İptal', class: 'cancelled' }
};

export default function TechnicianVacations() {
    const [vacations, setVacations] = useState([]);
    const [selectedDate, setSelectedDate] = useState(new Date());
    const [loading, setLoading] = useState(true);
    const [viewMode, setViewMode] = useState('calendar'); // 'calendar' or 'list'
    const [showRequestModal, setShowRequestModal] = useState(false);

    // Form State
    const [requestForm, setRequestForm] = useState({
        start_date: '',
        end_date: '',
        vacation_type: 'annual',
        reason: ''
    });
    const [submitting, setSubmitting] = useState(false);

    const fetchVacations = useCallback(async () => {
        try {
            setLoading(true);
            const response = await api.get('/technicians/vacations');
            setVacations(response.data.vacations);
        } catch (err) {
            console.error('Failed to fetch vacations:', err);
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        fetchVacations();
    }, [fetchVacations]);

    const getVacationsForDate = (date) => {
        return vacations.filter(v => {
            const start = new Date(v.start_date);
            const end = new Date(v.end_date);
            start.setHours(0, 0, 0, 0);
            end.setHours(23, 59, 59, 999);
            const checkDate = new Date(date);
            checkDate.setHours(12, 0, 0, 0);
            return checkDate >= start && checkDate <= end && ['approved', 'pending'].includes(v.status);
        });
    };

    const selectedDateVacations = getVacationsForDate(selectedDate);

    const hasVacations = (date) => {
        return getVacationsForDate(date).length > 0;
    };

    const tileContent = ({ date, view }) => {
        if (view === 'month') {
            const dayVacations = getVacationsForDate(date);
            if (dayVacations.length > 0) {
                return (
                    <div className="vacation-tile-content">
                        {dayVacations.map((v, i) => (
                            <span
                                key={i}
                                className="vacation-dot"
                                style={{ backgroundColor: vacationTypeLabels[v.vacation_type]?.color || '#94a3b8' }}
                            />
                        ))}
                    </div>
                );
            }
        }
        return null;
    };

    const tileClassName = ({ date, view }) => {
        if (view === 'month') {
            if (hasVacations(date)) {
                return 'has-vacations';
            }
        }
        return null;
    };

    const formatDateRange = (start, end) => {
        const startDate = new Date(start);
        const endDate = new Date(end);

        const startStr = startDate.toLocaleDateString('tr-TR', { day: 'numeric', month: 'short' });
        const endStr = endDate.toLocaleDateString('tr-TR', { day: 'numeric', month: 'short', year: 'numeric' });

        // Calculate days
        const diffTime = Math.abs(endDate - startDate);
        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24)) + 1;

        return `${startStr} - ${endStr} (${diffDays} gün)`;
    };

    const getVacationIcon = (type) => {
        const config = vacationTypeLabels[type] || vacationTypeLabels.other;
        const Icon = config.icon;
        return <Icon size={16} style={{ color: config.color }} />;
    };

    const handleRequestSubmit = async (e) => {
        e.preventDefault();
        if (new Date(requestForm.end_date) < new Date(requestForm.start_date)) {
            alert('Bitiş tarihi başlangıç tarihinden önce olamaz.');
            return;
        }

        try {
            setSubmitting(true);
            await api.post('/technicians/vacations', {
                ...requestForm,
                start_date: new Date(requestForm.start_date).toISOString(),
                end_date: new Date(requestForm.end_date).toISOString()
            });
            await fetchVacations();
            setShowRequestModal(false);
            setRequestForm({
                start_date: '',
                end_date: '',
                vacation_type: 'annual',
                reason: ''
            });
        } catch (err) {
            console.error('Failed to request vacation:', err);
            alert(err.response?.data?.detail || 'İzin talebi oluşturulurken bir hata oluştu.');
        } finally {
            setSubmitting(false);
        }
    };

    const [isConfirmationOpen, setIsConfirmationOpen] = useState(false);
    const [confirmationConfig, setConfirmationConfig] = useState({
        title: '',
        message: '',
        onConfirm: () => { },
        isDanger: false,
        confirmText: 'Onayla'
    });

    const handleCancelVacationCallback = async (id) => {
        try {
            await api.delete(`/technicians/vacations/${id}`);
            fetchVacations();
        } catch (err) {
            console.error('Failed to cancel vacation:', err);
            alert('İzin talebi iptal edilirken bir hata oluştu.');
        }
    };

    const handleCancelVacation = (id) => {
        setConfirmationConfig({
            title: 'İzin Talebini İptal Et',
            message: 'Bu izin talebini iptal etmek istediğinize emin misiniz?',
            onConfirm: () => handleCancelVacationCallback(id),
            isDanger: true,
            confirmText: 'İptal Et'
        });
        setIsConfirmationOpen(true);
    };

    const navigate = useNavigate();

    const handleGoBack = () => {
        navigate('/dashboard');
    };

    if (loading && vacations.length === 0) {
        return (
            <div className="technician-vacations-page">
                <div className="loading-state">
                    <RefreshCw className="loading-icon" />
                    <p>İzinler yükleniyor...</p>
                </div>
            </div>
        );
    }

    return (
        <div className="technician-vacations-page">
            <div className="page-header">
                <button className="back-to-dashboard-btn" onClick={handleGoBack}>
                    Geri Dön
                </button>
                <h1 className="page-title">İzinlerim</h1>
                <button className="request-vacation-btn" onClick={() => setShowRequestModal(true)}>
                    <Plus size={18} />
                    İzin Talep Et
                </button>
            </div>

            <div className="page-header-controls">
                <div className="view-toggle">
                    <button
                        className={`toggle-btn ${viewMode === 'calendar' ? 'active' : ''}`}
                        onClick={() => setViewMode('calendar')}
                    >
                        <CalendarIcon size={16} />
                        Takvim
                    </button>
                    <button
                        className={`toggle-btn ${viewMode === 'list' ? 'active' : ''}`}
                        onClick={() => setViewMode('list')}
                    >
                        <CalendarOff size={16} />
                        Liste
                    </button>
                </div>
            </div>

            {viewMode === 'calendar' ? (
                <div className="vacations-container">
                    {/* Calendar Section */}
                    <div className="calendar-section">
                        <div className="calendar-wrapper">
                            <Calendar
                                onChange={setSelectedDate}
                                value={selectedDate}
                                locale="tr-TR"
                                tileContent={tileContent}
                                tileClassName={tileClassName}
                            />
                        </div>

                        <div className="vacation-legend">
                            {Object.entries(vacationTypeLabels).slice(0, 6).map(([key, config]) => (
                                <div key={key} className="legend-item">
                                    <span className="legend-dot" style={{ backgroundColor: config.color }}></span>
                                    <span>{config.label}</span>
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* Selected Date Details */}
                    <div className="vacations-details-section">
                        <div className="details-header">
                            <h3>
                                <CalendarOff className="header-icon" />
                                {selectedDate.toLocaleDateString('tr-TR', {
                                    weekday: 'long',
                                    day: 'numeric',
                                    month: 'long',
                                    year: 'numeric'
                                })}
                            </h3>
                        </div>

                        <div className="vacations-list">
                            {selectedDateVacations.length === 0 ? (
                                <div className="no-vacations">
                                    <CalendarOff className="no-data-icon" />
                                    <p>Bu tarihte izin kaydınız yok</p>
                                </div>
                            ) : (
                                selectedDateVacations.map((vac) => (
                                    <div key={vac.id} className="vacation-card">
                                        <div className="vacation-header">
                                            <div className="vacation-type-badge" style={{
                                                backgroundColor: `${vacationTypeLabels[vac.vacation_type]?.color}20`,
                                                color: vacationTypeLabels[vac.vacation_type]?.color
                                            }}>
                                                {getVacationIcon(vac.vacation_type)}
                                                <span>{vacationTypeLabels[vac.vacation_type]?.label}</span>
                                            </div>
                                            <span className={`vacation-status ${statusLabels[vac.status]?.class}`}>
                                                {statusLabels[vac.status]?.label}
                                            </span>
                                        </div>

                                        <div className="vacation-body">
                                            <div className="date-range">
                                                <Clock size={14} />
                                                <span>{formatDateRange(vac.start_date, vac.end_date)}</span>
                                            </div>
                                            {vac.reason && (
                                                <p className="vacation-reason">{vac.reason}</p>
                                            )}
                                            {vac.status === 'pending' && (
                                                <button
                                                    className="cancel-btn"
                                                    onClick={() => handleCancelVacation(vac.id)}
                                                >
                                                    Talebi İptal Et
                                                </button>
                                            )}
                                        </div>
                                    </div>
                                ))
                            )}
                        </div>
                    </div>
                </div>
            ) : (
                /* List View */
                <div className="vacations-list-view">
                    <table className="vacations-table">
                        <thead>
                            <tr>
                                <th>İzin Türü</th>
                                <th>Başlangıç</th>
                                <th>Bitiş</th>
                                <th>Durum</th>
                                <th>Açıklama</th>
                                <th>İşlem</th>
                            </tr>
                        </thead>
                        <tbody>
                            {vacations.length === 0 ? (
                                <tr>
                                    <td colSpan="6" className="no-data">
                                        İzin kaydı bulunmuyor
                                    </td>
                                </tr>
                            ) : (
                                vacations.map((vac) => (
                                    <tr key={vac.id}>
                                        <td>
                                            <div className="vacation-type-badge" style={{
                                                backgroundColor: `${vacationTypeLabels[vac.vacation_type]?.color}20`,
                                                color: vacationTypeLabels[vac.vacation_type]?.color,
                                                width: 'fit-content'
                                            }}>
                                                {getVacationIcon(vac.vacation_type)}
                                                <span>{vacationTypeLabels[vac.vacation_type]?.label}</span>
                                            </div>
                                        </td>
                                        <td>{new Date(vac.start_date).toLocaleDateString('tr-TR')}</td>
                                        <td>{new Date(vac.end_date).toLocaleDateString('tr-TR')}</td>
                                        <td>
                                            <span className={`vacation-status ${statusLabels[vac.status]?.class}`}>
                                                {statusLabels[vac.status]?.label}
                                            </span>
                                        </td>
                                        <td className="reason-cell">{vac.reason || '-'}</td>
                                        <td>
                                            {vac.status === 'pending' && (
                                                <button
                                                    className="cancel-btn"
                                                    style={{ width: 'auto', marginTop: 0, padding: '0.25rem 0.5rem' }}
                                                    onClick={() => handleCancelVacation(vac.id)}
                                                >
                                                    İptal
                                                </button>
                                            )}
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>
            )}

            {/* Request Modal */}
            {showRequestModal && (
                <div className="modal-overlay" onClick={() => setShowRequestModal(false)}>
                    <div className="modal-content" onClick={e => e.stopPropagation()}>
                        <div className="modal-header">
                            <h3>Yeni İzin Talebi</h3>
                            <button className="close-modal-btn" onClick={() => setShowRequestModal(false)}>
                                <X size={20} />
                            </button>
                        </div>

                        <form onSubmit={handleRequestSubmit} className="vacation-form">
                            <div className="form-group">
                                <label>İzin Türü</label>
                                <select
                                    value={requestForm.vacation_type}
                                    onChange={e => setRequestForm({ ...requestForm, vacation_type: e.target.value })}
                                    required
                                >
                                    {Object.entries(vacationTypeLabels).map(([key, config]) => (
                                        <option key={key} value={key}>{config.label}</option>
                                    ))}
                                </select>
                            </div>

                            <div className="form-group">
                                <label>Başlangıç Tarihi</label>
                                <input
                                    type="date"
                                    value={requestForm.start_date}
                                    onChange={e => setRequestForm({ ...requestForm, start_date: e.target.value })}
                                    required
                                />
                            </div>

                            <div className="form-group">
                                <label>Bitiş Tarihi</label>
                                <input
                                    type="date"
                                    value={requestForm.end_date}
                                    onChange={e => setRequestForm({ ...requestForm, end_date: e.target.value })}
                                    required
                                />
                            </div>

                            <div className="form-group">
                                <label>Açıklama</label>
                                <textarea
                                    value={requestForm.reason}
                                    onChange={e => setRequestForm({ ...requestForm, reason: e.target.value })}
                                    placeholder="İzin nedeni..."
                                    rows={3}
                                    required
                                />
                            </div>

                            <div className="form-actions">
                                <button
                                    type="button"
                                    className="cancel-form-btn"
                                    onClick={() => setShowRequestModal(false)}
                                >
                                    İptal
                                </button>
                                <button
                                    type="submit"
                                    className="submit-form-btn"
                                    disabled={submitting}
                                >
                                    {submitting ? 'Gönderiliyor...' : 'Talep Oluştur'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
            <ConfirmationModal
                isOpen={isConfirmationOpen}
                onClose={() => setIsConfirmationOpen(false)}
                onConfirm={confirmationConfig.onConfirm}
                title={confirmationConfig.title}
                message={confirmationConfig.message}
                isDanger={confirmationConfig.isDanger}
                confirmText={confirmationConfig.confirmText}
            />
        </div>
    );
}
