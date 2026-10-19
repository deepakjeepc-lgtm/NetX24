/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { Routes, Route } from 'react-router-dom';
import LandingPage from './pages/LandingPage';
import AdminDashboard from './pages/AdminDashboard';
import { CatalogProvider } from './context/CatalogContext';
import { ToastProvider } from './context/ToastContext';
import { ThemeProvider } from './context/ThemeContext';

export default function App() {
  return (
    <ThemeProvider>
      <ToastProvider>
        <CatalogProvider>
          <div className="relative min-h-screen bg-[#FAFAFA] dark:bg-[#0A0A0C] text-[#111111] dark:text-[#F5F5F7] font-sans w-full">
            <Routes>
              <Route path="/" element={<LandingPage />} />
              <Route path="/admin" element={<AdminDashboard />} />
            </Routes>
          </div>
        </CatalogProvider>
      </ToastProvider>
    </ThemeProvider>
  );
}
