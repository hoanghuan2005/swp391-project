import ReactDOM from "react-dom/client";
import App from "./App.jsx";
import "./index.css";
import { GoogleOAuthProvider } from "@react-oauth/google";
import AppToaster from "./components/ui/app_toaster.jsx";
import ModalProvider from "./components/share/ModalProvider.jsx";

ReactDOM.createRoot(document.getElementById("root")).render(
  <GoogleOAuthProvider clientId={import.meta.env.VITE_GOOGLE_CLIENT_ID}>
    <ModalProvider>
      <App />
      <AppToaster />
    </ModalProvider>
  </GoogleOAuthProvider>,
);
