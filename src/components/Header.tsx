import React, { useState } from 'react';
import { User } from 'firebase/auth';
import { logOut } from '../firebase';
import { Loader2, LogOut, Radio, PlusCircle, ShieldAlert, Menu, X, Shield, Sparkles, LogIn, UserPlus } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

interface HeaderProps {
  user: User | null;
  loadingAuth: boolean;
  onOpenNewItemModal: () => void;
  onOpenAuthModal: (mode: 'login' | 'signup') => void;
}

export default function Header({ user, loadingAuth, onOpenNewItemModal, onOpenAuthModal }: HeaderProps) {
  const [mobileMenuOpen, setMobileMenuOpen] = useState<boolean>(false);

  const toggleMobileMenu = () => setMobileMenuOpen(!mobileMenuOpen);

  return (
    <header className="sticky top-0 z-40 w-full border-b border-slate-200 bg-white/75 backdrop-blur-md" id="app-header">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="flex h-16 items-center justify-between">
          
          {/* Left Brand Area (Custom original style.css layout & branding logo tags) */}
            <div className="flex items-center space-x-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-tr from-indigo-600 to-indigo-500 text-white shadow-md shadow-indigo-100">
                <Radio className="h-6 w-6 animate-pulse" />
              </div>
              <div className="text-left">
                <h1 className="font-sans text-lg font-bold tracking-tight text-slate-950">Lost & Found System</h1>
                <p className="font-mono text-[8px] tracking-wider text-indigo-600 font-bold uppercase leading-tight">AI-Matched Search & Reunite</p>
              </div>
            </div>

          {/* Center / Navigation Links for Desktop (Original Custom index.html Navigation Items) */}
          <nav className="hidden md:flex items-center space-x-6 text-xs font-semibold text-slate-650" id="desktop-nav-links">
            <a href="#items-grid-section" className="text-slate-600 hover:text-indigo-600 hover:bg-slate-50 px-3 py-1.5 rounded-lg transition-colors">
              Registry Feed
            </a>
            <a href="#filters-panel" className="text-slate-600 hover:text-indigo-600 hover:bg-slate-50 px-3 py-1.5 rounded-lg transition-colors">
              Database Search
            </a>
            {user && (
              <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-500/10 px-2.5 py-0.5 text-[10px] font-bold text-emerald-700 border border-emerald-500/15">
                <Shield className="h-3 w-3" />
                <span>Isolated Sandbox Live</span>
              </span>
            )}
          </nav>

          {/* Right Desktop Authorization & Controls (Original custom styling) */}
          <div className="hidden md:flex items-center space-x-4">
            {loadingAuth ? (
              <Loader2 className="h-5 w-5 animate-spin text-indigo-600" />
            ) : user ? (
              <div className="flex items-center space-x-3">
                <button
                  onClick={onOpenNewItemModal}
                  className="inline-flex items-center space-x-1.5 rounded-xl bg-slate-950 hover:bg-slate-800 px-4 py-2 font-sans text-xs font-bold text-white shadow-md hover:shadow-lg transition-all active:scale-98"
                  id="btn-register-item"
                >
                  <PlusCircle className="h-4 w-4 text-indigo-400" />
                  <span>Submit Item</span>
                </button>

                <div className="h-6 w-px bg-slate-200"></div>

                <div className="flex items-center space-x-2.5 bg-slate-50 border border-slate-100 rounded-xl p-1.5 pr-3">
                  {user.photoURL ? (
                    <img
                      src={user.photoURL}
                      alt={user.displayName || "User"}
                      className="h-7 w-7 rounded-lg border border-slate-200"
                      referrerPolicy="no-referrer"
                    />
                  ) : (
                    <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-indigo-100 text-indigo-700 font-bold font-sans text-xs">
                      {user.displayName?.charAt(0) || user.email?.charAt(0).toUpperCase()}
                    </div>
                  )}
                  <div className="text-left">
                    <p className="font-sans text-[11px] font-bold text-slate-900 leading-none">
                      {user.displayName || "Authenticated"}
                    </p>
                    <p className="font-mono text-[8px] text-slate-400 leading-none mt-0.5">
                      {user.email}
                    </p>
                  </div>

                  <button
                    onClick={logOut}
                    title="Sign Out"
                    className="ml-2 rounded-lg p-1 text-slate-400 hover:bg-white hover:text-rose-500 hover:border-slate-250 border border-transparent transition-colors shadow-sm cursor-pointer"
                    id="btn-logout"
                  >
                    <LogOut className="h-3.5 w-3.5" />
                  </button>
                </div>
              </div>
            ) : (
              <div className="flex items-center space-x-2.5">
                <button
                  onClick={() => onOpenAuthModal('login')}
                  className="inline-flex items-center space-x-1.5 rounded-xl border border-slate-200 bg-white px-3.5 py-2 font-sans text-xs font-semibold text-slate-700 shadow-sm hover:bg-slate-50 transition"
                  id="btn-login-trigger"
                >
                  <LogIn className="h-3.5 w-3.5 text-slate-400" />
                  <span>Sign In</span>
                </button>
                <button
                  onClick={() => onOpenAuthModal('signup')}
                  className="inline-flex items-center space-x-1.5 rounded-xl bg-indigo-600 px-3.5 py-2 font-sans text-xs font-bold text-white shadow-sm hover:bg-indigo-500 transition"
                  id="btn-register-trigger"
                >
                  <UserPlus className="h-3.5 w-3.5 text-indigo-200" />
                  <span>Register</span>
                </button>
              </div>
            )}
          </div>

          {/* Mobile Right: Hamburger Menu Toggle */}
          <div className="flex md:hidden items-center space-x-2">
            {loadingAuth && <Loader2 className="h-4 w-4 animate-spin text-slate-400" />}
            
            <button
              onClick={toggleMobileMenu}
              className="inline-flex items-center justify-center rounded-xl p-2 text-slate-500 hover:bg-slate-100 hover:text-slate-800 transition"
              aria-label="Toggle menu"
              id="mobile-hud-menu-btn"
            >
              {mobileMenuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
            </button>
          </div>

        </div>
      </div>

      {/* Mobile Menu Overlay Drawer (Dynamic Burger Menu with sliding animations) */}
      <AnimatePresence>
        {mobileMenuOpen && (
          <motion.div 
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="md:hidden border-t border-slate-200 bg-white overflow-hidden shadow-inner"
            id="mobile-drawer-portal"
          >
            <div className="space-y-4 px-4 py-5 font-sans">
              <nav className="flex flex-col space-y-2 mb-4">
                <a 
                  href="#items-grid-section" 
                  onClick={() => setMobileMenuOpen(false)}
                  className="font-sans text-xs font-semibold text-slate-650 hover:bg-slate-50 px-3 py-2 rounded-xl"
                >
                  Registry Feed
                </a>
                <a 
                  href="#filters-panel" 
                  onClick={() => setMobileMenuOpen(false)}
                  className="font-sans text-xs font-semibold text-slate-650 hover:bg-slate-50 px-3 py-2 rounded-xl"
                >
                  Database Search
                </a>
              </nav>

              {user ? (
                <div className="space-y-4 pt-4 border-t border-slate-100">
                  <div className="flex items-center space-x-3 px-1">
                    {user.photoURL ? (
                      <img
                        src={user.photoURL}
                        alt="User"
                        className="h-8 w-8 rounded-lg border border-slate-200"
                        referrerPolicy="no-referrer"
                      />
                    ) : (
                      <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-indigo-100 text-indigo-700 font-bold text-xs">
                        {user.displayName?.charAt(0) || user.email?.charAt(0).toUpperCase()}
                      </div>
                    )}
                    <div>
                      <p className="font-sans text-xs font-bold text-slate-900 leading-none">{user.displayName || "Authenticated"}</p>
                      <p className="font-mono text-[9px] text-slate-400 mt-1 leading-none">{user.email}</p>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-2">
                    <button
                      onClick={() => {
                        setMobileMenuOpen(false);
                        onOpenNewItemModal();
                      }}
                      className="inline-flex items-center justify-center space-x-1 py-2 px-3 rounded-xl bg-slate-950 font-sans text-xs font-bold text-white shadow"
                    >
                      <PlusCircle className="h-3.5 w-3.5 text-indigo-400" />
                      <span>Submit Item</span>
                    </button>
                    
                    <button
                      onClick={() => {
                        setMobileMenuOpen(false);
                        logOut();
                      }}
                      className="inline-flex items-center justify-center space-x-1.5 py-2 px-3 rounded-xl border border-rose-100 bg-rose-50/30 text-rose-600 font-sans text-xs font-semibold"
                    >
                      <LogOut className="h-3.5 w-3.5" />
                      <span>Sign Out</span>
                    </button>
                  </div>
                </div>
              ) : (
                <div className="pt-4 border-t border-slate-100 space-y-2">
                  <div className="flex items-center space-x-1.5 px-2 py-1 mb-2 text-[10px] text-amber-600 font-semibold bg-amber-50 rounded-lg">
                    <ShieldAlert className="h-3.5 w-3.5 shrink-0" />
                    <span>Guest Mode (Sign in to post items)</span>
                  </div>

                  <div className="grid grid-cols-2 gap-2">
                    <button
                      onClick={() => {
                        setMobileMenuOpen(false);
                        onOpenAuthModal('login');
                      }}
                      className="inline-flex items-center justify-center space-x-1 py-2 px-3 rounded-xl border border-slate-200 bg-white font-sans text-xs font-semibold text-slate-700"
                    >
                      <LogIn className="h-3.5 w-3.5 text-slate-400" />
                      <span>Sign In</span>
                    </button>
                    <button
                      onClick={() => {
                        setMobileMenuOpen(false);
                        onOpenAuthModal('signup');
                      }}
                      className="inline-flex items-center justify-center space-x-1 py-2 px-3 rounded-xl bg-indigo-600 font-sans text-xs font-bold text-white shadow-sm"
                    >
                      <UserPlus className="h-3.5 w-3.5 text-indigo-200" />
                      <span>Register</span>
                    </button>
                  </div>
                </div>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

    </header>
  );
}
