import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './assets/css/main.css'
import App from './App.jsx'
import { CartProvider } from "./contexts/CartContext";
import { EventsProvider } from "./contexts/EventsContext";


createRoot(document.getElementById('root')).render(
  <StrictMode>
    <EventsProvider>
      <CartProvider>
        <App />
      </CartProvider>
    </EventsProvider>
  </StrictMode>,
)
