import ReactDOM from "react-dom/client"
import App from "./App.jsx"
import "./index.css"
import { GoogleOAuthProvider } from "@react-oauth/google"

ReactDOM.createRoot(document.getElementById("root")).render(
  <GoogleOAuthProvider clientId="147748956321-3mpgd7vk3r6hnk7j6nt9pot27322idsp.apps.googleusercontent.com147748956321-3mpgd7vk3r6hnk7j6nt9pot27322idsp.apps.googleusercontent.com">
    <App />
  </GoogleOAuthProvider>
)