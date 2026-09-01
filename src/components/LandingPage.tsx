import React, { useState } from 'react';
import { Sparkles, Shield, Lock, Brain, ArrowRight, BookOpen, Compass, HeartHandshake, CheckCircle2 } from 'lucide-react';

interface LandingPageProps {
  onSignIn: () => Promise<void>;
  isLoading: boolean;
  error?: string | null;
}

export const LandingPage: React.FC<LandingPageProps> = ({ onSignIn, isLoading, error }) => {
  const [activeTab, setActiveTab] = useState<'reflection' | 'brainstorm' | 'summary'>('reflection');

  const sampleConversations = {
    reflection: {
      prompt: "I'm feeling overwhelmed by prioritizing multiple projects at work, but I don't know which one will move the needle most.",
      response: "It's completely normal to feel paralyzed when all tasks seem equally urgent. Let's peel back the layers: Which of these projects, if completed with high excellence, would make the other two significantly easier or irrelevant? Take a breath and identify the core dependency."
    },
    brainstorm: {
      prompt: "I want to design a weekly ritual that helps me transition from intense coding sprints into deep rest on Friday evenings.",
      response: "Here are 4 intentional transition rituals to test:\n1. **The Terminal Shutdown Ceremony**: Commit all WIP branches, write a 3-bullet handover note to Monday-you, and close every browser tab.\n2. **Sensory Boundary**: Step outside for a 15-minute screen-free walk in natural light.\n3. **Physical Reset**: Wash your hands and face with cool water to signal a state change."
    },
    summary: {
      prompt: "Today we had our quarterly retrospective. We identified that async design reviews are slowing us down, but direct synchronous meetings break focus.",
      response: "**Key Takeaways & Proposed Compromise:**\n• *Core Tension*: Async latency vs. Sync focus disruption.\n• *Actionable Solution*: Implement 'Office Hours' windows (e.g., 2-3 PM Tuesdays/Thursdays) dedicated to unblocking reviews in real-time, keeping the rest of the week completely asynchronous."
    }
  };

  return (
    <div className="min-h-[calc(100vh-4rem)] flex flex-col justify-between bg-[#FDFDFD] text-gray-900">
      {/* Main Content */}
      <main className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 pt-12 pb-16">
        {/* Top Announcement Tag */}
        <div className="flex justify-center mb-6">
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-white border border-gray-200 text-xs text-gray-700 shadow-xs">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
            <span>Cloud Firestore User Isolation • Powered by Gemini 3.6 Flash</span>
          </div>
        </div>

        {/* Hero Section */}
        <div className="text-center max-w-3xl mx-auto">
          <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold tracking-tight text-gray-900 leading-[1.15]">
            Reflect deeply. <br className="hidden sm:inline" />
            <span className="font-serif-display italic font-normal text-indigo-600 text-5xl sm:text-6xl lg:text-7xl">
              Think with clarity.
            </span>
          </h1>
          <p className="mt-6 text-base sm:text-lg text-gray-600 max-w-2xl mx-auto leading-relaxed">
            Your private, multi-turn AI journal workspace. Engage in guided dialogues, unpack tough decisions, and organize reflections securely stored in Cloud Firestore.
          </p>

          {/* Sign In CTA */}
          <div className="mt-8 flex flex-col sm:flex-row items-center justify-center gap-4">
            <button
              id="google-signin-btn"
              onClick={onSignIn}
              disabled={isLoading}
              className="w-full sm:w-auto inline-flex items-center justify-center gap-3 px-6 py-3.5 rounded-xl font-medium text-sm sm:text-base bg-indigo-600 hover:bg-indigo-700 text-white shadow-sm transition-all transform active:scale-98 disabled:opacity-50 cursor-pointer"
            >
              {isLoading ? (
                <>
                  <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                  <span>Connecting to Google...</span>
                </>
              ) : (
                <>
                  {/* Google G SVG */}
                  <svg className="w-5 h-5" viewBox="0 0 24 24">
                    <path
                      fill="currentColor"
                      d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                    />
                    <path
                      fill="currentColor"
                      d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                    />
                    <path
                      fill="currentColor"
                      d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
                    />
                    <path
                      fill="currentColor"
                      d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
                    />
                  </svg>
                  <span>Sign In with Google</span>
                  <ArrowRight className="w-4 h-4 ml-1" />
                </>
              )}
            </button>
          </div>

          {error && (
            <div className="mt-4 p-3 bg-rose-50 border border-rose-200 rounded-xl text-rose-700 text-xs sm:text-sm max-w-md mx-auto">
              {error}
            </div>
          )}
        </div>

        {/* Interactive Preview Studio */}
        <div className="mt-14 max-w-4xl mx-auto bg-white border border-gray-200 rounded-2xl p-4 sm:p-6 shadow-sm">
          <div className="flex flex-wrap items-center justify-between gap-3 border-b border-gray-200 pb-4">
            <div className="flex items-center gap-2">
              <span className="w-3 h-3 rounded-full bg-rose-400"></span>
              <span className="w-3 h-3 rounded-full bg-amber-400"></span>
              <span className="w-3 h-3 rounded-full bg-emerald-400"></span>
              <span className="ml-2 text-xs font-mono text-gray-500">Interactive Journal Preview</span>
            </div>

            <div className="flex items-center gap-1 bg-gray-100 p-1 rounded-lg border border-gray-200 text-xs">
              <button
                onClick={() => setActiveTab('reflection')}
                className={`px-3 py-1 rounded-md transition-all cursor-pointer ${
                  activeTab === 'reflection' ? 'bg-white text-gray-900 font-medium shadow-xs' : 'text-gray-600 hover:text-gray-900'
                }`}
              >
                Reflection
              </button>
              <button
                onClick={() => setActiveTab('brainstorm')}
                className={`px-3 py-1 rounded-md transition-all cursor-pointer ${
                  activeTab === 'brainstorm' ? 'bg-white text-gray-900 font-medium shadow-xs' : 'text-gray-600 hover:text-gray-900'
                }`}
              >
                Brainstorm
              </button>
              <button
                onClick={() => setActiveTab('summary')}
                className={`px-3 py-1 rounded-md transition-all cursor-pointer ${
                  activeTab === 'summary' ? 'bg-white text-gray-900 font-medium shadow-xs' : 'text-gray-600 hover:text-gray-900'
                }`}
              >
                Summary
              </button>
            </div>
          </div>

          {/* Conversation Preview Body */}
          <div className="mt-6 space-y-4 font-sans">
            {/* User prompt preview */}
            <div className="flex gap-3 items-start justify-end">
              <div className="max-w-xl bg-gray-100 text-gray-900 rounded-2xl rounded-tr-sm p-4 border border-gray-200 text-sm leading-relaxed">
                <p className="text-xs text-indigo-600 font-medium mb-1">Your Journal Entry</p>
                <p>{sampleConversations[activeTab].prompt}</p>
              </div>
            </div>

            {/* Gemini response preview */}
            <div className="flex gap-3 items-start">
              <div className="w-8 h-8 rounded-lg bg-indigo-50 border border-indigo-100 flex items-center justify-center text-indigo-600 shrink-0 mt-1">
                <Sparkles className="w-4 h-4" />
              </div>
              <div className="max-w-xl bg-[#FAFAFA] text-gray-800 rounded-2xl rounded-tl-sm p-4 border border-gray-200 text-sm leading-relaxed">
                <div className="flex items-center gap-2 mb-1.5">
                  <span className="text-xs font-medium text-indigo-600">Gemini 3.6 Flash</span>
                  <span className="text-[10px] text-gray-400">• Server-Side Isolated Execution</span>
                </div>
                <div className="whitespace-pre-line text-gray-700 font-normal">
                  {sampleConversations[activeTab].response}
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Security & Core Guarantees Grid */}
        <div className="mt-16 grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="p-5 rounded-xl bg-white border border-gray-200 shadow-xs">
            <div className="w-9 h-9 rounded-lg bg-indigo-50 flex items-center justify-center text-indigo-600 mb-3.5">
              <Lock className="w-5 h-5" />
            </div>
            <h3 className="font-semibold text-gray-900 text-sm mb-1">Strict User Isolation</h3>
            <p className="text-xs text-gray-500 leading-relaxed">
              Documents are stored under <code className="text-indigo-600 font-mono">/users/{'{uid}'}/reflections</code>. Firestore Security Rules prevent other users from reading your entries.
            </p>
          </div>

          <div className="p-5 rounded-xl bg-white border border-gray-200 shadow-xs">
            <div className="w-9 h-9 rounded-lg bg-indigo-50 flex items-center justify-center text-indigo-600 mb-3.5">
              <Shield className="w-5 h-5" />
            </div>
            <h3 className="font-semibold text-gray-900 text-sm mb-1">Server-Side Secret Protection</h3>
            <p className="text-xs text-gray-500 leading-relaxed">
              Your <code className="text-indigo-600 font-mono">GEMINI_API_KEY</code> is never sent to or exposed in client browsers, guarded by Express backend proxy endpoints.
            </p>
          </div>

          <div className="p-5 rounded-xl bg-white border border-gray-200 shadow-xs">
            <div className="w-9 h-9 rounded-lg bg-indigo-50 flex items-center justify-center text-indigo-600 mb-3.5">
              <Brain className="w-5 h-5" />
            </div>
            <h3 className="font-semibold text-gray-900 text-sm mb-1">Resilient Multi-Turn AI</h3>
            <p className="text-xs text-gray-500 leading-relaxed">
              Equipped with automated fallback ladders across Gemini tiers (<code className="text-indigo-600 font-mono">3.6-flash</code>, <code className="text-indigo-600 font-mono">3.1-flash-lite</code>, <code className="text-indigo-600 font-mono">3.7-flash</code>).
            </p>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="border-t border-gray-200 py-6 text-center text-xs text-gray-500 bg-white">
        <p>ReflectAI • Authenticated with Firebase & Cloud Firestore • Protected Cloud Environment</p>
      </footer>
    </div>
  );
};
