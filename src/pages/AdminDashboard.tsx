import React, { useEffect, useState } from 'react';
import { db, auth } from '../lib/firebase';
import { collection, query, orderBy, getDocs } from 'firebase/firestore';
import { signInWithEmailAndPassword, createUserWithEmailAndPassword, signOut, onAuthStateChanged, signInWithPopup, GoogleAuthProvider } from 'firebase/auth';
import { LogOut, Loader2, ArrowLeft, Save, Database, KeyRound, MessageSquare, BookOpen, ShoppingCart, HelpCircle, Printer } from 'lucide-react';
import { Link } from 'react-router-dom';
import IgnouEditor from '../components/admin/IgnouEditor';
import ContactSubmissions from '../components/admin/ContactSubmissions';
import OrdersView from '../components/admin/OrdersView';

import ThemeToggle from '../components/ThemeToggle';

export default function AdminDashboard() {
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loginError, setLoginError] = useState('');
  const [isLoggingIn, setIsLoggingIn] = useState(false);
  const [activeTab, setActiveTab] = useState<'orders' | 'ignou' | 'submissions'>('orders');

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser);
      setLoading(false);
    });
    return () => unsubscribe();
  }, []);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoginError('');
    setIsLoggingIn(true);
    
    try {
      await signInWithEmailAndPassword(auth, email, password);
    } catch (authError: any) {
       if (authError.code === 'auth/operation-not-allowed') {
          setLoginError('Email/password login is not enabled in Firebase. Please click "Sign In with Google" below.');
       } else if (authError.code === 'auth/user-not-found' || authError.code === 'auth/invalid-credential') {
          try {
            await createUserWithEmailAndPassword(auth, email, password);
          } catch (createError: any) {
             if (createError.code === 'auth/operation-not-allowed') {
               setLoginError('Email/password login is not enabled in Firebase. Please click "Sign In with Google" below.');
             } else {
               console.error("Failed to create admin user:", createError);
               setLoginError('Authentication failed. Check your credentials.');
             }
          }
       } else {
         console.error("Auth error:", authError);
         setLoginError(authError.message || 'Authentication failed. Check your password.');
       }
    } finally {
      setIsLoggingIn(false);
    }
  };


  const handleGoogleLogin = async () => {
    setLoginError("");
    setIsLoggingIn(true);
    try {
      const provider = new GoogleAuthProvider();
      await signInWithPopup(auth, provider);
    } catch (err: any) {
      console.error("Google sign in error:", err);
      setLoginError(err.message || "Failed to sign in with Google");
    } finally {
      setIsLoggingIn(false);
    }
  };

  const logout = async () => {
    await signOut(auth);
  };

  if (loading) {
    return <div className="min-h-screen flex items-center justify-center"><Loader2 className="w-8 h-8 animate-spin text-blue-600" /></div>;
  }

  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center relative overflow-hidden bg-white dark:bg-[#121316]">
        <div className="absolute top-0 left-0 w-full h-full overflow-hidden pointer-events-none z-0">
           <div className="absolute top-[20%] left-[20%] w-[60%] h-[60%] bg-indigo-500/5 dark:bg-indigo-500/10 blur-[150px] mix-blend-multiply dark:mix-blend-lighten rounded-full" />
           <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[400px] opacity-40 dark:opacity-30 pointer-events-none blur-[120px] bg-gradient-to-br from-indigo-200 via-transparent to-transparent rounded-full"></div>
        </div>

        <div className="w-full max-w-md p-1 bg-gradient-to-br from-indigo-300 via-white to-orange-300 dark:from-indigo-500/50 dark:via-[#121316] dark:to-orange-500/50 rounded-[2.5rem] shadow-[0_20px_60px_-15px_rgba(0,0,0,0.05)] dark:shadow-[0_20px_60px_-15px_rgba(0,0,0,0.6)] relative z-10 mx-4">
          <div className="w-full p-8 md:p-12 bg-white/90 dark:bg-slate-900/90 backdrop-blur-3xl rounded-[calc(2.5rem-1px)] text-center relative overflow-hidden">
            <div className="w-16 h-16 bg-indigo-50 dark:bg-indigo-900/30 text-indigo-600 dark:text-indigo-400 rounded-2xl flex items-center justify-center mx-auto mb-6 shadow-sm border border-indigo-100 dark:border-indigo-800/50">
              <KeyRound className="w-8 h-8" />
            </div>
            <h2 className="text-[2rem] font-display font-extrabold text-[#1C1D20] dark:text-white leading-[1.1] tracking-tight mb-2">Admin Access</h2>
            <p className="text-slate-500 dark:text-slate-400 font-medium mb-8 text-sm">Securely manage your website.</p>
            
            <div className="space-y-4">
              <button
                type="button"
                onClick={handleGoogleLogin}
                disabled={isLoggingIn}
                className="w-full py-4 px-4 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-xl transition-all shadow-md flex justify-center items-center gap-3 text-base active:scale-[0.99]"
              >
                {isLoggingIn ? (
                  <Loader2 className="w-5 h-5 animate-spin" />
                ) : (
                  <>
                    <svg className="w-5 h-5" viewBox="0 0 24 24">
                      <path fill="#ffffff" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                      <path fill="#ffffff" opacity="0.8" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                      <path fill="#ffffff" opacity="0.8" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"/>
                      <path fill="#ffffff" opacity="0.9" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"/>
                    </svg>
                    Sign In with Google
                  </>
                )}
              </button>

              <div className="flex items-center gap-3 my-4">
                <div className="flex-1 h-px bg-slate-200 dark:bg-slate-700"></div>
                <span className="text-[11px] font-bold text-slate-400 uppercase tracking-widest">or email login</span>
                <div className="flex-1 h-px bg-slate-200 dark:bg-slate-700"></div>
              </div>

              <form onSubmit={handleLogin} className="space-y-3">
                <div>
                  <input
                    type="email"
                    placeholder="Enter email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 text-[#1C1D20] dark:text-white rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition-all text-center placeholder-slate-400 font-medium text-sm"
                    required
                  />
                </div>
                <div>
                  <input
                    type="password"
                    placeholder="Enter password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 text-[#1C1D20] dark:text-white rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition-all text-center placeholder-slate-400 font-medium text-sm"
                    required
                  />
                </div>
                {loginError && (
                  <div className="text-xs text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-900/20 py-2.5 px-3 rounded-lg font-semibold tracking-wide text-center">
                    {loginError}
                  </div>
                )}
                <button 
                  type="submit"
                  disabled={isLoggingIn}
                  className="w-full py-3 px-4 bg-slate-900 dark:bg-white hover:bg-slate-800 dark:hover:bg-slate-100 text-white dark:text-slate-900 font-bold rounded-xl transition-all shadow-sm flex justify-center items-center gap-2 text-sm"
                >
                  {isLoggingIn ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Log In with Password'}
                </button>
              </form>
            </div>

            <Link to="/" className="inline-flex items-center mt-8 text-xs font-bold text-slate-400 uppercase tracking-widest hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors">
               <ArrowLeft className="w-3.5 h-3.5 mr-1.5" /> Back to site
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-[#121316] flex flex-col font-sans transition-colors duration-300">
      {/* Top Navigation */}
      <header className="bg-white/80 dark:bg-[#1C1D20]/80 backdrop-blur-3xl border-b border-slate-200/60 dark:border-slate-800 sticky top-0 z-50 pt-[env(safe-area-inset-top)]">
        <div className="max-w-7xl mx-auto w-full px-6">
          <div className="flex items-center justify-between h-20">
            <div className="flex items-center gap-3">
              <h1 className="font-display font-extrabold text-xl text-[#1C1D20] dark:text-white tracking-tight">Admin Console</h1>
            </div>
            
            <div className="flex items-center gap-4 sm:gap-6">
              <ThemeToggle />
              <Link to="/" className="text-[11px] font-bold uppercase tracking-widest text-slate-500 dark:text-slate-400 hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors flex items-center gap-2">
                <ArrowLeft className="w-3.5 h-3.5" /> <span className="hidden sm:inline">Return to Site</span>
              </Link>
              <div className="w-px h-6 bg-slate-200 dark:bg-slate-700"></div>
              <button 
                onClick={logout}
                className="text-[11px] font-bold uppercase tracking-widest text-slate-500 dark:text-slate-400 hover:text-red-500 dark:hover:text-red-400 transition-colors flex items-center gap-2"
              >
                <LogOut className="w-3.5 h-3.5" /> <span className="hidden sm:inline">Sign Out</span>
              </button>
            </div>
          </div>
          
          <nav className="flex items-center gap-2 overflow-x-auto pb-4 pt-1 no-scrollbar">
            <button 
              onClick={() => setActiveTab('orders')}
              className={`flex items-center gap-2 px-5 py-2.5 rounded-full text-xs font-bold uppercase tracking-wider transition-all whitespace-nowrap ${
                activeTab === 'orders' 
                  ? 'bg-[#1C1D20] dark:bg-white text-white dark:text-slate-900 shadow-md' 
                  : 'bg-transparent text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800 hover:text-[#1C1D20] dark:hover:text-white'
              }`}
            >
              <ShoppingCart className="w-3.5 h-3.5" /> Orders
            </button>
            
            <button 
              onClick={() => setActiveTab('ignou')}
              className={`flex items-center gap-2 px-5 py-2.5 rounded-full text-xs font-bold uppercase tracking-wider transition-all whitespace-nowrap ${
                activeTab === 'ignou' 
                  ? 'bg-[#1C1D20] dark:bg-white text-white dark:text-slate-900 shadow-md' 
                  : 'bg-transparent text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800 hover:text-[#1C1D20] dark:hover:text-white'
              }`}
            >
              <BookOpen className="w-3.5 h-3.5" /> IGNOU Data
            </button>

            <button 
              onClick={() => setActiveTab('submissions')}
              className={`flex items-center gap-2 px-5 py-2.5 rounded-full text-xs font-bold uppercase tracking-wider transition-all whitespace-nowrap ${
                activeTab === 'submissions' 
                  ? 'bg-[#1C1D20] dark:bg-white text-white dark:text-slate-900 shadow-md' 
                  : 'bg-transparent text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800 hover:text-[#1C1D20] dark:hover:text-white'
              }`}
            >
              <MessageSquare className="w-3.5 h-3.5" /> Submissions
            </button>
          </nav>
        </div>
      </header>

      {/* Main Content Area */}
      <main className="flex-grow px-6 py-10 max-w-7xl mx-auto w-full">
        <header className="mb-10">
          <h2 className="text-3xl font-display font-extrabold text-[#1C1D20] dark:text-white tracking-tight">
            {activeTab === 'orders' && 'Payment & Orders'}
            {activeTab === 'ignou' && 'Manage IGNOU Data'}
            {activeTab === 'submissions' && 'Contact Submissions'}
          </h2>
          <p className="text-slate-500 dark:text-slate-400 mt-2 font-medium">
            {activeTab === 'orders' && 'View all successful payments and order history.'}
            {activeTab === 'ignou' && 'View the educational programs, levels, and subjects.'}
            {activeTab === 'submissions' && 'View messages sent from the contact form on your website.'}
          </p>
        </header>

        <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
          {activeTab === 'orders' && <OrdersView />}
          {activeTab === 'ignou' && <IgnouEditor />}
          {activeTab === 'submissions' && <ContactSubmissions />}
        </div>
      </main>
    </div>
  );
}
