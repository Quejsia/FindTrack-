import React, { useState } from 'react';
import { Mail, Lock, User, ArrowRight, Sparkles, Radio, Eye, EyeOff, X, ShieldCheck, AlertCircle } from 'lucide-react';
import { auth, loginWithGoogle, loginWithEmail, registerWithEmail } from '../firebase';
import { motion } from 'motion/react';

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  onAuthSuccess: (user: any) => void;
  initialMode?: 'login' | 'signup';
}

export default function AuthModal({ isOpen, onClose, onAuthSuccess, initialMode = 'login' }: AuthModalProps) {
  const [mode, setMode] = useState<'login' | 'signup'>(initialMode);
  const [showPassword, setShowPassword] = useState<boolean>(false);
  const [email, setEmail] = useState<string>('');
  const [password, setPassword] = useState<string>('');
  const [fullName, setFullName] = useState<string>('');
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    // Simple fields validation
    if (!email || !password) {
      setError('Please fill in all required fields.');
      setLoading(false);
      return;
    }

    if (mode === 'signup' && !fullName) {
      setError('Please provide your full display name.');
      setLoading(false);
      return;
    }

    try {
      let user;
      if (mode === 'login') {
        user = await loginWithEmail(email, password);
      } else {
        user = await registerWithEmail(email, password, fullName);
      }
      onAuthSuccess(user);
      onClose();
    } catch (err: any) {
      console.error('Email authentication failure:', err);
      // Clean up common Firebase errors to look professional
      let friendlyMessage = err.message || 'An authentication error occurred.';
      if (friendlyMessage.includes('auth/invalid-credential') || friendlyMessage.includes('auth/wrong-password')) {
        friendlyMessage = 'Invalid email or password combination.';
      } else if (friendlyMessage.includes('auth/email-already-in-use')) {
        friendlyMessage = 'An account with this email already exists.';
      } else if (friendlyMessage.includes('auth/weak-password')) {
        friendlyMessage = 'Password must be at least 6 characters.';
      } else if (friendlyMessage.includes('auth/invalid-email')) {
        friendlyMessage = 'Please enter a valid email address.';
      }
      setError(friendlyMessage);
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleSignIn = async () => {
    setLoading(true);
    setError(null);
    try {
      const user = await loginWithGoogle();
      onAuthSuccess(user);
      onClose();
    } catch (err: any) {
      console.error('Google sign in failure:', err);
      setError(err.message || 'Failed to authenticate via Google.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/75 backdrop-blur-md overflow-y-auto" id="auth-modal-overlay">
      <motion.div 
        initial={{ opacity: 0, scale: 0.95, y: 15 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95, y: 15 }}
        className="relative w-full max-w-4xl bg-white rounded-3xl overflow-hidden shadow-2xl flex flex-col md:flex-row border border-slate-100 min-h-[550px]"
        id="auth-modal-container"
      >
        {/* Left Hand: Branding Desk (Beautiful style reflecting original index.html logo & style.css layouts) */}
        <div className="w-full md:w-5/12 bg-gradient-to-br from-indigo-950 via-slate-950 to-indigo-900 p-8 text-white flex flex-col justify-between relative overflow-hidden border-b md:border-b-0 md:border-r border-slate-900" id="auth-panel-branding">
          <div className="absolute top-0 left-0 w-full h-full opacity-5 pointer-events-none bg-[radial-gradient(circle_at_center,rgba(99,102,241,0.44)_0,transparent_100%)]"></div>
          
          <div className="relative z-10">
            <div className="flex items-center space-x-3 mb-10">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-indigo-600 text-white shadow-lg shadow-indigo-500/20">
                <Radio className="h-5 w-5 animate-pulse" />
              </div>
              <div>
                <span className="font-sans text-lg font-bold tracking-tight bg-gradient-to-r from-white via-slate-100 to-indigo-200 bg-clip-text text-transparent">FindTrack</span>
                <span className="block font-mono text-[8px] tracking-wider text-indigo-400 uppercase">Secure Lost & Found</span>
              </div>
            </div>

            <div className="space-y-6">
              <h2 className="font-sans text-2xl font-extrabold tracking-tight leading-all leading-tight">
                Securely Reunite With Your Belongings
              </h2>
              <p className="font-sans text-xs text-slate-350 leading-relaxed text-slate-300">
                Welcome back to FindTrack. Our matching platform operates under zero-trust strict user data isolation so your metadata never leaks.
              </p>
            </div>
          </div>

          <div className="relative z-10 mt-8 space-y-4 pt-6 border-t border-white/10 hidden md:block">
            <div className="flex items-start gap-3">
              <ShieldCheck className="h-5 w-5 text-emerald-400 shrink-0 mt-0.5" />
              <div>
                <h4 className="font-sans text-xs font-semibold text-slate-100">Zero-Trust Architecture</h4>
                <p className="font-sans text-[10px] text-slate-450 text-slate-400 mt-0.5">Strictly isolating item directories so users only see their relevant catalog matching paths.</p>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <Sparkles className="h-5 w-5 text-indigo-400 shrink-0 mt-0.5" />
              <div>
                <h4 className="font-sans text-xs font-semibold text-slate-100">Gemini Match Analysis</h4>
                <p className="font-sans text-[10px] text-slate-450 text-slate-400 mt-0.5">Calculating exact overlap scores instantly based on visual contours and textual descriptions.</p>
              </div>
            </div>
          </div>
        </div>

        {/* Right Hand: Interactive Login / Signup Form (Injecting style.css look and login.html/signup.html tags) */}
        <div className="w-full md:w-7/12 p-8 sm:p-10 flex flex-col justify-between bg-white relative" id="auth-panel-form">
          {/* Close button */}
          <button 
            onClick={onClose}
            className="absolute top-4 right-4 rounded-full p-2 text-slate-400 hover:bg-slate-50 hover:text-slate-600 transition-colors"
            title="Go Back"
            id="auth-close-btn"
          >
            <X className="h-4 w-4" />
          </button>

          <div className="w-full max-w-md mx-auto space-y-6">
            {/* Form Headers */}
            <div className="text-center md:text-left space-y-1.5">
              <h3 className="font-sans text-xl font-bold tracking-tight text-slate-900" id="auth-form-title">
                {mode === 'login' ? 'Sign In to FindTrack' : 'Create Your FindTrack Account'}
              </h3>
              <p className="font-sans text-xs text-slate-500">
                {mode === 'login' 
                  ? 'Access your items, matching suggestions, and open directories securely' 
                  : 'Be one of the first users of Lost & Found System'
                }
              </p>
            </div>

            {/* Error banner */}
            {error && (
              <motion.div 
                initial={{ opacity: 0, y: -5 }}
                animate={{ opacity: 1, y: 0 }}
                className="flex items-start gap-2.5 p-3.5 rounded-xl bg-rose-50 border border-rose-100 font-sans text-xs text-rose-800 shadow-sm"
                id="auth-error-banner"
              >
                <AlertCircle className="h-4 w-4 text-rose-500 shrink-0 mt-0.5" />
                <span className="leading-relaxed">{error}</span>
              </motion.div>
            )}

            {/* Form Content */}
            <form onSubmit={handleSubmit} className="space-y-4" id="auth-main-form">
              {mode === 'signup' && (
                <div className="space-y-1">
                  <label className="font-sans text-[10px] font-bold text-slate-500 uppercase tracking-wider block">Full Name</label>
                  <div className="relative">
                    <User className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
                    <input
                      type="text"
                      required
                      value={fullName}
                      onChange={(e) => setFullName(e.target.value)}
                      placeholder="e.g. Carl Jaya"
                      className="w-full rounded-xl border border-slate-200 bg-slate-50 pl-10 pr-3 py-2 font-sans text-xs text-slate-800 transition focus:border-indigo-500 focus:bg-white focus:outline-none"
                      id="signup-input-name"
                    />
                  </div>
                </div>
              )}

              <div className="space-y-1">
                <label className="font-sans text-[10px] font-bold text-slate-500 uppercase tracking-wider block">Email Address</label>
                <div className="relative">
                  <Mail className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
                  <input
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="you@example.com"
                    className="w-full rounded-xl border border-slate-200 bg-slate-50 pl-10 pr-3 py-2 font-sans text-xs text-slate-800 transition focus:border-indigo-500 focus:bg-white focus:outline-none"
                    id="auth-input-email"
                  />
                </div>
              </div>

              <div className="space-y-1">
                <div className="flex items-center justify-between">
                  <label className="font-sans text-[10px] font-bold text-slate-500 uppercase tracking-wider block">Password</label>
                  {mode === 'login' && (
                    <a className="font-sans text-[10px] font-bold text-indigo-600 hover:text-indigo-800 cursor-not-allowed">
                      Forgot Password?
                    </a>
                  )}
                </div>
                <div className="relative">
                  <Lock className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
                  <input
                    type={showPassword ? 'text' : 'password'}
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="••••••••"
                    className="w-full rounded-xl border border-slate-200 bg-slate-50 pl-10 pr-10 py-2 font-sans text-xs text-slate-800 transition focus:border-indigo-500 focus:bg-white focus:outline-none"
                    id="auth-input-password"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-2 p-1 text-slate-400 hover:text-indigo-600 rounded transition-all duration-200 ease-out hover:scale-115 active:scale-90 active:rotate-3 cursor-pointer"
                    style={{ transition: 'all 0.2s ease' }}
                    title={showPassword ? 'Hide password' : 'Show password'}
                  >
                    <div className="transition-all duration-200" style={{ transition: 'all 0.2s ease' }}>
                      {showPassword ? (
                        <EyeOff className="h-4 w-4 text-indigo-600" />
                      ) : (
                        <Eye className="h-4 w-4" />
                      )}
                    </div>
                  </button>
                </div>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full inline-flex items-center justify-center gap-1.5 rounded-xl bg-slate-950 hover:bg-slate-800 text-white font-sans text-xs font-semibold py-2.5 shadow-md active:scale-98 transition disabled:opacity-50"
                id="auth-submit-btn"
              >
                {loading ? (
                  <span>Syncing...</span>
                ) : (
                  <>
                    <span>{mode === 'login' ? 'Secure Log In' : 'Register Account'}</span>
                    <ArrowRight className="h-3.5 w-3.5" />
                  </>
                )}
              </button>
            </form>

            {/* Divider */}
            <div className="relative flex py-2 items-center">
              <div className="flex-grow border-t border-slate-200"></div>
              <span className="flex-shrink mx-3 text-[10px] font-bold tracking-wider text-slate-400 uppercase font-sans">Or continue with</span>
              <div className="flex-grow border-t border-slate-200"></div>
            </div>

            {/* Google OAuth Login */}
            <button
              onClick={handleGoogleSignIn}
              disabled={loading}
              className="w-full inline-flex items-center justify-center space-x-2.5 rounded-xl border border-slate-200 bg-white px-4 py-2.5 font-sans text-xs font-semibold text-slate-700 shadow-sm hover:bg-slate-50 transition"
              id="auth-google-btn"
            >
              <svg className="h-4 w-4" viewBox="0 0 24 24" width="24" height="24" xmlns="http://www.w3.org/2000/svg">
                <g transform="matrix(1, 0, 0, 1, 0, 0)">
                  <path d="M21.35,11.1H12v2.7h5.38c-0.24,1.28 -0.96,2.37 -2.04,3.1v2.58h3.3c1.93,-1.78 3.04,-4.4 3.04,-7.48c0,-0.64 -0.06,-1.25 -0.17,-1.8Z" fill="#4285F4" />
                  <path d="M12,20.5c2.57,0 4.71,-0.85 6.29,-2.3l-3.3,-2.58c-0.91,0.61 -2.08,0.98 -2.99,0.98c-2.3,0 -4.24,-1.55 -4.94,-3.64H3.61v2.46C5.18,16.29 8.35,20.5 12,20.5Z" fill="#34A853" />
                  <path d="M7.06,12.96c-0.18,-0.54 -0.28,-1.11 -0.28,-1.7c0,-0.59 0.1,-1.16 0.28,-1.7V7.1H3.61c-0.62,1.24 -0.97,2.64 -0.97,4.12s0.35,2.88 0.97,4.12l3.45,-2.38Z" fill="#FBBC05" />
                  <path d="M12,6.42c1.39,0 2.65,0.48 3.63,1.42l2.72,-2.72C16.71,3.64 14.57,3.18 12,3.18C8.35,3.18 5.18,7.39 3.61,10.63l3.45,2.33c0.7,-2.09 2.64,-3.64 4.94,-3.64Z" fill="#EA4335" />
                </g>
              </svg>
              <span>Authentic Google Sign-In</span>
            </button>
          </div>

          {/* Toggle login vs signup (Simulates going from login.html to signup.html and vice-versa) */}
          <div className="text-center mt-6">
            <p className="font-sans text-xs text-slate-500">
              {mode === 'login' ? "Don't have an account? " : "Already have an account? "}
              <button
                onClick={() => {
                  setMode(mode === 'login' ? 'signup' : 'login');
                  setError(null);
                }}
                className="font-semibold text-indigo-600 hover:text-indigo-800 transition"
                id="auth-toggle-mode-btn"
              >
                {mode === 'login' ? 'Create a free account' : 'Sign In instead'}
              </button>
            </p>
          </div>
        </div>
      </motion.div>
    </div>
  );
}
