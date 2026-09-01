import React from 'react';
import { User } from 'firebase/auth';
import { Sparkles, LogOut, BookOpen, ShieldCheck, Plus, CheckCircle2, RefreshCw, Sun, Moon } from 'lucide-react';
import { Theme } from '../lib/theme';

interface NavbarProps {
  user: User | null;
  onSignOut: () => void;
  onNewReflection: () => void;
  isSaving?: boolean;
  lastSavedAt?: string | null;
  activeCount?: number;
  theme: Theme;
  onToggleTheme: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({
  user,
  onSignOut,
  onNewReflection,
  isSaving = false,
  lastSavedAt,
  activeCount = 0,
  theme,
  onToggleTheme,
}) => {
  return (
    <header className="sticky top-0 z-30 bg-[var(--navbar-bg)] backdrop-blur-md border-b border-[var(--navbar-border)] text-[var(--text-primary)] transition-colors duration-200">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
        {/* Brand */}
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-indigo-600 flex items-center justify-center shadow-xs text-white font-bold shrink-0">
            <Sparkles className="w-5 h-5 text-white" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="font-semibold text-lg tracking-tight text-[var(--text-primary)]">ReflectAI</span>
              <span className="text-[11px] font-mono px-2 py-0.5 rounded-full bg-[var(--badge-bg)] text-[var(--badge-text)] border border-[var(--badge-border)]">
                Gemini 3.6 Flash
              </span>
            </div>
            <p className="text-xs text-[var(--text-muted)] hidden sm:block">Private Cloud-Isolated Journal</p>
          </div>
        </div>

        {/* Action Controls & Theme Toggle */}
        <div className="flex items-center gap-2 sm:gap-3">
          {/* Theme Toggle Button */}
          <button
            id="theme-toggle-btn"
            type="button"
            onClick={onToggleTheme}
            className="p-2 rounded-xl border border-[var(--border-primary)] bg-[var(--bg-surface)] hover:bg-[var(--bg-hover)] text-[var(--text-secondary)] hover:text-[var(--text-primary)] transition-all cursor-pointer shadow-2xs active:scale-95"
            title={theme === 'dark' ? 'Switch to light mode' : 'Switch to dark mode'}
            aria-label={theme === 'dark' ? 'Switch to light theme' : 'Switch to dark theme'}
          >
            {theme === 'dark' ? (
              <Sun className="w-4 h-4 text-amber-400 animate-in spin-in-90 duration-200" />
            ) : (
              <Moon className="w-4 h-4 text-indigo-600 animate-in spin-in-90 duration-200" />
            )}
          </button>

          {user ? (
            <div className="flex items-center gap-2 sm:gap-3">
              {/* Sync / Save status indicator */}
              <div className="hidden md:flex items-center gap-1.5 text-xs text-[var(--text-secondary)] bg-[var(--bg-muted)] px-3 py-1.5 rounded-lg border border-[var(--border-primary)]">
                {isSaving ? (
                  <>
                    <RefreshCw className="w-3.5 h-3.5 text-indigo-500 animate-spin" />
                    <span className="text-indigo-500 font-medium">Saving to Firestore...</span>
                  </>
                ) : lastSavedAt ? (
                  <>
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" />
                    <span className="text-[var(--text-primary)]">Synced to Cloud</span>
                  </>
                ) : (
                  <>
                    <ShieldCheck className="w-3.5 h-3.5 text-[var(--text-muted)]" />
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
                <span className="hidden sm:inline">New Entry</span>
              </button>

              {/* User Profile dropdown/pill */}
              <div className="flex items-center gap-2 pl-2 border-l border-[var(--border-primary)]">
                {user.photoURL ? (
                  <img
                    src={user.photoURL}
                    alt={user.displayName || 'User Avatar'}
                    className="w-8 h-8 rounded-full ring-1 ring-[var(--border-primary)] object-cover"
                    referrerPolicy="no-referrer"
                  />
                ) : (
                  <div className="w-8 h-8 rounded-full bg-[var(--bg-muted)] text-[var(--text-primary)] flex items-center justify-center text-xs font-semibold">
                    {user.displayName?.charAt(0) || user.email?.charAt(0) || 'U'}
                  </div>
                )}

                <div className="hidden lg:block text-left">
                  <p className="text-xs font-medium text-[var(--text-primary)] truncate max-w-[120px]">
                    {user.displayName || 'Authenticated User'}
                  </p>
                  <p className="text-[10px] text-[var(--text-muted)] truncate max-w-[120px]">
                    {user.email}
                  </p>
                </div>

                {/* Sign Out Button */}
                <button
                  id="sign-out-btn"
                  onClick={onSignOut}
                  className="p-2 rounded-lg text-[var(--text-muted)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-hover)] transition-colors cursor-pointer"
                  title="Sign out of account"
                >
                  <LogOut className="w-4 h-4" />
                </button>
              </div>
            </div>
          ) : (
            <div className="flex items-center gap-2 text-xs text-[var(--text-muted)]">
              <ShieldCheck className="w-4 h-4 text-indigo-500" />
              <span className="hidden sm:inline">Secure Firebase Auth</span>
            </div>
          )}
        </div>
      </div>
    </header>
  );
};
