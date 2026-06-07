import { useState } from "react";
import ModalContext from "./ModalContext";
import ConfirmModal from "./ConfirmModal";

export default function ModalProvider({ children }) {

    const [modal, setModal] = useState({
        open: false,
        title: "",
        message: ""
    });

    const [resolver, setResolver] = useState(null);

    const confirm = ({ title, message }) => {

        return new Promise((resolve) => {

            setModal({
                open: true,
                title,
                message
            });

            setResolver(() => resolve);
        });
    };

    const handleConfirm = () => {

        resolver?.(true);

        setModal({
            open: false,
            title: "",
            message: ""
        });
    };

    const handleCancel = () => {

        resolver?.(false);

        setModal({
            open: false,
            title: "",
            message: ""
        });
    };

    return (
        <ModalContext.Provider
            value={{
                confirm
            }}
        >
            {children}

            <ConfirmModal
                open={modal.open}
                title={modal.title}
                message={modal.message}
                onConfirm={handleConfirm}
                onCancel={handleCancel}
            />

        </ModalContext.Provider>
    );
}