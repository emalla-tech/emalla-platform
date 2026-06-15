
import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
import { AuthProvider } from './auth/AuthContext';
import { pwaService } from './services/pwaService';
import { notificationPrepService } from './services/notificationPrepService';
import { monitoringService } from './services/monitoringService';
import AppErrorBoundary from './components/monitoring/AppErrorBoundary';
import { apiClient } from './services/apiClient';
import './index.css';

const rootElement = document.getElementById('root');
if (!rootElement) {
  throw new Error("Could not find root element to mount to");
}

const root = ReactDOM.createRoot(rootElement);
root.render(
  <React.StrictMode>
    <AppErrorBoundary>
      <AuthProvider>
        <App />
      </AuthProvider>
    </AppErrorBoundary>
  </React.StrictMode>
);

document.body.classList.toggle('pwa-standalone', pwaService.isStandaloneMode());

window.setTimeout(() => {
  const splash = document.getElementById('app-splash');
  if (!splash) return;
  splash.style.opacity = '0';
  splash.style.visibility = 'hidden';
  window.setTimeout(() => splash.remove(), 360);
}, 220);

void pwaService.registerServiceWorker();
void notificationPrepService.syncWithServiceWorker();
monitoringService.installGlobalHandlers();

window.setTimeout(() => {
  void apiClient.warmBackend().catch(() => undefined);
}, 800);
