import React from 'react';
import { User } from 'firebase/auth';
import { loginWithGoogle, logOut } from '../firebase';
import { Search, Loader2, LogOut, Radio, PlusCircle, ShieldAlert } from 'lucide-react';

interface HeaderProps {
  user: User | null;
  loadingAuth: boolean;
  onOpenNewItemModal: () => void;
}

export default function Header({ user, loadingAuth, onOpenNewItemModal }: HeaderProps) {
  return (
    <header className="sticky top-0 z-40 w-full border-b border-slate-200 bg-white/80 backdrop-blur-md" id="app-header">
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
        {/* Branding */}
        <div className="flex items-center space-x-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-indigo-600 text-white shadow-md shadow-indigo-100">
            <Radio className="h-6 w-6 animate-pulse" />
          </div>
          <div>
            <h1 className="font-sans text-xl font-bold tracking-tight text-slate-950">FindTrack</h1>
            <p className="font-mono text-[9px] tracking-wider text-slate-500 uppercase">AI-MATCHED LOST & FOUND</p>
          </div>
        </div>

        {/* User Info / Controls */}
        <div className="flex items-center space-x-4">
          {loadingAuth ? (
            <Loader2 className="h-5 w-5 animate-spin text-slate-400" />
          ) : user ? (
            <div className="flex items-center space-x-3">
              <button
                onClick={onOpenNewItemModal}
                className="inline-flex items-center space-x-1.5 rounded-lg bg-indigo-600 px-4 py-2 font-sans text-xs font-semibold text-white shadow-sm hover:bg-indigo-500 transition-colors"
                id="btn-register-item"
              >
                <PlusCircle className="h-4 w-4" />
                <span>Submit Item</span>
              </button>

              <div className="h-8 w-px bg-slate-200 hidden sm:block"></div>

              <div className="flex items-center space-x-2">
                {user.photoURL ? (
                  <img
                    src={user.photoURL}
                    alt={user.displayName || "User profile"}
                    className="h-8 w-8 rounded-full border border-slate-200"
                    referrerPolicy="no-referrer"
                  />
                ) : (
                  <div className="flex h-8 w-8 items-center justify-center rounded-full bg-slate-100 text-slate-700 font-bold font-sans text-sm">
                    {user.displayName?.charAt(0) || user.email?.charAt(0).toUpperCase()}
                  </div>
                )}
                <div className="hidden md:block text-left">
                  <p className="font-sans text-xs font-semibold text-slate-900 leading-tight">
                    {user.displayName || "Authenticated"}
                  </p>
                  <p className="font-mono text-[9px] text-slate-400 leading-tight">
                    {user.email}
                  </p>
                </div>

                <button
                  onClick={logOut}
                  title="Sign Out"
                  className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-50 hover:text-slate-600 transition-colors"
                  id="btn-logout"
                >
                  <LogOut className="h-4 w-4" />
                </button>
              </div>
            </div>
          ) : (
            <div className="flex items-center space-x-3">
              <div className="hidden sm:flex items-center space-x-1 text-slate-500 text-xs">
                <ShieldAlert className="h-3.5 w-3.5 text-amber-500" />
                <span>Guest Mode (Sign in to post items)</span>
              </div>
              <button
                onClick={() => loginWithGoogle().catch(console.error)}
                className="inline-flex items-center space-x-2 rounded-lg border border-slate-200 bg-white px-3.5 py-1.5 font-sans text-xs font-semibold text-slate-700 shadow-sm hover:bg-slate-50 transition-colors"
                id="btn-login-google"
              >
                {/* Simplified Vector Google icon */}
                <svg className="h-4 w-4" viewBox="0 0 24 24" width="24" height="24" xmlns="http://www.w3.org/2000/svg">
                  <g transform="matrix(1, 0, 0, 1, 0, 0)">
                    <path d="M21.35,11.1H12v2.7h5.38c-0.24,1.28 -0.96,2.37 -2.04,3.1v2.58h3.3c1.93,-1.78 3.04,-4.4 3.04,-7.48c0,-0.64 -0.06,-1.25 -0.17,-1.8Z" fill="#4285F4" />
                    <path d="M12,20.5c2.57,0 4.71,-0.85 6.29,-2.3l-3.3,-2.58c-0.91,0.61 -2.08,0.98 -2.99,0.98c-2.3,0 -4.24,-1.55 -4.94,-3.64H3.61v2.46C5.18,16.29 8.35,20.5 12,20.5Z" fill="#34A853" />
                    <path d="M7.06,12.96c-0.18,-0.54 -0.28,-1.11 -0.28,-1.7c0,-0.59 0.1,-1.16 0.28,-1.7V7.1H3.61c-0.62,1.24 -0.97,2.64 -0.97,4.12s0.35,2.88 0.97,4.12l3.45,-2.38Z" fill="#FBBC05" />
                    <path d="M12,6.42c1.39,0 2.65,0.48 3.63,1.42l2.72,-2.72C16.71,3.64 14.57,3.18 12,3.18C8.35,3.18 5.18,7.39 3.61,10.63l3.45,2.33c0.7,-2.09 2.64,-3.64 4.94,-3.64Z" fill="#EA4335" />
                  </g>
                </svg>
                <span>Sign in with Google</span>
              </button>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}
