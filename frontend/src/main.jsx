import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { Analytics } from '@vercel/analytics/react'
import './index.css'
import App from './App.jsx'
import axios from 'axios'

let apiBaseUrl = import.meta.env.VITE_API_URL || '';

// Fallback to Railway backend if VITE_API_URL points to obsolete Render backend or is empty in production
if (import.meta.env.PROD) {
  if (!apiBaseUrl || apiBaseUrl.includes('onrender.com')) {
    apiBaseUrl = 'https://ration-authontication-production.up.railway.app';
  }
}

axios.defaults.baseURL = apiBaseUrl;

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <App />
    <Analytics />
  </StrictMode>,
)
