import ReactDOM from 'react-dom/client' 
import App from './App.jsx'
import './index.css'
import { BrowserRouter } from "react-router-dom"; 
import { GoogleOAuthProvider } from '@react-oauth/google';


ReactDOM.createRoot(document.getElementById('root')).render(
  <GoogleOAuthProvider clientId="147748956321-3mpgd7vk3r6hnk7j6nt9pot27322idsp.apps.googleusercontent.com">
    <BrowserRouter>
      <App />
    </BrowserRouter>
  </GoogleOAuthProvider>
);