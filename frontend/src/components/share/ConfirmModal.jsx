import "./ConfirmModal.css";
import { Trash2 } from "lucide-react";

export default function ConfirmModal({
  open,
  title,
  message,
  onConfirm,
  onCancel,
}) {
  if (!open) return null;

  return (
    <div className="modal-overlay">
      <div className="confirm-modal">
        <div className="confirm-icon">
          <Trash2 size={48} color="#f26522" />
        </div>

        <h2>{title}</h2>

        <p>{message}</p>

        <div className="confirm-actions">
          <button className="btn-cancel" onClick={onCancel}>
            Cancel
          </button>

          <button className="btn-delete" onClick={onConfirm}>
            Delete
          </button>
        </div>
      </div>
    </div>
  );
}
