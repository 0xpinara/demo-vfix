import React from 'react';
import './ConfirmationModal.css';

const ConfirmationModal = ({
    isOpen,
    onClose,
    onConfirm,
    title,
    message,
    confirmText = 'Onayla',
    cancelText = 'İptal',
    isDanger = false
}) => {
    if (!isOpen) return null;

    return (
        <div className="confirmation-modal-overlay" onClick={onClose}>
            <div className="confirmation-modal-content" onClick={e => e.stopPropagation()}>
                <div className="confirmation-modal-header">
                    <h3>{title}</h3>
                </div>
                <div className="confirmation-modal-body">
                    <p>{message}</p>
                </div>
                <div className="confirmation-modal-footer">
                    <button className="confirm-btn cancel" onClick={onClose}>
                        {cancelText}
                    </button>
                    <button
                        className={`confirm-btn ${isDanger ? 'danger' : 'primary'}`}
                        onClick={() => {
                            onConfirm();
                            onClose();
                        }}
                    >
                        {confirmText}
                    </button>
                </div>
            </div>
        </div>
    );
};

export default ConfirmationModal;
