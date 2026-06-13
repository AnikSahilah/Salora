function ConfirmModal({ message, onConfirm, onCancel, confirmText = "Ya", danger = true }) {
  return (
    <div className="modal-overlay" onClick={onCancel}>
      <div className="modal-content confirm-modal" onClick={(e) => e.stopPropagation()}>
        <div className="confirm-icon">⚠️</div>
        <p className="confirm-message">{message}</p>
        <div className="confirm-actions">
          <button className="btn btn-outline" onClick={onCancel}>Batal</button>
          <button
            className="btn btn-primary"
            onClick={onConfirm}
            style={danger ? { background: "#dc2626", borderColor: "#dc2626" } : {}}
          >
            {confirmText}
          </button>
        </div>
      </div>
    </div>
  )
}

export default ConfirmModal
