import {StrictMode} from 'react';
import {createRoot} from 'react-dom/client';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import App from './App.tsx';
import PrivacyPolicy from './pages/PrivacyPolicy.tsx';
import TermsAndConditions from './pages/TermsAndConditions.tsx';
import './index.css';

import { ToastProvider } from './context/ToastContext';
import { ModalProvider } from './context/ModalContext';

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <ToastProvider>
      <ModalProvider>
        <BrowserRouter>
          <Routes>
            <Route
              path="/privacy-policy"
              element={<PrivacyPolicy onBack={() => window.history.back()} />}
            />
            <Route
              path="/terms-of-service"
              element={<TermsAndConditions onBack={() => window.history.back()} />}
            />
            <Route path="*" element={<App />} />
          </Routes>
        </BrowserRouter>
      </ModalProvider>
    </ToastProvider>
  </StrictMode>,
);
