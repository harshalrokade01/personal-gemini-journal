import React, { useState, useEffect, useCallback } from 'react';
import { User, signInWithPopup, signOut, onAuthStateChanged } from 'firebase/auth';
import { auth, googleProvider } from './lib/firebase';
import {
  saveReflection,
  updateReflection,
  deleteReflection,
  subscribeToUserReflections,
  syncUserProfile,
} from './lib/firestoreService';
import { Reflection } from './types';
import { Navbar } from './components/Navbar';
import { LandingPage } from './components/LandingPage';
import { ReflectionComposer } from './components/ReflectionComposer';
import { ReflectionHistory } from './components/ReflectionHistory';
import { ReflectionModal } from './components/ReflectionModal';
import { DeleteConfirmModal } from './components/DeleteConfirmModal';
import { ToastContainer, ToastMessage } from './components/Toast';
import { Sparkles, BookOpen, PenTool, Layers } from 'lucide-react';

export default function App() {
  const [user, setUser] = useState<User | null>(null);
  const [authLoading, setAuthLoading] = useState(true);
  const [authError, setAuthError] = useState<string | null>(null);

  const [reflections, setReflections] = useState<Reflection[]>([]);
  const [reflectionsLoading, setReflectionsLoading] = useState(false);
  const [activeReflection, setActiveReflection] = useState<Reflection | null>(null);

  const [isSaving, setIsSaving] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);
  const [lastSavedAt, setLastSavedAt] = useState<string | null>(null);

  // Modals & Mobile View State
  const [modalReflection, setModalReflection] = useState<Reflection | null>(null);
  const [deleteTargetId, setDeleteTargetId] = useState<string | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [mobileTab, setMobileTab] = useState<'composer' | 'history'>('composer');

  // Toasts
  const [toasts, setToasts] = useState<ToastMessage[]>([]);

  const addToast = (type: 'success' | 'error' | 'info', text: string) => {
    const id = `toast-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`;
    setToasts((prev) => [...prev, { id, type, text }]);
  };

  const removeToast = (id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  };

  // Auth State Listener
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(
      auth,
      async (currentUser) => {
        setUser(currentUser);
        setAuthLoading(false);

        if (currentUser) {
          try {
            await syncUserProfile({
              uid: currentUser.uid,
              displayName: currentUser.displayName,
              email: currentUser.email,
              photoURL: currentUser.photoURL,
            });
          } catch (profileErr) {
            console.error('Failed to sync user profile:', profileErr);
          }
        } else {
          setReflections([]);
          setActiveReflection(null);
        }
      },
      (error) => {
        console.error('Auth state change error:', error);
        setAuthError(error.message);
        setAuthLoading(false);
      }
    );

    return () => unsubscribe();
  }, []);

  // Subscribe to User Reflections on Auth
  useEffect(() => {
    if (!user) return;

    setReflectionsLoading(true);
    const unsubscribe = subscribeToUserReflections(
      user.uid,
      (data) => {
        setReflections(data);
        setReflectionsLoading(false);

        // If currently editing a reflection, update its reference
        if (activeReflection?.id) {
          const updatedActive = data.find((r) => r.id === activeReflection.id);
          if (updatedActive) {
            setActiveReflection(updatedActive);
          }
        }
      },
      (err) => {
        console.error('Reflections sync error:', err);
        addToast('error', 'Unable to sync reflections from Firestore.');
        setReflectionsLoading(false);
      }
    );

    return () => unsubscribe();
  }, [user?.uid]);

  // Google Sign In Handler
  const handleSignIn = async () => {
    setAuthLoading(true);
    setAuthError(null);
    try {
      await signInWithPopup(auth, googleProvider);
      addToast('success', 'Successfully signed in with Google!');
    } catch (err: any) {
      console.error('Google Sign In error:', err);
      // Clean error message
      let msg = err?.message || 'Failed to sign in.';
      if (err?.code === 'auth/popup-closed-by-user') {
        msg = 'Sign-in popup closed. Please try again.';
      } else if (err?.code === 'auth/cancelled-popup-request') {
        msg = 'Sign-in request was cancelled.';
      }
      setAuthError(msg);
      addToast('error', msg);
    } finally {
      setAuthLoading(false);
    }
  };

  // Sign Out Handler
  const handleSignOut = async () => {
    try {
      await signOut(auth);
      setUser(null);
      setActiveReflection(null);
      setReflections([]);
      addToast('info', 'You have been signed out.');
    } catch (err: any) {
      console.error('Sign Out error:', err);
      addToast('error', 'Error signing out.');
    }
  };

  // Start New Reflection
  const handleNewReflection = () => {
    setActiveReflection(null);
    setMobileTab('composer');
    addToast('info', 'Started new reflection canvas.');
  };

  // Save Reflection to Firestore
  const handleSaveReflection = async (
    reflectionData: Partial<Reflection>
  ): Promise<string | void> => {
    if (!user) {
      addToast('error', 'You must be signed in to save entries.');
      return;
    }

    setIsSaving(true);
    setSaveError(null);

    try {
      if (activeReflection?.id) {
        // Update existing document
        await updateReflection(user.uid, activeReflection.id, {
          ...reflectionData,
          updatedAt: new Date().toISOString(),
        });
        setLastSavedAt(new Date().toISOString());
        return activeReflection.id;
      } else {
        // Create new document
        const newId = await saveReflection(user.uid, {
          userId: user.uid,
          title: reflectionData.title || 'Untitled Reflection',
          category: reflectionData.category || 'daily',
          mode: reflectionData.mode || 'reflect',
          initialPrompt: reflectionData.initialPrompt || '',
          messages: reflectionData.messages || [],
          tags: reflectionData.tags || [],
          summary: reflectionData.summary,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        });

        // Set active reflection with new ID
        setActiveReflection({
          id: newId,
          userId: user.uid,
          title: reflectionData.title || 'Untitled Reflection',
          category: reflectionData.category || 'daily',
          mode: reflectionData.mode || 'reflect',
          initialPrompt: reflectionData.initialPrompt || '',
          messages: reflectionData.messages || [],
          tags: reflectionData.tags || [],
          summary: reflectionData.summary,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        });

        setLastSavedAt(new Date().toISOString());
        addToast('success', 'Reflection saved to Firestore!');
        return newId;
      }
    } catch (err: any) {
      console.error('Firestore save failed:', err);
      const errMsg = err?.message || 'Failed to persist reflection to Cloud Firestore.';
      setSaveError(errMsg);
      addToast('error', errMsg);
      throw err;
    } finally {
      setIsSaving(false);
    }
  };

  // Select Reflection to Edit
  const handleSelectReflection = (reflection: Reflection) => {
    setActiveReflection(reflection);
    setMobileTab('composer');
  };

  // Delete Reflection Flow
  const handleDeleteReflection = (id: string) => {
    setDeleteTargetId(id);
  };

  const handleConfirmDelete = async () => {
    if (!user || !deleteTargetId) return;

    setIsDeleting(true);
    try {
      await deleteReflection(user.uid, deleteTargetId);
      if (activeReflection?.id === deleteTargetId) {
        setActiveReflection(null);
      }
      addToast('success', 'Reflection deleted.');
      setDeleteTargetId(null);
    } catch (err: any) {
      console.error('Delete error:', err);
      addToast('error', 'Failed to delete reflection.');
    } finally {
      setIsDeleting(false);
    }
  };

  // Find target reflection title for delete dialog
  const targetDeleteReflection = reflections.find((r) => r.id === deleteTargetId);

  return (
    <div className="min-h-screen bg-[#FDFDFD] text-gray-900 flex flex-col font-sans selection:bg-indigo-100 selection:text-indigo-900">
      {/* Toast Notification Container */}
      <ToastContainer toasts={toasts} onDismiss={removeToast} />

      {/* Top Navbar */}
      <Navbar
        user={user}
        onSignOut={handleSignOut}
        onNewReflection={handleNewReflection}
        isSaving={isSaving}
        lastSavedAt={lastSavedAt}
        activeCount={reflections.length}
      />

      {/* Main View Area */}
      {authLoading ? (
        <div className="flex-1 flex flex-col items-center justify-center p-8 space-y-4">
          <div className="w-10 h-10 rounded-2xl bg-indigo-50 border border-indigo-100 text-indigo-600 flex items-center justify-center animate-pulse">
            <Sparkles className="w-6 h-6 animate-spin" />
          </div>
          <p className="text-sm font-medium text-gray-500">Initializing secure session...</p>
        </div>
      ) : !user ? (
        /* Landing View when unauthenticated */
        <LandingPage
          onSignIn={handleSignIn}
          isLoading={authLoading}
          error={authError}
        />
      ) : (
        /* Authenticated Workspace */
        <div className="flex-1 max-w-7xl w-full mx-auto p-3 sm:p-5 lg:p-6 flex flex-col">
          {/* Mobile Tab Switcher */}
          <div className="flex lg:hidden items-center justify-center gap-1.5 mb-3 bg-gray-100 p-1 rounded-xl border border-gray-200">
            <button
              onClick={() => setMobileTab('composer')}
              className={`flex-1 flex items-center justify-center gap-2 py-2 rounded-lg text-xs font-medium transition-all ${
                mobileTab === 'composer'
                  ? 'bg-white text-gray-900 shadow-xs'
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              <PenTool className="w-3.5 h-3.5" />
              <span>Reflection Canvas</span>
            </button>
            <button
              onClick={() => setMobileTab('history')}
              className={`flex-1 flex items-center justify-center gap-2 py-2 rounded-lg text-xs font-medium transition-all ${
                mobileTab === 'history'
                  ? 'bg-white text-gray-900 shadow-xs'
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              <BookOpen className="w-3.5 h-3.5" />
              <span>Past Journal Entries ({reflections.length})</span>
            </button>
          </div>

          {/* Desktop 2-Column Split Layout / Responsive Layout */}
          <div className="flex-1 grid grid-cols-1 lg:grid-cols-12 gap-5 h-[calc(100vh-6.5rem)] min-h-[580px]">
            {/* Left Sidebar: Journal History */}
            <div
              className={`lg:col-span-4 h-full ${
                mobileTab === 'history' ? 'block' : 'hidden lg:block'
              }`}
            >
              <ReflectionHistory
                reflections={reflections}
                selectedId={activeReflection?.id || null}
                onSelectReflection={handleSelectReflection}
                onDeleteReflection={handleDeleteReflection}
                onNewReflection={handleNewReflection}
                onViewModal={(ref) => setModalReflection(ref)}
                isLoading={reflectionsLoading}
              />
            </div>

            {/* Right Canvas: Reflection Composer & Multi-Turn Gemini Dialogue */}
            <div
              className={`lg:col-span-8 h-full ${
                mobileTab === 'composer' ? 'block' : 'hidden lg:block'
              }`}
            >
              <ReflectionComposer
                currentReflection={activeReflection}
                onSave={handleSaveReflection}
                onNew={handleNewReflection}
                onDelete={handleDeleteReflection}
                isSaving={isSaving}
                saveError={saveError}
                onClearSaveError={() => setSaveError(null)}
              />
            </div>
          </div>
        </div>
      )}

      {/* Detail Modal for Full Screen Reader */}
      <ReflectionModal
        reflection={modalReflection}
        onClose={() => setModalReflection(null)}
        onContinueInEditor={(ref) => {
          setActiveReflection(ref);
          setMobileTab('composer');
        }}
      />

      {/* Delete Confirmation Modal */}
      <DeleteConfirmModal
        isOpen={Boolean(deleteTargetId)}
        title={targetDeleteReflection?.title}
        onClose={() => setDeleteTargetId(null)}
        onConfirm={handleConfirmDelete}
        isDeleting={isDeleting}
      />
    </div>
  );
}
