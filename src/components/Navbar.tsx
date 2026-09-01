import React from 'react';
import { User } from 'firebase/auth';
import { Sparkles, LogOut, BookOpen, ShieldCheck, Plus, CheckCircle2, RefreshCw } from 'lucide-react';

interface NavbarProps {
  user: User | null;
  onSignOut: () => void;
  onNewReflection: () => void;
  isSaving?: boolean;
  lastSavedAt?: string | null;
  activeCount?: number;
}

export const Navbar: React.FC<NavbarProps> = ({
  user,
  onSignOut,
  onNewReflection,
  isSaving = false,
  lastSavedAt,
  activeCount = 0,
}) => {
  return (
    <header className="sticky top-0 z-30 bg-white/95 backdrop-blur-md border-b border-gray-200 text-gray-900">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
        {/* Brand */}
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-indigo-600 flex items-center justify-center shadow-xs text-white font-bold">
            <Sparkles className="w-5 h-5 text-white" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="font-semibold text-lg tracking-tight text-gray-900">ReflectAI</span>
              <span className="text-[11px] font-mono px-2 py-0.5 rounded-full bg-indigo-50 text-indigo-700 border border-indigo-100">
                Gemini 3.6 Flash
              </span>
            </div>
            <p className="text-xs text-gray-500 hidden sm:block">Private Cloud-Isolated Journal</p>
          </div>
        </div>

        {/* Action Controls & User Info */}
        {user ? (
          <div className="flex items-center gap-3 sm:gap-4">
            {/* Sync / Save status indicator */}
            <div className="hidden md:flex items-center gap-1.5 text-xs text-gray-600 bg-gray-50 px-3 py-1.5 rounded-lg border border-gray-200">
              {isSaving ? (
                <>
                  <RefreshCw className="w-3.5 h-3.5 text-indigo-600 animate-spin" />
                  <span className="text-indigo-600 font-medium">Saving to Firestore...</span>
                </>
              ) : lastSavedAt ? (
                <>
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                  <span className="text-gray-700">Synced to Cloud</span>
                </>
              ) : (
                <>
                  <ShieldCheck className="w-3.5 h-3.5 text-gray-500" />
                  <span>Isolated Data</span>
                </>
              )}
            </div>

            {/* New Reflection Button */}
            <button
              id="new-reflection-btn"
              onClick={onNewReflection}
              className="inline-flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs sm:text-sm font-medium bg-indigo-600 hover:bg-indigo-700 text-white transition-all shadow-xs active:scale-95 cursor-pointer font-sans"
              title="Start a fresh reflection"
            >
              <Plus className="w-4 h-4" />
              <span>New Entry</span>
            </button>

            {/* User Profile dropdown/pill */}
            <div className="flex items-center gap-2.5 pl-2 border-l border-gray-200">
              {user.photoURL ? (
                <img
                  src={user.photoURL}
                  alt={user.displayName || 'User Avatar'}
                  className="w-8 h-8 rounded-full ring-1 ring-gray-200 object-cover"
                  referrerPolicy="no-referrer"
                />
              ) : (
                <div className="w-8 h-8 rounded-full bg-gray-100 text-gray-700 flex items-center justify-center text-xs font-semibold">
                  {user.displayName?.charAt(0) || user.email?.charAt(0) || 'U'}
                </div>
              )}

              <div className="hidden lg:block text-left">
                <p className="text-xs font-medium text-gray-900 truncate max-w-[120px]">
                  {user.displayName || 'Authenticated User'}
                </p>
                <p className="text-[10px] text-gray-500 truncate max-w-[120px]">
                  {user.email}
                </p>
              </div>

              {/* Sign Out Button */}
              <button
                id="sign-out-btn"
                onClick={onSignOut}
                className="p-2 rounded-lg text-gray-400 hover:text-gray-900 hover:bg-gray-100 transition-colors cursor-pointer"
                title="Sign out of account"
              >
                <LogOut className="w-4 h-4" />
              </button>
            </div>
          </div>
        ) : (
          <div className="flex items-center gap-2 text-xs text-gray-500">
            <ShieldCheck className="w-4 h-4 text-indigo-600" />
            <span>Secure Firebase Auth</span>
          </div>
        )}
      </div>
    </header>
  );
};
