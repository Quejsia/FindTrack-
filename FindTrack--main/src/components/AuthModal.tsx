import React, { useState } from 'react';
import { Mail, Lock, User, ArrowRight, Eye, EyeOff, X, ShieldCheck, AlertCircle } from 'lucide-react';
import { loginWithGoogle, loginWithEmail, registerWithEmail, auth } from '../firebase';
import { sendPasswordResetEmail } from 'firebase/auth';
import { motion } from 'motion/react';

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  onAuthSuccess: (user: any) => void;
  initialMode?: 'login' | 'signup';
}

export default function AuthModal({ isOpen, onClose, onAuthSuccess, initialMode = 'login' }: AuthModalProps) {
  const [mode, setMode] = useState<'login' | 'signup'>(initialMode);
  const [forgotMode, setForgotMode] = useState<boolean>(false);
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
    <div
      className="fixed inset-0 z-[1000] flex items-center justify-center overflow-y-auto bg-slate-950/60 p-4 backdrop-blur-sm"
      id="auth-modal-overlay"
      style={{ height: '100dvh' }}
    >
      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: 12 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95, y: 12 }}
        className="relative w-full max-w-md overflow-hidden rounded-[28px] border border-white/70 bg-[rgba(255,255,255,0.9)] shadow-[0_20px_70px_rgba(1,114,90,0.16)] backdrop-blur-xl max-h-[90dvh]"
        id="auth-modal-container"
      >
        <div className="pointer-events-none absolute inset-0 overflow-hidden">
          <div className="absolute -right-16 -top-20 h-40 w-40 rounded-full bg-teal-100/70 blur-3xl" />
          <div className="absolute -bottom-16 -left-16 h-48 w-48 rounded-full bg-emerald-100/60 blur-3xl" />
        </div>

        <button
          onClick={onClose}
          className="absolute right-4 top-4 rounded-full p-2 text-slate-400 transition-colors hover:bg-slate-100 hover:text-slate-600"
          title="Close"
          id="auth-close-btn"
          type="button"
        >
          <X className="h-4 w-4" />
        </button>

        <div className="relative p-6 sm:p-8">
          <div className="mb-6 text-center">
            <div className="mb-4 flex items-center justify-center">
              <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-[#01725a] text-white shadow-lg shadow-[#01725a]/20">
                <ShieldCheck className="h-6 w-6" />
              </div>
            </div>
            <h3 className="text-2xl font-semibold tracking-tight text-[#0f172a]" id="auth-form-title">
              FindTrack
            </h3>
            <p className="mt-2 text-sm text-slate-600">
              {mode === 'login' ? 'Welcome back to the community.' : 'Create your account to get started.'}
            </p>
          </div>

          {error && (
            <motion.div
              initial={{ opacity: 0, y: -5 }}
              animate={{ opacity: 1, y: 0 }}
              className="mb-4 flex items-start gap-2.5 rounded-xl border border-rose-100 bg-rose-50 p-3.5 text-sm text-rose-800 shadow-sm"
              id="auth-error-banner"
            >
              <AlertCircle className="mt-0.5 h-4 w-4 shrink-0 text-rose-500" />
              <span className="leading-relaxed">{error}</span>
            </motion.div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4" id="auth-main-form">
            {mode === 'signup' && (
              <div>
                <label className="mb-1.5 block text-[11px] font-semibold uppercase tracking-[0.2em] text-slate-500" htmlFor="signup-input-name">
                  Full Name
                </label>
                <div className="relative">
                  <User className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                  <input
                    id="signup-input-name"
                    type="text"
                    required
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    placeholder="Your name"
                    className="w-full rounded-xl border border-slate-200 bg-white/80 py-2.5 pl-10 pr-3 text-sm text-slate-800 outline-none transition focus:border-[#01725a] focus:ring-1 focus:ring-[#01725a]"
                  />
                </div>
              </div>
            )}

            <div>
              <label className="mb-1.5 block text-[11px] font-semibold uppercase tracking-[0.2em] text-slate-500" htmlFor="auth-input-email">
                Email Address
              </label>
              <div className="relative">
                <Mail className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                <input
                  id="auth-input-email"
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="you@example.com"
                  className="w-full rounded-xl border border-slate-200 bg-white/80 py-2.5 pl-10 pr-3 text-sm text-slate-800 outline-none transition focus:border-[#01725a] focus:ring-1 focus:ring-[#01725a]"
                />
              </div>
            </div>

            <div>
              <div className="mb-1.5 flex items-center justify-between">
                <label className="text-[11px] font-semibold uppercase tracking-[0.2em] text-slate-500" htmlFor="auth-input-password">
                  Password
                </label>
                {mode === 'login' && !forgotMode && (
                  <button
                    type="button"
                    className="text-[11px] font-semibold text-[#01725a] transition hover:text-[#005a45]"
                    onClick={() => { setForgotMode(true); setError(null); }}
                    id="auth-forgot-btn"
                  >
                    Forgot Password?
                  </button>
                )}
                {forgotMode && (
                  <button
                    type="button"
                    className="text-[11px] font-semibold text-slate-600 transition hover:text-slate-800"
                    onClick={() => { setForgotMode(false); setError(null); }}
                    id="auth-cancel-forgot-btn"
                  >
                    Cancel
                  </button>
                )}
              </div>
              <div className="relative">
                <Lock className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                <input
                  id="auth-input-password"
                  type={showPassword ? 'text' : 'password'}
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full rounded-xl border border-slate-200 bg-white/80 py-2.5 pl-10 pr-10 text-sm text-slate-800 outline-none transition focus:border-[#01725a] focus:ring-1 focus:ring-[#01725a]"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword((prev) => !prev)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 rounded-full p-1 text-slate-400 transition hover:text-[#01725a]"
                  title={showPassword ? 'Hide password' : 'Show password'}
                >
                  {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
            </div>

            {!forgotMode ? (
              <button
                type="submit"
                disabled={loading}
                className="flex w-full items-center justify-center gap-2 rounded-xl bg-[#01725a] px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-[#005a45] disabled:cursor-not-allowed disabled:opacity-70"
                id="auth-submit-btn"
              >
                <span>{loading ? (mode === 'login' ? 'Signing in…' : 'Creating account…') : mode === 'login' ? 'Sign In' : 'Create Account'}</span>
                <ArrowRight className="h-4 w-4" />
              </button>
            ) : (
              <button
                type="button"
                onClick={async () => {
                  setLoading(true); setError(null);
                  if (!email) {
                    setError('Please enter your email to reset password.');
                    setLoading(false);
                    return;
                  }
                  try {
                    await sendPasswordResetEmail(auth, email.trim());
                    setError(null);
                    alert('Password reset email sent. Check your inbox.');
                    setForgotMode(false);
                  } catch (err: any) {
                    console.error('Password reset failed:', err);
                    setError(err.message || 'Failed to send password reset email.');
                  } finally { setLoading(false); }
                }}
                disabled={loading}
                className="flex w-full items-center justify-center gap-2 rounded-xl bg-[#01725a] px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-[#005a45] disabled:cursor-not-allowed disabled:opacity-70"
                id="auth-forgot-submit"
              >
                <span>{loading ? 'Sending…' : 'Send reset email'}</span>
              </button>
            )}
          </form>

          <div className="mt-5 flex items-center gap-3">
            <div className="h-px flex-1 bg-slate-200" />
            <span className="text-[11px] font-semibold uppercase tracking-[0.2em] text-slate-400">Or continue with</span>
            <div className="h-px flex-1 bg-slate-200" />
          </div>

          <button
            onClick={handleGoogleSignIn}
            disabled={loading}
            className="mt-4 flex w-full items-center justify-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-semibold text-slate-700 shadow-sm transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-70"
            id="auth-google-btn"
            type="button"
          >
            <svg className="h-4 w-4" viewBox="0 0 24 24" width="24" height="24" xmlns="http://www.w3.org/2000/svg">
              <g transform="matrix(1, 0, 0, 1, 0, 0)">
                <path d="M21.35,11.1H12v2.7h5.38c-0.24,1.28 -0.96,2.37 -2.04,3.1v2.58h3.3c1.93,-1.78 3.04,-4.4 3.04,-7.48c0,-0.64 -0.06,-1.25 -0.17,-1.8Z" fill="#4285F4" />
                <path d="M12,20.5c2.57,0 4.71,-0.85 6.29,-2.3l-3.3,-2.58c-0.91,0.61 -2.08,0.98 -2.99,0.98c-2.3,0 -4.24,-1.55 -4.94,-3.64H3.61v2.46C5.18,16.29 8.35,20.5 12,20.5Z" fill="#34A853" />
                <path d="M7.06,12.96c-0.18,-0.54 -0.28,-1.11 -0.28,-1.7c0,-0.59 0.1,-1.16 0.28,-1.7V7.1H3.61c-0.62,1.24 -0.97,2.64 -0.97,4.12s0.35,2.88 0.97,4.12l3.45,-2.38Z" fill="#FBBC05" />
                <path d="M12,6.42c1.39,0 2.65,0.48 3.63,1.42l2.72,-2.72C16.71,3.64 14.57,3.18 12,3.18C8.35,3.18 5.18,7.39 3.61,10.63l3.45,2.33c0.7,-2.09 2.64,-3.64 4.94,-3.64Z" fill="#EA4335" />
              </g>
            </svg>
            <span>Continue with Google</span>
          </button>

          <div className="mt-6 text-center">
            <p className="text-sm text-slate-500">
              {mode === 'login' ? "Don't have an account? " : 'Already have an account? '}
              <button
                type="button"
                onClick={() => {
                  setMode(mode === 'login' ? 'signup' : 'login');
                  setError(null);
                }}
                className="font-semibold text-[#01725a] transition hover:text-[#005a45]"
                id="auth-toggle-mode-btn"
              >
                {mode === 'login' ? 'Sign up' : 'Sign in instead'}
              </button>
            </p>
          </div>
        </div>
      </motion.div>
    </div>
  );
}
