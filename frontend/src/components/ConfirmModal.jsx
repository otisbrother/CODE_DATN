import { useState } from 'react';

export default function ConfirmModal({ show, title, message, onConfirm, onCancel }) {
  if (!show) return null;

  return (
    <div className="modal-overlay" onClick={onCancel}>
      <div className="modal-content" onClick={(e) => e.stopPropagation()} style={{ maxWidth: 420, textAlign: 'center' }}>
        <div style={{ fontSize: 48, marginBottom: 16 }}>⚠️</div>
        <h3 style={{ fontSize: 18, fontWeight: 700, marginBottom: 8, color: 'var(--text-primary)' }}>
          {title || 'Xác nhận'}
        </h3>
        <p style={{ color: 'var(--text-secondary)', fontSize: 14, marginBottom: 24, lineHeight: 1.6 }}>
          {message || 'Bạn có chắc chắn muốn thực hiện thao tác này?'}
        </p>
        <div style={{ display: 'flex', gap: 10, justifyContent: 'center' }}>
          <button className="btn btn-danger" onClick={onConfirm} style={{ minWidth: 120 }}>Xóa</button>
          <button className="btn btn-outline" onClick={onCancel} style={{ minWidth: 120 }}>Hủy</button>
        </div>
      </div>
    </div>
  );
}
