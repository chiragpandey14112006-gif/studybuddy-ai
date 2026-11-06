import React from 'react';
import { 
  BookOpen, 
  Flame, 
  Settings, 
  FileText, 
  BarChart3, 
  Coffee, 
  Sparkles, 
  Cloud, 
  HardDrive,
  User,
  GraduationCap
} from 'lucide-react';
import { loginWithGoogle, logoutUser } from '../services/firebaseService';

export function Navbar({ 
  activeTab, 
  setActiveTab, 
  streak, 
  onOpenSettings, 
  onOpenSampleNotes, 
  isQuizActive,
  apiMode, 
  storageMode, 
  user
}) {
  const handleGoogleAuth = async () => {
    if (user && !user.isLocalOnly && !user.isAnonymous) {
      await logoutUser();
    } else {
      await loginWithGoogle();
    }
  };

  return (
    <header className="sticky top-0 z-40 bg-[#FAF8F5]/90 backdrop-blur-md border-b border-[#E8E3DD]">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          
          {/* Brand: Aesthetic College Student Desk Header */}
          <div className="flex items-center space-x-3 cursor-pointer" onClick={() => setActiveTab('upload')}>
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-amber-100 via-orange-50 to-indigo-100 border border-[#E8E3DD] flex items-center justify-center shadow-sm">
              <GraduationCap className="w-5 h-5 text-indigo-600" />
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <span className="font-extrabold text-lg tracking-tight text-slate-800 font-sans">
                  StudyBuddy<span className="text-indigo-600 font-serif italic text-base ml-0.5">.ai</span>
                </span>
                <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-amber-50 border border-amber-200 text-amber-800 font-medium">
                  ☕ dorm desk
                </span>
              </div>
              <p className="text-[11px] text-slate-500 hidden sm:block font-serif italic">
                note-to-quiz generator & midterm score tracker
              </p>
            </div>
          </div>

          {/* Navigation Tabs (Notebook feel) */}
          <nav className="hidden md:flex items-center space-x-1 bg-white p-1 rounded-xl border border-[#E8E3DD] shadow-sm">
            <button
              onClick={() => setActiveTab('upload')}
              className={`flex items-center space-x-2 px-3.5 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                activeTab === 'upload'
                  ? 'bg-indigo-50 text-indigo-700 border border-indigo-200/80 shadow-xs'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-stone-50'
              }`}
            >
              <FileText className="w-3.5 h-3.5" />
              <span>Study Notes</span>
            </button>

            {isQuizActive && (
              <button
                onClick={() => setActiveTab('quiz')}
                className={`flex items-center space-x-2 px-3.5 py-1.5 rounded-lg text-xs font-semibold transition-all animate-pulse ${
                  activeTab === 'quiz'
                    ? 'bg-emerald-50 text-emerald-700 border border-emerald-300'
                    : 'text-emerald-700 hover:bg-emerald-50'
                }`}
              >
                <Sparkles className="w-3.5 h-3.5" />
                <span>Active Quiz</span>
              </button>
            )}

            <button
              onClick={() => setActiveTab('dashboard')}
              className={`flex items-center space-x-2 px-3.5 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                activeTab === 'dashboard'
                  ? 'bg-indigo-50 text-indigo-700 border border-indigo-200/80 shadow-xs'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-stone-50'
              }`}
            >
              <BarChart3 className="w-3.5 h-3.5" />
              <span>Score Tracker</span>
            </button>
          </nav>

          {/* Right Action Tools: Streak, Sample Notes, Status, Settings */}
          <div className="flex items-center space-x-2">
            
            {/* Quick Sample Notes */}
            <button
              onClick={onOpenSampleNotes}
              className="hidden lg:flex items-center space-x-1.5 px-3 py-1.5 rounded-xl text-xs font-medium bg-white border border-[#E8E3DD] text-slate-700 hover:border-indigo-300 hover:text-indigo-600 shadow-sm transition-all"
              title="Load pre-made lecture notes"
            >
              <BookOpen className="w-3.5 h-3.5 text-indigo-500" />
              <span>Class Notes</span>
            </button>

            {/* Student Streak Counter */}
            <div 
              className="flex items-center space-x-1.5 px-3 py-1.5 rounded-xl bg-orange-50 border border-orange-200/80 text-orange-800 text-xs font-semibold shadow-xs"
              title={`${streak}-day study streak! Keep studying daily.`}
            >
              <Flame className="w-4 h-4 text-orange-500 fill-orange-500 animate-bounce" />
              <span>{streak}d streak</span>
            </div>

            {/* Mode Badge */}
            <div 
              className={`hidden sm:flex items-center space-x-1 px-2.5 py-1 rounded-lg text-[11px] font-mono border ${
                apiMode === 'live' 
                  ? 'bg-indigo-50/80 border-indigo-200 text-indigo-700' 
                  : 'bg-emerald-50/80 border-emerald-200 text-emerald-800'
              }`}
              title={apiMode === 'live' ? 'Connected to OpenAI GPT-4 API' : 'Using Local Deterministic Offline Fallback'}
            >
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
              <span>{apiMode === 'live' ? 'GPT-4' : 'Offline'}</span>
            </div>

            {/* User Profile / Auth Action */}
            <button
              onClick={handleGoogleAuth}
              className="flex items-center space-x-1.5 px-2.5 py-1.5 rounded-xl text-xs font-medium bg-white border border-[#E8E3DD] text-slate-700 hover:text-slate-900 hover:border-slate-300 shadow-sm transition-all"
              title={user && !user.isLocalOnly ? `Signed in as ${user.displayName || user.email}` : 'Sign in with Google'}
            >
              <User className="w-3.5 h-3.5 text-slate-500" />
              <span className="max-w-[80px] truncate hidden sm:inline">
                {user ? (user.displayName?.split(' ')[0] || 'Student') : 'Guest'}
              </span>
            </button>

            {/* Settings Trigger */}
            <button
              onClick={onOpenSettings}
              className="p-2 rounded-xl bg-white border border-[#E8E3DD] text-slate-600 hover:text-indigo-600 hover:border-indigo-300 shadow-sm transition-all"
              aria-label="Settings"
              title="Settings & API Keys"
            >
              <Settings className="w-4 h-4" />
            </button>

          </div>

        </div>
      </div>
    </header>
  );
}
