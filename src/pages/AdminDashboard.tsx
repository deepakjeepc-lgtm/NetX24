import React, { useState, useEffect } from 'react';
import { auth } from '../lib/firebase';
import {
  signInWithEmailAndPassword,
  signOut,
  onAuthStateChanged,
  GoogleAuthProvider,
  signInWithPopup,
} from 'firebase/auth';
import { Link } from 'react-router-dom';
import { ArrowLeft, LogOut } from 'lucide-react';
import CatalogManager from '../components/admin/CatalogManager';
import OrdersView from '../components/admin/OrdersView';
import DatabaseManager from '../components/admin/DatabaseManager';
import ContactSubmissions from '../components/admin/ContactSubmissions';
import ThemeToggle from '../components/ThemeToggle';
import LekhixLogo from '../components/LekhixLogo';

export default function AdminDashboard() {
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loginError, setLoginError] = useState('');
  const [activeTab, setActiveTab] = useState<
    'catalog' | 'orders' | 'database' | 'inquiries'
  >('catalog');

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser);
      setLoading(false);
    });
    return () => unsubscribe();
  }, []);

  const handleEmailLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoginError('');
    try {
      await signInWithEmailAndPassword(auth, email, password);
    } catch (error: any) {
      setLoginError(error.message || 'Invalid credentials');
    }
  };

  const handleGoogleLogin = async () => {
    setLoginError('');
    try {
      const provider = new GoogleAuthProvider();
      await signInWithPopup(auth, provider);
    } catch (error: any) {
      setLoginError(error.message || 'Google sign-in failed');
    }
  };

  const handleLogout = async () => {
    await signOut(auth);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[#FAFAFA] dark:bg-[#0A0A0C] flex items-center justify-center text-xs uppercase tracking-[0.2em] text-zinc-400">
        LEKHIX ATELIER
      </div>
    );
  }

  if (!user) {
    return (
      <div className="min-h-screen bg-[#FAFAFA] dark:bg-[#0A0A0C] text-[#111111] dark:text-[#F5F5F7] flex flex-col justify-between p-6 md:p-12">
        <div className="flex items-center justify-between max-w-6xl w-full mx-auto">
          <Link to="/" className="inline-flex items-center gap-2 text-xs font-bold uppercase tracking-[0.18em] hover:opacity-70">
            <ArrowLeft className="w-3.5 h-3.5" /> Storefront
          </Link>
          <ThemeToggle />
        </div>

        <div className="max-w-sm w-full mx-auto bg-[#FFFFFF] dark:bg-[#141418] border border-[#E5E5E0] dark:border-[#26262B] p-8 md:p-10 space-y-8">
          <div className="flex flex-col items-center text-center space-y-3">
            <LekhixLogo size="md" />
            <p className="text-[10px] font-bold uppercase tracking-[0.22em] text-zinc-400 pt-2">
              CURATOR &amp; CATALOG CONSOLE
            </p>
          </div>

          {loginError && (
            <div className="p-3 border border-red-500/40 text-red-600 dark:text-red-400 text-xs">
              {loginError}
            </div>
          )}

          <button
            type="button"
            onClick={handleGoogleLogin}
            className="w-full py-3 bg-[#111111] dark:bg-white text-white dark:text-[#111111] text-xs font-bold uppercase tracking-[0.18em] hover:opacity-85 transition-opacity cursor-pointer"
          >
            Continue with Google
          </button>

          <div className="relative flex py-1 items-center">
            <div className="flex-grow border-t border-[#ECECE7] dark:border-[#242429]" />
            <span className="shrink-0 mx-3 text-[10px] uppercase tracking-[0.18em] text-zinc-400">
              OR EMAIL
            </span>
            <div className="flex-grow border-t border-[#ECECE7] dark:border-[#242429]" />
          </div>

          <form onSubmit={handleEmailLogin} className="space-y-4">
            <div>
              <label className="block text-[10px] font-bold uppercase tracking-[0.18em] text-zinc-500 mb-1.5">
                Email
              </label>
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full px-3.5 py-2.5 text-xs bg-transparent border border-[#D4D4D0] dark:border-[#2E2E36] outline-none"
              />
            </div>
            <div>
              <label className="block text-[10px] font-bold uppercase tracking-[0.18em] text-zinc-500 mb-1.5">
                Password
              </label>
              <input
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full px-3.5 py-2.5 text-xs bg-transparent border border-[#D4D4D0] dark:border-[#2E2E36] outline-none"
              />
            </div>
            <button
              type="submit"
              className="w-full py-3 border border-[#111111] dark:border-white text-xs font-bold uppercase tracking-[0.18em] hover:bg-[#111111] hover:text-white dark:hover:bg-white dark:hover:text-[#111111] transition-colors cursor-pointer"
            >
              Sign In
            </button>
          </form>
        </div>

        <div className="text-center text-[10px] uppercase tracking-[0.2em] text-zinc-400">
          LEKHIX BOOKS &amp; STATIONERY
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen w-full max-w-[100vw] overflow-x-hidden bg-[#FAFAFA] dark:bg-[#0A0A0C] text-[#111111] dark:text-[#F5F5F7]">
      {/* Top Bar — Logo hidden on mobile so Catalog / Orders / Database / Inquiries fit cleanly */}
      <header className="sticky top-0 z-[100] pt-[env(safe-area-inset-top)] border-b border-[#E5E5E0] dark:border-[#222227] bg-[#FAFAFA] dark:bg-[#0A0A0C]">
        <div className="max-w-[1440px] mx-auto px-4 sm:px-6 md:px-12 h-14 sm:h-20 flex items-center justify-between gap-2 sm:gap-6">
          <div className="hidden sm:flex items-center gap-6 shrink-0">
            <Link to="/" className="shrink-0">
              <LekhixLogo size="sm" />
            </Link>
            <span className="text-xs font-bold uppercase tracking-[0.2em] text-zinc-400 hidden lg:inline">
              Curator Console
            </span>
          </div>

          <nav className="flex items-center gap-4 sm:gap-6 text-[11px] sm:text-xs font-bold uppercase tracking-[0.14em] sm:tracking-[0.18em] overflow-x-auto hide-scrollbar">
            <Link
              to="/"
              className="sm:hidden p-1 -ml-1 text-zinc-500 hover:text-[#111111] dark:hover:text-white transition-colors shrink-0"
              title="Back to Storefront"
              aria-label="Back to Storefront"
            >
              <ArrowLeft className="w-4 h-4" />
            </Link>
            <button
              onClick={() => setActiveTab('catalog')}
              className={`py-2 border-b-2 transition-colors cursor-pointer whitespace-nowrap shrink-0 ${
                activeTab === 'catalog'
                  ? 'border-[#111111] dark:border-white text-[#111111] dark:text-white'
                  : 'border-transparent text-zinc-400 hover:text-[#111111] dark:hover:text-white'
              }`}
            >
              Catalog
            </button>
            <button
              onClick={() => setActiveTab('orders')}
              className={`py-2 border-b-2 transition-colors cursor-pointer whitespace-nowrap shrink-0 ${
                activeTab === 'orders'
                  ? 'border-[#111111] dark:border-white text-[#111111] dark:text-white'
                  : 'border-transparent text-zinc-400 hover:text-[#111111] dark:hover:text-white'
              }`}
            >
              Orders
            </button>
            <button
              onClick={() => setActiveTab('database')}
              className={`py-2 border-b-2 transition-colors cursor-pointer whitespace-nowrap shrink-0 ${
                activeTab === 'database'
                  ? 'border-[#111111] dark:border-white text-[#111111] dark:text-white'
                  : 'border-transparent text-zinc-400 hover:text-[#111111] dark:hover:text-white'
              }`}
            >
              Database
            </button>
            <button
              onClick={() => setActiveTab('inquiries')}
              className={`py-2 border-b-2 transition-colors cursor-pointer whitespace-nowrap shrink-0 ${
                activeTab === 'inquiries'
                  ? 'border-[#111111] dark:border-white text-[#111111] dark:text-white'
                  : 'border-transparent text-zinc-400 hover:text-[#111111] dark:hover:text-white'
              }`}
            >
              Inquiries
            </button>
          </nav>

          <div className="flex items-center gap-1.5 sm:gap-4 shrink-0">
            <ThemeToggle />
            <Link
              to="/"
              className="text-xs font-semibold uppercase tracking-[0.14em] text-zinc-500 hover:text-[#111111] dark:hover:text-white whitespace-nowrap hidden md:inline"
            >
              Storefront
            </Link>
            <button
              onClick={handleLogout}
              className="p-2 text-zinc-500 hover:text-[#111111] dark:hover:text-white transition-colors cursor-pointer"
              title="Sign Out"
              aria-label="Sign Out"
            >
              <LogOut className="w-4 h-4" />
            </button>
          </div>
        </div>
      </header>

      <main className="max-w-[1440px] mx-auto px-4 sm:px-6 md:px-12 py-5 sm:py-10">
        {activeTab === 'catalog' && <CatalogManager />}
        {activeTab === 'orders' && <OrdersView />}
        {activeTab === 'database' && <DatabaseManager />}
        {activeTab === 'inquiries' && <ContactSubmissions />}
      </main>
    </div>
  );
}
