/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { Routes, Route } from 'react-router-dom';
import LandingPage from './pages/LandingPage';
import AdminDashboard from './pages/AdminDashboard';
import { IgnouDataProvider } from './context/IgnouDataContext';
import { ServicesDataProvider } from './context/ServicesDataContext';

import { ToastProvider } from './context/ToastContext';
import { ThemeProvider } from './context/ThemeContext';

export default function App() {
  return (
    <ThemeProvider>
      <ToastProvider>
        <ServicesDataProvider>
          <IgnouDataProvider>
            <div className="relative min-h-screen bg-slate-100 dark:bg-[#0b0f19] text-slate-800 dark:text-slate-100 font-sans selection:bg-indigo-500/20 w-full">
            <Routes>
              <Route path="/" element={<LandingPage />} />
              <Route path="/admin" element={<AdminDashboard />} />
            </Routes>
          </div>
        </IgnouDataProvider>
      </ServicesDataProvider>
      </ToastProvider>
    </ThemeProvider>
  );
}
