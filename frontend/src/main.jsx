import React from 'react';
import ReactDOM from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import App from './App';
import './index.css';
import { ToastProvider } from './context/ToastContext';
import { MotorProvider } from './context/MotorContext';
import { CartProvider } from './context/CartContext';
import { AuthProvider } from './context/AuthContext';
import { CustomerAuthProvider } from './context/CustomerAuthContext';
import { SmoothScrollProvider } from './context/SmoothScrollContext';

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <BrowserRouter>
      <SmoothScrollProvider>
        <ToastProvider>
          <MotorProvider>
            <CartProvider>
              <AuthProvider>
                <CustomerAuthProvider>
                  <App />
                </CustomerAuthProvider>
              </AuthProvider>
            </CartProvider>
          </MotorProvider>
        </ToastProvider>
      </SmoothScrollProvider>
    </BrowserRouter>
  </React.StrictMode>
);

