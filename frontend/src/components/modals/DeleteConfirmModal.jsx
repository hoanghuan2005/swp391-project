import "./DeleteConfirmModal.css";

export default function DeleteConfirmModal({
    open,
    title,
    message,
    onConfirm,
    onCancel
}) {

    if (!open) return null;

    return (
        <div className="modal-overlay">
            <div className="delete-modal">

                <div className="icon">
                    🗑️
                </div>

                <h2>{title}</h2>

                <p>{message}</p>

                <div className="actions">

                    <button
                        className="btn-cancel"
                        onClick={onCancel}
                    >
                        Cancel
                    </button>

                    <button
                        className="btn-delete"
                        onClick={onConfirm}
                    >
                        Delete
                    </button>

                </div>

            </div>
        </div>
    );
}