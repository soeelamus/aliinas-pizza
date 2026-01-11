import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './assets/css/main.css'
import App from './App.jsx'
import { CartProvider } from "./components/CartContext";

createRoot(document.getElementById('root')).render(
  <StrictMode>
     <CartProvider>
      <App />
    </CartProvider>
  </StrictMode>,
)
