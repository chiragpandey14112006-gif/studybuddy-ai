import React, { useState, useEffect, useCallback } from 'react';
import { Navbar } from './components/Navbar';
import { NoteUploader } from './components/NoteUploader';
import { QuizRunner } from './components/QuizRunner';
import { ScoreDashboard } from './components/ScoreDashboard';
import { AttemptReviewModal } from './components/AttemptReviewModal';
import { SettingsDrawer } from './components/SettingsDrawer';
import { SampleNotesModal } from './components/SampleNotesModal';

import { storageService } from './services/storageService';
import { generateQuizFromNotes } from './services/openaiService';
import { onAuthChange, syncQuizAttempt, fetchAttempts, getFirebaseStatus } from './services/firebaseService';

export default function App() {
  const [activeTab, setActiveTab] = useState('upload'); // 'upload' | 'quiz' | 'dashboard'
  const [currentQuiz, setCurrentQuiz] = useState(null);
  const [isGenerating, setIsGenerating] = useState(false);
  
  // Initialize attempts immediately from localStorage so score tracker is never blank
  const [attempts, setAttempts] = useState(() => storageService.getAttempts());
  const [analytics, setAnalytics] = useState(() => storageService.getAnalyticsSummary());
  const [user, setUser] = useState(null);

  // Modals & Drawers
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [isSampleNotesOpen, setIsSampleNotesOpen] = useState(false);
  const [reviewingAttempt, setReviewingAttempt] = useState(null);

  // Prefill state for editor
  const [prefilledNotes, setPrefilledNotes] = useState('');
  const [prefilledTopic, setPrefilledTopic] = useState('');

  // Status modes
  const [config, setConfig] = useState(storageService.getConfig());
  const fbStatus = getFirebaseStatus();

  const apiMode = (config.forceOfflineMode || (!config.openaiApiKey && !import.meta.env.VITE_OPENAI_API_KEY)) 
    ? 'offline' 
    : 'live';
  
  const storageMode = fbStatus.isLive ? 'cloud' : 'local';

  // Refresh attempts & analytics
  const refreshHistory = useCallback(async (activeUser) => {
    const loadedAttempts = await fetchAttempts(activeUser);
    setAttempts(loadedAttempts);
    setAnalytics(storageService.getAnalyticsSummary());
  }, []);

  // Initialize Firebase Auth listener and local attempts
  useEffect(() => {
    const unsubscribe = onAuthChange((newUser) => {
      setUser(newUser);
      refreshHistory(newUser);
    });

    return () => {
      if (typeof unsubscribe === 'function') unsubscribe();
    };
  }, [refreshHistory]);

  // Handle Quiz Generation
  const handleGenerateQuiz = async ({ notes, topic, difficulty, questionCount }) => {
    setIsGenerating(true);
    try {
      const generated = await generateQuizFromNotes({
        notes,
        topic,
        difficulty,
        questionCount
      });

      const newQuiz = {
        id: `quiz-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
        topic: generated.topic || topic,
        difficulty: generated.difficulty || difficulty,
        questions: generated.questions || [],
        sourceNotePreview: notes.slice(0, 200)
      };

      storageService.saveQuiz(newQuiz);
      setCurrentQuiz(newQuiz);
      setActiveTab('quiz');
    } catch (err) {
      console.error('Quiz generation failure:', err);
      alert('Quiz generation encountered an issue. Please try again.');
    } finally {
      setIsGenerating(false);
    }
  };

  // Handle Quiz Completion
  const handleFinishQuiz = async (attemptData) => {
    try {
      await syncQuizAttempt(attemptData, user);
      await refreshHistory(user);
    } catch (err) {
      console.error('Failed saving attempt:', err);
    }
  };

  // Handle Retaking a Past Quiz
  const handleRetakeQuiz = (attemptOrQuiz) => {
    if (attemptOrQuiz.questionsPayload && attemptOrQuiz.questionsPayload.length > 0) {
      setCurrentQuiz({
        id: attemptOrQuiz.quizId || `quiz-${Date.now()}`,
        topic: attemptOrQuiz.topic,
        difficulty: attemptOrQuiz.difficulty,
        questions: attemptOrQuiz.questionsPayload
      });
      setActiveTab('quiz');
    } else if (attemptOrQuiz.userAnswers && attemptOrQuiz.userAnswers.length > 0) {
      const reconstructedQuestions = attemptOrQuiz.userAnswers.map((ua, idx) => ({
        id: ua.questionId || `q-${idx}`,
        question: ua.questionText,
        options: ua.options || [
          'Option A',
          'Option B',
          'Option C',
          'Option D'
        ],
        correctIndex: ua.correctOptionIndex,
        explanation: ua.explanation
      }));

      setCurrentQuiz({
        id: attemptOrQuiz.quizId || `quiz-${Date.now()}`,
        topic: attemptOrQuiz.topic,
        difficulty: attemptOrQuiz.difficulty,
        questions: reconstructedQuestions
      });
      setActiveTab('quiz');
    } else {
      setPrefilledTopic(attemptOrQuiz.topic);
      setActiveTab('upload');
    }
  };

  // Handle Loading a Sample Note
  const handleSelectSampleNote = (sample) => {
    setPrefilledNotes(sample.content);
    setPrefilledTopic(sample.topic);
    setActiveTab('upload');
  };

  // Clear History
  const handleClearHistory = () => {
    if (window.confirm('Reset all student attempt history and start fresh?')) {
      storageService.clearAttempts();
      refreshHistory(user);
      setIsSettingsOpen(false);
    }
  };

  // Seed Demo Data for Instant Score Tracker Visuals
  const handleSeedDemoData = () => {
    const seeded = storageService.seedSampleAttempts();
    setAttempts(seeded);
    setAnalytics(storageService.getAnalyticsSummary());
  };

  return (
    <div className="min-h-screen bg-[#FAF8F5] text-slate-900 flex flex-col font-sans">
      
      {/* Top Navigation Bar */}
      <Navbar
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        streak={analytics.currentStreak}
        onOpenSettings={() => setIsSettingsOpen(true)}
        onOpenSampleNotes={() => setIsSampleNotesOpen(true)}
        isQuizActive={Boolean(currentQuiz)}
        apiMode={apiMode}
        storageMode={storageMode}
        user={user}
      />

      {/* Main Workspace Router */}
      <main className="flex-1 pb-16">
        
        {/* TAB 1: Note Ingestion & Generation (Module A & B) */}
        {activeTab === 'upload' && (
          <NoteUploader
            onGenerateQuiz={handleGenerateQuiz}
            isGenerating={isGenerating}
            onLoadSampleNotes={() => setIsSampleNotesOpen(true)}
            prefilledNotes={prefilledNotes}
            prefilledTopic={prefilledTopic}
            analytics={analytics}
            onQuickStartSample={handleSelectSampleNote}
          />
        )}

        {/* TAB 2: Interactive Quiz Runner (Module C) */}
        {activeTab === 'quiz' && (
          currentQuiz ? (
            <QuizRunner
              quiz={currentQuiz}
              onFinishQuiz={handleFinishQuiz}
              onExitQuiz={() => setActiveTab('dashboard')}
            />
          ) : (
            <div className="max-w-md mx-auto text-center py-20 px-4 bg-white border border-[#E8E3DD] rounded-3xl mt-12 shadow-sm">
              <div className="text-3xl mb-2">📚</div>
              <h2 className="text-lg font-bold text-slate-900">No active quiz in session</h2>
              <p className="text-xs text-slate-500 mt-1 mb-6">Drop your lecture notes or syllabus PDF to generate a new quiz.</p>
              <button
                onClick={() => setActiveTab('upload')}
                className="px-5 py-2.5 rounded-xl bg-indigo-600 text-white text-xs font-bold hover:bg-indigo-700 shadow-sm"
              >
                Go to Lecture Notes Notebook
              </button>
            </div>
          )
        )}

        {/* TAB 3: Longitudinal Score Dashboard (Module D) */}
        {activeTab === 'dashboard' && (
          <ScoreDashboard
            attempts={attempts}
            analytics={analytics}
            onReviewAttempt={(att) => setReviewingAttempt(att)}
            onRetakeQuiz={handleRetakeQuiz}
            onStartNewQuiz={() => setActiveTab('upload')}
            onSeedDemoData={handleSeedDemoData}
            onClearHistory={handleClearHistory}
          />
        )}

      </main>

      {/* College Desk Aesthetic Footer */}
      <footer className="border-t border-[#E8E3DD] py-6 text-center text-xs text-slate-500 bg-white/70">
        <div className="max-w-7xl mx-auto px-4 flex flex-col sm:flex-row items-center justify-between gap-2">
          <div className="flex items-center space-x-1.5 font-medium text-slate-700">
            <span>StudyBuddy AI</span>
            <span>•</span>
            <span className="font-serif italic text-slate-500">made by a college student for midterms & exams ☕</span>
          </div>
          <div className="flex items-center space-x-3 text-[11px] font-mono">
            <span className="text-indigo-600 font-bold">.PDF & .MD Ingestion</span>
            <span>•</span>
            <span className="text-emerald-700 font-bold">PDF / TXT Reports</span>
            <span>•</span>
            <span className="text-purple-600 font-bold">Gamified Levels & XP</span>
          </div>
        </div>
      </footer>

      {/* Modals & Drawers */}
      <SettingsDrawer
        isOpen={isSettingsOpen}
        onClose={() => setIsSettingsOpen(false)}
        onConfigUpdated={(newCfg) => setConfig(newCfg)}
        onClearHistory={handleClearHistory}
      />

      <SampleNotesModal
        isOpen={isSampleNotesOpen}
        onClose={() => setIsSampleNotesOpen(false)}
        onSelectSample={handleSelectSampleNote}
      />

      <AttemptReviewModal
        attempt={reviewingAttempt}
        onClose={() => setReviewingAttempt(null)}
        onRetake={handleRetakeQuiz}
      />

    </div>
  );
}
