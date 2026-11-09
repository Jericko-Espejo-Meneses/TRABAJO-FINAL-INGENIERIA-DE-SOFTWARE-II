import React from 'react';
import ReactDOM from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import App from './App';
import { getServices } from './core/container';
import { CartStore } from './cart/CartStore';
import { CartProvider } from './cart/CartContext';
import { ServicesProvider } from './context/ServicesContext';
import { AuthProvider } from './context/AuthContext';
import './styles.css';

// Composition root: aquí se arman las dependencias una sola vez.
const services = getServices();
const cartStore = new CartStore(window.localStorage);

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <ServicesProvider services={services}>
      <AuthProvider>
        <CartProvider store={cartStore}>
          <BrowserRouter>
            <App />
          </BrowserRouter>
        </CartProvider>
      </AuthProvider>
    </ServicesProvider>
  </React.StrictMode>,
);
